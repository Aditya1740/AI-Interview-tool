import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs } from '../api/jobs.api';
import Navbar from '../components/Navbar';

export default function HRDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      navigate('/hr');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getJobs();
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-slate-500 mt-1 capitalize">{user?.role} Dashboard</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-3xl font-bold text-indigo-600 mb-1">{jobs.length}</div>
                <div className="text-slate-600 text-sm font-medium">Active Job Postings</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-3xl font-bold text-emerald-600 mb-1">{totalApplications}</div>
                <div className="text-slate-600 text-sm font-medium">Total Applications</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {jobs.length > 0 ? Math.round(totalApplications / jobs.length) : 0}
                </div>
                <div className="text-slate-600 text-sm font-medium">Avg. Applications per Job</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link
                to="/hr/jobs"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors"
              >
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center text-2xl">💼</div>
                <div>
                  <div className="font-bold text-lg">Manage Jobs</div>
                  <div className="text-indigo-200 text-sm">Create, edit, and manage job postings</div>
                </div>
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">📊</div>
                  <div>
                    <div className="font-bold text-lg">Admin Panel</div>
                    <div className="text-slate-300 text-sm">Platform analytics and overview</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Active Job Postings</h2>
                <Link to="/hr/jobs" className="text-indigo-600 text-sm hover:underline">View all</Link>
              </div>
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No jobs yet. Create your first job posting.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-800">{job.title}</p>
                        <p className="text-sm text-slate-500">{job.application_count || 0} applicants</p>
                      </div>
                      <Link
                        to={`/hr/jobs/${job.id}/candidates`}
                        className="text-indigo-600 text-sm hover:underline font-medium"
                      >
                        View Candidates →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
