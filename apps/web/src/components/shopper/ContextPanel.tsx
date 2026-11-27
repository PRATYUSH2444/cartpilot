import React from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { CartData, MandateData, LampStatus, UserAddress } from '../../types';

interface ContextPanelProps {
  cart: CartData | null;
  mandate?: MandateData | null;
  lampStatus?: LampStatus;
  lampReasonCode?: string;
  lampReasonText?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onInitiateCheckout: () => void;
  onUpdateDeliveryNote?: (note: string) => void;
  onOpenRules?: () => void;
  onOpenBrowse?: () => void;
  selectedAddress?: UserAddress | null;
  onOpenAddressModal?: () => void;
  isLoading?: boolean;
}

const formatINR = (paise: number) => {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const ContextPanel: React.FC<ContextPanelProps> = ({
  cart,
  isCollapsed,
  onToggleCollapse,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onInitiateCheckout,
  onOpenBrowse,
  isLoading = false,
}) => {
  if (isCollapsed) {
    return (
      <aside className="w-12 h-full bg-card dark:bg-card-top border-l border-brd flex flex-col items-center py-4 justify-between flex-shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl text-mut hover:text-ink hover:bg-paper transition-colors cursor-pointer"
          title="Expand Cart"
          aria-label="Expand cart"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4 py-4">
          <button
            onClick={onToggleCollapse}
            className="relative p-2.5 rounded-xl bg-paper hover:bg-paper/80 text-ink cursor-pointer"
            title="Active Cart"
          >
            <ShoppingBag className="w-5 h-5 text-[--brand]" />
            {(cart?.itemCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[--brand] text-white text-[10px] font-bold flex items-center justify-center font-sans">
                {cart?.itemCount}
              </span>
            )}
          </button>
        </div>

        <div className="w-2 h-2 rounded-full bg-[--brand] animate-pulse" />
      </aside>
    );
  }

  const items = cart?.items || [];
  const subtotalPaise = items.reduce(
    (sum, item) => sum + (item.itemTotalPaise || item.pricePaise * item.quantity),
    0
  );

  return (
    <aside
      data-testid="context-panel"
      className="w-full h-full min-h-0 bg-card dark:bg-card-top flex flex-col flex-shrink-0 z-20 shadow-sm transition-all overflow-hidden"
      aria-label="Live Shopping Cart"
    >
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-brd flex items-center justify-between flex-shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[--brand]" />
          <h3 className="font-heading font-bold text-sm text-ink">Cart</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[--brand-soft] text-[--brand] font-sans text-[11px] font-bold border border-[--brand]/20">
              {cart?.itemCount || items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              disabled={isLoading}
              className="text-xs text-mut hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer font-medium"
              title="Clear all items from cart"
            >
              Clear
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-mut hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer"
            title="Collapse cart panel"
            aria-label="Collapse cart panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Cart Items List (Products ONLY) ────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain overflow-x-hidden p-3.5 space-y-2.5">
        {items.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-paper flex items-center justify-center mx-auto text-mut">
              <ShoppingBag className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-xs text-mut">Your cart is currently empty</p>
            {onOpenBrowse && (
              <button
                onClick={onOpenBrowse}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[--brand] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Browse Catalog
              </button>
            )}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-xl bg-paper/60 border border-brd/80 flex items-center gap-2.5 hover:border-[--brand]/40 transition-colors"
            >
              {/* 48px Product Thumbnail */}
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-brd flex-shrink-0 bg-paper"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-paper border border-brd flex items-center justify-center flex-shrink-0 text-mut">
                  <ShoppingBag className="w-5 h-5 opacity-40" />
                </div>
              )}

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-ink line-clamp-2 leading-snug">
                  {item.name}
                </div>
                <div className="text-[11px] text-mut font-sans mt-0.5">
                  {item.packageSize ? `${item.packageSize} ${item.packageUnit} · ` : ''}
                  {formatINR(item.pricePaise)} each
                </div>
              </div>

              {/* Stepper & Line Total */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center border border-brd rounded-lg bg-card overflow-hidden">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        onRemoveItem(item.productId);
                      } else {
                        onUpdateQuantity(item.productId, item.quantity - 1);
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-paper text-mut hover:text-ink transition-colors cursor-pointer"
                    aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                    title={item.quantity === 1 ? 'Remove' : 'Decrease'}
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="w-7 text-center text-xs font-semibold tabular-nums text-ink select-none font-sans">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-paper text-mut hover:text-ink transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                    title="Increase"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right font-bold text-xs text-ink tabular-nums flex-shrink-0 min-w-[54px] font-sans">
                  {formatINR(item.itemTotalPaise || item.pricePaise * item.quantity)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Fixed Bottom Minimal Footer ─────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="p-4 border-t border-brd bg-card space-y-3 flex-shrink-0 shadow-lg">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-mut font-medium">Subtotal</span>
            <span className="font-heading font-black text-lg text-ink tabular-nums">
              {formatINR(subtotalPaise)}
            </span>
          </div>

          <p className="text-[11px] text-mut leading-tight">
            Delivery and taxes calculated at checkout
          </p>

          <button
            onClick={onInitiateCheckout}
            disabled={isLoading || items.length === 0}
            className="w-full py-3 px-4 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[--brand] hover:opacity-90 text-white shadow-md transition-all cursor-pointer min-h-[46px]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
