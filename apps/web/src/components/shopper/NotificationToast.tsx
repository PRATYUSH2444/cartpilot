import React, { useEffect, useState } from 'react';
import { X, Truck, Wallet, ShieldCheck, Leaf, ArrowRight } from 'lucide-react';
import { NotificationItem } from './NotificationsModal';

export interface NotificationToastProps {
  notification: NotificationItem | null;
  onOpenNotifications: () => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onOpenNotifications,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification, onDismiss]);

  if (!notification || !isVisible) return null;

  const getCategoryConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return {
          icon: Truck,
          bg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
          label: 'Order Update',
        };
      case 'wallet':
        return {
          icon: Wallet,
          bg: 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
          badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
          label: 'Wallet Notice',
        };
      case 'mandate':
        return {
          icon: ShieldCheck,
          bg: 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
          label: 'Spending Guard',
        };
      default:
        return {
          icon: Leaf,
          bg: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
          label: 'Dark Store',
        };
    }
  };

  const config = getCategoryConfig(notification.type);
  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto max-w-md z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 select-none"
    >
      <div
        onClick={() => {
          setIsVisible(false);
          onOpenNotifications();
        }}
        className="relative group flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 shadow-2xl hover:shadow-emerald-500/10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Left Category Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${config.bg}`}
        >
          <Icon className="w-4.5 h-4.5 stroke-[2]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wide ${config.badge}`}
            >
              {config.label}
            </span>
            <span className="text-[10px] text-stone-400 font-medium">Just now</span>
          </div>

          <h5 className="font-extrabold text-xs text-stone-900 dark:text-white truncate">
            {notification.title}
          </h5>

          <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-1 mt-0.5 leading-tight">
            {notification.message}
          </p>

          <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline">
            <span>View details in Notifications</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
