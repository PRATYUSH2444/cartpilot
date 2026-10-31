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
  Lock,
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
    } else if (clean === 'VEG10') {
      const subtotal = cart?.pricing.subtotalPaise || 0;
      setAppliedCoupon({ code: clean, discountPaise: Math.round(subtotal * 0.1) });
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try FRESH20 or VEG10');
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
    <div className="flex-1 overflow-y-auto pb-8 bg-[--bg]">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[--bg]/95 backdrop-blur-md px-4 py-3.5 border-b border-[--line]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[--brand]" />
          <h2 className="font-heading font-bold text-base text-[--ink]">
            Your Cart {itemCount > 0 && `(${itemCount})`}
          </h2>
        </div>
        {itemCount > 0 && (
          <button
            onClick={onClearCart}
            disabled={isLoading}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer disabled:opacity-40"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-w-[760px] mx-auto px-4 pt-4 space-y-4">
        {itemCount === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[--surface-2] flex items-center justify-center text-[--mut]">
              <ShoppingBag className="w-8 h-8 text-[--line]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-[--ink]">Your cart is empty</h3>
              <p className="text-xs text-[--mut] max-w-xs">
                Explore our pure vegetarian catalog or ask CartPilot AI to build a meal bundle for you.
              </p>
            </div>
            <button
              onClick={onExploreProducts}
              className="px-6 py-2.5 rounded-full bg-[--brand] text-white font-heading font-bold text-xs shadow-xs hover:opacity-95 transition-opacity cursor-pointer"
            >
              Browse Groceries
            </button>
          </div>
        ) : (
          <>
            {/* ── Cart Items List ────────────────────────────────────────── */}
            <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-4 shadow-card divide-y divide-[--line]/60">
              {items.map((item) => {
                const itemPriceRupees = (item.pricePaise / 100).toFixed(0);
                const itemTotalRupees = (item.itemTotalPaise / 100).toFixed(0);

                return (
                  <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[--surface-2] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">🍅</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-xs text-[--ink] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-[--mut]">
                          {item.packageSize} {item.packageUnit} · ₹{itemPriceRupees}
                        </p>
                        <span className="text-xs font-heading font-bold text-[--brand] mt-0.5 block">
                          ₹{itemTotalRupees}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5 bg-[--brand-soft] text-[--brand] px-2 py-1 rounded-full text-xs font-bold">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              onRemoveItem(item.productId);
                            } else {
                              onUpdateQuantity(item.productId, item.quantity - 1);
                            }
                          }}
                          className="p-1 hover:opacity-80 cursor-pointer min-h-[32px] min-w-[24px] flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono px-1 min-w-[16px] text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:opacity-80 cursor-pointer min-h-[32px] min-w-[24px] flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="p-1.5 text-[--mut] hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Coupon Code Box ────────────────────────────────────────── */}
            <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-3.5 shadow-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[--ink] flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[--brand]" />
                  Apply Coupon
                </span>
                <span className="text-[10px] text-[--mut] font-mono">FRESH20 / VEG10</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[--brand-soft] border border-[--brand]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[--brand]" />
                    <div>
                      <span className="font-mono font-bold text-[--brand]">
                        '{appliedCoupon.code}' applied
                      </span>
                      <span className="text-[10px] text-[--mut] block">
                        You saved ₹{discountRupees}!
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g. FRESH20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[--surface-2] border border-[--line] text-xs text-[--ink] placeholder:text-[--mut] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[--brand]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[--brand] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[10px] text-rose-600 font-medium">{couponError}</p>}
            </div>

            {/* ── Delivery Note Input ─────────────────────────────────────── */}
            <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-3.5 shadow-card space-y-1.5">
              <label className="text-xs font-bold text-[--ink] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[--mut]" />
                Delivery Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Leave at door, don't ring doorbell"
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  onUpdateDeliveryNote(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[--surface-2] border border-[--line] text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-1 focus:ring-[--brand]"
              />
            </div>

            {/* ── Authoritative Bill Summary ───────────────────────────────── */}
            <div className="rounded-[var(--radius-card)] bg-[--surface] border border-[--line] p-4 shadow-card space-y-2.5">
              <h3 className="font-heading font-bold text-xs text-[--ink] uppercase tracking-wider">
                Bill Summary
              </h3>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[--mut]">
                  <span>Item Total</span>
                  <span className="font-mono text-[--ink]">₹{subtotalRupees}</span>
                </div>
                <div className="flex justify-between text-[--mut]">
                  <span className="flex items-center gap-1">
                    <span>Delivery Fee</span>
                    {deliveryFeePaise === 0 && (
                      <span className="text-[10px] text-[--go] font-bold">FREE</span>
                    )}
                  </span>
                  <span className="font-mono text-[--ink]">
                    {deliveryFeePaise === 0 ? '₹0' : `₹${deliveryRupees}`}
                  </span>
                </div>
                <div className="flex justify-between text-[--mut]">
                  <span>Platform Fee</span>
                  <span className="font-mono text-[--ink]">₹{platformFeeRupees}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[--brand] font-semibold">
                    <span>Discount Coupon ({appliedCoupon.code})</span>
                    <span className="font-mono">-₹{discountRupees}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[--line]/60 flex justify-between items-center text-sm">
                  <span className="font-heading font-bold text-[--ink]">To Pay</span>
                  <span className="font-heading font-black text-base text-[--brand]">
                    ₹{totalRupees}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-center gap-1 text-[10px] text-[--mut]">
                <Lock className="w-3 h-3 text-[--go]" />
                <span>Deterministic spending mandate enforced</span>
              </div>
            </div>

            {/* ── Proceed to Checkout Sticky / Fixed Action ──────────────── */}
            <div className="pt-2">
              <button
                onClick={onProceedToCheckout}
                disabled={itemCount === 0 || isLoading}
                className="w-full py-3.5 px-4 rounded-[var(--radius-input)] bg-[--brand] hover:bg-[--brand-hover] text-white font-heading font-bold text-sm flex items-center justify-between shadow-md transition-all cursor-pointer min-h-[48px]"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">₹{totalRupees}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
