import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (to) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return `relative text-sm font-medium transition-colors ${
      active ? 'text-brand-600' : 'text-slate-600 hover:text-slate-900'
    }`;
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <div className="flex items-center gap-7">
            {!user && (
              <>
                <Link to="/jobs" className={linkClass('/jobs')}>Jobs</Link>
                <Link to="/hr" className={linkClass('/hr')}>HR Login</Link>
              </>
            )}

            {user && user.role === 'candidate' && (
              <>
                <Link to="/jobs" className={linkClass('/jobs')}>Browse Jobs</Link>
                <Link to="/my-applications" className={linkClass('/my-applications')}>My Applications</Link>
              </>
            )}

            {user && (user.role === 'hr' || user.role === 'admin') && (
              <>
                <Link to="/hr/dashboard" className={linkClass('/hr/dashboard')}>Dashboard</Link>
                <Link to="/hr/jobs" className={linkClass('/hr/jobs')}>Jobs</Link>
              </>
            )}

            {user && user.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-500 capitalize leading-tight">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-slate-500 hover:text-brand-600 text-sm font-medium transition-colors"
                  title="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/" className="btn-primary !px-4 !py-2 text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
