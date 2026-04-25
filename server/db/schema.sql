CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('candidate', 'hr', 'admin')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Indeed-style metadata (also added via migrations.js for older DBs)
  company_name TEXT,
  company_description TEXT,
  company_logo_url TEXT,
  location TEXT,
  job_type TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'INR',
  experience_min INTEGER,
  experience_max INTEGER,
  num_openings INTEGER DEFAULT 1,
  application_deadline DATE,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  job_id INTEGER REFERENCES jobs(id),
  resume_path TEXT,
  resume_text TEXT,
  match_score REAL,
  match_details TEXT,
  status TEXT DEFAULT 'applied',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  questions TEXT,
  answers TEXT,
  answer_scores TEXT,
  avg_interview_score REAL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  match_component REAL,
  interview_component REAL,
  overall_score REAL,
  recommendation TEXT,
  report TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
