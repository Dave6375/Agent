const axios = require('axios');
const logger = require('../utils/logger');

class TimezoneService {
  constructor() {
    // Using a free timezone API
    this.baseUrl = 'http://worldtimeapi.org/api';
  }

  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'get_timezone_info',
        description: 'Get current time and timezone information for travel destinations',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name, country, or timezone (e.g., "New York", "London", "Tokyo", "America/New_York")'
            }
          },
          required: ['location']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    try {
      const args = JSON.parse(functionCall.arguments);
      const result = await this.getTimezoneInfo(args.location);
      return result;
    } catch (error) {
      logger.error('Timezone function error', { error: error.message });
      throw error;
    }
  }

  async getTimezoneInfo(location) {
    try {
      let timezoneData;

      // Try to get timezone by location name first
      try {
        const locationSearch = await this.searchTimezoneByLocation(location);
        if (locationSearch) {
          timezoneData = locationSearch;
        }
      } catch (error) {
        logger.debug('Location search failed, trying direct timezone', { location });
      }

      // If location search failed, try as direct timezone
      if (!timezoneData) {
        const response = await axios.get(`${this.baseUrl}/timezone/${location}`, {
          timeout: 10000
        });
        timezoneData = response.data;
      }

      const {
        datetime,
        timezone,
        utc_offset,
        day_of_week,
        day_of_year,
        week_number
      } = timezoneData;

      const localTime = new Date(datetime);
      const utcTime = new Date(datetime.replace(utc_offset, 'Z'));

      return this.formatTimezoneResponse(location, {
        localTime,
        utcTime,
        timezone,
        utcOffset: utc_offset,
        dayOfWeek: day_of_week,
        dayOfYear: day_of_year,
        weekNumber: week_number
      });

    } catch (error) {
      logger.error('Timezone lookup error', {
        error: error.message,
        location
      });

      // Fallback with basic time info
      return this.getFallbackTimeInfo(location);
    }
  }

  async searchTimezoneByLocation(location) {
    // Map common city names to timezones
    const cityTimezoneMap = {
      'new york': 'America/New_York',
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'tokyo': 'Asia/Tokyo',
      'sydney': 'Australia/Sydney',
      'los angeles': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'berlin': 'Europe/Berlin',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'moscow': 'Europe/Moscow',
      'dubai': 'Asia/Dubai',
      'singapore': 'Asia/Singapore',
      'hong kong': 'Asia/Hong_Kong',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'bangkok': 'Asia/Bangkok',
      'seoul': 'Asia/Seoul',
      'beijing': 'Asia/Shanghai',
      'shanghai': 'Asia/Shanghai'
    };

    const normalizedLocation = location.toLowerCase();
    const timezone = cityTimezoneMap[normalizedLocation];

    if (timezone) {
      const response = await axios.get(`${this.baseUrl}/timezone/${timezone}`, {
        timeout: 10000
      });
      return response.data;
    }

    return null;
  }

  formatTimezoneResponse(location, timeData) {
    const {
      localTime,
      utcTime,
      timezone,
      utcOffset,
      dayOfWeek,
      dayOfYear,
      weekNumber
    } = timeData;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    return `🕐 **Time Information for ${location}**

**Current Local Time:** ${localTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}

**Timezone:** ${timezone}
**UTC Offset:** ${utcOffset}
**Day of Week:** ${dayName}
**Day of Year:** ${dayOfYear}
**Week Number:** ${weekNumber}

**UTC Time:** ${utcTime.toISOString().replace('T', ' ').substring(0, 19)} UTC

*This information is useful for planning calls, meetings, and travel schedules.*`;
  }

  getFallbackTimeInfo(location) {
    const currentTime = new Date();

    return `🕐 **Time Information**

I couldn't get specific timezone data for "${location}", but here's the current UTC time:

**Current UTC Time:** ${currentTime.toISOString().replace('T', ' ').substring(0, 19)} UTC

**Suggestion:** Try using a more specific location (like "New York" or "London") or a timezone name (like "America/New_York").

*For accurate local times when traveling, I recommend checking multiple sources and confirming timezone rules for your specific dates.*`;
  }

  isAvailable() {
    return true; // Always available as it uses a free API
  }
}

module.exports = new TimezoneService();
