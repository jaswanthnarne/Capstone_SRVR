const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, unique: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    githubUrl: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(v),
        message: 'Must be a valid GitHub repository URL',
      },
    },
    deployedUrl: { type: String, default: '' },
    docFilePath: { type: String, default: '' }, // Cloudinary URL
    demoVideoUrl: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submissionSchema.index({ teamId: 1 });
submissionSchema.index({ batchId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
