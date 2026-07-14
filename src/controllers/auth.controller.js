const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Trainer = require('../models/Trainer');
const Team = require('../models/Team');
const Batch = require('../models/Batch');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Trainer Login ────────────────────────────────────────────────────────────
const trainerLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  const trainer = await Trainer.findOne({ email: email.toLowerCase() });
  if (!trainer)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, trainer.passwordHash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken({ id: trainer._id, role: 'trainer', name: trainer.name });

  res.json({
    success: true,
    token,
    user: { id: trainer._id, name: trainer.name, email: trainer.email, role: 'trainer' },
  });
};

// ─── Team Register ────────────────────────────────────────────────────────────
const teamRegister = async (req, res) => {
  const { teamName, leadUsername, password, members, inviteCode } = req.body;

  if (!teamName || !leadUsername || !password || !inviteCode)
    return res.status(400).json({ success: false, message: 'All fields are required' });

  // Find batch by invite code
  const batch = await Batch.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!batch)
    return res.status(404).json({ success: false, message: 'Invalid invite code' });

  // Check if username already exists
  const existing = await Team.findOne({ leadUsername });
  if (existing)
    return res.status(409).json({ success: false, message: 'Username already taken' });

  const passwordHash = await bcrypt.hash(password, 12);

  const team = await Team.create({
    name: teamName,
    batchId: batch._id,
    collegeId: batch.collegeId,
    leadUsername,
    passwordHash,
    members: members || [],
    status: 'problem_pending',
  });

  const token = signToken({
    id: team._id,
    role: 'teamlead',
    teamId: team._id.toString(),
    batchId: batch._id.toString(),
    collegeId: batch.collegeId.toString(),
    name: leadUsername,
  });

  res.status(201).json({
    success: true,
    token,
    user: {
      id: team._id,
      teamName: team.name,
      leadUsername: team.leadUsername,
      role: 'teamlead',
      batchId: batch._id,
      collegeId: batch.collegeId,
    },
  });
};

// ─── Team Login ───────────────────────────────────────────────────────────────
const teamLogin = async (req, res) => {
  const { leadUsername, password } = req.body;
  if (!leadUsername || !password)
    return res.status(400).json({ success: false, message: 'Username and password are required' });

  const team = await Team.findOne({ leadUsername });
  if (!team)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, team.passwordHash);
  if (!valid)
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken({
    id: team._id,
    role: 'teamlead',
    teamId: team._id.toString(),
    batchId: team.batchId.toString(),
    collegeId: team.collegeId.toString(),
    name: leadUsername,
  });

  res.json({
    success: true,
    token,
    user: {
      id: team._id,
      teamName: team.name,
      leadUsername: team.leadUsername,
      role: 'teamlead',
      batchId: team.batchId,
      collegeId: team.collegeId,
      status: team.status,
    },
  });
};

// ─── Trainer Bootstrap (create first trainer account) ───────────────────────
const trainerBootstrap = async (req, res) => {
  const count = await Trainer.countDocuments();
  if (count > 0)
    return res.status(409).json({ success: false, message: 'Trainer already exists' });

  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields required' });

  const passwordHash = await bcrypt.hash(password, 12);
  const trainer = await Trainer.create({ name, email: email.toLowerCase(), passwordHash });

  const token = signToken({ id: trainer._id, role: 'trainer', name: trainer.name });

  res.status(201).json({
    success: true,
    token,
    user: { id: trainer._id, name: trainer.name, email: trainer.email, role: 'trainer' },
  });
};

// ─── Unified Login ────────────────────────────────────────────────────────────
const unifiedLogin = async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Username/Email and password are required' });
  }

  // 1. Try trainer login
  let trainer = await Trainer.findOne({ email: usernameOrEmail.toLowerCase() });
  if (trainer) {
    const valid = await bcrypt.compare(password, trainer.passwordHash);
    if (valid) {
      const token = signToken({ id: trainer._id, role: 'trainer', name: trainer.name });
      return res.json({
        success: true,
        token,
        user: { id: trainer._id, name: trainer.name, email: trainer.email, role: 'trainer' },
      });
    }
  }

  // 2. Try team lead login
  let team = await Team.findOne({ leadUsername: usernameOrEmail });
  if (team) {
    const valid = await bcrypt.compare(password, team.passwordHash);
    if (valid) {
      const token = signToken({
        id: team._id,
        role: 'teamlead',
        teamId: team._id.toString(),
        batchId: team.batchId.toString(),
        collegeId: team.collegeId.toString(),
        name: team.leadUsername,
      });
      return res.json({
        success: true,
        token,
        user: {
          id: team._id,
          teamName: team.name,
          leadUsername: team.leadUsername,
          role: 'teamlead',
          batchId: team.batchId,
          collegeId: team.collegeId,
          status: team.status,
        },
      });
    }
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
};

module.exports = { trainerLogin, teamRegister, teamLogin, trainerBootstrap, unifiedLogin };
