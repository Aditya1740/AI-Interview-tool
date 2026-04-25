# InterviewAI — AI-Driven Hiring Platform

A full-stack hiring tool that **screens resumes**, **runs a 15-question AI interview**, and produces a **transparent, weighted hiring verdict** — with an Indeed-style job search for candidates and an analytics dashboard for HR.

- **Candidate side** — search jobs, upload a PDF resume, get an AI-generated 15-question interview, see your final report.
- **HR side** — post jobs (Indeed-style form with company, location, salary, etc.), review applicants with section-wise scores, and act on a clear hire/reject verdict.

---

## Tech Stack

| Layer        | Tools                                                                 |
|--------------|-----------------------------------------------------------------------|
| Frontend     | React 18 · Vite · TailwindCSS · React Router · Axios                  |
| Backend      | Node.js · Express · JWT · bcrypt · Multer (PDF upload)                |
| Database     | SQLite (via `node-sqlite3-wasm`)                                       |
| AI           | Groq (`llama-3.3-70b-versatile`) for matching, question generation, and grading |
| PDF          | `pdf-parse`                                                           |

---

## Scoring Model (How the verdict is computed)

Every candidate is scored out of **100**, broken into four weighted dimensions:

| Section          | Max | Weight | Graded by |
|------------------|----:|-------:|-----------|
| Resume Match     |  15 |    15% | AI compares resume to JD across skills, experience, projects, domain, education |
| Technical        |  50 |    50% | AI grades the 10 technical answers on conceptual depth, problem-solving, clarity |
| HR / Behavioral  |  25 |    25% | AI grades the 5 HR answers on communication, confidence, STAR structure, culture fit |
| AI Soft Signal   |  10 |    10% | AI checks consistency, tone, originality across the full transcript |
| **Total**        | **100** | **100%** | |

**Decision bands:** `Strong Hire` (≥85) · `Hire` (70–84) · `Consider` (55–69) · `Reject` (<55).
**Auto-reject rules:** `Technical < 25` or `HR < 10` forces a Reject regardless of total.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended; 20 / 22 / 24 all work)
- **A Groq API key** — free signup at https://console.groq.com/keys

That's it. No Python, no Docker, no managed DB — SQLite ships in-process.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/<your-username>/<this-repo>.git
cd <this-repo>

# 2. Install everything (root + client)
npm run install:all

# 3. Configure env
cp .env.example .env
# Open .env and paste your real Groq key into GROQ_API_KEY.
# Set JWT_SECRET to any long random string.

# 4. Seed the database (creates demo users + 6 demo jobs)
npm run seed

# 5. Run the dev servers (backend + frontend together)
npm run dev
```

Then open **http://localhost:3000**.

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:5000  |

The frontend proxies `/api/*` to the backend automatically — only the frontend URL is for humans.

---

## Demo Accounts (all use password `password123`)

**Candidates** (login at `/`):

| Email                   | Name          |
|-------------------------|---------------|
| candidate1@demo.com     | Aarav Mehta   |
| candidate2@demo.com     | Priya Sharma  |
| candidate3@demo.com     | Rohan Iyer    |

**HR** (login at `/hr`):

| Email               | Name           |
|---------------------|----------------|
| hr1@demo.com        | Neha Kapoor    |
| hr2@demo.com        | Vikram Joshi   |
| hr3@demo.com        | Ananya Desai   |

The seed also creates 6 demo jobs across 3 companies (Lumen Pay, Trellis Media, Hexa Cloud) covering Backend, Frontend, Data Science, PM, Internship, and DevOps roles.

> Re-running `npm run seed` is **destructive**: it wipes all jobs, applications, interviews, and evaluations, then recreates the demo set. Useful when you want a clean slate for testing.

---

## Walkthrough

### Candidate flow
1. Sign up / log in at `/`.
2. **Browse jobs** at `/jobs` — Indeed-style search with What/Where, filters (job type, salary, experience, company), sort, and a sticky detail panel.
3. Click **Apply** → upload a **text-searchable PDF** resume. AI matches it to the JD and shows a match score.
4. **Take the interview** at `/interview/:applicationId` — 15 questions (10 technical + 5 HR), graded one-by-one against a per-question rubric.
5. **Generate the final report** at the end → land on `/result/:applicationId` with the full breakdown.
6. Review past applications anytime at `/my-applications`.

> ⚠️ The PDF must be **text-searchable** (export from Word/Google Docs, not a scan or image-export). If you upload an image-based PDF, the app tells you exactly what to fix.

### HR flow
1. Log in at `/hr`.
2. **Post jobs** at `/hr/jobs` — sectioned form (Basics · Compensation · Description · Schedule) with a live preview card.
3. **Review applicants** at `/hr/jobs/:jobId/candidates` — analytics table with per-section progress bars, score legend, threshold filter, name search, and sortable columns.
4. **Drill into a candidate** at `/hr/candidates/:applicationId` for the full report.

---

## Project Structure

```
.
├── server/
│   ├── index.js                  # Express entry
│   ├── db/
│   │   ├── database.js           # SQLite init + migrations
│   │   ├── schema.sql            # Initial schema (incl. Indeed-style job fields)
│   │   ├── migrations.js         # Idempotent ALTER TABLE migrations
│   │   └── seed.js               # Destructive reset + demo data
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT auth & role guards
│   ├── prompts/
│   │   └── prompts.js            # All Groq prompts (matching, questions, grading, final eval)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── jobs.routes.js        # CRUD + search (q, location, jobType, salary, experience)
│   │   ├── applications.routes.js  # Apply, my apps, HR analytics view
│   │   ├── interview.routes.js   # Start interview, submit answer
│   │   └── evaluation.routes.js  # Generate final report
│   ├── services/
│   │   ├── resume.service.js     # PDF text extraction
│   │   ├── matching.service.js   # Resume-JD matching via Groq
│   │   ├── interview.service.js  # Question gen + per-answer grading
│   │   └── evaluation.service.js # Final 15+50+25+10=100 scoring & decision rules
│   └── uploads/                  # Runtime: candidate-uploaded resumes (gitignored)
├── client/
│   ├── src/
│   │   ├── App.jsx               # Router
│   │   ├── components/
│   │   │   ├── Logo.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ReportCard.jsx
│   │   │   └── ScoreBreakdownBar.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── api/                  # Thin axios wrappers
│   │   └── pages/
│   │       ├── LandingPage.jsx        # Candidate sign-in / register
│   │       ├── JobListings.jsx        # Indeed-style search
│   │       ├── ApplyPage.jsx          # Resume upload & match
│   │       ├── InterviewPage.jsx      # 15-question flow
│   │       ├── ResultPage.jsx         # Final report
│   │       ├── MyApplications.jsx     # Candidate history
│   │       ├── HRLogin.jsx
│   │       ├── HRDashboard.jsx
│   │       ├── JobManagement.jsx      # Post / edit jobs (sectioned form + preview)
│   │       ├── CandidatesList.jsx     # HR analytics table
│   │       └── CandidateDetail.jsx
│   └── tailwind.config.js
├── package.json                   # Root scripts (`dev`, `seed`, `install:all`)
└── .env.example
```

---

## Available Scripts (from project root)

| Script               | What it does                                                   |
|----------------------|----------------------------------------------------------------|
| `npm run install:all` | Installs root + client dependencies                           |
| `npm run dev`         | Starts backend (`:5000`) and frontend (`:3000`) concurrently  |
| `npm run server`      | Runs only the backend (with nodemon auto-reload)              |
| `npm run client`      | Runs only the Vite dev server                                 |
| `npm run seed`        | **Destructive** reset + reseed of demo accounts and jobs      |

---

## Environment Variables

Defined in `.env` (see `.env.example`):

| Var              | Required | Notes                                                 |
|------------------|:-------:|-------------------------------------------------------|
| `GROQ_API_KEY`   | ✅      | From https://console.groq.com/keys                    |
| `JWT_SECRET`     | ✅      | Any long random string — used to sign JWTs           |
| `PORT`           |         | Backend port (default `5000`)                         |
| `NODE_ENV`       |         | Set to `production` for stricter rate-limiting       |

`.env` and `server/uploads/` and `server/db/*.db` are all gitignored — your secrets and runtime data stay local.

---

## Troubleshooting

**`npm: command not found`** — Node.js isn't on your PATH. Install from https://nodejs.org/ (LTS), close all terminals, and reopen.

**`SQLite3Error: database is locked` on backend boot** — A previous Node process is still holding the DB. Stop it (`taskkill /IM node.exe /F` on Windows, `pkill node` elsewhere), delete `server/db/interview_platform.db.lock` if it exists, then `npm run dev` again.

**`Could not extract sufficient text from the PDF`** — Your resume PDF is image-based (often the case after running it through scanners or `iLovePDF`). Re-export directly from Word/Google Docs/your resume builder so the PDF has a text layer. Verify by trying to highlight + copy text in any PDF reader.

**`Invalid API Key` from Groq** — The key in `.env` is wrong, expired, or rotated. Get a fresh one at https://console.groq.com/keys, paste it into `.env`, then **restart** the backend (nodemon does *not* reload `.env` changes automatically).

**`Too many requests, please try again later`** — Hit the rate limiter. In dev it's 1000 req/min so this only fires under unusual load — restart the backend to reset the counter.

---

## Notes on Production Deployment

- The default rate limit ramps down to **100 req per 15 min** when `NODE_ENV=production`. Adjust as needed for your traffic.
- SQLite is convenient for dev / single-node demos. For production, swap `node-sqlite3-wasm` for Postgres or your DB of choice — the schema is in `server/db/schema.sql` and uses standard SQL.
- The Groq API key sits in environment variables; **never** commit `.env`.

---

## License

MIT — see `LICENSE` if present, otherwise feel free to use as a learning / demo base.
