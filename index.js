import 'dotenv/config.js'; 
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import resumeRoutes from './src/routes/resumeRoutes.js';
import { connectDB } from './src/db.js';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors()); 
app.use(json());
app.use(urlencoded({ extended: true }));
app.use('/api', resumeRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong on the server!' });
});

// Initialize database and start server
await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set in .env file.');
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set in .env file.');
  }
});

