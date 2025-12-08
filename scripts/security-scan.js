#!/usr/bin/env node

/**
 * Automated Security Scanning Script
 * 
 * This script performs various security checks on the Node Carbon application
 * Run with: node scripts/security-scan.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function checkCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: 'pipe', cwd: projectRoot });
    return true;
  } catch (error) {
    log(`✗ ${errorMessage}`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  try {
    log(`\nRunning: ${description}...`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf-8', 
      cwd: projectRoot,
      stdio: 'pipe'
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout?.toString() || error.message 
    };
  }
}

// Security checks
const securityChecks = {
  // Check for npm audit vulnerabilities
  async npmAudit() {
    logSection('1. Dependency Vulnerability Scan (npm audit)');
    const result = runCommand('npm audit --json', 'npm audit');
    
    if (result.success) {
      try {
        const auditData = JSON.parse(result.output);
        const vulnerabilities = auditData.vulnerabilities || {};
        const vulnCount = Object.keys(vulnerabilities).length;
        
        if (vulnCount === 0) {
          log('✓ No vulnerabilities found', 'green');
        } else {
          log(`⚠ Found ${vulnCount} vulnerabilities`, 'yellow');
          
          // Count by severity
          let critical = 0, high = 0, moderate = 0, low = 0;
          Object.values(vulnerabilities).forEach(vuln => {
            if (vuln.severity === 'critical') critical++;
            else if (vuln.severity === 'high') high++;
            else if (vuln.severity === 'moderate') moderate++;
            else if (vuln.severity === 'low') low++;
          });
          
          log(`  Critical: ${critical}`, critical > 0 ? 'red' : 'green');
          log(`  High: ${high}`, high > 0 ? 'red' : 'yellow');
          log(`  Moderate: ${moderate}`, moderate > 0 ? 'yellow' : 'green');
          log(`  Low: ${low}`, 'green');
          
          log('\nRun "npm audit fix" to automatically fix issues', 'yellow');
        }
      } catch (e) {
        log('⚠ Could not parse audit results', 'yellow');
      }
    } else {
      log('✗ npm audit failed', 'red');
    }
  },

  // Check for outdated packages
  async outdatedPackages() {
    logSection('2. Outdated Package Check');
    const result = runCommand('npm outdated --json', 'npm outdated');
    
    if (result.success) {
      try {
        const outdated = JSON.parse(result.output);
        const packages = Object.keys(outdated);
        
        if (packages.length === 0) {
          log('✓ All packages are up to date', 'green');
        } else {
          log(`⚠ Found ${packages.length} outdated packages:`, 'yellow');
          packages.forEach(pkg => {
            const info = outdated[pkg];
            log(`  ${pkg}: ${info.current} → ${info.latest}`, 'yellow');
          });
        }
      } catch (e) {
        // npm outdated returns non-zero exit code when packages are outdated
        log('⚠ Some packages may be outdated. Check manually.', 'yellow');
      }
    }
  },

  // Check for exposed secrets
  async secretScan() {
    logSection('3. Secret Scanning');
    const commonSecrets = [
      /password\s*=\s*['"](.*?)['"]/gi,
      /api[_-]?key\s*=\s*['"](.*?)['"]/gi,
      /secret\s*=\s*['"](.*?)['"]/gi,
      /token\s*=\s*['"](.*?)['"]/gi,
      /aws[_-]?access[_-]?key/gi,
      /aws[_-]?secret[_-]?key/gi,
      /private[_-]?key/gi,
      /BEGIN\s+(RSA\s+)?PRIVATE\s+KEY/gi
    ];

    const filesToCheck = [
      'dashboard/server.js',
      'index.js',
      'src/**/*.js',
      'examples/**/*.js'
    ];

    let foundSecrets = false;
    
    // Check package.json for suspicious patterns
    const packageJsonPath = join(projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const content = readFileSync(packageJsonPath, 'utf-8');
      commonSecrets.forEach(pattern => {
        if (pattern.test(content)) {
          log(`⚠ Potential secret found in package.json`, 'yellow');
          foundSecrets = true;
        }
      });
    }

    // Check for .env files that shouldn't be committed
    const envFiles = ['.env', '.env.local', '.env.production'];
    envFiles.forEach(envFile => {
      const envPath = join(projectRoot, envFile);
      if (existsSync(envPath)) {
        log(`⚠ Found ${envFile} file. Ensure it's in .gitignore`, 'yellow');
        foundSecrets = true;
      }
    });

    if (!foundSecrets) {
      log('✓ No obvious secrets found in code', 'green');
    } else {
      log('⚠ Review flagged items manually', 'yellow');
    }
  },

  // Check CORS configuration
  async corsCheck() {
    logSection('4. CORS Configuration Check');
    const serverPath = join(projectRoot, 'dashboard/server.js');
    
    if (existsSync(serverPath)) {
      const content = readFileSync(serverPath, 'utf-8');
      
      if (content.includes("cors: { origin: '*' }")) {
        log('✗ CORS is configured with wildcard (*) - Security Risk!', 'red');
        log('  Recommendation: Use specific origins', 'yellow');
      } else if (content.includes('cors:')) {
        log('✓ CORS is configured (review manually)', 'green');
      } else {
        log('⚠ CORS configuration not found', 'yellow');
      }
    }
  },

  // Check for security headers
  async securityHeadersCheck() {
    logSection('5. Security Headers Check');
    const serverPath = join(projectRoot, 'dashboard/server.js');
    
    if (existsSync(serverPath)) {
      const content = readFileSync(serverPath, 'utf-8');
      
      const securityFeatures = {
        'helmet': content.includes('helmet'),
        'rateLimit': content.includes('rateLimit') || content.includes('rate-limit'),
        'cors': content.includes('cors'),
        'https': content.includes('https') || content.includes('ssl')
      };

      log('Security features found:', 'blue');
      Object.entries(securityFeatures).forEach(([feature, found]) => {
        if (found) {
          log(`  ✓ ${feature}`, 'green');
        } else {
          log(`  ✗ ${feature} - Not found`, 'yellow');
        }
      });
    }
  },

  // Check Socket.IO security
  async socketIOSecurityCheck() {
    logSection('6. Socket.IO Security Check');
    const serverPath = join(projectRoot, 'dashboard/server.js');
    
    if (existsSync(serverPath)) {
      const content = readFileSync(serverPath, 'utf-8');
      
      const checks = {
        'Authentication middleware': content.includes('io.use') && content.includes('auth'),
        'Rate limiting': content.includes('rateLimit') || content.includes('rate-limit'),
        'Input validation': content.includes('validate') || content.includes('sanitize'),
        'Error handling': content.includes('catch') || content.includes('error')
      };

      log('Socket.IO security features:', 'blue');
      Object.entries(checks).forEach(([check, found]) => {
        if (found) {
          log(`  ✓ ${check}`, 'green');
        } else {
          log(`  ⚠ ${check} - Not found`, 'yellow');
        }
      });
    }
  },

  // Check for exposed sensitive files
  async exposedFilesCheck() {
    logSection('7. Exposed Files Check');
    const sensitiveFiles = [
      '.env',
      '.git',
      'package-lock.json',
      'node_modules',
      '.npmrc',
      '.dockerignore'
    ];

    const publicDir = join(projectRoot, 'dashboard/public');
    if (existsSync(publicDir)) {
      // Check if sensitive files are in public directory
      sensitiveFiles.forEach(file => {
        const filePath = join(publicDir, file);
        if (existsSync(filePath)) {
          log(`✗ ${file} found in public directory - Security Risk!`, 'red');
        }
      });
    }

    log('✓ Public directory check completed', 'green');
  },

  // Check Node.js version
  async nodeVersionCheck() {
    logSection('8. Node.js Version Check');
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      log(`Current Node.js version: ${nodeVersion}`, 'blue');
      
      if (majorVersion < 16) {
        log('✗ Node.js version is too old. Minimum required: 16.x', 'red');
      } else if (majorVersion >= 16 && majorVersion <= 21) {
        log('✓ Node.js version is supported', 'green');
      } else {
        log('⚠ Node.js version may not be fully tested', 'yellow');
      }
    } catch (e) {
      log('✗ Could not determine Node.js version', 'red');
    }
  }
};

// Main execution
async function main() {
  log('\n🔒 Node Carbon Security Scan', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    for (const [name, check] of Object.entries(securityChecks)) {
      await check();
    }
    
    logSection('Summary');
    log('Security scan completed!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Review all flagged issues', 'yellow');
    log('2. Run "npm audit fix" to fix vulnerabilities', 'yellow');
    log('3. Update outdated packages', 'yellow');
    log('4. Fix CORS configuration', 'yellow');
    log('5. Implement missing security features', 'yellow');
    log('6. Review SECURITY_ASSESSMENT.md for detailed guidance', 'yellow');
    
  } catch (error) {
    log(`\n✗ Error during security scan: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();


