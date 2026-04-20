import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
import cron from 'node-cron'; // Added for scheduling
import 'dotenv/config.js';
import db from './src/db.js'; 
import { analyzeResume, getAllJobs, getJobById } from './src/controllers/resumeController.js';
import { syncJobs } from './src/services/jobSyncService.js'; // Import the sync service

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1);
const upload = multer({ dest: '/tmp/' });

app.use(morgan('dev'));
app.use(cors({
  origin: ['https://aianalyz.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

/**
 * Basic Routes
 */
app.get('/', (req, res) => {
  res.status(200).send('AI Resume Analyzer Backend is Live.');
});

/**
 * Health Check
 */
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      instance: process.env.RENDER_SERVICE_ID || 'local',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    res.status(200).json({
      status: 'PARTIAL_UP',
      database: 'ERROR',
      message: 'Server is running but database is unreachable',
      error: err.message
    });
  }
});

/**
 * Resume & Job Routes
 */
app.post('/api/resume/analyze', upload.single('resume'), analyzeResume);
app.get('/api/jobs', getAllJobs);
app.get('/api/jobs/:id', getJobById);

/**
 * Admin Route: Manual Sync Trigger
 * Useful for testing or forcing an update via Postman/Curl
 */
app.post('/api/admin/sync-jobs', async (req, res) => {
  try {
    const count = await syncJobs();
    res.status(200).json({ message: 'Job sync initiated successfully', jobsUpdated: count });
  } catch (error) {
    res.status(500).json({ error: 'Manual sync failed' });
  }
});

/**
 * CRON JOB SCHEDULER
 * Scheduled to run every day at midnight (00:00)
 * Pattern: 'minute hour day-of-month month day-of-week'
 */
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Scheduled Task: Running daily job sync...');
  await syncJobs();
});

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

/**
 * Start Server
 */
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server is listening on port ${PORT}`);

  // INITIAL SYNC: Run sync once on startup so the DB is never empty on a fresh deploy
  console.log('📡 Performing initial job sync...');
  try {
    await syncJobs();
  } catch (error) {
    console.error('Initial sync failed. Server will continue running.');
  }
});