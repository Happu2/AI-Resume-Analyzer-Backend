// Use the ES Module way to import dotenv.
// This loads the .env file from the root /backend folder.
import 'dotenv/config.js';

import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("ERROR: DATABASE_URL is not set in your .env file.");
  console.error("Please set it in backend/.env");
  console.error("Example: DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\"");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  // process.exit(1); // Exit the process if the DB connection string is missing
}

const pool = new Pool({
  connectionString: connectionString,
  // You can add SSL configuration here if you deploy to a cloud provider
  // ssl: {
  //   rejectUnauthorized: false, // Only for development/demo with services like Heroku
  // },
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client for DB connection test:', err.stack);
  } else {
    console.log('Database connection successful.');
    client.release();
  }
});

// Export the query method so other files can just do db.query(...)
export default pool;

