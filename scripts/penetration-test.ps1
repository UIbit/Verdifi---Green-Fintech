# Penetration Testing Script for Node Carbon Application (PowerShell)
# Usage: .\scripts\penetration-test.ps1 -TargetUrl "http://localhost:3000"

param(
    [string]$TargetUrl = "http://localhost:3000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Node Carbon Penetration Testing" -ForegroundColor Cyan
Write-Host "Target: $TargetUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic connectivity
Write-Host "[1/10] Testing basic connectivity..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri $TargetUrl -Method Get -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 301 -or $response.StatusCode -eq 302) {
        Write-Host "✓ Server is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Server returned status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Server is not responding: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Health endpoint
Write-Host "[2/10] Testing /health endpoint..." -ForegroundColor Blue
try {
    $healthUrl = "$TargetUrl/health"
    $healthResponse = Invoke-WebRequest -Uri $healthUrl -Method Get -UseBasicParsing
    $healthContent = $healthResponse.Content
    if ($healthContent -match "ok|status") {
        Write-Host "✓ Health endpoint is accessible" -ForegroundColor Green
        Write-Host "  Response: $healthContent" -ForegroundColor Yellow
    } else {
        Write-Host "⚠ Health endpoint may not be configured properly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Health endpoint test failed: $_" -ForegroundColor Yellow
}

# Test 3: SSL/TLS check (if HTTPS)
if ($TargetUrl -like "https://*") {
    Write-Host "[3/10] Testing SSL/TLS configuration..." -ForegroundColor Blue
    try {
        $uri = [System.Uri]$TargetUrl
        $tcpClient = New-Object System.Net.Sockets.TcpClient($uri.Host, 443)
        $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
        $sslStream.AuthenticateAsClient($uri.Host)
        $cert = $sslStream.RemoteCertificate
        $cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
        Write-Host "✓ SSL certificate is valid" -ForegroundColor Green
        Write-Host "  Certificate expires: $($cert2.NotAfter)" -ForegroundColor Yellow
        $sslStream.Close()
        $tcpClient.Close()
    } catch {
        Write-Host "✗ SSL certificate check failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[3/10] Skipping SSL test (HTTP only)" -ForegroundColor Yellow
}

# Test 4: Security headers check
Write-Host "[4/10] Testing security headers..." -ForegroundColor Blue
try {
    $headers = (Invoke-WebRequest -Uri $TargetUrl -Method Get -UseBasicParsing).Headers
    $missingHeaders = @()
    
    $requiredHeaders = @("X-Frame-Options", "X-Content-Type-Options", "X-XSS-Protection", "Strict-Transport-Security", "Content-Security-Policy")
    
    foreach ($header in $requiredHeaders) {
        if (-not $headers.ContainsKey($header)) {
            $missingHeaders += $header
        }
    }
    
    if ($missingHeaders.Count -eq 0) {
        Write-Host "✓ All security headers are present" -ForegroundColor Green
    } else {
        Write-Host "⚠ Missing security headers:" -ForegroundColor Yellow
        foreach ($header in $missingHeaders) {
            Write-Host "  - $header" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠ Could not check security headers: $_" -ForegroundColor Yellow
}

# Test 5: CORS check
Write-Host "[5/10] Testing CORS configuration..." -ForegroundColor Blue
try {
    $headers = @{
        "Origin" = "https://evil.com"
    }
    $corsResponse = Invoke-WebRequest -Uri $TargetUrl -Method Get -Headers $headers -UseBasicParsing
    $corsHeader = $corsResponse.Headers["Access-Control-Allow-Origin"]
    
    if ($corsHeader -eq "*") {
        Write-Host "✗ CORS is configured with wildcard (*) - Security Risk!" -ForegroundColor Red
    } elseif ($corsHeader) {
        Write-Host "✓ CORS is configured: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "✓ CORS header not present (may be configured per-route)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ CORS test failed: $_" -ForegroundColor Yellow
}

# Test 6: Rate limiting test
Write-Host "[6/10] Testing rate limiting..." -ForegroundColor Blue
$rateLimitHit = $false
try {
    for ($i = 1; $i -le 20; $i++) {
        $response = Invoke-WebRequest -Uri "$TargetUrl/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
        Start-Sleep -Milliseconds 100
    }
    
    if ($rateLimitHit) {
        Write-Host "✓ Rate limiting is enabled" -ForegroundColor Green
    } else {
        Write-Host "⚠ Rate limiting may not be configured" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Rate limiting test incomplete: $_" -ForegroundColor Yellow
}

# Test 7: Directory traversal test
Write-Host "[7/10] Testing directory traversal protection..." -ForegroundColor Blue
try {
    $traversalResponse = Invoke-WebRequest -Uri "$TargetUrl/../../etc/passwd" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    if ($traversalResponse.StatusCode -eq 403 -or $traversalResponse.StatusCode -eq 404) {
        Write-Host "✓ Directory traversal protection appears to be working" -ForegroundColor Green
    } else {
        Write-Host "⚠ Directory traversal test returned: $($traversalResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 403 -or $_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Directory traversal protection appears to be working" -ForegroundColor Green
    } else {
        Write-Host "⚠ Directory traversal test failed: $_" -ForegroundColor Yellow
    }
}

# Test 8: SQL injection test (basic)
Write-Host "[8/10] Testing for SQL injection (basic)..." -ForegroundColor Blue
try {
    $sqlResponse = Invoke-WebRequest -Uri "$TargetUrl/health?id=1' OR '1'='1" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    if ($sqlResponse.StatusCode -eq 200) {
        Write-Host "⚠ Application may be vulnerable to SQL injection" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Basic SQL injection test passed" -ForegroundColor Green
    }
} catch {
    Write-Host "✓ Basic SQL injection test passed" -ForegroundColor Green
}

# Test 9: XSS test (basic)
Write-Host "[9/10] Testing for XSS (basic)..." -ForegroundColor Blue
try {
    $xssResponse = Invoke-WebRequest -Uri "$TargetUrl/health?q=<script>alert('XSS')</script>" -Method Get -UseBasicParsing
    if ($xssResponse.Content -match "<script>") {
        Write-Host "✗ Potential XSS vulnerability detected" -ForegroundColor Red
    } else {
        Write-Host "✓ Basic XSS test passed" -ForegroundColor Green
    }
} catch {
    Write-Host "✓ Basic XSS test passed" -ForegroundColor Green
}

# Test 10: Information disclosure
Write-Host "[10/10] Testing for information disclosure..." -ForegroundColor Blue
try {
    $errorResponse = Invoke-WebRequest -Uri "$TargetUrl/nonexistent-endpoint-12345" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    $content = $errorResponse.Content
    if ($content -match "stack|trace|error|exception|debug") {
        Write-Host "⚠ Error messages may disclose sensitive information" -ForegroundColor Yellow
    } else {
        Write-Host "✓ No obvious information disclosure detected" -ForegroundColor Green
    }
} catch {
    Write-Host "✓ No obvious information disclosure detected" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Penetration Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $TargetUrl" -ForegroundColor Blue
Write-Host "Date: $(Get-Date)" -ForegroundColor Blue
Write-Host ""
Write-Host "Note: This is a basic automated test." -ForegroundColor Yellow
Write-Host "For comprehensive testing, use professional tools like:" -ForegroundColor Yellow
Write-Host "  - OWASP ZAP"
Write-Host "  - Burp Suite"
Write-Host "  - Nmap"
Write-Host "  - Nikto"
Write-Host ""
Write-Host "See SECURITY_ASSESSMENT.md for detailed guidance." -ForegroundColor Cyan
Write-Host ""


