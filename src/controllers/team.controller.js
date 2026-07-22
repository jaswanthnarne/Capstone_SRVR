const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const Invitation = require('../models/Invitation');
const ProblemLock = require('../models/ProblemLock');
const { sendTLCredentials, sendMemberInvitation } = require('../services/mail.service');

// Trainer: get all teams
const getAllTeams = async (req, res) => {
  const filter = {};
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  if (req.query.batchId) filter.batchId = req.query.batchId;
  if (req.query.status) filter.status = req.query.status;

  const teams = await Team.find(filter)
    .populate('batchId', 'name startDate endDate status')
    .populate('collegeId', 'name location')
    .populate('problemStatementId', 'title')
    .select('-passwordHash')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: teams });
};

// Trainer: get one team
const getTeamById = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('batchId', 'name startDate endDate status inviteCode minMembers maxMembers')
    .populate('collegeId', 'name location')
    .populate('problemStatementId')
    .select('-passwordHash');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
  res.json({ success: true, data: team });
};

// Team Lead: get their own profile
const getMyTeam = async (req, res) => {
  const team = await Team.findById(req.user.teamId)
    .populate('batchId', 'name startDate endDate status subjectId minMembers maxMembers departments divisions rooms courses isProblemSelectionLocked templates')
    .populate('collegeId', 'name location')
    .populate('problemStatementId')
    .select('-passwordHash');
  if (!team) return res.status(401).json({ success: false, message: 'Team account no longer exists. Please log in again.' });
  res.json({ success: true, data: team });
};

// Team Lead: update team info (add/remove members, update team name)
const updateMyTeam = async (req, res) => {
  const { name, members } = req.body;

  const team = await Team.findById(req.user.teamId).populate('batchId');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // Enforce member size constraints if members are updated (including TL)
  if (members !== undefined) {
    const min = team.batchId?.minMembers ?? 2;
    const max = team.batchId?.maxMembers ?? 6;
    const totalCount = members.length + 1;
    if (totalCount < min || totalCount > max) {
      return res.status(400).json({
        success: false,
        message: `Team size must be between ${min} and ${max} members (including the Team Lead).`
      });
    }
  }

  const update = {};
  if (name) update.name = name;
  if (members) update.members = members;
  if (req.body.leadName !== undefined) update.leadName = req.body.leadName;
  if (req.body.usnRollNumber !== undefined) update.usnRollNumber = req.body.usnRollNumber;
  if (req.body.mobile !== undefined) update.mobile = req.body.mobile;
  if (req.body.dept !== undefined) update.dept = req.body.dept;
  if (req.body.division !== undefined) update.division = req.body.division;
  if (req.body.roomNumber !== undefined) update.roomNumber = req.body.roomNumber;
  if (req.body.courseName !== undefined) update.courseName = req.body.courseName;

  const updatedTeam = await Team.findByIdAndUpdate(
    req.user.teamId,
    { $set: update },
    { new: true }
  ).select('-passwordHash');

  res.json({ success: true, data: updatedTeam });
};

// Trainer: create team (TL account with credentials emailing, optional pre-filled members)
const createTeam = async (req, res) => {
  const { name, leadUsername, password, email, batchId, members } = req.body;
  if (!name || !leadUsername || !password || !email || !batchId) {
    return res.status(400).json({ success: false, message: 'All fields (name, leadUsername, password, email, batchId) are required' });
  }

  const existing = await Team.findOne({ leadUsername });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Lead username already taken' });
  }

  const batch = await Batch.findById(batchId);
  if (!batch) {
    return res.status(404).json({ success: false, message: 'Batch not found' });
  }

  // Validate member registrations if members list is supplied directly
  let validMembers = [];
  if (members && Array.isArray(members)) {
    const max = batch.maxMembers || 6;
    const totalCount = members.length + 1; // including TL
    if (totalCount > max) {
      return res.status(400).json({ success: false, message: `Team size cannot exceed ${max} members (including the Team Lead).` });
    }

    for (const m of members) {
      if (!m.name || !m.rollNumber || !m.email) {
        return res.status(400).json({ success: false, message: 'Each member must have name, rollNumber, and email' });
      }
      // Check if registration number already in a team in this batch
      const studentExists = await Team.findOne({
        batchId,
        'members.rollNumber': m.rollNumber
      });
      if (studentExists) {
        return res.status(409).json({ success: false, message: `Student with Roll Number "${m.rollNumber}" is already in a team.` });
      }
      validMembers.push(m);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const team = await Team.create({
    name,
    leadUsername,
    email,
    passwordHash,
    batchId,
    collegeId: batch.collegeId,
    members: validMembers,
    status: 'problem_pending'
  });

  // Trigger credentials email
  sendTLCredentials(email, leadUsername, password, batch.name).catch(err => console.error("SMTP TL credentials mail error:", err));

  const cleanTeam = team.toObject();
  delete cleanTeam.passwordHash;

  res.status(201).json({ success: true, data: cleanTeam });
};

// Team Lead: invite member by email
const inviteMember = async (req, res) => {
  const { name, rollNumber, email, mobile, dept, division, roomNumber, courseName } = req.body;
  if (!name || !rollNumber || !email) {
    return res.status(400).json({ success: false, message: 'Name, Roll Number, and Email are required' });
  }

  const team = await Team.findById(req.user.teamId).populate('batchId');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // 1. Check batch constraints (including TL)
  const max = team.batchId?.maxMembers ?? 6;
  const totalCount = team.members.length + 1; // including TL
  if (totalCount >= max) {
    return res.status(400).json({ success: false, message: `Team is already full (Max allowed: ${max} members including the Team Lead)` });
  }

  // 2. Check if student already in a team in this batch
  const alreadyInTeam = await Team.findOne({
    batchId: team.batchId._id,
    'members.rollNumber': rollNumber
  });
  if (alreadyInTeam) {
    return res.status(409).json({ success: false, message: `A student with roll number "${rollNumber}" is already in a team.` });
  }

  // 3. Check if they have a pending invitation
  const pendingInv = await Invitation.findOne({
    batchId: team.batchId._id,
    rollNumber,
    status: 'sent'
  });
  if (pendingInv) {
    return res.status(409).json({ success: false, message: `A student with roll number "${rollNumber}" already has a pending invitation.` });
  }

  // 4. Generate token and create invitation
  const token = crypto.randomBytes(32).toString('hex');
  const invitation = await Invitation.create({
    teamId: team._id,
    batchId: team.batchId._id,
    name,
    rollNumber,
    email,
    mobile: mobile || '',
    dept: dept || '',
    division: division || '',
    roomNumber: roomNumber || '',
    courseName: courseName || '',
    token
  });

  // 5. Send email
  const acceptLink = `${(process.env.FRONTEND_URL || 'http://localhost:5173').trim()}/accept-invitation/${token}`;
  sendMemberInvitation(email, name, team.name, team.batchId.name, acceptLink).catch(err => console.error("SMTP invitation mail error:", err));

  res.status(201).json({ success: true, message: 'Invitation sent successfully!', data: invitation });
};

// Student: accept invitation (unauthenticated public link endpoint)
const acceptInvitation = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

  const invitation = await Invitation.findOne({ token, status: 'sent' });
  if (!invitation) return res.status(404).json({ success: false, message: 'Invalid or expired invitation token' });

  const team = await Team.findById(invitation.teamId).populate('batchId');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const max = team.batchId?.maxMembers ?? 6;
  const totalCount = team.members.length + 1; // including TL
  if (totalCount >= max) {
    return res.status(400).json({ success: false, message: `This team is already full (Max allowed: ${max} members including the Team Lead).` });
  }

  const studentExists = await Team.findOne({
    batchId: invitation.batchId,
    'members.rollNumber': invitation.rollNumber
  });
  if (studentExists) {
    return res.status(409).json({ success: false, message: 'You are already registered in a team.' });
  }

  // Add member to team
  team.members.push({
    name: invitation.name,
    rollNumber: invitation.rollNumber,
    email: invitation.email,
    mobile: invitation.mobile || '',
    dept: invitation.dept || '',
    division: invitation.division || '',
    roomNumber: invitation.roomNumber || '',
    courseName: invitation.courseName || '',
  });

  if (team.status === 'problem_pending' && team.problemStatementId) {
    team.status = 'in_progress';
  }
  await team.save();

  invitation.status = 'accepted';
  await invitation.save();

  res.json({ success: true, message: 'Invitation accepted! You have successfully joined the team.' });
};

// Trainer: Admin overrides/updates any team parameters directly (override constraints)
const adminOverrideTeam = async (req, res) => {
  const { id } = req.params;
  const {
    name, leadUsername, password, email, members, problemStatementId, status,
    leadName, usnRollNumber, mobile, dept, division, roomNumber, courseName
  } = req.body;

  const team = await Team.findById(id);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const update = {};
  if (name) update.name = name;
  if (leadUsername) {
    const existing = await Team.findOne({ leadUsername, _id: { $ne: id } });
    if (existing) return res.status(409).json({ success: false, message: 'Username already taken' });
    update.leadUsername = leadUsername;
  }
  if (email) update.email = email;
  if (password) {
    update.passwordHash = await bcrypt.hash(password, 12);
  }
  if (members !== undefined) {
    update.members = members;
  }
  if (problemStatementId !== undefined) {
    const newProblemId = problemStatementId === '' ? null : problemStatementId;
    update.problemStatementId = newProblemId;

    // Release any old lock for this team
    await ProblemLock.deleteMany({ teamId: id });
    if (newProblemId) {
      // Create new lock for the team and batch
      await ProblemLock.create({
        problemStatementId: newProblemId,
        batchId: team.batchId,
        teamId: id,
      }).catch((e) => {
        console.error('Failed to create problem lock during admin override:', e.message);
      });
    }
  }
  if (status) {
    update.status = status;
  }
  if (leadName !== undefined) update.leadName = leadName;
  if (usnRollNumber !== undefined) update.usnRollNumber = usnRollNumber;
  if (mobile !== undefined) update.mobile = mobile;
  if (dept !== undefined) update.dept = dept;
  if (division !== undefined) update.division = division;
  if (roomNumber !== undefined) update.roomNumber = roomNumber;
  if (courseName !== undefined) update.courseName = courseName;

  const updatedTeam = await Team.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).select('-passwordHash');

  res.json({ success: true, message: 'Team details overridden successfully', data: updatedTeam });
};

// Team Lead: get pending/sent invitations for their team
const getMyInvitations = async (req, res) => {
  const invitations = await Invitation.find({ teamId: req.user.teamId, status: 'sent' }).sort({ createdAt: -1 });
  res.json({ success: true, data: invitations });
};

// Team Lead: resend a pending invitation email
const resendInvitation = async (req, res) => {
  const { id } = req.params;
  const invitation = await Invitation.findOne({ _id: id, teamId: req.user.teamId, status: 'sent' });
  if (!invitation) return res.status(404).json({ success: false, message: 'Pending invitation not found' });

  const team = await Team.findById(req.user.teamId).populate('batchId');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitation.token}`;
  await sendMemberInvitation(invitation.email, invitation.name, team.name, team.batchId.name, acceptLink);

  res.json({ success: true, message: 'Invitation resent successfully!' });
};

// Team Lead: cancel/delete a pending invitation
const cancelInvitation = async (req, res) => {
  const { id } = req.params;
  const invitation = await Invitation.findOneAndDelete({ _id: id, teamId: req.user.teamId, status: 'sent' });
  if (!invitation) return res.status(404).json({ success: false, message: 'Pending invitation not found' });

  res.json({ success: true, message: 'Invitation cancelled successfully' });
};

// Trainer: delete a team entirely
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const Submission = require('../models/Submission');
    const Evaluation = require('../models/Evaluation');
    const ProblemLock = require('../models/ProblemLock');

    const submissions = await Submission.find({ teamId: id });
    const subIds = submissions.map(s => s._id);

    await Evaluation.deleteMany({ submissionId: { $in: subIds } });
    await Submission.deleteMany({ teamId: id });
    await ProblemLock.deleteMany({ teamId: id });
    
    await Team.findByIdAndDelete(id);

    res.json({ success: true, message: 'Team and all associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllTeams,
  getTeamById,
  getMyTeam,
  updateMyTeam,
  createTeam,
  inviteMember,
  acceptInvitation,
  adminOverrideTeam,
  getMyInvitations,
  resendInvitation,
  cancelInvitation,
  deleteTeam
};
