const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getMilestones, updateMilestone } = require('../controllers/milestone.controller');

// Trainer can get milestones for any team
router.get('/team/:teamId', authenticate, requireRole('trainer'), getMilestones);

// Team lead can only access their own milestones
router.get('/me', authenticate, requireRole('teamlead'), getMilestones);
router.put('/me', authenticate, requireRole('teamlead'), updateMilestone);

// Trainer can also update milestones
router.put('/team', authenticate, requireRole('trainer'), updateMilestone);

module.exports = router;
