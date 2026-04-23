import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs } from '../api/jobs.api';
import Navbar from '../components/Navbar';

export default function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch {
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId) => {
    if (!user) {
      setMessage('Please sign in as a candidate to apply for jobs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Open Positions</h1>
          <p className="text-slate-500 mt-1">Find your next opportunity and apply with AI-powered matching</p>
        </div>

        {message && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
            {message}{' '}
            <a href="/" className="font-semibold underline hover:no-underline">Sign in here</a>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-500">Loading jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💼</div>
            <p className="text-slate-500 text-lg">No open positions at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Hiring</span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                      {job.description.length > 200 ? job.description.substring(0, 200) + '...' : job.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requirements.split(',').slice(0, 5).map((req, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {req.trim()}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      {job.application_count || 0} applicant{job.application_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApply(job.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
