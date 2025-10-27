import { Router } from 'express';
import multer from 'multer';
// Added .js to the import path to make it ES Module compliant
import { analyzeResume, getAllJobs, getJobById } from '../controllers/resumeController.js';

const router = Router();

// Configure Multer for file uploads
// This tells Multer to temporarily store the uploaded file in a folder named 'uploads'
// The resumeController will then read it from there and delete it.
const upload = multer({ dest: 'uploads/' });

/**
 * --- API Routes ---
 *
 * All routes here are prefixed with '/api' (defined in index.js)
 */

// Endpoint 1: Analyze Resume
// Handles the file upload and kicks off the AI analysis.
// 'resume' must match the key used in the frontend's FormData.
router.post(
  '/resume/analyze',
  upload.single('resume'), // Multer middleware for a single file upload
  analyzeResume
);

// Endpoint 2: Get All Jobs
// A simple route to browse all jobs in the database.
router.get(
  '/jobs',
  getAllJobs
);

// Endpoint 3: Get Single Job by ID
// A simple route to get the full details of one specific job.
router.get(
  '/jobs/:id',
  getJobById
);

export default router;

