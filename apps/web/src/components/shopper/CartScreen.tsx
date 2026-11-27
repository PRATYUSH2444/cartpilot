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
  Sun,
  Moon,
  Info,
  Sparkles,
  Headphones,
  CreditCard,
  FileText,
} from 'lucide-react';
import { CartData, Product } from '../../types';

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

// Fallback recommendation items if products list is empty
const DEFAULT_RECOMMENDATIONS: Array<{
  _id: string;
  name: string;
  packageSize: number;
  packageUnit: string;
  pricePaise: number;
  imageUrl?: string;
  category: string;
}> = [
  {
    _id: 'rec-eggs-6',
    name: 'Country Eggs',
    packageSize: 6,
    packageUnit: 'pcs',
    pricePaise: 5400,
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=160&q=80',
    category: 'DAIRY_EGGS',
  },
  {
    _id: 'rec-banana-1kg',
    name: 'Fresh Banana',
    packageSize: 1,
    packageUnit: 'kg',
    pricePaise: 4800,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=160&q=80',
    category: 'FRUITS',
  },
  {
    _id: 'rec-tomato-500g',
    name: 'Fresh Tomato',
    packageSize: 500,
    packageUnit: 'g',
    pricePaise: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160&q=80',
    category: 'VEGETABLES',
  },
];

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  products = [],
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onUpdateDeliveryNote,
  onExploreProducts,
  onOpenCoupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  selectedDeliverySlot = 'morning',
  onSelectDeliverySlot,
  onBack,
  isLoading = false,
}) => {
  const [localCouponCode, setLocalCouponCode] = useState('');
  const [localCouponError, setLocalCouponError] = useState<string | null>(null);
  const [internalSlot, setInternalSlot] = useState<'morning' | 'evening'>(selectedDeliverySlot);
  const [noteText, setNoteText] = useState(cart?.deliveryNote || '');
  const [showDeliveryTooltip, setShowDeliveryTooltip] = useState(false);
  const [showPlatformTooltip, setShowPlatformTooltip] = useState(false);

  const activeSlot = onSelectDeliverySlot ? selectedDeliverySlot : internalSlot;
  const handleSlotChange = (slot: 'morning' | 'evening') => {
    setInternalSlot(slot);
    if (onSelectDeliverySlot) {
      onSelectDeliverySlot(slot);
    }
  };

  const itemCount = cart?.itemCount || 0;
  const items = cart?.items || [];

  // Local fallback coupon handler if parent didn't supply onApplyCoupon
  const handleFormApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = localCouponCode.trim().toUpperCase();
    if (!clean) return;

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

  // Pricing calculations
  const subtotalPaise = cart?.pricing?.subtotalPaise ?? items.reduce(
    (sum, item) => sum + (item.itemTotalPaise || item.pricePaise * item.quantity),
    0
  );
  // Free delivery threshold is ₹500 (50,000 paise)
  const deliveryFeePaise = subtotalPaise >= 50000 ? 0 : 4000;
  const platformFeePaise = 500; // ₹5 standard platform fee
  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise + platformFeePaise - discountPaise);

  const subtotalRupees = (subtotalPaise / 100).toFixed(0);
  const deliveryRupees = (deliveryFeePaise / 100).toFixed(0);
  const platformFeeRupees = (platformFeePaise / 100).toFixed(0);
  const discountRupees = (discountPaise / 100).toFixed(0);
  const totalRupees = (totalPaise / 100).toFixed(0);

  // Free delivery progress
  const shortfallPaise = Math.max(0, 50000 - subtotalPaise);
  const shortfallRupees = Math.ceil(shortfallPaise / 100);
  const progressPercent = Math.min(100, Math.round((subtotalPaise / 50000) * 100));

  // Determine smart recommendations (filter out items already in cart)
  const inCartProductIds = new Set(items.map((i) => i.productId));
  const availableCatalog = products.filter((p) => !inCartProductIds.has(p._id));
  const recommendationItems =
    availableCatalog.length >= 3
      ? availableCatalog.slice(0, 3)
      : [
          ...availableCatalog,
          ...DEFAULT_RECOMMENDATIONS.filter(
            (r) => !inCartProductIds.has(r._id) && !availableCatalog.some((c) => c.name === r.name)
          ),
        ].slice(0, 3);

  return (
    <div className="flex-1 w-full min-h-screen bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans pb-24 lg:pb-16">
      {/* ── Main Container ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Header Row with Title & 3-Step Progress Tracker ───────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {/* Left: Back Arrow + Page Title */}
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
                  Your Cart {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
                </h1>
                {itemCount > 0 && (
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
                Review your items, choose a delivery slot and proceed to checkout.
              </p>
            </div>
          </div>

          {/* Right: 3-Step Progress Stepper (Cart -> Checkout -> Payment) */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-stone-900 px-4 py-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            {/* Step 1: Cart (Active) */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">Cart</span>
            </div>

            <div className="w-8 sm:w-12 h-0.5 bg-stone-200 dark:bg-stone-800" />

            {/* Step 2: Checkout (Pending) */}
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-xs font-bold">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 hidden xs:inline">
                Checkout
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
        {itemCount === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ══════════════════════════════════════════════════════════════════
                LEFT COLUMN (8 cols): Delivery Slot, Items, Free Delivery, Recommendations
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-8 space-y-5">
              {/* ── Box 1: Choose Delivery Slot ──────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Title & Description */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white leading-tight">
                        Choose Delivery Slot
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Get your order at your preferred time
                      </p>
                    </div>
                  </div>

                  {/* Morning vs Evening Radio Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">
                    {/* Morning Slot */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSlotChange('morning')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleSlotChange('morning');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        activeSlot === 'morning'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600/30'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20 hover:border-stone-300'
                      }`}
                    >
                      {/* Radio Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          activeSlot === 'morning'
                            ? 'border-emerald-600 bg-white dark:bg-stone-900'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {activeSlot === 'morning' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>

                      <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />

                      <div className="min-w-0">
                        <span className="block font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                          Morning Delivery
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          6:00 AM – 12:00 PM
                        </span>
                      </div>
                    </div>

                    {/* Evening Slot */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSlotChange('evening')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleSlotChange('evening');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        activeSlot === 'evening'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-600/30'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20 hover:border-stone-300'
                      }`}
                    >
                      {/* Radio Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          activeSlot === 'evening'
                            ? 'border-emerald-600 bg-white dark:bg-stone-900'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {activeSlot === 'evening' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>

                      <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />

                      <div className="min-w-0">
                        <span className="block font-bold text-xs sm:text-sm text-stone-900 dark:text-white leading-tight">
                          Evening Delivery
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          5:00 PM – 9:00 PM
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Box 2: Cart Items List & Free Delivery Tracker ──────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
                {/* Items List */}
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {items.map((item) => {
                    const itemTotalRupees = (item.itemTotalPaise / 100).toFixed(0);

                    return (
                      <div
                        key={item.productId}
                        className="py-3.5 first:pt-0 last:pb-4 flex items-center justify-between gap-3 sm:gap-4"
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
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
                            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-stone-400">
                              {item.packageSize} {item.packageUnit}
                            </p>
                            <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-white block font-mono">
                              ₹{itemTotalRupees}
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
                                if (item.quantity === 1) {
                                  onRemoveItem(item.productId);
                                } else {
                                  onUpdateQuantity(item.productId, item.quantity - 1);
                                }
                              }}
                              className="p-1 hover:opacity-80 cursor-pointer min-h-[24px] min-w-[20px] flex items-center justify-center text-emerald-800 dark:text-emerald-300"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono px-1 min-w-[16px] text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                              className="p-1 hover:opacity-80 cursor-pointer min-h-[24px] min-w-[20px] flex items-center justify-center text-emerald-800 dark:text-emerald-300"
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

                {/* Free Delivery Tracker Bar */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-bold">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {shortfallPaise > 0
                          ? `Add ₹${shortfallRupees} more for FREE delivery`
                          : '🎉 You have unlocked FREE delivery!'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-stone-500 dark:text-stone-400">
                      ₹{subtotalRupees} / ₹500
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Box 3: Smart Recommendations ("You might also like") ─────── */}
              {recommendationItems.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                        You might also like
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={onExploreProducts}
                      className="text-xs font-bold text-stone-500 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recommendationItems.map((rec) => {
                      const priceRupees = (rec.pricePaise / 100).toFixed(0);

                      return (
                        <div
                          key={rec._id}
                          className="rounded-xl border border-stone-200/80 dark:border-stone-800 p-3 flex items-center justify-between gap-2.5 bg-stone-50/40 dark:bg-stone-800/30 hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {rec.imageUrl ? (
                                <img
                                  src={rec.imageUrl}
                                  alt={rec.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-base">🥕</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                {rec.name}
                              </h5>
                              <p className="text-[10px] text-stone-400">
                                ({rec.packageSize} {rec.packageUnit})
                              </p>
                              <span className="font-extrabold text-xs text-stone-900 dark:text-white font-mono block mt-0.5">
                                ₹{priceRupees}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart(rec._id, 1);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-emerald-600 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-400 dark:hover:text-white font-extrabold text-xs transition-all cursor-pointer flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Box 4: Delivery Instructions Note ────────────────────────── */}
              {onUpdateDeliveryNote && (
                <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 shadow-xs space-y-2">
                  <label className="text-xs font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Delivery Instructions</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leave at door, call before delivery, gate code #402"
                    value={noteText}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      onUpdateDeliveryNote(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT COLUMN (4 cols): Apply Coupon, Order Summary, Service Badges
               ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
              {/* ── Card 1: Apply Coupon ────────────────────────────────────── */}
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
                          You saved ₹{discountRupees}!
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
                      placeholder="Enter coupon code"
                      value={localCouponCode}
                      onChange={(e) => {
                        setLocalCouponCode(e.target.value);
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

              {/* ── Card 2: Order Summary ───────────────────────────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  {/* Items Count & Subtotal */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Items ({itemCount})</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      ₹{subtotalRupees}
                    </span>
                  </div>

                  {/* Delivery Fee with Tooltip */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400 relative">
                    <span className="flex items-center gap-1">
                      <span>Delivery Fee</span>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryTooltip(!showDeliveryTooltip)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                        title="Free delivery on orders of ₹500 or more"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      {deliveryFeePaise === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryRupees}`
                      )}
                    </span>
                  </div>
                  {showDeliveryTooltip && (
                    <div className="text-[11px] bg-stone-50 dark:bg-stone-800 p-2 rounded-lg text-stone-600 dark:text-stone-300">
                      Free delivery on all orders above ₹500. Standard delivery fee is ₹40.
                    </div>
                  )}

                  {/* Platform Fee with Tooltip */}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400 relative">
                    <span className="flex items-center gap-1">
                      <span>Platform Fee</span>
                      <button
                        type="button"
                        onClick={() => setShowPlatformTooltip(!showPlatformTooltip)}
                        className="text-stone-400 hover:text-stone-600 cursor-pointer"
                        title="Platform handling and packaging fee"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      ₹{platformFeeRupees}
                    </span>
                  </div>
                  {showPlatformTooltip && (
                    <div className="text-[11px] bg-stone-50 dark:bg-stone-800 p-2 rounded-lg text-stone-600 dark:text-stone-300">
                      Standard nominal fee of ₹5 to support eco-friendly packaging and operations.
                    </div>
                  )}

                  {/* Coupon Discount (if applied) */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-mono">-₹{discountRupees}</span>
                    </div>
                  )}

                  {/* Divider Line */}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                    <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="font-black text-2xl text-emerald-700 dark:text-emerald-400 font-mono">
                      ₹{totalRupees}
                    </span>
                  </div>
                </div>

                {/* Single Prominent Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  disabled={itemCount === 0 || isLoading}
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer min-h-[48px] disabled:opacity-40"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* ── Card 3: Trust & Service Information Badges ──────────────── */}
              <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-3.5 shadow-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center gap-1.5 p-1">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 dark:text-stone-400 leading-tight">
                      On-time Delivery
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 p-1 border-x border-stone-100 dark:border-stone-800">
                    <Headphones className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 dark:text-stone-400 leading-tight">
                      Support 7 Days
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 p-1">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 dark:text-stone-400 leading-tight">
                      Multiple Payment Options
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
