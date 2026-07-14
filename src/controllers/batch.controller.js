const Batch = require('../models/Batch');
const College = require('../models/College');
const Subject = require('../models/Subject');
const { cloudinary } = require('../config/cloudinary');

const getBatches = async (req, res) => {
  const filter = { trainerId: req.user.id };
  if (req.query.collegeId) filter.collegeId = req.query.collegeId;
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.status) filter.status = req.query.status;

  const batches = await Batch.find(filter)
    .populate('collegeId', 'name location')
    .populate('subjectId', 'name color')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: batches });
};

const getBatch = async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.id, trainerId: req.user.id })
    .populate('collegeId', 'name location')
    .populate('subjectId', 'name color');
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  res.json({ success: true, data: batch });
};

const createBatch = async (req, res) => {
  const { name, collegeId, subjectId, startDate, endDate, maxTeams, minMembers, maxMembers } = req.body;
  if (!name || !collegeId || !subjectId || !startDate || !endDate)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  // Verify college belongs to trainer
  const college = await College.findOne({ _id: collegeId, trainerId: req.user.id });
  if (!college) return res.status(404).json({ success: false, message: 'College not found' });

  const batch = await Batch.create({
    name,
    collegeId,
    subjectId,
    startDate,
    endDate,
    maxTeams: maxTeams || 30,
    minMembers: minMembers || 2,
    maxMembers: maxMembers || 6,
    isProblemSelectionLocked: req.body.isProblemSelectionLocked || false,
    departments: req.body.departments || [],
    divisions: req.body.divisions || [],
    rooms: req.body.rooms || [],
    courses: req.body.courses || [],
    trainerId: req.user.id,
  });

  const populated = await batch.populate([
    { path: 'collegeId', select: 'name location' },
    { path: 'subjectId', select: 'name color' },
  ]);

  res.status(201).json({ success: true, data: populated });
};

const updateBatch = async (req, res) => {
  const batch = await Batch.findOneAndUpdate(
    { _id: req.params.id, trainerId: req.user.id },
    { $set: req.body },
    { new: true }
  ).populate('collegeId', 'name').populate('subjectId', 'name');
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  res.json({ success: true, data: batch });
};

const deleteBatch = async (req, res) => {
  const batch = await Batch.findOneAndDelete({ _id: req.params.id, trainerId: req.user.id });
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  res.json({ success: true, message: 'Batch deleted' });
};

// Get invite code for a batch
const getInviteCode = async (req, res) => {
  const batch = await Batch.findOne({ _id: req.params.id, trainerId: req.user.id })
    .select('inviteCode name');
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
  res.json({ success: true, data: { inviteCode: batch.inviteCode, batchName: batch.name } });
};

// Upload template file to batch
const uploadBatchTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name || req.file?.originalname || 'Template';

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a template file' });
    }

    const batch = await Batch.findOne({ _id: id, trainerId: req.user.id });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    batch.templates.push({
      name,
      url: req.file.path,
      publicId: req.file.filename
    });

    await batch.save();
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete template file from batch
const deleteBatchTemplate = async (req, res) => {
  try {
    const { id, templateId } = req.params;

    const batch = await Batch.findOne({ _id: id, trainerId: req.user.id });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const template = batch.templates.id(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(template.publicId, { resource_type: 'raw' });
    } catch (e) {
      console.error('Failed to destroy Cloudinary template', e);
    }

    // Remove from array
    batch.templates.pull(templateId);
    await batch.save();

    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getBatches, 
  getBatch, 
  createBatch, 
  updateBatch, 
  deleteBatch, 
  getInviteCode,
  uploadBatchTemplate,
  deleteBatchTemplate
};
