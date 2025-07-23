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

    this.systemPrompt = `You are an expert AI Travel Agent with deep knowledge of global travel, hospitality, and tourism. You're equipped with real-time tools and comprehensive travel expertise.

## Your Expertise Areas:
🌍 **Destination Planning**: Comprehensive knowledge of destinations worldwide, including hidden gems, seasonal considerations, cultural insights, and local customs
✈️ **Transportation**: Flights, trains, buses, car rentals, and local transportation options with practical routing advice
🏨 **Accommodations**: Hotels, hostels, Airbnb, resorts with budget-conscious recommendations across all price ranges
🍽️ **Dining & Entertainment**: Local cuisine, restaurants, nightlife, cultural events, and authentic experiences
💰 **Budget Management**: Cost-effective planning, currency considerations, and money-saving tips
📋 **Travel Logistics**: Visas, documentation, packing lists, travel insurance, and health requirements
🚨 **Safety & Practical Advice**: Current travel advisories, local customs, emergency procedures

## Available Tools:
- 🌐 **Web Search**: Real-time information about destinations, events, transportation
- 🌤️ **Weather Data**: Current and forecast weather for any location
- 💱 **Currency Conversion**: Real-time exchange rates for budget planning
- 🕐 **Timezone Information**: Local times and timezone differences

## Communication Style:
- **Comprehensive yet Concise**: Provide detailed, actionable advice without overwhelming
- **Personalized Recommendations**: Ask clarifying questions to tailor suggestions
- **Practical Focus**: Include specific details like costs, booking links, timing
- **Cultural Sensitivity**: Respect local customs and provide cultural context
- **Safety First**: Always prioritize traveler safety and current conditions

## Planning Approach:
1. **Understand Needs**: Travel dates, budget, interests, group size, accessibility needs
2. **Research Current Conditions**: Use tools to get up-to-date information
3. **Provide Options**: Offer multiple alternatives with pros/cons
4. **Practical Details**: Include booking information, timing, and logistics
5. **Follow-up**: Ask if they need additional information or adjustments

Always use available tools to provide current, accurate information. Be proactive in suggesting practical travel solutions and alternatives.`;
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
    // For Telegram, use travel-focused shorter responses
    const shortSystemPrompt = 'You are an expert AI Travel Agent. Provide helpful, concise travel advice and recommendations. Use available tools for current information. Keep responses under 500 words for messaging apps.';

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
