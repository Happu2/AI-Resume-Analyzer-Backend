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
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

const db = {
  query: (sql, params) => pool.query(sql, params)
};

export default db;