import 'dotenv/config.js';
import pkg from 'pg';

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is not defined.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG error', err);
});

export const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('PostgreSQL connected');
      return;
    } catch (err) {
      console.error(`DB attempt ${i + 1} failed`, err.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.warn('Database unavailable, server still running');
};

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
