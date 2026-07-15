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

    // Update existing daily log or create new one
    const dailyLog = await DailyLog.findOneAndUpdate(
      { teamId: team._id, date },
      { 
        $set: { 
          logs: logs.map(l => ({ name: l.name, rollNumber: l.rollNumber, taskDone: l.taskDone }))
        } 
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

module.exports = {
  saveDailyLog,
  getMyDailyLogs,
  getTeamDailyLogs,
};
