import React from 'react';
import { MessageSquare, Search, ShoppingBag, PackageCheck, Sliders } from 'lucide-react';
import { CartData } from '../../types';

export type TabKey = 'chat' | 'browse' | 'cart' | 'orders' | 'rules';

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
  const cartTotal = cart?.pricing?.formatted?.total || '₹0';

  const tabs: Array<{ key: TabKey; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }> = [
    { key: 'chat', label: 'Assistant', icon: MessageSquare },
    { key: 'browse', label: 'Browse', icon: Search },
    {
      key: 'cart',
      label: cartCount > 0 ? cartTotal : 'Cart',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    { key: 'orders', label: 'Orders', icon: PackageCheck },
    { key: 'rules', label: 'Rules', icon: Sliders },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 dark:bg-card-top/95 backdrop-blur-xl border-t border-brd flex items-center justify-around px-2 py-1 safe-area-inset-bottom"
      aria-label="Bottom Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            data-testid={`tab-${tab.key}`}
            aria-label={tab.label}
            onClick={() => onSelectTab(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-mut hover:text-ink'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 min-w-[16px] h-4 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
