import React from 'react';
import {
  Home,
  ClipboardList,
  Package,
  Truck,
  Store,
  ChevronDown,
  Headphones,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { MerchantTab, MerchantStoreData } from './types';

interface MerchantSidebarProps {
  activeTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  store: MerchantStoreData | null;
  pendingOrdersCount: number;
  lowStockCount: number;
}

export const MerchantSidebar: React.FC<MerchantSidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  store,
  pendingOrdersCount,
  lowStockCount,
}) => {
  // Map secondary tabs to the 5 primary tabs for highlighting
  const getActivePrimaryTab = (): 'home' | 'orders' | 'fulfilment' | 'products' | 'delivery' | 'shop' => {
    if (activeTab === 'home' || activeTab === 'overview') return 'home';
    if (activeTab === 'orders') return 'orders';
    if (activeTab === 'fulfilment') return 'fulfilment';
    if (activeTab === 'products' || activeTab === 'inventory' || activeTab === 'categories') return 'products';
    if (activeTab === 'delivery' || activeTab === 'delivery-settings') return 'delivery';
    return 'shop';
  };

  const primaryActive = getActivePrimaryTab();

  const navItems = [
    {
      id: 'home' as MerchantTab,
      label: 'Home',
      icon: Home,
      isActive: primaryActive === 'home',
    },
    {
      id: 'orders' as MerchantTab,
      label: 'Orders',
      icon: ClipboardList,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      isActive: primaryActive === 'orders',
    },
    {
      id: 'fulfilment' as MerchantTab,
      label: 'Pickup Crates',
      icon: Layers,
      isActive: primaryActive === 'fulfilment',
    },
    {
      id: 'products' as MerchantTab,
      label: 'My Products',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      isActive: primaryActive === 'products',
    },
    {
      id: 'delivery' as MerchantTab,
      label: 'Delivery',
      icon: Truck,
      isActive: primaryActive === 'delivery',
    },
    {
      id: 'shop' as MerchantTab,
      label: 'My Shop',
      icon: Store,
      isActive: primaryActive === 'shop',
    },
  ];

  return (
    <aside
      className={`h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-200 select-none overflow-hidden ${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* ── Top Header & Store Identity (Stationary) ───────────────────────── */}
      <div className="flex-shrink-0 p-4 pb-2 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
                  CartPilot
                </span>
                <span className="text-[11px] font-medium text-slate-400 block leading-none">
                  Merchant
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Store Card Pill */}
        {!isCollapsed && (
          <div
            onClick={() => onSelectTab('shop')}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-base shrink-0">
                🏪
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {store?.businessName || 'Fresh Greens Organics'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {store?.address?.city ? `${store.address.city}` : 'Boring Road, Patna'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        )}
      </div>

      {/* ── Five Primary Navigation Items (Scrollable when height constrained) ─ */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2 space-y-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                item.isActive
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
              title={item.label}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    item.isActive
                      ? 'bg-emerald-600/60 text-white'
                      : item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Support Card (Stationary) ─────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800/60">
        {!isCollapsed ? (
          <div className="p-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 relative overflow-hidden space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Need Help?</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Chat with our support team or get instant assistance.
              </p>
              <button
                onClick={() => onSelectTab('shop')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center block"
              >
                Get Support
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <button
              onClick={() => onSelectTab('shop')}
              className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center cursor-pointer"
              title="Help & Support"
            >
              <Headphones className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
