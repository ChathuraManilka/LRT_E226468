import { getServerBaseUrl } from '../config/apiConfig';
import axios from 'axios';

class ChatbotService {
  constructor() {
    this.conversationHistory = [];
    this.userContext = {};
    // Cache for instant responses
    this.cache = {
      trains: null,
      schedules: null,
      notices: null,
      lastUpdate: {
        trains: null,
        schedules: null,
        notices: null,
      },
    };
    this.CACHE_DURATION = 60000; // 1 minute cache
    this.isInitializing = false;
    // Booking flow state
    this.bookingState = {
      active: false,
      step: null, // 'selectTrain', 'selectRoute', 'enterPassengers', 'confirm'
      selectedTrain: null,
      selectedRoute: null,
      passengers: [],
    };
  }

  // Initialize chatbot with user context
  initialize(user) {
    this.userContext = {
      userId: user?._id,
      userName: user?.name,
      email: user?.email,
    };
    
    // Prefetch data in background for instant responses
    this.prefetchData();
    
    // Add welcome message
    return {
      sender: 'bot',
      text: `Hello ${user?.name || 'there'}! 👋 I'm your LRT Assistant. I can help you with:\n\n• Booking tickets\n• Checking train schedules\n• Tracking trains in real-time\n• Viewing your tickets\n• Getting latest notices\n• Viewing train information\n\nI can show you information right here or navigate to detailed screens. How can I assist you today?`,
      timestamp: new Date(),
    };
  }

  // Prefetch data for instant responses
  async prefetchData() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      const baseUrl = await Promise.race([
        getServerBaseUrl(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]).catch(() => null);

      if (!baseUrl) {
        console.log('Chatbot: No server connection, using offline mode');
        this.isInitializing = false;
        return;
      }

      // Fetch all data in parallel
      const [trainsRes, schedulesRes, noticesRes] = await Promise.allSettled([
        axios.get(`${baseUrl}/api/trains`, { timeout: 3000 }),
        axios.get(`${baseUrl}/api/routes`, { timeout: 3000 }),
        axios.get(`${baseUrl}/api/notices`, { timeout: 3000 }),
      ]);

      // Update cache
      if (trainsRes.status === 'fulfilled') {
        this.cache.trains = trainsRes.value.data;
        this.cache.lastUpdate.trains = Date.now();
        console.log(`Chatbot: Cached ${this.cache.trains.length} trains`);
      }

      if (schedulesRes.status === 'fulfilled') {
        this.cache.schedules = schedulesRes.value.data;
        this.cache.lastUpdate.schedules = Date.now();
        console.log(`Chatbot: Cached ${this.cache.schedules.length} schedules`);
      }

      if (noticesRes.status === 'fulfilled') {
        this.cache.notices = noticesRes.value.data;
        this.cache.lastUpdate.notices = Date.now();
        console.log(`Chatbot: Cached ${this.cache.notices.length} notices`);
      }
    } catch (error) {
      console.error('Chatbot: Error prefetching data:', error.message);
    } finally {
      this.isInitializing = false;
    }
  }

  // Process user message and generate response
  async processMessage(userMessage) {
    this.conversationHistory.push({
      sender: 'user',
      text: userMessage,
      timestamp: new Date(),
    });

    // Check if we're in an active booking flow
    if (this.bookingState.active) {
      const response = await this.handleBookingFlow(userMessage);
      this.conversationHistory.push(response);
      return response;
    }

    // Analyze intent
    const intent = this.analyzeIntent(userMessage);
    
    // Generate response based on intent
    const response = await this.generateResponse(intent, userMessage);
    
    this.conversationHistory.push(response);
    
    return response;
  }

  // Analyze user intent using keyword matching and patterns
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // My tickets intent - CHECK THIS FIRST before booking
    if (
      lowerMessage.includes('my ticket') ||
      lowerMessage.includes('my booking') ||
      lowerMessage.includes('show ticket') ||
      lowerMessage.includes('view ticket') ||
      lowerMessage.includes('see ticket') ||
      lowerMessage.includes('booked') ||
      lowerMessage.includes('reserved')
    ) {
      return { type: 'myTickets', confidence: 0.95 };
    }
    
    // Booking intent
    if (
      lowerMessage.includes('book') ||
      lowerMessage.includes('ticket') ||
      lowerMessage.includes('reserve') ||
      lowerMessage.includes('buy') ||
      lowerMessage.includes('purchase') ||
      lowerMessage.includes('get a ticket') ||
      lowerMessage.includes('need a ticket') ||
      lowerMessage.includes('want to travel') ||
      lowerMessage.includes('going to') ||
      lowerMessage.includes('travel to') ||
      lowerMessage.includes('journey')
    ) {
      return { type: 'booking', confidence: 0.9 };
    }
    
    // Schedule intent
    if (
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('timetable') ||
      lowerMessage.includes('timing') ||
      lowerMessage.includes('when') ||
      lowerMessage.includes('time')
    ) {
      return { type: 'schedule', confidence: 0.85 };
    }
    
    // Tracking intent
    if (
      lowerMessage.includes('track') ||
      lowerMessage.includes('location') ||
      lowerMessage.includes('where') ||
      lowerMessage.includes('live') ||
      lowerMessage.includes('real-time') ||
      lowerMessage.includes('position') ||
      lowerMessage.includes('find train') ||
      lowerMessage.includes('locate') ||
      lowerMessage.includes('see trains') ||
      lowerMessage.includes('map') ||
      lowerMessage.includes('current location')
    ) {
      return { type: 'tracking', confidence: 0.9 };
    }
    
    // Notices intent
    if (
      lowerMessage.includes('notice') ||
      lowerMessage.includes('announcement') ||
      lowerMessage.includes('news') ||
      lowerMessage.includes('update') ||
      lowerMessage.includes('alert')
    ) {
      return { type: 'notices', confidence: 0.85 };
    }
    
    // Status check intent (removed delay prediction)
    if (
      lowerMessage.includes('status') ||
      lowerMessage.includes('on time')
    ) {
      return { type: 'trainInfo', confidence: 0.8 };
    }
    
    // Train info intent
    if (
      lowerMessage.includes('train') ||
      lowerMessage.includes('available') ||
      lowerMessage.includes('running')
    ) {
      return { type: 'trainInfo', confidence: 0.75 };
    }
    
    // Help intent
    if (
      lowerMessage.includes('help') ||
      lowerMessage.includes('what can you') ||
      lowerMessage.includes('how to')
    ) {
      return { type: 'help', confidence: 0.9 };
    }
    
    // Greeting intent
    if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('hey') ||
      lowerMessage.includes('good morning') ||
      lowerMessage.includes('good afternoon') ||
      lowerMessage.includes('good evening') ||
      lowerMessage.includes('greetings') ||
      lowerMessage.includes('howdy') ||
      lowerMessage.includes('hola') ||
      lowerMessage === 'yo' ||
      lowerMessage.includes('good day') ||
      lowerMessage.includes('start')
    ) {
      return { type: 'greeting', confidence: 0.95 };
    }
    
    // Thank you intent
    if (
      lowerMessage.includes('thank') ||
      lowerMessage.includes('thanks')
    ) {
      return { type: 'thanks', confidence: 0.95 };
    }
    
    // Goodbye intent
    if (
      lowerMessage.includes('bye') ||
      lowerMessage.includes('goodbye') ||
      lowerMessage.includes('see you') ||
      lowerMessage.includes('take care')
    ) {
      return { type: 'goodbye', confidence: 0.95 };
    }
    
    // How are you intent
    if (
      lowerMessage.includes('how are you') ||
      lowerMessage.includes('how r u') ||
      lowerMessage.includes('how do you do') ||
      lowerMessage.includes('whats up') ||
      lowerMessage.includes("what's up")
    ) {
      return { type: 'howareyu', confidence: 0.9 };
    }
    
    // Who are you / About intent
    if (
      lowerMessage.includes('who are you') ||
      lowerMessage.includes('what are you') ||
      lowerMessage.includes('tell me about yourself') ||
      lowerMessage.includes('your name')
    ) {
      return { type: 'about', confidence: 0.9 };
    }
    
    // Capabilities intent
    if (
      lowerMessage.includes('what can you do') ||
      lowerMessage.includes('what do you do') ||
      lowerMessage.includes('your capabilities') ||
      lowerMessage.includes('features')
    ) {
      return { type: 'capabilities', confidence: 0.9 };
    }
    
    // Yes/No responses
    if (
      lowerMessage === 'yes' ||
      lowerMessage === 'yeah' ||
      lowerMessage === 'yep' ||
      lowerMessage === 'sure' ||
      lowerMessage === 'ok' ||
      lowerMessage === 'okay'
    ) {
      return { type: 'affirmative', confidence: 0.8 };
    }
    
    if (
      lowerMessage === 'no' ||
      lowerMessage === 'nope' ||
      lowerMessage === 'nah'
    ) {
      return { type: 'negative', confidence: 0.8 };
    }
    
    // Default - unknown intent
    return { type: 'unknown', confidence: 0.5 };
  }

  // Generate response based on intent
  async generateResponse(intent, userMessage) {
    try {
      // Get base URL with timeout
      const baseUrl = await Promise.race([
        getServerBaseUrl(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        )
      ]).catch(() => null);
      
      // If no connection, provide offline responses for simple intents
      if (!baseUrl && ['greeting', 'thanks', 'help', 'goodbye', 'howareyu', 'about', 'capabilities', 'affirmative', 'negative'].includes(intent.type)) {
        return this.getOfflineResponse(intent.type);
      }
      switch (intent.type) {
        case 'greeting':
          return {
            sender: 'bot',
            text: `Hello! How can I help you with your LRT journey today?`,
            timestamp: new Date(),
          };
          
        case 'thanks':
          return {
            sender: 'bot',
            text: `You're welcome! Is there anything else I can help you with?`,
            timestamp: new Date(),
          };
          
        case 'goodbye':
          return {
            sender: 'bot',
            text: `Goodbye! Have a safe journey! Feel free to come back if you need any help. 👋`,
            timestamp: new Date(),
          };
          
        case 'howareyu':
          return {
            sender: 'bot',
            text: `I'm doing great, thank you for asking! 😊 I'm here and ready to help you with your LRT journey. How can I assist you today?`,
            timestamp: new Date(),
          };
          
        case 'about':
          return {
            sender: 'bot',
            text: `I'm your LRT Virtual Assistant! 🤖 I'm here to help you with everything related to the Light Rail Transit system - from booking tickets to tracking trains. I can answer your questions, help you navigate the system, and make your journey smoother!`,
            timestamp: new Date(),
          };
          
        case 'capabilities':
          return {
            sender: 'bot',
            text: `Here's what I can do for you:\n\n🎫 Book train tickets\n📍 Track trains in real-time\n🎫 View your tickets\n🕒 Check train schedules\n📢 Get latest notices and updates\n🚂 View train information\n💬 Answer your questions\n\nJust ask me anything about the LRT system!`,
            timestamp: new Date(),
          };
          
        case 'affirmative':
          return {
            sender: 'bot',
            text: `Great! How can I help you?`,
            timestamp: new Date(),
          };
          
        case 'negative':
          return {
            sender: 'bot',
            text: `No problem! Let me know if you need anything else.`,
            timestamp: new Date(),
          };
          
        case 'help':
          return {
            sender: 'bot',
            text: `I can help you with:\n\n📍 Track trains in real-time\n🎫 Book new tickets\n📋 View your bookings\n🕐 Check train schedules\n📢 Get latest notices\n🚂 View train information\n\nJust ask me what you need!`,
            timestamp: new Date(),
          };
          
        case 'booking':
          return await this.handleBookingIntent(baseUrl);
          
        case 'schedule':
          return await this.handleScheduleIntent(baseUrl, userMessage);
          
        case 'tracking':
          return await this.handleTrackingIntent(baseUrl);
          
        case 'myTickets':
          return await this.handleMyTicketsIntent(baseUrl);
          
        case 'notices':
          return await this.handleNoticesIntent(baseUrl);
          
        // Delay intent removed - redirected to train info
          
        case 'trainInfo':
          return await this.handleTrainInfoIntent(baseUrl);
          
        default:
          return {
            sender: 'bot',
            text: `I'm not quite sure what you mean, but I'm here to help! 😊\n\nYou can ask me about:\n• Booking tickets\n• Tracking trains\n• Viewing your tickets\n• Train schedules\n• Latest notices\n• Train information\n\nOr just say "help" to see everything I can do!`,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        sender: 'bot',
        text: `I'm having trouble processing your request right now. Please try again in a moment.`,
        timestamp: new Date(),
      };
    }
  }

  // Handle booking intent
  async handleBookingIntent(baseUrl) {
    return {
      sender: 'bot',
      text: `I'll take you to the available trains where you can book a new ticket!`,
      timestamp: new Date(),
      actions: [
        {
          label: '🎫 Book a Ticket',
          onPress: () => ({ navigate: 'AvailableTrains' }),
        },
      ],
    };
  }

  // Handle schedule intent
  async handleScheduleIntent(baseUrl, userMessage) {
    try {
      // Use cached data if available and fresh
      let schedules;
      if (this.cache.schedules && (Date.now() - this.cache.lastUpdate.schedules < this.CACHE_DURATION)) {
        console.log('Chatbot: Using cached schedules data');
        schedules = this.cache.schedules;
      } else {
        // Fetch fresh data
        const response = await axios.get(`${baseUrl}/api/routes`, { timeout: 5000 });
        this.cache.schedules = response.data;
        this.cache.lastUpdate.schedules = Date.now();
        schedules = response.data;
      }
      
      if (schedules.length === 0) {
        return {
          sender: 'bot',
          text: `No schedules are available at the moment.`,
          timestamp: new Date(),
        };
      }
      
      // Extract station names from message if present
      const stations = this.extractStations(userMessage);
      let filteredSchedules = schedules;
      
      if (stations.from || stations.to) {
        filteredSchedules = schedules.filter(schedule => {
          const matchFrom = !stations.from || 
            schedule.from?.toLowerCase().includes(stations.from.toLowerCase());
          const matchTo = !stations.to || 
            schedule.to?.toLowerCase().includes(stations.to.toLowerCase());
          return matchFrom && matchTo;
        });
      }
      
      if (filteredSchedules.length === 0) {
        return {
          sender: 'bot',
          text: `I couldn't find schedules matching your criteria. Would you like to see all schedules?`,
          timestamp: new Date(),
          actions: [
            {
              label: 'View All Schedules',
              onPress: () => ({ navigate: 'Schedules' }),
            },
          ],
        };
      }
      
      const schedulesList = filteredSchedules.slice(0, 3).map((schedule, idx) => 
        `${idx + 1}. ${schedule.trainName || 'Unknown Train'}\n   ${schedule.from || 'N/A'} → ${schedule.to || 'N/A'}\n   Departure: ${schedule.departureTime || 'N/A'}`
      ).join('\n\n');
      
      return {
        sender: 'bot',
        text: `Here are the available schedules:\n\n${schedulesList}\n\nWould you like to see more details?`,
        timestamp: new Date(),
        actions: [
          {
            label: 'View All Schedules',
            onPress: () => ({ navigate: 'Schedules' }),
          },
        ],
      };
    } catch (_error) {
      return {
        sender: 'bot',
        text: `I'm having trouble fetching schedules. Please check the Schedules section from your dashboard.`,
        timestamp: new Date(),
      };
    }
  }

  // Handle tracking intent
  async handleTrackingIntent(baseUrl) {
    return {
      sender: 'bot',
      text: `I'll take you to the live tracking section where you can see all trains in real-time!`,
      timestamp: new Date(),
      actions: [
        {
          label: '📍 Go to Live Tracking',
          onPress: () => ({ navigate: 'Live Tracking' }),
        },
      ],
    };
  }

  // Handle my tickets intent
  async handleMyTicketsIntent(baseUrl) {
    return {
      sender: 'bot',
      text: `I'll show you your tickets section where you can view all your booked tickets!`,
      timestamp: new Date(),
      actions: [
        {
          label: '🎫 View Your Tickets',
          onPress: () => ({ navigate: 'Tickets' }),
        },
      ],
    };
  }

  // Handle notices intent
  async handleNoticesIntent(baseUrl) {
    try {
      // Use cached data if available and fresh
      let notices;
      if (this.cache.notices && (Date.now() - this.cache.lastUpdate.notices < this.CACHE_DURATION)) {
        console.log('Chatbot: Using cached notices data');
        notices = this.cache.notices;
      } else {
        // Fetch fresh data
        const response = await axios.get(`${baseUrl}/api/notices`, { timeout: 5000 });
        this.cache.notices = response.data;
        this.cache.lastUpdate.notices = Date.now();
        notices = response.data;
      }
      
      if (notices.length === 0) {
        return {
          sender: 'bot',
          text: `There are no notices at the moment.`,
          timestamp: new Date(),
        };
      }
      
      const noticesList = notices.slice(0, 2).map((notice, idx) => 
        `${idx + 1}. *${notice.title}*\n   ${notice.content}`
      ).join('\n\n');
      
      return {
        sender: 'bot',
        text: `Here are the latest notices:\n\n${noticesList}`,
        timestamp: new Date(),
        actions: [
          {
            label: 'View All Notices',
            onPress: () => ({ navigate: 'Notices' }),
          },
        ],
      };
    } catch (_error) {
      return {
        sender: 'bot',
        text: `I'm having trouble fetching notices. Please check the Notices section from your dashboard.`,
        timestamp: new Date(),
      };
    }
  }

  // Delay prediction feature removed as per user request

  // Handle train info intent
  async handleTrainInfoIntent(baseUrl) {
    try {
      // Use cached data if available and fresh
      let trains;
      if (this.cache.trains && (Date.now() - this.cache.lastUpdate.trains < this.CACHE_DURATION)) {
        console.log('Chatbot: Using cached trains data for info');
        trains = this.cache.trains;
      } else {
        // Fetch fresh data
        const response = await axios.get(`${baseUrl}/api/trains`, { timeout: 5000 });
        this.cache.trains = response.data;
        this.cache.lastUpdate.trains = Date.now();
        trains = response.data;
      }
      
      if (trains.length === 0) {
        return {
          sender: 'bot',
          text: `No train information is available at the moment.`,
          timestamp: new Date(),
        };
      }
      
      const activeTrains = trains.filter(t => t.status === 'Active');
      const totalTrains = trains.length;
      
      if (activeTrains.length === 0) {
        return {
          sender: 'bot',
          text: `There are ${totalTrains} trains in the system, but none are currently active.`,
          timestamp: new Date(),
          actions: [
            {
              label: 'View All Trains',
              onPress: () => ({ navigate: 'AvailableTrains' }),
            },
          ],
        };
      }
      
      const trainsList = activeTrains.slice(0, 3).map((train, idx) => 
        `${idx + 1}. ${train.name}\n   Type: ${train.type || 'N/A'}\n   Route: ${train.route || 'N/A'}\n   Status: ${train.status}`
      ).join('\n\n');
      
      return {
        sender: 'bot',
        text: `Currently, ${activeTrains.length} out of ${totalTrains} trains are active:\n\n${trainsList}`,
        timestamp: new Date(),
        actions: [
          {
            label: 'View All Trains',
            onPress: () => ({ navigate: 'AvailableTrains' }),
          },
        ],
      };
    } catch (_error) {
      return {
        sender: 'bot',
        text: `I'm having trouble fetching train information. Please try again later.`,
        timestamp: new Date(),
      };
    }
  }

  // Extract station names from message
  extractStations(message) {
    const lowerMessage = message.toLowerCase();
    const fromMatch = lowerMessage.match(/from\s+(\w+)/i);
    const toMatch = lowerMessage.match(/to\s+(\w+)/i);
    
    return {
      from: fromMatch ? fromMatch[1] : null,
      to: toMatch ? toMatch[1] : null,
    };
  }

  // Extract train identifier from message
  extractTrainIdentifier(message) {
    const trainMatch = message.match(/train\s+(\w+)/i);
    return trainMatch ? trainMatch[1] : null;
  }

  // Handle booking flow steps
  async handleBookingFlow(userMessage) {
    const baseUrl = await getServerBaseUrl().catch(() => null);
    
    // Check for cancel
    if (userMessage.toLowerCase().includes('cancel') || userMessage.toLowerCase().includes('stop')) {
      this.bookingState.active = false;
      this.bookingState.step = null;
      this.bookingState.selectedTrain = null;
      return {
        sender: 'bot',
        text: `Booking cancelled. How else can I help you?`,
        timestamp: new Date(),
      };
    }

    try {
      switch (this.bookingState.step) {
        case 'selectTrain':
          return await this.handleTrainSelection(userMessage, baseUrl);
        
        case 'enterPassengers':
          return await this.handlePassengerInfo(userMessage);
        
        case 'confirm':
          return await this.handleBookingConfirmation(userMessage, baseUrl);
        
        default:
          this.bookingState.active = false;
          return {
            sender: 'bot',
            text: `Something went wrong with the booking. Please try again.`,
            timestamp: new Date(),
          };
      }
    } catch (_error) {
      this.bookingState.active = false;
      return {
        sender: 'bot',
        text: `An error occurred during booking. Please try again.`,
        timestamp: new Date(),
      };
    }
  }

  // Handle train selection step
  async handleTrainSelection(userMessage, baseUrl) {
    const trainNumber = parseInt(userMessage.trim());
    
    if (isNaN(trainNumber) || trainNumber < 1) {
      return {
        sender: 'bot',
        text: `Please enter a valid train number (e.g., 1, 2, 3).`,
        timestamp: new Date(),
      };
    }

    // Get trains from cache
    const trains = this.cache.trains?.filter(t => t.status === 'Active') || [];
    
    if (trainNumber > trains.length) {
      return {
        sender: 'bot',
        text: `Invalid train number. Please select a number between 1 and ${trains.length}.`,
        timestamp: new Date(),
      };
    }

    const selectedTrain = trains[trainNumber - 1];
    this.bookingState.selectedTrain = selectedTrain;
    this.bookingState.step = 'enterPassengers';

    return {
      sender: 'bot',
      text: `Perfect! You selected ${selectedTrain.name}.\n\nNow, please enter passenger details in this format:\nName, Age, Gender\n\nExample: John Doe, 30, Male\n\n(You can add multiple passengers separated by semicolons)`,
      timestamp: new Date(),
      actions: [
        {
          label: '❌ Cancel Booking',
          onPress: () => ({ text: 'cancel' }),
        },
      ],
    };
  }

  // Handle passenger information step
  async handlePassengerInfo(userMessage) {
    // Parse passenger info
    const passengerEntries = userMessage.split(';').map(p => p.trim());
    const passengers = [];

    for (const entry of passengerEntries) {
      const parts = entry.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        passengers.push({
          name: parts[0],
          age: parts[1],
          gender: parts[2],
        });
      }
    }

    if (passengers.length === 0) {
      return {
        sender: 'bot',
        text: `I couldn't parse the passenger information. Please use the format:\nName, Age, Gender\n\nExample: John Doe, 30, Male`,
        timestamp: new Date(),
      };
    }

    this.bookingState.passengers = passengers;
    this.bookingState.step = 'confirm';

    const passengerList = passengers.map((p, idx) => 
      `${idx + 1}. ${p.name} (${p.age}, ${p.gender})`
    ).join('\n');

    return {
      sender: 'bot',
      text: `Great! Here's your booking summary:\n\nTrain: ${this.bookingState.selectedTrain.name}\nRoute: ${this.bookingState.selectedTrain.route}\n\nPassengers:\n${passengerList}\n\nReply with "confirm" to complete the booking or "cancel" to cancel.`,
      timestamp: new Date(),
      actions: [
        {
          label: '✅ Confirm Booking',
          onPress: () => ({ text: 'confirm' }),
        },
        {
          label: '❌ Cancel',
          onPress: () => ({ text: 'cancel' }),
        },
      ],
    };
  }

  // Handle booking confirmation
  async handleBookingConfirmation(userMessage, baseUrl) {
    if (!userMessage.toLowerCase().includes('confirm')) {
      return {
        sender: 'bot',
        text: `Please reply with "confirm" to complete the booking or "cancel" to cancel.`,
        timestamp: new Date(),
      };
    }

    try {
      const userId = this.userContext.userId;
      
      if (!userId) {
        this.bookingState.active = false;
        return {
          sender: 'bot',
          text: `You need to be logged in to complete the booking. Please log in and try again.`,
          timestamp: new Date(),
        };
      }

      // Create booking payload
      const bookingData = {
        userId: userId,
        trainId: this.bookingState.selectedTrain._id,
        trainDetails: {
          trainName: this.bookingState.selectedTrain.name,
          route: this.bookingState.selectedTrain.route,
          trainNumber: this.bookingState.selectedTrain.trainNumber || 'N/A',
        },
        passengerDetails: this.bookingState.passengers,
        seatInfo: {
          seatNumber: `S${Math.floor(Math.random() * 100) + 1}`,
          coach: `C${Math.floor(Math.random() * 10) + 1}`,
        },
        paymentDetails: {
          amount: this.bookingState.passengers.length * 50,
          method: 'Chatbot',
          status: 'Completed',
        },
        status: 'Confirmed',
      };

      // Submit booking
      const response = await axios.post(`${baseUrl}/api/tickets`, bookingData, { timeout: 10000 });

      // Reset booking state
      this.bookingState.active = false;
      this.bookingState.step = null;
      this.bookingState.selectedTrain = null;
      this.bookingState.passengers = [];

      if (response.data && response.data.ticket) {
        return {
          sender: 'bot',
          text: `🎉 Booking successful!\n\nTicket ID: ${response.data.ticket._id}\nTrain: ${bookingData.trainDetails.trainName}\nPassengers: ${bookingData.passengerDetails.length}\nTotal Amount: $${bookingData.paymentDetails.amount}\n\nYou can view your ticket in the "My Tickets" section!`,
          timestamp: new Date(),
          actions: [
            {
              label: '🎫 View My Tickets',
              onPress: () => ({ navigate: 'Tickets' }),
            },
          ],
        };
      }

      return {
        sender: 'bot',
        text: `🎉 Booking completed! Your ticket has been created. Check "My Tickets" to view it.`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.bookingState.active = false;
      console.error('Booking error:', error);
      return {
        sender: 'bot',
        text: `Sorry, there was an error completing your booking. Please try again or use the regular booking screen.`,
        timestamp: new Date(),
      };
    }
  }

  // Get offline responses for simple intents
  getOfflineResponse(intentType) {
    const responses = {
      greeting: {
        sender: 'bot',
        text: `Hello! How can I help you with your LRT journey today?`,
        timestamp: new Date(),
      },
      thanks: {
        sender: 'bot',
        text: `You're welcome! Is there anything else I can help you with?`,
        timestamp: new Date(),
      },
      goodbye: {
        sender: 'bot',
        text: `Goodbye! Have a safe journey! Feel free to come back if you need any help. 👋`,
        timestamp: new Date(),
      },
      howareyu: {
        sender: 'bot',
        text: `I'm doing great, thank you for asking! 😊 I'm here and ready to help you with your LRT journey. How can I assist you today?`,
        timestamp: new Date(),
      },
      about: {
        sender: 'bot',
        text: `I'm your LRT Virtual Assistant! 🤖 I'm here to help you with everything related to the Light Rail Transit system - from booking tickets to tracking trains. I can answer your questions, help you navigate the system, and make your journey smoother!`,
        timestamp: new Date(),
      },
      capabilities: {
        sender: 'bot',
        text: `Here's what I can do for you:\n\n🎫 Book train tickets\n📍 Track trains in real-time\n🎫 View your tickets\n🕒 Check train schedules\n📢 Get latest notices and updates\n🚂 View train information\n💬 Answer your questions\n\nJust ask me anything about the LRT system!`,
        timestamp: new Date(),
      },
      affirmative: {
        sender: 'bot',
        text: `Great! How can I help you?`,
        timestamp: new Date(),
      },
      negative: {
        sender: 'bot',
        text: `No problem! Let me know if you need anything else.`,
        timestamp: new Date(),
      },
      help: {
        sender: 'bot',
        text: `I can help you with:\n\n📍 Track trains in real-time\n🎫 Book new tickets\n📋 View your bookings\n🕐 Check train schedules\n📢 Get latest notices\n🚂 View train information\n\nJust ask me what you need!`,
        timestamp: new Date(),
      },
    };
    return responses[intentType] || responses.help;
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get quick action suggestions
  getQuickActions() {
    return [
      {
        label: 'Book Ticket',
        icon: 'ticket-outline',
        text: 'I want to book a ticket',
      },
      {
        label: 'Track Train',
        icon: 'location-outline',
        text: 'Track my train',
      },
      {
        label: 'My Tickets',
        icon: 'list-outline',
        text: 'Show my tickets',
      },
      {
        label: 'Schedules',
        icon: 'time-outline',
        text: 'Show train schedules',
      },
      {
        label: 'Notices',
        icon: 'notifications-outline',
        text: 'Show latest notices',
      },
      {
        label: 'Train Info',
        icon: 'train-outline',
        text: 'Show available trains',
      },
    ];
  }
}

export default new ChatbotService();
