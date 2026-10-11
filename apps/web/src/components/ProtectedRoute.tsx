import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-card text-ink p-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-acc to-emerald-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-acc/20 animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-mut">
          <Loader2 className="w-4 h-4 animate-spin text-acc" />
          <span>Verifying cryptographic session...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's authorized role workspace
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/shopper" replace />;
    } else if (user.role === 'MERCHANT') {
      return <Navigate to="/merchant" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};
