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
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-line flex items-center justify-around px-3 py-1.5 safe-area-inset-bottom shadow-lg"
      aria-label="Bottom Navigation"
    >
      {/* 1. Home */}
      <button
        data-testid="tab-home"
        aria-label="Home"
        onClick={() => onSelectTab('home')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[50px] transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'text-brand font-bold'
            : 'text-mut hover:text-ink font-medium'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
        <span className="text-[11px] tracking-tight mt-1">Home</span>
      </button>

      {/* 2. Browse */}
      <button
        data-testid="tab-browse"
        aria-label="Browse"
        onClick={() => onSelectTab('browse')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[50px] transition-all cursor-pointer ${
          activeTab === 'browse'
            ? 'text-brand font-bold'
            : 'text-mut hover:text-ink font-medium'
        }`}
      >
        <LayoutGrid className={`w-5 h-5 ${activeTab === 'browse' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
        <span className="text-[11px] tracking-tight mt-1">Browse</span>
      </button>

      {/* 3. AI Shop (Distinctive elevated signature button) */}
      <button
        data-testid="tab-chat"
        aria-label="AI Shop"
        onClick={() => onSelectTab('chat')}
        className="flex-1 flex flex-col items-center justify-center py-0.5 -mt-3 cursor-pointer group"
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
            activeTab === 'chat'
              ? 'bg-brand text-white shadow-md scale-105'
              : 'bg-brand-soft text-brand border border-brand/20 group-hover:bg-brand/10'
          }`}
        >
          <Sparkles className="w-5 h-5 stroke-[2.2px]" />
        </div>
        <span
          className={`text-[11px] tracking-tight mt-1 ${
            activeTab === 'chat' ? 'text-brand font-extrabold' : 'text-mut font-semibold'
          }`}
        >
          AI Shop
        </span>
      </button>

      {/* 4. Cart */}
      <button
        data-testid="tab-cart"
        aria-label="Cart"
        onClick={() => onSelectTab('cart')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[50px] transition-all cursor-pointer ${
          activeTab === 'cart'
            ? 'text-brand font-bold'
            : 'text-mut hover:text-ink font-medium'
        }`}
      >
        <div className="relative">
          <ShoppingBag className={`w-5 h-5 ${activeTab === 'cart' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[11px] tracking-tight mt-1">Cart</span>
      </button>

      {/* 5. Account */}
      <button
        data-testid="tab-account"
        aria-label="Account"
        onClick={() => onSelectTab('account')}
        className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[50px] transition-all cursor-pointer ${
          activeTab === 'account'
            ? 'text-brand font-bold'
            : 'text-mut hover:text-ink font-medium'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
        <span className="text-[11px] tracking-tight mt-1">Account</span>
      </button>
    </nav>
  );
};
