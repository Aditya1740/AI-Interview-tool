import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getJob } from '../api/jobs.api';
import { applyToJob } from '../api/applications.api';
import Navbar from '../components/Navbar';

export default function ApplyPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'candidate') {
      navigate('/');
      return;
    }
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await getJob(jobId);
      setJob(res.data);
    } catch {
      setError('Job not found');
    } finally {
      setJobLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_id', jobId);

    try {
      const res = await applyToJob(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {job && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Open</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">{job.description}</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.split(',').map((req, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {req.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {!result ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Apply for this Position</h2>
            <p className="text-slate-500 text-sm mb-6">
              Upload your resume (PDF). Our AI will analyze it against the job requirements and generate your match score.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            {loading && (
              <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  <div>
                    <p className="text-indigo-800 font-medium text-sm">AI is analyzing your resume...</p>
                    <p className="text-indigo-600 text-xs mt-0.5">This may take 15-30 seconds</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resume (PDF only)</label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => document.getElementById('resume-input').click()}
                >
                  {file ? (
                    <div>
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-slate-800 font-medium">{file.name}</p>
                      <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <p className="text-indigo-600 text-xs mt-2">Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📁</div>
                      <p className="text-slate-600 font-medium">Click to upload your resume</p>
                      <p className="text-slate-400 text-sm mt-1">PDF files only, max 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="resume-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Analyzing...' : 'Submit Application'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-xl font-bold text-green-800">Application Submitted!</h2>
              <p className="text-green-700 text-sm mt-1">Your resume has been analyzed by our AI</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Match Analysis</h3>
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${getMatchColor(result.match_score)}`}>
                  {result.match_score}
                </div>
                <div className="text-slate-500 text-sm mt-1">Match Score / 100</div>
              </div>

              {result.match_details && (
                <div className="space-y-4">
                  {result.match_details.summary && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-700 leading-relaxed">{result.match_details.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {result.match_details.matched_skills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Matched Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {result.match_details.matched_skills.map((s, i) => (
                            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.match_details.missing_skills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {result.match_details.missing_skills.map((s, i) => (
                            <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/interview/${result.id}`)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Start Interview →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
