const mongoose = require('mongoose');

const ExerciseEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, default: 0 } // in minutes
}, { _id: false });

const SleepSchema = new mongoose.Schema({
  bedTime: { type: String, default: '' },   // "22:30"
  wakeTime: { type: String, default: '' }   // "07:00"
}, { _id: false });

const AtlasLogSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true },
  date:        { type: String, required: true },  // YYYY-MM-DD

  // Core mood (kitten emoji mood)
  mood: { type: String, required: true },

  // Rich check-in fields
  emotions:     [{ type: String }],
  hobbies:      [{ type: String }],
  relationship: [{ type: String }],
  selfCare:     [{ type: String }],
  health:       [{ type: String }],
  people:       [{ type: String }],
  music:        { type: String, default: '' },
  weather:      { type: String, default: '' },
  steps:        { type: Number, default: 0 },
  exercises:    [ExerciseEntrySchema],
  sleep:        { type: SleepSchema, default: () => ({}) },
  note:         { type: String, default: '' },
  gratitude:    [{ type: String }],

  // Legacy field kept for backward compatibility
  activities: [{ type: String }],
  
  // New field for sanctuary meditation
  meditationMinutes: { type: Number, default: 0 },

}, { timestamps: true });

// Compound unique index — one log per session per day
AtlasLogSchema.index({ sessionId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AtlasLog', AtlasLogSchema);
