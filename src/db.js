import pg from 'pg';
import 'dotenv/config.js';

const { Pool } = pg;

/**
 * Neon DB Configuration
 * 1. connectionTimeoutMillis: Prevents the server from hanging indefinitely (and causing 503s)
 * 2. ssl: Required for Neon. 'rejectUnauthorized: false' allows connecting without providing the CA file.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 second timeout
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Error listener for the pool to prevent process crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle Neon client', err);
});

export default {
  /**
   * Executing a query
   * We wrap this in a way that doesn't block the server if the DB is slow.
   */
  query: (text, params) => {
    return pool.query(text, params);
  },
  /**
   * Manually acquire a client from the pool.
   */
  connect: () => pool.connect(),
  /**
   * Shuts down the connection pool.
   * Essential for CLI scripts like seedDb.js to allow the process to exit.
   */
  end: () => pool.end(),
};