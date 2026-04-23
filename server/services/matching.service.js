const Groq = require('groq-sdk');
const PROMPTS = require('../prompts/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function matchResumeToJob(resumeText, jobDescription) {
  try {
    const prompt = PROMPTS.resumeMatching(resumeText, jobDescription);

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });
    const responseText = result.choices[0].message.content.trim();

    // Strip markdown code fences if present
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Matching service error:', err);
    throw new Error('Failed to match resume to job: ' + err.message);
  }
}

module.exports = { matchResumeToJob };
