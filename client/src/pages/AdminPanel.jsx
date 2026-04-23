import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJobs } from '../api/jobs.api';
import { getJobApplications } from '../api/applications.api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import Navbar from '../components/Navbar';

export default function AdminPanel() {
  const [jobs, setJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/hr/dashboard');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const jobsRes = await getJobs();
      const jobs = jobsRes.data;
      setJobs(jobs);

      // Fetch applications for all jobs
      const appPromises = jobs.map((j) => getJobApplications(j.id).catch(() => ({ data: [] })));
      const appResults = await Promise.all(appPromises);
      const combined = appResults.flatMap((r) => r.data || []);
      setAllApplications(combined);
    } catch (err) {
      console.error('Admin fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const totalUsers = new Set(allApplications.map((a) => a.user_id || a.candidate_email)).size;
  const totalApplications = allApplications.length;
  const scoresWithValues = allApplications.filter(
    (a) => a.overall_score !== null && a.overall_score !== undefined
  );
  const avgFinalScore =
    scoresWithValues.length > 0
      ? (scoresWithValues.reduce((sum, a) => sum + a.overall_score, 0) / scoresWithValues.length).toFixed(1)
      : 'N/A';

  // Chart data: apps per job
  const appsPerJobData = jobs.map((j) => ({
    name: j.title.length > 15 ? j.title.substring(0, 15) + '...' : j.title,
    fullName: j.title,
    applications: j.application_count || 0
  }));

  // Chart data: avg final score per job
  const avgScorePerJobData = jobs.map((j) => {
    const jobApps = allApplications.filter(
      (a) => a.job_id === j.id && a.overall_score !== null && a.overall_score !== undefined
    );
    const avg = jobApps.length > 0
      ? parseFloat((jobApps.reduce((sum, a) => sum + a.overall_score, 0) / jobApps.length).toFixed(1))
      : 0;
    return {
      name: j.title.length > 15 ? j.title.substring(0, 15) + '...' : j.title,
      fullName: j.title,
      avgScore: avg
    };
  });

  // Top 5 candidates
  const top5 = [...allApplications]
    .filter((a) => a.overall_score !== null && a.overall_score !== undefined)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 5);

  const COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 mt-1">Platform-wide analytics and overview</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: totalUsers + 5, color: 'text-indigo-600' },
                { label: 'Active Jobs', value: jobs.length, color: 'text-emerald-600' },
                { label: 'Total Applications', value: totalApplications, color: 'text-blue-600' },
                { label: 'Avg Final Score', value: avgFinalScore, color: 'text-amber-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-slate-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Applications Per Job */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Applications per Job</h2>
                {appsPerJobData.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={appsPerJobData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val, name, props) => [val, 'Applications']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      />
                      <Bar dataKey="applications" radius={[4, 4, 0, 0]}>
                        {appsPerJobData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Avg Score Per Job */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Average Final Score per Job</h2>
                {avgScorePerJobData.every((d) => d.avgScore === 0) ? (
                  <p className="text-slate-400 text-center py-8">No evaluation data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={avgScorePerJobData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(val) => [`${val}/100`, 'Avg Score']}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      />
                      <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                        {avgScorePerJobData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top 5 Candidates */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Top 5 Candidates by Final Score</h2>
              </div>
              {top5.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No evaluated candidates yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Job</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Match Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Interview Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {top5.map((app, i) => (
                        <tr key={app.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === 0 ? 'bg-yellow-100 text-yellow-700' :
                              i === 1 ? 'bg-slate-100 text-slate-600' :
                              i === 2 ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-50 text-slate-500'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{app.candidate_name}</p>
                            <p className="text-xs text-slate-500">{app.candidate_email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{app.job_title}</td>
                          <td className="px-4 py-3 text-sm font-medium">{app.match_score}/100</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {app.avg_interview_score ? `${app.avg_interview_score.toFixed(1)}/10` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-bold text-sm ${
                              app.overall_score >= 80 ? 'text-green-600' :
                              app.overall_score >= 65 ? 'text-blue-600' :
                              app.overall_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {app.overall_score.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              app.recommendation === 'Strongly Recommend' ? 'bg-green-100 text-green-700' :
                              app.recommendation === 'Recommend' ? 'bg-blue-100 text-blue-700' :
                              app.recommendation === 'Maybe' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.recommendation}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
