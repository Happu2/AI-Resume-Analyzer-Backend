import 'dotenv/config.js';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './src/db.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JOBS_FILE_PATH = join(__dirname, 'jobs.json');

/**
 * seedDatabase
 * Reads the jobs.json file and populates the Neon "jobs" table.
 * Ensure you have run "node fetchJobs.js" first.
 */
async function seedDatabase() {
  console.log('🚀 Starting to seed database...');

  // 1. Check if source file exists
  if (!existsSync(JOBS_FILE_PATH)) {
    console.error(`\n❌ ERROR: jobs.json not found.`);
    console.error(`Please run "node fetchJobs.js" first to create the file.\n`);
    return;
  }

  // 2. Parse JSON data
  let jobs;
  try {
    const jobsData = readFileSync(JOBS_FILE_PATH, 'utf8');
    jobs = JSON.parse(jobsData);
  } catch (err) {
    console.error('❌ Error reading or parsing jobs.json:', err);
    return;
  }

  if (jobs.length === 0) {
    console.log('⚠️ jobs.json is empty. No jobs to seed. Exiting.');
    return;
  }

  console.log(`🔍 Found ${jobs.length} jobs in jobs.json. Preparing data...`);

  try {
    // 3. Clear existing table to avoid duplicates (optional, but good for clean seeding)
    // Restart Identity resets the SERIAL id counter to 1
    await db.query('TRUNCATE TABLE jobs RESTART IDENTITY');
    console.log('✅ Cleared existing "jobs" table.');

    let count = 0;
    for (const job of jobs) {
      const { title, company, location, description, url } = job;
      
      // Safety check for required NOT NULL fields
      if (!title || !company) {
          console.warn('⚠️ Skipping job with missing required fields:', title || 'No Title');
          continue;
      }

      const query = `
        INSERT INTO jobs (title, company, location, description, url)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await db.query(query, [
        title, 
        company, 
        location || 'Remote',
        description || 'No description provided.',
        url || '#'
      ]);
      count++;
    }

    console.log(`\n🎉 SUCCESS: Database has been seeded with ${count} jobs.`);

  } catch (err) {
    console.error('❌ Error during database seeding process:', err.message);
    if (err.stack.includes('relation "jobs" does not exist')) {
        console.error('💡 TIP: You need to create the "jobs" table in your Neon SQL console first.');
    }
  }
}

// Execute the process
seedDatabase()
  .then(() => {
    console.log('🏁 Seed process finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });