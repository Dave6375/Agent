const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Telegram Bot (if token provided)
let bot;
if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>AI Travel Agent</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .container { text-align: center; }
          h1 { color: #2c3e50; }
          .feature { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 AI Travel Agent</h1>
          <p>A powerful AI travel assistant with real-time web search, weather data, and location services.</p>
          
          <div class="feature">
            <h3>🌐 Real-time Web Search</h3>
            <p>Search for travel information using SERP API</p>
          </div>
          
          <div class="feature">
            <h3>🌤️ Weather Information</h3>
            <p>Get current weather for any destination</p>
          </div>
          
          <div class="feature">
            <h3>📍 Location Services</h3>
            <p>Find places and get location-based recommendations</p>
          </div>
          
          <div class="feature">
            <h3>💬 Telegram Bot</h3>
            <p>Available as a Telegram bot for easy access</p>
          </div>
          
          <p><strong>Environment Variables Required:</strong></p>
          <ul style="text-align: left; display: inline-block;">
            <li>OPENAI_API_KEY - Your OpenAI API key</li>
            <li>SERPAPI_API_KEY - Your SERP API key</li>
            <li>TELEGRAM_BOT_TOKEN - Your Telegram bot token (optional)</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI travel assistant. Help users with travel planning, destinations, weather, and location information."
        },
        {
          role: "user",
          content: message
        }
      ],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Telegram bot handlers
if (bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🤖 Welcome to AI Travel Agent! Ask me anything about travel, weather, or destinations.');
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && !text.startsWith('/')) {
      try {
        if (!process.env.OPENAI_API_KEY) {
          bot.sendMessage(chatId, 'Sorry, OpenAI API key is not configured.');
          return;
        }

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI travel assistant. Help users with travel planning, destinations, weather, and location information. Keep responses concise for Telegram."
            },
            {
              role: "user",
              content: text
            }
          ],
        });

        bot.sendMessage(chatId, completion.choices[0].message.content);
      } catch (error) {
        console.error('Telegram bot error:', error);
        bot.sendMessage(chatId, 'Sorry, I encountered an error processing your request.');
      }
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Travel Agent server running on port ${PORT}`);
  if (bot) {
    console.log('📱 Telegram bot is active');
  } else {
    console.log('📱 Telegram bot not configured (TELEGRAM_BOT_TOKEN missing)');
  }
});