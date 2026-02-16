import 'dotenv/config.js'; 
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import resumeRoutes from './src/routes/resumeRoutes.js';
import { connectDB } from './src/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Fallback: set CORS headers for all responses (must be first)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://aianalyz.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Optionally, you can remove the cors() middleware below, or keep it for redundancy
// app.use(cors({
//   origin: ['https://aianalyz.netlify.app'],
//   credentials: true
// }));

app.use(json());
app.use(urlencoded({ extended: true }));
app.use('/api', resumeRoutes);

// Health check endpoint for debugging
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

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

