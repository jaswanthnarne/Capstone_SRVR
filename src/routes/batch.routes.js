const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const {
  getBatches, getBatch, createBatch, updateBatch, deleteBatch, getInviteCode,
  uploadBatchTemplate, deleteBatchTemplate
} = require('../controllers/batch.controller');
const { upload } = require('../config/cloudinary');

router.use(authenticate, requireRole('trainer'));
router.get('/', getBatches);
router.get('/:id', getBatch);
router.get('/:id/invite-code', getInviteCode);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

router.post('/:id/templates', upload.single('file'), uploadBatchTemplate);
router.delete('/:id/templates/:templateId', deleteBatchTemplate);

module.exports = router;
