const logger = require('../utils/logger');

class CurrencyService {
  constructor() {
    // Using a free API that doesn't require a key for basic conversions
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour in milliseconds
  }

  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'convert_currency',
        description: 'Convert currency amounts for travel planning and budgeting',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Amount to convert'
            },
            from: {
              type: 'string',
              description: 'Source currency code (e.g., USD, EUR, GBP)'
            },
            to: {
              type: 'string',
              description: 'Target currency code (e.g., USD, EUR, GBP)'
            }
          },
          required: ['amount', 'from', 'to']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    try {
      const args = JSON.parse(functionCall.arguments);
      const result = await this.convertCurrency(args.amount, args.from, args.to);
      return result;
    } catch (error) {
      logger.error('Currency conversion function error', { error: error.message });
      throw error;
    }
  }

  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      // Normalize currency codes
      const from = fromCurrency.toUpperCase();
      const to = toCurrency.toUpperCase();

      if (from === to) {
        return `${amount} ${from} = ${amount} ${to} (same currency)`;
      }

      // Check cache first
      const cacheKey = `${from}_${to}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        const convertedAmount = (amount * cached.rate).toFixed(2);
        return this.formatCurrencyResponse(amount, from, convertedAmount, to, cached.rate);
      }

      // Fetch exchange rates
      const response = await axios.get(`${this.baseUrl}/${from}`, {
        timeout: 10000
      });

      const rates = response.data.rates;

      if (!rates[to]) {
        throw new Error(`Currency ${to} not supported`);
      }

      const rate = rates[to];

      // Cache the rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      const convertedAmount = (amount * rate).toFixed(2);

      logger.info('Currency conversion completed', {
        from,
        to,
        amount,
        convertedAmount,
        rate
      });

      return this.formatCurrencyResponse(amount, from, convertedAmount, to, rate);

    } catch (error) {
      logger.error('Currency conversion error', {
        error: error.message,
        amount,
        from: fromCurrency,
        to: toCurrency
      });
      throw new Error(`Failed to convert currency: ${error.message}`);
    }
  }

  formatCurrencyResponse(amount, fromCurrency, convertedAmount, toCurrency, rate) {
    return `💱 **Currency Conversion**
    
**${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}**

Exchange Rate: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}

*Rates are updated every hour. For real-time rates for large transactions, please check with your bank or financial institution.*`;
  }

  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseUrl}/USD`, {
        timeout: 10000
      });

      return Object.keys(response.data.rates).sort();
    } catch (error) {
      logger.error('Failed to get supported currencies', { error: error.message });
      return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW'];
    }
  }

  isAvailable() {
    return true; // Always available as it uses a free API
  }
}

module.exports = new CurrencyService();
