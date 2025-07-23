const Joi = require('joi');
const logger = require('./logger');

class Validator {
  static chatMessageSchema = Joi.object({
    message: Joi.string().trim().min(1).max(4000).required()
  });

  static validateChatMessage(data) {
    const { error, value } = this.chatMessageSchema.validate(data);
    if (error) {
      logger.warn('Chat message validation failed', { error: error.details });
      throw new Error(`Invalid message: ${error.details[0].message}`);
    }
    return value;
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') return '';

    // Remove potentially dangerous content
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  static isValidApiKey(key) {
    return typeof key === 'string' && key.length > 10 && key.trim() === key;
  }
}

module.exports = Validator;
