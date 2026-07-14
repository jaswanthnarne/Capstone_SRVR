const Evaluation = require('../models/Evaluation');
const Submission = require('../models/Submission');

// Trainer: create or update evaluation
const upsertEvaluation = async (req, res) => {
  const { submissionId, score, feedback, criteria } = req.body;
  if (!submissionId || score === undefined)
    return res.status(400).json({ success: false, message: 'submissionId and score are required' });

  const submission = await Submission.findById(submissionId);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

  const evaluation = await Evaluation.findOneAndUpdate(
    { submissionId },
    {
      $set: {
        submissionId,
        teamId: submission.teamId,
        batchId: submission.batchId,
        collegeId: submission.collegeId,
        trainerId: req.user.id,
        score,
        feedback: feedback || '',
        criteria: criteria || {},
        evaluatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  res.json({ success: true, data: evaluation });
};

// Trainer: get all evaluations
const getAllEvaluations = async (req, res) => {
  const filter = {};
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  if (req.query.teamId) filter.teamId = req.query.teamId;

  const evals = await Evaluation.find(filter)
    .populate('teamId', 'name leadUsername')
    .populate('submissionId', 'githubUrl deployedUrl submittedAt')
    .populate('batchId', 'name')
    .populate('collegeId', 'name')
    .sort({ evaluatedAt: -1 });

  res.json({ success: true, data: evals });
};

// Team Lead: get their own evaluation
const getMyEvaluation = async (req, res) => {
  const submission = await Submission.findOne({ teamId: req.user.teamId });
  if (!submission)
    return res.json({ success: true, data: null });

  const evaluation = await Evaluation.findOne({ submissionId: submission._id })
    .populate('trainerId', 'name');
  if (!evaluation)
    return res.json({ success: true, data: null });

  res.json({ success: true, data: evaluation });
};

module.exports = { upsertEvaluation, getAllEvaluations, getMyEvaluation };
