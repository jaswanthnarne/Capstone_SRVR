const mongoose = require('mongoose');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const College = require('../models/College');
const Submission = require('../models/Submission');
const Evaluation = require('../models/Evaluation');
const Milestone = require('../models/Milestone');
const ExcelJS = require('exceljs');

// ─── 1. Batch Progress Report ────────────────────────────────────────────────
const getBatchReport = async (req, res) => {
  const { batchId } = req.params;

  const batch = await Batch.findById(batchId)
    .populate('collegeId', 'name location')
    .populate('subjectId', 'name');

  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

  const teams = await Team.aggregate([
    { $match: { batchId: new mongoose.Types.ObjectId(batchId) } },
    {
      $lookup: {
        from: 'problemstatements',
        localField: 'problemStatementId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: { path: '$problem', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'milestones',
        localField: '_id',
        foreignField: 'teamId',
        as: 'milestones',
      },
    },
    {
      $lookup: {
        from: 'submissions',
        localField: '_id',
        foreignField: 'teamId',
        as: 'submission',
      },
    },
    { $unwind: { path: '$submission', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'evaluations',
        localField: 'submission._id',
        foreignField: 'submissionId',
        as: 'evaluation',
      },
    },
    { $unwind: { path: '$evaluation', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1, leadUsername: 1, members: 1, status: 1,
        problem: { title: 1 },
        milestones: { stageName: 1, status: 1, updatedAt: 1 },
        submission: { githubUrl: 1, deployedUrl: 1, submittedAt: 1, isLate: 1 },
        evaluation: { score: 1, feedback: 1 },
      },
    },
  ]);

  res.json({ success: true, data: { batch, teams } });
};

// ─── 2. College Summary Report ───────────────────────────────────────────────
const getCollegeReport = async (req, res) => {
  const { collegeId } = req.params;

  const college = await College.findById(collegeId);
  if (!college) return res.status(404).json({ success: false, message: 'College not found' });

  const summary = await Batch.aggregate([
    { $match: { collegeId: new mongoose.Types.ObjectId(collegeId) } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: 'batchId',
        as: 'teams',
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subjectId',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        totalTeams: { $size: '$teams' },
        submittedTeams: {
          $size: {
            $filter: {
              input: '$teams',
              as: 't',
              cond: { $eq: ['$$t.status', 'submitted'] },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'evaluations',
        let: { batchId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$batchId', '$$batchId'] } } },
          { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
        ],
        as: 'evalStats',
      },
    },
    { $unwind: { path: '$evalStats', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: 1, startDate: 1, endDate: 1, status: 1,
        'subject.name': 1,
        totalTeams: 1,
        submittedTeams: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalTeams', 0] },
            { $multiply: [{ $divide: ['$submittedTeams', '$totalTeams'] }, 100] },
            0,
          ],
        },
        avgScore: { $ifNull: ['$evalStats.avgScore', null] },
      },
    },
  ]);

  res.json({ success: true, data: { college, batches: summary } });
};

// ─── 3. Team Evaluation Sheet ─────────────────────────────────────────────────
const getTeamReport = async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId)
    .populate('batchId', 'name startDate endDate')
    .populate('collegeId', 'name')
    .populate('problemStatementId')
    .select('-passwordHash');

  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  const milestones = await Milestone.find({ teamId }).sort({ stageIndex: 1 });
  const submission = await Submission.findOne({ teamId });
  const evaluation = submission
    ? await Evaluation.findOne({ submissionId: submission._id })
    : null;

  res.json({
    success: true,
    data: { team, milestones, submission, evaluation },
  });
};

// ─── 4. Trainer Portfolio Report (aggregation) ───────────────────────────────
const getPortfolioReport = async (req, res) => {
  const trainerId = new mongoose.Types.ObjectId(req.user.id);

  const [portfolio] = await College.aggregate([
    { $match: { trainerId } },
    {
      $lookup: {
        from: 'batches',
        localField: '_id',
        foreignField: 'collegeId',
        as: 'batches',
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: 'collegeId',
        as: 'teams',
      },
    },
    {
      $group: {
        _id: null,
        totalColleges: { $sum: 1 },
        totalBatches: { $sum: { $size: '$batches' } },
        totalTeams: { $sum: { $size: '$teams' } },
        totalStudents: {
          $sum: {
            $reduce: {
              input: '$teams',
              initialValue: 0,
              in: { $add: ['$$value', { $size: { $ifNull: ['$$this.members', []] } }] },
            },
          },
        },
        submittedCapstones: {
          $sum: {
            $size: {
              $filter: {
                input: '$teams',
                as: 't',
                cond: { $eq: ['$$t.status', 'submitted'] },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: ['$totalTeams', 0] },
            { $multiply: [{ $divide: ['$submittedCapstones', '$totalTeams'] }, 100] },
            0,
          ],
        },
      },
    },
  ]);

  // Average score across all evaluations by this trainer
  const scoreStats = await Evaluation.aggregate([
    { $match: { trainerId } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        totalEvaluated: { $sum: 1 },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      ...(portfolio || {
        totalColleges: 0, totalBatches: 0, totalTeams: 0,
        totalStudents: 0, submittedCapstones: 0, completionRate: 0,
      }),
      ...(scoreStats[0] || { avgScore: null, totalEvaluated: 0 }),
    },
  });
};

// ─── 5. Student-level Excel Export ────────────────────────────────────────────
const getStudentExport = async (req, res) => {
  const trainerId = req.user.id;
  const filter = {};
  if (req.query.batchId) filter.batchId = new mongoose.Types.ObjectId(req.query.batchId);
  if (req.query.collegeId) filter.collegeId = new mongoose.Types.ObjectId(req.query.collegeId);

  const teams = await Team.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'colleges',
        localField: 'collegeId',
        foreignField: '_id',
        as: 'college',
      },
    },
    { $unwind: '$college' },
    {
      $lookup: {
        from: 'batches',
        localField: 'batchId',
        foreignField: '_id',
        as: 'batch',
      },
    },
    { $unwind: '$batch' },
    {
      $lookup: {
        from: 'problemstatements',
        localField: 'problemStatementId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: { path: '$problem', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'submissions',
        localField: '_id',
        foreignField: 'teamId',
        as: 'submission',
      },
    },
    { $unwind: { path: '$submission', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'evaluations',
        localField: 'submission._id',
        foreignField: 'submissionId',
        as: 'evaluation',
      },
    },
    { $unwind: { path: '$evaluation', preserveNullAndEmptyArrays: true } },
    { $unwind: '$members' },
    {
      $project: {
        studentName: '$members.name',
        rollNumber: '$members.rollNumber',
        teamName: '$name',
        college: '$college.name',
        batch: '$batch.name',
        problemTitle: { $ifNull: ['$problem.title', 'Not Selected'] },
        githubUrl: { $ifNull: ['$submission.githubUrl', ''] },
        score: { $ifNull: ['$evaluation.score', ''] },
        status: 1,
      },
    },
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.columns = [
    { header: 'Student Name', key: 'studentName', width: 25 },
    { header: 'Roll Number', key: 'rollNumber', width: 15 },
    { header: 'Team', key: 'teamName', width: 20 },
    { header: 'College', key: 'college', width: 25 },
    { header: 'Batch', key: 'batch', width: 15 },
    { header: 'Problem Statement', key: 'problemTitle', width: 30 },
    { header: 'GitHub URL', key: 'githubUrl', width: 35 },
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  // Header styling
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B5BDB' } };

  teams.forEach((t) => sheet.addRow(t));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students_export.xlsx');
  await workbook.xlsx.write(res);
  res.end();
};

// ─── PDF Export (Batch Report) ────────────────────────────────────────────────
const exportBatchPDF = async (req, res) => {
  const { batchId } = req.params;
  
  // Get the data
  const batch = await Batch.findById(batchId)
    .populate('collegeId', 'name location')
    .populate('subjectId', 'name');
  
  const teams = await Team.find({ batchId })
    .populate('problemStatementId', 'title')
    .select('-passwordHash');

  const submissions = await Submission.find({ batchId });
  const submissionIds = submissions.map(s => s._id);
  const evaluations = await Evaluation.find({ submissionId: { $in: submissionIds } });

  // Build simple HTML for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #222; padding: 30px; }
        h1 { color: #3b5bdb; } h2 { color: #444; border-bottom: 1px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #3b5bdb; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f7f7f7; }
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .submitted { background: #d3f9d8; color: #2b8a3e; }
        .in_progress { background: #fff3bf; color: #856404; }
        .problem_pending { background: #dee2e6; color: #495057; }
      </style>
    </head>
    <body>
      <h1>📋 Batch Progress Report</h1>
      <p><strong>Batch:</strong> ${batch?.name}</p>
      <p><strong>College:</strong> ${batch?.collegeId?.name}</p>
      <p><strong>Subject:</strong> ${batch?.subjectId?.name}</p>
      <p><strong>Period:</strong> ${batch?.startDate?.toLocaleDateString()} – ${batch?.endDate?.toLocaleDateString()}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <h2>Teams</h2>
      <table>
        <tr>
          <th>Team</th><th>Lead</th><th>Members</th>
          <th>Problem</th><th>Status</th><th>Score</th>
        </tr>
        ${teams.map(t => {
          const sub = submissions.find(s => s.teamId.toString() === t._id.toString());
          const ev = sub ? evaluations.find(e => e.submissionId.toString() === sub._id.toString()) : null;
          return `<tr>
            <td>${t.name}</td>
            <td>${t.leadUsername}</td>
            <td>${t.members?.length || 0}</td>
            <td>${t.problemStatementId?.title || '—'}</td>
            <td><span class="badge ${t.status}">${t.status}</span></td>
            <td>${ev ? ev.score + '/100' : '—'}</td>
          </tr>`;
        }).join('')}
      </table>
    </body>
    </html>
  `;

  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=batch_${batchId}_report.pdf`);
    res.send(pdf);
  } catch (err) {
    // Fallback: send HTML if puppeteer fails
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
};

module.exports = {
  getBatchReport, getCollegeReport, getTeamReport, getPortfolioReport,
  getStudentExport, exportBatchPDF,
};
