import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  FolderTree,
  Truck,
  Users,
  BarChart3,
  Wallet,
  Megaphone,
  Store,
  MapPin,
  UserCheck,
  Bell,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  CircleDot,
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

interface NavItem {
  id: MerchantTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
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
  const sections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-emerald-500 text-white',
        },
        { id: 'products', label: 'Products', icon: Package },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        { id: 'categories', label: 'Categories', icon: FolderTree },
        { id: 'fulfilment', label: 'Fulfilment', icon: Truck },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'finance', label: 'Finance', icon: Wallet },
        { id: 'marketing', label: 'Marketing', icon: Megaphone },
      ],
    },
    {
      title: 'STORE',
      items: [
        { id: 'store-profile', label: 'Store Profile', icon: Store },
        { id: 'delivery-settings', label: 'Delivery Settings', icon: MapPin },
      ],
    },
    {
      title: 'TEAM',
      items: [{ id: 'staff', label: 'Staff & Roles', icon: UserCheck }],
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Account & Security', icon: ShieldCheck },
        { id: 'support', label: 'Help & Support', icon: HelpCircle },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 flex-shrink-0">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight truncate">
                CartPilot
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">
                Merchant Portal
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Modules */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase font-mono">
                {sec.title}
              </div>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.2]'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono tracking-tight ${
                              item.badgeColor || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Store Status Card */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    store?.isActive ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    store?.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {store?.businessName || 'Fresh Greens Organics'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {store?.isActive ? 'Store Online' : 'Store Offline'} • 100% Veg
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
          <span title={store?.isActive ? 'Store Online' : 'Store Offline'}>
            <CircleDot
              className={`w-4 h-4 ${
                store?.isActive ? 'text-emerald-500' : 'text-slate-400'
              }`}
            />
          </span>
        </div>
      )}
    </aside>
  );
};
