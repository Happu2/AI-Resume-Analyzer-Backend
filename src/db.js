import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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