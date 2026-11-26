import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Check,
  FileText,
  Ticket,
  ShieldCheck,
  Truck,
  Leaf,
} from 'lucide-react';
import { CartData } from '../../types';

interface CartScreenProps {
  cart: CartData | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onUpdateDeliveryNote: (note: string) => void;
  onExploreProducts: () => void;
  onOpenCoupons?: () => void;
  isLoading?: boolean;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onUpdateDeliveryNote,
  onExploreProducts,
  onOpenCoupons,
  isLoading = false,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(
    null
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState(cart?.deliveryNote || '');

  const itemCount = cart?.itemCount || 0;
  const items = cart?.items || [];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'FRESH20' || clean === 'CARTPILOT20') {
      setAppliedCoupon({ code: clean, discountPaise: 2000 }); // ₹20 off
      setCouponError(null);
    } else if (clean === 'VEG10' || clean === 'VEGFRESH') {
      const subtotal = cart?.pricing.subtotalPaise || 0;
      setAppliedCoupon({ code: clean, discountPaise: Math.round(subtotal * 0.1) });
      setCouponError(null);
    } else if (clean === 'MORNING') {
      setAppliedCoupon({ code: clean, discountPaise: 5000 }); // ₹50 off
      setCouponError(null);
    } else if (clean === 'WELCOME100') {
      setAppliedCoupon({ code: clean, discountPaise: 10000 }); // ₹100 off
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try VEGFRESH, MORNING, or FRESH20');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Pricing calculations
  const subtotalPaise = cart?.pricing.subtotalPaise || 0;
  const deliveryFeePaise = subtotalPaise > 50000 ? 0 : 4000; // Free delivery over ₹500
  const platformFeePaise = 500; // ₹5
  const discountPaise = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise + platformFeePaise - discountPaise);

  const subtotalRupees = (subtotalPaise / 100).toFixed(0);
  const deliveryRupees = (deliveryFeePaise / 100).toFixed(0);
  const platformFeeRupees = (platformFeePaise / 100).toFixed(0);
  const discountRupees = (discountPaise / 100).toFixed(0);
  const totalRupees = (totalPaise / 100).toFixed(0);

  return (
    <div className="flex-1 overflow-y-auto pb-16 bg-[#f8faf9] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-3.5 border-b border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="max-w-[1560px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white leading-none">
                Your Basket {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">100% Pure Vegetarian Harvest</p>
            </div>
          </div>
          {itemCount > 0 && (
            <button
              onClick={onClearCart}
              disabled={isLoading}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer disabled:opacity-40 px-3 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Clear Basket
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        {itemCount === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-stone-900 dark:text-white">Your cart is empty</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Explore our farm-fresh vegetables, organic milk, and pantry staples or ask CartPilot AI to curate a custom meal bundle.
              </p>
            </div>
            <button
              onClick={onExploreProducts}
              className="px-7 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Browse Fresh Groceries</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* ── Left Column: Items List & Instructions (8 Cols on Desktop) ── */}
            <div className="lg:col-span-8 space-y-5">
              {/* Delivery Window Alert Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white">
                      Guaranteed Next Morning Delivery
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Order till midnight • Delivery between 6:00 AM – 9:00 AM
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 hidden sm:inline-block">
                  On-Time Slot
                </span>
              </div>

              {/* Items Card List */}
              <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
                {items.map((item) => {
                  const itemPriceRupees = (item.pricePaise / 100).toFixed(0);
                  const itemTotalRupees = (item.itemTotalPaise / 100).toFixed(0);

                  return (
                    <div key={item.productId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-stone-200/50 dark:border-stone-700 p-1">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🥬</span>
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-stone-400">
                            {item.packageSize} {item.packageUnit} · ₹{itemPriceRupees} per unit
                          </p>
                          <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 block">
                            ₹{itemTotalRupees}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1.5 rounded-full text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) {
                                onRemoveItem(item.productId);
                              } else {
                                onUpdateQuantity(item.productId, item.quantity - 1);
                              }
                            }}
                            className="p-1 hover:opacity-80 cursor-pointer min-h-[28px] min-w-[24px] flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono px-1.5 min-w-[16px] text-center text-xs">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:opacity-80 cursor-pointer min-h-[28px] min-w-[24px] flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Instructions Note */}
              <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-2">
                <label className="text-xs font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Instructions</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please leave at security / don't ring the bell before 7 AM"
                  value={noteText}
                  onChange={(e) => {
                    setNoteText(e.target.value);
                    onUpdateDeliveryNote(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Guarantee assurance */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                <Leaf className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <p className="leading-relaxed">
                  <strong>100% Certified Vegetarian:</strong> Zero meat, fish, or poultry products are ever handled. All items are farm-tested and temperature-controlled.
                </p>
              </div>
            </div>

            {/* ── Right Column: Sticky Summary & Checkout (4 Cols on Desktop) ── */}
            <div className="lg:col-span-4 space-y-5 sticky top-20">
              {/* Promo Code & Available Coupons */}
              <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Apply Coupon</span>
                  </span>
                  {onOpenCoupons && (
                    <button
                      type="button"
                      onClick={onOpenCoupons}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Coupons</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-black text-emerald-800 dark:text-emerald-300">
                          '{appliedCoupon.code}' applied
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          You saved ₹{discountRupees}!
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
              </div>

              {/* Bill Details */}
              <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs space-y-3.5">
                <h3 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">
                  Bill Summary
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Items Subtotal</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">₹{subtotalRupees}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <span>Delivery Fee</span>
                      {deliveryFeePaise === 0 && (
                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">
                          FREE
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      {deliveryFeePaise === 0 ? '₹0' : `₹${deliveryRupees}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Platform Handling</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">₹{platformFeeRupees}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-mono">-₹{discountRupees}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-stone-900 dark:text-white">Total Amount</span>
                    <span className="font-black text-xl text-emerald-700 dark:text-emerald-400 font-mono">
                      ₹{totalRupees}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-1 text-[11px] text-stone-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure 256-bit encrypted checkout</span>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  disabled={itemCount === 0 || isLoading}
                  className="w-full py-4 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-between shadow-lg shadow-emerald-700/25 transition-all cursor-pointer min-h-[50px] disabled:opacity-40"
                >
                  <span>Proceed to Checkout</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base">₹{totalRupees}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
