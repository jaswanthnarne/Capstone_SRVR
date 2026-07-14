const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getBatchReport, getCollegeReport, getTeamReport, getPortfolioReport,
  getStudentExport, exportBatchPDF,
} = require('../controllers/report.controller');

router.use(authenticate, requireRole('trainer'));

router.get('/batch/:batchId', getBatchReport);
router.get('/batch/:batchId/pdf', exportBatchPDF);
router.get('/college/:collegeId', getCollegeReport);
router.get('/team/:teamId', getTeamReport);
router.get('/portfolio', getPortfolioReport);
router.get('/students/export', getStudentExport);

module.exports = router;
