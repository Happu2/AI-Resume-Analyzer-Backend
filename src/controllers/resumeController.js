import 'dotenv/config.js';
import db from '../db.js'; // Correct relative path from controllers/ to src/
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { unlinkSync, readFileSync } from 'fs';
import { extname } from 'path';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not defined in .env file.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig = {
  temperature: 0.2,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
  responseMimeType: "application/json"
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-09-2025",
  generationConfig,
  safetySettings
});

async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(readFileSync(filePath));
  const doc = await getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

async function getAiAnalysis(resumeText, jobDescription) {
  const prompt = `
    You are an expert AI recruiting assistant. Analyze the resume and job description.
    Response must be ONLY JSON.
    Schema: { "fitScore": number, "reasoning": string, "recommendations": string[] }
    ---RESUME---
    ${resumeText.substring(0, 4000)}
    ---JOB DESCRIPTION---
    ${jobDescription.substring(0, 4000)}
  `;
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function analyzeResume(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const filePath = req.file.path;
  try {
    if (extname(req.file.originalname).toLowerCase() !== '.pdf') {
      return res.status(400).json({ error: 'Please upload a PDF.' });
    }
    const resumeText = await extractTextFromPDF(filePath);
    const { rows: jobs } = await db.query('SELECT * FROM jobs');

    if (jobs.length === 0) return res.status(500).json({ error: "No jobs in database." });

    const analysisPromises = jobs.slice(0, 10).map(job =>
      getAiAnalysis(resumeText, job.title + ' ' + job.description)
        .then(aiData => aiData ? { ...job, ...aiData } : null)
    );

    const matchedJobs = (await Promise.all(analysisPromises))
      .filter(job => job !== null)
      .sort((a, b) => b.fitScore - a.fitScore);

    res.status(200).json({ matchedJobs });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: 'Analysis failed.' });
  } finally {
    try { unlinkSync(filePath); } catch (e) {}
  }
}

export const getAllJobs = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, title, company, location FROM jobs');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch jobs.' }); }
};

export const getJobById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    rows.length ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch job.' }); }
};