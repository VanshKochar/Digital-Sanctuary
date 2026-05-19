const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Verse = require('../models/Verse');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const filePath = path.join(__dirname, '../../gita_verses.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Split by any line that is just dashes (at least 5)
    const blocks = content.split(/\n\s*-{5,}\s*\n/);
    const versesMap = new Map();

    console.log(`Found ${blocks.length} blocks to parse.`);

    for (let block of blocks) {
      if (!block.trim() || !block.includes('Sanskrit:')) continue;

      const verseData = {};

      // Extract Verse ID
      const verseIdMatch = block.match(/Verse\s+([\d\.\–\-]+)/);
      if (verseIdMatch) verseData.verseId = verseIdMatch[1].replace('–', '-');

      // Extract Sanskrit
      const sanskritMatch = block.match(/Sanskrit:\s*([\s\S]*?)(?=English:)/i);
      if (sanskritMatch) verseData.sanskrit = sanskritMatch[1].trim();

      // Extract English
      const englishMatch = block.match(/English:\s*([\s\S]*?)(?=Hindi:)/i);
      if (englishMatch) verseData.english = englishMatch[1].trim();

      // Extract Hindi
      const hindiMatch = block.match(/Hindi:\s*([\s\S]*?)(?=Tags:)/i);
      if (hindiMatch) verseData.hindi = hindiMatch[1].trim();

      // Extract Tags
      const tagsMatch = block.match(/Tags:\s*([^\n\r]*)/i);
      if (tagsMatch) {
        verseData.tags = tagsMatch[1].split(',').map(tag => tag.trim().toLowerCase()).filter(t => t);
      }

      // Extract Modern Guidance
      const guidanceMatch = block.match(/Modern Guidance:\s*([\s\S]*)/i);
      if (guidanceMatch) {
        // Remove trailing whitespace and potential artifacts
        verseData.modernGuidance = guidanceMatch[1].trim();
      }

      if (verseData.verseId && verseData.sanskrit) {
        if (versesMap.has(verseData.verseId)) {
          const existing = versesMap.get(verseData.verseId);
          existing.tags = [...new Set([...existing.tags, ...verseData.tags])];
        } else {
          versesMap.set(verseData.verseId, verseData);
        }
      }
    }

    const versesToInsert = Array.from(versesMap.values());

    if (versesToInsert.length === 0) {
        console.error("No verses found! Check your file structure.");
        process.exit(1);
    }

    await Verse.deleteMany({});
    await Verse.insertMany(versesToInsert);

    console.log(`Successfully seeded ${versesToInsert.length} unique verses!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
