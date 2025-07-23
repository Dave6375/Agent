const logger = require('../utils/logger');
const config = require('../config/config');

class ConversationService {
  constructor() {
    // In-memory storage (in production, use Redis or database)
    this.conversations = new Map();
    this.maxHistoryLength = 20;
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour

    // Only start cleanup in non-test environments
    if (config.nodeEnv !== 'test') {
      this.intervalId = setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  getConversationKey(platform, userId) {
    return `${platform}:${userId}`;
  }

  getConversation(platform, userId) {
    const key = this.getConversationKey(platform, userId);
    const conversation = this.conversations.get(key);

    if (!conversation) {
      return {
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
    }

    return conversation;
  }

  addMessage(platform, userId, role, content) {
    const key = this.getConversationKey(platform, userId);
    let conversation = this.conversations.get(key);

    if (!conversation) {
      conversation = {
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep only recent messages
    if (conversation.messages.length > this.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-this.maxHistoryLength);
    }

    conversation.lastActivity = new Date();
    this.conversations.set(key, conversation);

    logger.debug('Message added to conversation', {
      platform,
      userId: userId.substring(0, 8) + '...',
      role,
      messageCount: conversation.messages.length
    });

    return conversation;
  }

  getHistory(platform, userId, limit = 10) {
    const conversation = this.getConversation(platform, userId);
    return conversation.messages
      .slice(-limit)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  clearConversation(platform, userId) {
    const key = this.getConversationKey(platform, userId);
    this.conversations.delete(key);

    logger.info('Conversation cleared', {
      platform,
      userId: userId.substring(0, 8) + '...'
    });
  }

  cleanup() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleanedCount = 0;

    for (const [key, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < cutoffTime) {
        this.conversations.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up old conversations', {
        cleaned: cleanedCount,
        remaining: this.conversations.size
      });
    }
  }

  getStats() {
    return {
      totalConversations: this.conversations.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  // Cleanup method for graceful shutdown
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

module.exports = new ConversationService();
