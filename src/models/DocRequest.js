const mongoose = require('mongoose');

const docRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    fileType: { 
      type: String, 
      enum: ['pdf', 'zip', 'doc', 'any'], 
      default: 'any' 
    },
    maxSize: { type: Number, default: 10 }, // in MB
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    targetTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }], // Empty array means all teams in batch
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true }
  },
  { timestamps: true }
);

docRequestSchema.index({ batchId: 1 });
docRequestSchema.index({ trainerId: 1 });

module.exports = mongoose.model('DocRequest', docRequestSchema);
