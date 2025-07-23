const express = require('express');
const path = require('path');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const telegramBot = require('./src/services/telegram');
const apiRoutes = require('./src/routes/api');
const { 
  apiLimiter, 
  securityMiddleware, 
  requestLogger, 
  errorHandler,
  healthCheck 
} = require('./src/middleware/security');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses (for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(securityMiddleware);

// Request logging
if (config.isDevelopment) {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for all routes
app.use(apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', healthCheck);

// API routes
app.use('/api', apiRoutes);

// Root route - serve the web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested resource was not found' 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Stop Telegram bot
  await telegramBot.stop();
  
  // Close server
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(config.port, async () => {
  logger.info(`🚀 AI Travel Agent server started on port ${config.port}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
  logger.info(`📱 Web interface: http://localhost:${config.port}`);
  
  // Start Telegram bot
  const telegramStarted = await telegramBot.start();
  if (telegramStarted) {
    logger.info('📱 Telegram bot is active and polling for messages');
  } else {
    logger.info('📱 Telegram bot not configured (TELEGRAM_BOT_TOKEN missing)');
  }

  // Log available services
  const serpApiService = require('./src/services/serpApi');
  const weatherService = require('./src/services/weather');
  
  logger.info('🔧 Available services:', {
    webSearch: serpApiService.isAvailable(),
    weather: weatherService.isAvailable(),
    telegram: telegramBot.isActive()
  });

  if (config.isDevelopment) {
    logger.info('🔧 Development mode: Enhanced logging enabled');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;