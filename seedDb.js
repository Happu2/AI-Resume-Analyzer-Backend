import 'dotenv/config.js'; 
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './src/db.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JOBS_FILE_PATH = join(__dirname, 'jobs.json');


async function seedDatabase() {
  console.log('Starting to seed database...');

  if (!existsSync(JOBS_FILE_PATH)) {
    console.error(`\nERROR: jobs.json not found.`);
    console.error(`Please run "node fetchJobs.js" first to create the file.\n`);
    return;
  }


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
    
    await client.query('TRUNCATE TABLE jobs RESTART IDENTITY');
    console.log('Cleared existing "jobs" table.');

    let count = 0;
    for (const job of jobs) {
      const { title, company, location, description, url } = job;
      
      if (!title || !company || !description) {
          console.warn('Skipping job with missing data:', title, company);
          continue;
      }

      const query = `
        INSERT INTO jobs (title, company, location, description, url)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await client.query(query, [
        title, 
        company, 
        location || 'Not specified',
        description, 
        url
      ]);
      count++;
    }

    console.log(`\nSUCCESS: Database has been seeded with ${count} jobs.`);

  } catch (err) {
    console.error('Error during database seeding process:', err.stack);
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
  }
}
seedDatabase().then(() => {
    console.log('Seed process finished.');
    db.end(); 
}).catch(err => {
    console.error('Unhandled error in seedDatabase:', err);
    db.end();
});

