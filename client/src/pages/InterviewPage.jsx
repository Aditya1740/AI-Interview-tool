import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startInterview, getInterview, submitAnswer } from '../api/interview.api';
import { generateEvaluation } from '../api/evaluation.api';

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
    if (!user || user.role !== 'candidate') {
      navigate('/');
      return;
    }
    initInterview();
  }, [applicationId]);

  const initInterview = async () => {
    try {
      setLoading(true);
      // Try to get existing interview first
      let interviewData;
      try {
        const res = await getInterview(applicationId);
        interviewData = res.data;
      } catch {
        // Start new interview
        const res = await startInterview(applicationId);
        interviewData = res.data;
      }

      // If interview is pending, start it
      if (interviewData.status === 'pending') {
        const res = await startInterview(applicationId);
        interviewData = res.data;
      }

      setInterview(interviewData);

      // Find next unanswered question
      const answers = interviewData.answers || [];
      const nextIdx = answers.findIndex((a) => a === undefined || a === null);
      setCurrentIndex(nextIdx === -1 ? interviewData.questions?.length - 1 : nextIdx);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      setError('Please write an answer before submitting');
      return;
    }
    if (currentAnswer.trim().length < 20) {
      setError('Please provide a more detailed answer (at least 20 characters)');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await submitAnswer(applicationId, {
        questionIndex: currentIndex,
        answer: currentAnswer.trim()
      });

      const updatedInterview = res.data;
      setInterview(updatedInterview);
      setLastFeedback(updatedInterview.currentAnswerEvaluation);
      setCurrentAnswer('');

      if (updatedInterview.status !== 'completed') {
        // Move to next question after a brief pause
        setTimeout(() => {
          setLastFeedback(null);
          setCurrentIndex(currentIndex + 1);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setError('');
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Preparing your interview...</p>
          <p className="text-indigo-300 text-sm mt-1">AI is generating personalized questions</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || 'Interview not found'}</p>
          <button onClick={() => navigate('/jobs')} className="mt-4 text-indigo-400 underline">
            Back to Jobs
          </button>
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

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-xl font-bold">AI Interview</h1>
            <p className="text-slate-400 text-sm">Answer each question thoughtfully</p>
          </div>
          <div className="text-right">
            <div className="text-white text-2xl font-bold">{answeredCount}/{totalQuestions}</div>
            <div className="text-slate-400 text-xs">Questions Answered</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          ></div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Completed State */}
        {isCompleted ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">All Questions Answered!</h2>
            <p className="text-slate-400 mb-2">
              Average Interview Score: <span className="text-white font-bold">{interview.avg_interview_score?.toFixed(1)}/10</span>
            </p>
            <p className="text-slate-400 mb-8">
              Generate your final evaluation report to see your complete assessment.
            </p>

            {generatingReport ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-indigo-300">Generating your final report...</span>
              </div>
            ) : (
              <button
                onClick={handleGenerateReport}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Generate Final Report →
              </button>
            )}
          </div>
        ) : lastFeedback ? (
          /* Show feedback briefly */
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <div className="text-4xl mb-3">{lastFeedback.score >= 7 ? '🌟' : lastFeedback.score >= 5 ? '👍' : '📝'}</div>
            <div className="text-white text-3xl font-bold mb-1">{lastFeedback.score}/10</div>
            <div className="text-slate-400 text-sm mb-4">Answer Score</div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{lastFeedback.feedback}</p>
            <div className="text-indigo-400 text-sm animate-pulse">Loading next question...</div>
          </div>
        ) : currentQuestion ? (
          /* Question Card */
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-indigo-400 text-sm font-medium">Question {currentIndex + 1} of {totalQuestions}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                currentQuestion.category === 'Technical' ? 'bg-purple-900/50 text-purple-300' :
                currentQuestion.category === 'Behavioural' ? 'bg-blue-900/50 text-blue-300' :
                currentQuestion.category === 'Situational' ? 'bg-amber-900/50 text-amber-300' :
                'bg-green-900/50 text-green-300'
              }`}>
                {currentQuestion.category}
              </span>
            </div>

            <h2 className="text-white text-xl font-semibold leading-relaxed mb-6">
              {currentQuestion.question}
            </h2>

            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">Your Answer</label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here. Be specific and detailed..."
                rows={8}
                disabled={submitting}
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="text-right text-slate-500 text-xs mt-1">{currentAnswer.length} characters</div>
            </div>

            {submitting && (
              <div className="mb-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-indigo-300 text-sm">AI is evaluating your answer...</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitAnswer}
              disabled={submitting || !currentAnswer.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {submitting ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </div>
        ) : null}

        {/* Previously answered questions */}
        {answeredCount > 0 && !isCompleted && !lastFeedback && (
          <div className="mt-6">
            <p className="text-slate-500 text-xs text-center">
              {answeredCount} question{answeredCount > 1 ? 's' : ''} answered
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
