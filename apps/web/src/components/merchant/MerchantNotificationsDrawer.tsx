import React, { useState } from 'react';
import {
  X,
  Bell,
  ShoppingBag,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { OrderData, Product } from './types';
import { ModalPortal } from '../common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderData[];
  products: Product[];
  onSelectOrder?: (orderId: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'order' | 'inventory' | 'system';
  title: string;
  description: string;
  timeAgo: string;
  unread: boolean;
  actionPayload?: string;
}

export const MerchantNotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  onSelectOrder,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });
  const [activeFilter, setActiveFilter] = useState<'all' | 'order' | 'inventory' | 'system'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Generate dynamic contextual notifications from orders & products
  const notifications: NotificationItem[] = React.useMemo(() => {
    const list: NotificationItem[] = [];

    // Order notifications
    orders.slice(0, 5).forEach((order, idx) => {
      const isNew = order.status === 'CONFIRMED' || order.status === 'PENDING_PAYMENT' || order.status === 'PAID';
      list.push({
        id: `notif-order-${order._id}`,
        type: 'order',
        title: isNew
          ? `New Order #${order.orderNumber || order._id.slice(-6).toUpperCase()}`
          : `Order #${order.orderNumber || order._id.slice(-6).toUpperCase()} updated to ${order.status}`,
        description: `Customer order with ${order.items?.length || 1} items for ₹${(
          (order.pricingSnapshot?.totalPaise || 0) / 100
        ).toFixed(2)}`,
        timeAgo: `${(idx + 1) * 12} mins ago`,
        unread: !readIds.has(`notif-order-${order._id}`),
        actionPayload: order._id,
      });
    });

    // Inventory notifications
    const lowStock = products.filter((p) => p.availableStock <= 10);
    lowStock.slice(0, 4).forEach((p, idx) => {
      list.push({
        id: `notif-stock-${p._id}`,
        type: 'inventory',
        title: p.availableStock === 0 ? `Out of stock: ${p.name}` : `Low stock alert: ${p.name}`,
        description: `Only ${p.availableStock} ${p.packageUnit || 'units'} remaining in warehouse`,
        timeAgo: `${(idx + 1) * 2} hrs ago`,
        unread: !readIds.has(`notif-stock-${p._id}`),
      });
    });

    // System notifications
    list.push({
      id: 'notif-sys-fssai',
      type: 'system',
      title: 'FSSAI Pure Vegetarian Verification Active',
      description: 'Your store catalog is certified 100% vegetarian compliant.',
      timeAgo: '1 day ago',
      unread: !readIds.has('notif-sys-fssai'),
    });
    list.push({
      id: 'notif-sys-settlement',
      type: 'system',
      title: 'Weekly Settlement Transferred',
      description: 'Net payable settlement of ₹1,15,805 processed to your bank account.',
      timeAgo: '2 days ago',
      unread: !readIds.has('notif-sys-settlement'),
    });

    return list;
  }, [orders, products, readIds]);

  const filtered = notifications.filter(
    (n) => activeFilter === 'all' || n.type === activeFilter
  );

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Drawer */}
        <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live orders, stock alerts & system updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
              >
                Mark all read
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-xs bg-slate-50/50 dark:bg-slate-800/20">
            {(['all', 'order', 'inventory', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>

          {/* Scrollable Notifications List */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No notifications in this tab
            </div>
          ) : (
            filtered.map((item) => {
              const Icon =
                item.type === 'order'
                  ? ShoppingBag
                  : item.type === 'inventory'
                  ? AlertTriangle
                  : Sparkles;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.actionPayload && onSelectOrder) {
                      onSelectOrder(item.actionPayload);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    item.unread
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        item.type === 'order'
                          ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400'
                          : item.type === 'inventory'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {item.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </ModalPortal>
  );
};
