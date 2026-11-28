import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ChevronRight,
  X,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { CartData } from '../../types';

export interface DynamicNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface DynamicIslandProps {
  notification: DynamicNotification | null;
  onDismissNotification: () => void;
  cart: CartData | null;
  activeTab: string;
  isAnyModalOpen: boolean;
  onOpenCart: () => void;
  isDark?: boolean;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  notification,
  onDismissNotification,
  cart,
  activeTab,
  isAnyModalOpen,
  onOpenCart,
  isDark: _unusedIsDark = false,
}) => {
  const [isCartPillDismissed, setIsCartPillDismissed] = React.useState(false);

  // Reset cart pill dismissal when cart items change
  React.useEffect(() => {
    setIsCartPillDismissed(false);
  }, [cart?.itemCount]);

  // Hide Dynamic Island completely if any full-screen modal or sheet is open
  if (isAnyModalOpen) return null;

  const hasNotification = Boolean(notification);
  const cartItemCount = cart?.itemCount || 0;
  const isCartPillVisible =
    !hasNotification &&
    !isCartPillDismissed &&
    cartItemCount > 0 &&
    (activeTab === 'browse' || activeTab === 'home');

  // If there is neither a notification nor a cart pill to display, render nothing
  if (!hasNotification && !isCartPillVisible) return null;

  // Derive latest item in cart for the preview thumbnail and text
  const latestCartItem = useMemo(() => {
    if (!cart || !cart.items || cart.items.length === 0) return null;
    return cart.items[cart.items.length - 1];
  }, [cart]);

  const totalPaise = cart?.pricing?.totalPaise ?? 0;
  const totalPriceRupees = Math.round(totalPaise / 100);

  // Compact icon derivation for notification
  const renderNotificationIcon = () => {
    if (!notification) return null;
    if (notification.type === 'error') {
      return (
        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-rose-500/20 text-rose-300 border border-rose-500/30 dark:bg-rose-100 dark:text-rose-700 dark:border-rose-300">
          <AlertCircle className="w-2.5 h-2.5 stroke-[2.6]" />
        </div>
      );
    }

    if (notification.message.toLowerCase().includes('wallet')) {
      return (
        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-300">
          <Wallet className="w-2.5 h-2.5 stroke-[2.6]" />
        </div>
      );
    }

    if (
      notification.message.toLowerCase().includes('ai') ||
      notification.message.toLowerCase().includes('assistant')
    ) {
      return (
        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-300 border border-purple-500/30 dark:bg-purple-100 dark:text-purple-800 dark:border-purple-300">
          <Sparkles className="w-2.5 h-2.5 stroke-[2.6]" />
        </div>
      );
    }

    return (
      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-300">
        <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.6]" />
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Action Notification & Cart"
      className="fixed bottom-[74px] lg:bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[calc(100%-3rem)] sm:max-w-sm pointer-events-none select-none transition-all duration-200 ease-out flex justify-center"
    >
      {/* ── Mode 1: Active Toast Notification ─────────────────────────────── */}
      {hasNotification && notification ? (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto rounded-full py-1 pl-2 pr-1 flex items-center justify-between gap-2 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'error'
              ? 'bg-stone-950 text-rose-200 border border-rose-800 shadow-stone-950/40 ring-1 ring-rose-500/20 dark:bg-white dark:text-rose-950 dark:border-rose-200 dark:shadow-black/60 dark:ring-2 dark:ring-rose-500/30'
              : 'bg-stone-950 text-stone-100 border border-stone-800 shadow-stone-950/40 ring-1 ring-white/10 dark:bg-white dark:text-stone-950 dark:border-stone-200 dark:shadow-black/60 dark:ring-2 dark:ring-emerald-500/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {renderNotificationIcon()}
            <span className="text-[11px] font-semibold leading-tight truncate max-w-[170px] sm:max-w-[220px] text-stone-100 dark:text-stone-950 dark:font-bold">
              {notification.message}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {notification.action && (
              <button
                type="button"
                onClick={() => {
                  notification.action?.onClick();
                  onDismissNotification();
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors shadow-2xs bg-emerald-500 hover:bg-emerald-400 text-stone-950 dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:text-white"
              >
                {notification.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={onDismissNotification}
              className="p-0.5 rounded-full transition-colors cursor-pointer text-stone-400 hover:text-white hover:bg-white/10 dark:text-stone-500 dark:hover:text-stone-950 dark:hover:bg-stone-100"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3 stroke-[2.4]" />
            </button>
          </div>
        </div>
      ) : isCartPillVisible ? (
        /* ── Mode 2: Floating Dynamic Island Cart Pill (Compact & High-Contrast) ── */
        <div
          data-testid="dynamic-island-cart"
          className="pointer-events-auto rounded-full py-1 pl-1.5 pr-1 flex items-center justify-between gap-2 transition-all duration-200 shadow-xl animate-in fade-in slide-in-from-bottom-2 bg-stone-950 text-white border border-stone-800 shadow-stone-950/40 ring-1 ring-white/10 dark:bg-white dark:text-stone-950 dark:border-stone-200 dark:shadow-black/50 dark:ring-1 dark:ring-emerald-500/30"
        >
          {/* Clickable Cart Info Area */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            aria-label={`View cart with ${cartItemCount} items`}
          >
            {latestCartItem?.imageUrl ? (
              <img
                src={latestCartItem.imageUrl}
                alt={latestCartItem.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-stone-700 bg-stone-800 dark:border-stone-200 dark:bg-stone-100"
                loading="lazy"
              />
            ) : (
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-200">
                <ShoppingBag className="w-2.5 h-2.5 stroke-[2.4]" />
              </div>
            )}

            <div className="text-left min-w-0 flex items-center gap-1">
              <span className="font-heading font-extrabold text-[11px] leading-none whitespace-nowrap text-white dark:text-stone-950">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} ·{' '}
                <strong className="text-emerald-400 font-black dark:text-emerald-700">
                  ₹{totalPriceRupees}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-heading font-bold text-[9px] tracking-wide shrink-0 shadow-2xs bg-emerald-500 text-stone-950 hover:bg-emerald-400 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-800">
              <span>View</span>
              <ChevronRight className="w-2.5 h-2.5 stroke-[2.8]" />
            </div>
          </button>

          {/* Quick Dismiss Button to clear view of background */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCartPillDismissed(true);
            }}
            className="p-0.5 rounded-full transition-colors cursor-pointer text-stone-400 hover:text-white hover:bg-white/10 dark:text-stone-400 dark:hover:text-stone-900 dark:hover:bg-stone-100"
            aria-label="Dismiss cart pill"
            title="Hide cart preview"
          >
            <X className="w-3 h-3 stroke-[2.4]" />
          </button>
        </div>
      ) : null}
    </div>
  );
};
