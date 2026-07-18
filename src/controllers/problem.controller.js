const ProblemStatement = require('../models/ProblemStatement');
const ProblemLock = require('../models/ProblemLock');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const Milestone = require('../models/Milestone');
const Subject = require('../models/Subject');

// ─── Trainer: CRUD for problem pool ──────────────────────────────────────────
const getProblems = async (req, res) => {
  const filter = { trainerId: req.user.id };
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.isGlobal !== undefined) filter.isGlobal = req.query.isGlobal === 'true';
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;

  const problems = await ProblemStatement.find(filter)
    .populate('subjectId', 'name color')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: problems });
};

const getProblem = async (req, res) => {
  const problem = await ProblemStatement.findOne({ _id: req.params.id })
    .populate('subjectId', 'name color');
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
  res.json({ success: true, data: problem });
};

const createProblem = async (req, res) => {
  const {
    title, problemStatement, description, expectedOutput,
    outcome, suggestedTech, subjectId, isGlobal, difficulty, tags,
  } = req.body;

  if (!title || !problemStatement || !description || !expectedOutput || !outcome)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  const problem = await ProblemStatement.create({
    title, problemStatement, description, expectedOutput,
    outcome, suggestedTech, subjectId, isGlobal, difficulty, tags,
    trainerId: req.user.id,
  });

  res.status(201).json({ success: true, data: problem });
};

const updateProblem = async (req, res) => {
  const problem = await ProblemStatement.findOneAndUpdate(
    { _id: req.params.id, trainerId: req.user.id },
    { $set: req.body },
    { new: true }
  );
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
  res.json({ success: true, data: problem });
};

const deleteProblem = async (req, res) => {
  const problem = await ProblemStatement.findOneAndDelete({
    _id: req.params.id,
    trainerId: req.user.id,
  });
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
  res.json({ success: true, message: 'Problem deleted' });
};

// ─── Team Lead: Get available problems for their batch ───────────────────────
const getAvailableProblems = async (req, res) => {
  const team = await Team.findById(req.user.teamId).populate('batchId');
  if (!team) return res.status(401).json({ success: false, message: 'Team account no longer exists. Please log in again.' });

  const batch = team.batchId;
  if (!batch) {
    return res.status(400).json({ success: false, message: 'Your team is not assigned to any batch. Please contact your trainer.' });
  }

  // Get all locked problems in this batch
  const locks = await ProblemLock.find({ batchId: batch._id });

  // Get problems matching this batch's subject OR global problems
  const problems = await ProblemStatement.find({
    $or: [{ subjectId: batch.subjectId }, { isGlobal: true }],
  }).populate('subjectId', 'name color');

  // Mark available/locked (locked if selected by 3 teams, excluding current team's own lock)
  const result = problems.map((p) => {
    const lockedTeams = locks.filter((l) => l.problemStatementId.toString() === p._id.toString());
    const isLockedBySelf = lockedTeams.some((l) => l.teamId.toString() === team._id.toString());
    return {
      ...p.toObject(),
      selectedCount: lockedTeams.length,
      isLocked: lockedTeams.length >= 3 && !isLockedBySelf,
    };
  });

  res.json({ success: true, data: result });
};

// ─── Team Lead: Select (lock) a problem statement ────────────────────────────
const selectProblem = async (req, res) => {
  const { problemStatementId } = req.body;
  if (!problemStatementId)
    return res.status(400).json({ success: false, message: 'problemStatementId is required' });

  const team = await Team.findById(req.user.teamId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const batch = await Batch.findById(team.batchId);
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

  // 1. Lock check
  if (batch.isProblemSelectionLocked) {
    return res.status(403).json({
      success: false,
      message: 'Problem selection has been locked by the admin. Please contact your trainer.'
    });
  }

  // 2. Limit of 3 selections/changes
  if (team.problemChangeCount >= 3) {
    return res.status(403).json({
      success: false,
      message: 'You have reached the maximum limit of 3 problem statement selections. Please contact your trainer.'
    });
  }

  // 3. Limit of 3 teams per problem statement in the batch
  const existingLocksCount = await ProblemLock.countDocuments({
    problemStatementId,
    batchId: team.batchId,
    teamId: { $ne: team._id }
  });
  if (existingLocksCount >= 3) {
    return res.status(409).json({
      success: false,
      message: 'This problem statement has already been selected by the maximum limit of 3 teams. Please choose another problem or contact your admin.'
    });
  }

  // Delete any existing locks for this team in this batch (releasing old choice)
  await ProblemLock.deleteMany({ teamId: team._id });

  // Create new problem lock
  let lock;
  try {
    lock = await ProblemLock.create({
      problemStatementId,
      batchId: team.batchId,
      teamId: team._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Your team already has a problem selected. Please release it first or contact your admin.' });
    }
    throw err;
  }

  // Update team status, selected problem, and increment change count
  team.problemStatementId = problemStatementId;
  team.status = 'in_progress';
  team.problemChangeCount += 1;
  await team.save();

  // Auto-create milestone records for this team if they don't already exist
  const existingMilestonesCount = await Milestone.countDocuments({ teamId: team._id });
  if (existingMilestonesCount === 0) {
    const { STAGES } = require('../models/Milestone');
    const milestones = STAGES.map((stageName) => ({
      teamId: team._id,
      batchId: team.batchId,
      collegeId: team.collegeId,
      stageName,
    }));
    await Milestone.insertMany(milestones);
  }

  res.json({ success: true, message: 'Problem selected and locked successfully', data: lock });
};

module.exports = {
  getProblems, getProblem, createProblem, updateProblem, deleteProblem,
  getAvailableProblems, selectProblem,
};
