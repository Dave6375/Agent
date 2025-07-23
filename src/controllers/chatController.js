const openaiService = require('../services/openai');
const serpApiService = require('../services/serpApi');
const weatherService = require('../services/weather');
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

    return tools;
  }

  async handleToolCalls(toolCalls) {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        let result;

        switch (toolCall.function.name) {
        case 'search_web':
          result = await serpApiService.executeFunction(toolCall.function);
          break;
        case 'get_current_weather':
          result = await weatherService.executeFunction(toolCall.function);
          break;
        default:
          result = 'Unknown function';
        }

        results.push(result);

      } catch (error) {
        logger.error('Tool call error', {
          tool: toolCall.function.name,
          error: error.message
        });
        results.push(`Error: ${error.message}`);
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
        weather: weatherService.isAvailable()
      };

      res.json({
        ...stats,
        tools: toolsAvailable
      });
    } catch (error) {
      logger.error('Stats error', { error: error.message });
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }
}

module.exports = new ChatController();
