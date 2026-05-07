import 'dotenv/config';
import db from '../db.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { unlinkSync, readFileSync } from 'fs';
import { extname } from 'path';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-09-2025",
  generationConfig: { 
    temperature: 0.3, 
    responseMimeType: "application/json" 
  },
});
async function generateWithRetry(prompt) {
  const delays = [1000, 2000, 4000, 8000];
  let lastError;

  for (let i = 0; i <= delays.length; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;
      
      // If location is blocked, retrying won't help. 
      if (error.message?.includes("location is not supported")) {
        throw new Error("LOCATION_BLOCKED");
      }

      if (error.status === 503 || error.status === 429) {
        if (i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

async function extractTextFromPDF(filePath) {
  try {
    const data = new Uint8Array(readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ 
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      verbosity: 0,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
    });
    
    const doc = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + ' ';
    }
    return text.trim();
  } catch (err) {
    console.error("PDF Extraction Error:", err);
    return "";
  }
}

async function getAiAnalysis(resumeText, jobTitle, jobDesc) {
  const prompt = `
    Analyze this resume against the job: "${jobTitle}".
    Resume Content: ${resumeText.substring(0, 4000)}
    Job Description: ${jobDesc.substring(0, 3000)}
    Return JSON only: { "fitScore": number, "reasoning": "string", "recommendations": ["string"] }
  `;

  try {
    const result = await generateWithRetry(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    if (error.message === "LOCATION_BLOCKED") {
      throw error; // Pass it up to the main controller
    }
    console.error(`Gemini Error for [${jobTitle}]:`, error.message);
    return null;
  }
}

export async function analyzeResume(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const filePath = req.file.path;

  try {
    const resumeText = await extractTextFromPDF(filePath);
    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: "Could not read PDF text." });
    }

    // Explicitly limiting to top 15 jobs for analysis performance
    const JOB_MATCH_LIMIT = 15;
    const { rows: jobs } = await db.query('SELECT * FROM jobs LIMIT $1', [JOB_MATCH_LIMIT]);
    
    if (jobs.length === 0) {
      return res.status(200).json({ matchedJobs: [] });
    }

    console.log(`Analyzing resume against ${jobs.length} jobs using Gemini 2.5 Flash...`);

    const analysisPromises = jobs.map(job => 
      getAiAnalysis(resumeText, job.title, job.description)
        .then(aiData => aiData ? { ...job, ...aiData } : null)
    );

    const results = await Promise.all(analysisPromises);
    const matchedJobs = results
      .filter(j => j !== null && j.fitScore > 10) 
      .sort((a, b) => b.fitScore - a.fitScore);

    res.status(200).json({ matchedJobs });

  } catch (error) {
    if (error.message === "LOCATION_BLOCKED") {
      return res.status(400).json({ 
        error: "Your server region (Europe/Other) is blocked by Google Gemini. Please move your Render service region to US West (Oregon)." 
      });
    }
    console.error("Critical Analysis Error:", error);
    res.status(500).json({ error: 'AI Service Error. Please try again later.' });
  } finally {
    try { unlinkSync(filePath); } catch (e) {}
  }
}

export const getAllJobs = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, title, company, location FROM jobs');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
};
