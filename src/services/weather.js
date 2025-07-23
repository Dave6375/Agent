const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class WeatherService {
  constructor() {
    this.baseUrl = config.apis.weather.baseUrl;
    this.apiKey = config.apis.weather.key;
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async getCurrentWeather(location) {
    if (!this.isAvailable()) {
      logger.warn('Weather API not configured');
      throw new Error('Weather service not available');
    }

    try {
      const url = `${this.baseUrl}/weather`;
      const params = {
        q: location,
        appid: this.apiKey,
        units: 'metric' // Celsius
      };

      logger.debug('Making Weather API request', { location, url });

      const response = await axios.get(url, {
        params,
        timeout: 8000
      });

      const weatherData = this.parseWeatherData(response.data);
      
      logger.info('Weather data retrieved', { 
        location,
        temperature: weatherData.temperature,
        conditions: weatherData.conditions
      });

      return weatherData;

    } catch (error) {
      logger.error('Weather API error', { 
        error: error.message,
        location,
        status: error.response?.status 
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid Weather API key');
      } else if (error.response?.status === 404) {
        throw new Error(`Weather data not found for location: ${location}`);
      } else if (error.response?.status === 429) {
        throw new Error('Weather API rate limit exceeded');
      } else {
        throw new Error('Weather service temporarily unavailable');
      }
    }
  }

  async getForecast(location, days = 5) {
    if (!this.isAvailable()) {
      throw new Error('Weather service not available');
    }

    try {
      const url = `${this.baseUrl}/forecast`;
      const params = {
        q: location,
        appid: this.apiKey,
        units: 'metric',
        cnt: Math.min(days * 8, 40) // 8 forecasts per day, max 40
      };

      const response = await axios.get(url, {
        params,
        timeout: 8000
      });

      return this.parseForecastData(response.data);

    } catch (error) {
      logger.error('Weather forecast error', { error: error.message, location });
      throw error;
    }
  }

  parseWeatherData(data) {
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      conditions: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind?.speed || 0,
      windDirection: data.wind?.deg || 0,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      timezone: data.timezone,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString()
    };
  }

  parseForecastData(data) {
    const forecasts = data.list.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString(),
      time: new Date(item.dt * 1000).toLocaleTimeString(),
      temperature: Math.round(item.main.temp),
      conditions: item.weather[0].description,
      humidity: item.main.humidity,
      windSpeed: item.wind?.speed || 0
    }));

    return {
      location: `${data.city.name}, ${data.city.country}`,
      forecasts
    };
  }

  // Function definition for OpenAI function calling
  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get current weather information for a specific location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city name, state, and/or country (e.g., "Paris, France" or "New York, NY")'
            }
          },
          required: ['location']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    const { location } = JSON.parse(functionCall.arguments);
    const weather = await this.getCurrentWeather(location);
    
    return `Current weather in ${weather.location}:
Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)
Conditions: ${weather.conditions}
Humidity: ${weather.humidity}%
Wind: ${weather.windSpeed} m/s
Sunrise: ${weather.sunrise}
Sunset: ${weather.sunset}`;
  }
}

module.exports = new WeatherService();