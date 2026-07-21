const Team = require('../models/Team');
const Batch = require('../models/Batch');
const College = require('../models/College');
const Submission = require('../models/Submission');
const Evaluation = require('../models/Evaluation');
const Milestone = require('../models/Milestone');
const { sendTLCredentials } = require('../services/mail.service');

// Cross-college dashboard — all teams for trainer
const getDashboard = async (req, res) => {
  const trainerId = req.user.id;

  // Get all colleges for this trainer
  const colleges = await College.find({ trainerId });
  const collegeIds = colleges.map((c) => c._id);

  // Get all batches
  const batches = await Batch.find({ trainerId })
    .populate('collegeId', 'name')
    .populate('subjectId', 'name color');

  const batchIds = batches.map((b) => b._id);

  // Get all teams with milestone data
  const teams = await Team.find({ collegeId: { $in: collegeIds } })
    .populate('batchId', 'name endDate status')
    .populate('collegeId', 'name')
    .populate('problemStatementId', 'title')
    .select('-passwordHash');

  // Determine overdue teams
  const now = new Date();
  const teamsWithStatus = teams.map((team) => {
    const batchEnd = team.batchId?.endDate;
    const isOverdue = batchEnd && new Date(batchEnd) < now && team.status !== 'submitted';
    return { ...team.toObject(), isOverdue };
  });

  // Summary stats
  const totalTeams = teams.length;
  const submitted = teams.filter((t) => t.status === 'submitted').length;
  const inProgress = teams.filter((t) => t.status === 'in_progress').length;
  const pending = teams.filter((t) => t.status === 'problem_pending').length;
  const overdue = teamsWithStatus.filter((t) => t.isOverdue).length;

  res.json({
    success: true,
    data: {
      summary: {
        totalColleges: colleges.length,
        totalBatches: batches.length,
        totalTeams,
        submitted,
        inProgress,
        pending,
        overdue,
      },
      colleges,
      batches,
      teams: teamsWithStatus,
    },
  });
};

// Get trainer profile
const getProfile = async (req, res) => {
  const Trainer = require('../models/Trainer');
  const trainer = await Trainer.findById(req.user.id).select('-passwordHash');
  if (!trainer) return res.status(401).json({ success: false, message: 'Trainer account no longer exists. Please log in again.' });
  res.json({ success: true, data: trainer });
};

/**
 * Bulk update all teams status to 'in_progress' and resend welcome email to all Team Leads
 */
const resendAllWelcomeMails = async (req, res) => {
  try {
    // 1. Bulk update all team statuses in database to 'in_progress'
    const updateResult = await Team.updateMany({}, { status: 'in_progress' });

    // 2. Fetch all teams with populated batch details
    const teams = await Team.find().populate('batchId', 'name');

    let sentCount = 0;
    let failedCount = 0;

    // 3. Resend welcome credentials to every single team lead asynchronously
    for (const team of teams) {
      const email = team.email || (team.members && team.members[0] && team.members[0].email);
      if (email) {
        try {
          await sendTLCredentials(
            email,
            team.leadUsername,
            'Eth@dm!n#56',
            team.batchId?.name || 'Ethnotech Capstone Project',
            team.name
          );
          sentCount++;
        } catch (err) {
          console.error(`Failed to send mail to ${email}:`, err.message);
          failedCount++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalTeams: teams.length,
        statusUpdatedCount: updateResult.modifiedCount,
        emailsSent: sentCount,
        emailsFailed: failedCount
      },
      message: `Successfully updated ${updateResult.modifiedCount} teams to 'in_progress' and dispatched welcome emails!`
    });
  } catch (error) {
    console.error("resendAllWelcomeMails error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to resend welcome emails" });
  }
};

module.exports = { getDashboard, getProfile, resendAllWelcomeMails };
