import pg from 'pg';
import 'dotenv/config.js';

const { Pool } = pg;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 second timeout
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: {
    rejectUnauthorized: false,
  },
});


pool.on('error', (err) => {
  console.error('Unexpected error on idle Neon client', err);
});

export default {
  query: (text, params) => {
    return pool.query(text, params);
  },
  connect: () => pool.connect(),
  end: () => pool.end(),
};
