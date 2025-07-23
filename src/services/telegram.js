const { Telegraf } = require('telegraf');
const config = require('../config/config');
const chatController = require('../controllers/chatController');
const logger = require('../utils/logger');

class TelegramBot {
  constructor() {
    if (!config.telegram.token) {
      logger.info('Telegram bot not initialized - token not provided');
      this.bot = null;
      return;
    }

    this.bot = new Telegraf(config.telegram.token);
    this.setupHandlers();
    this.isPolling = false;
  }

  setupHandlers() {
    if (!this.bot) return;

    // Start command
    this.bot.start((ctx) => {
      const welcomeMessage = `🤖 Welcome to the AI Travel Agent!

I can help you with:
✈️ Travel planning and recommendations
🌐 Real-time web search for travel info
🌤️ Current weather for any destination
📍 Location-based services

Just send me a message to get started!`;

      ctx.reply(welcomeMessage);
      logger.info('Telegram user started bot', { 
        userId: ctx.from.id,
        username: ctx.from.username 
      });
    });

    // Help command
    this.bot.help((ctx) => {
      const helpMessage = `🤖 AI Travel Agent Commands:

/start - Start the bot
/help - Show this help message
/clear - Clear conversation history
/stats - Show bot statistics

Just send me any message and I'll help you with travel-related questions!

Examples:
• "What's the weather in Paris?"
• "Find flights to Tokyo"
• "Best restaurants in New York"
• "Plan a 3-day trip to Rome"`;

      ctx.reply(helpMessage);
    });

    // Clear command
    this.bot.command('clear', (ctx) => {
      // Clear conversation history for this user
      const userId = ctx.from.id.toString();
      require('../services/conversation').clearConversation('telegram', userId);
      ctx.reply('🧹 Conversation history cleared!');
    });

    // Stats command
    this.bot.command('stats', (ctx) => {
      const stats = require('../services/conversation').getStats();
      const statsMessage = `📊 Bot Statistics:

🗣️ Active conversations: ${stats.totalConversations}
⏱️ Uptime: ${Math.round(stats.uptime / 3600)} hours
💾 Memory usage: ${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)} MB`;

      ctx.reply(statsMessage);
    });

    // Handle text messages
    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const chatId = ctx.chat.id;
      const userId = ctx.from.id;

      // Skip if it's a command
      if (message.startsWith('/')) return;

      try {
        // Show typing indicator
        await ctx.sendChatAction('typing');

        logger.debug('Processing Telegram message', {
          userId,
          username: ctx.from.username,
          messageLength: message.length
        });

        // Generate response using chat controller
        const response = await chatController.handleTelegramMessage(message, chatId);

        // Send response
        await ctx.reply(response);

        logger.info('Telegram response sent', {
          userId,
          responseLength: response.length
        });

      } catch (error) {
        logger.error('Telegram message handling error', {
          error: error.message,
          userId,
          message: message.substring(0, 50)
        });

        let errorMessage = '❌ Sorry, I encountered an error processing your request.';
        
        if (error.message.includes('API key')) {
          errorMessage = '🔑 Service temporarily unavailable. Please try again later.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = '⏱️ Please slow down! Try again in a few moments.';
        }

        await ctx.reply(errorMessage);
      }
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      logger.error('Telegram bot error', {
        error: err.message,
        userId: ctx.from?.id,
        updateType: ctx.updateType
      });
    });
  }

  async start() {
    if (!this.bot) {
      logger.info('Telegram bot not available');
      return false;
    }

    try {
      await this.bot.launch();
      this.isPolling = true;
      logger.info('🤖 Telegram bot started successfully');
      return true;
    } catch (error) {
      logger.error('Failed to start Telegram bot', { error: error.message });
      return false;
    }
  }

  async stop() {
    if (this.bot && this.isPolling) {
      this.bot.stop('SIGINT');
      this.isPolling = false;
      logger.info('Telegram bot stopped');
    }
  }

  isActive() {
    return this.bot && this.isPolling;
  }
}

module.exports = new TelegramBot();