# Quick Start: Security Assessment & Penetration Testing

## 🚀 Getting Started in 5 Minutes

### Step 1: Run Automated Security Scan

```bash
npm run security-scan
```

This will check for:
- Dependency vulnerabilities
- Outdated packages
- Security misconfigurations
- Common security issues

### Step 2: Fix Vulnerabilities

```bash
# Fix automatically fixable issues
npm audit fix

# Review remaining issues
npm audit
```

### Step 3: Run Penetration Test

**On Linux/Mac:**
```bash
npm run pen-test http://localhost:3000
```

**On Windows (PowerShell):**
```powershell
bash scripts/penetration-test.sh http://localhost:3000
```

Or if you have Git Bash:
```bash
bash scripts/penetration-test.sh http://localhost:3000
```

### Step 4: Review Security Checklist

Open `SECURITY_CHECKLIST.md` and check off items as you complete them.

### Step 5: Implement Security Hardening

Follow `SECURITY_HARDENING.md` for step-by-step instructions.

## 📋 What You Need

### Required Tools
- Node.js (v16+)
- npm
- curl (for penetration testing)

### Optional Tools (for advanced testing)
- OWASP ZAP
- Burp Suite
- Nmap
- Nikto

## 🔍 What Gets Tested

### Security Scan Checks:
1. ✅ Dependency vulnerabilities (npm audit)
2. ✅ Outdated packages
3. ✅ Secret scanning
4. ✅ CORS configuration
5. ✅ Security headers
6. ✅ Socket.IO security
7. ✅ Exposed files
8. ✅ Node.js version

### Penetration Test Checks:
1. ✅ Server connectivity
2. ✅ Health endpoint
3. ✅ SSL/TLS configuration
4. ✅ Security headers
5. ✅ CORS configuration
6. ✅ Rate limiting
7. ✅ Directory traversal protection
8. ✅ SQL injection (basic)
9. ✅ XSS (basic)
10. ✅ Information disclosure

## 📊 Understanding Results

### Security Scan Output

- **Green ✓**: No issues found
- **Yellow ⚠**: Warning - should be reviewed
- **Red ✗**: Critical issue - must be fixed

### Penetration Test Output

- **Green ✓**: Test passed
- **Yellow ⚠**: Potential issue - review manually
- **Red ✗**: Security vulnerability detected

## 🛠️ Common Issues & Fixes

### Issue: CORS Wildcard
**Fix**: Already fixed in code. Set `ALLOWED_ORIGINS` environment variable:
```bash
export ALLOWED_ORIGINS="https://yourdomain.com"
```

### Issue: Missing Security Headers
**Fix**: Install and configure helmet:
```bash
npm install helmet
```
Then add to `dashboard/server.js`:
```javascript
import helmet from 'helmet';
app.use(helmet());
```

### Issue: No Rate Limiting
**Fix**: Install express-rate-limit:
```bash
npm install express-rate-limit
```

### Issue: Vulnerable Dependencies
**Fix**: 
```bash
npm audit fix
npm update
```

## 📚 Next Steps

1. **Read**: `SECURITY_ASSESSMENT.md` for comprehensive guide
2. **Follow**: `SECURITY_HARDENING.md` for implementation
3. **Check**: `SECURITY_CHECKLIST.md` before deployment
4. **Test**: Run scans regularly (weekly recommended)

## 🆘 Need Help?

- Review `SECURITY_ASSESSMENT.md` for detailed explanations
- Check OWASP Top 10: https://owasp.org/www-project-top-ten/
- Consult your cloud provider's security documentation

## ⚡ Quick Commands Reference

```bash
# Security scan
npm run security-scan

# Dependency audit
npm audit
npm audit fix

# Penetration test (replace URL)
bash scripts/penetration-test.sh https://your-app-url.com

# Check outdated packages
npm outdated

# Update all packages (careful!)
npm update
```

## 🎯 Before Cloud Deployment

Make sure you've completed:

- [ ] Security scan shows no critical issues
- [ ] All dependencies updated
- [ ] CORS configured properly
- [ ] Security headers implemented
- [ ] Rate limiting enabled
- [ ] HTTPS/TLS configured
- [ ] Secrets stored securely
- [ ] Logging and monitoring set up
- [ ] Penetration test passed
- [ ] Security checklist completed

---

**Ready to deploy securely!** 🚀


