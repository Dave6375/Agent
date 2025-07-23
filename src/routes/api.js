const express = require('express');
const chatController = require('../controllers/chatController');
const { chatLimiter } = require('../middleware/security');

const router = express.Router();

// Chat endpoint with rate limiting
router.post('/chat', chatLimiter, (req, res) => {
  chatController.handleWebChat(req, res);
});

// Clear conversation
router.post('/clear', (req, res) => {
  chatController.clearConversation(req, res);
});

// Stats endpoint
router.get('/stats', (req, res) => {
  chatController.getStats(req, res);
});

module.exports = router;
