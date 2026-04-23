import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">InterviewAI</span>
          </Link>

          <div className="flex items-center gap-6">
            {!user && (
              <>
                <Link to="/jobs" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  Jobs
                </Link>
                <Link to="/hr" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  HR Login
                </Link>
              </>
            )}

            {user && user.role === 'candidate' && (
              <>
                <Link to="/jobs" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  Browse Jobs
                </Link>
              </>
            )}

            {user && (user.role === 'hr' || user.role === 'admin') && (
              <>
                <Link to="/hr/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/hr/jobs" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  Jobs
                </Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
