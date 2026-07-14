const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    feedback: { type: String, default: '' },
    evaluatedAt: { type: Date, default: Date.now },
    criteria: {
      codeQuality: { type: Number, min: 0, max: 25, default: 0 },
      functionality: { type: Number, min: 0, max: 25, default: 0 },
      documentation: { type: Number, min: 0, max: 25, default: 0 },
      presentation: { type: Number, min: 0, max: 25, default: 0 },
    },
  },
  { timestamps: true }
);

evaluationSchema.index({ submissionId: 1 });
evaluationSchema.index({ batchId: 1, trainerId: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
