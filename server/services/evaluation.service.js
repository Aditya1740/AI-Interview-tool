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

async function generateEvaluation(jobTitle, matchScore, matchDetails, questionsWithAnswersAndScores) {
  try {
    // Compute score components server-side (formula is authoritative)
    const answerScores = questionsWithAnswersAndScores.map((q) => q.score || 0);
    const avgInterviewScore = answerScores.reduce((a, b) => a + b, 0) / answerScores.length;
    const interviewComponent = parseFloat(((avgInterviewScore / 10) * 60).toFixed(1));
    const matchComponent = parseFloat(((matchScore / 100) * 40).toFixed(1));
    const overallScore = parseFloat((interviewComponent + matchComponent).toFixed(1));

    // Format Q&A for prompt
    const qaWithScores = questionsWithAnswersAndScores
      .map(
        (q, i) =>
          `Q${i + 1} [${q.category || 'General'}]: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10\nFeedback: ${q.feedback || 'N/A'}`
      )
      .join('\n\n');

    const matchedSkills = Array.isArray(matchDetails.matched_skills)
      ? matchDetails.matched_skills.join(', ')
      : matchDetails.matched_skills || 'N/A';

    const missingSkills = Array.isArray(matchDetails.missing_skills)
      ? matchDetails.missing_skills.join(', ')
      : matchDetails.missing_skills || 'N/A';

    const prompt = PROMPTS.finalEvaluation(
      jobTitle,
      matchScore,
      matchDetails.summary || '',
      matchedSkills,
      missingSkills,
      qaWithScores
    );

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });
    const responseText = result.choices[0].message.content;
    const parsed = parseJSON(responseText);

    // Enforce formula — override whatever the model returned
    parsed.interview_component = interviewComponent;
    parsed.match_component = matchComponent;
    parsed.overall_score = overallScore;

    // Enforce recommendation based on computed score
    if (overallScore >= 80) {
      parsed.recommendation = 'Strongly Recommend';
    } else if (overallScore >= 65) {
      parsed.recommendation = 'Recommend';
    } else if (overallScore >= 50) {
      parsed.recommendation = 'Maybe';
    } else {
      parsed.recommendation = 'Not Recommend';
    }

    return parsed;
  } catch (err) {
    console.error('Evaluation service error:', err);
    throw new Error('Failed to generate evaluation: ' + err.message);
  }
}

module.exports = { generateEvaluation };
