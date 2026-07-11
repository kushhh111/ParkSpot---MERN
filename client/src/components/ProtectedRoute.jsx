import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Route protection wrapper component.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Route target component
 * @param {Array<string>} [props.allowedRoles] - Role limits (driver, owner, admin)
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          {/* Custom Bouncing Dot / Spinner Loader with purple theme */}
          <div className="relative flex h-16 w-16">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-16 w-16 bg-violet-600"></span>
          </div>
          <p className="text-slate-400 font-semibold tracking-wide animate-pulse">
            Loading ParkSpot...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in: Redirect to login page and save previous route path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role not allowed: Redirect to appropriate role dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'owner') {
      return <Navigate to="/dashboard/owner" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else {
      return <Navigate to="/dashboard/driver" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
