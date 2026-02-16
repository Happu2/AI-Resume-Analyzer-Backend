import express from 'express';
import cors from 'cors';
import multer from 'multer';
import morgan from 'morgan';
import 'dotenv/config.js';
import db from './src/db.js'; // Importing the Neon DB connection
import { analyzeResume, getAllJobs, getJobById } from './src/controllers/resumeController.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Configure Multer for file uploads (storing in /tmp for serverless environments like Render)
const upload = multer({ dest: '/tmp/' });

/**
 * Middleware
 */

// 1. Logger: Provides clean console logs for every request (useful for debugging)
app.use(morgan('dev'));

// 2. CORS: Resolves the "No Access-Control-Allow-Origin" error for your Netlify frontend
app.use(cors({
  origin: ['https://aianalyz.netlify.app', 'http://localhost:5173'], // Allow production and local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// 3. Body Parser
app.use(express.json());

/**
 * Health Check & DB Connectivity Test
 * Helps verify that Neon DB is reachable from the Render environment.
 */
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'DOWN',
      database: 'ERROR',
      error: err.message
    });
  }
});

/**
 * Routes
 * These endpoints are configured to match the Axios calls in your React App.
 */

// POST /api/resume/analyze -> Matches axios.post(`${API_URL}/resume/analyze`, ...)
app.post('/api/resume/analyze', upload.single('resume'), analyzeResume);

// GET /api/jobs -> Fetch all available jobs for comparison or listing
app.get('/api/jobs', getAllJobs);

// GET /api/jobs/:id -> Fetch details for a specific job
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
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log('📡 Neon DB connection initialized.');
});