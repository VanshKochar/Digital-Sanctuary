const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AtlasLog = require('../models/AtlasLog');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedMockAtlas = async () => {
  const sessionId = process.argv[2] || "test_session";
  console.log(`Seeding mock Atlas logs for sessionId: "${sessionId}"...`);

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing logs for this session first to ensure clean seed
    await AtlasLog.deleteMany({ sessionId });
    console.log('Cleared existing logs for this session.');

    const today = new Date();
    const logs = [];

    // Create 9 days of beautiful, atmospheric mock data leading up to today
    const moods = [
      "peaceful",
      "overthinking",
      "mentally crowded",
      "drifting",
      "emotionally heavy",
      "socially drained",
      "grounded",
      "hopeful",
      "refreshed"
    ];

    const activitiesList = [
      ["nature", "music", "self-care", "alone time"],
      ["scrolling", "social media", "coding/studying"],
      ["scrolling", "gaming", "alone time"],
      ["music", "alone time", "weather"],
      ["scrolling", "social media", "alone time"],
      ["people", "friends", "relationships"],
      ["exercise", "nature", "family", "hobbies"],
      ["music", "hobbies", "exercise", "self-care"],
      ["nature", "sleep", "self-care", "exercise"]
    ];

    const notes = [
      "Sat by the park today. The wind felt so gentle, lowkey made me forget about the upcoming exams.",
      "Couldn't sleep until 3 AM. Kept replaying a random conversation from three years ago. Typical.",
      "Assignment deadlines are piling up. Felt like my head was full of static noise.",
      "Just wandered around the campus listening to lo-fi. Felt a bit disconnected but in a calm way.",
      "Spent three hours scrolling through short-form videos. Felt pretty empty and tired afterwards.",
      "Had to attend a massive social gathering. Everyone was nice but I came home completely depleted.",
      "Woke up early, did some light stretching, and visited family. Felt incredibly centered and solid.",
      "Painted a tiny sunset sketch. There's something beautiful about just making things with your hands.",
      "Had a full eight hours of restful sleep and walked among the trees. The light filtering down felt like a quiet hug."
    ];

    for (let i = 8; i >= 0; i--) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - i);
      const dateStr = logDate.toISOString().split('T')[0];

      logs.push({
        sessionId,
        date: dateStr,
        mood: moods[8 - i],
        activities: activitiesList[8 - i],
        note: notes[8 - i]
      });
    }

    await AtlasLog.insertMany(logs);
    console.log(`Successfully seeded ${logs.length} days of emotional history!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock Atlas logs:', error);
    process.exit(1);
  }
};

seedMockAtlas();
