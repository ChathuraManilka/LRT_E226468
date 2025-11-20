# Chatbot Testing Guide

## ✅ Recent Fixes Applied

### Issues Fixed:
1. ✅ Removed all mentions of "Predicting delays" from welcome and help messages
2. ✅ Changed floating button icon to person icon (person-circle)
3. ✅ Enhanced inline data display for all intents
4. ✅ Improved ticket fetching to use backend API
5. ✅ Better formatting for schedules, notices, and train info

---

## 🧪 How to Test the Chatbot

### Step 1: Ensure Backend is Running
```bash
cd "c:\Paid Assignments\LRT Final\intelligent-lrt\server"
npm start
```

**Expected Output:**
```
Connected to MongoDB
Server is running on port 5001
```

### Step 2: Start the Frontend
```bash
cd "c:\Paid Assignments\LRT Final\intelligent-lrt"
npx expo start
```

### Step 3: Login to the App
- Use your test credentials
- Navigate to User Dashboard

### Step 4: Open Chatbot
- Click the **person icon** (bottom-right corner)
- You should see the welcome message

---

## 📝 Test Queries

### Test 1: Welcome Message
**Action:** Open chatbot
**Expected Response:**
```
Hello [Your Name]! 👋 I'm your LRT Assistant. I can help you with:

• Booking tickets
• Checking train schedules
• Tracking trains in real-time
• Viewing your tickets
• Getting latest notices
• Viewing train information

I can show you information right here or navigate to detailed screens. How can I assist you today?
```

### Test 2: Help Command
**Query:** "help"
**Expected Response:**
```
I can help you with:

📍 Track trains in real-time
🎫 Book new tickets
📋 View your bookings
🕐 Check train schedules
📢 Get latest notices
🚂 View train information

Just ask me what you need!
```

### Test 3: Booking Tickets
**Query:** "I want to book a ticket"
**Expected Response:**
- List of 3 available active trains
- Format: "1. [Train Name] - [Route]"
- Button: "View All Trains"

### Test 4: Train Schedules
**Query:** "Show train schedules"
**Expected Response:**
- List of up to 3 schedules
- Format showing train name, from → to, departure time
- Button: "View All Schedules"

**Advanced Query:** "Show schedules from Station A to Station B"
**Expected:** Filtered results

### Test 5: Live Tracking
**Query:** "Track my train"
**Expected Response:**
- Number of active trains
- Button: "Open Live Tracking"

### Test 6: My Tickets
**Query:** "Show my tickets"
**Expected Response:**
- If user has tickets: List of bookings with details
- If no tickets: "You don't have any bookings yet"
- Button: "View All Tickets" or "View My Tickets"

### Test 7: Latest Notices
**Query:** "Show latest notices"
**Expected Response:**
- Up to 2 latest notices
- Format: "1. *[Title]*\n   [Content]"
- Button: "View All Notices"

### Test 8: Train Information
**Query:** "Show available trains"
**Expected Response:**
- Count of active vs total trains
- List of up to 3 active trains with details
- Format showing name, type, route, status
- Button: "View All Trains"

### Test 9: Station Info
**Query:** "Tell me about stations"
**Expected Response:**
- Station information if available
- Navigation option

### Test 10: Greeting
**Query:** "Hello"
**Expected Response:**
```
Hello! How can I help you with your LRT journey today?
```

### Test 11: Thank You
**Query:** "Thanks"
**Expected Response:**
```
You're welcome! Is there anything else I can help you with?
```

### Test 12: Unknown Query
**Query:** "xyz random text"
**Expected Response:**
```
I'm not sure I understand. Could you please rephrase that? You can ask me about:
• Booking tickets
• Train schedules
• Live tracking
• Your tickets
• Notices and updates
```

---

## 🎯 Quick Actions Testing

Click each quick action button and verify:

1. **Book Ticket** → Shows available trains
2. **Track Train** → Shows tracking info
3. **My Tickets** → Shows user's tickets
4. **Schedules** → Shows train schedules
5. **Notices** → Shows latest notices
6. **Train Info** → Shows train information

---

## 🔍 What to Check

### Visual Elements:
- ✅ Person icon visible on dashboard (bottom-right)
- ✅ Chat interface opens smoothly
- ✅ Message bubbles display correctly
- ✅ Bot avatar shows chatbubble icon
- ✅ User avatar shows person icon
- ✅ Quick action buttons visible
- ✅ Action buttons (View All...) work
- ✅ Typing indicator shows while processing

### Data Accuracy:
- ✅ Train data matches MongoDB
- ✅ Schedules show correct times
- ✅ Notices display actual content
- ✅ Tickets show user's bookings
- ✅ No mention of "delay prediction"

### Navigation:
- ✅ "View All Trains" → AvailableTrains screen
- ✅ "Open Live Tracking" → Live Tracking screen
- ✅ "View My Tickets" → Tickets screen
- ✅ "View All Schedules" → Schedules screen
- ✅ "View All Notices" → Notices screen

---

## 🐛 Common Issues & Solutions

### Issue 1: Chatbot not responding
**Solution:** 
- Check if backend server is running
- Verify MongoDB connection
- Check console for errors

### Issue 2: No data showing
**Solution:**
- Ensure MongoDB has data in collections
- Check API endpoints are accessible
- Verify user is logged in

### Issue 3: Navigation not working
**Solution:**
- Check navigation setup in AppNavigator.js
- Verify screen names match

### Issue 4: Person icon not showing
**Solution:**
- Clear cache and restart app
- Check FloatingChatButton.js has person-circle icon

---

## 📊 Expected Behavior Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Welcome Message | ✅ | No delay prediction mention |
| Help Command | ✅ | Updated with train info |
| Booking | ✅ | Shows 3 trains inline |
| Schedules | ✅ | Shows 3 schedules inline |
| Tracking | ✅ | Shows active trains count |
| My Tickets | ✅ | Fetches from backend |
| Notices | ✅ | Shows 2 notices inline |
| Train Info | ✅ | Shows 3 trains with details |
| Person Icon | ✅ | Changed from chatbubble |
| Delay Prediction | ❌ | Completely removed |
| Quick Actions | ✅ | 6 buttons working |
| Navigation | ✅ | All screens accessible |

---

## 🎉 Success Criteria

The chatbot is working correctly if:
- ✅ All test queries return appropriate responses
- ✅ Data is fetched from MongoDB
- ✅ Information displays inline in chat
- ✅ Navigation buttons work
- ✅ No errors in console
- ✅ Person icon visible
- ✅ No delay prediction mentions

---

## 📞 Troubleshooting Commands

### Check Server Status:
```bash
curl http://localhost:5001/test
```

### Check MongoDB Connection:
Look for "Connected to MongoDB" in server logs

### View Server Logs:
Check the terminal where `npm start` is running

### Clear Expo Cache:
```bash
npx expo start -c
```

---

**Last Updated:** October 29, 2025  
**Status:** All fixes applied ✅
