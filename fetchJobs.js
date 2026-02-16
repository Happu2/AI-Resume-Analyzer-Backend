import axios from 'axios';
import { writeFileSync } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

/**
 * Configuration
 * RAPIDAPI_KEY: Your private key for JSearch
 * SEARCH_QUERY: The job role and location you want to search for
 * OUTPUT_FILE: Where the processed jobs will be saved (used by seedDb.js)
 */
const RAPIDAPI_KEY = 'a03639ee5bmsh3fd44e48c3c7289p1421ddjsn1887a2447104'; 
const SEARCH_QUERY = 'Software Developer in India'; 
const PAGE_NUMBER = '1';
const OUTPUT_FILE = join(__dirname, 'jobs.json'); 

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: SEARCH_QUERY,
    page: PAGE_NUMBER,
    num_pages: '1',
  },
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
  }
};

/**
 * fetchAndSaveJobs
 * Fetches raw data from RapidAPI, filters for required fields,
 * and saves the result as a JSON array.
 */
async function fetchAndSaveJobs() {
  // Guard clause for API Key
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_GOES_HERE') {
    console.error('\n❌ ERROR: RapidAPI Key is missing or invalid in fetchJobs.js.\n');
    return;
  }

  console.log(`🔍 Attempting to fetch jobs for query: "${SEARCH_QUERY}"...`);

  try {
    const response = await axios.request(options); 
    const jobs = response.data.data;

    if (!jobs || jobs.length === 0) {
      console.log('⚠️ No jobs were found for this query. Try a different search query.');
      return;
    }

    // Map API fields to our internal Database Schema
    const formattedJobs = jobs.map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state}` : (job.job_country || 'Not specified'),
      description: job.job_description,
      url: job.job_apply_link
    })).filter(job => job.title && job.company && job.description);

    if (formattedJobs.length === 0) {
        console.log('⚠️ Jobs were found, but none had the required title, company, and description fields.');
        return;
    }

    // Save processed jobs to local file
    writeFileSync(OUTPUT_FILE, JSON.stringify(formattedJobs, null, 2));

    console.log(`\n✅ SUCCESS: Saved ${formattedJobs.length} jobs to ${OUTPUT_FILE}`);
    console.log('👉 Next step: Run the seed script to populate Neon DB:');
    console.log('node seedDb.js');

  } catch (error) {
    console.error('❌ Error fetching jobs from RapidAPI:');
    if (error.response) {
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Message:', error.message);
    }
  }
}

fetchAndSaveJobs();