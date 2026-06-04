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

async function generateQuestions(jobTitle, resumeSummary, jdText, customQuestions = [], aiCount = 15) {
  let aiQuestions = [];

  if (aiCount > 0) {
    try {
      const prompt = PROMPTS.questionGeneration(jobTitle, resumeSummary, jdText, aiCount);
      const result = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });
      const responseText = result.choices[0].message.content;
      aiQuestions = parseJSON(responseText).questions;
    } catch (err) {
      console.error('Question generation error:', err);
      throw new Error('Failed to generate interview questions: ' + err.message);
    }
  }

  // Reassign sequential IDs: custom questions first, then AI questions
  const allQuestions = [
    ...customQuestions.map((q, i) => ({ ...q, id: i + 1 })),
    ...aiQuestions.map((q, i) => ({ ...q, id: customQuestions.length + i + 1 })),
  ];

  return allQuestions;
}

async function evaluateAnswer(jobTitle, questionObj, answer) {
  try {
    const prompt = PROMPTS.answerEvaluation(jobTitle, questionObj, answer);

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    const responseText = result.choices[0].message.content;
    return parseJSON(responseText);
  } catch (err) {
    console.error('Answer evaluation error:', err);
    throw new Error('Failed to evaluate answer: ' + err.message);
  }
}

module.exports = { generateQuestions, evaluateAnswer };
