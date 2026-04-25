import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../api/auth.api';
import Logo from '../components/Logo';

function FeatureIcon({ children }) {
  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-success-50 border border-brand-100 flex items-center justify-center mb-4">
      {children}
    </div>
  );
}

const FEATURES = [
  {
    title: 'Deep Resume Matching',
    desc: 'Semantic analysis across skills, projects, experience, and domain — not just keywords.',
    icon: (
      <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: '15-Question AI Interview',
    desc: 'Technical, HR, personality, and pressure rounds — graded by a rubric per question.',
    icon: (
      <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    title: 'Objective Hiring Verdict',
    desc: 'Weighted score out of 100: Resume 15 · Technical 50 · HR 25 · AI Soft 10. Auto-rejects low Technical/HR. Strong Hire · Hire · Consider · Reject.',
    icon: (
      <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user && user.role === 'candidate') { navigate('/jobs'); return null; }
  if (user && (user.role === 'hr' || user.role === 'admin')) { navigate('/hr/dashboard'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = tab === 'login'
        ? await loginApi({ email: form.email, password: form.password })
        : await registerApi({ name: form.name, email: form.email, password: form.password });
      const decoded = login(res.data.token);
      if (decoded) {
        if (decoded.role === 'candidate') navigate('/jobs');
        else navigate('/hr/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial-brand relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none"></div>

      <header className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Logo size={40} />
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 grid lg:grid-cols-2 gap-16 items-start">
        {/* LEFT — Hero */}
        <div className="animate-fade-up">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight">
            Hire smarter.<br />
            Interview <span className="bg-gradient-to-r from-brand-600 to-success-600 bg-clip-text text-transparent">objectively</span>.
          </h1>

          <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
            An AI-driven platform that screens resumes, runs 15-question interviews,
            and produces a transparent hiring verdict — in minutes, not weeks.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#auth-panel" className="btn-primary">
              Get started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="/hr" className="btn-ghost">
              HR Portal
            </a>
          </div>

          <div className="mt-14 grid sm:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card p-5">
                <FeatureIcon>{f.icon}</FeatureIcon>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Auth panel */}
        <div id="auth-panel" className="lg:sticky lg:top-24 animate-fade-up">
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-slate-100">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                    tab === t ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Create Account'}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></span>}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="mb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {tab === 'login' ? 'Welcome back' : 'Join as a candidate'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {tab === 'login' ? 'Sign in to continue your applications.' : 'Apply, interview, and get matched.'}
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {tab === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className={`w-full ${tab === 'login' ? 'btn-primary' : 'btn-success'}`}>
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Demo: <span className="font-mono text-slate-500">candidate1@demo.com</span> · <span className="font-mono text-slate-500">password123</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
