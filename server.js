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

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ].filter(Boolean);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/doc-requests', docRequestRoutes);

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
  console.error(err.stack);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CapstoneHub server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;


