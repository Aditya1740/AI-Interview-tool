import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs } from '../api/jobs.api';
import Navbar from '../components/Navbar';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

function fmtSalary(min, max, ccy = 'INR') {
  if (!min && !max) return null;
  const lakh = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString());
  if (min && max) return `${ccy} ${lakh(min)} – ${lakh(max)}`;
  return `${ccy} ${lakh(min || max)}+`;
}

function relativeDate(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobListings() {
  // search inputs (committed on submit)
  const [committedQuery, setCommittedQuery] = useState({ q: '', location: '' });
  const [whatField, setWhatField] = useState('');
  const [whereField, setWhereField] = useState('');

  // filters
  const [jobType, setJobType] = useState('');
  const [minSalary, setMinSalary] = useState(0);
  const [minExperience, setMinExperience] = useState('');
  const [company, setCompany] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchJobs(); /* initial */ }, []);
  useEffect(() => { fetchJobs(); /* on filter change */ }, [committedQuery, jobType, minSalary, minExperience, sortBy]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        ...(committedQuery.q ? { q: committedQuery.q } : {}),
        ...(committedQuery.location ? { location: committedQuery.location } : {}),
        ...(jobType ? { jobType } : {}),
        ...(minSalary > 0 ? { minSalary } : {}),
        ...(minExperience !== '' ? { minExperience } : {}),
        sortBy,
      };
      const res = await getJobs(params);
      let list = res.data;
      if (company) {
        const needle = company.toLowerCase();
        list = list.filter((j) => (j.company_name || '').toLowerCase().includes(needle));
      }
      setJobs(list);
      // keep selection if still in list, otherwise pick first
      if (list.length === 0) setSelectedJob(null);
      else if (!selectedJob || !list.find((j) => j.id === selectedJob.id)) setSelectedJob(list[0]);
    } catch {
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    setCommittedQuery({ q: whatField.trim(), location: whereField.trim() });
  };

  const handleApply = (jobId) => {
    if (!user) {
      setAuthMessage('Please sign in as a candidate to apply.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (user.role !== 'candidate') {
      setAuthMessage('Only candidates can apply to jobs.');
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Search hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5">Find your next role</h1>
          <form onSubmit={onSearch} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col sm:flex-row gap-2">
            <SearchField
              icon={<SearchIcon />}
              placeholder="Job title, skills, or company"
              value={whatField}
              onChange={setWhatField}
            />
            <div className="hidden sm:block w-px bg-slate-100"></div>
            <SearchField
              icon={<PinIcon />}
              placeholder="City, state, or remote"
              value={whereField}
              onChange={setWhereField}
            />
            <button type="submit" className="btn-primary !rounded-xl !px-7 sm:!py-3.5">Search</button>
          </form>

          {/* Filter chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-slate-500 mr-1">Filters:</span>
            <ChipSelect label="Type" value={jobType} onChange={setJobType} options={[{ v: '', l: 'Any' }, ...JOB_TYPES.map((t) => ({ v: t, l: t }))]} />
            <ChipNumber label="Min salary" value={minSalary} setValue={setMinSalary} step={100000} suffix={minSalary >= 100000 ? `${(minSalary / 100000).toFixed(0)}L+` : (minSalary || 'Any')} />
            <ChipSelect label="Experience" value={minExperience} onChange={setMinExperience} options={[
              { v: '', l: 'Any' }, { v: '0', l: '0+ yrs' }, { v: '1', l: '1+ yrs' }, { v: '3', l: '3+ yrs' }, { v: '5', l: '5+ yrs' }, { v: '8', l: '8+ yrs' },
            ]} />
            <ChipText label="Company" value={company} setValue={setCompany} />
            <div className="flex-1"></div>
            <ChipSelect label="Sort" value={sortBy} onChange={setSortBy} options={[
              { v: 'recent', l: 'Most recent' },
              { v: 'salary_high', l: 'Salary: high → low' },
              { v: 'salary_low', l: 'Salary: low → high' },
              { v: 'deadline', l: 'Deadline: soonest' },
            ]} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {authMessage && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            {authMessage}{' '}
            <a href="/" className="font-semibold underline hover:no-underline">Sign in here</a>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        <p className="text-sm text-slate-500 mb-3">
          {loading ? 'Searching…' : `${jobs.length} job${jobs.length === 1 ? '' : 's'} found`}
        </p>

        <div className="grid lg:grid-cols-5 gap-5 items-start">
          {/* List */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <Skeletons />
            ) : jobs.length === 0 ? (
              <EmptyState />
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  onSelect={() => setSelectedJob(job)}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 lg:sticky lg:top-20">
            {selectedJob ? (
              <JobDetail job={selectedJob} onApply={() => handleApply(selectedJob.id)} />
            ) : !loading && (
              <div className="card p-10 text-center text-slate-500">Select a job to see details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------
function SearchField({ icon, placeholder, value, onChange }) {
  return (
    <div className="flex-1 flex items-center gap-2 px-3 py-1">
      <div className="text-slate-400">{icon}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
      />
    </div>
  );
}

function ChipSelect({ label, value, onChange, options }) {
  return (
    <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-0.5 hover:border-slate-300 transition-colors">
      <span className="text-xs text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm font-medium text-slate-800 py-1 pr-2 focus:outline-none cursor-pointer">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function ChipNumber({ label, value, setValue, step, suffix }) {
  return (
    <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-3 pr-3 py-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <input
        type="range" min="0" max="3000000" step={step}
        value={value} onChange={(e) => setValue(Number(e.target.value))}
        className="w-24 accent-brand-600 align-middle"
      />
      <span className="text-xs font-medium text-slate-700 w-12 text-right">{suffix}</span>
    </label>
  );
}
function ChipText({ label, value, setValue }) {
  return (
    <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-0.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <input
        type="text" value={value} onChange={(e) => setValue(e.target.value)}
        placeholder="Any" className="bg-transparent text-sm font-medium text-slate-800 py-1 w-28 focus:outline-none"
      />
    </label>
  );
}

function JobCard({ job, selected, onSelect }) {
  const salary = fmtSalary(job.salary_min, job.salary_max, job.salary_currency);
  const tags = (job.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const initial = (job.company_name || job.title || '?').slice(0, 1).toUpperCase();

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left card p-4 transition-all ${
        selected ? 'border-brand-300 ring-2 ring-brand-100' : 'hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {job.company_logo_url ? (
          <img src={job.company_logo_url} alt="" className="w-11 h-11 rounded-lg object-cover bg-slate-100" />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center text-white font-bold flex-shrink-0">{initial}</div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
          <p className="text-sm text-slate-600 truncate">{job.company_name || 'Company'}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            {job.location && <span>📍 {job.location}</span>}
            {job.job_type && <span>· {job.job_type}</span>}
            {salary && <span>· 💰 {salary}</span>}
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((t, i) => (
                <span key={i} className="badge bg-amber-50 text-amber-700 border border-amber-100 !py-0.5">{t}</span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2">Posted {relativeDate(job.created_at)} · {job.application_count || 0} applicant{job.application_count === 1 ? '' : 's'}</p>
        </div>
      </div>
    </button>
  );
}

function JobDetail({ job, onApply }) {
  const salary = fmtSalary(job.salary_min, job.salary_max, job.salary_currency);
  const skills = (job.requirements || '').split(',').map((s) => s.trim()).filter(Boolean);
  const tags = (job.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const initial = (job.company_name || job.title || '?').slice(0, 1).toUpperCase();

  return (
    <div className="card p-6 animate-fade-up">
      <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
        {job.company_logo_url ? (
          <img src={job.company_logo_url} alt="" className="w-14 h-14 rounded-xl object-cover bg-slate-100" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{initial}</div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
          <p className="text-slate-700 font-medium">{job.company_name || 'Company'}</p>
          {job.company_description && <p className="text-sm text-slate-500 mt-1">{job.company_description}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 my-4">
        {job.location && <Chip>📍 {job.location}</Chip>}
        {job.job_type && <Chip>{job.job_type}</Chip>}
        {salary && <Chip>💰 {salary}</Chip>}
        {(job.experience_min != null || job.experience_max != null) && (
          <Chip>🎓 {job.experience_min ?? 0}–{job.experience_max ?? '∞'} yrs</Chip>
        )}
        {job.application_deadline && <Chip>⏳ Apply by {job.application_deadline}</Chip>}
        {(job.num_openings || 1) > 1 && <Chip>{job.num_openings} openings</Chip>}
        {tags.map((t, i) => (
          <span key={i} className="badge bg-amber-50 text-amber-700 border border-amber-100">{t}</span>
        ))}
      </div>

      <button onClick={onApply} className="btn-primary w-full !py-3 mb-4">Apply Now</button>

      <section className="space-y-4">
        <Block title="About the role">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
        </Block>
        {skills.length > 0 && (
          <Block title="Required skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => <span key={i} className="badge-neutral">{s}</span>)}
            </div>
          </Block>
        )}
      </section>

      <p className="text-[11px] text-slate-400 mt-5 pt-4 border-t border-slate-100">
        {job.application_count || 0} applicant{job.application_count === 1 ? '' : 's'} · Posted {relativeDate(job.created_at)}
      </p>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h4>
      {children}
    </div>
  );
}
function Chip({ children }) {
  return <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{children}</span>;
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <div className="text-5xl mb-3">🔍</div>
      <p className="text-slate-700 font-semibold">No jobs match your search.</p>
      <p className="text-slate-500 text-sm mt-1">Try clearing some filters or searching for a different role.</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-7.5 7-13A7 7 0 105 9c0 5.5 7 13 7 13z" />
    </svg>
  );
}
