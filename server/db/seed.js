require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('./database');

/**
 * Destructive reset:
 *   - clears all jobs, applications, interviews, evaluations
 *   - removes any users not in the new demo set
 *   - reseeds 3 candidate + 3 HR demo accounts
 *   - reseeds a small set of demo jobs across 3 companies
 *
 * Safe to run repeatedly. All demo accounts share the password "password123".
 */

const DEMO_USERS = [
  { name: 'Aarav Mehta',    email: 'candidate1@demo.com', role: 'candidate' },
  { name: 'Priya Sharma',   email: 'candidate2@demo.com', role: 'candidate' },
  { name: 'Rohan Iyer',     email: 'candidate3@demo.com', role: 'candidate' },
  { name: 'Neha Kapoor',    email: 'hr1@demo.com',        role: 'hr' },
  { name: 'Vikram Joshi',   email: 'hr2@demo.com',        role: 'hr' },
  { name: 'Ananya Desai',   email: 'hr3@demo.com',        role: 'hr' },
];

async function seed() {
  console.log('Starting reset + seed...');

  db.exec('DELETE FROM evaluations');
  db.exec('DELETE FROM interviews');
  db.exec('DELETE FROM applications');
  db.exec('DELETE FROM jobs');
  console.log('Cleared: jobs, applications, interviews, evaluations.');

  const keepEmails = DEMO_USERS.map((u) => `'${u.email}'`).join(',');
  db.exec(`DELETE FROM users WHERE email NOT IN (${keepEmails})`);
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('jobs','applications','interviews','evaluations')");

  const passwordHash = bcrypt.hashSync('password123', 10);
  const upsertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role
  `);
  for (const u of DEMO_USERS) upsertUser.run([u.name, u.email, passwordHash, u.role]);

  // Fetch HR ids for created_by
  const getId = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
  const hr1 = getId('hr1@demo.com');
  const hr2 = getId('hr2@demo.com');
  const hr3 = getId('hr3@demo.com');

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      title, description, requirements, created_by,
      company_name, company_description, company_logo_url,
      location, job_type,
      salary_min, salary_max, salary_currency,
      experience_min, experience_max,
      num_openings, application_deadline, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const DEMO_JOBS = [
    {
      title: 'Backend Engineer (Node.js)',
      description: 'Build and scale our payments platform processing 10M+ transactions/month. You\'ll own services end-to-end: design, implementation, observability, and on-call. We use Node.js, Postgres, Redis, and Kafka in a Kubernetes-on-AWS environment.',
      requirements: 'Node.js, TypeScript, PostgreSQL, REST APIs, Docker, AWS, Kafka, system design, 3+ years experience',
      created_by: hr1,
      company_name: 'Lumen Pay',
      company_description: 'A fast-growing fintech building infrastructure for emerging-market payments. Series B, ~120 engineers, hybrid culture.',
      company_logo_url: '',
      location: 'Bangalore, India',
      job_type: 'Full-time',
      salary_min: 1800000, salary_max: 2800000, salary_currency: 'INR',
      experience_min: 3, experience_max: 6,
      num_openings: 2, application_deadline: '2026-06-30',
      tags: 'Hot,Hybrid',
    },
    {
      title: 'Frontend Engineer (React)',
      description: 'Ship pixel-perfect user experiences for our merchant dashboard used by 50K+ businesses. You\'ll work closely with designers and backend engineers to build delightful, accessible UIs in React/TypeScript with TanStack Query and Tailwind.',
      requirements: 'React, TypeScript, Tailwind CSS, TanStack Query, REST APIs, accessibility, testing (Vitest/Jest), 2+ years experience',
      created_by: hr1,
      company_name: 'Lumen Pay',
      company_description: 'A fast-growing fintech building infrastructure for emerging-market payments. Series B, ~120 engineers, hybrid culture.',
      company_logo_url: '',
      location: 'Remote (India)',
      job_type: 'Remote',
      salary_min: 1500000, salary_max: 2500000, salary_currency: 'INR',
      experience_min: 2, experience_max: 5,
      num_openings: 1, application_deadline: '2026-07-15',
      tags: 'Remote',
    },
    {
      title: 'Data Scientist — Recommendations',
      description: 'Own the recommendation models powering our content discovery feed (40M MAU). You\'ll iterate from offline metrics to online A/B tests, partnering with engineers to ship models to production. Stack: Python, PyTorch, Spark, Airflow.',
      requirements: 'Python, PyTorch or TensorFlow, recommendation systems, A/B testing, SQL, Spark or BigQuery, statistics, 3+ years experience',
      created_by: hr2,
      company_name: 'Trellis Media',
      company_description: 'A media-tech company building short-form content platforms. Profitable, ~80 engineers, ships fast.',
      company_logo_url: '',
      location: 'Mumbai, India',
      job_type: 'Full-time',
      salary_min: 2200000, salary_max: 3500000, salary_currency: 'INR',
      experience_min: 3, experience_max: 7,
      num_openings: 1, application_deadline: '2026-08-01',
      tags: 'Urgent',
    },
    {
      title: 'Product Manager',
      description: 'Drive the roadmap for our creator-tooling pillar. Define problems, validate with research, partner with design + eng, and ship features that move retention and engagement metrics. You\'ll own a north-star metric and quarterly OKRs.',
      requirements: 'Product strategy, user research, SQL, A/B testing, roadmapping, stakeholder management, 4+ years PM experience',
      created_by: hr2,
      company_name: 'Trellis Media',
      company_description: 'A media-tech company building short-form content platforms. Profitable, ~80 engineers, ships fast.',
      company_logo_url: '',
      location: 'Mumbai, India',
      job_type: 'Full-time',
      salary_min: 2500000, salary_max: 4000000, salary_currency: 'INR',
      experience_min: 4, experience_max: 8,
      num_openings: 1, application_deadline: '2026-07-31',
      tags: '',
    },
    {
      title: 'SDE Intern (Summer 2026)',
      description: '12-week paid internship on our infrastructure team. You\'ll ship a real project with mentorship: instrumenting our service mesh, improving CI build times, or building developer-facing tools. Strong interns convert to full-time offers.',
      requirements: 'Data structures, algorithms, one of (Go|Java|Python|Rust), Linux fundamentals, Git, eager to learn',
      created_by: hr3,
      company_name: 'Hexa Cloud',
      company_description: 'A bootstrapped infra-as-a-service startup. ~30 engineers, deeply technical culture, great mentorship.',
      company_logo_url: '',
      location: 'Hyderabad, India',
      job_type: 'Internship',
      salary_min: 80000, salary_max: 100000, salary_currency: 'INR',
      experience_min: 0, experience_max: 1,
      num_openings: 4, application_deadline: '2026-05-15',
      tags: 'Hot',
    },
    {
      title: 'DevOps Engineer',
      description: 'Run our multi-region Kubernetes platform serving 200+ microservices. You\'ll harden CI/CD, drive cost optimization, and own the on-call rotation. We\'re investing heavily in platform reliability and developer productivity.',
      requirements: 'Kubernetes, Terraform, AWS or GCP, Prometheus/Grafana, CI/CD, Linux, scripting (Bash/Python), 3+ years experience',
      created_by: hr3,
      company_name: 'Hexa Cloud',
      company_description: 'A bootstrapped infra-as-a-service startup. ~30 engineers, deeply technical culture, great mentorship.',
      company_logo_url: '',
      location: 'Remote (India)',
      job_type: 'Remote',
      salary_min: 2000000, salary_max: 3200000, salary_currency: 'INR',
      experience_min: 3, experience_max: 7,
      num_openings: 1, application_deadline: '2026-06-15',
      tags: 'Remote,Hot',
    },
  ];

  for (const j of DEMO_JOBS) {
    insertJob.run([
      j.title, j.description, j.requirements, j.created_by,
      j.company_name, j.company_description, j.company_logo_url,
      j.location, j.job_type,
      j.salary_min, j.salary_max, j.salary_currency,
      j.experience_min, j.experience_max,
      j.num_openings, j.application_deadline, j.tags,
    ]);
  }

  console.log(`Inserted ${DEMO_JOBS.length} demo jobs.`);
  console.log('\nSeed complete.');
  console.log('\nDemo credentials (password: password123):');
  console.log('  Candidates: candidate1@demo.com · candidate2@demo.com · candidate3@demo.com');
  console.log('  HR:         hr1@demo.com · hr2@demo.com · hr3@demo.com');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
