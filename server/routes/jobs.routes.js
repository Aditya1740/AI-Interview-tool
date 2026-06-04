const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

const EDITABLE_FIELDS = [
  'title', 'description', 'requirements',
  'company_name', 'company_description', 'company_logo_url',
  'location', 'job_type',
  'salary_min', 'salary_max', 'salary_currency',
  'experience_min', 'experience_max',
  'num_openings', 'application_deadline',
  'tags', 'is_active',
  'interview_config',
];

// GET /api/jobs - list/search jobs (public)
// Query params: q, location, jobType, minSalary, minExperience, sortBy
router.get('/', (req, res) => {
  try {
    const {
      q,
      location,
      jobType,
      minSalary,
      minExperience,
      sortBy = 'recent',
    } = req.query;

    const where = ['j.is_active = 1'];
    const params = [];

    if (q) {
      where.push(
        '(LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(j.requirements) LIKE ? OR LOWER(IFNULL(j.company_name, \'\')) LIKE ?)'
      );
      const needle = `%${String(q).toLowerCase()}%`;
      params.push(needle, needle, needle, needle);
    }
    if (location) {
      where.push('LOWER(IFNULL(j.location, \'\')) LIKE ?');
      params.push(`%${String(location).toLowerCase()}%`);
    }
    if (jobType) {
      where.push('LOWER(IFNULL(j.job_type, \'\')) = ?');
      params.push(String(jobType).toLowerCase());
    }
    if (minSalary) {
      // Job qualifies if its salary_max meets/exceeds the candidate's floor.
      where.push('IFNULL(j.salary_max, j.salary_min) >= ?');
      params.push(parseInt(minSalary, 10) || 0);
    }
    if (minExperience !== undefined && minExperience !== '') {
      // Candidate has X years; show jobs requiring at most X (or unspecified).
      where.push('(j.experience_min IS NULL OR j.experience_min <= ?)');
      params.push(parseInt(minExperience, 10) || 0);
    }

    let orderBy = 'j.created_at DESC';
    if (sortBy === 'salary_high') orderBy = 'IFNULL(j.salary_max, j.salary_min) DESC NULLS LAST, j.created_at DESC';
    else if (sortBy === 'salary_low') orderBy = 'IFNULL(j.salary_min, j.salary_max) ASC NULLS LAST, j.created_at DESC';
    else if (sortBy === 'deadline') orderBy = 'j.application_deadline ASC NULLS LAST, j.created_at DESC';

    const sql = `
      SELECT j.*, u.name as creator_name,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
      FROM jobs j
      LEFT JOIN users u ON j.created_by = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
    `;

    const jobs = db.prepare(sql).all(params);
    res.json(jobs);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - get single job (public)
router.get('/:id', (req, res) => {
  try {
    const job = db
      .prepare(
        `SELECT j.*, u.name as creator_name,
          (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
         FROM jobs j
         LEFT JOIN users u ON j.created_by = u.id
         WHERE j.id = ?`
      )
      .get(req.params.id);

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Build the column-list and value-list for INSERT/UPDATE from a body, in a
// safe whitelist-driven way.
function buildJobPayload(body) {
  const cols = [];
  const vals = [];
  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    cols.push(key);
    vals.push(body[key] === '' ? null : body[key]);
  }
  return { cols, vals };
}

// POST /api/jobs - create job (HR/admin only)
router.post('/', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const { title, description, requirements } = req.body;
    if (!title || !description || !requirements) {
      return res.status(400).json({ error: 'Title, description, and requirements are required' });
    }

    const { cols, vals } = buildJobPayload(req.body);
    cols.push('created_by'); vals.push(req.user.id);

    const placeholders = cols.map(() => '?').join(',');
    const result = db
      .prepare(`INSERT INTO jobs (${cols.join(',')}) VALUES (${placeholders})`)
      .run(vals);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(job);
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id - update job (HR/admin only)
router.put('/:id', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { cols, vals } = buildJobPayload(req.body);
    if (cols.length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }
    const setSql = cols.map((c) => `${c} = ?`).join(', ');
    db.prepare(`UPDATE jobs SET ${setSql} WHERE id = ?`).run([...vals, req.params.id]);

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id - deactivate job (HR/admin only)
router.delete('/:id', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    db.prepare('UPDATE jobs SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Job deactivated successfully' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to deactivate job' });
  }
});

module.exports = router;
