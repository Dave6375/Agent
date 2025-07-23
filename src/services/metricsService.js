const logger = require('../utils/logger');

class MetricsService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      tools: {
        total: 0,
        successful: 0,
        failed: 0,
        byTool: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        buckets: {
          fast: 0,    // < 1s
          medium: 0,  // 1-5s
          slow: 0,    // 5-30s
          very_slow: 0 // > 30s
        }
      },
      conversations: {
        total: 0,
        active: 0,
        messagesPerConversation: []
      }
    };

    this.startTime = Date.now();
  }

  recordRequest(endpoint, duration, success = true) {
    this.metrics.requests.total++;

    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track by endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, successful: 0, failed: 0 };
    }

    this.metrics.requests.byEndpoint[endpoint].total++;
    if (success) {
      this.metrics.requests.byEndpoint[endpoint].successful++;
    } else {
      this.metrics.requests.byEndpoint[endpoint].failed++;
    }

    // Record response time
    this.recordResponseTime(duration);

    logger.debug('Request metrics recorded', {
      endpoint,
      duration,
      success,
      totalRequests: this.metrics.requests.total
    });
  }

  recordToolUsage(toolName, duration, success = true) {
    this.metrics.tools.total++;

    if (success) {
      this.metrics.tools.successful++;
    } else {
      this.metrics.tools.failed++;
    }

    // Track by tool
    if (!this.metrics.tools.byTool[toolName]) {
      this.metrics.tools.byTool[toolName] = { total: 0, successful: 0, failed: 0, avgDuration: 0 };
    }

    const toolMetrics = this.metrics.tools.byTool[toolName];
    toolMetrics.total++;

    if (success) {
      toolMetrics.successful++;
    } else {
      toolMetrics.failed++;
    }

    // Update average duration
    toolMetrics.avgDuration = ((toolMetrics.avgDuration * (toolMetrics.total - 1)) + duration) / toolMetrics.total;

    logger.debug('Tool usage recorded', {
      toolName,
      duration,
      success,
      totalToolUsage: this.metrics.tools.total
    });
  }

  recordResponseTime(duration) {
    this.metrics.responseTime.total += duration;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, duration);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, duration);

    // Categorize response time
    if (duration < 1000) {
      this.metrics.responseTime.buckets.fast++;
    } else if (duration < 5000) {
      this.metrics.responseTime.buckets.medium++;
    } else if (duration < 30000) {
      this.metrics.responseTime.buckets.slow++;
    } else {
      this.metrics.responseTime.buckets.very_slow++;
    }
  }

  recordConversation(messageCount) {
    this.metrics.conversations.total++;
    this.metrics.conversations.messagesPerConversation.push(messageCount);

    // Keep only last 1000 conversation lengths
    if (this.metrics.conversations.messagesPerConversation.length > 1000) {
      this.metrics.conversations.messagesPerConversation =
        this.metrics.conversations.messagesPerConversation.slice(-1000);
    }
  }

  updateActiveConversations(count) {
    this.metrics.conversations.active = count;
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.responseTime.count > 0
      ? this.metrics.responseTime.total / this.metrics.responseTime.count
      : 0;

    const avgMessagesPerConversation = this.metrics.conversations.messagesPerConversation.length > 0
      ? this.metrics.conversations.messagesPerConversation.reduce((a, b) => a + b, 0) / this.metrics.conversations.messagesPerConversation.length
      : 0;

    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      requests: {
        ...this.metrics.requests,
        successRate: this.metrics.requests.total > 0
          ? (this.metrics.requests.successful / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%'
      },
      tools: {
        ...this.metrics.tools,
        successRate: this.metrics.tools.total > 0
          ? (this.metrics.tools.successful / this.metrics.tools.total * 100).toFixed(2) + '%'
          : '0%'
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        minResponseTime: this.metrics.responseTime.min === Infinity ? 0 : this.metrics.responseTime.min,
        maxResponseTime: this.metrics.responseTime.max,
        responseTimeDistribution: this.metrics.responseTime.buckets
      },
      conversations: {
        ...this.metrics.conversations,
        avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10
      }
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Middleware to track request metrics
  trackingMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;
        const endpoint = req.path;

        this.recordRequest(endpoint, duration, success);
      });

      next();
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, successful: 0, failed: 0, byEndpoint: {} },
      tools: { total: 0, successful: 0, failed: 0, byTool: {} },
      responseTime: { total: 0, count: 0, min: Infinity, max: 0, buckets: { fast: 0, medium: 0, slow: 0, very_slow: 0 } },
      conversations: { total: 0, active: 0, messagesPerConversation: [] }
    };
    this.startTime = Date.now();
  }
}

module.exports = new MetricsService();
