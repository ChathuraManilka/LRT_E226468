# LRT Intelligent Chatbot - User Guide

## Overview

The LRT Intelligent Chatbot is a fully functional AI-powered assistant integrated into the Intelligent LRT mobile application. It provides users with natural language interaction to access all dashboard functions seamlessly.

## Features

### 🤖 Natural Language Processing
- Understands user intent from natural language queries
- Supports multiple query patterns and variations
- Context-aware responses based on user input

### 🎯 Supported Functions

#### 1. **Ticket Booking**
- Query examples:
  - "I want to book a ticket"
  - "Book a train from Station A to Station B"
  - "Reserve a seat for tomorrow"
- Features:
  - Shows available trains
  - Filters by route if specified
  - Direct navigation to booking screen

#### 2. **Live Train Tracking**
- Query examples:
  - "Track my train"
  - "Where is train Express 101?"
  - "Show live train locations"
- Features:
  - Real-time train location information
  - Status updates
  - Direct navigation to live tracking map

#### 3. **Schedule Information**
- Query examples:
  - "Show train schedules"
  - "What time does the train leave from Station A?"
  - "Schedules from Station A to Station B"
- Features:
  - Displays train timetables
  - Filters by route
  - Shows departure and arrival times

#### 4. **My Tickets**
- Query examples:
  - "Show my tickets"
  - "My bookings"
  - "What tickets do I have?"
- Features:
  - Lists all user bookings
  - Shows booking status
  - Provides ticket details

#### 5. **Notices & Announcements**
- Query examples:
  - "Show latest notices"
  - "Any announcements?"
  - "What's new?"
- Features:
  - Displays recent notices
  - Shows important updates
  - System announcements

#### 6. **Delay Predictions**
- Query examples:
  - "Check for delays"
  - "Is my train on time?"
  - "Predict delays"
- Features:
  - ML-based delay predictions
  - Train status information
  - Direct navigation to delay prediction screen

#### 7. **Train Information**
- Query examples:
  - "Show available trains"
  - "Tell me about train Express 101"
  - "How many trains are running?"
- Features:
  - Lists active trains
  - Provides train details
  - Shows capacity and route information

#### 8. **Station Information**
- Query examples:
  - "Tell me about Station A"
  - "Show all stations"
- Features:
  - Station details
  - Location information

## User Interface

### Chat Interface
- **Message Bubbles**: Distinct styling for user and bot messages
- **Avatars**: Visual indicators for user and assistant
- **Typing Indicator**: Shows when the bot is processing
- **Quick Actions**: Pre-defined buttons for common queries

### Quick Action Buttons
1. 📍 Book Ticket
2. 🚆 Track Train
3. 📋 My Tickets
4. 🕐 Schedules
5. 📢 Notices
6. ⏱️ Delay Info

### Floating Chat Button
- Accessible from the user dashboard
- Always visible for quick access
- Smooth animations and transitions

## Technical Architecture

### Frontend Components

#### 1. **ChatBot.js** (`src/components/ChatBot.js`)
- Main chat interface component
- Handles message rendering
- Manages user input
- Displays quick actions
- Supports rich message types (text, lists, cards)

#### 2. **ChatBotScreen.js** (`src/screens/user/ChatBotScreen.js`)
- Screen wrapper for the chatbot
- Manages conversation state
- Integrates with navigation
- Handles user context

#### 3. **FloatingChatButton.js** (`src/components/FloatingChatButton.js`)
- Floating action button
- Provides quick access to chatbot
- Animated interactions

### Backend Services

#### 1. **chatbotService.js** (`src/services/chatbotService.js`)
- Client-side chatbot logic
- Intent analysis
- Response generation
- Context management
- API integration

#### 2. **chatbotRoutes.js** (`server/routes/chatbotRoutes.js`)
- Server-side chatbot API
- Advanced query processing
- Database integration
- Entity extraction
- Response formatting

### Intent Recognition

The chatbot uses pattern matching and keyword analysis to identify user intent:

```javascript
Intent Types:
- greeting: Hello, Hi, Hey
- booking: Book, ticket, reserve
- schedule: Schedule, timetable, timing
- tracking: Track, location, where
- myTickets: My ticket, my booking
- notices: Notice, announcement, news
- delay: Delay, late, predict
- trainInfo: Train, available, running
- stationInfo: Station, stop
- help: Help, what can you do
```

### Entity Extraction

The system extracts relevant entities from user queries:

- **Station names**: "from Station A to Station B"
- **Train names**: "train Express 101"
- **Dates**: "for tomorrow", "on 12/25/2024"
- **Times**: "at 3 PM"

## API Endpoints

### POST `/api/chatbot/query`
Process a chatbot query

**Request:**
```json
{
  "message": "Book a ticket from Station A to Station B",
  "userId": "user_id_here"
}
```

**Response:**
```json
{
  "message": "Here are the available trains...",
  "type": "list",
  "data": [...]
}
```

### GET `/api/chatbot/suggestions`
Get quick action suggestions

**Response:**
```json
[
  {
    "text": "Book a ticket",
    "icon": "ticket-outline"
  },
  ...
]
```

## Message Types

### 1. Text Messages
Simple text responses

### 2. List Messages
Structured data with multiple items (trains, schedules, tickets)

### 3. Action Messages
Messages with interactive buttons for navigation

### 4. Rich Data Messages
Embedded cards showing:
- Train information
- Ticket details
- Schedule information
- Notice content

## Navigation Integration

The chatbot seamlessly integrates with the app's navigation:

- **AvailableTrains**: View and book trains
- **Live Tracking**: Real-time train tracking
- **Tickets**: User's bookings
- **Schedules**: Train timetables
- **Notices**: System announcements
- **DelayPrediction**: ML-based delay predictions

## Usage Examples

### Example 1: Booking a Ticket
```
User: "I want to book a ticket"
Bot: "Here are the available trains:
     1. Express 101 - Route A
     2. Local 202 - Route B
     Would you like to proceed with booking?"
[View All Trains Button]
```

### Example 2: Checking Schedule
```
User: "Show schedules from Station A to Station B"
Bot: "Here are the schedules:
     1. Express 101
        Station A → Station B
        Departure: 09:00 AM"
[View All Schedules Button]
```

### Example 3: Tracking a Train
```
User: "Track train Express 101"
Bot: "Train Express 101 is currently active.
     Route: Station A to Station D
     Status: On Time
     Open live tracking to see its location on the map."
[Open Live Tracking Button]
```

### Example 4: Viewing Notices
```
User: "Show latest notices"
Bot: "Here's the latest notice:
     Title: Service Update
     Content: All trains running on schedule today."
[View All Notices Button]
```

## Best Practices

### For Users
1. Use natural language - the bot understands conversational queries
2. Be specific when asking about routes or trains
3. Use quick action buttons for common tasks
4. Check the suggestions if unsure what to ask

### For Developers
1. Keep intent patterns updated
2. Add new intents as features expand
3. Test with various query patterns
4. Monitor chatbot analytics
5. Update entity extraction for new data types

## Customization

### Adding New Intents

1. **Update Intent Analysis** (`chatbotService.js`):
```javascript
if (lowerMessage.includes('new_keyword')) {
  return { type: 'newIntent', confidence: 0.9 };
}
```

2. **Add Response Handler**:
```javascript
case 'newIntent':
  return await handleNewIntent(baseUrl);
```

3. **Implement Handler Function**:
```javascript
async handleNewIntent(baseUrl) {
  // Your logic here
  return {
    sender: 'bot',
    text: 'Response message',
    timestamp: new Date(),
  };
}
```

### Adding Quick Actions

Update the `getQuickActions()` method in `chatbotService.js`:
```javascript
{
  label: 'New Action',
  icon: 'icon-name',
  text: 'Query text to send',
}
```

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check server connection
   - Verify API endpoints are accessible
   - Check console for errors

2. **Navigation not working**
   - Ensure screen names match navigation configuration
   - Verify navigation prop is passed correctly

3. **Intent not recognized**
   - Add more keyword patterns
   - Check message preprocessing
   - Review intent analysis logic

## Future Enhancements

- [ ] Voice input support
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Conversation history persistence
- [ ] Advanced ML-based intent recognition
- [ ] Personalized recommendations
- [ ] Integration with payment systems
- [ ] Push notification support
- [ ] Analytics dashboard

## Support

For issues or questions:
- Check the main README.md
- Review the code documentation
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Developed for**: Intelligent LRT System
