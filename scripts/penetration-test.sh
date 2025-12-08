#!/bin/bash

# Penetration Testing Script for Node Carbon Application
# This script performs basic penetration testing checks
# Usage: ./scripts/penetration-test.sh <target-url>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

TARGET_URL="${1:-http://localhost:3000}"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Node Carbon Penetration Testing${NC}"
echo -e "${CYAN}Target: ${TARGET_URL}${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${YELLOW}⚠ Warning: $1 is not installed. Some tests will be skipped.${NC}"
        return 1
    fi
    return 0
}

# Test 1: Basic connectivity
echo -e "${BLUE}[1/10] Testing basic connectivity...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Server is responding${NC}"
else
    echo -e "${RED}✗ Server is not responding${NC}"
    exit 1
fi

# Test 2: Health endpoint
echo -e "${BLUE}[2/10] Testing /health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$TARGET_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok\|status"; then
    echo -e "${GREEN}✓ Health endpoint is accessible${NC}"
    echo -e "${YELLOW}  Response: $HEALTH_RESPONSE${NC}"
else
    echo -e "${YELLOW}⚠ Health endpoint may not be configured${NC}"
fi

# Test 3: SSL/TLS check (if HTTPS)
if [[ "$TARGET_URL" == https://* ]]; then
    echo -e "${BLUE}[3/10] Testing SSL/TLS configuration...${NC}"
    if check_tool "openssl"; then
        DOMAIN=$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
        SSL_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ SSL certificate is valid${NC}"
            echo -e "${YELLOW}  Certificate info:${NC}"
            echo "$SSL_INFO" | sed 's/^/    /'
        else
            echo -e "${RED}✗ SSL certificate check failed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}[3/10] Skipping SSL test (HTTP only)${NC}"
fi

# Test 4: Security headers check
echo -e "${BLUE}[4/10] Testing security headers...${NC}"
HEADERS=$(curl -s -I "$TARGET_URL")
MISSING_HEADERS=()

if ! echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    MISSING_HEADERS+=("X-Frame-Options")
fi
if ! echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
    MISSING_HEADERS+=("X-Content-Type-Options")
fi
if ! echo "$HEADERS" | grep -qi "X-XSS-Protection"; then
    MISSING_HEADERS+=("X-XSS-Protection")
fi
if ! echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
    MISSING_HEADERS+=("Strict-Transport-Security")
fi
if ! echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
    MISSING_HEADERS+=("Content-Security-Policy")
fi

if [ ${#MISSING_HEADERS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All security headers are present${NC}"
else
    echo -e "${YELLOW}⚠ Missing security headers:${NC}"
    for header in "${MISSING_HEADERS[@]}"; do
        echo -e "${YELLOW}  - $header${NC}"
    fi
fi

# Test 5: CORS check
echo -e "${BLUE}[5/10] Testing CORS configuration...${NC}"
CORS_HEADER=$(curl -s -I -H "Origin: https://evil.com" "$TARGET_URL" | grep -i "access-control-allow-origin")
if echo "$CORS_HEADER" | grep -q "*"; then
    echo -e "${RED}✗ CORS is configured with wildcard (*) - Security Risk!${NC}"
elif [ -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓ CORS header not present (may be configured per-route)${NC}"
else
    echo -e "${GREEN}✓ CORS is configured${NC}"
    echo -e "${YELLOW}  $CORS_HEADER${NC}"
fi

# Test 6: Rate limiting test
echo -e "${BLUE}[6/10] Testing rate limiting...${NC}"
RATE_LIMIT_TEST=0
for i in {1..20}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/health")
    if [ "$HTTP_CODE" == "429" ]; then
        RATE_LIMIT_TEST=1
        break
    fi
done

if [ $RATE_LIMIT_TEST -eq 1 ]; then
    echo -e "${GREEN}✓ Rate limiting is enabled${NC}"
else
    echo -e "${YELLOW}⚠ Rate limiting may not be configured${NC}"
fi

# Test 7: Directory traversal test
echo -e "${BLUE}[7/10] Testing directory traversal protection...${NC}"
TRAVERSAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/../../etc/passwd")
if [ "$TRAVERSAL_TEST" == "403" ] || [ "$TRAVERSAL_TEST" == "404" ]; then
    echo -e "${GREEN}✓ Directory traversal protection appears to be working${NC}"
else
    echo -e "${YELLOW}⚠ Directory traversal test returned: $TRAVERSAL_TEST${NC}"
fi

# Test 8: SQL injection test (basic)
echo -e "${BLUE}[8/10] Testing for SQL injection (basic)...${NC}"
SQL_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/health?id=1' OR '1'='1")
if [ "$SQL_TEST" == "200" ]; then
    echo -e "${YELLOW}⚠ Application may be vulnerable to SQL injection${NC}"
else
    echo -e "${GREEN}✓ Basic SQL injection test passed${NC}"
fi

# Test 9: XSS test (basic)
echo -e "${BLUE}[9/10] Testing for XSS (basic)...${NC}"
XSS_TEST=$(curl -s "$TARGET_URL/health?q=<script>alert('XSS')</script>")
if echo "$XSS_TEST" | grep -q "<script>"; then
    echo -e "${RED}✗ Potential XSS vulnerability detected${NC}"
else
    echo -e "${GREEN}✓ Basic XSS test passed${NC}"
fi

# Test 10: Information disclosure
echo -e "${BLUE}[10/10] Testing for information disclosure...${NC}"
INFO_DISCLOSURE=0
ERROR_RESPONSE=$(curl -s "$TARGET_URL/nonexistent-endpoint-12345")
if echo "$ERROR_RESPONSE" | grep -qi "stack\|trace\|error\|exception\|debug"; then
    echo -e "${YELLOW}⚠ Error messages may disclose sensitive information${NC}"
    INFO_DISCLOSURE=1
fi

if [ $INFO_DISCLOSURE -eq 0 ]; then
    echo -e "${GREEN}✓ No obvious information disclosure detected${NC}"
fi

# Summary
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}Penetration Test Summary${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${BLUE}Target: ${TARGET_URL}${NC}"
echo -e "${BLUE}Date: $(date)${NC}\n"

echo -e "${YELLOW}Note: This is a basic automated test.${NC}"
echo -e "${YELLOW}For comprehensive testing, use professional tools like:${NC}"
echo -e "  - OWASP ZAP"
echo -e "  - Burp Suite"
echo -e "  - Nmap"
echo -e "  - Nikto"
echo -e "\n${CYAN}See SECURITY_ASSESSMENT.md for detailed guidance.${NC}\n"


