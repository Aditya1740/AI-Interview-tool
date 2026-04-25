import React from 'react';

const recommendationConfig = {
  // New rubric (15+50+25+10=100)
  'Strong Hire': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  'Hire':        { color: 'bg-green-100 text-green-800 border-green-200',       dot: 'bg-green-500' },
  'Consider':    { color: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  'Reject':      { color: 'bg-rose-100 text-rose-800 border-rose-200',          dot: 'bg-rose-500' },
  // Legacy (older saved evaluations)
  'Borderline':         { color: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  'Strongly Recommend': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  'Recommend':          { color: 'bg-green-100 text-green-800 border-green-200',       dot: 'bg-green-500' },
  'Maybe':              { color: 'bg-amber-100 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  'Not Recommend':      { color: 'bg-rose-100 text-rose-800 border-rose-200',          dot: 'bg-rose-500' }
};

export default function ReportCard({ report }) {
  if (!report) return null;

  const recConfig = recommendationConfig[report.recommendation] || recommendationConfig['Consider'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">AI Evaluation Report</h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${recConfig.color}`}>
          <div className={`w-2 h-2 rounded-full ${recConfig.dot}`}></div>
          {report.recommendation}
        </div>
      </div>

      {report.overall_summary && (
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Overall Assessment</h4>
          <p className="text-slate-700 leading-relaxed">{report.overall_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.strengths && report.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Strengths</h4>
            <ul className="space-y-2">
              {report.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.weaknesses && report.weaknesses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Areas for Improvement</h4>
            <ul className="space-y-2">
              {report.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(report.interview_performance_summary || report.resume_fit_summary) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {report.interview_performance_summary && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Interview Performance</h4>
              <p className="text-sm text-blue-800 leading-relaxed">{report.interview_performance_summary}</p>
            </div>
          )}
          {report.resume_fit_summary && (
            <div className="bg-emerald-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-emerald-700 mb-2">Resume Fit</h4>
              <p className="text-sm text-emerald-800 leading-relaxed">{report.resume_fit_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
