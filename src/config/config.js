const Joi = require('joi');

// Load environment-specific config
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test' });
} else {
  require('dotenv').config();
}

// Configuration schema validation
const configSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  OPENAI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('test-key'),
    otherwise: Joi.string().required()
  }),
  SERPAPI_API_KEY: Joi.string().optional(),
  WEATHER_API_KEY: Joi.string().optional(),
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  MAX_RESPONSE_LENGTH: Joi.number().default(4000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
});

// Validate and extract configuration
const { error, value: config } = configSchema.validate(process.env, {
  allowUnknown: true, // Allow other environment variables
  stripUnknown: true  // Remove unknown variables from result
});

if (error) {
  throw new Error(`Configuration validation error: ${error.message}`);
}

module.exports = {
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
  openai: {
    apiKey: config.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },
  apis: {
    serpApi: {
      key: config.SERPAPI_API_KEY,
      baseUrl: 'https://serpapi.com/search'
    },
    weather: {
      key: config.WEATHER_API_KEY,
      baseUrl: 'http://api.openweathermap.org/data/2.5'
    }
  },
  telegram: {
    token: config.TELEGRAM_BOT_TOKEN
  },
  rateLimit: {
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS
  },
  app: {
    maxResponseLength: config.MAX_RESPONSE_LENGTH,
    logLevel: config.LOG_LEVEL
  },
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production'
};