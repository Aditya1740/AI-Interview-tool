import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvaluation } from '../api/evaluation.api';
import { getApplication } from '../api/applications.api';
import ScoreBreakdownBar from '../components/ScoreBreakdownBar';
import ReportCard from '../components/ReportCard';
import Navbar from '../components/Navbar';

export default function ResultPage() {
  const { applicationId } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    try {
      const [evalRes, appRes] = await Promise.all([
        getEvaluation(applicationId),
        getApplication(applicationId)
      ]);
      setEvaluation(evalRes.data);
      setApplication(appRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/jobs')} className="text-indigo-600 underline">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const report = evaluation?.report;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-3xl font-bold text-slate-800">Interview Complete!</h1>
          {application && (
            <p className="text-slate-500 mt-1">
              Applied for: <span className="font-semibold text-slate-700">{application.job_title}</span>
            </p>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="mb-6">
          <ScoreBreakdownBar
            matchComponent={evaluation?.match_component}
            interviewComponent={evaluation?.interview_component}
            overallScore={evaluation?.overall_score}
          />
        </div>

        {/* Report Card */}
        {report && (
          <div className="mb-6">
            <ReportCard report={report} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/jobs')}
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Browse More Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
