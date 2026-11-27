import React from 'react';
import { Home, LayoutGrid, Sparkles, ShoppingBag, User } from 'lucide-react';
import { CartData } from '../../types';

export type TabKey = 'home' | 'browse' | 'chat' | 'cart' | 'account';

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  cart: CartData | null;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  cart,
}) => {
  const cartCount = cart?.itemCount || 0;

  return (
    <nav
      role="tablist"
      aria-label="Bottom Navigation"
      className="w-full bg-white dark:bg-stone-900 border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] select-none"
      style={{
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-1.5 sm:pt-2">
        {/* ── 1. Home ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'home'}
          data-testid="tab-home"
          aria-label="Home"
          onClick={() => onSelectTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'home'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-0.5 rounded-full transition-all duration-200 ${
              activeTab === 'home'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'
            }`}
          >
            <Home
              className={`w-5.5 h-5.5 transition-transform duration-150 ${
                activeTab === 'home'
                  ? 'fill-emerald-700 text-emerald-700 dark:fill-emerald-400 dark:text-emerald-400 scale-105'
                  : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 font-medium">Home</span>
        </button>

        {/* ── 2. Browse ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'browse'}
          data-testid="tab-browse"
          aria-label="Browse"
          onClick={() => onSelectTab('browse')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'browse'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-0.5 rounded-full transition-all duration-200 ${
              activeTab === 'browse'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'
            }`}
          >
            <LayoutGrid
              className={`w-5.5 h-5.5 transition-transform duration-150 ${
                activeTab === 'browse'
                  ? 'text-emerald-700 dark:text-emerald-400 stroke-[2.4px] scale-105'
                  : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 font-medium">Browse</span>
        </button>

        {/* ── 3. AI Assistant (Signature Center Button) ── */}
        <button
          type="button"
          role="tab"
          data-tour="ai-assistant"
          aria-selected={activeTab === 'chat'}
          data-testid="tab-chat"
          aria-label="AI Assistant"
          onClick={() => onSelectTab('chat')}
          className={`flex-1 flex flex-col items-center justify-center cursor-pointer group active:scale-95 transition-all ${
            activeTab === 'chat' ? '-mt-1' : '-mt-3.5 sm:-mt-4'
          }`}
        >
          <div
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border-3 sm:border-4 border-white dark:border-stone-900 group-hover:scale-105 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 text-white shadow-purple-500/40 ring-2 ring-purple-400/30 scale-105'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/25 hover:shadow-purple-500/35'
            }`}
          >
            <Sparkles className="w-6 h-6 stroke-[2.2px] fill-white/20 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 font-semibold transition-colors ${
              activeTab === 'chat'
                ? 'text-purple-700 dark:text-purple-400'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            AI Assistant
          </span>
        </button>

        {/* ── 4. Cart ── */}
        <button
          type="button"
          role="tab"
          data-tour="cart"
          aria-selected={activeTab === 'cart'}
          data-testid="tab-cart"
          aria-label="Cart"
          onClick={() => onSelectTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'cart'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div className="relative">
            <div
              className={`flex items-center justify-center px-3.5 py-0.5 rounded-full transition-all duration-200 ${
                activeTab === 'cart'
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'
              }`}
            >
              <ShoppingBag
                className={`w-5.5 h-5.5 transition-transform duration-150 ${
                  activeTab === 'cart'
                    ? 'fill-emerald-700 text-emerald-700 dark:fill-emerald-400 dark:text-emerald-400 stroke-[2.3px] scale-105'
                    : 'stroke-[1.8px]'
                }`}
              />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-0.5 px-1.5 py-0.2 min-w-[17px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs border-2 border-white dark:border-stone-900 animate-in zoom-in-75 duration-150">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 font-medium">Cart</span>
        </button>

        {/* ── 5. Account ── */}
        <button
          type="button"
          role="tab"
          data-tour="account"
          aria-selected={activeTab === 'account'}
          data-testid="tab-account"
          aria-label="Account"
          onClick={() => onSelectTab('account')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'account'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-0.5 rounded-full transition-all duration-200 ${
              activeTab === 'account'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'
            }`}
          >
            <User
              className={`w-5.5 h-5.5 transition-transform duration-150 ${
                activeTab === 'account'
                  ? 'text-emerald-700 dark:text-emerald-400 stroke-[2.4px] scale-105'
                  : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5 font-medium">Account</span>
        </button>
      </div>
    </nav>
  );
};
