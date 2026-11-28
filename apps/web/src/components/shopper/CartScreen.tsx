import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  Check,
  Ticket,
  Truck,
  CreditCard,
  Clock,
} from 'lucide-react';
import { CartData, Product } from '../../types';
import { PRICING_CONFIG, computePricing, CartItemData } from '../../config/pricingConfig';
import { getNextDayDeliveryDate } from '../../config/deliverySlots';

export interface CartScreenProps {
  cart: CartData | null;
  products?: Product[];
  onAddToCart?: (productId: string, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onUpdateDeliveryNote?: (note: string) => void;
  onExploreProducts: () => void;
  onOpenCoupons?: () => void;
  appliedCoupon?: { code: string; discountPaise: number } | null;
  onApplyCoupon?: (code: string) => boolean;
  onRemoveCoupon?: () => void;
  selectedDeliverySlot?: 'morning' | 'evening';
  onSelectDeliverySlot?: (slot: 'morning' | 'evening') => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onExploreProducts,
  onOpenCoupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onBack,
  isLoading = false,
}) => {
  const [localCouponCode, setLocalCouponCode] = useState('');
  const [localCouponError, setLocalCouponError] = useState<string | null>(null);

  const items = cart?.items || [];
  const { formattedDate } = getNextDayDeliveryDate();

  // Map to unified CartItemData format for pure pricing computation
  const pricingItems: CartItemData[] = items.map((item) => ({
    productId: item.productId,
    name: item.name,
    unitLabel: `${item.packageSize} ${item.packageUnit}`,
    price: (item.pricePaise || 0) / 100,
    mrp: item.pricePaise ? Math.round((item.pricePaise * 1.15) / 100) : undefined,
    qty: item.quantity,
    image: item.imageUrl || '',
  }));

  const couponDiscountRupees = appliedCoupon ? appliedCoupon.discountPaise / 100 : 0;

  // Single Source of Truth for all numbers on the cart page
  const pricing = computePricing({
    items: pricingItems,
    couponDiscount: couponDiscountRupees,
    config: PRICING_CONFIG,
  });

  const handleFormApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = localCouponCode.trim().toUpperCase();
    if (!clean) return;

    if (appliedCoupon && appliedCoupon.code === clean) {
      setLocalCouponError(`Coupon '${clean}' is already applied.`);
      return;
    }

    if (onApplyCoupon) {
      const success = onApplyCoupon(clean);
      if (success) {
        setLocalCouponCode('');
        setLocalCouponError(null);
      } else {
        setLocalCouponError(`Invalid or ineligible coupon code: ${clean}`);
      }
    } else {
      setLocalCouponError('Coupon system unavailable.');
    }
  };

  return (
    <div className="flex-1 w-full h-full lg:h-[calc(100dvh-72px)] overflow-y-auto lg:overflow-hidden bg-stone-50/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      <style>{`
        .cart-items-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .cart-items-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cart-items-scroll::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 9999px;
        }
        .dark .cart-items-scroll::-webkit-scrollbar-thumb {
          background: #047857;
        }
      `}</style>

      {/* ── Main Container: Responsive scrolling on mobile, zero outer scrolling on desktop ── */}
      <div className="max-w-6xl w-full lg:h-full mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex flex-col min-h-0">
        {/* ── 1. Static Title Bar + 3-Step Stepper (Interactive & Prominent) ── */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5">
          {/* Left: Back Button + Title + Clear */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack || onExploreProducts}
                className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer shadow-2xs flex-shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg text-stone-900 dark:text-white leading-tight truncate">
                    Your Cart
                  </h1>
                  {pricing.itemCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-bold font-mono">
                      {pricing.itemCount} {pricing.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Review items & choose delivery at checkout
                </p>
              </div>
            </div>
            {pricing.itemCount > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                disabled={isLoading}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-900/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Right: Interactive 3-Step Progress Stepper */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2.5 bg-white dark:bg-stone-900 px-3.5 py-2 sm:py-1.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            {/* Step 1: Cart (Active - Emerald) */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs ring-2 ring-emerald-500/20">
                <ShoppingBag className="w-2.5 h-2.5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">1. Cart</span>
            </div>

            <div className="flex-1 sm:w-8 sm:flex-none h-0.5 bg-emerald-500/80 mx-1 sm:mx-0 rounded-full" />

            {/* Step 2: Delivery (Clickable to proceed) */}
            <button
              type="button"
              onClick={onProceedToCheckout}
              disabled={pricing.itemCount === 0}
              className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer group flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Proceed to Delivery"
            >
              <div className="w-5 h-5 rounded-full bg-stone-150 dark:bg-stone-800 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-800 dark:group-hover:bg-emerald-950 flex items-center justify-center text-[10px] font-bold transition-all">
                <Truck className="w-2.5 h-2.5" />
              </div>
              <span className="text-xs font-medium group-hover:font-semibold">
                2. Delivery
              </span>
            </button>

            <div className="flex-1 sm:w-8 sm:flex-none h-0.5 bg-stone-200 dark:bg-stone-800 mx-1 sm:mx-0 rounded-full" />

            {/* Step 3: Payment (Clickable to proceed) */}
            <button
              type="button"
              onClick={onProceedToCheckout}
              disabled={pricing.itemCount === 0}
              className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer group flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Proceed to Payment"
            >
              <div className="w-5 h-5 rounded-full bg-stone-150 dark:bg-stone-800 text-stone-500 group-hover:bg-emerald-100 group-hover:text-emerald-800 dark:group-hover:bg-emerald-950 flex items-center justify-center text-[10px] font-bold transition-all">
                <CreditCard className="w-2.5 h-2.5" />
              </div>
              <span className="text-xs font-medium group-hover:font-semibold">
                3. Payment
              </span>
            </button>
          </div>
        </div>

        {/* ── Empty Cart State ──────────────────────────────────────────────── */}
        {pricing.itemCount === 0 ? (
          <div className="my-auto rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-8 sm:p-10 text-center space-y-4 max-w-sm mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-2xs">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-bold text-lg text-stone-900 dark:text-white">Your cart is empty</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Explore our catalog or ask CartPilot AI to curate a custom shopping list.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreProducts}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-700/25 transition-all cursor-pointer active:scale-95"
            >
              <span>Browse Groceries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── 2-Column Grid Layout: Clean, Spacious & Responsive ─────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-stretch lg:flex-1 lg:min-h-0 pb-16 lg:pb-2">
            {/* ══════════════════════════════════════════════════════════════════
                LEFT COLUMN (7 cols): Items Card with Dedicated Internal Scroller
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 sm:p-4 shadow-2xs lg:h-full lg:min-h-0">
              {/* Items Card Header */}
              <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-stone-150 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                    Items In Basket
                  </h2>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/60">
                    {pricing.itemCount} units
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-mono">
                  Subtotal: <strong className="font-bold text-emerald-800 dark:text-emerald-300 text-sm sm:text-base">₹{pricing.itemsTotal}</strong>
                </span>
              </div>

              {/* ── Internal Product Scroller (Prevents infinite page stretch, scrolls inside card) ── */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800/80 pr-1.5 my-1.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto cart-items-scroll">
                {items.map((item) => {
                  const linePriceRupees = Math.round((item.pricePaise || 0) / 100);
                  const lineTotalRupees = Math.round(
                    (item.itemTotalPaise || (item.pricePaise || 0) * item.quantity) / 100
                  );

                  return (
                    <div
                      key={item.productId}
                      className="py-3 first:pt-1.5 last:pb-1.5 transition-colors group"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        {/* Compact Product Thumbnail */}
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-2xs mt-0.5">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-lg">🛒</span>
                          )}
                        </div>

                        {/* Content Area: Title on Top, Attributes & Controls Below */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: Full Product Title + Line Total Price */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.name}
                            </h3>
                            <span className="font-mono font-black text-xs sm:text-sm text-stone-900 dark:text-white tabular-nums flex-shrink-0 ml-2">
                              ₹{lineTotalRupees}
                            </span>
                          </div>

                          {/* Row 2: Package Size / Unit Price + Quantity Stepper + Trash */}
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
                                {item.packageSize} {item.packageUnit}
                              </span>
                              <span className="text-[10px] text-stone-300 dark:text-zinc-600">•</span>
                              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/50">
                                ₹{linePriceRupees} each
                              </span>
                            </div>

                            {/* Stepper + Delete Action */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                              <div className="flex items-center gap-0.5 sm:gap-1 bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 p-0.5 rounded-lg text-xs font-semibold border border-stone-200/80 dark:border-zinc-800 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      onRemoveItem(item.productId);
                                    } else {
                                      onUpdateQuantity(item.productId, item.quantity - 1);
                                    }
                                  }}
                                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-md bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-zinc-700 flex items-center justify-center font-bold active:scale-90 transition-all cursor-pointer shadow-2xs"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3 stroke-[2.4px]" />
                                </button>
                                <span className="font-mono px-1.5 min-w-[18px] text-center text-xs tabular-nums font-bold text-stone-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={item.quantity >= PRICING_CONFIG.maxQtyPerItem}
                                  onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                                  className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-md bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:bg-zinc-700 flex items-center justify-center font-bold active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3 stroke-[2.4px]" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.productId)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Remove item"
                                aria-label={`Remove ${item.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Executive Delivery Status Badge (Fixed at bottom of left card) ── */}
              <div className="flex-shrink-0 pt-2.5 border-t border-stone-150 dark:border-stone-800">
                {pricing.remainingForFree === 0 ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-900 text-white shadow-md border border-emerald-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-black shadow-2xs ring-1 ring-emerald-400/40">
                        ✓
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-xs sm:text-sm leading-tight block text-white">
                          Complimentary Next-Day Delivery Unlocked!
                        </span>
                        <span className="text-[11px] text-emerald-200/90 mt-0.5 block font-medium">
                          Delivery fee waived for your order
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider font-extrabold bg-emerald-500/25 px-2.5 py-1 rounded-lg text-emerald-200 border border-emerald-400/30 shadow-2xs">
                      ₹40 WAIVED
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                        <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          Add <strong className="font-bold text-emerald-800 dark:text-emerald-300">₹{pricing.remainingForFree}</strong> more for <strong className="font-semibold text-stone-900 dark:text-white">Free Delivery</strong>
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs tabular-nums">
                        ₹{pricing.subtotal} / ₹{PRICING_CONFIG.freeDeliveryThreshold}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((pricing.subtotal / PRICING_CONFIG.freeDeliveryThreshold) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 3. Add More Items Button (Fixed at bottom of left card) ── */}
              <div className="flex-shrink-0 pt-2.5">
                <button
                  type="button"
                  onClick={onExploreProducts}
                  className="w-full h-10 px-4 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-300 stroke-[2.5px]" />
                  <span>Add more items</span>
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT COLUMN (5 cols): Coupon Card + Order Summary (Static)
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 flex flex-col justify-start gap-3 flex-shrink-0">
              {/* ── 4. Coupon Card ────────────────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white uppercase tracking-wider">
                      Promotions & Coupons
                    </span>
                  </div>
                  {onOpenCoupons && (
                    <button
                      type="button"
                      onClick={onOpenCoupons}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Available &gt;</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-emerald-950 dark:text-emerald-200 block leading-tight">
                          '{appliedCoupon.code}' Applied
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          Saved ₹{pricing.couponDiscount} on this basket
                        </span>
                      </div>
                    </div>
                    {onRemoveCoupon && (
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFormApplyCoupon} className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      placeholder="ENTER CODE (e.g. WELCOME)"
                      value={localCouponCode}
                      onChange={(e) => {
                        setLocalCouponCode(e.target.value.toUpperCase());
                        setLocalCouponError(null);
                      }}
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-xs"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {localCouponError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {localCouponError}
                  </p>
                )}
              </div>

              {/* ── 5. Order Summary Card (Rich Emerald Styling) ──────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-150 dark:border-stone-800">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                    Order Summary
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    {pricing.itemCount} units
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  {/* Items Subtotal */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      ₹{pricing.itemsTotal}
                    </span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      {pricing.deliveryFee === 0 ? (
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">FREE</span>
                      ) : (
                        `₹${pricing.deliveryFee}`
                      )}
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Platform Handling</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white tabular-nums">
                      ₹{pricing.platformFee}
                    </span>
                  </div>

                  {/* Coupon Discount */}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono tabular-nums">-₹{pricing.couponDiscount}</span>
                    </div>
                  )}

                  {/* Divider & Total */}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-white block">
                        Total Payable
                      </span>
                      <span className="text-[11px] text-stone-400 block font-normal">
                        All taxes & fees included
                      </span>
                    </div>
                    <span className="font-black text-2xl sm:text-3xl text-emerald-800 dark:text-emerald-300 font-mono tabular-nums tracking-tight">
                      ₹{pricing.total}
                    </span>
                  </div>

                  {/* Total Savings Pill */}
                  {pricing.savings > 0 && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                      <span>Total Savings on Order</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                        ₹{pricing.savings}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  disabled={pricing.itemCount === 0 || isLoading}
                  className="w-full h-12 px-5 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.4px]" />
                </button>

                {/* Next-Day Dispatch Guarantee Micro-Strip */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 pt-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Delivery Window: {formattedDate} (IST)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
