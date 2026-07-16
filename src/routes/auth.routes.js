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
} = require('../controllers/auth.controller');
const { acceptInvitation } = require('../controllers/team.controller');

router.post('/trainer/bootstrap', trainerBootstrap); // Create first trainer account
router.post('/trainer/login', trainerLogin);
router.post('/team/register', teamRegister);
router.post('/team/login', teamLogin);
router.post('/login', unifiedLogin);
router.post('/accept-invitation', acceptInvitation);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
