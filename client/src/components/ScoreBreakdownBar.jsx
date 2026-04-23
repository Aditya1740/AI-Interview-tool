import React from 'react';

export default function ScoreBreakdownBar({ matchComponent, interviewComponent, overallScore }) {
  const safeMatch = matchComponent ?? 0;
  const safeInterview = interviewComponent ?? 0;
  const safeOverall = overallScore ?? 0;

  const matchPct = Math.min((safeMatch / 40) * 100, 100);
  const interviewPct = Math.min((safeInterview / 60) * 100, 100);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Score Breakdown</h3>

      <div className="text-center mb-8">
        <div className={`text-6xl font-bold ${getScoreColor(safeOverall)}`}>
          {safeOverall.toFixed(1)}
        </div>
        <div className="text-slate-500 text-sm mt-1">Overall Score (out of 100)</div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-slate-700">Interview Performance</span>
              <span className="text-xs text-slate-500">(60% weight)</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{safeInterview.toFixed(1)} / 60</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${interviewPct}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-700">Resume Match</span>
              <span className="text-xs text-slate-500">(40% weight)</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">{safeMatch.toFixed(1)} / 40</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${matchPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600 font-medium">Formula:</span>
          <span className="text-xs text-slate-500">
            ({safeInterview.toFixed(1)}) + ({safeMatch.toFixed(1)}) = {safeOverall.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
