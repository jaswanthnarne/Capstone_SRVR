const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getProblems, getProblem, createProblem, updateProblem, deleteProblem,
  getAvailableProblems, selectProblem,
} = require('../controllers/problem.controller');

// Trainer routes
router.get('/', authenticate, requireRole('trainer'), getProblems);
router.post('/', authenticate, requireRole('trainer'), createProblem);
router.put('/:id', authenticate, requireRole('trainer'), updateProblem);
router.delete('/:id', authenticate, requireRole('trainer'), deleteProblem);

// Team lead routes
router.get('/teamlead/available', authenticate, requireRole('teamlead'), getAvailableProblems);
router.post('/teamlead/select', authenticate, requireRole('teamlead'), selectProblem);

// Both trainer and team lead can view a single problem
router.get('/:id', authenticate, getProblem);

module.exports = router;
