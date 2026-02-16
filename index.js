import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import resumeRoutes from './src/routes/resumeRoutes.js';
import { connectDB } from './src/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'https://aianalyz.netlify.app',
  credentials: true,
}));

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDB();

app.use('/api', resumeRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
