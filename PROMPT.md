I am building a college major project titled:
"AI-Driven Automated Interview and Candidate Evaluation Platform Using Resume–Job Description Matching"

This is for demonstration purposes only — no real-world deployment needed, but it must be fully runnable locally.

---

## PROJECT OVERVIEW

Build a full-stack web application where:
- Candidates upload their resume and apply for jobs
- The system matches resumes to job descriptions using AI (Claude API via Anthropic SDK)
- Candidates go through an AI-conducted text-based interview (questions generated dynamically by Claude)
- The AI evaluates candidate responses and generates a final scorecard/report
- HR recruiters can view candidates, their match scores, interview transcripts, and AI-generated evaluation reports
- An admin panel shows analytics (total candidates, average scores, job-wise breakdown)

---

## ARCHITECTURE (follow this layered structure)

### Layer 1 – Presentation
- Candidate Portal (web)
- HR Recruiter Dashboard
- Admin & Analytics Panel

### Layer 2 – API Gateway
- REST API with auth middleware (JWT-based)
- Rate limiting
- Request routing

### Layer 3 – Core Services
- Resume Parser Service: extract text from uploaded PDF resumes
- JD Matching Engine: use Claude API to compare resume vs job description and return a match score (0–100) + reasoning
- Interview Engine: Claude API generates role-specific interview questions; conducts a multi-turn text interview; evaluates responses
- Evaluation & Report Engine: Claude API produces a structured candidate report with strengths, weaknesses, overall recommendation

### Layer 4 – AI/ML Layer
- All AI calls go through Anthropic Claude API (model: claude-sonnet-4-20250514)
- Resume–JD semantic matching
- Dynamic question generation based on role + resume
- Answer quality scoring
- Final candidate evaluation report generation

### Layer 5 – Data Layer
- SQLite (use instead of PostgreSQL for simplicity — demo only)
- Simple local file storage for resumes (no S3 needed)
- In-memory or file-based session store (no Redis needed)

### Layer 6 – Infrastructure
- Run everything locally with a single command: `npm run dev` or `docker-compose up`
- No cloud deployment required

---

## TECH STACK

**Full JavaScript Stack (use this)**
- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: SQLite (via better-sqlite3)
- AI: Anthropic SDK for Node.js (@anthropic-ai/sdk)
- PDF Parsing: pdf-parse
- Auth: JWT (jsonwebtoken)
- Run both frontend and backend together using: concurrently

---

## PAGES / SCREENS TO BUILD

### Candidate Portal
1. **Landing / Login page** — Register or log in as a candidate
2. **Job Listings page** — Browse available job postings
3. **Apply page** — Upload resume (PDF), apply to a job → triggers AI resume–JD match score
4. **Interview page** — Text-based AI interview: Claude asks questions one by one, candidate types answers
5. **Result page** — After interview ends, show the final AI-generated evaluation report with score breakdown

### HR Dashboard
1. **Login page** — HR login (separate role)
2. **Job Management page** — Create/edit job postings with title, description, requirements
3. **Candidates page** — List all applicants per job with match score, interview score, final score, and status
4. **Candidate Detail page** — View full AI evaluation report, per-question scores, interview transcript, resume download

### Admin Panel
1. **Overview analytics** — Total candidates, total jobs, average scores, top candidates per role (use Recharts)

---

## AI FEATURES & PROMPTS

All prompts must live in a single file: `server/prompts/prompts.js`
Model to use for ALL Claude calls: `claude-sonnet-4-20250514`

---

### 1. Resume–JD Matching
You are a strict and thorough expert technical recruiter with 15+ years of experience evaluating candidates for competitive roles.
Your job is to compare the candidate's resume against the job description and produce an honest, detailed match assessment.
Resume Text:
{resume_text}
Job Description:
{jd_text}
Evaluate the following dimensions carefully:

Skills match — how well do the candidate's technical and soft skills align with the JD requirements?
Experience relevance — is the candidate's past experience directly applicable to this role?
Education fit — does their educational background meet the role's expectations?
Keyword alignment — how many key terms from the JD appear in the resume?
Seniority match — does the candidate's experience level match the role's expectations?

Be strict. Do not inflate scores. A score above 80 should only go to candidates who are a genuinely strong match.
Return ONLY valid JSON, no markdown, no explanation outside the JSON:
{
"match_score": number between 0 and 100,
"matched_skills": [list of skills found in both resume and JD],
"missing_skills": [list of skills in JD but absent from resume],
"experience_relevance": "High" | "Medium" | "Low",
"education_fit": "Strong" | "Adequate" | "Weak",
"summary": "2-3 sentence honest assessment of fit"
}

---

### 2. Interview Question Generation
You are a senior technical interviewer preparing a rigorous interview for the role of {job_title}.
The candidate's resume summary is:
{resume_summary}
The job requires the following key skills and responsibilities:
{jd_text}
Generate exactly 5 interview questions that:

Are specific to this role and this candidate's background
Cover a mix of: technical knowledge, problem-solving, past experience (behavioural), and situational judgment
Are progressively harder (question 1 easiest, question 5 hardest)
Cannot be answered with a simple yes/no
Would genuinely differentiate a strong candidate from an average one

Return ONLY valid JSON, no markdown:
{
"questions": [
{ "id": 1, "question": string, "category": "Technical" | "Behavioural" | "Situational" | "Problem-Solving" },
{ "id": 2, ... },
{ "id": 3, ... },
{ "id": 4, ... },
{ "id": 5, ... }
]
}

---

### 3. Per-Answer Evaluation (called after EACH answer)
You are a strict but fair senior interviewer evaluating a candidate's response during a job interview for the role of {job_title}.
Interview Question:
{question}
Candidate's Answer:
{answer}
Evaluate this answer across the following criteria:

Relevance — does the answer actually address the question asked?
Depth — does the candidate demonstrate genuine understanding, not just surface knowledge?
Clarity — is the answer well-structured and easy to follow?
Specificity — does the candidate use concrete examples, numbers, or real situations?
Role-fit — does the answer reflect the skills and mindset needed for {job_title}?

Scoring rules:

9-10: Exceptional answer. Specific, insightful, directly relevant, demonstrates strong expertise.
7-8: Good answer. Solid understanding, mostly relevant, minor gaps.
5-6: Average answer. Some relevance but vague, lacks depth or specifics.
3-4: Weak answer. Mostly off-topic, shallow, or shows limited understanding.
0-2: Poor or irrelevant answer. No useful signal.

Be strict. Reserve 9-10 only for truly outstanding responses.
Return ONLY valid JSON, no markdown:
{
"score": number between 0 and 10,
"relevance": number between 0 and 10,
"depth": number between 0 and 10,
"clarity": number between 0 and 10,
"specificity": number between 0 and 10,
"feedback": "2-3 sentence honest assessment of this specific answer"
}

---

### 4. Final Candidate Evaluation Report
You are a senior hiring manager writing the final evaluation report for a candidate who has completed the full application and interview process for the role of {job_title}.
You have the following data:
Resume–JD Match Score (out of 100): {match_score}
Resume Match Summary: {match_summary}
Matched Skills: {matched_skills}
Missing Skills: {missing_skills}
Interview Q&A with per-answer scores (out of 10):
{qa_with_scores}
IMPORTANT — Final Score Calculation (you must follow this formula exactly):

Interview Score Component = (average of all per-answer scores / 10) * 60
Resume Match Component = (match_score / 100) * 40
Final Overall Score = Interview Score Component + Resume Match Component
Round the final score to 1 decimal place
Show the breakdown clearly in your report

Using this data, write a thorough, honest, and professional evaluation. Do not inflate or deflate scores beyond what the formula dictates. Your qualitative assessment (strengths, weaknesses, recommendation) must be consistent with the scores provided.
Recommendation rules (must follow strictly):

Final score >= 80: "Strongly Recommend"
Final score 65–79: "Recommend"
Final score 50–64: "Maybe"
Final score < 50: "Not Recommend"

Return ONLY valid JSON, no markdown:
{
"overall_score": number (calculated using the formula above),
"interview_component": number (the 60% part),
"match_component": number (the 40% part),
"recommendation": "Strongly Recommend" | "Recommend" | "Maybe" | "Not Recommend",
"strengths": [at least 3 specific strengths based on the interview and resume],
"weaknesses": [at least 2 honest weaknesses or gaps],
"interview_performance_summary": "2-3 sentences on how the candidate performed in the interview",
"resume_fit_summary": "1-2 sentences on how well their background fits the role",
"overall_summary": "3-4 sentence final narrative that a recruiter can use to make a hiring decision"
}

---

## SCORING SYSTEM — IMPLEMENT EXACTLY AS FOLLOWS
match_score         = Claude's resume-JD match score (0–100)
avg_interview_score = average of all 5 per-answer scores (each out of 10)
interview_component = (avg_interview_score / 10) * 60   // max 60 points
match_component     = (match_score / 100) * 40           // max 40 points
final_score         = interview_component + match_component  // max 100 points

- Store all three values (interview_component, match_component, final_score) in the evaluations table
- Display the score breakdown visually on the Candidate Result page and HR Candidate Detail page
- Show a progress bar or gauge for the final score
- Show split bars for the two components so the recruiter can see exactly how the score was composed

---

## DATABASE SCHEMA (SQLite)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('candidate', 'hr', 'admin')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  job_id INTEGER REFERENCES jobs(id),
  resume_path TEXT,
  resume_text TEXT,
  match_score REAL,
  match_details TEXT,  -- JSON string
  status TEXT DEFAULT 'applied',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  questions TEXT,       -- JSON string
  answers TEXT,         -- JSON string
  answer_scores TEXT,   -- JSON string (per-answer scores and feedback)
  avg_interview_score REAL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES applications(id),
  match_component REAL,
  interview_component REAL,
  overall_score REAL,
  recommendation TEXT,
  report TEXT,          -- full JSON report from Claude
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## DEMO SEED DATA

Pre-seed the database with:
- 1 Admin: admin@demo.com / password123
- 2 HR users: hr1@demo.com / password123, hr2@demo.com / password123
- 2 Candidates: candidate1@demo.com / password123, candidate2@demo.com / password123
- 3 Job postings:
  - Software Engineer (focus: React, Node.js, REST APIs, SQL)
  - Data Analyst (focus: Python, SQL, Excel, data visualization, statistics)
  - Product Manager (focus: roadmapping, stakeholder management, agile, market research)

---

## FOLDER STRUCTURE
/project-root
/client
/src
/pages
LandingPage.jsx
CandidateDashboard.jsx
JobListings.jsx
ApplyPage.jsx
InterviewPage.jsx
ResultPage.jsx
HRLogin.jsx
HRDashboard.jsx
JobManagement.jsx
CandidatesList.jsx
CandidateDetail.jsx
AdminPanel.jsx
/components
ScoreBreakdownBar.jsx
ReportCard.jsx
QuestionCard.jsx
Navbar.jsx
/api
axios.js         ← base axios instance
auth.api.js
jobs.api.js
applications.api.js
interview.api.js
evaluation.api.js
/server
/routes
auth.routes.js
jobs.routes.js
applications.routes.js
interview.routes.js
evaluation.routes.js
/services
resume.service.js
matching.service.js
interview.service.js
evaluation.service.js
/prompts
prompts.js         ← ALL Claude prompts live here
/db
database.js        ← SQLite connection
schema.sql
seed.js
/uploads             ← local resume PDF storage
index.js
.env.example
.env                   ← ANTHROPIC_API_KEY goes here
README.md
package.json

---

## IMPORTANT CONSTRAINTS

1. Use `ANTHROPIC_API_KEY` from `.env` — never hardcode it
2. All Claude prompts must return valid JSON only — no markdown fences, no preamble
3. Always parse Claude responses with try/catch and return a clean error to the frontend if parsing fails
4. The app must start with one command: `npm run dev` (use `concurrently` to run client + server together)
5. Show a loading spinner on the frontend whenever a Claude API call is in progress
6. On the HR Candidate Detail page, show:
   - Resume match score + breakdown
   - Each interview question, the candidate's answer, and the per-answer score + feedback
   - The final score with visual breakdown (interview component vs match component)
   - The full AI report (strengths, weaknesses, recommendation, summary)
7. Write a clear `README.md` with: install steps, .env setup, seed command, run command

---

## BUILD ORDER

Build in this exact sequence:
1. Project scaffold + package.json + folder structure
2. SQLite schema + seed script
3. Auth routes (register, login, JWT middleware)
4. Resume upload + PDF text extraction
5. JD Matching service + route
6. Interview question generation + answer submission + per-answer scoring
7. Final evaluation report generation (with the formula)
8. All frontend pages (in the order listed above)
9. Wire everything together and test the full candidate flow end to end

Start now. Ask me before making any tech decisions not covered in this prompt.
