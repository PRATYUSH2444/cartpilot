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

  // Icon derivation for notification
  const renderNotificationIcon = () => {
    if (!notification) return null;
    if (notification.type === 'error') {
      return (
        <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }

    if (notification.message.toLowerCase().includes('wallet')) {
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }

    if (
      notification.message.toLowerCase().includes('ai') ||
      notification.message.toLowerCase().includes('assistant')
    ) {
      return (
        <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }

    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Action Notification & Cart"
      className="fixed bottom-[80px] lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm sm:max-w-md pointer-events-auto select-none transition-all duration-300 ease-out"
    >
      {/* ── Mode 1: Active Toast Notification ─────────────────────────────── */}
      {hasNotification && notification ? (
        <div
          role="status"
          aria-live="polite"
          className={`w-full rounded-2xl py-2.5 px-3.5 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            notification.type === 'error'
              ? 'bg-stone-900/95 text-white border-rose-500/30 shadow-rose-950/40 ring-1 ring-rose-500/20'
              : 'bg-stone-900/95 text-white border-emerald-500/30 shadow-black/50 ring-1 ring-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {renderNotificationIcon()}
            <span className="text-xs font-semibold leading-tight text-stone-100 truncate">
              {notification.message}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {notification.action && (
              <button
                type="button"
                onClick={() => {
                  notification.action?.onClick();
                  onDismissNotification();
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
              >
                {notification.action.label}
              </button>
            )}

            <button
              type="button"
              onClick={onDismissNotification}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : isCartPillVisible ? (
        /* ── Mode 2: Floating Dynamic Island Cart Pill ─────────────────────── */
        <button
          type="button"
          onClick={onOpenCart}
          data-testid="dynamic-island-cart"
          className="w-full bg-stone-900/95 dark:bg-stone-900/95 text-white border border-white/15 hover:border-emerald-500/50 rounded-2xl px-3 py-2.5 shadow-2xl shadow-black/50 backdrop-blur-xl flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.985] cursor-pointer group animate-in fade-in slide-in-from-bottom-2"
        >
          {/* Left: Thumbnail & Item Summary */}
          <div className="flex items-center gap-2.5 min-w-0">
            {latestCartItem?.imageUrl ? (
              <img
                src={latestCartItem.imageUrl}
                alt={latestCartItem.name}
                className="w-9 h-9 rounded-xl object-cover bg-white/10 shrink-0 border border-white/15"
                loading="lazy"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
              </div>
            )}

            <div className="text-left min-w-0">
              <div className="font-heading font-extrabold text-xs sm:text-sm text-white leading-tight truncate flex items-center gap-1.5">
                <span>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </span>
                <span className="text-stone-400">·</span>
                <span className="text-emerald-400 font-bold">₹{totalPriceRupees}</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-300 font-medium truncate mt-0.5">
                {latestCartItem?.name
                  ? `Added ${latestCartItem.name}`
                  : 'Next-day delivery slot confirmed'}
              </p>
            </div>
          </div>

          {/* Right: View Cart Pill CTA */}
          <div className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 group-hover:bg-emerald-400 text-stone-950 px-3 py-1.5 rounded-xl font-heading font-extrabold text-[11px] tracking-wide shrink-0 transition-colors shadow-sm">
            <span>View Cart</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.8]" />
          </div>
        </button>
      ) : null}
    </div>
  );
};
