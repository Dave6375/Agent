const logger = require('../utils/logger');

class FlightService {
  constructor() {
    // Using a mock flight search for demonstration
    // In production, you'd use Amadeus, Skyscanner, or similar APIs
    this.mockFlights = true; // Set to false when real API is configured
  }

  static getToolDefinition() {
    return {
      type: 'function',
      function: {
        name: 'search_flights',
        description: 'Search for flights between destinations with pricing and schedule information',
        parameters: {
          type: 'object',
          properties: {
            origin: {
              type: 'string',
              description: 'Departure city or airport code (e.g., "New York", "JFK", "London")'
            },
            destination: {
              type: 'string',
              description: 'Arrival city or airport code (e.g., "Paris", "CDG", "Tokyo")'
            },
            departure_date: {
              type: 'string',
              description: 'Departure date in YYYY-MM-DD format'
            },
            return_date: {
              type: 'string',
              description: 'Return date in YYYY-MM-DD format (optional for one-way flights)'
            },
            passengers: {
              type: 'number',
              description: 'Number of passengers (default: 1)'
            },
            class: {
              type: 'string',
              description: 'Flight class preference (economy, business, first)',
              enum: ['economy', 'business', 'first']
            }
          },
          required: ['origin', 'destination', 'departure_date']
        }
      }
    };
  }

  async executeFunction(functionCall) {
    try {
      const args = JSON.parse(functionCall.arguments);
      const result = await this.searchFlights(args);
      return result;
    } catch (error) {
      logger.error('Flight search function error', { error: error.message });
      throw error;
    }
  }

  async searchFlights({
    origin,
    destination,
    departure_date,
    return_date,
    passengers = 1,
    class: flightClass = 'economy'
  }) {
    try {
      if (this.mockFlights) {
        return this.getMockFlightData(origin, destination, departure_date, return_date, passengers, flightClass);
      }

      // Real API implementation would go here
      // Example: Amadeus, Skyscanner, etc.
      throw new Error('Real flight API not configured');

    } catch (error) {
      logger.error('Flight search error', {
        error: error.message,
        origin,
        destination,
        departure_date
      });
      throw new Error(`Failed to search flights: ${error.message}`);
    }
  }

  getMockFlightData(origin, destination, departureDate, returnDate, passengers, flightClass) {
    const airlines = ['American Airlines', 'Delta Air Lines', 'United Airlines', 'British Airways', 'Lufthansa', 'Air France', 'Emirates', 'Singapore Airlines'];
    const aircraftTypes = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350', 'Boeing 787', 'Airbus A380'];

    // Generate mock flights
    const outboundFlights = this.generateMockFlights(origin, destination, departureDate, airlines, aircraftTypes, flightClass);
    const returnFlights = returnDate ? this.generateMockFlights(destination, origin, returnDate, airlines, aircraftTypes, flightClass) : [];

    const tripType = returnDate ? 'Round-trip' : 'One-way';

    let response = `✈️ **Flight Search Results**

**${tripType} from ${origin} to ${destination}**
**Departure:** ${departureDate}${returnDate ? `\n**Return:** ${returnDate}` : ''}
**Passengers:** ${passengers}
**Class:** ${flightClass.charAt(0).toUpperCase() + flightClass.slice(1)}

## Outbound Flights`;

    outboundFlights.forEach((flight, index) => {
      response += `\n\n**Option ${index + 1}:** ${flight.airline}
🕐 **Departure:** ${flight.departureTime} from ${origin}
🕐 **Arrival:** ${flight.arrivalTime} at ${destination}
✈️ **Aircraft:** ${flight.aircraft}
⏱️ **Duration:** ${flight.duration}
💰 **Price:** $${flight.price} per person
🔄 **Stops:** ${flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`}`;
    });

    if (returnFlights.length > 0) {
      response += '\n\n## Return Flights';
      returnFlights.forEach((flight, index) => {
        response += `\n\n**Option ${index + 1}:** ${flight.airline}
🕐 **Departure:** ${flight.departureTime} from ${destination}
🕐 **Arrival:** ${flight.arrivalTime} at ${origin}
✈️ **Aircraft:** ${flight.aircraft}
⏱️ **Duration:** ${flight.duration}
💰 **Price:** Included in round-trip pricing
🔄 **Stops:** ${flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`}`;
      });
    }

    response += `\n\n## 💡 **Booking Tips:**
• Prices shown are estimates and may vary
• Book directly with airlines or use travel sites like Expedia, Kayak
• Consider flexible dates for better prices
• Check baggage policies and fees
• Arrive at airport 2-3 hours early for international flights

*Note: These are sample results. For real bookings, please check actual airline websites or travel booking platforms.*`;

    return response;
  }

  generateMockFlights(origin, destination, date, airlines, aircraftTypes, flightClass) {
    const flights = [];
    const numFlights = Math.floor(Math.random() * 3) + 3; // 3-5 flights

    for (let i = 0; i < numFlights; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)];
      const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
      const stops = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * 2) + 1;

      // Generate times
      const departureHour = Math.floor(Math.random() * 20) + 4; // 4 AM to 11 PM
      const departureMinute = Math.random() < 0.5 ? '00' : '30';
      const departureTime = `${departureHour.toString().padStart(2, '0')}:${departureMinute}`;

      const flightDurationHours = Math.floor(Math.random() * 12) + 2 + (stops * 2); // 2-14+ hours
      const flightDurationMinutes = Math.floor(Math.random() * 60);
      const duration = `${flightDurationHours}h ${flightDurationMinutes}m`;

      const arrivalHour = (departureHour + flightDurationHours + Math.floor((parseInt(departureMinute) + flightDurationMinutes) / 60)) % 24;
      const arrivalMinute = ((parseInt(departureMinute) + flightDurationMinutes) % 60).toString().padStart(2, '0');
      const arrivalTime = `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute}`;

      // Generate pricing based on class
      let basePrice = Math.floor(Math.random() * 800) + 200; // $200-$1000 base
      if (flightClass === 'business') basePrice *= 3;
      if (flightClass === 'first') basePrice *= 5;
      if (stops > 0) basePrice *= 0.8; // Connecting flights cheaper

      flights.push({
        airline,
        aircraft,
        departureTime,
        arrivalTime,
        duration,
        price: Math.floor(basePrice),
        stops
      });
    }

    // Sort by price
    return flights.sort((a, b) => a.price - b.price);
  }

  isAvailable() {
    return this.mockFlights; // Always available in mock mode
  }
}

module.exports = new FlightService();
