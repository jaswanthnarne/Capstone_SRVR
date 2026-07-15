const DocRequest = require('../models/DocRequest');
const DocSubmission = require('../models/DocSubmission');
const Team = require('../models/Team');

// Trainer: Create a document request
const createDocRequest = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { title, description, fileType, maxSize, batchId, targetTeams } = req.body;
    if (!title || !batchId) {
      return res.status(400).json({ success: false, message: 'Title and batchId are required' });
    }

    const docRequest = await DocRequest.create({
      title,
      description,
      fileType: fileType || 'any',
      maxSize: maxSize || 10,
      batchId,
      targetTeams: targetTeams || [],
      trainerId: req.user.id
    });

    res.status(201).json({ success: true, data: docRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer: Get all requests they created
const getTrainerDocRequests = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const requests = await DocRequest.find({ trainerId: req.user.id })
      .populate('batchId', 'name')
      .populate('targetTeams', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Team Lead: Get all requests targeted to their batch/team
const getTeamDocRequests = async (req, res) => {
  try {
    if (req.user.role !== 'teamlead') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const team = await Team.findById(req.user.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Find requests for this team's batch where either targetTeams is empty, or this team is in targetTeams
    const requests = await DocRequest.find({
      batchId: team.batchId,
      $or: [
        { targetTeams: { $size: 0 } },
        { targetTeams: team._id }
      ]
    }).sort({ createdAt: -1 });

    // For each request, check if the team has already submitted a document
    const requestsWithSubmission = await Promise.all(
      requests.map(async (reqItem) => {
        const submission = await DocSubmission.findOne({ requestId: reqItem._id, teamId: team._id });
        return {
          ...reqItem.toObject(),
          submission: submission ? {
            _id: submission._id,
            fileUrl: submission.fileUrl,
            fileName: submission.fileName,
            fileSize: submission.fileSize,
            submittedAt: submission.createdAt
          } : null
        };
      })
    );

    res.status(200).json({ success: true, data: requestsWithSubmission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Team Lead: Submit document
const submitDoc = async (req, res) => {
  try {
    if (req.user.role !== 'teamlead') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }

    const docRequest = await DocRequest.findById(requestId);
    if (!docRequest) {
      return res.status(404).json({ success: false, message: 'Document request not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileSizeInMB = req.file.size / (1024 * 1024);
    if (fileSizeInMB > docRequest.maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: `File size exceeds the limit of ${docRequest.maxSize}MB (your file is ${fileSizeInMB.toFixed(2)}MB)` 
      });
    }

    // Check file type extension matching docRequest.fileType
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (docRequest.fileType !== 'any') {
      let allowed = false;
      if (docRequest.fileType === 'pdf' && ext === 'pdf') allowed = true;
      if (docRequest.fileType === 'zip' && (ext === 'zip' || ext === 'rar' || ext === '7z')) allowed = true;
      if (docRequest.fileType === 'doc' && (ext === 'doc' || ext === 'docx')) allowed = true;
      
      if (!allowed) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid file type. The request requires a ${docRequest.fileType.toUpperCase()} file.` 
        });
      }
    }

    // Update existing submission or create a new one
    const submission = await DocSubmission.findOneAndUpdate(
      { requestId, teamId: req.user.id },
      {
        $set: {
          fileUrl: req.file.path,
          fileName: req.file.originalname,
          fileSize: parseFloat(fileSizeInMB.toFixed(2))
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer: Get all submissions for a request
const getRequestSubmissions = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { requestId } = req.params;
    const submissions = await DocSubmission.find({ requestId })
      .populate('teamId', 'name leadUsername')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Trainer: Delete a request
const deleteDocRequest = async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { id } = req.params;
    const docRequest = await DocRequest.findOneAndDelete({ _id: id, trainerId: req.user.id });
    if (!docRequest) {
      return res.status(404).json({ success: false, message: 'Document request not found' });
    }

    // Clean up all associated submissions
    await DocSubmission.deleteMany({ requestId: id });

    res.status(200).json({ success: true, message: 'Document request and associated submissions deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createDocRequest,
  getTrainerDocRequests,
  getTeamDocRequests,
  submitDoc,
  getRequestSubmissions,
  deleteDocRequest
};
