const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class SerpApiService {
  constructor() {
    this.baseUrl = config.apis.serpApi.baseUrl;
    this.apiKey = config.apis.serpApi.key;
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async search(query, options = {}) {
    if (!this.isAvailable()) {
      logger.warn('SERP API not configured');
      throw new Error('Web search service not available');
    }

    try {
      const searchParams = {
        api_key: this.apiKey,
        engine: 'google',
        q: query,
        num: options.num || 5,
        gl: options.country || 'us',
        hl: options.language || 'en'
      };

      logger.debug('Making SERP API request', { query, params: searchParams });

      const response = await axios.get(this.baseUrl, {
        params: searchParams,
        timeout: 10000
      });

      const results = this.parseSearchResults(response.data);

      logger.info('SERP API search completed', {
        query,
        resultsCount: results.length
      });

      return results;

    } catch (error) {
      logger.error('SERP API error', {
        error: error.message,
        query,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid SERP API key');
      } else if (error.response?.status === 429) {
        throw new Error('Search rate limit exceeded');
      } else {
        throw new Error('Web search temporarily unavailable');
      }
    }
  }

  parseSearchResults(data) {
    const results = [];

    if (data.organic_results) {
      data.organic_results.forEach(result => {
        results.push({
          title: result.title,
          link: result.link,
          snippet: result.snippet,
          position: result.position
        });
      });
    }

    if (data.answer_box) {
      results.unshift({
        title: 'Quick Answer',
        snippet: data.answer_box.answer || data.answer_box.snippet,
        type: 'answer_box'
      });
    }

    return results;
  }

  // Function definition for OpenAI function calling
  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'search_web',
        description: 'Search the web for current information about travel, destinations, weather, events, or any other topics',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            country: {
              type: 'string',
              description: 'Country code for localized results (e.g., "us", "uk", "ca")',
              default: 'us'
            }
          },
          required: ['query']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    const { query, country } = JSON.parse(functionCall.arguments);
    const results = await this.search(query, { country });

    // Format results for AI consumption
    return results.map(result =>
      `${result.title}: ${result.snippet} ${result.link ? `(${result.link})` : ''}`
    ).join('\n\n');
  }
}

module.exports = new SerpApiService();
