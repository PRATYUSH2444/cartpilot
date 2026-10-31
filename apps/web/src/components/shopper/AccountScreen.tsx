import React from 'react';
import {
  Package,
  MapPin,
  CreditCard,
  Heart,
  Shield,
  Leaf,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Edit2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { OrderData } from '../../types';

interface AccountScreenProps {
  user: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  } | null;
  orders: OrderData[];
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenRules: () => void;
  onOpenProfileModal: () => void;
  onOpenIntegrations?: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  orders,
  onOpenOrders,
  onOpenAddresses,
  onOpenRules,
  onOpenProfileModal,
  onOpenIntegrations,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
  ).length;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';
  const displayName = user?.name || 'Priya Sharma';
  const displayEmail = user?.email || 'priya@example.com';
  const displayPhone = user?.phone || '+91 98765 43210';

  return (
    <div className="flex-1 overflow-y-auto pb-28 bg-[--bg]">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[--bg]/95 backdrop-blur-md px-4 py-3.5 border-b border-[--line]/60">
        <h2 className="font-heading font-bold text-base text-[--ink]">My Account</h2>
      </div>

      <div className="max-w-[760px] mx-auto px-4 pt-4 space-y-4">
        {/* ── User Profile Header Card ─────────────────────────────────────── */}
        <div
          onClick={onOpenProfileModal}
          className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-4 shadow-card flex items-center justify-between gap-3 cursor-pointer hover:border-[--brand]/40 transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-full bg-[--brand] text-white font-heading font-black text-xl flex items-center justify-center flex-shrink-0 shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base text-[--ink] truncate">
                {displayName}
              </h3>
              <p className="text-xs text-[--mut] truncate">{displayEmail}</p>
              <p className="text-xs text-[--mut] font-mono mt-0.5">{displayPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[--mut] hover:text-[--brand] p-2">
            <Edit2 className="w-4 h-4" />
          </div>
        </div>

        {/* ── Pure Vegetarian Certification Banner ─────────────────────────── */}
        <div className="p-3.5 rounded-[var(--radius-card)] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Pure Vegetarian Assurance
            </div>
            <p className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px] mt-0.5">
              Every SKU and merchant is verified strictly vegetarian. Non-veg items are prohibited.
            </p>
          </div>
        </div>

        {/* ── Main Menu Section ────────────────────────────────────────────── */}
        <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] shadow-card divide-y divide-[--line]/60 overflow-hidden">
          {/* My Orders */}
          <button
            onClick={onOpenOrders}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                My Orders
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[--brand-soft] text-[--brand] text-[10px] font-bold">
                  {activeOrdersCount} Active
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-[--mut]" />
            </div>
          </button>

          {/* Saved Addresses */}
          <button
            onClick={onOpenAddresses}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                Saved Addresses
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[--mut]" />
          </button>

          {/* Spending Permissions */}
          <button
            onClick={onOpenRules}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand] block">
                  Spending Permissions &amp; Mandate
                </span>
                <span className="text-[10px] text-[--mut]">
                  Autonomous caps, approval thresholds
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[--mut]" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => {}}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                Wishlist &amp; Saved Recipes
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[--mut]" />
          </button>

          {/* Payment Methods */}
          <button
            onClick={() => {}}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                Payment Methods (Razorpay, UPI)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[--mut]" />
          </button>

          {/* AI & Ecosystem Integrations */}
          {onOpenIntegrations && (
            <button
              onClick={onOpenIntegrations}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand] block">
                    AI Engine &amp; Integrations
                  </span>
                  <span className="text-[10px] text-[--mut]">
                    Google Gemini, OpenAI, database &amp; payment keys
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Live Status
                </span>
                <ChevronRight className="w-4 h-4 text-[--mut]" />
              </div>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[--surface-2] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <span className="text-xs font-semibold text-[--ink] group-hover:text-[--brand]">
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </span>
            </div>
            <span className="text-[10px] text-[--mut] uppercase font-bold">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>

        {/* ── Logout Action ────────────────────────────────────────────────── */}
        <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] shadow-card overflow-hidden">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Logout</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-[--mut] pt-2">
          CartPilot v2.5.0 · Pure Vegetarian Agentic Commerce
        </p>
      </div>
    </div>
  );
};
