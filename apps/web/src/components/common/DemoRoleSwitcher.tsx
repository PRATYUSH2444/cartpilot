import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  Users,
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
        <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-2 w-64 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold">
              1-Tap Role Switcher
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
              Demo
            </span>
          </div>

          <div className="space-y-1">
            {/* Shopper Option */}
            <button
              onClick={() => handleRoleSelect('CUSTOMER')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'CUSTOMER' && isAuthenticated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="leading-tight">Shopper Portal</div>
                  <div className="text-[10px] text-stone-400 font-normal">customer@example.com</div>
                </div>
              </div>
              {isSwitching === 'CUSTOMER' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : currentRole === 'CUSTOMER' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : null}
            </button>

            {/* Merchant Option */}
            <button
              onClick={() => handleRoleSelect('MERCHANT')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'MERCHANT' && isAuthenticated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="leading-tight">Merchant Hub</div>
                  <div className="text-[10px] text-stone-400 font-normal">merchant@freshgrocers.com</div>
                </div>
              </div>
              {isSwitching === 'MERCHANT' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : currentRole === 'MERCHANT' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : null}
            </button>

            {/* Admin Option */}
            <button
              onClick={() => handleRoleSelect('ADMIN')}
              disabled={Boolean(isSwitching)}
              className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                currentRole === 'ADMIN' && isAuthenticated
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="leading-tight">Dark-Store Admin</div>
                  <div className="text-[10px] text-stone-400 font-normal">admin@cartpilot.com</div>
                </div>
              </div>
              {isSwitching === 'ADMIN' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
              ) : currentRole === 'ADMIN' && isAuthenticated ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : null}
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-full bg-stone-900/90 dark:bg-stone-800/90 hover:bg-stone-800 dark:hover:bg-stone-700 text-white border border-stone-700/80 shadow-lg backdrop-blur-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
      >
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span>
          Role: <strong className="text-emerald-400">{currentRole}</strong>
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronUp className="w-3.5 h-3.5 text-stone-400" />}
      </button>
    </div>
  );
};
