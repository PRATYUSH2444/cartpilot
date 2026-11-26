import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SessionEndedModal: React.FC = () => {
  const { isSessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isSessionExpired) return null;

  const handleReLogin = () => {
    dismissSessionExpired();
    const isAdmin = location.pathname.startsWith('/admin');
    navigate(isAdmin ? '/admin/login' : '/login', { state: { from: location } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border border-brd rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-heading font-bold text-lg text-ink">Session Ended</h3>
          <p className="text-xs text-mut mt-1">
            Your secure session token has expired or was rotated. Your cart and server data remain intact. Please sign in again to resume shopping.
          </p>
        </div>

        <button
          onClick={handleReLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-acc/90 transition-all shadow-sm"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Continue</span>
        </button>
      </div>
    </div>
  );
};
