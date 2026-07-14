const Milestone = require('../models/Milestone');

// Get milestones for a team (trainer or own team)
const getMilestones = async (req, res) => {
  const teamId = req.user.role === 'trainer' ? req.params.teamId : req.user.teamId;
  let milestones = await Milestone.find({ teamId }).sort({ stageIndex: 1 });

  if (milestones.length === 0) {
    const Team = require('../models/Team');
    const team = await Team.findById(teamId);
    if (team) {
      const stages = ['Idea Approved', 'Requirements & Schema', 'Development', 'Testing', 'Final Submission'];
      const docs = stages.map(stageName => ({
        teamId,
        batchId: team.batchId,
        collegeId: team.collegeId,
        stageName,
        status: 'pending'
      }));
      try {
        await Milestone.insertMany(docs);
        milestones = await Milestone.find({ teamId }).sort({ stageIndex: 1 });
      } catch (err) {
        console.error('Failed to initialize milestones', err);
      }
    }
  }

  res.json({ success: true, data: milestones });
};

// Update a specific milestone
const updateMilestone = async (req, res) => {
  const { stageName, status, notes } = req.body;

  if (!stageName || !status)
    return res.status(400).json({ success: false, message: 'stageName and status are required' });

  const teamId = req.user.role === 'trainer' ? req.body.teamId : req.user.teamId;

  const milestone = await Milestone.findOneAndUpdate(
    { teamId, stageName },
    {
      $set: {
        status,
        notes: notes || '',
        updatedAt: new Date(),
        completedAt: status === 'done' ? new Date() : null,
      },
    },
    { new: true, upsert: false }
  );

  if (!milestone)
    return res.status(404).json({ success: false, message: 'Milestone not found' });

  res.json({ success: true, data: milestone });
};

module.exports = { getMilestones, updateMilestone };
