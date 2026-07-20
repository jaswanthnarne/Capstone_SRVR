const express = require('express');
const router = express.Router();
const { getMailLogs } = require('../controllers/mailLog.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, requireRole('trainer'), getMailLogs);

module.exports = router;
