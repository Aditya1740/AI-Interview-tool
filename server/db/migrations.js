/**
 * Idempotent migrations: each ALTER is wrapped in try/catch because SQLite
 * has no `ADD COLUMN IF NOT EXISTS`. Re-running on an already-migrated DB
 * is a no-op (duplicate column name errors are silently swallowed).
 */
const ADDITIONS = [
  // Indeed-style job posting metadata
  ['jobs', 'company_name',         'TEXT'],
  ['jobs', 'company_description',  'TEXT'],
  ['jobs', 'company_logo_url',     'TEXT'],
  ['jobs', 'location',             'TEXT'],
  ['jobs', 'job_type',             'TEXT'],          // Full-time | Part-time | Internship | Contract | Remote
  ['jobs', 'salary_min',           'INTEGER'],
  ['jobs', 'salary_max',           'INTEGER'],
  ['jobs', 'salary_currency',      "TEXT DEFAULT 'INR'"],
  ['jobs', 'experience_min',       'INTEGER'],
  ['jobs', 'experience_max',       'INTEGER'],
  ['jobs', 'num_openings',         'INTEGER DEFAULT 1'],
  ['jobs', 'application_deadline', 'DATE'],
  ['jobs', 'tags',                 'TEXT'],          // comma-separated: Urgent, Hot, Remote, etc.
];

function runMigrations(db) {
  for (const [table, col, type] of ADDITIONS) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    } catch (err) {
      const msg = String(err?.message || err);
      if (!/duplicate column name/i.test(msg)) {
        // Surface non-trivial errors; ignore the "already exists" case.
        console.warn(`[migrations] ${table}.${col}: ${msg}`);
      }
    }
  }
}

module.exports = { runMigrations };
