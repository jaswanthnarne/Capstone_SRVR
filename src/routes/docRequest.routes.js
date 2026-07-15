const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const {
  createDocRequest,
  getTrainerDocRequests,
  getTeamDocRequests,
  submitDoc,
  getRequestSubmissions,
  deleteDocRequest,
  resetSubmissionLimit,
} = require('../controllers/docRequest.controller');

// Trainer routes
router.get('/trainer', authenticate, requireRole('trainer'), getTrainerDocRequests);
router.post('/trainer', authenticate, requireRole('trainer'), createDocRequest);
router.delete('/trainer/:id', authenticate, requireRole('trainer'), deleteDocRequest);
router.get('/trainer/submissions/:requestId', authenticate, requireRole('trainer'), getRequestSubmissions);
router.post('/trainer/reset', authenticate, requireRole('trainer'), resetSubmissionLimit);

// Team lead routes
router.get('/team', authenticate, requireRole('teamlead'), getTeamDocRequests);
router.post('/team/submit', authenticate, requireRole('teamlead'), upload.single('docFile'), submitDoc);

module.exports = router;
