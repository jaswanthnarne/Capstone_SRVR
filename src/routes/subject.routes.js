const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getSubjects, getSubject, createSubject, updateSubject, deleteSubject,
} = require('../controllers/subject.controller');

router.use(authenticate, requireRole('trainer'));
router.get('/', getSubjects);
router.get('/:id', getSubject);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
