/* eslint-env browser */

// Enhanced AI Travel Agent JavaScript
class TravelAgent {
  constructor() {
    this.messagesContainer = document.getElementById('messages');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.loading = document.getElementById('loading');
    this.error = document.getElementById('error');
    this.status = document.getElementById('status');

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Enable sending messages with Enter key
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Button event listeners
    document.getElementById('clearButton').addEventListener('click', () => this.clearChat());
    document.getElementById('statsButton').addEventListener('click', () => this.showStats());
    document.getElementById('helpButton').addEventListener('click', () => this.showHelp());
    this.sendButton.addEventListener('click', () => this.sendMessage());
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message) return;

    // Clear any previous errors
    this.hideError();

    // Add user message to chat
    this.addMessage(message, 'user');

    // Clear input and disable send button
    this.messageInput.value = '';
    this.sendButton.disabled = true;
    this.loading.style.display = 'block';
    this.status.textContent = 'Processing your request...';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response to chat
      this.addMessage(data.response, 'ai');
      this.status.textContent = 'Ready for your next question!';

    } catch (err) {
      this.showError(err.message);
      this.status.textContent = 'Error occurred. Please try again.';
    } finally {
      this.sendButton.disabled = false;
      this.loading.style.display = 'none';
      this.messageInput.focus();
    }
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    if (sender === 'ai') {
      messageDiv.innerHTML = `<strong>AI:</strong> ${text.replace(/\n/g, '<br>')}`;
    } else {
      messageDiv.textContent = text;
    }

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  async clearChat() {
    try {
      await fetch('/api/clear', { method: 'POST' });
      this.messagesContainer.innerHTML = `
                <div class="ai-message">
                    <strong>🤖 Expert AI Travel Agent:</strong> Chat cleared! I'm ready to help you plan your next adventure. Whether you need flights, hotels, weather updates, or travel advice - just ask!
                </div>
            `;
      this.hideError();
      this.status.textContent = 'Chat cleared successfully!';
    } catch (error) {
      this.showError('Failed to clear chat');
    }
  }

  async showStats() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();

      const statsMessage = `📊 **System Stats & Available Services:**
                
🗣️ **Active conversations:** ${data.totalConversations}
⏱️ **Uptime:** ${Math.round(data.uptime / 3600)} hours
💾 **Memory usage:** ${Math.round(data.memoryUsage.heapUsed / 1024 / 1024)} MB

🔧 **Available Services:**
🌐 Web Search: ${data.tools.webSearch ? '✅ Active' : '❌ Unavailable'}
🌤️ Weather Data: ${data.tools.weather ? '✅ Active' : '❌ Unavailable'}
💱 Currency Conversion: ${data.tools.currency ? '✅ Active' : '❌ Unavailable'}
🕐 Timezone Info: ${data.tools.timezone ? '✅ Active' : '❌ Unavailable'}
✈️ Flight Search: ${data.tools.flights ? '✅ Active' : '❌ Unavailable'}
🏨 Hotel Search: ${data.tools.hotels ? '✅ Active' : '❌ Unavailable'}`;

      this.addMessage(statsMessage, 'ai');
    } catch (error) {
      this.showError('Failed to get stats');
    }
  }

  showHelp() {
    const helpMessage = `🤖 **How to use your Expert AI Travel Agent:**

## ✈️ **Flight Search**
• "Find flights from NYC to Paris on March 15th"
• "Show me business class flights to Tokyo"
• "Round trip flights from London to Sydney"

## 🏨 **Hotel Search**
• "Find luxury hotels in Rome for 3 nights"
• "Budget hotels in Bangkok starting December 1st"
• "Hotels near Times Square for 2 guests"

## 🌤️ **Weather Information**
• "What's the weather in Barcelona next week?"
• "Current temperature in Singapore"
• "Weather forecast for my trip to Iceland"

## 💱 **Currency & Money**
• "Convert 1000 USD to Japanese Yen"
• "What's the exchange rate for Euros to Pounds?"
• "How much is 500 CAD in Euros?"

## 🕐 **Time & Timezones**
• "What time is it in Sydney right now?"
• "Time difference between New York and Tokyo"
• "Current time in multiple European cities"

## 🌐 **Travel Research**
• "Best restaurants in Paris"
• "Things to do in Bali in December"
• "Visa requirements for Americans visiting India"

## 💡 **Pro Tips:**
• Be specific with dates, locations, and preferences
• Ask for multiple options and comparisons
• I can help with complex multi-city trip planning
• Request budget-friendly or luxury alternatives
• Ask for cultural tips and local insights

**Ready to plan your perfect trip? Just ask!**`;

    this.addMessage(helpMessage, 'ai');
  }

  showError(message) {
    this.error.textContent = message;
    this.error.style.display = 'block';
  }

  hideError() {
    this.error.style.display = 'none';
  }
}

// Initialize the Travel Agent when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const agent = new TravelAgent();

  // Focus on input when page loads
  agent.messageInput.focus();
});
