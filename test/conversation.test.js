const { test, describe } = require('node:test');
const assert = require('node:assert');
const conversationService = require('../src/services/conversation');

describe('Conversation Service Tests', () => {
  test('should create new conversation', () => {
    const platform = 'test';
    const userId = 'user123';

    const conversation = conversationService.getConversation(platform, userId);
    assert.strictEqual(conversation.messages.length, 0);
    assert.ok(conversation.createdAt instanceof Date);
    assert.ok(conversation.lastActivity instanceof Date);
  });

  test('should add message to conversation', () => {
    const platform = 'test';
    const userId = 'user456';

    conversationService.addMessage(platform, userId, 'user', 'Hello');
    conversationService.addMessage(platform, userId, 'assistant', 'Hi there!');

    const history = conversationService.getHistory(platform, userId);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].role, 'user');
    assert.strictEqual(history[0].content, 'Hello');
    assert.strictEqual(history[1].role, 'assistant');
    assert.strictEqual(history[1].content, 'Hi there!');
  });

  test('should limit conversation history', () => {
    const platform = 'test';
    const userId = 'user789';

    // Add many messages
    for (let i = 0; i < 25; i++) {
      conversationService.addMessage(platform, userId, 'user', `Message ${i}`);
    }

    const history = conversationService.getHistory(platform, userId);
    assert.ok(history.length <= 10); // Default limit
  });

  test('should clear conversation', () => {
    const platform = 'test';
    const userId = 'user999';

    conversationService.addMessage(platform, userId, 'user', 'Test message');
    conversationService.clearConversation(platform, userId);

    const conversation = conversationService.getConversation(platform, userId);
    assert.strictEqual(conversation.messages.length, 0);
  });
});
