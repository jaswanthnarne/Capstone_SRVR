const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    inviteCode: { type: String, unique: true, default: () => uuidv4().substring(0, 8).toUpperCase() },
    maxTeams: { type: Number, default: 30 },
    minMembers: { type: Number, default: 2 },
    maxMembers: { type: Number, default: 6 },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    isProblemSelectionLocked: { type: Boolean, default: false },
    departments: { type: [String], default: [] },
    divisions: { type: [String], default: [] },
    rooms: { type: [String], default: [] },
    courses: { type: [String], default: [] },
    templates: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

batchSchema.index({ collegeId: 1, trainerId: 1 });
batchSchema.index({ inviteCode: 1 });

module.exports = mongoose.model('Batch', batchSchema);
