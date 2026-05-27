const express = require('express');
const router = express.Router();
const AtlasLog = require('../models/AtlasLog');
const { getAtlasInsights, getWeeklyReflectionLetter } = require('../services/geminiService');

// 1. Save or Update Daily Check-in Log (rich fields)
router.post('/log', async (req, res) => {
  const {
    sessionId, date, mood,
    emotions, hobbies, relationship, selfCare, health, people,
    music, weather, steps, exercises, sleep, note, gratitude,
    activities // legacy compat
  } = req.body;

  if (!sessionId || !date || !mood) {
    return res.status(400).json({ error: 'sessionId, date, and mood are required' });
  }

  try {
    const updatedLog = await AtlasLog.findOneAndUpdate(
      { sessionId, date },
      {
        $set: {
          mood,
          emotions:     emotions     ?? [],
          hobbies:      hobbies      ?? [],
          relationship: relationship ?? [],
          selfCare:     selfCare     ?? [],
          health:       health       ?? [],
          people:       people       ?? [],
          music:        music        ?? '',
          weather:      weather      ?? '',
          steps:        steps        ?? 0,
          exercises:    exercises    ?? [],
          sleep:        sleep        ?? { bedTime: '', wakeTime: '' },
          note:         note         ?? '',
          gratitude:    gratitude    ?? [],
          activities:   activities   ?? [],
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: 'Daily check-in logged successfully', log: updatedLog });
  } catch (error) {
    console.error('Atlas Save Log Error:', error);
    res.status(500).json({ error: 'Something went wrong while saving your daily log.' });
  }
});

// 1.5 Add Meditation Minutes (Auto-sync)
router.post('/meditation', async (req, res) => {
  const { sessionId, date, minutes } = req.body;
  if (!sessionId || !date || typeof minutes !== 'number') {
    return res.status(400).json({ error: 'sessionId, date, and valid minutes are required' });
  }
  
  try {
    const updatedLog = await AtlasLog.findOneAndUpdate(
      { sessionId, date },
      { 
        $inc: { meditationMinutes: minutes },
        // If it creates a new document, satisfy the required mood field
        $setOnInsert: { mood: "okay" } 
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: 'Meditation minutes logged successfully', log: updatedLog });
  } catch (error) {
    console.error('Atlas Add Meditation Error:', error);
    res.status(500).json({ error: 'Something went wrong while logging meditation.' });
  }
});

// 2. Fetch all logs for visual reporting
router.get('/logs', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const logs = await AtlasLog.find({ sessionId }).sort({ date: 1 });
    res.json(logs);
  } catch (error) {
    console.error('Atlas Fetch Logs Error:', error);
    res.status(500).json({ error: 'Something went wrong while retrieving your logs.' });
  }
});

// 3. Generate AI-Powered insights
router.get('/insights', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const logs = await AtlasLog.find({ sessionId }).sort({ date: 1 });
    const insights = await getAtlasInsights(logs);
    res.json({ insights });
  } catch (error) {
    console.error('Atlas Get Insights Error:', error);
    res.status(500).json({ error: 'Something went wrong while compiling your patterns.' });
  }
});

// 4. Generate Weekly Reflection Letter
router.get('/weekly', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await AtlasLog.find({
      sessionId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    const letter = await getWeeklyReflectionLetter(logs);
    res.json({ letter });
  } catch (error) {
    console.error('Atlas Get Weekly Letter Error:', error);
    res.status(500).json({ error: 'Something went wrong while writing your weekly reflection letter.' });
  }
});

module.exports = router;
