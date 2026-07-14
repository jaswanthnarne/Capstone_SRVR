const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getAllTeams,
  getTeamById,
  getMyTeam,
  updateMyTeam,
  createTeam,
  inviteMember,
  adminOverrideTeam,
  getMyInvitations,
  resendInvitation,
  cancelInvitation,
  deleteTeam
} = require('../controllers/team.controller');

// Team lead static routes
router.get('/me/profile', authenticate, requireRole('teamlead'), getMyTeam);
router.get('/my-invitations', authenticate, requireRole('teamlead'), getMyInvitations);

// Trainer general routes
router.get('/', authenticate, requireRole('trainer'), getAllTeams);
router.post('/', authenticate, requireRole('trainer'), createTeam);

// Team lead action routes
router.put('/me/profile', authenticate, requireRole('teamlead'), updateMyTeam);
router.post('/invite-member', authenticate, requireRole('teamlead'), inviteMember);
router.post('/invitations/:id/resend', authenticate, requireRole('teamlead'), resendInvitation);
router.delete('/invitations/:id', authenticate, requireRole('teamlead'), cancelInvitation);

// Parameterized trainer routes (wildcard/parameterized routes at the end)
router.get('/:id', authenticate, requireRole('trainer'), getTeamById);
router.delete('/:id', authenticate, requireRole('trainer'), deleteTeam);
router.put('/override/:id', authenticate, requireRole('trainer'), adminOverrideTeam);

module.exports = router;


