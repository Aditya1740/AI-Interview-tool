import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth.api';

export default function HRLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user && (user.role === 'hr' || user.role === 'admin')) {
    navigate('/hr/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi({ email: form.email, password: form.password });
      const decoded = login(res.data.token);
      if (decoded && (decoded.role === 'hr' || decoded.role === 'admin')) {
        navigate('/hr/dashboard');
      } else {
        setError('Access denied. This login is for HR and Admin users only.');
        login(null);
        localStorage.removeItem('token');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <span className="text-white font-bold text-xl">InterviewAI</span>
          </div>
          <h1 className="text-3xl font-bold text-white">HR Portal</h1>
          <p className="text-slate-400 mt-1">Sign in to access the recruiter dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hr@company.com"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-2">Demo credentials:</p>
            <div className="text-xs text-slate-500 space-y-1 text-center">
              <p>HR: hr1@demo.com / password123</p>
              <p>Admin: admin@demo.com / password123</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to Candidate Portal
          </a>
        </div>
      </div>
    </div>
  );
}
