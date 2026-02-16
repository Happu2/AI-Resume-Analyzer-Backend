import 'dotenv/config.js';
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL is not defined in .env file.");
  process.exit(1);
}

console.log("DATABASE_URL is set:", process.env.DATABASE_URL ? "✓" : "✗");
if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL hostname:", new URL(process.env.DATABASE_URL).hostname);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      console.log("PostgreSQL connected successfully");
      return;
    } catch (error) {
      console.error(`DB connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn("Failed to connect to database after retries. Server will continue but database queries may fail.");
      }
    }
  }
};

const db = {
  query: (sql, params) => pool.query(sql, params)
};

export default db;