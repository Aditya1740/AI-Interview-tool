const express = require('express');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/jobs - list all active jobs (public)
router.get('/', (req, res) => {
  try {
    const jobs = db
      .prepare(
        `SELECT j.*, u.name as creator_name,
          (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
         FROM jobs j
         LEFT JOIN users u ON j.created_by = u.id
         WHERE j.is_active = 1
         ORDER BY j.created_at DESC`
      )
      .all();

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

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs - create job (HR/admin only)
router.post('/', authenticate, requireRole('hr', 'admin'), (req, res) => {
  try {
    const { title, description, requirements } = req.body;

    if (!title || !description || !requirements) {
      return res.status(400).json({ error: 'Title, description, and requirements are required' });
    }

    const result = db
      .prepare('INSERT INTO jobs (title, description, requirements, created_by) VALUES (?, ?, ?, ?)')
      .run([title, description, requirements, req.user.id]);

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
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { title, description, requirements, is_active } = req.body;

    db.prepare(
      'UPDATE jobs SET title = ?, description = ?, requirements = ?, is_active = ? WHERE id = ?'
    ).run([
      title ?? job.title,
      description ?? job.description,
      requirements ?? job.requirements,
      is_active !== undefined ? is_active : job.is_active,
      req.params.id
    ]);

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
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    db.prepare('UPDATE jobs SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Job deactivated successfully' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to deactivate job' });
  }
});

module.exports = router;
