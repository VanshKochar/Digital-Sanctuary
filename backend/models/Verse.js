const mongoose = require('mongoose');

const VerseSchema = new mongoose.Schema({
  verseId: { type: String, required: true, unique: true }, // e.g., "2.47"
  sanskrit: { type: String, required: true },
  english: { type: String, required: true },
  hindi: { type: String, required: true },
  tags: [{ type: String }],
  modernGuidance: { type: String, required: true },
  category: { type: String } // optional category if provided
}, { timestamps: true });

module.exports = mongoose.model('Verse', VerseSchema);
