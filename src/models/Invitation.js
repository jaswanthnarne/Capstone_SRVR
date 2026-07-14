const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, default: '' },
    dept: { type: String, default: '' },
    division: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    courseName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['sent', 'accepted', 'rejected'],
      default: 'sent',
    },
    token: { type: String, required: true, unique: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invitationSchema.index({ batchId: 1, rollNumber: 1 });
invitationSchema.index({ token: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);
