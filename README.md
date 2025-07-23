# AI Travel Agent 🤖

A powerful, production-ready AI travel assistant with real-time web search, weather data, and location services. Built with modern Node.js architecture, featuring both web interface and Telegram bot integration.

## ✨ Key Features

- 🌐 **Real-time Web Search** - Live search results via SERP API
- 🌤️ **Current Weather Data** - Real-time weather for any location
- 📍 **Location Services** - Smart location-based recommendations
- 💬 **Telegram Bot** - Full-featured bot with commands and context
- 🎨 **Modern Web Interface** - Beautiful, responsive chat interface
- 🔗 **AI Function Calling** - Multi-step reasoning with tool integration
- 🛡️ **Enterprise Security** - Rate limiting, input validation, sanitization
- 📊 **Conversation Memory** - Context-aware multi-turn conversations
- 🚀 **Production Ready** - Comprehensive logging, error handling, monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API key (required)
- SERP API key (optional, for web search)
- OpenWeatherMap API key (optional, for weather)
- Telegram Bot Token (optional, for Telegram integration)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/Dave6375/Agent.git
   cd Agent
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access the Agent**
   - Web Interface: `http://localhost:3000`
   - Telegram: Search for your bot on Telegram

## 🔧 Configuration

### Required Environment Variables
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### Optional Environment Variables
```bash
# Web Search (get from https://serpapi.com/)
SERPAPI_API_KEY=your-serpapi-key

# Weather Data (get from https://openweathermap.org/api)
WEATHER_API_KEY=your-weather-api-key

# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## 💻 Development

### Development Mode
```bash
npm run dev          # Start with file watching
npm test            # Run test suite
npm run lint        # Check code quality
npm run format      # Format code
```

### Available Scripts
- `npm start` - Production server
- `npm run dev` - Development with auto-reload
- `npm test` - Run tests
- `npm run lint` - ESLint code check
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Prettier code formatting
- `npm audit` - Security audit

## 🛡️ Security Features

- **Rate Limiting** - API endpoint protection
- **Input Validation** - Joi schema validation
- **Request Sanitization** - XSS protection
- **Security Headers** - Helmet.js integration
- **Error Handling** - Graceful error management
- **Logging** - Comprehensive request/error logging

## 📊 API Endpoints

### Web Chat
```
POST /api/chat
{
  "message": "Your travel question"
}
```

### Health Check
```
GET /health
```

### Conversation Management
```
POST /api/clear      # Clear conversation
GET  /api/stats      # Get system stats
```

## 🤖 Telegram Commands

- `/start` - Welcome and setup
- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/stats` - Show bot statistics

## 🌟 Real-World Use Cases

### 🏢 Professional Use
- **Research & Market Intelligence**
  - "Research competitors and their latest products"
  - "Find coworking spaces in Austin with pricing"
  - "Analyze AI regulations in the EU"

- **Business Travel Planning**
  - "Plan a 3-day business trip to Tokyo"
  - "Find conference venues in San Francisco"
  - "Research visa requirements for European travel"

### 🎯 Personal Use
- **Travel Planning**
  - "What's the weather in Paris next week?"
  - "Find direct flights from NYC to London"
  - "Best hotels in Tokyo under $200/night"

- **Local Discovery**
  - "Best restaurants near Times Square"
  - "Family activities in San Diego"
  - "Upcoming events in Chicago this weekend"

### 🚀 Advanced Capabilities
- **Multi-step Planning**: "Plan my entire week in Barcelona - flights, hotels, restaurants, and activities"
- **Real-time Information**: Always current data through web search and APIs
- **Context Awareness**: Remembers conversation history for better recommendations

## 🏗️ Architecture

### Modular Design
```
src/
├── config/          # Configuration management
├── controllers/     # Request handling logic
├── middleware/      # Security and validation
├── routes/          # API route definitions
├── services/        # Business logic (OpenAI, APIs)
└── utils/           # Logging, validation utilities
```

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI**: OpenAI GPT-3.5-turbo with function calling
- **APIs**: SERP API, OpenWeatherMap
- **Telegram**: Telegraf framework
- **Security**: Helmet, rate limiting, input validation
- **Testing**: Node.js test runner
- **Code Quality**: ESLint, Prettier

## 📈 Monitoring & Health

- **Health Endpoint**: `/health` - System status and metrics
- **Logging**: Structured JSON logging with levels
- **Memory Management**: Automatic conversation cleanup
- **Error Tracking**: Comprehensive error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [OpenAI API](https://openai.com/api/)
- [SERP API](https://serpapi.com/)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Built with ❤️ for intelligent travel assistance**
