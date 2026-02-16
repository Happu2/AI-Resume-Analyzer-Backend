import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config.js';
import db from './src/db.js'; // Importing the Neon DB connection
import { analyzeResume, getAllJobs, getJobById } from './src/controllers/resumeController.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Configure Multer for file uploads (storing in /tmp for serverless environments like Render)
const upload = multer({ dest: '/tmp/' });

/**
 * Middleware
 * Updated CORS configuration to specifically allow your Netlify domain.
 * This resolves the "No 'Access-Control-Allow-Origin' header" error.
 */
app.use(cors({
  origin: ['https://aianalyz.netlify.app', 'http://localhost:5173'], // Allow production and local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

/**
 * Health Check & DB Connectivity Test
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
 * Note: Updated route path to /api/resume/analyze to match your frontend's request
 */

// 1. Analyze Resume against Jobs (Main Feature)
app.post('/api/resume/analyze', upload.single('resume'), analyzeResume);

// 2. Fetch all available jobs
app.get('/api/jobs', getAllJobs);

// 3. Fetch a specific job by ID
app.get('/api/jobs/:id', getJobById);

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Neon DB connection is being initialized...');
});