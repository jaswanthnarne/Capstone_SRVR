require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const collegeRoutes = require('./src/routes/college.routes');
const subjectRoutes = require('./src/routes/subject.routes');
const batchRoutes = require('./src/routes/batch.routes');
const problemRoutes = require('./src/routes/problem.routes');
const teamRoutes = require('./src/routes/team.routes');
const milestoneRoutes = require('./src/routes/milestone.routes');
const submissionRoutes = require('./src/routes/submission.routes');
const evaluationRoutes = require('./src/routes/evaluation.routes');
const reportRoutes = require('./src/routes/report.routes');
const trainerRoutes = require('./src/routes/trainer.routes');
const dailyLogRoutes = require('./src/routes/dailyLog.routes');
const docRequestRoutes = require('./src/routes/docRequest.routes');
const mailLogRoutes = require('./src/routes/mailLog.routes');

const app = express();

// 1. Preflight OPTIONS & CORS headers handler (Instant 200 OK for OPTIONS)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Non-blocking MongoDB connection trigger
app.use((req, res, next) => {
  connectDB().catch(err => console.error("MongoDB async connect warning:", err.message));
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/doc-requests', docRequestRoutes);
app.use('/api/mail-logs', mailLogRoutes);

// Root routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ethnotech ProjectSpace Backend API' });
});
app.get('/api', (req, res) => {
  res.json({ message: 'Ethnotech ProjectSpace API is online' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global express error:", err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 CapstoneHub server running on port ${PORT}`);
  });
}

module.exports = app;
