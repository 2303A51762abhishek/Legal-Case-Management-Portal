import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Scale } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse mb-3 shadow-lg shadow-blue-500/20">
          <Scale className="w-6 h-6 text-amber-300" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Verifying Legal Portal Session...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and preserve intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized for this specific screen
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
