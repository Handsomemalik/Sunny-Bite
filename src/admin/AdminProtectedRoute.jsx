import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

export function AdminProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF5EB] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-3 border-secondary/20 border-t-secondary animate-spin" />
        <p className="font-label-lg text-sm text-on-surface-variant animate-pulse font-medium">
          Verifying admin security...
        </p>
      </div>
    );
  }

  // Not authenticated -> redirect to /admin/login to enter password
  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminProtectedRoute;
