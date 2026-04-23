import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApplication } from '../api/applications.api';
import ScoreBreakdownBar from '../components/ScoreBreakdownBar';
import ReportCard from '../components/ReportCard';
import QuestionCard from '../components/QuestionCard';
import Navbar from '../components/Navbar';

export default function CandidateDetail() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'hr' && user.role !== 'admin')) {
      navigate('/hr');
      return;
    }
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const res = await getApplication(applicationId);
      setApplication(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load candidate detail');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Application not found'}</p>
          <button onClick={() => navigate(-1)} className="text-indigo-600 underline">Go back</button>
        </div>
      </div>
    );
  }

  const matchDetails = application.match_details || {};
  const questions = application.questions || [];
  const answers = application.answers || [];
  const answerScores = application.answer_scores || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm hover:underline">← Back</button>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{application.candidate_name}</h1>
              <p className="text-slate-500">{application.candidate_email}</p>
              <p className="text-slate-600 mt-1">
                Applied for: <span className="font-semibold">{application.job_title}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Resume Match Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Resume Match Analysis</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className={`text-5xl font-bold ${
                (application.match_score || 0) >= 70 ? 'text-green-600' :
                (application.match_score || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {application.match_score || 0}
              </div>
              <div className="text-slate-500 text-sm">/ 100</div>
            </div>
            {matchDetails.summary && (
              <p className="text-slate-600 text-sm leading-relaxed flex-1 bg-slate-50 rounded-lg p-3">
                {matchDetails.summary}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {matchDetails.matched_skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchDetails.matched_skills.map((skill, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {matchDetails.missing_skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchDetails.missing_skills.map((skill, i) => (
                    <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(matchDetails.experience_relevance || matchDetails.education_fit) && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
              {matchDetails.experience_relevance && (
                <div className="text-sm">
                  <span className="text-slate-500">Experience Relevance: </span>
                  <span className="font-medium text-slate-700">{matchDetails.experience_relevance}</span>
                </div>
              )}
              {matchDetails.education_fit && (
                <div className="text-sm">
                  <span className="text-slate-500">Education Fit: </span>
                  <span className="font-medium text-slate-700">{matchDetails.education_fit}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Interview Q&A */}
        {questions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Interview Q&A</h2>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <QuestionCard
                  key={i}
                  question={q}
                  answer={answers[i]}
                  score={answerScores[i]?.score}
                  feedback={answerScores[i]?.feedback}
                  questionNumber={i + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Score Breakdown */}
        {(application.overall_score !== null && application.overall_score !== undefined) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Final Score Breakdown</h2>
            <ScoreBreakdownBar
              matchComponent={application.match_component}
              interviewComponent={application.interview_component}
              overallScore={application.overall_score}
            />
          </div>
        )}

        {/* Section 4: AI Evaluation Report */}
        {application.report && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">AI Evaluation Report</h2>
            <ReportCard report={application.report} />
          </div>
        )}

        {!application.report && application.interview_status !== 'completed' && (
          <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Interview not completed yet. Final report will appear after the candidate completes the interview.</p>
          </div>
        )}
      </div>
    </div>
  );
}
