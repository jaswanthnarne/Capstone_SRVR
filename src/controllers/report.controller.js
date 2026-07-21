const mongoose = require('mongoose');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const College = require('../models/College');
const Submission = require('../models/Submission');
const Evaluation = require('../models/Evaluation');
const Milestone = require('../models/Milestone');
const ExcelJS = require('exceljs');
const DailyLog = require('../models/DailyLog');


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
  const filter = {};
  if (req.query.batchId) filter.batchId = new mongoose.Types.ObjectId(req.query.batchId);
  if (req.query.collegeId) filter.collegeId = new mongoose.Types.ObjectId(req.query.collegeId);

  // Fetch the data
  const teams = await Team.find(filter)
    .populate('batchId', 'name')
    .populate('collegeId', 'name')
    .populate('problemStatementId', 'title')
    .select('-passwordHash');

  const submissions = await Submission.find(filter);
  const evaluations = await Evaluation.find(filter);
  const dailyLogs = await DailyLog.find({ teamId: { $in: teams.map(t => t._id) } }).sort({ date: 1 });

  const workbook = new ExcelJS.Workbook();

  // 1. Overview / Summary Worksheet
  const summarySheet = workbook.addWorksheet('Overview');
  summarySheet.columns = [
    { header: 'Team Name', key: 'teamName', width: 25 },
    { header: 'Lead Name', key: 'leadName', width: 20 },
    { header: 'Lead Username', key: 'leadUsername', width: 15 },
    { header: 'Members Count', key: 'membersCount', width: 15 },
    { header: 'College', key: 'college', width: 25 },
    { header: 'Batch', key: 'batch', width: 15 },
    { header: 'Problem Statement', key: 'problemTitle', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Final Score', key: 'score', width: 12 },
    { header: 'Frontend Repo', key: 'frontendRepo', width: 35 },
    { header: 'Backend Repo', key: 'backendRepo', width: 35 },
    { header: 'Deployed App', key: 'deployedUrl', width: 35 }
  ];

  // Summary sheet header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5394' } }; // Dark blue

  teams.forEach(t => {
    const sub = submissions.find(s => s.teamId.toString() === t._id.toString());
    const ev = sub ? evaluations.find(e => e.submissionId.toString() === sub._id.toString()) : null;
    
    summarySheet.addRow({
      teamName: t.name,
      leadName: t.leadName || '—',
      leadUsername: t.leadUsername,
      membersCount: (t.members?.length || 0) + 1,
      college: t.collegeId?.name || '—',
      batch: t.batchId?.name || '—',
      problemTitle: t.problemStatementId?.title || 'Not Selected',
      status: t.status,
      score: ev ? ev.score : '—',
      frontendRepo: sub ? sub.githubUrl : '',
      backendRepo: sub ? sub.backendGithubUrl : '',
      deployedUrl: sub ? sub.deployedUrl : ''
    });
  });

  // 2. Individual Team Worksheets (each team on a separate sheet)
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const sub = submissions.find(s => s.teamId.toString() === t._id.toString());
    const ev = sub ? evaluations.find(e => e.submissionId.toString() === sub._id.toString()) : null;
    const teamLogs = dailyLogs.filter(log => log.teamId.toString() === t._id.toString());

    // Excel sheet name limit is 31 chars. Remove invalid characters like :, \, /, ?, *, [, ]
    let cleanSheetName = t.name.replace(/[:\\/?*\[\]]/g, '').substring(0, 30);
    // Ensure uniqueness of sheet name in case of overlaps after truncation
    let finalSheetName = cleanSheetName;
    let count = 1;
    while (workbook.getWorksheet(finalSheetName)) {
      finalSheetName = `${cleanSheetName.substring(0, 27)} (${count++})`;
    }

    const teamSheet = workbook.addWorksheet(finalSheetName);

    // Profile metadata headers
    teamSheet.addRow(['TEAM PROFILE:', t.name]).font = { bold: true, size: 12 };
    teamSheet.addRow(['Lead Developer:', `${t.leadName || '—'} (${t.leadUsername})`]);
    teamSheet.addRow(['College / Campus:', t.collegeId?.name || '—']);
    teamSheet.addRow(['Batch Name:', t.batchId?.name || '—']);
    teamSheet.addRow(['Problem Statement:', t.problemStatementId?.title || 'Not Selected']);
    teamSheet.addRow(['Capstone Status:', t.status.toUpperCase()]);
    teamSheet.addRow(['Final Evaluation Score:', ev ? `${ev.score}/100` : 'Not Evaluated']);
    
    let linksStr = '—';
    if (sub) {
      const parts = [];
      if (sub.githubUrl) parts.push(`Frontend: ${sub.githubUrl}`);
      if (sub.backendGithubUrl) parts.push(`Backend: ${sub.backendGithubUrl}`);
      if (sub.deployedUrl) parts.push(`Deployment: ${sub.deployedUrl}`);
      linksStr = parts.join(' | ');
    }
    teamSheet.addRow(['Submission Links:', linksStr]);

    teamSheet.addRow([]); // Blank row

    // Team Members Table
    teamSheet.addRow(['TEAM ROSTER:']).font = { bold: true, color: { argb: 'FF0B5394' } };
    teamSheet.addRow(['Student Name', 'Roll Number', 'Role']).font = { bold: true };
    
    // Add lead
    teamSheet.addRow([t.leadName || '—', t.usnRollNumber || '—', 'Team Lead']);
    // Add other members
    if (t.members && t.members.length > 0) {
      t.members.forEach(m => {
        teamSheet.addRow([m.name, m.rollNumber, 'Member']);
      });
    }

    teamSheet.addRow([]); // Blank row

    // Daily Work Logs Table
    teamSheet.addRow(['DAILY WORK LOGS:']).font = { bold: true, color: { argb: 'FF0B5394' } };
    const logsHeaderRow = teamSheet.addRow(['Date', 'Student Name', 'Roll Number', 'Task Completed', 'Log Score']);
    logsHeaderRow.font = { bold: true };
    logsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } }; // Light blue header

    if (teamLogs.length === 0) {
      teamSheet.addRow(['No daily logs submitted for this team.']);
    } else {
      teamLogs.forEach(log => {
        log.logs.forEach(memberLog => {
          teamSheet.addRow([
            log.date,
            memberLog.name,
            memberLog.rollNumber,
            memberLog.taskDone || '—',
            log.score !== null && log.score !== undefined ? log.score : '—'
          ]);
        });
      });
    }

    // Set standard columns width for readability
    teamSheet.getColumn(1).width = 25;
    teamSheet.getColumn(2).width = 25;
    teamSheet.getColumn(3).width = 18;
    teamSheet.getColumn(4).width = 45;
    teamSheet.getColumn(5).width = 12;
  }

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
  
  if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

  const teams = await Team.find({ batchId })
    .populate('problemStatementId', 'title')
    .select('-passwordHash');

  const submissions = await Submission.find({ batchId });
  const submissionIds = submissions.map(s => s._id);
  const evaluations = await Evaluation.find({ submissionId: { $in: submissionIds } });

  // Fetch Daily Logs for all teams in this batch
  const dailyLogs = await DailyLog.find({ teamId: { $in: teams.map(t => t._id) } }).sort({ date: 1 });

  // Build simple HTML for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; padding: 20px; line-height: 1.4; }
        h1 { color: #0b5394; border-bottom: 2px solid #0b5394; padding-bottom: 8px; font-size: 20pt; margin-bottom: 15px; }
        h2 { color: #0b5394; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 14pt; margin-top: 30px; margin-bottom: 10px; }
        h3 { color: #1e293b; font-size: 11pt; margin-top: 20px; margin-bottom: 8px; border-left: 4px solid #3b82f6; padding-left: 8px; }
        p { margin: 4px 0; font-size: 9.5pt; color: #475569; }
        .meta-container { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 9pt; }
        th { background: #0b5394; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #0b5394; }
        td { padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
        tr:nth-child(even) { background: #f8fafc; }
        .badge { padding: 2px 8px; border-radius: 12px; font-size: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; }
        .submitted { background: #d3f9d8; color: #2b8a3e; }
        .in_progress { background: #fff3bf; color: #856404; }
        .problem_pending { background: #dee2e6; color: #495057; }
        .link-text { color: #2563eb; text-decoration: none; word-break: break-all; }
        .link-text:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>📋 Batch Progress Report</h1>
      <div class="meta-container">
        <div class="meta-grid">
          <div>
            <p><strong>Batch:</strong> ${batch?.name}</p>
            <p><strong>College:</strong> ${batch?.collegeId?.name} (${batch?.collegeId?.location || '—'})</p>
            <p><strong>Subject:</strong> ${batch?.subjectId?.name || '—'}</p>
          </div>
          <div>
            <p><strong>Period:</strong> ${batch?.startDate ? new Date(batch.startDate).toLocaleDateString() : '—'} – ${batch?.endDate ? new Date(batch.endDate).toLocaleDateString() : '—'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Teams:</strong> ${teams.length}</p>
          </div>
        </div>
      </div>
      
      <h2>Teams Overview & Submission URLs</h2>
      <table>
        <tr>
          <th>Team Name</th>
          <th>Lead</th>
          <th>Problem Statement</th>
          <th>Status</th>
          <th>Score</th>
          <th>Repository & Deployment Links</th>
        </tr>
        ${teams.map(t => {
          const sub = submissions.find(s => s.teamId.toString() === t._id.toString());
          const ev = sub ? evaluations.find(e => e.submissionId.toString() === sub._id.toString()) : null;
          
          let linksHtml = "—";
          if (sub) {
            linksHtml = `
              <div style="margin-bottom: 2px;"><strong>Frontend:</strong> <a class="link-text" href="${sub.githubUrl}" target="_blank">${sub.githubUrl}</a></div>
              ${sub.backendGithubUrl ? `<div style="margin-bottom: 2px;"><strong>Backend:</strong> <a class="link-text" href="${sub.backendGithubUrl}" target="_blank">${sub.backendGithubUrl}</a></div>` : ''}
              ${sub.deployedUrl ? `<div><strong>Deployed:</strong> <a class="link-text" href="${sub.deployedUrl}" target="_blank">${sub.deployedUrl}</a></div>` : ''}
            `;
          }
          
          return `<tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.leadUsername}</td>
            <td>${t.problemStatementId?.title || '—'}</td>
            <td><span class="badge ${t.status}">${t.status}</span></td>
            <td><strong>${ev ? ev.score + '/100' : '—'}</strong></td>
            <td>${linksHtml}</td>
          </tr>`;
        }).join('')}
      </table>
      
      <h2>Daily Logs of the Teams</h2>
      ${teams.map(t => {
        const teamLogs = dailyLogs.filter(log => log.teamId.toString() === t._id.toString());
        if (teamLogs.length === 0) {
          return `
            <h3>Team: ${t.name}</h3>
            <p style="font-style: italic; margin-bottom: 20px;">No daily logs submitted for this team.</p>
          `;
        }
        return `
          <h3>Team: ${t.name}</h3>
          <table>
            <tr>
              <th style="width: 100px;">Date</th>
              <th style="width: 150px;">Student Name</th>
              <th style="width: 100px;">Roll Number</th>
              <th>Task Done</th>
              <th style="width: 80px;">Log Score</th>
            </tr>
            ${teamLogs.map(log => {
              return log.logs.map((memberLog, idx) => `
                <tr>
                  ${idx === 0 ? `<td rowspan="${log.logs.length}" style="font-weight: bold; background-color: #fafafa; border-bottom: 1px solid #cbd5e1;">${log.date}</td>` : ''}
                  <td style="border-bottom: 1px solid #e2e8f0;">${memberLog.name}</td>
                  <td style="border-bottom: 1px solid #e2e8f0;">${memberLog.rollNumber}</td>
                  <td style="border-bottom: 1px solid #e2e8f0;">${memberLog.taskDone || '—'}</td>
                  ${idx === 0 ? `<td rowspan="${log.logs.length}" style="font-weight: bold; background-color: #fafafa; text-align: center; border-bottom: 1px solid #cbd5e1; vertical-align: middle;">${log.score !== null && log.score !== undefined ? log.score : '—'}</td>` : ''}
                </tr>
              `).join('');
            }).join('')}
          </table>
        `;
      }).join('')}
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
