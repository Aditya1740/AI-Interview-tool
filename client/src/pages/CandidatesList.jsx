import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJob } from '../api/jobs.api';
import { getJobApplications } from '../api/applications.api';
import Navbar from '../components/Navbar';

const recommendationBadge = {
  'Strong Hire':        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Hire':               'bg-green-100 text-green-700 border-green-200',
  'Consider':           'bg-amber-100 text-amber-700 border-amber-200',
  'Reject':             'bg-rose-100 text-rose-700 border-rose-200',
  // Legacy aliases for previously-saved evaluations
  'Borderline':         'bg-amber-100 text-amber-700 border-amber-200',
  'Strongly Recommend': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Recommend':          'bg-green-100 text-green-700 border-green-200',
  'Maybe':              'bg-amber-100 text-amber-700 border-amber-200',
  'Not Recommend':      'bg-rose-100 text-rose-700 border-rose-200',
};

// Resume score (0-15) may be missing on legacy evaluations; derive from
// match_score (0-100) when needed so the column never shows blank for completed apps.
function resumeRaw(app) {
  if (app.resume_score != null) return app.resume_score;
  if (app.match_score != null) return Math.round((app.match_score / 100) * 15);
  return null;
}

function PercentCell({ value, max, color }) {
  if (value == null) return <span className="text-xs text-slate-400">—</span>;
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span className="text-base font-bold text-slate-900">{pct}%</span>
        <span className="text-[11px] text-slate-500">({value}/{max})</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

function TotalCell({ score }) {
  if (score == null) return <span className="text-xs text-slate-400">Pending</span>;
  const v = Math.round(score);
  const color =
    v >= 85 ? 'text-emerald-600' :
    v >= 70 ? 'text-success-600' :
    v >= 55 ? 'text-amber-600' :
              'text-rose-600';
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-extrabold leading-none ${color}`}>{v}</span>
      <span className="text-[11px] text-slate-500">/ 100</span>
    </div>
  );
}

export default function CandidatesList() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('total');

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      navigate('/hr');
      return;
    }
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        getJob(jobId),
        getJobApplications(jobId, { sortBy: 'total' }),
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...applications];
    const needle = search.trim().toLowerCase();
    if (needle) {
      list = list.filter((a) =>
        (a.candidate_name || '').toLowerCase().includes(needle) ||
        (a.candidate_email || '').toLowerCase().includes(needle)
      );
    }
    if (minScore > 0) {
      list = list.filter((a) => (a.total_score ?? a.overall_score ?? 0) >= minScore);
    }
    const numCmp = (key) => (a, b) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    };
    if (sortBy === 'total')          list.sort(numCmp('total_score'));
    else if (sortBy === 'technical') list.sort(numCmp('technical_score'));
    else if (sortBy === 'hr')        list.sort(numCmp('hr_score'));
    else if (sortBy === 'match')     list.sort(numCmp('match_score'));
    else if (sortBy === 'name')      list.sort((a, b) => (a.candidate_name || '').localeCompare(b.candidate_name || ''));
    return list;
  }, [applications, search, minScore, sortBy]);

  const stats = useMemo(() => {
    const total = applications.length;
    const completed = applications.filter((a) => a.interview_status === 'completed').length;
    const hireable = applications.filter((a) => /Hire|Recommend/i.test(a.recommendation || '')).length;
    return { total, completed, hireable };
  }, [applications]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link to="/hr/jobs" className="text-brand-600 text-sm hover:underline">← Back to Jobs</Link>
          {job && (
            <div className="mt-2 flex items-end justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {job.company_name || '—'} · {job.location || '—'} · {job.job_type || '—'}
                </p>
              </div>
              <div className="flex gap-3">
                <Stat label="Applicants" value={stats.total} />
                <Stat label="Completed" value={stats.completed} />
                <Stat label="Hireable" value={stats.hireable} highlight />
              </div>
            </div>
          )}
        </div>

        {/* Scoring legend so HR understands what each column means */}
        <div className="card-flat px-4 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
          <span className="font-semibold text-slate-700 uppercase tracking-wide">Scoring (Total /100):</span>
          <LegendDot color="bg-sky-500" label="Resume" pct="15%" />
          <LegendDot color="bg-brand-500" label="Technical" pct="50%" />
          <LegendDot color="bg-violet-500" label="HR" pct="25%" />
          <LegendDot color="bg-success-500" label="AI Soft" pct="10%" />
          <span className="text-slate-400">·</span>
          <span>Auto-reject if Technical &lt; 25 or HR &lt; 10</span>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        {/* Filter bar */}
        <div className="card p-4 mb-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Search candidate</label>
            <input className="input-field" placeholder="Name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Min total score: <span className="font-bold text-slate-800">{minScore}</span></label>
            <input type="range" min="0" max="100" step="5" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Sort by</label>
            <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="total">Total score</option>
              <option value="technical">Technical</option>
              <option value="hr">HR</option>
              <option value="match">Resume</option>
              <option value="name">Name (A→Z)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">👤</div>
            <p className="text-slate-500 text-lg">
              {applications.length === 0 ? 'No candidates have applied yet.' : 'No candidates match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Candidate</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-32" title="Resume / JD match (15% weight)">Resume <span className="text-slate-400 normal-case">(/15)</span></th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-32" title="Technical interview score (50% weight)">Technical <span className="text-slate-400 normal-case">(/50)</span></th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-32" title="HR / Behavioral score (25% weight)">HR <span className="text-slate-400 normal-case">(/25)</span></th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-28" title="AI soft-signal: consistency, tone, originality (10% weight)">AI Soft <span className="text-slate-400 normal-case">(/10)</span></th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Total</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Verdict</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/hr/candidates/${app.id}`)}
                    >
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-slate-800">{app.candidate_name}</p>
                        <p className="text-xs text-slate-500">{app.candidate_email}</p>
                      </td>
                      <td className="px-3 py-3 align-top"><PercentCell value={resumeRaw(app)} max={15} color="bg-sky-500" /></td>
                      <td className="px-3 py-3 align-top"><PercentCell value={app.technical_score} max={50} color="bg-brand-500" /></td>
                      <td className="px-3 py-3 align-top"><PercentCell value={app.hr_score} max={25} color="bg-violet-500" /></td>
                      <td className="px-3 py-3 align-top"><PercentCell value={app.soft_signal_score} max={10} color="bg-success-500" /></td>
                      <td className="px-3 py-3 align-top"><TotalCell score={app.total_score ?? app.overall_score} /></td>
                      <td className="px-3 py-3 align-top">
                        {app.recommendation ? (
                          <span className={`badge border ${recommendationBadge[app.recommendation] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {app.recommendation}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className={`badge ${
                          app.interview_status === 'completed' ? 'badge-success' :
                          app.interview_status === 'in_progress' ? 'badge-warning' :
                          'badge-neutral'
                        }`}>
                          {app.interview_status || app.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/hr/candidates/${app.id}`} className="text-brand-600 text-sm hover:underline font-medium whitespace-nowrap">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`px-4 py-2 rounded-xl border ${highlight ? 'bg-success-50 border-success-100' : 'bg-white border-slate-200'}`}>
      <div className={`text-xl font-bold ${highlight ? 'text-success-700' : 'text-slate-800'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function LegendDot({ color, label, pct }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      <span className="text-slate-700 font-medium">{label}</span>
      <span className="text-slate-400">({pct})</span>
    </span>
  );
}
