const express = require('express');
const router = express.Router();
const Train = require('../models/Train');
const Route = require('../models/Route');
const Notice = require('../models/Notice');
const Ticket = require('../models/Ticket');
const Station = require('../models/Station');

// Process chatbot query
router.post('/query', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const intent = analyzeIntent(message);
    const response = await generateResponse(intent, message, userId);
    
    res.json(response);
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      message: 'I encountered an error processing your request. Please try again.'
    });
  }
});

// Get chatbot suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      { text: 'Book a ticket', icon: 'ticket-outline' },
      { text: 'Track my train', icon: 'location-outline' },
      { text: 'Show schedules', icon: 'time-outline' },
      { text: 'View notices', icon: 'notifications-outline' },
      { text: 'Check delays', icon: 'alert-circle-outline' },
      { text: 'My bookings', icon: 'list-outline' },
    ];
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Analyze user intent
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Booking patterns
  if (/book|ticket|reserve|buy|purchase/.test(lowerMessage)) {
    return { type: 'booking', entities: extractBookingEntities(message) };
  }
  
  // Schedule patterns
  if (/schedule|timetable|timing|when|time/.test(lowerMessage)) {
    return { type: 'schedule', entities: extractScheduleEntities(message) };
  }
  
  // Tracking patterns
  if (/track|location|where|live|real-time|position/.test(lowerMessage)) {
    return { type: 'tracking', entities: extractTrainEntities(message) };
  }
  
  // My tickets patterns
  if (/my ticket|my booking|booked|reserved/.test(lowerMessage)) {
    return { type: 'myTickets', entities: {} };
  }
  
  // Notices patterns
  if (/notice|announcement|news|update|alert/.test(lowerMessage)) {
    return { type: 'notices', entities: {} };
  }
  
  // Delay patterns
  if (/delay|late|predict|on time/.test(lowerMessage)) {
    return { type: 'delay', entities: extractTrainEntities(message) };
  }
  
  // Train info patterns
  if (/train|available|running/.test(lowerMessage)) {
    return { type: 'trainInfo', entities: extractTrainEntities(message) };
  }
  
  // Station info patterns
  if (/station|stop/.test(lowerMessage)) {
    return { type: 'stationInfo', entities: extractStationEntities(message) };
  }
  
  // Help patterns
  if (/help|what can|how to/.test(lowerMessage)) {
    return { type: 'help', entities: {} };
  }
  
  // Greeting patterns
  if (/hello|hi|hey|good morning|good afternoon|good evening/.test(lowerMessage)) {
    return { type: 'greeting', entities: {} };
  }
  
  return { type: 'unknown', entities: {} };
}

// Extract booking entities
function extractBookingEntities(message) {
  const entities = {};
  
  // Extract station names
  const fromMatch = message.match(/from\s+(\w+)/i);
  const toMatch = message.match(/to\s+(\w+)/i);
  
  if (fromMatch) entities.from = fromMatch[1];
  if (toMatch) entities.to = toMatch[1];
  
  // Extract date
  const dateMatch = message.match(/(?:on|for)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (dateMatch) entities.date = dateMatch[1];
  
  return entities;
}

// Extract schedule entities
function extractScheduleEntities(message) {
  const entities = {};
  
  const fromMatch = message.match(/from\s+(\w+)/i);
  const toMatch = message.match(/to\s+(\w+)/i);
  
  if (fromMatch) entities.from = fromMatch[1];
  if (toMatch) entities.to = toMatch[1];
  
  return entities;
}

// Extract train entities
function extractTrainEntities(message) {
  const entities = {};
  
  const trainMatch = message.match(/train\s+(\w+)/i);
  if (trainMatch) entities.trainName = trainMatch[1];
  
  return entities;
}

// Extract station entities
function extractStationEntities(message) {
  const entities = {};
  
  const stationMatch = message.match(/station\s+(\w+)/i);
  if (stationMatch) entities.stationName = stationMatch[1];
  
  return entities;
}

// Generate response based on intent
async function generateResponse(intent, message, userId) {
  try {
    switch (intent.type) {
      case 'greeting':
        return {
          message: 'Hello! How can I assist you with your LRT journey today?',
          type: 'text'
        };
        
      case 'help':
        return {
          message: 'I can help you with:\n\n• Booking tickets\n• Tracking trains\n• Checking schedules\n• Viewing notices\n• Predicting delays\n• Managing your bookings\n\nWhat would you like to do?',
          type: 'text'
        };
        
      case 'booking':
        return await handleBookingIntent(intent.entities);
        
      case 'schedule':
        return await handleScheduleIntent(intent.entities);
        
      case 'tracking':
        return await handleTrackingIntent(intent.entities);
        
      case 'myTickets':
        return await handleMyTicketsIntent(userId);
        
      case 'notices':
        return await handleNoticesIntent();
        
      case 'delay':
        return await handleDelayIntent(intent.entities);
        
      case 'trainInfo':
        return await handleTrainInfoIntent(intent.entities);
        
      case 'stationInfo':
        return await handleStationInfoIntent(intent.entities);
        
      default:
        return {
          message: 'I\'m not sure I understand. Could you please rephrase that? You can ask me about booking tickets, train schedules, live tracking, or notices.',
          type: 'text'
        };
    }
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      message: 'I encountered an error processing your request. Please try again.',
      type: 'text'
    };
  }
}

// Handle booking intent
async function handleBookingIntent(entities) {
  try {
    const query = {};
    if (entities.from || entities.to) {
      // Find routes matching the criteria
      const routes = await Route.find(query).populate('trainId');
      
      if (routes.length > 0) {
        const routeList = routes.slice(0, 3).map((route, idx) => 
          `${idx + 1}. ${route.trainId?.name || 'Unknown'} - ${route.from} to ${route.to}`
        ).join('\n');
        
        return {
          message: `I found these routes for you:\n\n${routeList}\n\nWould you like to proceed with booking?`,
          type: 'list',
          data: routes.slice(0, 3).map(r => ({
            id: r._id,
            name: r.trainId?.name,
            from: r.from,
            to: r.to
          }))
        };
      }
    }
    
    const trains = await Train.find({ status: 'Active' }).limit(5);
    
    if (trains.length === 0) {
      return {
        message: 'No trains are currently available for booking. Please check back later.',
        type: 'text'
      };
    }
    
    const trainList = trains.map((train, idx) => 
      `${idx + 1}. ${train.name} - ${train.route}`
    ).join('\n');
    
    return {
      message: `Here are the available trains:\n\n${trainList}\n\nWhich train would you like to book?`,
      type: 'list',
      data: trains.map(t => ({
        id: t._id,
        name: t.name,
        route: t.route,
        type: t.type
      }))
    };
  } catch (error) {
    console.error('Booking intent error:', error);
    return {
      message: 'I\'m having trouble fetching available trains. Please try the booking section.',
      type: 'text'
    };
  }
}

// Handle schedule intent
async function handleScheduleIntent(entities) {
  try {
    let query = {};
    
    if (entities.from) {
      query.from = new RegExp(entities.from, 'i');
    }
    if (entities.to) {
      query.to = new RegExp(entities.to, 'i');
    }
    
    const schedules = await Route.find(query).populate('trainId').limit(5);
    
    if (schedules.length === 0) {
      return {
        message: 'No schedules found matching your criteria. Would you like to see all schedules?',
        type: 'text'
      };
    }
    
    const scheduleList = schedules.map((schedule, idx) => 
      `${idx + 1}. ${schedule.trainId?.name || 'Unknown'}\n   ${schedule.from} → ${schedule.to}\n   Departure: ${schedule.departureTime || 'N/A'}`
    ).join('\n\n');
    
    return {
      message: `Here are the schedules:\n\n${scheduleList}`,
      type: 'list',
      data: schedules.map(s => ({
        id: s._id,
        trainName: s.trainId?.name,
        from: s.from,
        to: s.to,
        departureTime: s.departureTime
      }))
    };
  } catch (error) {
    console.error('Schedule intent error:', error);
    return {
      message: 'I\'m having trouble fetching schedules. Please check the schedules section.',
      type: 'text'
    };
  }
}

// Handle tracking intent
async function handleTrackingIntent(entities) {
  try {
    let query = { status: 'Active' };
    
    if (entities.trainName) {
      query.name = new RegExp(entities.trainName, 'i');
    }
    
    const trains = await Train.find(query);
    
    if (trains.length === 0) {
      return {
        message: 'No active trains found for tracking.',
        type: 'text'
      };
    }
    
    if (trains.length === 1) {
      const train = trains[0];
      return {
        message: `Train ${train.name} is currently active.\n\nRoute: ${train.route}\nStatus: ${train.status}\n\nOpen live tracking to see its location on the map.`,
        type: 'train',
        data: {
          id: train._id,
          name: train.name,
          route: train.route,
          status: train.status
        }
      };
    }
    
    const trainList = trains.map((train, idx) => 
      `${idx + 1}. ${train.name} - ${train.route}`
    ).join('\n');
    
    return {
      message: `${trains.length} trains are currently active:\n\n${trainList}\n\nOpen live tracking to see their locations.`,
      type: 'list',
      data: trains.map(t => ({
        id: t._id,
        name: t.name,
        route: t.route
      }))
    };
  } catch (error) {
    console.error('Tracking intent error:', error);
    return {
      message: 'I\'m having trouble accessing live tracking. Please try the tracking section.',
      type: 'text'
    };
  }
}

// Handle my tickets intent
async function handleMyTicketsIntent(userId) {
  try {
    if (!userId) {
      return {
        message: 'Please log in to view your tickets.',
        type: 'text'
      };
    }
    
    const bookings = await Ticket.find({ userId }).sort({ createdAt: -1 }).limit(5);
    
    if (bookings.length === 0) {
      return {
        message: 'You don\'t have any bookings yet. Would you like to book a ticket?',
        type: 'text'
      };
    }
    
    const bookingList = bookings.map((booking, idx) => 
      `${idx + 1}. ${booking.trainDetails?.trainName || 'Unknown'}\n   From: ${booking.trainDetails?.from} → To: ${booking.trainDetails?.to}\n   Date: ${booking.trainDetails?.date}\n   Status: ${booking.status}`
    ).join('\n\n');
    
    return {
      message: `Here are your recent bookings:\n\n${bookingList}`,
      type: 'list',
      data: bookings.map(b => ({
        id: b._id,
        trainName: b.trainDetails?.trainName,
        from: b.trainDetails?.from,
        to: b.trainDetails?.to,
        date: b.trainDetails?.date,
        status: b.status
      }))
    };
  } catch (error) {
    console.error('My tickets intent error:', error);
    return {
      message: 'I\'m having trouble fetching your tickets. Please check the tickets section.',
      type: 'text'
    };
  }
}

// Handle notices intent
async function handleNoticesIntent() {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(3);
    
    if (notices.length === 0) {
      return {
        message: 'There are no notices at the moment.',
        type: 'text'
      };
    }
    
    const noticeList = notices.map((notice, idx) => 
      `${idx + 1}. ${notice.title}\n   ${notice.content}`
    ).join('\n\n');
    
    return {
      message: `Here are the latest notices:\n\n${noticeList}`,
      type: 'list',
      data: notices.map(n => ({
        id: n._id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt
      }))
    };
  } catch (error) {
    console.error('Notices intent error:', error);
    return {
      message: 'I\'m having trouble fetching notices. Please check the notices section.',
      type: 'text'
    };
  }
}

// Handle delay intent
async function handleDelayIntent(entities) {
  try {
    let query = { status: 'Active' };
    
    if (entities.trainName) {
      query.name = new RegExp(entities.trainName, 'i');
    }
    
    const trains = await Train.find(query);
    
    if (trains.length === 0) {
      return {
        message: 'No active trains found to check for delays.',
        type: 'text'
      };
    }
    
    return {
      message: 'I can help you check delay predictions using our ML model. Please use the Delay Prediction feature from the dashboard for detailed analysis.',
      type: 'text'
    };
  } catch (error) {
    console.error('Delay intent error:', error);
    return {
      message: 'I\'m having trouble accessing delay predictions. Please try again later.',
      type: 'text'
    };
  }
}

// Handle train info intent
async function handleTrainInfoIntent(entities) {
  try {
    let query = {};
    
    if (entities.trainName) {
      query.name = new RegExp(entities.trainName, 'i');
    }
    
    const trains = await Train.find(query);
    
    if (trains.length === 0) {
      return {
        message: 'No trains found matching your criteria.',
        type: 'text'
      };
    }
    
    const activeTrains = trains.filter(t => t.status === 'Active').length;
    
    if (trains.length === 1) {
      const train = trains[0];
      return {
        message: `Train: ${train.name}\nType: ${train.type}\nRoute: ${train.route}\nStatus: ${train.status}\nCapacity: ${train.capacity || 'N/A'}`,
        type: 'train',
        data: {
          id: train._id,
          name: train.name,
          type: train.type,
          route: train.route,
          status: train.status,
          capacity: train.capacity
        }
      };
    }
    
    return {
      message: `Found ${trains.length} trains (${activeTrains} active). Use the Available Trains section to see more details.`,
      type: 'text'
    };
  } catch (error) {
    console.error('Train info intent error:', error);
    return {
      message: 'I\'m having trouble fetching train information. Please try again later.',
      type: 'text'
    };
  }
}

// Handle station info intent
async function handleStationInfoIntent(entities) {
  try {
    let query = {};
    
    if (entities.stationName) {
      query.name = new RegExp(entities.stationName, 'i');
    }
    
    const stations = await Station.find(query);
    
    if (stations.length === 0) {
      return {
        message: 'No stations found matching your criteria.',
        type: 'text'
      };
    }
    
    if (stations.length === 1) {
      const station = stations[0];
      return {
        message: `Station: ${station.name}\nLocation: ${station.location?.coordinates?.latitude || 'N/A'}, ${station.location?.coordinates?.longitude || 'N/A'}`,
        type: 'station',
        data: {
          id: station._id,
          name: station.name,
          location: station.location
        }
      };
    }
    
    const stationList = stations.map((station, idx) => 
      `${idx + 1}. ${station.name}`
    ).join('\n');
    
    return {
      message: `Found ${stations.length} stations:\n\n${stationList}`,
      type: 'list',
      data: stations.map(s => ({
        id: s._id,
        name: s.name
      }))
    };
  } catch (error) {
    console.error('Station info intent error:', error);
    return {
      message: 'I\'m having trouble fetching station information. Please try again later.',
      type: 'text'
    };
  }
}

module.exports = router;
