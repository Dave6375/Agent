const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const config = require('../config/config');
const logger = require('../utils/logger');

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      res.status(429).json({ error: message });
    }
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.maxRequests,
  'Too many requests, please try again later'
);

// Strict limiter for chat endpoints
const chatLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 requests per 5 minutes
  'Too many chat requests, please slow down'
);

// Security middleware
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (config.isDevelopment) {
    res.status(500).json({
      error: 'Internal server error',
      details: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Health check middleware
const healthCheck = (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    version: require('../../package.json').version
  });
};

module.exports = {
  apiLimiter,
  chatLimiter,
  securityMiddleware,
  requestLogger,
  errorHandler,
  healthCheck
};