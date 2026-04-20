import axios from 'axios';
import db from '../db.js';
import 'dotenv/config.js';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const SEARCH_QUERY = 'Software Developer in India';

/**
 * syncJobs
 * Fetches jobs from RapidAPI and updates the Neon Database directly.
 * No local JSON file required.
 */
export async function syncJobs() {
  console.log(`[${new Date().toISOString()}] 🔄 Starting Job Sync...`);

  if (!RAPIDAPI_KEY) {
    console.error('❌ Sync Failed: RAPIDAPI_KEY is missing in environment variables.');
    return;
  }

  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: { query: SEARCH_QUERY, page: '1', num_pages: '1' },
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const rawJobs = response.data.data;

    if (!rawJobs || rawJobs.length === 0) {
      console.log('⚠️ No new jobs found from API.');
      return;
    }

    // Clear existing jobs to keep data fresh (or use UPSERT logic if preferred)
    await db.query('TRUNCATE TABLE jobs RESTART IDENTITY');
    
    let count = 0;
    for (const job of rawJobs) {
      const { job_title, employer_name, job_city, job_state, job_country, job_description, job_apply_link } = job;
      
      if (!job_title || !employer_name || !job_description) continue;

      const location = job_city && job_state ? `${job_city}, ${job_state}` : (job_country || 'Remote');

      const query = `
        INSERT INTO jobs (title, company, location, description, url)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await db.query(query, [
        job_title,
        employer_name,
        location,
        job_description,
        job_apply_link || '#'
      ]);
      count++;
    }

    console.log(`✅ Sync Complete: ${count} jobs updated in database.`);
    return count;

  } catch (error) {
    console.error('❌ Job Sync Error:', error.message);
  }
}