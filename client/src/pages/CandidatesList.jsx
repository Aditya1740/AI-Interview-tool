import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJob } from '../api/jobs.api';
import { getJobApplications } from '../api/applications.api';
import Navbar from '../components/Navbar';

const recommendationBadge = {
  'Strongly Recommend': 'bg-green-100 text-green-700',
  'Recommend': 'bg-blue-100 text-blue-700',
  'Maybe': 'bg-yellow-100 text-yellow-700',
  'Not Recommend': 'bg-red-100 text-red-700'
};

export default function CandidatesList() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        getJobApplications(jobId)
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link to="/hr/jobs" className="text-indigo-600 text-sm hover:underline">← Back to Jobs</Link>
          {job && (
            <div className="mt-2">
              <h1 className="text-3xl font-bold text-slate-800">Candidates for: {job.title}</h1>
              <p className="text-slate-500 mt-1">{applications.length} total application{applications.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👤</div>
            <p className="text-slate-500 text-lg">No candidates have applied yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Match Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Interview Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Recommendation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/hr/candidates/${app.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{app.candidate_name}</p>
                        <p className="text-xs text-slate-500">{app.candidate_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {app.match_score !== null && app.match_score !== undefined ? `${app.match_score}/100` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {app.avg_interview_score !== null && app.avg_interview_score !== undefined
                            ? `${app.avg_interview_score.toFixed(1)}/10`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          app.overall_score >= 80 ? 'text-green-600' :
                          app.overall_score >= 65 ? 'text-blue-600' :
                          app.overall_score >= 50 ? 'text-yellow-600' :
                          app.overall_score ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {app.overall_score !== null && app.overall_score !== undefined
                            ? app.overall_score.toFixed(1)
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {app.recommendation ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${recommendationBadge[app.recommendation] || 'bg-slate-100 text-slate-600'}`}>
                            {app.recommendation}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          app.interview_status === 'completed' ? 'bg-green-100 text-green-700' :
                          app.interview_status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {app.interview_status || app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/hr/candidates/${app.id}`}
                          className="text-indigo-600 text-sm hover:underline font-medium"
                        >
                          View →
                        </Link>
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
