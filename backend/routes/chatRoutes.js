const express = require('express');
const router = express.Router();
const { getArjunaResponse } = require('../services/geminiService');

router.post('/', async (req, res) => {
  console.log("ARJUNA API ROUTE HIT");
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await getArjunaResponse(message, history || []);
    res.json(response);
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Something went wrong while talking to Arjuna.' });
  }
});

module.exports = router;

