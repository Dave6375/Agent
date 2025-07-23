const logger = require('../utils/logger');

class HotelService {
  constructor() {
    // Using mock hotel data for demonstration
    // In production, you'd use Booking.com API, Hotels.com, or similar
    this.mockHotels = true;
  }

  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'search_hotels',
        description: 'Search for hotels and accommodations with pricing, ratings, and amenities',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City or location to search for hotels (e.g., "Paris", "New York", "London")'
            },
            check_in: {
              type: 'string',
              description: 'Check-in date in YYYY-MM-DD format'
            },
            check_out: {
              type: 'string',
              description: 'Check-out date in YYYY-MM-DD format'
            },
            guests: {
              type: 'number',
              description: 'Number of guests (default: 2)'
            },
            rooms: {
              type: 'number',
              description: 'Number of rooms (default: 1)'
            },
            budget_range: {
              type: 'string',
              description: 'Budget preference (budget, mid-range, luxury)',
              enum: ['budget', 'mid-range', 'luxury']
            }
          },
          required: ['location', 'check_in', 'check_out']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    try {
      const args = JSON.parse(functionCall.arguments);
      const result = await this.searchHotels(args);
      return result;
    } catch (error) {
      logger.error('Hotel search function error', { error: error.message });
      throw error;
    }
  }

  async searchHotels({
    location,
    check_in,
    check_out,
    guests = 2,
    rooms = 1,
    budget_range = 'mid-range'
  }) {
    try {
      if (this.mockHotels) {
        return this.getMockHotelData(location, check_in, check_out, guests, rooms, budget_range);
      }

      // Real API implementation would go here
      throw new Error('Real hotel API not configured');

    } catch (error) {
      logger.error('Hotel search error', {
        error: error.message,
        location,
        check_in,
        check_out
      });
      throw new Error(`Failed to search hotels: ${error.message}`);
    }
  }

  getMockHotelData(location, checkIn, checkOut, guests, rooms, budgetRange) {
    const hotels = this.generateMockHotels(location, budgetRange);

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    let response = `🏨 **Hotel Search Results for ${location}**

**Check-in:** ${checkIn}
**Check-out:** ${checkOut}
**Duration:** ${nights} night${nights > 1 ? 's' : ''}
**Guests:** ${guests} | **Rooms:** ${rooms}
**Budget Range:** ${budgetRange.charAt(0).toUpperCase() + budgetRange.slice(1)}

---`;

    hotels.forEach((hotel, index) => {
      const totalPrice = hotel.pricePerNight * nights;

      response += `\n\n## ${index + 1}. **${hotel.name}**
⭐ **Rating:** ${hotel.rating}/5 (${hotel.reviews} reviews)
📍 **Location:** ${hotel.area}
💰 **Price:** $${hotel.pricePerNight}/night • **Total: $${totalPrice}**

**Amenities:**
${hotel.amenities.map(amenity => `• ${amenity}`).join('\n')}

**Room Type:** ${hotel.roomType}
**Description:** ${hotel.description}`;
    });

    response += `\n\n## 💡 **Booking Tips:**
• Prices may vary based on exact dates and availability
• Book directly with hotels for best rates and benefits
• Check cancellation policies before booking
• Consider location vs. price trade-offs
• Read recent reviews for current conditions

**Popular Booking Sites:**
• Booking.com, Hotels.com, Expedia
• Hotel direct websites for member rates
• Trivago for price comparison

*Note: These are sample results. For real bookings, please check actual hotel websites or booking platforms.*`;

    return response;
  }

  generateMockHotels(location, budgetRange) {
    const hotelChains = {
      budget: ['Holiday Inn Express', 'Best Western', 'Comfort Inn', 'Ibis', 'Premier Inn'],
      'mid-range': ['Holiday Inn', 'Marriott', 'Hilton Garden Inn', 'Courtyard', 'Radisson'],
      luxury: ['Four Seasons', 'Ritz-Carlton', 'St. Regis', 'Waldorf Astoria', 'Park Hyatt']
    };

    const amenitiesMap = {
      budget: ['Free WiFi', 'Breakfast included', 'Fitness center', '24-hour front desk', 'Air conditioning'],
      'mid-range': ['Free WiFi', 'Restaurant', 'Bar', 'Fitness center', 'Business center', 'Pool', 'Room service'],
      luxury: ['Concierge service', 'Spa', 'Fine dining restaurant', 'Room service', 'Butler service', 'Pool', 'Valet parking', 'Premium WiFi']
    };

    const areas = [`Downtown ${location}`, `${location} City Center`, `${location} Business District`, `Historic ${location}`, `${location} Airport Area`];

    const roomTypes = {
      budget: ['Standard Room', 'Queen Room', 'Double Room'],
      'mid-range': ['Deluxe Room', 'Executive Room', 'Junior Suite'],
      luxury: ['Executive Suite', 'Premium Suite', 'Presidential Suite']
    };

    const descriptions = {
      budget: [
        'Clean and comfortable accommodations with essential amenities.',
        'Modern rooms designed for budget-conscious travelers.',
        'Simple, well-maintained hotel perfect for short stays.'
      ],
      'mid-range': [
        'Stylish hotel combining comfort with excellent service.',
        'Modern accommodations with business-friendly amenities.',
        'Well-appointed rooms in a convenient location.'
      ],
      luxury: [
        'Exceptional luxury with world-class service and amenities.',
        'Elegant accommodations offering the finest hospitality.',
        'Prestigious hotel known for impeccable service and style.'
      ]
    };

    const hotels = [];
    const chains = hotelChains[budgetRange];
    const amenities = amenitiesMap[budgetRange];
    const roomTypeOptions = roomTypes[budgetRange];
    const descriptionOptions = descriptions[budgetRange];

    // Generate 4-6 hotels
    const numHotels = Math.floor(Math.random() * 3) + 4;

    for (let i = 0; i < numHotels; i++) {
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const roomType = roomTypeOptions[Math.floor(Math.random() * roomTypeOptions.length)];
      const description = descriptionOptions[Math.floor(Math.random() * descriptionOptions.length)];

      // Generate rating
      let rating = 3.5 + Math.random() * 1.5;
      if (budgetRange === 'luxury') rating = 4.2 + Math.random() * 0.8;
      if (budgetRange === 'budget') rating = 3.0 + Math.random() * 1.5;
      rating = Math.round(rating * 10) / 10;

      // Generate pricing
      let basePrice = 80 + Math.random() * 120; // $80-200 base
      if (budgetRange === 'budget') basePrice = 40 + Math.random() * 80;
      if (budgetRange === 'luxury') basePrice = 300 + Math.random() * 500;

      // Select random amenities
      const hotelAmenities = amenities.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 4);

      hotels.push({
        name: `${chain} ${location}`,
        rating,
        reviews: Math.floor(Math.random() * 2000) + 100,
        area,
        pricePerNight: Math.floor(basePrice),
        amenities: hotelAmenities,
        roomType,
        description
      });
    }

    // Sort by rating (highest first)
    return hotels.sort((a, b) => b.rating - a.rating);
  }

  isAvailable() {
    return this.mockHotels;
  }
}

module.exports = new HotelService();
