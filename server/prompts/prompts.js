const PROMPTS = {
  // ============================================================
  // STEP 1: RESUME-JD MATCHING (15 MARKS)
  // ============================================================
  resumeMatching: (resumeText, jdText) => `You are a strict, experienced technical interviewer and hiring manager (15+ years across multiple domains). Evaluate this candidate's resume against the JD using SEMANTIC understanding — not keyword matching.

=== RESUME ===
${resumeText}

=== JOB DESCRIPTION ===
${jdText}

=== SCORING RUBRIC (TOTAL OUT OF 15) ===
1. Skills match (0-6)        — depth, relevance, evidence of ACTUAL usage (projects, metrics).
2. Experience relevance (0-5) — projects/internships/work directly aligned with the JD.
3. Domain alignment (0-2)    — industry / problem-space match.
4. Education & certs (0-2)   — only if relevant; do not pad if irrelevant.

=== STRICTNESS RULES ===
- Penalize keyword stuffing without proof.
- Penalize vague or generic descriptions ("worked on X", no metrics).
- Reward proof of work: real projects, measurable impact, ownership.
- Do NOT hallucinate experience that isn't in the resume.
- A score above 12/15 must be genuinely earned.

=== OUTPUT (STRICT JSON, no markdown) ===
"match_score" must equal round((resume_score / 15) * 100) — kept for UI compatibility.

{
  "resume_score": <integer 0-15, equals sum of breakdown values>,
  "match_score": <integer 0-100, normalized for display>,
  "breakdown": {
    "skills_match": <0-6>,
    "experience_relevance": <0-5>,
    "domain_alignment": <0-2>,
    "education_certs": <0-2>
  },
  "matched_skills": [<skills present in resume AND relevant to JD>],
  "missing_skills": [<critical JD skills absent from resume>],
  "reasoning": "<3-4 line strict, justified reasoning for the score>",
  "summary": "<2-3 sentence honest recruiter-style assessment>"
}`,

  // ============================================================
  // STEP 2: GENERATE INTERVIEW QUESTIONS (10 Technical + 5 HR)
  // ============================================================
  questionGeneration: (jobTitle, resumeSummary, jdText) => `You are a senior technical interviewer preparing a rigorous interview for the role of ${jobTitle}. Generate EXACTLY 15 questions: 10 Technical + 5 HR/Behavioral. Be specific to THIS candidate and THIS JD — no generic boilerplate.

=== CANDIDATE RESUME SUMMARY ===
${resumeSummary}

=== JOB DESCRIPTION ===
${jdText}

=== HARD RULES ===
- Exactly 10 Technical, then exactly 5 HR (in that order).
- Technical questions must scale in difficulty — Q1 easiest, Q10 hardest. Cover concepts, problem-solving, scenarios, system design / architecture (when JD warrants).
- At least ONE technical question references a specific project/tech from the resume by name.
- At least ONE technical question targets a clear weakness or gap vs the JD.
- At least ONE technical question is a realistic scenario ("Your service is down at 2am and...", "You're given X data and Y constraint, design...").
- HR questions must probe ownership, failure, conflict, motivation, culture fit — STAR-friendly.
- No yes/no questions. No clichés ("Tell me about yourself" without a sharp angle).
- For EACH question, produce a grading rubric the interviewer will check against.

=== OUTPUT (STRICT JSON, no markdown) ===
{
  "questions": [
    {
      "id": 1,
      "category": "Technical" | "HR",
      "question": "<the interviewer's question>",
      "ideal_points": [<3-5 concrete things a strong answer would cover>],
      "difficulty": "easy" | "medium" | "hard",
      "targets": "<short note: what this question is probing>"
    }
    // ... 14 more, in order: 10 Technical first (easy → hard), then 5 HR
  ]
}`,

  // ============================================================
  // STEP 3: PER-ANSWER EVALUATION (during interview)
  // Returns 0-10 per answer; final aggregation happens in finalEvaluation.
  // ============================================================
  answerEvaluation: (jobTitle, questionObj, answer) => {
    const questionText = typeof questionObj === 'string' ? questionObj : questionObj.question;
    const idealPoints = (typeof questionObj === 'object' && Array.isArray(questionObj.ideal_points))
      ? questionObj.ideal_points.map((p, i) => `   ${i + 1}. ${p}`).join('\n')
      : '   (no rubric provided — evaluate using general principles for this role)';
    const category = (typeof questionObj === 'object' && questionObj.category) ? questionObj.category : 'General';
    const isHR = category.toLowerCase().includes('hr') || category.toLowerCase().includes('behav');

    return `You are a strict senior interviewer evaluating a live answer for ${jobTitle}. Grade the answer the way a real interviewer would — strict, specific, rubric-driven.

=== QUESTION (${category}) ===
${questionText}

=== RUBRIC — IDEAL ANSWER COVERS ===
${idealPoints}

=== CANDIDATE'S ANSWER ===
${answer}

=== EVALUATION DIMENSIONS ${isHR ? '(HR / Behavioral)' : '(Technical)'} ===
${isHR ? `- communication_clarity: structured, easy to follow
- confidence: grounded vs hedged/evasive
- star_structure: situation/task/action/result framing
- culture_fit: ownership, attitude, alignment with role` : `- conceptual_understanding: correctness and depth of concepts
- problem_solving: structured reasoning, tradeoffs, examples
- explanation_clarity: communicates complex ideas cleanly`}

=== STRICTNESS BAND ===
- 9-10: near-perfect, hits most rubric points, specific and insightful.
- 7-8:  solid hire-signal, covers core, minor gaps.
- 5-6:  average, vague or thin, misses key rubric points.
- 3-4:  weak, shallow or off-topic.
- 0-2:  poor / non-answer / clearly wrong.

Vague answers without examples cap at 6. Generic AI-sounding/memorized answers cap at 5. Bluffing (confident tone but wrong content) caps at 4. Reserve 9-10 only for answers you'd champion.

=== OUTPUT (STRICT JSON, no markdown) ===
{
  "score": <0-10 integer>,
  ${isHR
    ? `"communication_clarity": <0-10>,
  "confidence": <0-10>,
  "star_structure": <0-10>,
  "culture_fit": <0-10>,`
    : `"conceptual_understanding": <0-10>,
  "problem_solving": <0-10>,
  "explanation_clarity": <0-10>,`}
  "rubric_coverage": [<ideal_points actually addressed, short strings>],
  "rubric_missed": [<ideal_points missed>],
  "bluffing_suspected": <true|false>,
  "feedback": "<2-3 sentence honest interviewer assessment>"
}`;
  },

  // ============================================================
  // STEP 4-6: FINAL EVALUATION (15 + 50 + 25 + 10 = 100)
  // Includes Soft Signal analysis, decision rules, structured feedback.
  // ============================================================
  finalEvaluation: (jobTitle, resumeScore, matchSummary, matchedSkills, missingSkills, technicalQA, hrQA) => `You are a strict, fair senior interviewer and hiring manager writing the final report for ${jobTitle}. Evaluate the FULL interview against the rubric below. Be unbiased, realistic, and justified — no inflated scores.

=== INPUT ===
Resume Score (already computed): ${resumeScore}/15
Resume Summary: ${matchSummary}
Matched Skills: ${matchedSkills}
Missing Skills: ${missingSkills}

--- TECHNICAL Q&A (10 questions, each pre-graded /10) ---
${technicalQA || '(none)'}

--- HR / BEHAVIORAL Q&A (5 questions, each pre-graded /10) ---
${hrQA || '(none)'}

=== SCORING RUBRIC ===
You will produce four sub-scores on the EXACT scales below. Be strict; do not give full marks unless near-perfect.

A. TECHNICAL (out of 50) — judge across all 10 technical Q&A holistically:
   - conceptual_understanding (0-20): correctness, depth, fundamentals.
   - problem_solving (0-20): structured reasoning, tradeoffs, scenario handling.
   - explanation_clarity (0-10): clean communication of complex ideas.
   Internal consistency check: if average per-answer technical score is X/10, expect technical total ~ X*5 (±5). Big mismatches must be justified.

B. HR / BEHAVIORAL (out of 25) — judge across all 5 HR Q&A holistically:
   - communication_clarity (0-6)
   - confidence_articulation (0-6)
   - star_structure (0-7)
   - culture_fit_attitude (0-6)
   Penalize generic answers, lack of ownership, poor communication.

C. AI SOFT SIGNAL ANALYSIS (out of 10) — analyze the full answer set:
   - consistency (0-3): do answers contradict each other or the resume?
   - confidence_tone (0-3): grounded vs hedged/bluffing.
   - response_quality (0-2): substance vs filler.
   - originality (0-2): genuine voice vs generic/AI-written.

D. RESUME (out of 15) — already provided: ${resumeScore}.

TOTAL = resume_score + technical_score + hr_score + soft_signal_score   (out of 100)

=== HARD DECISION RULES (apply AFTER scoring) ===
1. If technical_score < 25  → recommendation = "Reject" (no exceptions).
2. Else if hr_score < 10    → recommendation = "Reject".
3. Else, by total_score:
   - 85-100: "Strong Hire"
   - 70-84:  "Hire"
   - 55-69:  "Consider"
   - <55:    "Reject"

hiring_verdict mapping (for HR UI):
   Strong Hire → "Hire"
   Hire        → "Hire"
   Consider  → "Lean Hire"
   Reject      → "No Hire"

=== STRICTNESS REMINDERS ===
- Do NOT hallucinate experience not in the resume or interview.
- Detect bluffing — confident wording with wrong/shallow content caps technical sub-scores hard.
- Generic, memorized, or "textbook" answers cap originality and conceptual scores.
- Justify scores; prefer the lower of two reasonable interpretations.

=== OUTPUT (STRICT JSON, no markdown) ===
{
  "resume_score": ${resumeScore},
  "technical_score": <0-50 integer>,
  "technical_breakdown": {
    "conceptual_understanding": <0-20>,
    "problem_solving": <0-20>,
    "explanation_clarity": <0-10>
  },
  "hr_score": <0-25 integer>,
  "hr_breakdown": {
    "communication_clarity": <0-6>,
    "confidence_articulation": <0-6>,
    "star_structure": <0-7>,
    "culture_fit_attitude": <0-6>
  },
  "soft_signal_score": <0-10 integer>,
  "soft_signal_breakdown": {
    "consistency": <0-3>,
    "confidence_tone": <0-3>,
    "response_quality": <0-2>,
    "originality": <0-2>
  },
  "total_score": <0-100 integer, sum of resume + technical + hr + soft_signal>,
  "recommendation": "Strong Hire" | "Hire" | "Consider" | "Reject",
  "hiring_verdict": "Hire" | "Lean Hire" | "No Hire",
  "auto_reject_reason": "<empty string, or 'Technical < 25' / 'HR < 10' if triggered>",
  "strengths": [<exactly 3 specific strengths grounded in actual answers/resume>],
  "weaknesses": [<exactly 3 specific weaknesses, honest>],
  "recruiter_one_liner": "<one-line note like 'Strong systems thinker, weak on async patterns. Hire for backend infra team.'>",
  "interview_performance_summary": "<2-3 sentences on how the interview went>",
  "resume_fit_summary": "<1-2 sentences on resume-to-role fit>",
  "overall_summary": "<3-4 sentence final narrative for the hiring committee>"
}`
};

module.exports = PROMPTS;
