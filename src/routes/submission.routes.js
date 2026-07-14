const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const {
  createSubmission, getMySubmission, getAllSubmissions, getSubmissionById,
} = require('../controllers/submission.controller');

// Team lead routes
router.post('/me', authenticate, requireRole('teamlead'), upload.single('docFile'), createSubmission);
router.get('/me', authenticate, requireRole('teamlead'), getMySubmission);

// Trainer routes
router.get('/', authenticate, requireRole('trainer'), getAllSubmissions);
router.get('/:id', authenticate, requireRole('trainer'), getSubmissionById);

module.exports = router;
