import 'dotenv/config.js'; // Loads environment variables from .env file
import express, { json, urlencoded } from 'express';
import cors from 'cors';
// Multer is not needed here, it's used in resumeRoutes.js
import resumeRoutes from './src/routes/resumeRoutes.js';

// --- Basic Server Setup ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS)
// This is required to allow your frontend (on a different domain) to call this backend.
app.use(cors()); 

// Body parsers for JSON
app.use(json());
app.use(urlencoded({ extended: true }));

// --- API Routes ---
// All API routes will be prefixed with /api
// e.g., /api/resume/analyze
app.use('/api', resumeRoutes);

// --- Global Error Handler ---
// A simple error handler to catch any unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong on the server!' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set in .env file.');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set in .env file.');
  }
});

