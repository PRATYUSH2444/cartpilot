import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AccessDeniedPage } from '../pages/auth/AccessDeniedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, isLoading, authStatus, isAuthenticated } = useAuth();
  const location = useLocation();

  // Save attempted URL for seamless restoration after authentication
  useEffect(() => {
    if (!isLoading && (!token || !user)) {
      try {
        sessionStorage.setItem('cartpilot_redirect', location.pathname + location.search);
      } catch {}
    }
  }, [isLoading, token, user, location]);

  // While restoring session from secure cookie, display modern cryptographic verification state
  if (isLoading || authStatus === 'INITIALIZING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-ink p-4 font-sans relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-acc/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-acc flex items-center justify-center text-white mb-5 shadow-xl shadow-emerald-600/20 animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-ink tracking-tight mb-1">
            Restoring Secure Session
          </h2>
          <p className="text-xs text-mut mb-4">
            Cryptographically validating token lifecycle & permissions...
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-brd text-xs font-medium text-mut shadow-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-acc" />
            <span>Connecting to CartPilot Gateway</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to appropriate role portal
  if (!isAuthenticated || !token || !user) {
    const isTargetingAdmin =
      location.pathname.startsWith('/admin') ||
      Boolean(allowedRoles && allowedRoles.includes('ADMIN') && !allowedRoles.includes('CUSTOMER'));
    const redirectUrl = isTargetingAdmin ? '/admin/login' : '/login';
    return <Navigate to={redirectUrl} state={{ from: location }} replace />;
  }

  // Role validation & authorization hierarchy:
  // - Platform ADMIN has super-user visibility across Shopper, Merchant & Admin workspaces.
  // - Merchant can access Merchant workspace & Shopper catalog browsing.
  // - Customer can only access Customer workspace.
  if (allowedRoles && allowedRoles.length > 0) {
    const isDirectlyAllowed = allowedRoles.includes(user.role);
    const isAdminSuperUser = user.role === 'ADMIN';
    const isMerchantViewingShopper = user.role === 'MERCHANT' && allowedRoles.includes('CUSTOMER');

    if (!isDirectlyAllowed && !isAdminSuperUser && !isMerchantViewingShopper) {
      return <AccessDeniedPage userRole={user.role} allowedRoles={allowedRoles} />;
    }
  }

  return <>{children}</>;
};
