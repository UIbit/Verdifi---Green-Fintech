/**
 * Security Monitor Module
 * Monitors security events and provides real-time security metrics
 * This module adds cybersecurity capabilities to the Verdifi platform
 */

class SecurityMonitor {
  constructor() {
    this.securityEvents = [];
    this.threatLevel = 'low';
    this.connectionAttempts = new Map();
    this.suspiciousActivity = [];
    this.startTime = Date.now();
    this.maxEvents = 1000;
  }

  /**
   * Log a security event
   * @param {string} type - Type of security event
   * @param {string} severity - low, medium, high, critical
   * @param {object} details - Event details
   */
  logEvent(type, severity, details = {}) {
    const event = {
      id: this.securityEvents.length + 1,
      timestamp: Date.now(),
      type,
      severity,
      details,
      threatLevel: this.calculateThreatLevel(severity)
    };

    this.securityEvents.push(event);
    
    // Keep only recent events
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents.shift();
    }

    // Update overall threat level
    this.updateThreatLevel();

    return event;
  }

  /**
   * Monitor connection attempt
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent string
   */
  monitorConnection(ip, userAgent) {
    const key = `${ip}_${Date.now()}`;
    const attempts = this.connectionAttempts.get(ip) || 0;
    
    this.connectionAttempts.set(ip, attempts + 1);

    // Detect suspicious patterns
    if (attempts > 10) {
      this.logEvent('suspicious_connection', 'high', {
        ip,
        attempts: attempts + 1,
        userAgent
      });
      this.suspiciousActivity.push({
        type: 'rate_limit_exceeded',
        ip,
        timestamp: Date.now()
      });
    }

    // Log normal connection
    if (attempts === 1) {
      this.logEvent('connection', 'low', { ip, userAgent });
    }
  }

  /**
   * Monitor API request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} statusCode - Response status code
   */
  monitorAPIRequest(endpoint, method, statusCode) {
    // Detect potential attacks
    if (statusCode === 401 || statusCode === 403) {
      this.logEvent('unauthorized_access_attempt', 'medium', {
        endpoint,
        method,
        statusCode
      });
    }

    if (statusCode >= 500) {
      this.logEvent('server_error', 'medium', {
        endpoint,
        method,
        statusCode
      });
    }

    // Detect SQL injection patterns (basic)
    if (endpoint.includes("'") || endpoint.includes('--') || endpoint.includes(';')) {
      this.logEvent('potential_sql_injection', 'high', {
        endpoint,
        method
      });
    }

    // Detect XSS patterns (basic)
    if (endpoint.includes('<script>') || endpoint.includes('javascript:')) {
      this.logEvent('potential_xss', 'high', {
        endpoint,
        method
      });
    }
  }

  /**
   * Calculate threat level based on severity
   * @param {string} severity - Event severity
   * @returns {string} Threat level
   */
  calculateThreatLevel(severity) {
    const levels = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };
    return levels[severity] || 1;
  }

  /**
   * Update overall threat level
   */
  updateThreatLevel() {
    const recentEvents = this.securityEvents.slice(-50);
    const highSeverityCount = recentEvents.filter(e => 
      e.severity === 'high' || e.severity === 'critical'
    ).length;

    if (highSeverityCount > 5) {
      this.threatLevel = 'critical';
    } else if (highSeverityCount > 2) {
      this.threatLevel = 'high';
    } else if (highSeverityCount > 0) {
      this.threatLevel = 'medium';
    } else {
      this.threatLevel = 'low';
    }
  }

  /**
   * Get security statistics
   * @returns {object} Security stats
   */
  getSecurityStats() {
    const recentEvents = this.securityEvents.slice(-100);
    const stats = {
      totalEvents: this.securityEvents.length,
      recentEvents: recentEvents.length,
      threatLevel: this.threatLevel,
      eventsBySeverity: {
        low: recentEvents.filter(e => e.severity === 'low').length,
        medium: recentEvents.filter(e => e.severity === 'medium').length,
        high: recentEvents.filter(e => e.severity === 'high').length,
        critical: recentEvents.filter(e => e.severity === 'critical').length
      },
      eventsByType: {},
      suspiciousActivity: this.suspiciousActivity.length,
      uniqueIPs: this.connectionAttempts.size,
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };

    // Count events by type
    recentEvents.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get recent security events
   * @param {number} limit - Number of events to return
   * @returns {array} Recent events
   */
  getRecentEvents(limit = 10) {
    return this.securityEvents.slice(-limit).reverse();
  }

  /**
   * Get security health score (0-100)
   * @returns {number} Security health score
   */
  getSecurityHealthScore() {
    const stats = this.getSecurityStats();
    let score = 100;

    // Deduct points for high severity events
    score -= stats.eventsBySeverity.high * 5;
    score -= stats.eventsBySeverity.critical * 10;
    score -= stats.suspiciousActivity * 3;

    return Math.max(0, Math.min(100, score));
  }
}

export default SecurityMonitor;

