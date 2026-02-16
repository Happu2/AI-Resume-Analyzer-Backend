import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
import 'dotenv/config.js';
import db from './src/db.js'; // Importing the Neon DB connection
import { analyzeResume, getAllJobs, getJobById } from './src/controllers/resumeController.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Render uses a proxy/load balancer, so we trust the first proxy
app.set('trust proxy', 1);

// Configure Multer for file uploads (storing in /tmp)
const upload = multer({ dest: '/tmp/' });

/**
 * Middleware
 */
app.use(morgan('dev'));
app.use(cors({
  origin: ['https://aianalyz.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

/**
 * Basic Root Route
 */
app.get('/', (req, res) => {
  res.status(200).send('AI Resume Analyzer Backend is Live.');
});

/**
 * Health Check & DB Connectivity Test
 * Updated to not crash if the database is unavailable
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
    // Return 200 but report DB status as DOWN so Render doesn't kill the process
    res.status(200).json({
      status: 'PARTIAL_UP',
      database: 'ERROR',
      message: 'Server is running but database is unreachable',
      error: err.message
    });
  }
});

/**
 * Routes
 */
app.post('/api/resume/analyze', upload.single('resume'), analyzeResume);
app.get('/api/jobs', getAllJobs);
app.get('/api/jobs/:id', getJobById);

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

/**
 * Start Server
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
  console.log('📡 Service initialized. Check /health for DB status.');
});