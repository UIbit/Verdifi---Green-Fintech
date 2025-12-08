# Security Hardening Guide

This guide provides step-by-step instructions to harden the Node Carbon application for cloud deployment.

## Quick Start

1. **Run security scan**: `npm run security-scan`
2. **Fix vulnerabilities**: `npm audit fix`
3. **Review checklist**: See `SECURITY_CHECKLIST.md`
4. **Deploy**: Follow cloud-specific instructions below

## Step 1: Fix CORS Configuration

The CORS wildcard has been fixed in `dashboard/server.js`. Configure allowed origins via environment variable:

```bash
# Production
export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Development
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

## Step 2: Install Security Dependencies

Add security middleware packages:

```bash
npm install express-rate-limit helmet
npm install --save-dev eslint-plugin-security
```

## Step 3: Implement Security Middleware

Update `dashboard/server.js` to include security middleware:

```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.socket.io", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "ws:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/health', limiter);
```

## Step 4: Add Socket.IO Authentication (Optional but Recommended)

If you need authentication, add middleware:

```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  // Verify token (implement your verification logic)
  try {
    const isValid = await verifyToken(token); // Implement this function
    if (isValid) {
      socket.userId = extractUserId(token); // Extract user info
      next();
    } else {
      next(new Error('Authentication error: Invalid token'));
    }
  } catch (error) {
    next(new Error('Authentication error: Token verification failed'));
  }
});
```

## Step 5: Environment Variables

Create `.env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security
SESSION_SECRET=your-secret-key-here-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

**Important**: Never commit `.env` files. Add to `.gitignore`.

## Step 6: Error Handling

Update error handling to prevent information disclosure:

```javascript
// Add after all routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'Internal server error',
      message: 'An error occurred processing your request'
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

## Step 7: Input Validation

Add input validation for Socket.IO events:

```javascript
socket.on('start', () => {
  // Add validation if needed
  if (loopActive) {
    return socket.emit('error', { message: 'Measurement already running' });
  }
  startLoop();
});

socket.on('stop', () => {
  // Add validation if needed
  isClosed = true;
});
```

## Step 8: Logging and Monitoring

Implement structured logging:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Log security events
io.on('connection', (socket) => {
  logger.info('Socket connection', { 
    ip: socket.handshake.address,
    timestamp: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    logger.info('Socket disconnect', { 
      ip: socket.handshake.address,
      timestamp: new Date().toISOString()
    });
  });
});
```

## Step 9: Cloud-Specific Hardening

### AWS Deployment

1. **Security Groups**:
   - Only allow HTTPS (443) from internet
   - Allow HTTP (80) only for redirect to HTTPS
   - Restrict SSH (22) to your IP only

2. **IAM Roles**:
   - Use IAM roles instead of access keys
   - Apply least privilege principle
   - Enable MFA for admin accounts

3. **Secrets Management**:
   ```bash
   # Store secrets in AWS Secrets Manager
   aws secretsmanager create-secret \
     --name node-carbon/production \
     --secret-string file://secrets.json
   ```

4. **CloudWatch**:
   - Enable CloudWatch logging
   - Set up alarms for errors
   - Configure log retention

### Azure Deployment

1. **App Service Configuration**:
   - Enable "HTTPS Only"
   - Configure authentication/authorization
   - Set IP restrictions

2. **Key Vault**:
   ```bash
   # Store secrets in Azure Key Vault
   az keyvault secret set \
     --vault-name your-keyvault \
     --name "ALLOWED-ORIGINS" \
     --value "https://yourdomain.com"
   ```

3. **Application Insights**:
   - Enable Application Insights
   - Configure alerts
   - Set up custom metrics

### Google Cloud Deployment

1. **Cloud Run/App Engine**:
   - Use Secret Manager for secrets
   - Configure IAM properly
   - Enable Cloud Armor (if using Load Balancer)

2. **Secret Manager**:
   ```bash
   # Store secrets
   echo -n "your-secret-value" | gcloud secrets create ALLOWED_ORIGINS --data-file=-
   ```

## Step 10: SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using Cloud Provider SSL

- **AWS**: Use ACM (AWS Certificate Manager)
- **Azure**: Use App Service Certificates
- **GCP**: Use Google-managed SSL certificates

## Step 11: Regular Security Maintenance

### Weekly Tasks
- Run `npm audit`
- Review security logs
- Check for dependency updates

### Monthly Tasks
- Update dependencies
- Review and rotate secrets
- Perform security scans
- Review access logs

### Quarterly Tasks
- Full penetration testing
- Security audit
- Review and update security policies
- Team security training

## Step 12: Incident Response Plan

1. **Detection**: Monitor logs and alerts
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threat
4. **Recovery**: Restore services
5. **Lessons Learned**: Document and improve

## Testing Your Hardening

After implementing these changes:

```bash
# Run security scan
npm run security-scan

# Run penetration test
npm run pen-test https://your-app-url.com

# Check SSL
curl -I https://your-app-url.com

# Test rate limiting
for i in {1..110}; do curl https://your-app-url.com/health; done
```

## Additional Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Express Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html

---

**Remember**: Security is an ongoing process, not a one-time task. Regularly review and update your security measures.


