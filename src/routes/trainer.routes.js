const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { getDashboard, getProfile } = require('../controllers/trainer.controller');

router.use(authenticate, requireRole('trainer'));
router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);

module.exports = router;
