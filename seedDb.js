import 'dotenv/config.js'; // Make sure .env variables are loaded
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './src/db.js'; // Import your database pool from src/db.js

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JOBS_FILE_PATH = join(__dirname, 'jobs.json');

/**
 * Reads jobs from jobs.json and inserts them into the 'jobs' table.
 */
async function seedDatabase() {
  console.log('Starting to seed database...');

  // 1. Check if jobs.json exists
  if (!existsSync(JOBS_FILE_PATH)) {
    console.error(`\nERROR: jobs.json not found.`);
    console.error(`Please run "node fetchJobs.js" first to create the file.\n`);
    return;
  }

  // 2. Read and parse the jobs.json file
  let jobs;
  try {
    const jobsData = readFileSync(JOBS_FILE_PATH, 'utf8');
    jobs = JSON.parse(jobsData);
  } catch (err) {
    console.error('Error reading or parsing jobs.json:', err);
    return;
  }

  if (jobs.length === 0) {
    console.log('jobs.json is empty. No jobs to seed. Exiting.');
    return;
  }

  console.log(`Found ${jobs.length} jobs in jobs.json. Connecting to database...`);

  // 3. Connect to the database
  let client;
  try {
    client = await db.connect();
    console.log('Database connection successful.');
  } catch (err) {
    console.error('Failed to connect to the database:', err.stack);
    console.error('\nPlease check your DATABASE_URL in the .env file.');
    return;
  }
  
  try {
    // 4. Clear existing jobs to prevent duplicates
    // TRUNCATE is fast and also resets the SERIAL ID counter.
    await client.query('TRUNCATE TABLE jobs RESTART IDENTITY');
    console.log('Cleared existing "jobs" table.');

    // 5. Insert each job into the database
    let count = 0;
    for (const job of jobs) {
      const { title, company, location, description, url } = job;
      
      // Basic validation: Skip jobs with missing essential data
      if (!title || !company || !description) {
          console.warn('Skipping job with missing data:', title, company);
          continue;
      }

      const query = `
        INSERT INTO jobs (title, company, location, description, url)
        VALUES ($1, $2, $3, $4, $5)
      `;
      // Use the client to send the query
      await client.query(query, [
        title, 
        company, 
        location || 'Not specified', // Provide a default if location is null
        description, 
        url
      ]);
      count++;
    }

    console.log(`\nSUCCESS: Database has been seeded with ${count} jobs.`);

  } catch (err) {
    console.error('Error during database seeding process:', err.stack);
  } finally {
    // 6. Release the client back to the pool
    if (client) {
      client.release();
      console.log('Database client released.');
    }
  }
}

// Run the seed function and then exit the process
seedDatabase().then(() => {
    console.log('Seed process finished.');
    // Explicitly end the pool to allow the script to exit
    db.end(); 
}).catch(err => {
    console.error('Unhandled error in seedDatabase:', err);
    db.end();
});

