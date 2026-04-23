const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { extractTextFromPDF } = require('../services/resume.service');
const { matchResumeToJob } = require('../services/matching.service');

const router = express.Router();

// Configure multer for PDF uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/applications - upload resume + apply to job (candidate only)
router.post(
  '/',
  authenticate,
  requireRole('candidate'),
  upload.single('resume'),
  async (req, res) => {
    try {
      const { job_id } = req.body;

      if (!job_id) {
        return res.status(400).json({ error: 'job_id is required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Resume PDF is required' });
      }

      // Check job exists
      const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND is_active = 1').get(job_id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found or inactive' });
      }

      // Check if already applied
      const existing = db
        .prepare('SELECT id FROM applications WHERE user_id = ? AND job_id = ?')
        .get([req.user.id, job_id]);
      if (existing) {
        return res.status(409).json({ error: 'You have already applied to this job' });
      }

      // Extract text from PDF
      const resumeText = await extractTextFromPDF(req.file.path);
      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({ error: 'Could not extract sufficient text from the PDF. Please ensure the PDF contains readable text.' });
      }

      // Call matching service
      const jdText = `${job.title}\n${job.description}\nRequirements: ${job.requirements}`;
      const matchDetails = await matchResumeToJob(resumeText, jdText);

      // Create application record
      const result = db
        .prepare(
          `INSERT INTO applications (user_id, job_id, resume_path, resume_text, match_score, match_details, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run([
          req.user.id,
          job_id,
          req.file.filename,
          resumeText,
          matchDetails.match_score,
          JSON.stringify(matchDetails),
          'applied'
        ]);

      const application = db
        .prepare('SELECT * FROM applications WHERE id = ?')
        .get(result.lastInsertRowid);

      res.status(201).json({
        ...application,
        match_details: JSON.parse(application.match_details)
      });
    } catch (err) {
      console.error('Application error:', err);
      res.status(500).json({ error: err.message || 'Failed to submit application' });
    }
  }
);

// GET /api/applications/my - get current candidate's applications
router.get('/my', authenticate, requireRole('candidate'), (req, res) => {
  try {
    const applications = db
      .prepare(
        `SELECT a.*, j.title as job_title, j.description as job_description,
          i.status as interview_status, i.avg_interview_score,
          e.overall_score, e.recommendation
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN interviews i ON i.application_id = a.id
         LEFT JOIN evaluations e ON e.application_id = a.id
         WHERE a.user_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(req.user.id);

    const parsed = applications.map((app) => ({
      ...app,
      match_details: app.match_details ? JSON.parse(app.match_details) : null
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/job/:jobId - get all applications for a job (HR/admin only)
router.get('/job/:jobId', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const applications = db
      .prepare(
        `SELECT a.*, u.name as candidate_name, u.email as candidate_email,
          j.title as job_title,
          i.status as interview_status, i.avg_interview_score,
          e.overall_score, e.recommendation, e.interview_component, e.match_component
         FROM applications a
         JOIN users u ON a.user_id = u.id
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN interviews i ON i.application_id = a.id
         LEFT JOIN evaluations e ON e.application_id = a.id
         WHERE a.job_id = ?
         ORDER BY e.overall_score DESC NULLS LAST, a.created_at DESC`
      )
      .all(req.params.jobId);

    const parsed = applications.map((app) => ({
      ...app,
      match_details: app.match_details ? JSON.parse(app.match_details) : null
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Get job applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id - get single application
router.get('/:id', authenticate, (req, res) => {
  try {
    const application = db
      .prepare(
        `SELECT a.*, u.name as candidate_name, u.email as candidate_email,
          j.title as job_title, j.description as job_description, j.requirements as job_requirements,
          i.questions, i.answers, i.answer_scores, i.avg_interview_score, i.status as interview_status,
          e.overall_score, e.recommendation, e.report, e.interview_component, e.match_component
         FROM applications a
         JOIN users u ON a.user_id = u.id
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN interviews i ON i.application_id = a.id
         LEFT JOIN evaluations e ON e.application_id = a.id
         WHERE a.id = ?`
      )
      .get(req.params.id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Access control: candidates can only see their own
    if (req.user.role === 'candidate' && application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parsed = {
      ...application,
      match_details: application.match_details ? JSON.parse(application.match_details) : null,
      questions: application.questions ? JSON.parse(application.questions) : null,
      answers: application.answers ? JSON.parse(application.answers) : null,
      answer_scores: application.answer_scores ? JSON.parse(application.answer_scores) : null,
      report: application.report ? JSON.parse(application.report) : null
    };

    res.json(parsed);
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

module.exports = router;
