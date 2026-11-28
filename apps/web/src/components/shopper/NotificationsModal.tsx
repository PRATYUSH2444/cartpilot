import React, { useState } from 'react';
import { X, Bell, Truck, Sparkles, Wallet, ShieldCheck, CheckCheck } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'wallet' | 'catalog' | 'mandate';
  read: boolean;
}

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onMarkAllRead?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
}) => {
  const [localItems, setLocalItems] = useState<NotificationItem[]>(notifications);

  React.useEffect(() => {
    setLocalItems(notifications);
  }, [notifications]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setLocalItems((prev) => prev.map((item) => ({ ...item, read: true })));
    if (onMarkAllRead) {
      onMarkAllRead();
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'catalog':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'mandate':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 flex items-center justify-center shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-white leading-none">
                Notifications
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Real-time updates on orders, arrivals & wallet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-2.5 overflow-y-auto">
          {localItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center">
                <Bell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h4 className="font-heading font-extrabold text-sm text-stone-900 dark:text-white">
                All caught up!
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">
                No new notifications. Real-time updates about your orders and wallet balance will appear here.
              </p>
            </div>
          ) : (
            localItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-3.5 transition-all flex items-start gap-3 ${
                  item.read
                    ? 'border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-850 opacity-80'
                    : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-stone-800 flex items-center justify-center shadow-2xs flex-shrink-0 mt-0.5 border border-stone-200/60 dark:border-stone-700">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-stone-400 font-medium whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
