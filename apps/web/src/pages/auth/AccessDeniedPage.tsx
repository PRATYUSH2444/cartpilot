import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface AccessDeniedPageProps {
  userRole: UserRole;
  allowedRoles: UserRole[];
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ userRole, allowedRoles }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const getAuthorizedPath = (role: UserRole) => {
    switch (role) {
      case 'CUSTOMER':
        return '/shopper';
      case 'MERCHANT':
        return '/merchant';
      case 'ADMIN':
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-brd rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
          403 Forbidden
        </span>

        <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight mt-2 mb-2">
          Access Denied
        </h1>

        <p className="text-xs text-mut mb-6">
          Your current session is authenticated as <strong className="text-ink font-semibold">{userRole}</strong>.
          This workspace is restricted to <strong className="text-ink font-semibold">{allowedRoles.join(', ')}</strong> roles.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(getAuthorizedPath(userRole), { replace: true })}
            className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {userRole.charAt(0) + userRole.slice(1).toLowerCase()} Workspace</span>
          </button>

          <button
            onClick={logout}
            className="w-full py-2 px-4 rounded-xl border border-brd bg-paper hover:bg-card text-xs font-semibold text-mut hover:text-ink transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
