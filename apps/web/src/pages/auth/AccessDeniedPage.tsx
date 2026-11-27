import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { DEMO_CREDENTIALS } from '../../config/demo-credentials';

interface AccessDeniedPageProps {
  userRole: UserRole;
  allowedRoles: UserRole[];
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ userRole, allowedRoles }) => {
  const { logout, switchRoleQuick } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

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

  const targetRole = allowedRoles[0];
  const canQuickSwitch = Boolean(targetRole && DEMO_CREDENTIALS && DEMO_CREDENTIALS[targetRole]);

  const handleQuickSwitch = async () => {
    if (!targetRole) return;
    setIsSwitching(true);
    try {
      const ok = await switchRoleQuick(targetRole);
      if (ok) {
        navigate(getAuthorizedPath(targetRole), { replace: true });
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSignOut = async () => {
    const isAdmin = userRole === 'ADMIN' || allowedRoles.includes('ADMIN');
    await logout();
    navigate(isAdmin ? '/admin/login' : '/login', { replace: true });
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
          {canQuickSwitch && (
            <button
              onClick={handleQuickSwitch}
              disabled={isSwitching}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSwitching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Switching Account...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {targetRole ? (targetRole.charAt(0) + targetRole.slice(1).toLowerCase()) : 'User'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <button
            onClick={() => navigate(getAuthorizedPath(userRole), { replace: true })}
            className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {userRole ? (userRole.charAt(0) + userRole.slice(1).toLowerCase()) : 'Home'} Workspace</span>
          </button>

          <button
            onClick={handleSignOut}
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
