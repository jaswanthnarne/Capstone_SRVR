const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  saveDailyLog,
  getMyDailyLogs,
  getTeamDailyLogs,
} = require('../controllers/dailyLog.controller');

router.post('/', authenticate, requireRole('teamlead'), saveDailyLog);
router.get('/me', authenticate, requireRole('teamlead'), getMyDailyLogs);
router.get('/team/:teamId', authenticate, requireRole('trainer'), getTeamDailyLogs);

module.exports = router;
