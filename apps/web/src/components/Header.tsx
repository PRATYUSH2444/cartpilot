import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sun,
  Moon,
  ShieldCheck,
  User,
  LogOut,
  Store,
} from 'lucide-react';
import { DecisionLamp } from './DecisionLamp';
import { LampStatus, CartData } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  cart?: CartData | null;
  onOpenCart?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  lampStatus?: LampStatus;
  mandateSummary?: string;
  onOpenMandate?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cart,
  onOpenCart,
  isDark,
  onToggleTheme,
  lampStatus,
  mandateSummary,
  onOpenMandate,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const itemCount = cart?.itemCount || 0;
  const formattedTotal = cart?.pricing?.formatted?.total || '₹0.00';

  const handleSignOut = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    const isAdmin = user?.role === 'ADMIN';
    await logout();
    if (isAdmin) {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const roleMeta = {
    CUSTOMER: {
      label: 'Shopper',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <User className="w-3.5 h-3.5 text-emerald-500" />,
    },
    MERCHANT: {
      label: 'Merchant Portal',
      badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700',
      icon: <Store className="w-3.5 h-3.5 text-emerald-500" />,
    },
    ADMIN: {
      label: 'Dark-Store Admin',
      badgeClass: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-700 dark:border-white/20 shadow-xs',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    },
  };

  const currentMeta = user?.role ? roleMeta[user.role] : roleMeta.CUSTOMER;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brd bg-card/80 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-sm flex-shrink-0 border border-zinc-800 dark:border-zinc-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg text-ink tracking-tight">
                CartPilot
              </span>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${currentMeta.badgeClass}`}
              >
                {currentMeta.label}
              </span>
              {user?.role === 'CUSTOMER' && (
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  100% Veg
                </span>
              )}
            </div>
            <p className="text-[10px] text-mut font-sans hidden sm:block">
              {user?.role === 'MERCHANT'
                ? 'Wholesale Harvest Crates & Dark-Store Fulfillment Hub'
                : user?.role === 'ADMIN'
                  ? 'Patna Dark Store Facility #01 • Zero-Trust Order Ledger'
                  : 'Fresh Groceries • Smarter, Healthier & Faster'}
            </p>
          </div>
        </div>

        {/* Center: Live Decision Lamp or Mandate Trigger (For Shopper & Admin) */}
        <div className="hidden md:flex items-center gap-3">
          {mandateSummary && onOpenMandate && (
            <button
              onClick={onOpenMandate}
              className="px-2.5 py-1 rounded-full border border-brd bg-paper/50 hover:bg-paper text-xs text-mut hover:text-ink transition-colors flex items-center gap-1.5"
              title="View spending mandate configuration"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium">{mandateSummary}</span>
            </button>
          )}

          {lampStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-brd bg-paper/50">
              <span className="text-xs text-mut font-medium">Gateway:</span>
              <DecisionLamp status={lampStatus} compact />
            </div>
          )}
        </div>

        {/* Right controls: Profile, Theme, Cart (Shopper), Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Quick Button (Only for Shopper) */}
          {user?.role === 'CUSTOMER' && onOpenCart && (
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-acc text-white hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 text-xs font-semibold"
              title="Open shopping cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{formattedTotal}</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-acc text-[11px] font-mono font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* User profile identifier & Security settings */}
          {user && (
            <Link
              to="/account-security"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-brd bg-paper/40 hover:bg-paper text-xs transition-colors group"
              title="Manage Account Security & Active Sessions"
            >
              {currentMeta.icon}
              <div className="text-left">
                <span className="font-semibold text-ink block text-[11px] truncate max-w-[120px] group-hover:text-acc transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] text-mut block truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-brd text-mut hover:text-ink hover:bg-paper transition-all cursor-pointer shadow-2xs"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Logout button */}
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-xl border border-brd text-mut hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
            title="Sign out of current workspace"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
