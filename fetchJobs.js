import axios from 'axios'; // FIX 1: Changed import
import { writeFileSync } from 'fs';
import { join, dirname } from 'path'; // FIX 2: Added 'dirname'
import { fileURLToPath } from 'url'; // FIX 2: Added 'fileURLToPath'

// FIX 2: Added these lines to define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- CONFIGURATION ---
// PASTE YOUR RAPIDAPI KEY HERE (Get from RapidAPI.com, search for "JSearch")
const RAPIDAPI_KEY = 'a03639ee5bmsh3fd44e48c3c7289p1421ddjsn1887a2447104'; 

const SEARCH_QUERY = 'Full Stack Developer in USA';
const PAGE_NUMBER = '1';
const OUTPUT_FILE = join(__dirname, 'jobs.json'); // This will create jobs.json in your backend folder
// --- END CONFIGURATION ---

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: SEARCH_QUERY,
    page: PAGE_NUMBER,
    num_pages: '1',
    job_requirements: 'under_3_years_experience' // Added a filter to get more relevant jobs
  },
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
  }
};

/**
 * Fetches jobs from the JSearch API and saves them to a JSON file.
 */
async function fetchAndSaveJobs() {
  if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_GOES_HERE') {
    console.error('\nERROR: Please open backend/fetchJobs.js and paste your RapidAPI Key into the RAPIDAPI_KEY variable.\n');
    return;
  }

  console.log(`Attempting to fetch jobs for query: "${SEARCH_QUERY}"...`);

  try {
    const response = await axios.request(options); // FIX 1: Changed to axios.request()
    const jobs = response.data.data;

    if (!jobs || jobs.length === 0) {
      console.log('No jobs were found for this query. Try a different search query.');
      return;
    }

    // Filter and format the jobs to match our database schema
    const formattedJobs = jobs.map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state}` : (job.job_country || 'Not specified'),
      description: job.job_description,
      url: job.job_apply_link
    })).filter(job => job.title && job.company && job.description); // Filter out jobs with null essential fields

    if (formattedJobs.length === 0) {
        console.log('Jobs were found, but none had the required title, company, and description fields. No file saved.');
        return;
    }

    // Save the formatted jobs to jobs.json
    writeFileSync(OUTPUT_FILE, JSON.stringify(formattedJobs, null, 2));

    console.log(`\nSUCCESS: Saved ${formattedJobs.length} jobs to ${OUTPUT_FILE}`);
    console.log('You are now ready to run the seed script:');
    console.log('node seedDb.js'); // Updated to reflect package.json scripts

  } catch (error) {
    console.error('Error fetching jobs from RapidAPI:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
    }
  }
}

// Run the function
fetchAndSaveJobs();

