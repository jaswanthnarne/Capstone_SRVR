const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, trim: true },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  dept: { type: String, default: '' },
  division: { type: String, default: '' },
  roomNumber: { type: String, default: '' },
  courseName: { type: String, default: '' },
});

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    leadUsername: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    members: [memberSchema],
    problemStatementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemStatement',
      default: null,
    },
    status: {
      type: String,
      enum: ['problem_pending', 'in_progress', 'submitted'],
      default: 'problem_pending',
    },
    leadName: { type: String, default: '' },
    usnRollNumber: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dept: { type: String, default: '' },
    division: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    courseName: { type: String, default: '' },
    problemChangeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

teamSchema.index({ batchId: 1, collegeId: 1 });
teamSchema.index({ leadUsername: 1 });

module.exports = mongoose.model('Team', teamSchema);
