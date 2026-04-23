const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { generateEvaluation } = require('../services/evaluation.service');

const router = express.Router();

// POST /api/evaluation/generate/:applicationId - generate final evaluation
router.post('/generate/:applicationId', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;

    const application = db
      .prepare(
        `SELECT a.*, j.title as job_title, j.description as job_description
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = ?`
      )
      .get(applicationId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Access control: candidate can only generate their own, hr/admin can generate any
    if (req.user.role === 'candidate' && application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if interview is completed
    const interview = db
      .prepare('SELECT * FROM interviews WHERE application_id = ?')
      .get(applicationId);

    if (!interview || interview.status !== 'completed') {
      return res.status(400).json({ error: 'Interview must be completed before generating evaluation' });
    }

    // Check if evaluation already exists
    const existingEval = db
      .prepare('SELECT * FROM evaluations WHERE application_id = ?')
      .get(applicationId);

    if (existingEval) {
      return res.json({
        ...existingEval,
        report: existingEval.report ? JSON.parse(existingEval.report) : null
      });
    }

    // Prepare data for evaluation
    const matchDetails = application.match_details ? JSON.parse(application.match_details) : {};
    const questions = JSON.parse(interview.questions || '[]');
    const answers = JSON.parse(interview.answers || '[]');
    const answerScores = JSON.parse(interview.answer_scores || '[]');

    const questionsWithAnswersAndScores = questions.map((q, i) => ({
      question: q.question,
      category: q.category,
      answer: answers[i] || 'No answer provided',
      score: answerScores[i]?.score || 0,
      feedback: answerScores[i]?.feedback || 'N/A'
    }));

    // Generate evaluation
    const evalResult = await generateEvaluation(
      application.job_title,
      application.match_score,
      matchDetails,
      questionsWithAnswersAndScores
    );

    // Store evaluation
    const result = db
      .prepare(
        `INSERT INTO evaluations (application_id, match_component, interview_component, overall_score, recommendation, report)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run([
        applicationId,
        evalResult.match_component,
        evalResult.interview_component,
        evalResult.overall_score,
        evalResult.recommendation,
        JSON.stringify(evalResult)
      ]);

    const evaluation = db
      .prepare('SELECT * FROM evaluations WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({
      ...evaluation,
      report: JSON.parse(evaluation.report)
    });
  } catch (err) {
    console.error('Generate evaluation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate evaluation' });
  }
});

// GET /api/evaluation/:applicationId - get evaluation for application
router.get('/:applicationId', authenticate, (req, res) => {
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

    const evaluation = db
      .prepare('SELECT * FROM evaluations WHERE application_id = ?')
      .get(applicationId);

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    res.json({
      ...evaluation,
      report: evaluation.report ? JSON.parse(evaluation.report) : null
    });
  } catch (err) {
    console.error('Get evaluation error:', err);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
});

module.exports = router;
