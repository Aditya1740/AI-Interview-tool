const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { generateQuestions, evaluateAnswer } = require('../services/interview.service');

const router = express.Router();

// POST /api/interview/start/:applicationId - generate questions (candidate only)
router.post('/start/:applicationId', authenticate, requireRole('candidate'), async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    const application = db
      .prepare(
        `SELECT a.*, j.title as job_title, j.description as job_description,
                j.requirements as job_requirements, j.interview_config
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if interview already exists
    const existingInterview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    if (existingInterview && existingInterview.status !== 'pending') {
      return res.status(200).json({
        ...existingInterview,
        questions: existingInterview.questions ? JSON.parse(existingInterview.questions) : [],
        answers: existingInterview.answers ? JSON.parse(existingInterview.answers) : [],
        answer_scores: existingInterview.answer_scores ? JSON.parse(existingInterview.answer_scores) : []
      });
    }

    // Generate questions
    const resumeSummary = application.resume_text
      ? application.resume_text.substring(0, 1500)
      : 'No resume text available';
    const jdText = `${application.job_title}\n${application.job_description}\nRequirements: ${application.job_requirements}`;

    const interviewConfig  = application.interview_config ? JSON.parse(application.interview_config) : {};
    const customQuestions  = interviewConfig.custom_questions || [];
    const aiCount          = Math.max(0, 15 - customQuestions.length);

    const questions = await generateQuestions(application.job_title, resumeSummary, jdText, customQuestions, aiCount);

    if (existingInterview) {
      // Update existing pending interview
      db.prepare(
        `UPDATE interviews SET questions = ?, status = 'in_progress' WHERE application_id = ?`
      ).run([JSON.stringify(questions), applicationId]);
    } else {
      // Create new interview record
      db.prepare(
        `INSERT INTO interviews (application_id, questions, answers, answer_scores, status)
         VALUES (?, ?, ?, ?, 'in_progress')`
      ).run([applicationId, JSON.stringify(questions), JSON.stringify([]), JSON.stringify([])]);
    }

    const interview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    res.status(201).json({
      ...interview,
      questions: JSON.parse(interview.questions),
      answers: JSON.parse(interview.answers || '[]'),
      answer_scores: JSON.parse(interview.answer_scores || '[]')
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ error: err.message || 'Failed to start interview' });
  }
});

// GET /api/interview/:applicationId - get interview for application
router.get('/:applicationId', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Access control
    if (req.user.role === 'candidate' && application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const interview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not started yet' });
    }

    res.json({
      ...interview,
      questions: interview.questions ? JSON.parse(interview.questions) : [],
      answers: interview.answers ? JSON.parse(interview.answers) : [],
      answer_scores: interview.answer_scores ? JSON.parse(interview.answer_scores) : []
    });
  } catch (err) {
    console.error('Get interview error:', err);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// POST /api/interview/answer/:applicationId - submit an answer
router.post('/answer/:applicationId', authenticate, requireRole('candidate'), async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const { questionIndex, answer } = req.body;

    if (questionIndex === undefined || !answer) {
      return res.status(400).json({ error: 'questionIndex and answer are required' });
    }

    const application = db
      .prepare(
        `SELECT a.*, j.title as job_title FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const interview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'Interview already completed' });
    }

    const questions = JSON.parse(interview.questions);
    const answers = JSON.parse(interview.answers || '[]');
    const answerScores = JSON.parse(interview.answer_scores || '[]');

    if (questionIndex < 0 || questionIndex >= questions.length) {
      return res.status(400).json({ error: 'Invalid question index' });
    }

    if (answers[questionIndex] !== undefined) {
      return res.status(400).json({ error: 'This question has already been answered' });
    }

    const question = questions[questionIndex];

    // Evaluate the answer with the LLM, passing the full question object
    // so its ideal_points / category are used as the grading rubric.
    const evaluation = await evaluateAnswer(application.job_title, question, answer);

    // Store answer and score
    answers[questionIndex] = answer;
    answerScores[questionIndex] = {
      ...evaluation,
      questionId: question.id
    };

    // Check if all questions are answered
    const answeredCount = answers.filter((a) => a !== undefined && a !== null).length;
    const allAnswered = answeredCount === questions.length;

    let avgInterviewScore = null;
    let newStatus = 'in_progress';

    if (allAnswered) {
      const scores = answerScores.map((s) => s.score || 0);
      avgInterviewScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      newStatus = 'completed';
    }

    db.prepare(
      `UPDATE interviews SET answers = ?, answer_scores = ?, avg_interview_score = ?, status = ?
       WHERE application_id = ?`
    ).run([
      JSON.stringify(answers),
      JSON.stringify(answerScores),
      avgInterviewScore,
      newStatus,
      applicationId
    ]);

    const updatedInterview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    res.json({
      ...updatedInterview,
      questions: JSON.parse(updatedInterview.questions),
      answers: JSON.parse(updatedInterview.answers || '[]'),
      answer_scores: JSON.parse(updatedInterview.answer_scores || '[]'),
      currentAnswerEvaluation: evaluation
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit answer' });
  }
});

module.exports = router;
