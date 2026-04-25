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

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function bandFromTotal(total) {
  if (total >= 85) return { recommendation: 'Strong Hire', hiring_verdict: 'Hire' };
  if (total >= 70) return { recommendation: 'Hire',         hiring_verdict: 'Hire' };
  if (total >= 55) return { recommendation: 'Consider',     hiring_verdict: 'Lean Hire' };
  return                 { recommendation: 'Reject',       hiring_verdict: 'No Hire' };
}

async function generateEvaluation(jobTitle, matchScore /* 0-100, legacy */, matchDetails, qaList) {
  try {
    // Resume score on the new 0-15 scale, with backward-compat fallback if
    // the resume matching response only returned the legacy 0-100 match_score.
    const resumeScore = clampInt(
      matchDetails?.resume_score ?? Math.round((Number(matchScore) || 0) * 15 / 100),
      0,
      15
    );

    // Split Q&A into Technical vs HR for the final prompt.
    const isHR = (cat = '') => /hr|behav/i.test(cat);
    const fmt = (q, i) =>
      `Q${i + 1} [${q.category || 'General'}] (difficulty: ${q.difficulty || 'n/a'}): ${q.question}\n` +
      `Answer: ${q.answer}\n` +
      `Per-answer score: ${q.score}/10\n` +
      `Feedback: ${q.feedback || 'N/A'}`;

    const techList = qaList.filter((q) => !isHR(q.category));
    const hrList   = qaList.filter((q) =>  isHR(q.category));
    const technicalQA = techList.map(fmt).join('\n\n');
    const hrQA        = hrList.map(fmt).join('\n\n');

    const matchedSkills = Array.isArray(matchDetails?.matched_skills)
      ? matchDetails.matched_skills.join(', ')
      : matchDetails?.matched_skills || 'N/A';
    const missingSkills = Array.isArray(matchDetails?.missing_skills)
      ? matchDetails.missing_skills.join(', ')
      : matchDetails?.missing_skills || 'N/A';

    const prompt = PROMPTS.finalEvaluation(
      jobTitle,
      resumeScore,
      matchDetails?.summary || matchDetails?.reasoning || '',
      matchedSkills,
      missingSkills,
      technicalQA,
      hrQA
    );

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = parseJSON(result.choices[0].message.content);

    // ----- Server-authoritative scoring & decision rules -----
    parsed.resume_score      = clampInt(parsed.resume_score ?? resumeScore, 0, 15);
    parsed.technical_score   = clampInt(parsed.technical_score, 0, 50);
    parsed.hr_score          = clampInt(parsed.hr_score, 0, 25);
    parsed.soft_signal_score = clampInt(parsed.soft_signal_score, 0, 10);

    const total =
      parsed.resume_score +
      parsed.technical_score +
      parsed.hr_score +
      parsed.soft_signal_score;
    parsed.total_score = total;

    // Auto-reject rules override the band.
    let recommendation, hiring_verdict, auto_reject_reason = '';
    if (parsed.technical_score < 25) {
      recommendation = 'Reject';
      hiring_verdict = 'No Hire';
      auto_reject_reason = 'Technical < 25';
    } else if (parsed.hr_score < 10) {
      recommendation = 'Reject';
      hiring_verdict = 'No Hire';
      auto_reject_reason = 'HR < 10';
    } else {
      const band = bandFromTotal(total);
      recommendation = band.recommendation;
      hiring_verdict = band.hiring_verdict;
    }
    parsed.recommendation     = recommendation;
    parsed.hiring_verdict     = hiring_verdict;
    parsed.auto_reject_reason = auto_reject_reason;

    // ----- Legacy keys for existing DB columns / older UI components -----
    // match_component  : resume contribution (0-15)
    // interview_component : interview contribution (technical + HR + soft, 0-85)
    // overall_score    : total (0-100)
    parsed.match_component     = parsed.resume_score;
    parsed.interview_component = parsed.technical_score + parsed.hr_score + parsed.soft_signal_score;
    parsed.overall_score       = total;

    return parsed;
  } catch (err) {
    console.error('Evaluation service error:', err);
    throw new Error('Failed to generate evaluation: ' + err.message);
  }
}

module.exports = { generateEvaluation };
