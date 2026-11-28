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
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  notification,
  onDismissNotification,
  cart,
  activeTab,
  isAnyModalOpen,
  onOpenCart,
}) => {
  // Hide Dynamic Island completely if any full-screen modal or sheet is open
  if (isAnyModalOpen) return null;

  const hasNotification = Boolean(notification);
  const cartItemCount = cart?.itemCount || 0;
  const isCartPillVisible =
    !hasNotification &&
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
        <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 dark:bg-rose-100 dark:text-rose-700 dark:border-rose-300 flex items-center justify-center shrink-0">
          <AlertCircle className="w-3 h-3 stroke-[2.4]" />
        </div>
      );
    }

    if (notification.message.toLowerCase().includes('wallet')) {
      return (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-300 flex items-center justify-center shrink-0">
          <Wallet className="w-3 h-3 stroke-[2.4]" />
        </div>
      );
    }

    if (
      notification.message.toLowerCase().includes('ai') ||
      notification.message.toLowerCase().includes('assistant')
    ) {
      return (
        <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 dark:bg-purple-100 dark:text-purple-800 dark:border-purple-300 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 stroke-[2.4]" />
        </div>
      );
    }

    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-800 dark:border-emerald-300 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-3 h-3 stroke-[2.4]" />
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Action Notification & Cart"
      className="fixed bottom-[74px] lg:bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[calc(100%-2.5rem)] sm:max-w-md pointer-events-none select-none transition-all duration-300 ease-out flex justify-center"
    >
      {/* ── Mode 1: Active Toast Notification ─────────────────────────────── */}
      {hasNotification && notification ? (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto rounded-full py-1.5 pl-2.5 pr-1.5 flex items-center justify-between gap-2.5 shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === 'error'
              ? 'bg-stone-950 text-rose-200 border border-rose-800/80 shadow-rose-950/40 dark:bg-white dark:text-rose-900 dark:border-rose-200 dark:shadow-2xl dark:shadow-black/70 ring-1 ring-rose-500/20'
              : 'bg-stone-950 text-white border border-stone-800/90 shadow-stone-950/40 ring-1 ring-white/10 dark:bg-white dark:text-stone-950 dark:border-stone-200/90 dark:shadow-2xl dark:shadow-black/70 dark:ring-1 dark:ring-black/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {renderNotificationIcon()}
            <span className="text-[11px] sm:text-xs font-semibold leading-tight truncate max-w-[190px] sm:max-w-[260px] text-stone-100 dark:text-stone-900">
              {notification.message}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {notification.action && (
              <button
                type="button"
                onClick={() => {
                  notification.action?.onClick();
                  onDismissNotification();
                }}
                className="px-2 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:text-white text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
              >
                {notification.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={onDismissNotification}
              className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 dark:text-stone-400 dark:hover:text-stone-950 dark:hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3 stroke-[2.4]" />
            </button>
          </div>
        </div>
      ) : isCartPillVisible ? (
        /* ── Mode 2: Floating Dynamic Island Cart Pill ─────────────────────── */
        <button
          type="button"
          onClick={onOpenCart}
          data-testid="dynamic-island-cart"
          className="pointer-events-auto rounded-full py-1.5 pl-2 pr-2.5 flex items-center justify-between gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer group animate-in fade-in slide-in-from-bottom-2 bg-stone-950 text-white border border-stone-800 shadow-xl shadow-stone-900/40 ring-1 ring-white/10 dark:bg-white dark:text-stone-950 dark:border-stone-200/90 dark:shadow-2xl dark:shadow-black/70 dark:ring-1 dark:ring-black/10"
        >
          {/* Left: Thumbnail & Item Summary */}
          <div className="flex items-center gap-2 min-w-0">
            {latestCartItem?.imageUrl ? (
              <img
                src={latestCartItem.imageUrl}
                alt={latestCartItem.name}
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-stone-700 dark:border-stone-200 bg-stone-800 dark:bg-stone-100"
                loading="lazy"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 dark:bg-emerald-100 dark:text-emerald-700 dark:border-emerald-200 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3 h-3 stroke-[2.2]" />
              </div>
            )}

            <div className="text-left min-w-0 flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-[11px] sm:text-xs text-white dark:text-stone-950 leading-none whitespace-nowrap">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} ·{' '}
                <strong className="text-emerald-400 dark:text-emerald-700 font-black">
                  ₹{totalPriceRupees}
                </strong>
              </span>
              {latestCartItem?.name && (
                <span className="hidden sm:inline-block text-[10px] text-stone-300 dark:text-stone-500 font-medium truncate max-w-[110px]">
                  ({latestCartItem.name})
                </span>
              )}
            </div>
          </div>

          {/* Right: View Cart Pill CTA */}
          <div className="flex items-center gap-0.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:text-white px-2 py-0.5 rounded-full font-heading font-bold text-[10px] tracking-wide shrink-0 transition-colors shadow-xs">
            <span>View Cart</span>
            <ChevronRight className="w-3 h-3 stroke-[2.8]" />
          </div>
        </button>
      ) : null}
    </div>
  );
};
