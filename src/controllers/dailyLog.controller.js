const DailyLog = require('../models/DailyLog');
const Team = require('../models/Team');

// Save or update daily log for a specific date (Team Lead operation)
const saveDailyLog = async (req, res) => {
  try {
    const { date, logs } = req.body;
    
    // Validate request
    if (!date || !logs || !Array.isArray(logs)) {
      return res.status(400).json({ success: false, message: 'Date and logs array are required' });
    }

    // Ensure user is a teamlead and retrieve their teamId
    if (req.user.role !== 'teamlead') {
      return res.status(403).json({ success: false, message: 'Only team leads can submit daily logs' });
    }

    const team = await Team.findById(req.user.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Enforce modification limit (Max 3 saves/edits)
    const existingLog = await DailyLog.findOne({ teamId: team._id, date });
    if (existingLog && existingLog.changeCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have reached the maximum modification limit of 3 submissions/edits for this log date. Please contact the administrator/trainer to reset your limit.' 
      });
    }

    // Update existing daily log or create new one, incrementing changeCount
    const dailyLog = await DailyLog.findOneAndUpdate(
      { teamId: team._id, date },
      { 
        $set: { 
          logs: logs.map(l => ({ name: l.name, rollNumber: l.rollNumber, taskDone: l.taskDone }))
        },
        $inc: { changeCount: 1 }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: dailyLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get daily logs for the currently logged-in team (Team Lead operation)
const getMyDailyLogs = async (req, res) => {
  try {
    if (req.user.role !== 'teamlead') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const logs = await DailyLog.find({ teamId: req.user.id }).sort({ date: 1 });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get daily logs for any specific team (Trainer/Admin operation)
const getTeamDailyLogs = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can view team logs' });
    }

    const { teamId } = req.params;
    const logs = await DailyLog.find({ teamId }).sort({ date: 1 });
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer/Admin: Reset changeCount for a daily log back to 0
const resetDailyLogLimit = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can reset logs' });
    }

    const { teamId, date } = req.body;
    if (!teamId || !date) {
      return res.status(400).json({ success: false, message: 'teamId and date are required' });
    }

    const log = await DailyLog.findOneAndUpdate(
      { teamId, date },
      { $set: { changeCount: 0 } },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ success: false, message: 'Daily log not found for this date and team' });
    }

    res.status(200).json({ success: true, message: 'Daily log edit count has been reset successfully.', data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer/Admin: Grade a daily log (assign score)
const gradeDailyLog = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can grade logs' });
    }

    const { teamId, date, score } = req.body;
    if (!teamId || !date || score === undefined) {
      return res.status(400).json({ success: false, message: 'teamId, date, and score are required' });
    }

    const log = await DailyLog.findOneAndUpdate(
      { teamId, date },
      { $set: { score: Number(score) } },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ success: false, message: 'Daily log not found for this date and team' });
    }

    res.status(200).json({ success: true, message: 'Daily log graded successfully.', data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer/Admin: Release or hide daily log score
const releaseDailyLogScore = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Only trainers can release log scores' });
    }

    const { teamId, date, isScoreReleased } = req.body;
    if (!teamId || !date || isScoreReleased === undefined) {
      return res.status(400).json({ success: false, message: 'teamId, date, and isScoreReleased are required' });
    }

    const log = await DailyLog.findOneAndUpdate(
      { teamId, date },
      { $set: { isScoreReleased: Boolean(isScoreReleased) } },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ success: false, message: 'Daily log not found for this date and team' });
    }

    res.status(200).json({ success: true, message: isScoreReleased ? 'Daily log score released successfully.' : 'Daily log score hidden successfully.', data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  saveDailyLog,
  getMyDailyLogs,
  getTeamDailyLogs,
  resetDailyLogLimit,
  gradeDailyLog,
  releaseDailyLogScore,
};
