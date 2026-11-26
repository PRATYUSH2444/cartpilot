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
      className="w-full flex-shrink-0 bg-transparent"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {/* 1. Home */}
        <button
          data-testid="tab-home"
          aria-label="Home"
          onClick={() => onSelectTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
              activeTab === 'home'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : ''
            }`}
          >
            <Home
              className={`w-5 h-5 ${
                activeTab === 'home'
                  ? 'fill-emerald-700 text-emerald-700 dark:fill-emerald-400 dark:text-emerald-400'
                  : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. Browse */}
        <button
          data-testid="tab-browse"
          aria-label="Browse"
          onClick={() => onSelectTab('browse')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'browse'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
              activeTab === 'browse'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : ''
            }`}
          >
            <LayoutGrid
              className={`w-5 h-5 ${
                activeTab === 'browse' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Browse</span>
        </button>

        {/* 3. AI Assistant (Signature elevated center button) */}
        <button
          data-testid="tab-chat"
          aria-label="AI Assistant"
          onClick={() => onSelectTab('chat')}
          className="flex-1 flex flex-col items-center justify-center -mt-5 cursor-pointer group"
        >
          <div
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-md border-4 border-white dark:border-stone-900 group-hover:scale-105 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-tr from-emerald-500 to-emerald-300 text-stone-950 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-emerald-200 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-sm'
            }`}
          >
            <Sparkles className="w-6 h-6 stroke-[2.3px] fill-emerald-800/20" />
          </div>
          <span
            className={`text-[11px] tracking-tight mt-0.5 font-bold ${
              activeTab === 'chat'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            AI Assistant
          </span>
        </button>

        {/* 4. Cart */}
        <button
          data-testid="tab-cart"
          aria-label="Cart"
          onClick={() => onSelectTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'cart'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div className="relative">
            <div
              className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
                activeTab === 'cart'
                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : ''
              }`}
            >
              <ShoppingBag
                className={`w-5 h-5 ${
                  activeTab === 'cart' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
                }`}
              />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-2 px-1.5 py-0.2 min-w-[17px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs border border-white dark:border-stone-900">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Cart</span>
        </button>

        {/* 5. Account */}
        <button
          data-testid="tab-account"
          aria-label="Account"
          onClick={() => onSelectTab('account')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
          }`}
        >
          <div
            className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
              activeTab === 'account'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : ''
            }`}
          >
            <User
              className={`w-5 h-5 ${
                activeTab === 'account' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
              }`}
            />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Account</span>
        </button>
      </div>
    </nav>
  );
};
