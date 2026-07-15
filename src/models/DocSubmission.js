const mongoose = require('mongoose');

const docSubmissionSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocRequest', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true }, // in MB
    changeCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

docSubmissionSchema.index({ requestId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('DocSubmission', docSubmissionSchema);
