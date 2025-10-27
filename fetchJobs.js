import axios from 'axios';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path'; 
import { fileURLToPath } from 'url'; 


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const RAPIDAPI_KEY = 'a03639ee5bmsh3fd44e48c3c7289p1421ddjsn1887a2447104'; 

const SEARCH_QUERY = 'Full Stack Developer in USA';
const PAGE_NUMBER = '1';
const OUTPUT_FILE = join(__dirname, 'jobs.json'); 


const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: SEARCH_QUERY,
    page: PAGE_NUMBER,
    num_pages: '1',
    job_requirements: 'under_3_years_experience' 
  },
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
  }
};



async function fetchAndSaveJobs() {
  if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY_GOES_HERE') {
    console.error('\nERROR: Please open backend/fetchJobs.js and paste your RapidAPI Key into the RAPIDAPI_KEY variable.\n');
    return;
  }

  console.log(`Attempting to fetch jobs for query: "${SEARCH_QUERY}"...`);

  try {
    const response = await axios.request(options); 

    if (!jobs || jobs.length === 0) {
      console.log('No jobs were found for this query. Try a different search query.');
      return;
    }


    const formattedJobs = jobs.map(job => ({
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state}` : (job.job_country || 'Not specified'),
      description: job.job_description,
      url: job.job_apply_link
    })).filter(job => job.title && job.company && job.description); 

    if (formattedJobs.length === 0) {
        console.log('Jobs were found, but none had the required title, company, and description fields. No file saved.');
        return;
    }

    
    writeFileSync(OUTPUT_FILE, JSON.stringify(formattedJobs, null, 2));

    console.log(`\nSUCCESS: Saved ${formattedJobs.length} jobs to ${OUTPUT_FILE}`);
    console.log('You are now ready to run the seed script:');
    console.log('node seedDb.js'); 

  } catch (error) {
    console.error('Error fetching jobs from RapidAPI:');
    if (error.response) {
      
      console.error('Data:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
    
      console.error('Request:', error.request);
    } else {
      
      console.error('Error Message:', error.message);
    }
  }
}

// Run the function
fetchAndSaveJobs();

