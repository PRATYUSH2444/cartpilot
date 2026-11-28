import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  Store,
  ShieldCheck,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';

export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchRoleQuick, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState<UserRole | null>(null);

  const currentRole = user?.role || 'CUSTOMER';

  const handleRoleSelect = async (role: UserRole) => {
    if (role === currentRole && isAuthenticated) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(role);
    try {
      const ok = await switchRoleQuick(role);
      if (ok) {
        if (role === 'MERCHANT') navigate('/merchant');
        else if (role === 'ADMIN') navigate('/admin');
        else navigate('/shopper');
      }
    } catch (err) {
      console.error('Role switch failed', err);
    } finally {
      setIsSwitching(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-40 select-none">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-2.5 p-3.5 rounded-3xl bg-card border border-brd shadow-2xl space-y-2.5 w-72 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-brd">
            <span className="text-[11px] font-mono uppercase tracking-wider text-mut font-bold">
              1-Tap Role Switcher
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              Instant
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Shopper Option */}
            <button
              onClick={() => handleRoleSelect('CUSTOMER')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2.5 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'CUSTOMER' && isAuthenticated
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'hover:bg-paper text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="leading-tight">Shopper Portal</div>
                  <div className={`text-[10px] font-normal ${currentRole === 'CUSTOMER' && isAuthenticated ? 'opacity-80' : 'text-mut'}`}>
                    customer@example.com
                  </div>
                </div>
              </div>
              {isSwitching === 'CUSTOMER' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              ) : currentRole === 'CUSTOMER' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              ) : null}
            </button>

            {/* Merchant Option */}
            <button
              onClick={() => handleRoleSelect('MERCHANT')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2.5 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'MERCHANT' && isAuthenticated
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'hover:bg-paper text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="leading-tight">Merchant Hub</div>
                  <div className={`text-[10px] font-normal ${currentRole === 'MERCHANT' && isAuthenticated ? 'opacity-80' : 'text-mut'}`}>
                    merchant@freshgrocers.com
                  </div>
                </div>
              </div>
              {isSwitching === 'MERCHANT' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : currentRole === 'MERCHANT' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              ) : null}
            </button>

            {/* Admin Option */}
            <button
              onClick={() => handleRoleSelect('ADMIN')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2.5 rounded-2xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'ADMIN' && isAuthenticated
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'hover:bg-paper text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <div>
                  <div className="leading-tight">Dark-Store Admin</div>
                  <div className={`text-[10px] font-normal ${currentRole === 'ADMIN' && isAuthenticated ? 'opacity-80' : 'text-mut'}`}>
                    admin@cartpilot.com
                  </div>
                </div>
              </div>
              {isSwitching === 'ADMIN' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              ) : currentRole === 'ADMIN' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              ) : null}
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Trigger: Luxury Capsule */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-full bg-zinc-950/95 dark:bg-zinc-900/95 text-white border border-white/20 shadow-2xl backdrop-blur-xl text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95 hover:border-emerald-500/50"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="tracking-wide">
          Role: <strong className="text-emerald-400 font-extrabold">{currentRole}</strong>
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
      </button>
    </div>
  );
};
