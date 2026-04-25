import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startInterview, getInterview, submitAnswer } from '../api/interview.api';
import { generateEvaluation } from '../api/evaluation.api';
import Navbar from '../components/Navbar';

const categoryStyle = (cat = '') => {
  const c = cat.toLowerCase();
  if (c.includes('technical'))   return 'bg-brand-50 text-brand-700 border-brand-100';
  if (c.includes('hr'))          return 'bg-sky-50 text-sky-700 border-sky-100';
  if (c.includes('personality')) return 'bg-violet-50 text-violet-700 border-violet-100';
  if (c.includes('pressure') || c.includes('behavior')) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (c.includes('situational')) return 'bg-amber-50 text-amber-700 border-amber-100';
  if (c.includes('problem'))     return 'bg-success-50 text-success-700 border-success-100';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function InterviewPage() {
  const { applicationId } = useParams();
  const [interview, setInterview] = useState(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [lastFeedback, setLastFeedback] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'candidate') { navigate('/'); return; }
    initInterview();
  }, [applicationId]);

  const initInterview = async () => {
    try {
      setLoading(true);
      let interviewData;
      try {
        const res = await getInterview(applicationId);
        interviewData = res.data;
      } catch {
        const res = await startInterview(applicationId);
        interviewData = res.data;
      }
      if (interviewData.status === 'pending') {
        const res = await startInterview(applicationId);
        interviewData = res.data;
      }
      setInterview(interviewData);
      const answers = interviewData.answers || [];
      const total = interviewData.questions?.length || 0;
      // Use the count of real answers as the next index. This is robust to
      // empty arrays, sparse arrays with nulls, and fully-answered arrays.
      const answered = answers.filter((a) => a !== undefined && a !== null).length;
      setCurrentIndex(Math.min(answered, Math.max(total - 1, 0)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) { setError('Please write an answer before submitting'); return; }
    if (currentAnswer.trim().length < 20) { setError('Please provide a more detailed answer (at least 20 characters)'); return; }
    setError(''); setSubmitting(true);
    try {
      const res = await submitAnswer(applicationId, { questionIndex: currentIndex, answer: currentAnswer.trim() });
      const updatedInterview = res.data;
      setInterview(updatedInterview);
      setLastFeedback(updatedInterview.currentAnswerEvaluation);
      setCurrentAnswer('');
      if (updatedInterview.status !== 'completed') {
        const answeredNow = (updatedInterview.answers || [])
          .filter((a) => a !== undefined && a !== null).length;
        const total = updatedInterview.questions?.length || 0;
        const nextIdx = Math.min(answeredNow, Math.max(total - 1, 0));
        setTimeout(() => {
          setLastFeedback(null);
          setCurrentIndex(nextIdx);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true); setError('');
    try {
      await generateEvaluation(applicationId);
      navigate(`/result/${applicationId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-800 text-lg font-semibold">Preparing your interview...</p>
          <p className="text-slate-500 text-sm mt-1">AI is generating 15 personalized questions</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 text-lg font-semibold">{error || 'Interview not found'}</p>
          <button onClick={() => navigate('/jobs')} className="btn-ghost mt-4">← Back to Jobs</button>
        </div>
      </div>
    );
  }

  const questions = interview.questions || [];
  const answers = interview.answers || [];
  const answeredCount = answers.filter((a) => a !== undefined && a !== null).length;
  const totalQuestions = questions.length;
  const isCompleted = interview.status === 'completed';
  const currentQuestion = questions[currentIndex];
  const progressPct = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-radial-brand">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Interview</h1>
            <p className="text-slate-500 text-sm">Answer each question with specifics and examples.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{answeredCount}<span className="text-slate-400 text-xl">/{totalQuestions}</span></div>
            <div className="text-slate-500 text-xs">Answered</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-8 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-success-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Completed State */}
        {isCompleted ? (
          <div className="card p-10 text-center animate-fade-up">
            <div className="w-20 h-20 bg-success-50 border-2 border-success-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-slate-900 text-2xl font-bold mb-2">All Questions Answered</h2>
            <p className="text-slate-600 mb-1">
              Average Score: <span className="text-slate-900 font-bold">{interview.avg_interview_score?.toFixed(1)}/10</span>
            </p>
            <p className="text-slate-500 mb-8 text-sm">
              Generate your final evaluation report to see the complete assessment.
            </p>

            {generatingReport ? (
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Generating your final report...</span>
              </div>
            ) : (
              <button onClick={handleGenerateReport} className="btn-success text-base !px-8 !py-4">
                Generate Final Report
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            )}
          </div>
        ) : lastFeedback ? (
          /* Per-answer feedback flash */
          <div className="card p-8 text-center animate-fade-up">
            <div className="text-5xl mb-3">{lastFeedback.score >= 7 ? '🌟' : lastFeedback.score >= 5 ? '👍' : '📝'}</div>
            <div className="text-slate-900 text-4xl font-bold mb-1">{lastFeedback.score}<span className="text-slate-400 text-2xl">/10</span></div>
            <div className="text-slate-500 text-sm mb-4">Answer Score</div>
            <p className="text-slate-700 text-sm leading-relaxed mb-4 max-w-xl mx-auto">{lastFeedback.feedback}</p>
            <div className="text-brand-600 text-sm animate-pulse">Loading next question...</div>
          </div>
        ) : currentQuestion ? (
          /* Question Card */
          <div className="card p-7 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 text-sm font-medium">
                Question <span className="text-slate-900 font-bold">{currentIndex + 1}</span> of {totalQuestions}
              </span>
              <span className={`badge border ${categoryStyle(currentQuestion.category)}`}>
                {currentQuestion.category}
              </span>
            </div>

            <h2 className="text-slate-900 text-xl font-semibold leading-relaxed mb-6">
              {currentQuestion.question}
            </h2>

            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-medium mb-2">Your Answer</label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Be specific. Use examples, numbers, and concrete outcomes..."
                rows={8}
                disabled={submitting}
                className="input-field resize-none"
              />
              <div className="text-right text-slate-400 text-xs mt-1">{currentAnswer.length} characters</div>
            </div>

            {submitting && (
              <div className="mb-4 bg-brand-50 border border-brand-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-brand-700 text-sm font-medium">AI is evaluating your answer...</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={submitting || !currentAnswer.trim()}
              className="btn-success w-full !py-3"
            >
              {submitting ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        ) : null}

        {answeredCount > 0 && !isCompleted && !lastFeedback && (
          <p className="text-slate-400 text-xs text-center mt-6">
            {answeredCount} question{answeredCount > 1 ? 's' : ''} answered · {totalQuestions - answeredCount} remaining
          </p>
        )}
      </div>
    </div>
  );
}
