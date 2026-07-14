const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { upsertEvaluation, getAllEvaluations, getMyEvaluation } = require('../controllers/evaluation.controller');

// Trainer routes
router.get('/', authenticate, requireRole('trainer'), getAllEvaluations);
router.post('/', authenticate, requireRole('trainer'), upsertEvaluation);
router.put('/:id', authenticate, requireRole('trainer'), upsertEvaluation);

// Team lead route
router.get('/me', authenticate, requireRole('teamlead'), getMyEvaluation);

module.exports = router;
