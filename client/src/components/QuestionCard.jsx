import React from 'react';

const categoryColors = {
  Technical: 'bg-purple-100 text-purple-700',
  Behavioural: 'bg-blue-100 text-blue-700',
  Situational: 'bg-amber-100 text-amber-700',
  'Problem-Solving': 'bg-green-100 text-green-700'
};

export default function QuestionCard({ question, answer, score, feedback, questionNumber }) {
  const categoryStyle = categoryColors[question?.category] || 'bg-slate-100 text-slate-700';

  const getScoreColor = (s) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 6) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s >= 4) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-500">Q{questionNumber}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle}`}>
            {question?.category}
          </span>
        </div>
        {score !== undefined && score !== null && (
          <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(score)}`}>
            {score}/10
          </div>
        )}
      </div>

      <p className="text-slate-800 font-medium mb-4 leading-relaxed">{question?.question}</p>

      {answer && (
        <div className="bg-slate-50 rounded-lg p-4 mb-3">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Candidate's Answer</p>
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {feedback && (
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
          <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">AI Feedback</p>
          <p className="text-indigo-800 text-sm leading-relaxed">{feedback}</p>
        </div>
      )}
    </div>
  );
}
