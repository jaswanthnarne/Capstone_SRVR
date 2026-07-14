const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

collegeSchema.index({ trainerId: 1 });

module.exports = mongoose.model('College', collegeSchema);
