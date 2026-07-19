const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    type: {
      type: String,
      enum: ['tl_credentials', 'member_invitation', 'password_reset', 'test_mail', 'general'],
      default: 'general'
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true
    },
    error: { type: String, default: '' },
    metadata: { type: Object, default: {} },
    sentAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

mailLogSchema.index({ sentAt: -1 });
mailLogSchema.index({ to: 1 });

module.exports = mongoose.model('MailLog', mailLogSchema);
