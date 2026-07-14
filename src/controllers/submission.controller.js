const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Batch = require('../models/Batch');

// Team Lead: submit final deliverables
const createSubmission = async (req, res) => {
  const { githubUrl, deployedUrl, demoVideoUrl } = req.body;

  if (!githubUrl)
    return res.status(400).json({ success: false, message: 'GitHub URL is required' });

  const team = await Team.findById(req.user.teamId).populate('batchId');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // Enforce member size constraints before submission (including TL)
  const min = team.batchId?.minMembers ?? 2;
  const max = team.batchId?.maxMembers ?? 6;
  const totalCount = team.members.length + 1;
  if (totalCount < min || totalCount > max) {
    return res.status(400).json({
      success: false,
      message: `Your team must have between ${min} and ${max} members to submit (currently: ${totalCount}, including the Team Lead).`
    });
  }

  if (!team.problemStatementId)
    return res.status(400).json({ success: false, message: 'You must select a problem statement first' });

  // Check if already submitted
  const existing = await Submission.findOne({ teamId: team._id });
  if (existing)
    return res.status(409).json({ success: false, message: 'You have already submitted' });

  const batch = team.batchId;
  const isLate = batch.endDate && new Date() > new Date(batch.endDate);

  const docFilePath = req.file ? req.file.path : '';

  const submission = await Submission.create({
    teamId: team._id,
    batchId: team.batchId._id,
    collegeId: team.collegeId,
    githubUrl,
    deployedUrl: deployedUrl || '',
    docFilePath,
    demoVideoUrl: demoVideoUrl || '',
    isLate,
  });

  // Update team status
  team.status = 'submitted';
  await team.save();

  res.status(201).json({ success: true, data: submission });
};

// Team Lead: get own submission
const getMySubmission = async (req, res) => {
  const submission = await Submission.findOne({ teamId: req.user.teamId });
  if (!submission)
    return res.status(404).json({ success: false, message: 'No submission found' });
  res.json({ success: true, data: submission });
};

// Trainer: get all submissions
const getAllSubmissions = async (req, res) => {
  const filter = {};
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  if (req.query.teamId) filter.teamId = req.query.teamId;

  const submissions = await Submission.find(filter)
    .populate('teamId', 'name leadUsername members')
    .populate('batchId', 'name endDate')
    .populate('collegeId', 'name')
    .sort({ submittedAt: -1 });

  res.json({ success: true, data: submissions });
};

// Trainer: get one submission
const getSubmissionById = async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('teamId', 'name leadUsername members problemStatementId')
    .populate('batchId', 'name')
    .populate('collegeId', 'name');
  if (!submission)
    return res.status(404).json({ success: false, message: 'Submission not found' });
  res.json({ success: true, data: submission });
};

module.exports = { createSubmission, getMySubmission, getAllSubmissions, getSubmissionById };
