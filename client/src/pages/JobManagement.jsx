import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs, createJob, updateJob, deleteJob } from '../api/jobs.api';
import Navbar from '../components/Navbar';

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
const CATEGORIES = ['Technical', 'HR'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const emptyQuestion = () => ({ question: '', category: 'Technical', difficulty: 'medium', ideal_points: [] });

const emptyForm = {
  title: '', description: '', requirements: '',
  company_name: '', company_description: '', company_logo_url: '',
  location: '', job_type: 'Full-time',
  salary_min: '', salary_max: '', salary_currency: 'INR',
  experience_min: '', experience_max: '',
  num_openings: 1, application_deadline: '',
  tags: '',
  custom_questions: [],
};

function fmtSalary(min, max, ccy = 'INR') {
  if (!min && !max) return null;
  const lakh = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString());
  if (min && max) return `${ccy} ${lakh(min)} – ${lakh(max)}`;
  return `${ccy} ${lakh(min || max)}+`;
}

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      navigate('/hr');
      return;
    }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditJob(null); setForm(emptyForm); setShowForm(true); setError(''); };

  const openEdit = (job) => {
    setEditJob(job);
    let customQuestions = [];
    if (job.interview_config) {
      try { customQuestions = JSON.parse(job.interview_config).custom_questions || []; } catch {}
    }
    setForm({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      company_name: job.company_name || '',
      company_description: job.company_description || '',
      company_logo_url: job.company_logo_url || '',
      location: job.location || '',
      job_type: job.job_type || 'Full-time',
      salary_min: job.salary_min ?? '',
      salary_max: job.salary_max ?? '',
      salary_currency: job.salary_currency || 'INR',
      experience_min: job.experience_min ?? '',
      experience_max: job.experience_max ?? '',
      num_openings: job.num_openings ?? 1,
      application_deadline: job.application_deadline || '',
      tags: job.tags || '',
      custom_questions: customQuestions,
    });
    setShowForm(true); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const { custom_questions, ...rest } = form;
      const payload = {
        ...rest,
        salary_min: form.salary_min === '' ? null : Number(form.salary_min),
        salary_max: form.salary_max === '' ? null : Number(form.salary_max),
        experience_min: form.experience_min === '' ? null : Number(form.experience_min),
        experience_max: form.experience_max === '' ? null : Number(form.experience_max),
        num_openings: Number(form.num_openings) || 1,
        interview_config: JSON.stringify({ custom_questions: custom_questions || [] }),
      };
      if (editJob) await updateJob(editJob.id, payload);
      else await createJob(payload);
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Deactivate this job posting? It will no longer appear to candidates.')) return;
    try { await deleteJob(jobId); fetchJobs(); } catch { setError('Failed to deactivate job'); }
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Custom question helpers
  const addQuestion = () =>
    setForm((f) => ({ ...f, custom_questions: [...f.custom_questions, emptyQuestion()] }));

  const removeQuestion = (i) =>
    setForm((f) => ({ ...f, custom_questions: f.custom_questions.filter((_, idx) => idx !== i) }));

  const updateQuestion = (i, field, val) =>
    setForm((f) => {
      const qs = [...f.custom_questions];
      qs[i] = { ...qs[i], [field]: val };
      return { ...f, custom_questions: qs };
    });

  const addPoint = (i) =>
    setForm((f) => {
      const qs = [...f.custom_questions];
      qs[i] = { ...qs[i], ideal_points: [...(qs[i].ideal_points || []), ''] };
      return { ...f, custom_questions: qs };
    });

  const removePoint = (i, pi) =>
    setForm((f) => {
      const qs = [...f.custom_questions];
      qs[i] = { ...qs[i], ideal_points: qs[i].ideal_points.filter((_, idx) => idx !== pi) };
      return { ...f, custom_questions: qs };
    });

  const updatePoint = (i, pi, val) =>
    setForm((f) => {
      const qs = [...f.custom_questions];
      const pts = [...qs[i].ideal_points];
      pts[pi] = val;
      qs[i] = { ...qs[i], ideal_points: pts };
      return { ...f, custom_questions: qs };
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Job Management</h1>
            <p className="text-slate-500 mt-1">Post jobs · review applicants · analyze AI scores</p>
          </div>
          <button onClick={openCreate} className="btn-success">+ Post a New Job</button>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>
        )}

        {showForm && (
          <JobFormModal
            form={form}
            update={update}
            addQuestion={addQuestion}
            removeQuestion={removeQuestion}
            updateQuestion={updateQuestion}
            addPoint={addPoint}
            removePoint={removePoint}
            updatePoint={updatePoint}
            onClose={() => setShowForm(false)}
            onSubmit={handleSubmit}
            submitting={submitting}
            editing={!!editJob}
            error={error}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">💼</div>
            <p className="text-slate-500 text-lg">No job postings yet.</p>
            <button onClick={openCreate} className="btn-success mt-5">Post your first job</button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Location · Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Applicants</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{(job.description || '').slice(0, 80)}{(job.description || '').length > 80 ? '…' : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{job.company_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div>{job.location || '—'}</div>
                      <div className="text-xs text-slate-500">{job.job_type || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{fmtSalary(job.salary_min, job.salary_max, job.salary_currency) || '—'}</td>
                    <td className="px-4 py-3">
                      <Link to={`/hr/jobs/${job.id}/candidates`} className="text-brand-600 hover:underline font-medium">
                        {job.application_count || 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={job.is_active ? 'badge-success' : 'badge-neutral'}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => openEdit(job)} className="text-brand-600 hover:underline font-medium">Edit</button>
                      <span className="text-slate-300 mx-2">·</span>
                      <button onClick={() => handleDelete(job.id)} className="text-rose-600 hover:underline font-medium">Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Modal: sectioned form + live preview
// -----------------------------------------------------------------------------
function JobFormModal({ form, update, addQuestion, removeQuestion, updateQuestion, addPoint, removePoint, updatePoint, onClose, onSubmit, submitting, editing, error }) {
  const customCount = (form.custom_questions || []).length;
  const aiCount = Math.max(0, 15 - customCount);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Job' : 'Post a New Job'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details — candidates will see this exactly.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>

        <div className="grid lg:grid-cols-5 gap-0">
          {/* FORM */}
          <form onSubmit={onSubmit} className="lg:col-span-3 p-6 space-y-6">
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">{error}</div>}

            <Section title="Basics">
              <Field label="Job Title *">
                <input className="input-field" required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Senior Backend Engineer" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Company Name">
                  <input className="input-field" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="Acme Corp" />
                </Field>
                <Field label="Company Logo URL (optional)">
                  <input className="input-field" value={form.company_logo_url} onChange={(e) => update('company_logo_url', e.target.value)} placeholder="https://…/logo.png" />
                </Field>
              </div>
              <Field label="Company Description">
                <textarea className="input-field resize-none" rows={2} value={form.company_description} onChange={(e) => update('company_description', e.target.value)} placeholder="One-line about your company" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Location">
                  <input className="input-field" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Bangalore, India" />
                </Field>
                <Field label="Job Type">
                  <select className="input-field" value={form.job_type} onChange={(e) => update('job_type', e.target.value)}>
                    {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Compensation & Experience">
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Salary Min">
                  <input type="number" min="0" className="input-field" value={form.salary_min} onChange={(e) => update('salary_min', e.target.value)} placeholder="1500000" />
                </Field>
                <Field label="Salary Max">
                  <input type="number" min="0" className="input-field" value={form.salary_max} onChange={(e) => update('salary_max', e.target.value)} placeholder="2500000" />
                </Field>
                <Field label="Currency">
                  <select className="input-field" value={form.salary_currency} onChange={(e) => update('salary_currency', e.target.value)}>
                    <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option><option>SGD</option>
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Experience Min (years)">
                  <input type="number" min="0" className="input-field" value={form.experience_min} onChange={(e) => update('experience_min', e.target.value)} placeholder="2" />
                </Field>
                <Field label="Experience Max (years)">
                  <input type="number" min="0" className="input-field" value={form.experience_max} onChange={(e) => update('experience_max', e.target.value)} placeholder="6" />
                </Field>
              </div>
            </Section>

            <Section title="Description & Skills">
              <Field label="Detailed Job Description * (used by AI to generate interview questions)">
                <textarea className="input-field resize-none" rows={6} required value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the role, team, stack, and what success looks like…" />
              </Field>
              <Field label="Required Skills * (comma-separated)">
                <textarea className="input-field resize-none" rows={2} required value={form.requirements} onChange={(e) => update('requirements', e.target.value)} placeholder="React, TypeScript, REST APIs, 2+ years experience" />
              </Field>
            </Section>

            <Section title="Schedule & Tags">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Number of Openings">
                  <input type="number" min="1" className="input-field" value={form.num_openings} onChange={(e) => update('num_openings', e.target.value)} />
                </Field>
                <Field label="Application Deadline">
                  <input type="date" className="input-field" value={form.application_deadline} onChange={(e) => update('application_deadline', e.target.value)} />
                </Field>
              </div>
              <Field label="Tags (comma-separated, optional)">
                <input className="input-field" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="Urgent, Remote, Hot" />
              </Field>
            </Section>

            {/* INTERVIEW SETUP */}
            <Section title="Interview Setup">
              <p className="text-xs text-slate-500 -mt-1">
                By default, AI generates 15 questions per candidate. Add custom questions here to replace AI slots — each custom question reduces AI questions by one.
              </p>

              <div className="space-y-4">
                {(form.custom_questions || []).map((q, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Custom Question {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <Field label="Question *">
                      <textarea
                        className="input-field resize-none"
                        rows={2}
                        required
                        value={q.question}
                        onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                        placeholder="e.g. Walk me through a time you debugged a production issue under pressure."
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Category">
                        <select className="input-field" value={q.category} onChange={(e) => updateQuestion(i, 'category', e.target.value)}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Difficulty">
                        <select className="input-field" value={q.difficulty} onChange={(e) => updateQuestion(i, 'difficulty', e.target.value)}>
                          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </Field>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">Ideal Answer Points <span className="text-slate-400 font-normal">(optional — used by AI for grading)</span></span>
                        {(q.ideal_points || []).length < 5 && (
                          <button type="button" onClick={() => addPoint(i)} className="text-brand-600 hover:text-brand-800 text-xs font-medium">+ Add point</button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {(q.ideal_points || []).map((pt, pi) => (
                          <div key={pi} className="flex items-center gap-2">
                            <input
                              className="input-field flex-1 !py-1.5 text-sm"
                              value={pt}
                              onChange={(e) => updatePoint(i, pi, e.target.value)}
                              placeholder={`Point ${pi + 1}`}
                            />
                            <button type="button" onClick={() => removePoint(i, pi)} className="text-slate-400 hover:text-rose-500 text-lg leading-none">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {customCount < 15 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-brand-400 text-slate-500 hover:text-brand-600 rounded-xl py-2.5 text-sm font-medium transition-colors"
                >
                  + Add Custom Question
                </button>
              )}

              <div className="text-xs text-slate-500 text-center pt-1">
                {customCount === 0
                  ? 'All 15 questions will be AI-generated for each candidate.'
                  : customCount === 15
                    ? '15 custom questions — AI generation will be skipped.'
                    : `${customCount} custom + ${aiCount} AI = 15 total questions per candidate`}
              </div>
            </Section>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-success flex-1">
                {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Post Job'}
              </button>
            </div>
          </form>

          {/* PREVIEW */}
          <aside className="lg:col-span-2 bg-slate-50 border-l border-slate-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Live Preview</p>
            <JobPreviewCard form={form} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 pb-2 border-b border-slate-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function JobPreviewCard({ form }) {
  const salary = fmtSalary(form.salary_min, form.salary_max, form.salary_currency);
  const tags = (form.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const skills = (form.requirements || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6);

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {(form.company_name || form.title || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-900 truncate">{form.title || 'Job title'}</h4>
          <p className="text-sm text-slate-600 truncate">{form.company_name || 'Company name'}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-3">
        {form.location && <span>📍 {form.location}</span>}
        {form.job_type && <span>· {form.job_type}</span>}
        {salary && <span>· 💰 {salary}</span>}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((t, i) => (
            <span key={i} className="badge bg-amber-50 text-amber-700 border border-amber-100">{t}</span>
          ))}
        </div>
      )}
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-3">
        {form.description || 'Description will appear here…'}
      </p>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <span key={i} className="badge-neutral">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
