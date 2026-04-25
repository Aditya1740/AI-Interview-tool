import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyApplications } from '../api/applications.api';
import Navbar from '../components/Navbar';

const recommendationBadge = {
  'Strong Hire':        'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Hire':               'bg-green-100 text-green-700 border-green-200',
  'Consider':           'bg-amber-100 text-amber-700 border-amber-200',
  'Reject':             'bg-rose-100 text-rose-700 border-rose-200',
  'Borderline':         'bg-amber-100 text-amber-700 border-amber-200',
  'Strongly Recommend': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Recommend':          'bg-green-100 text-green-700 border-green-200',
  'Maybe':              'bg-amber-100 text-amber-700 border-amber-200',
  'Not Recommend':      'bg-rose-100 text-rose-700 border-rose-200',
};

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

// What's the candidate's NEXT action for this application?
function deriveStage(app) {
  if (app.recommendation || app.total_score != null) {
    return { key: 'completed', label: 'Report ready', cta: { to: `/result/${app.id}`, text: 'View report' }, color: 'bg-success-50 text-success-700 border-success-200' };
  }
  if (app.interview_status === 'completed') {
    return { key: 'awaiting_report', label: 'Generate report', cta: { to: `/interview/${app.id}`, text: 'Open interview' }, color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (app.interview_status === 'in_progress') {
    return { key: 'in_progress', label: 'Continue interview', cta: { to: `/interview/${app.id}`, text: 'Continue' }, color: 'bg-brand-50 text-brand-700 border-brand-200' };
  }
  return { key: 'applied', label: 'Start interview', cta: { to: `/interview/${app.id}`, text: 'Start' }, color: 'bg-sky-50 text-sky-700 border-sky-200' };
}

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all'); // all | applied | in_progress | awaiting_report | completed
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.role !== 'candidate') { navigate('/hr/dashboard'); return; }
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await getMyApplications();
      setApps(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = apps.map((a) => ({ ...a, _stage: deriveStage(a) }));
    const needle = search.trim().toLowerCase();
    if (needle) {
      list = list.filter((a) =>
        (a.job_title || '').toLowerCase().includes(needle) ||
        (a.company_name || '').toLowerCase().includes(needle) ||
        (a.location || '').toLowerCase().includes(needle)
      );
    }
    if (stageFilter !== 'all') list = list.filter((a) => a._stage.key === stageFilter);
    return list;
  }, [apps, search, stageFilter]);

  const stats = useMemo(() => {
    const total = apps.length;
    const inProgress = apps.filter((a) => a.interview_status === 'in_progress').length;
    const completed = apps.filter((a) => a.recommendation || a.total_score != null).length;
    return { total, inProgress, completed };
  }, [apps]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
            <p className="text-slate-500 mt-1 text-sm">Track every job you've applied to and pick up where you left off.</p>
          </div>
          <Link to="/jobs" className="btn-primary !px-4 !py-2.5">+ Find more jobs</Link>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat label="Total applications" value={stats.total} />
          <Stat label="In progress" value={stats.inProgress} accent="brand" />
          <Stat label="Completed" value={stats.completed} accent="success" />
          <Stat label="Awaiting action" value={apps.filter((a) => deriveStage(a).key !== 'completed').length} accent="amber" />
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        {/* Filter bar */}
        <div className="card p-3 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <input className="input-field" placeholder="Search by job, company, or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1 text-sm">
            <FilterPill active={stageFilter === 'all'} onClick={() => setStageFilter('all')}>All</FilterPill>
            <FilterPill active={stageFilter === 'applied'} onClick={() => setStageFilter('applied')}>Applied</FilterPill>
            <FilterPill active={stageFilter === 'in_progress'} onClick={() => setStageFilter('in_progress')}>In progress</FilterPill>
            <FilterPill active={stageFilter === 'awaiting_report'} onClick={() => setStageFilter('awaiting_report')}>Generate report</FilterPill>
            <FilterPill active={stageFilter === 'completed'} onClick={() => setStageFilter('completed')}>Completed</FilterPill>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState totalApps={apps.length} />
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------
function ApplicationCard({ app }) {
  const initial = (app.company_name || app.job_title || '?').slice(0, 1).toUpperCase();
  const salary = fmtSalary(app.salary_min, app.salary_max, app.salary_currency);
  const stage = app._stage;
  const total = app.total_score ?? app.overall_score ?? null;

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        {app.company_logo_url ? (
          <img src={app.company_logo_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center text-white font-bold flex-shrink-0">{initial}</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{app.job_title}</h3>
              <p className="text-sm text-slate-600 truncate">{app.company_name || '—'}</p>
            </div>
            <span className={`badge border ${stage.color} whitespace-nowrap`}>{stage.label}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {app.location && <span>📍 {app.location}</span>}
            {app.job_type && <span>· {app.job_type}</span>}
            {salary && <span>· 💰 {salary}</span>}
            <span>· Applied {relativeDate(app.created_at)}</span>
          </div>

          {/* Score row — only when scoring info exists */}
          {(app.match_score != null || total != null) && (
            <div className="mt-3 grid sm:grid-cols-5 gap-3 bg-slate-50 rounded-xl p-3">
              <Mini label="Resume" pct={app.match_score} display={app.match_score != null ? `${app.match_score}%` : '—'} color="bg-sky-500" />
              <Mini label="Technical" pct={pctOf(app.technical_score, 50)} display={fmtRaw(app.technical_score, 50)} color="bg-brand-500" />
              <Mini label="HR" pct={pctOf(app.hr_score, 25)} display={fmtRaw(app.hr_score, 25)} color="bg-violet-500" />
              <Mini label="AI Soft" pct={pctOf(app.soft_signal_score, 10)} display={fmtRaw(app.soft_signal_score, 10)} color="bg-success-500" />
              <Mini label="Total" pct={total} display={total != null ? `${Math.round(total)} / 100` : '—'} color="bg-slate-700" emphasized />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {app.recommendation ? (
              <span className={`badge border ${recommendationBadge[app.recommendation] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                Verdict: {app.recommendation}
              </span>
            ) : <span></span>}
            <Link to={stage.cta.to} className={stage.key === 'completed' ? 'btn-success !px-4 !py-2 text-sm' : 'btn-primary !px-4 !py-2 text-sm'}>
              {stage.cta.text} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function pctOf(v, max) {
  if (v == null) return null;
  return Math.round((v / max) * 100);
}
function fmtRaw(v, max) {
  if (v == null) return '—';
  const pct = Math.round((v / max) * 100);
  return `${pct}% (${v}/${max})`;
}

function Mini({ label, pct, display, color, emphasized }) {
  const has = pct != null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</div>
      <div className={`${emphasized ? 'text-slate-900 font-bold text-sm' : 'text-slate-800 text-xs font-semibold'}`}>{display}</div>
      <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
        <div className={`${color} h-1 rounded-full`} style={{ width: `${has ? Math.max(0, Math.min(100, pct)) : 0}%` }}></div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full font-medium border transition-colors ${
        active
          ? 'bg-brand-50 text-brand-700 border-brand-200'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, accent }) {
  const ring =
    accent === 'brand'   ? 'border-brand-100 bg-brand-50' :
    accent === 'success' ? 'border-success-100 bg-success-50' :
    accent === 'amber'   ? 'border-amber-100 bg-amber-50' :
                            'border-slate-200 bg-white';
  const text =
    accent === 'brand'   ? 'text-brand-700' :
    accent === 'success' ? 'text-success-700' :
    accent === 'amber'   ? 'text-amber-700' :
                            'text-slate-800';
  return (
    <div className={`px-4 py-3 rounded-xl border ${ring}`}>
      <div className={`text-2xl font-bold ${text}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState({ totalApps }) {
  return (
    <div className="card p-16 text-center">
      <div className="text-5xl mb-3">📭</div>
      <p className="text-slate-700 font-semibold">
        {totalApps === 0 ? "You haven't applied to any jobs yet." : 'No applications match the current filter.'}
      </p>
      <p className="text-slate-500 text-sm mt-1">Browse open positions and apply to get started.</p>
      <Link to="/jobs" className="btn-primary mt-5 !px-6">Browse Jobs</Link>
    </div>
  );
}
