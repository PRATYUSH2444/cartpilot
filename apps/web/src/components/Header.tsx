import React from 'react';
import { ShoppingBag, Sun, Moon, ShieldCheck, User } from 'lucide-react';
import { DecisionLamp } from './DecisionLamp';
import { LampStatus, CartData } from '../types';

interface HeaderProps {
  currentRole: 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
  onSwitchRole: (role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN') => void;
  cart: CartData | null;
  onOpenCart: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  lampStatus: LampStatus;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSwitchRole,
  cart,
  onOpenCart,
  isDark,
  onToggleTheme,
  lampStatus,
}) => {
  const itemCount = cart?.itemCount || 0;
  const formattedTotal = cart?.pricing.formatted.total || '₹0.00';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brd bg-card/75 dark:bg-card-top/75 backdrop-blur-xl transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-lg text-ink tracking-tight">
                CartPilot
              </span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                Vegetarian
              </span>
            </div>
            <p className="text-[10px] text-mut font-sans hidden sm:block">
              Policy-Controlled AI Commerce
            </p>
          </div>
        </div>

        {/* Center: Live Decision Lamp Mini Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-brd bg-paper/50">
          <span className="text-xs text-mut font-medium">Gateway:</span>
          <DecisionLamp status={lampStatus} compact />
        </div>

        {/* Right controls: Role Selector, Theme, Cart Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher */}
          <div className="flex items-center rounded-lg border border-brd bg-paper/60 p-0.5 text-xs font-medium">
            <button
              onClick={() => onSwitchRole('CUSTOMER')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                currentRole === 'CUSTOMER'
                  ? 'bg-card text-ink font-semibold shadow-sm'
                  : 'text-mut hover:text-ink'
              }`}
              title="Switch to Customer session (Aarav)"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shopper</span>
            </button>
            <button
              onClick={() => onSwitchRole('MERCHANT')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentRole === 'MERCHANT'
                  ? 'bg-card text-ink font-semibold shadow-sm'
                  : 'text-mut hover:text-ink'
              }`}
              title="Switch to Merchant context"
            >
              Merchant
            </button>
            <button
              onClick={() => onSwitchRole('ADMIN')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                currentRole === 'ADMIN'
                  ? 'bg-card text-ink font-semibold shadow-sm'
                  : 'text-mut hover:text-ink'
              }`}
              title="Switch to Compliance Admin"
            >
              Admin
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-brd text-mut hover:text-ink hover:bg-paper/80 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Quick Button */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-acc text-white hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 text-xs font-semibold"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{formattedTotal}</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-acc text-[11px] font-mono font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
