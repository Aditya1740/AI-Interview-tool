import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth.api';
import Logo from '../components/Logo';

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
    <div className="min-h-screen bg-radial-brand relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-6 flex flex-col items-center">
          <Logo size={48} />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">HR Portal</h1>
          <p className="text-slate-500 mt-1 text-sm">Recruiter dashboard · candidate reviews · hiring decisions</p>
        </div>

        <div className="card p-8 animate-fade-up">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hr@company.com"
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

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-2 font-medium uppercase tracking-wide">Demo credentials</p>
            <div className="text-xs text-slate-500 space-y-1 text-center font-mono">
              <p>hr1@demo.com · password123</p>
              <p>admin@demo.com · password123</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-slate-500 hover:text-brand-600 text-sm transition-colors">
            ← Back to Candidate Portal
          </a>
        </div>
      </div>
    </div>
  );
}
