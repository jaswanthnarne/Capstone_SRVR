const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  saveDailyLog,
  getMyDailyLogs,
  getTeamDailyLogs,
  resetDailyLogLimit,
  gradeDailyLog,
  releaseDailyLogScore,
  getAllDailyLogs,
  overrideDailyLog,
} = require('../controllers/dailyLog.controller');

router.post('/', authenticate, requireRole('teamlead'), saveDailyLog);
router.get('/me', authenticate, requireRole('teamlead'), getMyDailyLogs);
router.get('/team/:teamId', authenticate, requireRole('trainer'), getTeamDailyLogs);
router.post('/trainer/reset', authenticate, requireRole('trainer'), resetDailyLogLimit);
router.post('/trainer/grade', authenticate, requireRole('trainer'), gradeDailyLog);
router.post('/trainer/release', authenticate, requireRole('trainer'), releaseDailyLogScore);
router.get('/all', authenticate, requireRole('trainer'), getAllDailyLogs);
router.post('/trainer/override', authenticate, requireRole('trainer'), overrideDailyLog);

module.exports = router;
