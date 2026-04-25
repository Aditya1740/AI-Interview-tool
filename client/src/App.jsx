import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import JobListings from './pages/JobListings';
import ApplyPage from './pages/ApplyPage';
import InterviewPage from './pages/InterviewPage';
import ResultPage from './pages/ResultPage';
import MyApplications from './pages/MyApplications';
import HRLogin from './pages/HRLogin';
import HRDashboard from './pages/HRDashboard';
import JobManagement from './pages/JobManagement';
import CandidatesList from './pages/CandidatesList';
import CandidateDetail from './pages/CandidateDetail';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/hr" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/hr/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs" element={<JobListings />} />
      <Route path="/apply/:jobId" element={<ApplyPage />} />
      <Route path="/interview/:applicationId" element={<InterviewPage />} />
      <Route path="/result/:applicationId" element={<ResultPage />} />
      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <MyApplications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr"
        element={
          user && (user.role === 'hr' || user.role === 'admin')
            ? <Navigate to="/hr/dashboard" replace />
            : <HRLogin />
        }
      />

      <Route
        path="/hr/dashboard"
        element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/jobs"
        element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <JobManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/jobs/:jobId/candidates"
        element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <CandidatesList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hr/candidates/:applicationId"
        element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <CandidateDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
