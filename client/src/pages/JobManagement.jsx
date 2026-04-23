import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs, createJob, updateJob, deleteJob } from '../api/jobs.api';
import Navbar from '../components/Navbar';

const emptyForm = { title: '', description: '', requirements: '' };

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

  const handleOpenCreate = () => {
    setEditJob(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const handleOpenEdit = (job) => {
    setEditJob(job);
    setForm({ title: job.title, description: job.description, requirements: job.requirements });
    setShowForm(true);
    setError('');
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editJob) {
        await updateJob(editJob.id, form);
      } else {
        await createJob(form);
      }
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
    try {
      await deleteJob(jobId);
      fetchJobs();
    } catch {
      setError('Failed to deactivate job');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Job Management</h1>
            <p className="text-slate-500 mt-1">Create and manage job postings</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            + Create New Job
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {editJob ? 'Edit Job' : 'Create New Job'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and team..."
                    rows={5}
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
                  <textarea
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder="List required skills, technologies, and experience (comma-separated works well)"
                    rows={3}
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-lg font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm"
                  >
                    {submitting ? 'Saving...' : editJob ? 'Save Changes' : 'Create Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💼</div>
            <p className="text-slate-500 text-lg">No job postings yet.</p>
            <button onClick={handleOpenCreate} className="mt-4 text-indigo-600 underline">Create your first job</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Applicants</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{job.description.substring(0, 80)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/hr/jobs/${job.id}/candidates`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {job.application_count || 0} candidates
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        job.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="text-sm text-indigo-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-sm text-red-500 hover:underline font-medium"
                        >
                          Deactivate
                        </button>
                      </div>
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
