const mongoose = require('mongoose');

// Locks are scoped per batch — same problem can be used across batches
const problemLockSchema = new mongoose.Schema(
  {
    problemStatementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemStatement',
      required: true,
    },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    lockedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Normal index (not unique) to allow up to 3 teams to select the same problem statement per batch
problemLockSchema.index({ problemStatementId: 1, batchId: 1 });
// Unique constraint: a team can only have one problem selection lock per batch
problemLockSchema.index({ teamId: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model('ProblemLock', problemLockSchema);
