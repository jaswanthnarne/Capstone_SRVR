const mongoose = require('mongoose');

const memberLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  taskDone: { type: String, required: true, default: '' }
});

const dailyLogSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    logs: [memberLogSchema],
    changeCount: { type: Number, default: 0 },
    score: { type: Number, default: null },
    isScoreReleased: { type: Boolean, default: false }
  },
  { timestamps: true }
);

dailyLogSchema.index({ teamId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
