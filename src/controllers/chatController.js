const openaiService = require('../services/openai');
const serpApiService = require('../services/serpApi');
const weatherService = require('../services/weather');
const currencyService = require('../services/currencyService');
const timezoneService = require('../services/timezoneService');
const flightService = require('../services/flightService');
const hotelService = require('../services/hotelService');
const recoveryService = require('../services/recoveryService');
const conversationService = require('../services/conversation');
const Validator = require('../utils/validator');
const logger = require('../utils/logger');

class ChatController {
  async handleWebChat(req, res) {
    try {
      const { message } = Validator.validateChatMessage(req.body);
      const userId = req.ip; // Use IP as user identifier for web users

      // Add user message to conversation history
      conversationService.addMessage('web', userId, 'user', message);

      // Get conversation history
      const history = conversationService.getHistory('web', userId, 8);

      // Get available tools
      const tools = this.getAvailableTools();

      // Generate AI response
      const aiResponse = await openaiService.generateResponse(message, history, tools);

      let responseText = aiResponse.message.content;

      // Handle function calls
      if (aiResponse.message.tool_calls) {
        responseText = await this.handleToolCalls(aiResponse.message.tool_calls);
      }

      // Add AI response to conversation history
      conversationService.addMessage('web', userId, 'assistant', responseText);

      res.json({
        response: responseText,
        usage: aiResponse.usage
      });

    } catch (error) {
      logger.error('Web chat error', { error: error.message });
      res.status(500).json({
        error: error.message || 'Failed to process your request'
      });
    }
  }

  async handleTelegramMessage(message, chatId) {
    try {
      const userMessage = Validator.sanitizeText(message);
      const userId = chatId.toString();

      // Add user message to conversation history
      conversationService.addMessage('telegram', userId, 'user', userMessage);

      // Get conversation history (shorter for Telegram)
      const history = conversationService.getHistory('telegram', userId, 4);

      // Generate response
      const response = await openaiService.generateTelegramResponse(userMessage, history);

      // Add AI response to conversation history
      conversationService.addMessage('telegram', userId, 'assistant', response);

      return response;

    } catch (error) {
      logger.error('Telegram chat error', { error: error.message, chatId });
      throw error;
    }
  }

  getAvailableTools() {
    const tools = [];

    if (serpApiService.isAvailable()) {
      tools.push(serpApiService.constructor.getToolDefinition());
    }

    if (weatherService.isAvailable()) {
      tools.push(weatherService.constructor.getToolDefinition());
    }

    // Currency and timezone services are always available
    tools.push(currencyService.constructor.getToolDefinition());
    tools.push(timezoneService.constructor.getToolDefinition());

    // Flight and hotel services (mock data available)
    if (flightService.isAvailable()) {
      tools.push(flightService.constructor.getToolDefinition());
    }

    if (hotelService.isAvailable()) {
      tools.push(hotelService.constructor.getToolDefinition());
    }

    return tools;
  }

  async handleToolCalls(toolCalls) {
    const results = [];
    const metricsService = require('../services/metricsService');

    for (const toolCall of toolCalls) {
      const startTime = Date.now();
      let success = true;

      try {
        let result;

        switch (toolCall.function.name) {
        case 'search_web':
          result = await recoveryService.executeWithRetry('search', () =>
            serpApiService.executeFunction(toolCall.function)
          );
          break;
        case 'get_current_weather':
          result = await recoveryService.executeWithRetry('weather', () =>
            weatherService.executeFunction(toolCall.function)
          );
          break;
        case 'convert_currency':
          result = await recoveryService.executeWithRetry('currency', () =>
            currencyService.executeFunction(toolCall.function)
          );
          break;
        case 'get_timezone_info':
          result = await recoveryService.executeWithRetry('timezone', () =>
            timezoneService.executeFunction(toolCall.function)
          );
          break;
        case 'search_flights':
          result = await recoveryService.executeWithRetry('flights', () =>
            flightService.executeFunction(toolCall.function)
          );
          break;
        case 'search_hotels':
          result = await recoveryService.executeWithRetry('hotels', () =>
            hotelService.executeFunction(toolCall.function)
          );
          break;
        default:
          result = 'Unknown function';
        }

        results.push(result);

      } catch (error) {
        success = false;
        logger.error('Tool call error', {
          tool: toolCall.function.name,
          error: error.message
        });
        results.push(`Error: ${error.message}`);
      } finally {
        const duration = Date.now() - startTime;
        metricsService.recordToolUsage(toolCall.function.name, duration, success);
      }
    }

    return results.join('\n\n');
  }

  async clearConversation(req, res) {
    try {
      const userId = req.ip;
      conversationService.clearConversation('web', userId);

      res.json({ success: true, message: 'Conversation cleared' });
    } catch (error) {
      logger.error('Clear conversation error', { error: error.message });
      res.status(500).json({ error: 'Failed to clear conversation' });
    }
  }

  async getStats(req, res) {
    try {
      const stats = conversationService.getStats();
      const toolsAvailable = {
        webSearch: serpApiService.isAvailable(),
        weather: weatherService.isAvailable(),
        currency: currencyService.isAvailable(),
        timezone: timezoneService.isAvailable(),
        flights: flightService.isAvailable(),
        hotels: hotelService.isAvailable()
      };

      const serviceStatus = recoveryService.getServiceStatus();
      const metricsService = require('../services/metricsService');
      const performanceMetrics = metricsService.getMetrics();

      res.json({
        ...stats,
        tools: toolsAvailable,
        serviceHealth: serviceStatus,
        performance: performanceMetrics
      });
    } catch (error) {
      logger.error('Stats error', { error: error.message });
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }
}

module.exports = new ChatController();
