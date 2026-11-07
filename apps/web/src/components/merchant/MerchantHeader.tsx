import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Calendar,
  LogOut,
  User,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { MerchantStoreData, MerchantTab } from './types';
import { useLiveClock } from '../../hooks/useLiveClock';

interface MerchantHeaderProps {
  store: MerchantStoreData | null;
  user?: { name?: string; email?: string; role?: string; isStaff?: boolean } | null;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate: (tab: MerchantTab) => void;
  onLogout: () => void;
  onToggleStoreOnline: () => void;
  isUpdatingOnline: boolean;
  onToggleSidebarMobile: () => void;
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({
  store,
  user,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotificationsCount,
  isDark,
  onToggleTheme,
  onNavigate,
  onLogout,
  onToggleStoreOnline,
  isUpdatingOnline,
  onToggleSidebarMobile,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const clock = useLiveClock('Asia/Kolkata');

  const ownerName = user?.name || store?.businessName || 'Store Owner';
  const ownerEmail = user?.email || store?.email || 'merchant@cartpilot.com';
  const roleLabel = user?.isStaff ? 'Store Staff' : 'Store Owner';
  const initials = ownerName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'M';

  const isStoreOnline = store?.isActive ?? true;

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 z-20">
      {/* Left: Mobile hamburger & Global Search Button */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebarMobile}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="flex-1 max-w-md h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 text-xs flex items-center justify-between transition-colors shadow-2xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            <span className="truncate">Search products, orders, customers...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Store Online Toggle, Date, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Store Online / Offline Toggle matching target mockup */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <span
              className={`w-2 h-2 rounded-full ${
                isStoreOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isStoreOnline ? 'Accepting Orders' : 'Store Paused'}
            </span>
          </div>
          <button
            onClick={onToggleStoreOnline}
            disabled={isUpdatingOnline}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isStoreOnline ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            } ${isUpdatingOnline ? 'opacity-50 cursor-wait' : ''}`}
            title="Toggle store order acceptance"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                isStoreOnline ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Date & Live Clock Indicator */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 font-mono">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{clock.formattedDate}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{clock.formattedTime}</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          title="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* User / Merchant Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {ownerName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                {roleLabel}
              </span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="font-semibold text-slate-900 dark:text-white">{ownerName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ownerEmail}</p>
                  <p className="mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {store?.businessName || 'Fresh Greens Organics'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('store-profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Store Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onNavigate('security');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Account & Security</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
