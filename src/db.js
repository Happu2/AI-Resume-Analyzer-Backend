import pg from 'pg';
import 'dotenv/config.js';

const { Pool } = pg;

// Neon requires SSL for connections.
// The 'rejectUnauthorized: false' is common for hosted DBs to prevent certificate errors
// unless you provide the specific CA certificate.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Testing the connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client for Neon DB:', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query:', err.stack);
    }
    console.log('Connected to Neon DB successfully at:', result.rows[0].now);
  });
});

export default {
  query: (text, params) => pool.query(text, params),
};