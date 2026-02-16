import 'dotenv/config.js';
import { sequelize, connectDB } from '../db.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { unlinkSync, readFileSync } from 'fs';
import { extname } from 'path';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import db from '../db.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not defined in .env file.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// 1. Define Safety Settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const generationConfig = {
  temperature: 0.2,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
  responseMimeType: "application/json"
};

// Use a currently supported model name
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
    const strings = content.items.map(item => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
}

async function getAiAnalysis(resumeText, jobDescription) {
  const prompt = `
    You are an expert AI recruiting assistant. 
    Analyze the following resume and job description.
    Provide your response *only* in the requested JSON format. Do not add markdown \`\`\`json \`\`\`.

    JSON Schema:
    {
      "type": "object",
      "properties": {
        "fitScore": { "type": "number", "description": "A score from 0-100." },
        "reasoning": { "type": "string", "description": "A one-sentence explanation for the score." },
        "recommendations": { 
          "type": "array", 
          "items": { "type": "string" },
          "description": "3 actionable bullet points for the candidate."
        }
      },
      "required": ["fitScore", "reasoning", "recommendations"]
    }

    ---RESUME---
    ${resumeText.substring(0, 4000)}

    ---JOB DESCRIPTION---
    ${jobDescription.substring(0, 4000)}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    return JSON.parse(jsonText); 
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.response && error.response.promptFeedback) {
        console.error("Gemini API Blocked:", error.response.promptFeedback);
    }
    return null;
  }
}

export async function analyzeResume(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  let resumeText;
  const filePath = req.file.path;
  const fileExtension = extname(req.file.originalname).toLowerCase();

  try {
    if (fileExtension !== '.pdf') {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF file.' });
    }
    resumeText = await extractTextFromPDF(filePath);

  } catch (parseError) {
    console.error("Error parsing PDF:", parseError);
    return res.status(500).json({ error: 'Failed to read the resume file.' });
  } finally {
    try {
      unlinkSync(filePath);
    } catch (e) {
      console.error("Error deleting temp file:", e.message);
    }
  }

  let jobs;
  try {
    const result = await db.query('SELECT * FROM jobs');
    jobs = result.rows;
    if (jobs.length === 0) {
      return res.status(500).json({ error: "No jobs found in database to compare against." });
    }
  } catch (dbError) {
    console.error("Error fetching jobs from DB:", dbError);
    return res.status(500).json({ error: 'Failed to fetch job list.' });
  }
  
  const matchedJobs = [];
  const analysisPromises = jobs.slice(0, 10).map(job => 
    getAiAnalysis(resumeText, job.title + ' ' + job.description)
      .then(aiData => {
        if (aiData) {
          matchedJobs.push({
            ...job,
            fitScore: aiData.fitScore,
            reasoning: aiData.reasoning,
            recommendations: aiData.recommendations,
          });
        }
      })
  );

  try {
    await Promise.all(analysisPromises);
  } catch (aiError) {
    console.error("Error during parallel AI analysis:", aiError);
    return res.status(500).json({ error: 'An error occurred during AI analysis.' });
  }
  
  matchedJobs.sort((a, b) => b.fitScore - a.fitScore);

  res.status(200).json({
    matchedJobs: matchedJobs
  });
}

export async function getAllJobs(req, res) {
    try {
        const result = await db.query('SELECT id, title, company, location FROM jobs');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error in getAllJobs:", err.stack);
        res.status(500).json({ error: 'Failed to retrieve jobs.' });
    }
}

export async function getJobById(req, res) {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error in getJobById:", err.stack);
        res.status(500).json({ error: 'Failed to retrieve job details.' });
    }
}
