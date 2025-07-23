const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');
const Validator = require('../utils/validator');

class OpenAIService {
  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey
    });

    this.systemPrompt = `You are an intelligent AI travel assistant with access to real-time information. 
You can help users with:
- Travel planning and recommendations
- Real-time web search for travel information
- Current weather data for destinations
- Location-based services and recommendations

Use the available tools when needed to provide accurate, up-to-date information. 
Always be helpful, accurate, and provide practical travel advice.`;
  }

  async generateResponse(message, conversationHistory = [], availableTools = []) {
    try {
      const sanitizedMessage = Validator.sanitizeText(message);

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: sanitizedMessage }
      ];

      const requestConfig = {
        model: config.openai.model,
        messages,
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature
      };

      // Add function calling if tools are available
      if (availableTools.length > 0) {
        requestConfig.tools = availableTools;
        requestConfig.tool_choice = 'auto';
      }

      logger.debug('Making OpenAI API request', {
        messageCount: messages.length,
        toolsCount: availableTools.length
      });

      const completion = await this.client.chat.completions.create(requestConfig);

      const response = completion.choices[0];

      logger.info('OpenAI response generated', {
        usage: completion.usage,
        finishReason: response.finish_reason
      });

      return {
        message: response.message,
        usage: completion.usage,
        finishReason: response.finish_reason
      };

    } catch (error) {
      logger.error('OpenAI API error', {
        error: error.message,
        type: error.constructor.name
      });

      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service temporarily unavailable');
      } else {
        throw new Error('Failed to generate AI response');
      }
    }
  }

  async generateTelegramResponse(message, conversationHistory = []) {
    // For Telegram, use shorter responses
    const shortSystemPrompt = 'You are a helpful AI travel assistant. Keep responses concise for messaging.';

    try {
      const sanitizedMessage = Validator.sanitizeText(message);

      const messages = [
        { role: 'system', content: shortSystemPrompt },
        ...conversationHistory.slice(-6), // Keep last 6 messages for context
        { role: 'user', content: sanitizedMessage }
      ];

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages,
        max_tokens: Math.min(config.openai.maxTokens, 500), // Shorter for Telegram
        temperature: config.openai.temperature
      });

      const response = completion.choices[0].message.content;

      // Truncate if too long for Telegram
      return response.length > 4000 ? response.substring(0, 3900) + '...' : response;

    } catch (error) {
      logger.error('OpenAI Telegram response error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new OpenAIService();
