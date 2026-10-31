import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
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
  Plus,
  ArrowRight,
  Sliders,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { MerchantTab, Product, OrderData } from './types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: MerchantTab) => void;
  products: Product[];
  orders: OrderData[];
  onOpenAddProduct: () => void;
  onToggleTheme: () => void;
  onToggleStoreOnline: () => void;
  onOpenIntegrations?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Products' | 'Orders';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const MerchantCommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  products,
  orders,
  onOpenAddProduct,
  onToggleTheme,
  onToggleStoreOnline,
  onOpenIntegrations,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-overview',
        category: 'Navigation',
        title: 'Go to Overview Dashboard',
        subtitle: 'Command centre & KPI metrics',
        icon: LayoutDashboard,
        action: () => {
          onNavigate('overview');
          onClose();
        },
      },
      {
        id: 'nav-orders',
        category: 'Navigation',
        title: 'Go to Orders',
        subtitle: 'Incoming and historical customer orders',
        icon: ShoppingBag,
        action: () => {
          onNavigate('orders');
          onClose();
        },
      },
      {
        id: 'nav-products',
        category: 'Navigation',
        title: 'Go to Products Catalog',
        subtitle: 'Product catalogue, prices and variants',
        icon: Package,
        action: () => {
          onNavigate('products');
          onClose();
        },
      },
      {
        id: 'nav-inventory',
        category: 'Navigation',
        title: 'Go to Inventory Management',
        subtitle: 'Stock levels and low-stock alerts',
        icon: Boxes,
        action: () => {
          onNavigate('inventory');
          onClose();
        },
      },
      {
        id: 'nav-categories',
        category: 'Navigation',
        title: 'Go to Categories',
        subtitle: 'Catalogue classification & subcategories',
        icon: FolderTree,
        action: () => {
          onNavigate('categories');
          onClose();
        },
      },
      {
        id: 'nav-fulfilment',
        category: 'Navigation',
        title: 'Go to Fulfilment Operations',
        subtitle: 'Packing, handover and workflow board',
        icon: Truck,
        action: () => {
          onNavigate('fulfilment');
          onClose();
        },
      },
      {
        id: 'nav-customers',
        category: 'Navigation',
        title: 'Go to Customers',
        subtitle: 'Customer database and spending history',
        icon: Users,
        action: () => {
          onNavigate('customers');
          onClose();
        },
      },
      {
        id: 'nav-analytics',
        category: 'Navigation',
        title: 'Go to Analytics & Reports',
        subtitle: 'Sales trends, revenue and conversion',
        icon: BarChart3,
        action: () => {
          onNavigate('analytics');
          onClose();
        },
      },
      {
        id: 'nav-finance',
        category: 'Navigation',
        title: 'Go to Finance & Payouts',
        subtitle: 'Settlements, commissions and statements',
        icon: Wallet,
        action: () => {
          onNavigate('finance');
          onClose();
        },
      },
      {
        id: 'nav-marketing',
        category: 'Navigation',
        title: 'Go to Marketing & Promotions',
        subtitle: 'Coupons, discounts and offers',
        icon: Megaphone,
        action: () => {
          onNavigate('marketing');
          onClose();
        },
      },
      {
        id: 'nav-store-profile',
        category: 'Navigation',
        title: 'Go to Store Profile',
        subtitle: 'Store identity, address and FSSAI license',
        icon: Store,
        action: () => {
          onNavigate('store-profile');
          onClose();
        },
      },
      {
        id: 'nav-delivery',
        category: 'Navigation',
        title: 'Go to Delivery Settings',
        subtitle: 'Serviceable pincodes & delivery radius',
        icon: MapPin,
        action: () => {
          onNavigate('delivery-settings');
          onClose();
        },
      },
      {
        id: 'nav-staff',
        category: 'Navigation',
        title: 'Go to Staff & Roles',
        subtitle: 'Employees and RBAC permissions',
        icon: UserCheck,
        action: () => {
          onNavigate('staff');
          onClose();
        },
      },

      // Quick Actions
      {
        id: 'action-add-product',
        category: 'Actions',
        title: 'Add New Product',
        subtitle: 'Create a new item in your store catalogue',
        icon: Plus,
        action: () => {
          onClose();
          onOpenAddProduct();
        },
      },
      {
        id: 'action-toggle-online',
        category: 'Actions',
        title: 'Toggle Store Online / Offline',
        subtitle: 'Change your live store serviceability',
        icon: Sliders,
        action: () => {
          onToggleStoreOnline();
          onClose();
        },
      },
      {
        id: 'action-toggle-theme',
        category: 'Actions',
        title: 'Switch Theme (Dark / Light)',
        subtitle: 'Toggle appearance mode',
        icon: Moon || Sun,
        action: () => {
          onToggleTheme();
          onClose();
        },
      },
      ...(onOpenIntegrations
        ? [
            {
              id: 'action-integrations',
              category: 'Actions' as const,
              title: 'External Integrations & Real AI Engine',
              subtitle: 'Configure Google Gemini, OpenAI, database & payments',
              icon: Zap,
              action: () => {
                onOpenIntegrations();
                onClose();
              },
            },
          ]
        : []),
    ];

    // Append up to 6 real products matching search
    products.slice(0, 8).forEach((p) => {
      list.push({
        id: `prod-${p._id}`,
        category: 'Products',
        title: p.name,
        subtitle: `₹${(p.pricePaise / 100).toFixed(2)} • Stock: ${p.availableStock} • SKU: ${p.slug || 'N/A'}`,
        icon: Package,
        action: () => {
          onNavigate('products');
          onClose();
        },
      });
    });

    // Append up to 6 real orders matching search
    orders.slice(0, 6).forEach((o) => {
      list.push({
        id: `ord-${o._id}`,
        category: 'Orders',
        title: `Order #${o.orderNumber || o._id.slice(-6).toUpperCase()}`,
        subtitle: `Status: ${o.status} • Total: ₹${((o.pricingSnapshot?.totalPaise || 0) / 100).toFixed(2)}`,
        icon: ShoppingBag,
        action: () => {
          onNavigate('orders');
          onClose();
        },
      });
    });

    return list;
  }, [products, orders, onNavigate, onClose, onOpenAddProduct, onToggleStoreOnline, onToggleTheme]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[520px]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {cmd.title}
                      </span>
                      {cmd.subtitle && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {cmd.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Linear-Powered Command Center</span>
        </div>
      </div>
    </div>
  );
};
