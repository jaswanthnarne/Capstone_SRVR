const mongoose = require('mongoose');

const STAGES = [
  'Idea Approved',
  'Requirements & Schema',
  'Development',
  'Testing',
  'Final Submission',
];

const milestoneSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    stageName: { type: String, enum: STAGES, required: true },
    stageIndex: { type: Number, min: 0, max: 4 }, // 0–4 for 3D path positioning
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'done'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

milestoneSchema.pre('save', function (next) {
  this.stageIndex = STAGES.indexOf(this.stageName);
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

milestoneSchema.index({ teamId: 1, stageName: 1 }, { unique: true });
milestoneSchema.index({ batchId: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
module.exports.STAGES = STAGES;
