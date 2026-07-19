const express = require('express');
const router = express.Router();
const { getMailLogs } = require('../controllers/mailLog.controller');
const { authenticate, authorizeTrainer } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorizeTrainer, getMailLogs);

module.exports = router;
