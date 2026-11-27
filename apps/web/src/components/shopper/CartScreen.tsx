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
    <div className="flex-1 w-full min-h-[calc(100dvh-72px)] bg-stone-50/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans pb-24 lg:pb-10">
      <style>{`
        .cart-items-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .cart-items-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cart-items-scroll::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 9999px;
        }
        .dark .cart-items-scroll::-webkit-scrollbar-thumb {
          background: #44403c;
        }
      `}</style>

      {/* ── Main Container: max-w-6xl for disciplined, non-scrolling desktop footprint ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3.5">
        {/* ── 1. Compact Header Bar + 3-Step Stepper ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          {/* Left: Back Button + Title + Clear */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack || onExploreProducts}
              className="p-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-850 transition-colors cursor-pointer shadow-2xs"
              aria-label="Back to store"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl text-stone-900 dark:text-white leading-tight">
                  Your Cart {pricing.itemCount > 0 && `(${pricing.itemCount} ${pricing.itemCount === 1 ? 'item' : 'items'})`}
                </h1>
                {pricing.itemCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    disabled={isLoading}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Review items & choose delivery at checkout
              </p>
            </div>
          </div>

          {/* Right: Sleek Monochrome 3-Step Progress Stepper */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
            {/* Step 1: Cart (Active - Obsidian Black) */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 flex items-center justify-center text-[10px] font-bold shadow-2xs">
                <ShoppingBag className="w-3 h-3" />
              </div>
              <span className="text-xs font-bold text-stone-900 dark:text-white">Cart</span>
            </div>

            <div className="w-6 sm:w-8 h-0.5 bg-stone-200 dark:bg-stone-800" />

            {/* Step 2: Delivery (Pending) */}
            <div className="flex items-center gap-1.5 opacity-50">
              <div className="w-5 h-5 rounded-full bg-stone-150 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-[10px] font-bold">
                <Truck className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 hidden xs:inline">
                Delivery
              </span>
            </div>

            <div className="w-6 sm:w-8 h-0.5 bg-stone-200 dark:bg-stone-800" />

            {/* Step 3: Payment (Pending) */}
            <div className="flex items-center gap-1.5 opacity-50">
              <div className="w-5 h-5 rounded-full bg-stone-150 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-[10px] font-bold">
                <CreditCard className="w-3 h-3" />
              </div>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 hidden xs:inline">
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* ── Empty Cart State ──────────────────────────────────────────────── */}
        {pricing.itemCount === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-10 text-center space-y-3 max-w-md mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 mx-auto">
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
              className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <span>Browse Groceries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ── 2-Column Grid Layout: Compact, Symmetrical, Non-Scrolling ──────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
            {/* ══════════════════════════════════════════════════════════════════
                LEFT COLUMN (7 cols): Items Card with Internal Product Scroller
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* ── 2. Cart Items Card ──────────────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 sm:p-4 shadow-2xs space-y-3">
                {/* Items Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-150 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-wider">
                      Items In Basket
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                      {pricing.itemCount} units
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    Subtotal: <strong className="font-semibold text-stone-900 dark:text-white">₹{pricing.itemsTotal}</strong>
                  </span>
                </div>

                {/* ── Internal Product Scroller (Disciplined Height for 10-50 Items) ── */}
                <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto cart-items-scroll divide-y divide-stone-100 dark:divide-stone-800/80 pr-1">
                  {items.map((item) => {
                    const linePriceRupees = Math.round((item.pricePaise || 0) / 100);
                    const lineTotalRupees = Math.round(
                      (item.itemTotalPaise || (item.pricePaise || 0) * item.quantity) / 100
                    );

                    return (
                      <div
                        key={item.productId}
                        className="py-2.5 first:pt-0 last:pb-1 flex items-center justify-between gap-3 group"
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-800 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-base">🛒</span>
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <h3 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                              {item.packageSize} {item.packageUnit} · ₹{linePriceRupees}
                            </p>
                          </div>
                        </div>

                        {/* Right: Quantity Stepper, Price & Trash */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {/* Compact Monochrome Stepper Pill */}
                          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-1.5 py-0.5 rounded-lg text-xs font-semibold border border-stone-200/70 dark:border-stone-750">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  onRemoveItem(item.productId);
                                } else {
                                  onUpdateQuantity(item.productId, item.quantity - 1);
                                }
                              }}
                              className="p-1 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono px-1 min-w-[16px] text-center text-xs tabular-nums font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= PRICING_CONFIG.maxQtyPerItem}
                              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                              className="p-1 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Line Total */}
                          <span className="font-mono font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 min-w-[48px] text-right tabular-nums">
                            ₹{lineTotalRupees}
                          </span>

                          {/* Subtle Trash Icon */}
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.productId)}
                            className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Executive Delivery Status Badge (Replaces Playful Progress Bar) ── */}
                <div className="pt-2.5 border-t border-stone-150 dark:border-stone-800">
                  {pricing.remainingForFree === 0 ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-850 dark:border dark:border-stone-750 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">
                          ✓
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-xs leading-none block">
                            Complimentary Next-Day Delivery Unlocked
                          </span>
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Delivery fee waived for your order
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider font-bold bg-white/10 dark:bg-white/5 px-2 py-0.5 rounded text-stone-300">
                        ₹40 WAIVED
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200/80 dark:border-stone-800 text-xs">
                      <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                        <Truck className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                        <span className="text-[11px] sm:text-xs">
                          Add <strong className="font-bold text-stone-900 dark:text-white">₹{pricing.remainingForFree}</strong> more to unlock <span className="font-semibold text-stone-900 dark:text-white">Complimentary Delivery</span>
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-stone-500 dark:text-stone-400 text-[11px] tabular-nums">
                        ₹{pricing.subtotal} / ₹{PRICING_CONFIG.freeDeliveryThreshold}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── 3. Add More Items Button (Clean, No Duplicate Plus) ── */}
                <button
                  type="button"
                  onClick={onExploreProducts}
                  className="w-full h-9 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-750 text-stone-800 dark:text-stone-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Add more items</span>
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT COLUMN (5 cols): Coupon Card + Order Summary
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-[80px]">
              {/* ── 4. Coupon Card (Monochrome & Compact) ──────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                    <span className="font-bold text-xs text-stone-900 dark:text-white uppercase tracking-wider">
                      Promotions & Coupons
                    </span>
                  </div>
                  {onOpenCoupons && (
                    <button
                      type="button"
                      onClick={onOpenCoupons}
                      className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Ticket className="w-3 h-3" />
                      <span>View Available &gt;</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-stone-900 dark:text-white" />
                      <div>
                        <span className="font-mono font-black text-xs text-stone-900 dark:text-white block">
                          '{appliedCoupon.code}' Applied
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Savings of ₹{pricing.couponDiscount} applied to basket
                        </span>
                      </div>
                    </div>
                    {onRemoveCoupon && (
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer px-1.5 py-0.5"
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
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-xs font-bold transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
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

              {/* ── 5. Order Summary Card (Clean, Tabular & Premium) ────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-150 dark:border-stone-800">
                  <h3 className="font-bold text-xs text-stone-900 dark:text-white uppercase tracking-wider">
                    Order Summary
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {pricing.itemCount} units
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Items Subtotal */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-stone-900 dark:text-white tabular-nums">
                      ₹{pricing.itemsTotal}
                    </span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Delivery Fee</span>
                    <span className="font-mono font-semibold text-stone-900 dark:text-white tabular-nums">
                      {pricing.deliveryFee === 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                      ) : (
                        `₹${pricing.deliveryFee}`
                      )}
                    </span>
                  </div>

                  {/* Platform Fee */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Platform Handling</span>
                    <span className="font-mono font-semibold text-stone-900 dark:text-white tabular-nums">
                      ₹{pricing.platformFee}
                    </span>
                  </div>

                  {/* Coupon Discount */}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono tabular-nums">-₹{pricing.couponDiscount}</span>
                    </div>
                  )}

                  {/* Hairline Divider & Total */}
                  <div className="pt-2.5 border-t border-stone-200 dark:border-stone-800 flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-sm text-stone-900 dark:text-white block">
                        Total Payable
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Inclusive of all taxes & handling
                      </span>
                    </div>
                    <span className="font-black text-2xl text-stone-900 dark:text-white font-mono tabular-nums tracking-tight">
                      ₹{pricing.total}
                    </span>
                  </div>

                  {/* Total Savings Pill (Refined, not loud) */}
                  {pricing.savings > 0 && (
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-850 text-stone-700 dark:text-stone-300 text-[11px] font-medium flex items-center justify-between border border-stone-200/60 dark:border-stone-800">
                      <span>Total Savings on Basket</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{pricing.savings}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Proceed to Checkout CTA (Sleek Obsidian Luxury Button) */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  disabled={pricing.itemCount === 0 || isLoading}
                  className="w-full h-11 px-5 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-40"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Next-Day Dispatch Guarantee Micro-Strip */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Delivery Window: {formattedDate} (IST)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Bottom Checkout Bar (< 768px) ─────────────────────────── */}
      {pricing.itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 p-3 z-40 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
              Total Payable
            </span>
            <span className="font-mono font-black text-lg text-stone-900 dark:text-white">
              ₹{pricing.total}
            </span>
          </div>
          <button
            type="button"
            onClick={onProceedToCheckout}
            disabled={isLoading}
            className="flex-1 max-w-[200px] h-10 px-4 rounded-xl bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
