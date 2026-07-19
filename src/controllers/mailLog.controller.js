const MailLog = require('../models/MailLog');

// Get all email logs (Trainer/Admin operation)
const getMailLogs = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { status, type, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { to: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await MailLog.find(query).sort({ sentAt: -1 }).limit(200);
    const totalCount = await MailLog.countDocuments();
    const sentCount = await MailLog.countDocuments({ status: 'sent' });
    const failedCount = await MailLog.countDocuments({ status: 'failed' });

    res.json({
      success: true,
      data: logs,
      stats: {
        total: totalCount,
        sent: sentCount,
        failed: failedCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMailLogs };
