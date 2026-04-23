const Groq = require('groq-sdk');
const PROMPTS = require('../prompts/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function parseJSON(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateQuestions(jobTitle, resumeSummary, jdText) {
  try {
    const prompt = PROMPTS.questionGeneration(jobTitle, resumeSummary, jdText);

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });
    const responseText = result.choices[0].message.content;
    const parsed = parseJSON(responseText);
    return parsed.questions;
  } catch (err) {
    console.error('Question generation error:', err);
    throw new Error('Failed to generate interview questions: ' + err.message);
  }
}

async function evaluateAnswer(jobTitle, question, answer) {
  try {
    const prompt = PROMPTS.answerEvaluation(jobTitle, question, answer);

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });
    const responseText = result.choices[0].message.content;
    return parseJSON(responseText);
  } catch (err) {
    console.error('Answer evaluation error:', err);
    throw new Error('Failed to evaluate answer: ' + err.message);
  }
}

module.exports = { generateQuestions, evaluateAnswer };
