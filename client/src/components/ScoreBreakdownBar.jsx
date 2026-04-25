import React from 'react';

/**
 * Visualizes the four-part scoring rubric (15 + 50 + 25 + 10 = 100):
 *   - Resume Match    (out of 15)  — paper qualification vs JD
 *   - Technical       (out of 50)  — depth + problem-solving + clarity
 *   - HR / Behavioral (out of 25)  — communication + STAR + culture fit
 *   - AI Soft Signal  (out of 10)  — consistency + originality + tone
 *
 * Total = sum of the four sub-scores, scored out of 100.
 */
const ROWS = [
  { key: 'resume_score',      label: 'Resume Match',     max: 15, color: 'bg-sky-500',     swatch: 'bg-sky-500',     text: 'text-sky-700',     desc: 'Skills, experience, domain & education vs the JD' },
  { key: 'technical_score',   label: 'Technical',        max: 50, color: 'bg-brand-500',   swatch: 'bg-brand-500',   text: 'text-brand-700',   desc: 'Conceptual depth, problem-solving, explanation clarity' },
  { key: 'hr_score',          label: 'HR / Behavioral',  max: 25, color: 'bg-violet-500',  swatch: 'bg-violet-500',  text: 'text-violet-700',  desc: 'Communication, confidence, STAR structure, culture fit' },
  { key: 'soft_signal_score', label: 'AI Soft Signal',   max: 10, color: 'bg-success-500', swatch: 'bg-success-500', text: 'text-success-700', desc: 'Consistency, tone, response quality, originality' },
];

const overallColor = (score) => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-success-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-rose-600';
};
const overallBand = (score) => {
  if (score >= 85) return 'Strong Hire';
  if (score >= 70) return 'Hire';
  if (score >= 55) return 'Consider';
  return 'Reject';
};

export default function ScoreBreakdownBar({ report }) {
  if (!report) return null;

  const total = report.total_score ?? report.overall_score ?? 0;
  const sub = {
    resume_score:      report.resume_score      ?? 0,
    technical_score:   report.technical_score   ?? 0,
    hr_score:          report.hr_score          ?? 0,
    soft_signal_score: report.soft_signal_score ?? 0,
  };

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-lg font-semibold text-slate-900">Score Breakdown</h3>
        <span className="text-xs text-slate-500">15 + 50 + 25 + 10 = 100</span>
      </div>
      <p className="text-xs text-slate-500 mb-6">Four weighted dimensions; each graded by AI and combined into the final score.</p>

      {/* Headline */}
      <div className="text-center mb-6 py-4 bg-slate-50 rounded-2xl">
        <div className={`text-6xl font-bold ${overallColor(total)}`}>{Number(total).toFixed(0)}</div>
        <div className="text-slate-500 text-sm mt-1">Total · out of 100</div>
        <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${overallColor(total)} bg-white border border-slate-200`}>
          {overallBand(total)}
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-4">
        {ROWS.map((row) => {
          const value = sub[row.key];
          const pct = Math.max(0, Math.min(100, (value / row.max) * 100));
          return (
            <div key={row.key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${row.swatch}`}></span>
                  <span className="text-sm font-semibold text-slate-800">{row.label}</span>
                  <span className="text-[11px] text-slate-400">/ {row.max}</span>
                </div>
                <span className={`text-sm font-bold ${row.text}`}>{value}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={`${row.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{row.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Sum */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          {sub.resume_score} <span className="text-slate-400">+</span> {sub.technical_score} <span className="text-slate-400">+</span> {sub.hr_score} <span className="text-slate-400">+</span> {sub.soft_signal_score}
        </span>
        <span className="font-semibold text-slate-900">= {Number(total).toFixed(0)} / 100</span>
      </div>

      {report.auto_reject_reason && (
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700">
          <strong>Auto-reject:</strong> {report.auto_reject_reason}. Decision rules: Technical &lt; 25 or HR &lt; 10 forces a Reject regardless of total.
        </div>
      )}
    </div>
  );
}
