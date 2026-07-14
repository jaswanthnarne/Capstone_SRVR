const Subject = require('../models/Subject');

const getSubjects = async (req, res) => {
  const subjects = await Subject.find({ trainerId: req.user.id }).sort({ name: 1 });
  res.json({ success: true, data: subjects });
};

const getSubject = async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, trainerId: req.user.id });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, data: subject });
};

const createSubject = async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const subject = await Subject.create({ name, description, color, trainerId: req.user.id });
  res.status(201).json({ success: true, data: subject });
};

const updateSubject = async (req, res) => {
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, trainerId: req.user.id },
    { $set: req.body },
    { new: true }
  );
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, data: subject });
};

const deleteSubject = async (req, res) => {
  const subject = await Subject.findOneAndDelete({ _id: req.params.id, trainerId: req.user.id });
  if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
  res.json({ success: true, message: 'Subject deleted' });
};

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject };
