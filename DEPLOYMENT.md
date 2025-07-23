# Railway.app Deployment Configuration

## Environment Variables to Set

### Required
- `OPENAI_API_KEY` - Your OpenAI API key

### Optional Services
- `SERPAPI_API_KEY` - For web search functionality
- `WEATHER_API_KEY` - For weather data
- `TELEGRAM_BOT_TOKEN` - For Telegram bot

### Application Configuration
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `PORT` - (Automatically set by Railway)

## Build Configuration

Railway will automatically:
1. Run `npm install`
2. Start the app with `npm start`
3. Expose the web interface on the provided PORT

## Health Check

The app includes a health endpoint at `/health` for monitoring.

## Scaling

The app is stateless and can be scaled horizontally. Conversation memory is stored in-memory, so for production at scale, consider:
- Adding Redis for conversation storage
- Implementing session clustering
- Adding database for persistent storage