import React from 'react';
import { Home, LayoutGrid, Sparkles, ShoppingBag, User } from 'lucide-react';
import { CartData } from '../../types';

export type TabKey = 'home' | 'browse' | 'chat' | 'cart' | 'account';

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  cart: CartData | null;
}

const TAB_INDEX_MAP: Record<TabKey, number> = {
  home: 0,
  browse: 1,
  chat: 2,
  cart: 3,
  account: 4,
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
  cart,
}) => {
  const cartCount = cart?.itemCount || 0;
  const activeIndex = TAB_INDEX_MAP[activeTab] ?? 0;

  return (
    <nav
      role="tablist"
      aria-label="Bottom Navigation"
      className="w-full flex-shrink-0 select-none py-1"
    >
      <div className="relative max-w-md mx-auto flex items-center px-1.5 py-1">
        {/* ── React Bits Inspired: Smooth Elastic Sliding Pill Indicator ── */}
        <div
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1.5 w-[calc((100%-12px)/5)] p-0.5 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        >
          <div
            className={`w-full h-full rounded-2xl transition-all duration-300 shadow-sm ${
              activeTab === 'chat'
                ? 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 shadow-indigo-500/30'
                : 'bg-stone-900 dark:bg-stone-100 shadow-stone-900/20 dark:shadow-white/10'
            }`}
          />
        </div>

        {/* ── 1. Home ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'home'}
          data-testid="tab-home"
          aria-label="Home"
          onClick={() => onSelectTab('home')}
          className="relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <Home
            className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'home'
                ? 'text-white dark:text-stone-900 fill-white dark:fill-stone-900 scale-105'
                : 'text-stone-400 dark:text-stone-500 stroke-[1.8px] hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-300 ${
              activeTab === 'home'
                ? 'text-white dark:text-stone-900 font-extrabold'
                : 'text-stone-400 dark:text-stone-500 font-medium'
            }`}
          >
            Home
          </span>
        </button>

        {/* ── 2. Browse ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'browse'}
          data-testid="tab-browse"
          aria-label="Browse Categories"
          onClick={() => onSelectTab('browse')}
          className="relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <LayoutGrid
            className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'browse'
                ? 'text-white dark:text-stone-900 stroke-[2.4px] scale-105'
                : 'text-stone-400 dark:text-stone-500 stroke-[1.8px] hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-300 ${
              activeTab === 'browse'
                ? 'text-white dark:text-stone-900 font-extrabold'
                : 'text-stone-400 dark:text-stone-500 font-medium'
            }`}
          >
            Browse
          </span>
        </button>

        {/* ── 3. AI Assistant (Signature Electric Indigo/Violet Shimmer) ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          data-testid="tab-chat"
          aria-label="AI Shopping Assistant"
          onClick={() => onSelectTab('chat')}
          className="relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer active:scale-95 transition-transform duration-150 group"
        >
          <div className="relative">
            <Sparkles
              className={`w-5 h-5 transition-all duration-300 ${
                activeTab === 'chat'
                  ? 'text-white fill-white/30 stroke-[2.4px] scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'text-violet-600 dark:text-violet-400 stroke-[2px] group-hover:scale-105'
              }`}
            />
            {/* Subtle idle AI ambient glow dot when inactive */}
            {activeTab !== 'chat' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-300 ${
              activeTab === 'chat'
                ? 'text-white font-extrabold'
                : 'text-violet-600 dark:text-violet-400 font-bold group-hover:text-violet-700'
            }`}
          >
            AI Assistant
          </span>
        </button>

        {/* ── 4. Cart ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cart'}
          data-testid="tab-cart"
          aria-label="Shopping Cart"
          onClick={() => onSelectTab('cart')}
          className="relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <div className="relative">
            <ShoppingBag
              className={`w-5 h-5 transition-all duration-300 ${
                activeTab === 'cart'
                  ? 'text-white dark:text-stone-900 stroke-[2.4px] scale-105'
                  : 'text-stone-400 dark:text-stone-500 stroke-[1.8px] hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs border-2 border-white dark:border-stone-900 animate-in zoom-in-75 duration-200">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-300 ${
              activeTab === 'cart'
                ? 'text-white dark:text-stone-900 font-extrabold'
                : 'text-stone-400 dark:text-stone-500 font-medium'
            }`}
          >
            Cart
          </span>
        </button>

        {/* ── 5. Account ── */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'account'}
          data-testid="tab-account"
          aria-label="Account and Profile"
          onClick={() => onSelectTab('account')}
          className="relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 cursor-pointer active:scale-95 transition-transform duration-150"
        >
          <User
            className={`w-5 h-5 transition-all duration-300 ${
              activeTab === 'account'
                ? 'text-white dark:text-stone-900 stroke-[2.4px] scale-105'
                : 'text-stone-400 dark:text-stone-500 stroke-[1.8px] hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          />
          <span
            className={`text-[10px] tracking-tight mt-0.5 transition-colors duration-300 ${
              activeTab === 'account'
                ? 'text-white dark:text-stone-900 font-extrabold'
                : 'text-stone-400 dark:text-stone-500 font-medium'
            }`}
          >
            Account
          </span>
        </button>
      </div>
    </nav>
  );
};
