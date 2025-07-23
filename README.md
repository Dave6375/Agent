# Agent
# AI Travel Agent 🤖

A powerful AI travel assistant with real-time web search, weather data, and location services. Available via web interface and Telegram bot.

## Features

- 🌐 **Real-time web search** via SERP API
- 🌤️ **Current weather information** 
- 📍 **Location services**
- 💬 **Telegram bot integration**
- 🎨 **Beautiful web interface**
- 🔗 **Multi-step reasoning** and tool chaining

## Environment Variables

Set these in Railway:

```
OPENAI_API_KEY=your-openai-api-key
SERPAPI_API_KEY=your-serpapi-api-key  
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## Deployment

This app is configured for Railway.app deployment:

1. The web server runs on the PORT provided by Railway
2. Both web interface and Telegram bot run simultaneously
3. All APIs are integrated and ready to use

## Usage

- **Web Interface**: Visit the deployed URL
- **Telegram**: Search for your bot on Telegram

## Tech Stack

- Node.js + Express
- OpenAI GPT-3.5-turbo
- SERP API for web search
- Telegram Bot API
- Modern responsive UI
