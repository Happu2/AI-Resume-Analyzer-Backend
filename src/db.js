import 'dotenv/config.js';
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("FATAL ERROR: DATABASE_URL is not defined in .env file.");
  process.exit(1);
}

console.log("DATABASE_URL is set:", process.env.DATABASE_URL ? "✓" : "✗");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("DB connection failed:", error);
    process.exit(1);
  }
};

const db = {
  query: (sql, params) => pool.query(sql, params)
};

export default db;