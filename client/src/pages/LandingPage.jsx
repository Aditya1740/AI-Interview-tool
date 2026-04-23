import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../api/auth.api';

export default function LandingPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user && user.role === 'candidate') {
    navigate('/jobs');
    return null;
  }
  if (user && (user.role === 'hr' || user.role === 'admin')) {
    navigate('/hr/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (tab === 'login') {
        res = await loginApi({ email: form.email, password: form.password });
      } else {
        res = await registerApi({ name: form.name, email: form.email, password: form.password });
      }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-800/50 border border-indigo-700/50 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-indigo-200 text-sm font-medium">Powered by Claude AI</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            AI-Driven Interview &<br />
            <span className="text-indigo-400">Candidate Evaluation</span>
          </h1>
          <p className="text-indigo-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Streamline your hiring process with AI-powered resume matching, automated interviews,
            and objective candidate scoring.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <a
              href="#candidate-section"
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              I'm a Candidate
            </a>
            <a
              href="/hr"
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold border border-white/20 transition-colors"
            >
              HR Login
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: '📄', title: 'Smart Resume Matching', desc: 'AI analyzes your resume against job requirements and scores compatibility instantly.' },
            { icon: '🎤', title: 'AI-Powered Interviews', desc: 'Personalized questions generated from your resume and the job description.' },
            { icon: '📊', title: 'Objective Evaluation', desc: 'Transparent scoring formula: 60% interview + 40% resume match.' }
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="candidate-section" className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex">
              <button
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('register'); setError(''); }}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {tab === 'login' ? 'Welcome back' : 'Join as a Candidate'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {tab === 'login' ? 'Sign in to continue your journey' : 'Start your AI-powered interview process'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {tab === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-2">
                Demo: candidate1@demo.com / password123
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
