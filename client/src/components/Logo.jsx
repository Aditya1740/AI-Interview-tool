import React from 'react';

/**
 * Brand mark: a speech bubble fused with an AI spark.
 * Symbolizes "AI-powered conversation" (interview + evaluation).
 * Accepts `size` (px) and `withText` (boolean) for layout flexibility.
 */
export default function Logo({ size = 36, withText = true, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="60%"  stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Rounded container */}
        <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#logoGrad)" />
        {/* Inner speech bubble */}
        <path
          d="M11 14.5C11 12.567 12.567 11 14.5 11h11c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-5.75L15 29v-4H14.5c-1.933 0-3.5-1.567-3.5-3.5v-7z"
          fill="#ffffff"
        />
        {/* Spark / four-point star inside bubble — the "AI" signal */}
        <path
          d="M20 14.8l1.05 2.65L23.7 18.5l-2.65 1.05L20 22.2l-1.05-2.65L16.3 18.5l2.65-1.05L20 14.8z"
          fill="#4f46e5"
        />
      </svg>
      {withText && (
        <span className="font-bold text-slate-900 text-lg tracking-tight">
          Interview<span className="text-brand-600">AI</span>
        </span>
      )}
    </div>
  );
}
