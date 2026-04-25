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
      const { text: resumeText, length, isImageBased } = await extractTextFromPDF(req.file.path);

      if (isImageBased) {
        return res.status(400).json({
          error: 'This PDF appears to be image-based (no extractable text layer). Please upload a text-searchable PDF — try exporting directly from Word/Google Docs or your resume builder rather than scanning or going through a converter like iLovePDF.',
        });
      }
      if (length < 50) {
        return res.status(400).json({
          error: `Only ${length} characters of text could be extracted. The PDF may be encrypted, mostly images, or use a non-standard font. Please re-export and try again.`,
        });
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
        `SELECT a.*,
          j.title as job_title, j.description as job_description,
          j.company_name, j.company_logo_url, j.location, j.job_type,
          j.salary_min, j.salary_max, j.salary_currency,
          i.status as interview_status, i.avg_interview_score,
          e.overall_score, e.recommendation, e.report as report_json
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN (
           SELECT application_id, status, avg_interview_score
           FROM interviews GROUP BY application_id
         ) i ON i.application_id = a.id
         LEFT JOIN (
           SELECT application_id, overall_score, recommendation, report
           FROM evaluations GROUP BY application_id
         ) e ON e.application_id = a.id
         WHERE a.user_id = ?
         GROUP BY a.id
         ORDER BY a.created_at DESC`
      )
      .all(req.user.id);

    const parsed = applications.map((app) => {
      const report = app.report_json ? JSON.parse(app.report_json) : null;
      const out = {
        ...app,
        match_details: app.match_details ? JSON.parse(app.match_details) : null,
        // Promote sub-scores so the UI can show the full rubric
        resume_score:      report?.resume_score      ?? null,
        technical_score:   report?.technical_score   ?? null,
        hr_score:          report?.hr_score          ?? null,
        soft_signal_score: report?.soft_signal_score ?? null,
        total_score:       report?.total_score       ?? app.overall_score ?? null,
        hiring_verdict:    report?.hiring_verdict    ?? null,
      };
      delete out.report_json;
      return out;
    });

    res.json(parsed);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/job/:jobId - HR analytics view for a job
// Query params: minScore (>=), q (candidate name), sortBy (total|technical|hr|match|name|date)
router.get('/job/:jobId', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const { minScore, q, sortBy = 'total' } = req.query;
    // Subqueries on interviews/evaluations protect against duplicate rows
    // if multiple interview/evaluation records ever exist for one application.
    const applications = db
      .prepare(
        `SELECT a.*, u.name as candidate_name, u.email as candidate_email,
          j.title as job_title,
          i.status as interview_status, i.avg_interview_score,
          e.overall_score, e.recommendation, e.interview_component, e.match_component,
          e.report as report_json
         FROM applications a
         JOIN users u ON a.user_id = u.id
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN (
           SELECT application_id, status, avg_interview_score
           FROM interviews
           GROUP BY application_id
         ) i ON i.application_id = a.id
         LEFT JOIN (
           SELECT application_id, overall_score, recommendation, interview_component, match_component, report
           FROM evaluations
           GROUP BY application_id
         ) e ON e.application_id = a.id
         WHERE a.job_id = ?
         GROUP BY a.id`
      )
      .all(req.params.jobId);

    let parsed = applications.map((app) => {
      const report = app.report_json ? JSON.parse(app.report_json) : null;
      const out = {
        ...app,
        match_details: app.match_details ? JSON.parse(app.match_details) : null,
        // Promote section scores from the evaluation report for easy table rendering
        technical_score: report?.technical_score ?? null,
        hr_score: report?.hr_score ?? null,
        soft_signal_score: report?.soft_signal_score ?? null,
        resume_score: report?.resume_score ?? null,
        total_score: report?.total_score ?? app.overall_score ?? null,
        hiring_verdict: report?.hiring_verdict ?? null,
      };
      delete out.report_json;
      return out;
    });

    // Filtering
    const minScoreNum = parseFloat(minScore);
    if (!Number.isNaN(minScoreNum)) {
      parsed = parsed.filter((a) => (a.total_score ?? a.overall_score ?? 0) >= minScoreNum);
    }
    if (q) {
      const needle = String(q).toLowerCase();
      parsed = parsed.filter((a) =>
        (a.candidate_name || '').toLowerCase().includes(needle) ||
        (a.candidate_email || '').toLowerCase().includes(needle)
      );
    }

    // Sorting (nulls go last)
    const numCmp = (key) => (a, b) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    };
    if (sortBy === 'total')           parsed.sort(numCmp('total_score'));
    else if (sortBy === 'technical')  parsed.sort(numCmp('technical_score'));
    else if (sortBy === 'hr')         parsed.sort(numCmp('hr_score'));
    else if (sortBy === 'match')      parsed.sort(numCmp('match_score'));
    else if (sortBy === 'name')       parsed.sort((a, b) => (a.candidate_name || '').localeCompare(b.candidate_name || ''));
    else if (sortBy === 'date')       parsed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
