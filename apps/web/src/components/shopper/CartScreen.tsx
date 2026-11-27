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
} from 'lucide-react';
import { CartData, Product } from '../../types';
import { PRICING_CONFIG, computePricing, CartItemData } from '../../config/pricingConfig';

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
    <div className="flex-1 w-full min-h-screen bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans pb-28 lg:pb-16">
      {/* ── Main Container (max-width: 1200px) ─────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── 1. Page Title Bar + 3-Step Stepper (Cart -> Delivery -> Payment) ──── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {/* Left: Back Button + Title + Clear */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack || onExploreProducts}
              className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shadow-2xs"
              aria-label="Back to store"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white leading-tight">
                  Your Cart {pricing.itemCount > 0 && `(${pricing.itemCount} ${pricing.itemCount === 1 ? 'item' : 'items'})`}
                </h1>
                {pricing.itemCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    disabled={isLoading}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Review your items and proceed to checkout.
              </p>
            </div>
          </div>

          {/* Right: 3-Step Progress Stepper (Cart -> Delivery -> Payment) */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-stone-900 px-4 py-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            {/* Step 1: Cart (Active) */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">Cart</span>
            </div>

            <div className="w-8 sm:w-12 h-0.5 bg-stone-200 dark:bg-stone-800" />

            {/* Step 2: Delivery (Pending - selects at checkout) */}
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-xs font-bold">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 hidden xs:inline">
                Delivery
              </span>
            </div>

            <div className="w-8 sm:w-12 h-0.5 bg-stone-200 dark:bg-stone-800" />

            {/* Step 3: Payment (Pending) */}
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-xs font-bold">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 hidden xs:inline">
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* ── Empty Cart State ──────────────────────────────────────────────── */}
        {pricing.itemCount === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 mx-auto">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="font-extrabold text-xl text-stone-900 dark:text-white">Your cart is empty</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
                Explore our catalog of fresh groceries, dairy, and fruits, or ask CartPilot AI to curate a custom shopping list.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreProducts}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <span>Browse Groceries</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ── 2-Column Grid Layout: minmax(0, 1fr) 380px ────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ══════════════════════════════════════════════════════════════════
                LEFT COLUMN (8 cols): Cart Items Card with Free Delivery & Add More
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-8 space-y-5">
              {/* ── 2. Cart Items Card ──────────────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800/80">
                  <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                    Items ({pricing.itemCount})
                  </h2>
                  <span className="text-xs text-stone-400 font-mono">
                    Subtotal: ₹{pricing.itemsTotal}
                  </span>
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {items.map((item) => {
                    const linePriceRupees = Math.round((item.pricePaise || 0) / 100);
                    const lineTotalRupees = Math.round(
                      (item.itemTotalPaise || (item.pricePaise || 0) * item.quantity) / 100
                    );

                    return (
                      <div
                        key={item.productId}
                        className="py-3.5 first:pt-0 last:pb-4 flex items-center justify-between gap-3 sm:gap-4"
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xl">🛒</span>
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-stone-400">
                              {item.packageSize} {item.packageUnit} · ₹{linePriceRupees} each
                            </p>
                            <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-white block font-mono">
                              ₹{lineTotalRupees}
                            </span>
                          </div>
                        </div>

                        {/* Right: Quantity Stepper & Trash Icon */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Stepper Pill */}
                          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-extrabold border border-emerald-200/70 dark:border-emerald-800/60">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  onRemoveItem(item.productId);
                                } else {
                                  onUpdateQuantity(item.productId, item.quantity - 1);
                                }
                              }}
                              className="p-1 hover:opacity-80 cursor-pointer min-h-[24px] min-w-[20px] flex items-center justify-center text-emerald-800 dark:text-emerald-300"
                              aria-label="Decrease quantity"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-3 h-3 text-rose-500" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </button>
                            <span className="font-mono px-1 min-w-[16px] text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= PRICING_CONFIG.maxQtyPerItem}
                              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                              className="p-1 hover:opacity-80 cursor-pointer min-h-[24px] min-w-[20px] flex items-center justify-center text-emerald-800 dark:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Trash Button */}
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.productId)}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200/50"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Free Delivery Tracker Bar (Inside items card) */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {pricing.remainingForFree === 0
                          ? '🎉 You have unlocked FREE delivery!'
                          : `Add ₹${pricing.remainingForFree} more for FREE delivery`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-stone-500 dark:text-stone-400">
                      ₹{pricing.subtotal} / ₹{PRICING_CONFIG.freeDeliveryThreshold}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${pricing.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* ── 3. "+ Add more products" Button (Inside items card, below progress bar) ── */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                  <button
                    type="button"
                    onClick={onExploreProducts}
                    className="w-full h-11 px-4 rounded-xl bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#333333] hover:bg-stone-200/60 dark:hover:bg-stone-800 text-[#1A1A1A] dark:text-[#EDEDED] font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                    <span>+ Add more products</span>
                  </button>
                  {pricing.remainingForFree > 0 && (
                    <p className="text-center text-[11px] text-stone-500 dark:text-stone-400">
                      ₹{pricing.remainingForFree} away from free delivery
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT COLUMN (4 cols / 380px): Coupon Card + Order Summary
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-[88px]">
              {/* ── 4. Coupon Card ────────────────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                      Apply Coupon
                    </span>
                  </div>
                  {onOpenCoupons && (
                    <button
                      type="button"
                      onClick={onOpenCoupons}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Coupons &gt;</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 block">
                          '{appliedCoupon.code}' applied
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          You saved ₹{pricing.couponDiscount}!
                        </span>
                      </div>
                    </div>
                    {onRemoveCoupon && (
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFormApplyCoupon} className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      value={localCouponCode}
                      onChange={(e) => {
                        setLocalCouponCode(e.target.value.toUpperCase());
                        setLocalCouponError(null);
                      }}
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {localCouponError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {localCouponError}
                  </p>
                )}
              </div>

              {/* ── 5. Order Summary Card + Proceed to Checkout CTA ────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  {/* Items Count & Subtotal */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Items ({pricing.itemCount})</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      ₹{pricing.itemsTotal}
                    </span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      {pricing.deliveryFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">FREE</span>
                      ) : (
                        `₹${pricing.deliveryFee}`
                      )}
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Platform Fee</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      ₹{pricing.platformFee}
                    </span>
                  </div>

                  {/* Coupon Discount (if applied) */}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono">-₹{pricing.couponDiscount}</span>
                    </div>
                  )}

                  {/* Divider Line */}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                    <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="font-black text-2xl text-emerald-700 dark:text-emerald-400 font-mono">
                      ₹{pricing.total}
                    </span>
                  </div>

                  {/* User Savings line if any */}
                  {pricing.savings > 0 && (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                      You save ₹{pricing.savings} on this order
                    </p>
                  )}
                </div>

                {/* Single Prominent Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  disabled={pricing.itemCount === 0 || isLoading}
                  className="w-full h-12 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Bottom Checkout Bar (< 768px) ─────────────────────────── */}
      {pricing.itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3.5 z-40 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
              Total Amount
            </span>
            <span className="font-mono font-black text-lg text-emerald-700 dark:text-emerald-400">
              ₹{pricing.total}
            </span>
          </div>
          <button
            type="button"
            onClick={onProceedToCheckout}
            disabled={isLoading}
            className="flex-1 max-w-[220px] h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
