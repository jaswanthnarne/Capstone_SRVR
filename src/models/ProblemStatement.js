const mongoose = require('mongoose');

const problemStatementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    problemStatement: { type: String, required: true }, // short description
    description: { type: String, required: true },      // detailed
    expectedOutput: { type: String, required: true },
    outcome: { type: String, required: true },
    suggestedTech: [{ type: String }],
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    isGlobal: { type: Boolean, default: false },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

problemStatementSchema.index({ subjectId: 1, isGlobal: 1 });
problemStatementSchema.index({ trainerId: 1 });

module.exports = mongoose.model('ProblemStatement', problemStatementSchema);
