const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Get all tickets (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const allTickets = await Ticket.find({}).sort({ createdAt: -1 });
    console.log(`✅ Found ${allTickets.length} total tickets`);
    res.json(allTickets);
  } catch (error) {
    console.error('❌ Error fetching all tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets', details: error.message });
  }
});

// Get all tickets for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const userTickets = await Ticket.find({ userId: userId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${userTickets.length} tickets for user ${userId}`);
    res.json({ tickets: userTickets });

  } catch (error) {
    console.error('❌ Error fetching user tickets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user tickets',
      details: error.message 
    });
  }
});

module.exports = router;
