# AI-Driven Automated Interview and Candidate Evaluation Platform

A full-stack web application that automates the hiring process using Claude AI. Candidates upload their resumes, get matched to job descriptions, complete AI-generated interviews, and receive objective evaluation reports.

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS + Recharts
- **Backend:** Node.js + Express
- **Database:** SQLite (via node-sqlite3-wasm)
- **AI:** Google Gemini (gemini-1.5-flash)
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **PDF Parsing:** pdf-parse

## Setup Instructions

### 1. Clone or download the project

### 2. Install dependencies

```bash
# From project root
npm install

# Install client dependencies
cd client && npm install
cd ..
```

Or use the shortcut:
```bash
npm run install:all
```

### 3. Configure environment variables

Edit the `.env` file in the project root:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
JWT_SECRET=supersecretjwtkey123456789
PORT=5000
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

### 4. Seed the database

```bash
npm run seed
```

This creates demo users and 3 job postings.

### 5. Start the application

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000) concurrently.

### 6. Open the app

Visit: **http://localhost:3000**

---

## Demo Credentials

| Role      | Email                   | Password    |
|-----------|-------------------------|-------------|
| Admin     | admin@demo.com          | password123 |
| HR        | hr1@demo.com            | password123 |
| HR        | hr2@demo.com            | password123 |
| Candidate | candidate1@demo.com     | password123 |
| Candidate | candidate2@demo.com     | password123 |

---

## How It Works

### Candidate Flow
1. Register or login at the landing page (/)
2. Browse active job listings at /jobs
3. Click "Apply Now" and upload a PDF resume
4. AI (Claude) analyzes the resume against the job description and gives a match score
5. Start the AI-generated interview (5 personalized questions)
6. Answer each question — Claude evaluates each answer in real-time
7. After all 5 answers, generate the final evaluation report
8. View the final score and recommendation at /result/:applicationId

### HR/Admin Flow
1. Login at /hr
2. Dashboard shows stats and job overview
3. Manage jobs at /hr/jobs (create, edit, deactivate)
4. View candidates per job at /hr/jobs/:jobId/candidates
5. View detailed candidate reports at /hr/candidates/:applicationId
6. Admin users also have access to platform analytics at /admin

---

## Scoring Formula

```
Interview Component  = (avg answer score / 10) × 60
Match Component      = (resume match score / 100) × 40
Final Overall Score  = Interview Component + Match Component
```

### Recommendation Thresholds
- **≥ 80:** Strongly Recommend
- **65–79:** Recommend
- **50–64:** Maybe
- **< 50:** Not Recommend

---

## Project Structure

```
Major_Project/
├── .env                        # Environment variables
├── package.json                # Root package.json
├── server/
│   ├── index.js                # Express app entry point
│   ├── db/
│   │   ├── database.js         # SQLite initialization
│   │   ├── schema.sql          # DB schema
│   │   └── seed.js             # Seed script
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT auth middleware
│   ├── prompts/
│   │   └── prompts.js          # All Claude AI prompts
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── jobs.routes.js
│   │   ├── applications.routes.js
│   │   ├── interview.routes.js
│   │   └── evaluation.routes.js
│   ├── services/
│   │   ├── resume.service.js   # PDF text extraction
│   │   ├── matching.service.js # Resume-JD matching via Claude
│   │   ├── interview.service.js# Question generation + answer evaluation
│   │   └── evaluation.service.js # Final report generation
│   └── uploads/                # Uploaded PDF resumes
└── client/
    ├── src/
    │   ├── App.jsx             # Router setup
    │   ├── main.jsx            # React entry point
    │   ├── api/                # Axios API functions
    │   ├── components/         # Reusable components
    │   ├── context/            # Auth context
    │   └── pages/              # All page components
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```
