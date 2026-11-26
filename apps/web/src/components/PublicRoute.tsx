import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute (GuestOnlyRoute)
 * Prevents authenticated users from viewing or navigating backward into authentication screens
 * (Login, Register, Forgot Password, etc.).
 *
 * If a valid user session is active, the user is immediately redirected forward to their
 * appropriate workspace with `replace: true`, preventing browser history pollution.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, token, isAuthenticated, isLoading, authStatus } = useAuth();
  const location = useLocation();

  if (isLoading || authStatus === 'INITIALIZING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm text-xs font-semibold text-stone-600 dark:text-stone-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && token && user) {
    const from = (location.state as any)?.from?.pathname;
    let target = '/shopper';
    if (from && from !== '/login' && from !== '/register' && from !== '/admin/login') {
      target = from;
    } else if (user.role === 'MERCHANT') {
      target = '/merchant';
    } else if (user.role === 'ADMIN') {
      target = '/admin';
    }

    // Erase the public authentication route from browser history so back button cannot re-enter
    if (typeof window !== 'undefined') {
      window.history.replaceState({ cartpilotApp: true, tab: 'home' }, '', target);
    }

    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
