require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
  console.log('Starting seed...');

  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@demo.com');
  if (existingAdmin) {
    console.log('Seed data already exists. Skipping.');
    process.exit(0);
  }

  const passwordHash = bcrypt.hashSync('password123', 10);

  // Insert users
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  const adminId = insertUser.run(['Admin User', 'admin@demo.com', passwordHash, 'admin']).lastInsertRowid;
  const hr1Id = insertUser.run(['HR One', 'hr1@demo.com', passwordHash, 'hr']).lastInsertRowid;
  const hr2Id = insertUser.run(['HR Two', 'hr2@demo.com', passwordHash, 'hr']).lastInsertRowid;
  insertUser.run(['Candidate One', 'candidate1@demo.com', passwordHash, 'candidate']);
  insertUser.run(['Candidate Two', 'candidate2@demo.com', passwordHash, 'candidate']);

  console.log('Users created:', { adminId, hr1Id, hr2Id });

  // Insert jobs created by hr1
  const insertJob = db.prepare(
    'INSERT INTO jobs (title, description, requirements, created_by) VALUES (?, ?, ?, ?)'
  );

  insertJob.run([
    'Software Engineer',
    'We are looking for a skilled Software Engineer to join our team. You will design, develop, and maintain web applications using modern technologies. You will collaborate with cross-functional teams to deliver high-quality software solutions.',
    'React, Node.js, REST APIs, SQL, Git, Agile methodologies, problem-solving skills, 2+ years of experience',
    hr1Id
  ]);

  insertJob.run([
    'Data Analyst',
    'We are seeking a Data Analyst to transform raw data into actionable insights. You will work with large datasets, build dashboards, and support data-driven decision making across the organization.',
    'Python, SQL, Excel, data visualization, statistics, Tableau or Power BI, analytical mindset, 1+ years of experience',
    hr1Id
  ]);

  insertJob.run([
    'Product Manager',
    'We are hiring a Product Manager to own the product roadmap and drive feature development. You will work closely with engineering, design, and business stakeholders to deliver impactful products.',
    'Roadmapping, stakeholder management, agile, market research, user stories, communication skills, 3+ years of experience',
    hr1Id
  ]);

  console.log('Jobs created.');
  console.log('Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:       admin@demo.com / password123');
  console.log('  HR 1:        hr1@demo.com / password123');
  console.log('  HR 2:        hr2@demo.com / password123');
  console.log('  Candidate 1: candidate1@demo.com / password123');
  console.log('  Candidate 2: candidate2@demo.com / password123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
