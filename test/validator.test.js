const { test, describe } = require('node:test');
const assert = require('node:assert');
const Validator = require('../src/utils/validator');

describe('Validator Tests', () => {
  test('should validate correct chat message', () => {
    const validMessage = { message: 'Hello, how can you help me?' };
    const result = Validator.validateChatMessage(validMessage);
    assert.strictEqual(result.message, validMessage.message);
  });

  test('should reject empty message', () => {
    assert.throws(() => {
      Validator.validateChatMessage({ message: '' });
    }, /Invalid message/);
  });

  test('should reject message that is too long', () => {
    const longMessage = 'a'.repeat(4001);
    assert.throws(() => {
      Validator.validateChatMessage({ message: longMessage });
    }, /Invalid message/);
  });

  test('should sanitize text correctly', () => {
    const maliciousText = '<script>alert("xss")</script>Hello';
    const result = Validator.sanitizeText(maliciousText);
    assert.strictEqual(result, 'Hello');
  });

  test('should validate API key correctly', () => {
    assert.strictEqual(Validator.isValidApiKey('sk-1234567890abcdef'), true);
    assert.strictEqual(Validator.isValidApiKey('short'), false);
    assert.strictEqual(Validator.isValidApiKey(null), false);
    assert.strictEqual(Validator.isValidApiKey(''), false);
  });
});
