const express = require('express');
const router = express.Router();
const {
  trainerLogin,
  teamRegister,
  teamLogin,
  trainerBootstrap,
  unifiedLogin,
  forgotPassword,
  resetPassword,
  changeFirstPassword,
} = require('../controllers/auth.controller');
const { acceptInvitation } = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/trainer/bootstrap', trainerBootstrap); // Create first trainer account
router.post('/trainer/login', trainerLogin);
router.post('/team/register', teamRegister);
router.post('/team/login', teamLogin);
router.post('/login', unifiedLogin);
router.post('/accept-invitation', acceptInvitation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changeFirstPassword);

module.exports = router;
