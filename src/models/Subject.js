const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    color: { type: String, default: '#3b82f6' }, // accent color for UI
  },
  { timestamps: true }
);

subjectSchema.index({ trainerId: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
