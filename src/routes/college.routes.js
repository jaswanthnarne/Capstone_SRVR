const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getColleges, getCollege, createCollege, updateCollege, deleteCollege, getCollegesSummary
} = require('../controllers/college.controller');

router.get('/summary', getCollegesSummary);

router.use(authenticate, requireRole('trainer'));
router.get('/', getColleges);
router.get('/:id', getCollege);
router.post('/', createCollege);
router.put('/:id', updateCollege);
router.delete('/:id', deleteCollege);

module.exports = router;
