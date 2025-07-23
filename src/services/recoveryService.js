const logger = require('../utils/logger');

class RecoveryService {
  constructor() {
    this.errorCounts = new Map();
    this.lastErrors = new Map();
    this.circuitBreakers = new Map();
    this.maxRetries = 3;
    this.resetTimeout = 300000; // 5 minutes
  }

  async executeWithRetry(serviceName, operation, maxRetries = this.maxRetries) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);

    if (circuitBreaker && circuitBreaker.isOpen()) {
      throw new Error(`Service ${serviceName} is temporarily unavailable. Please try again later.`);
    }

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();

        // Reset error count on success
        this.errorCounts.set(serviceName, 0);
        this.closeCircuitBreaker(serviceName);

        return result;

      } catch (error) {
        lastError = error;

        logger.warn(`Service ${serviceName} attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries
        });

        // Increment error count
        const currentCount = this.errorCounts.get(serviceName) || 0;
        this.errorCounts.set(serviceName, currentCount + 1);

        // Open circuit breaker if too many errors
        if (currentCount >= 5) {
          this.openCircuitBreaker(serviceName);
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    logger.error(`Service ${serviceName} failed after ${maxRetries} attempts`, {
      error: lastError.message
    });

    return this.getFallbackResponse(serviceName, lastError);
  }

  openCircuitBreaker(serviceName) {
    const resetTime = Date.now() + this.resetTimeout;

    this.circuitBreakers.set(serviceName, {
      isOpen: () => Date.now() < resetTime,
      resetTime
    });

    logger.warn(`Circuit breaker opened for ${serviceName}`, {
      resetTime: new Date(resetTime).toISOString()
    });
  }

  closeCircuitBreaker(serviceName) {
    this.circuitBreakers.delete(serviceName);
  }

  getFallbackResponse(serviceName, error) {
    const fallbacks = {
      currency: this.getCurrencyFallback(error),
      weather: this.getWeatherFallback(error),
      search: this.getSearchFallback(error),
      flights: this.getFlightsFallback(error),
      hotels: this.getHotelsFallback(error),
      timezone: this.getTimezoneFallback(error)
    };

    return fallbacks[serviceName] || this.getGenericFallback(serviceName, error);
  }

  getCurrencyFallback(error) {
    return `💱 **Currency Conversion Service Temporarily Unavailable**

I'm unable to get real-time exchange rates right now due to: ${error.message}

**Alternative Options:**
• Check xe.com or google.com for current rates
• Use your bank's mobile app for rates
• Major credit cards typically offer competitive exchange rates

**Approximate rates (may be outdated):**
• 1 USD ≈ 0.85 EUR
• 1 USD ≈ 0.75 GBP  
• 1 USD ≈ 110 JPY
• 1 EUR ≈ 1.18 USD

*For accurate rates, please check current financial websites.*`;
  }

  getWeatherFallback(error) {
    return `🌤️ **Weather Service Temporarily Unavailable**

I'm unable to get current weather data due to: ${error.message}

**Alternative Weather Sources:**
• weather.com or weather.gov
• AccuWeather mobile app
• Local weather apps for your region
• Google search "weather [city name]"

**General Travel Weather Tips:**
• Check weather 7-10 days before travel
• Pack layers for temperature variations
• Check seasonal weather patterns for your destination
• Consider weather-related travel insurance`;
  }

  getSearchFallback(error) {
    return `🌐 **Web Search Service Temporarily Unavailable**

I'm unable to search the web right now due to: ${error.message}

**Alternative Search Options:**
• Google.com for general searches
• TripAdvisor for travel reviews and recommendations
• Booking.com for hotels and accommodations
• Kayak or Expedia for flights and travel deals

**Travel Planning Resources:**
• Lonely Planet for destination guides
• Official tourism websites for cities/countries
• Travel blogs and social media for current insights`;
  }

  getFlightsFallback(error) {
    return `✈️ **Flight Search Service Temporarily Unavailable**

I'm unable to search for flights right now due to: ${error.message}

**Alternative Flight Booking Options:**
• **Direct Airline Websites**: Often best prices and policies
• **Meta-search Sites**: Kayak, Skyscanner, Google Flights
• **Online Travel Agencies**: Expedia, Booking.com, Priceline
• **Travel Agents**: For complex itineraries

**Flight Booking Tips:**
• Book 6-8 weeks ahead for domestic flights
• Book 2-3 months ahead for international flights
• Consider flexible dates for better prices
• Check multiple airports in large cities
• Compare round-trip vs. one-way prices`;
  }

  getHotelsFallback(error) {
    return `🏨 **Hotel Search Service Temporarily Unavailable**

I'm unable to search for hotels right now due to: ${error.message}

**Alternative Accommodation Booking:**
• **Hotel Direct**: Best rates and cancellation policies
• **Booking Platforms**: Booking.com, Hotels.com, Expedia
• **Alternative Stays**: Airbnb, VRBO for apartments/homes
• **Hostels**: Hostelworld for budget-friendly options

**Booking Tips:**
• Book directly with hotels for loyalty benefits
• Check cancellation policies before booking
• Read recent reviews for current conditions
• Consider location vs. price trade-offs
• Look for package deals with flights`;
  }

  getTimezoneFallback(error) {
    return `🕐 **Timezone Service Temporarily Unavailable**

I'm unable to get timezone information right now due to: ${error.message}

**Alternative Time Sources:**
• worldclock.com or timeanddate.com
• Google search "time in [city name]"
• Your phone's world clock app
• Computer system clock when set to destination timezone

**Time Planning Tips:**
• Consider jet lag when planning activities
• Book calls/meetings accounting for time differences
• Check if destination observes daylight saving time
• Set your devices to destination time upon arrival`;
  }

  getGenericFallback(serviceName, error) {
    return `⚠️ **Service Temporarily Unavailable**

The ${serviceName} service is currently experiencing issues: ${error.message}

**What you can do:**
• Try again in a few minutes
• Use alternative sources for this information
• Ask me about other travel services that are available
• Contact me later when the service has recovered

**Available Services:**
I can still help with other aspects of your travel planning that don't require this specific service.`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getServiceStatus() {
    const status = {};

    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      status[serviceName] = {
        status: circuitBreaker.isOpen() ? 'unavailable' : 'available',
        errorCount: this.errorCounts.get(serviceName) || 0,
        resetTime: circuitBreaker.resetTime ? new Date(circuitBreaker.resetTime).toISOString() : null
      };
    }

    return status;
  }
}

module.exports = new RecoveryService();
