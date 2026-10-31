import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  MapPin,
  Lock,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import { CartData, UserAddress, OrderData } from '../../types';
import { API_BASE } from '../../config/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartData | null;
  selectedAddress: UserAddress | null;
  onOpenAddressSelector: () => void;
  onOrderSuccess: (order: OrderData) => void;
  token: string | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  selectedAddress,
  onOpenAddressSelector,
  onOrderSuccess,
  token,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | 'UPI' | 'COD'>('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cart) return null;

  const subtotalPaise = cart.pricing?.subtotalPaise || 0;
  const deliveryFeePaise = subtotalPaise > 50000 ? 0 : 4000;
  const platformFeePaise = 500;
  const discountPaise = 2000; // Special ₹20 checkout loyalty discount
  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise + platformFeePaise - discountPaise);

  const subtotalRupees = (subtotalPaise / 100).toFixed(0);
  const deliveryRupees = (deliveryFeePaise / 100).toFixed(0);
  const platformFeeRupees = (platformFeePaise / 100).toFixed(0);
  const discountRupees = (discountPaise / 100).toFixed(0);
  const totalRupees = (totalPaise / 100).toFixed(0);

  const handlePlaceOrder = async () => {
    if (!token) {
      setError('You must be logged in to place an order');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create order on the backend
      const res = await fetch(`${API_BASE}/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryAddressId: selectedAddress?._id,
          deliveryNote: cart.deliveryNote || 'Standard Delivery',
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to initialize order checkout');
      }

      const { order, razorpay } = data.data;

      // 2. Complete payment verification
      const verifyRes = await fetch(`${API_BASE}/checkout/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpaySignature: 'simulated_test_signature_valid',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'Payment verification failed');
      }

      // Order placed successfully!
      onOrderSuccess(verifyData.data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[--surface] border border-[--line] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="p-4 border-b border-[--line] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-[--mut] hover:text-[--ink] rounded-full cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-heading font-bold text-base text-[--ink]">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[--mut] hover:text-[--ink] rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-6 py-3 bg-[--surface-2] border-b border-[--line] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[--brand] font-bold">
            <div className="w-5 h-5 rounded-full bg-[--brand] text-white flex items-center justify-center text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span>Address</span>
          </div>
          <div className="flex-1 h-[2px] bg-[--brand] mx-2" />
          <div className="flex items-center gap-1.5 text-[--brand] font-bold">
            <div className="w-5 h-5 rounded-full bg-[--brand] text-white flex items-center justify-center text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span>Items</span>
          </div>
          <div className="flex-1 h-[2px] bg-[--brand] mx-2" />
          <div className="flex items-center gap-1.5 text-[--brand] font-extrabold">
            <div className="w-5 h-5 rounded-full bg-[--brand] text-white flex items-center justify-center text-[10px] ring-2 ring-[--brand-soft]">
              3
            </div>
            <span>Payment</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[--ink] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[--brand]" />
                Deliver to:
              </span>
              <button
                onClick={onOpenAddressSelector}
                className="text-[--brand] font-bold hover:underline cursor-pointer text-xs"
              >
                Change
              </button>
            </div>
            <p className="text-xs text-[--ink] font-medium pl-5.5">
              {selectedAddress
                ? `${selectedAddress.houseFlat ? selectedAddress.houseFlat + ', ' : ''}${selectedAddress.areaLocality || selectedAddress.apartmentStreet}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                : 'HSR Layout, Sector 2, Bengaluru - 560102'}
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-2">
            <h4 className="font-heading font-bold text-xs text-[--ink] uppercase tracking-wider">
              Order Summary
            </h4>
            <div className="space-y-1.5 text-xs text-[--mut]">
              <div className="flex justify-between">
                <span>Items ({cart.itemCount})</span>
                <span className="font-mono text-[--ink]">₹{subtotalRupees}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-mono text-[--ink]">₹{deliveryRupees}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-mono text-[--ink]">₹{platformFeeRupees}</span>
              </div>
              <div className="flex justify-between text-[--brand] font-semibold">
                <span>Discount</span>
                <span className="font-mono">-₹{discountRupees}</span>
              </div>
              <div className="pt-2 border-t border-[--line] flex justify-between font-bold text-sm text-[--ink]">
                <span>Total</span>
                <span className="font-black text-[--brand]">₹{totalRupees}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold text-xs text-[--ink] uppercase tracking-wider">
              Payment Method
            </h4>

            {/* Razorpay Option */}
            <label
              onClick={() => setSelectedMethod('RAZORPAY')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'RAZORPAY'
                  ? 'border-[--brand] bg-[--brand-soft]/40 shadow-xs'
                  : 'border-[--line] bg-[--surface-2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  rzp
                </div>
                <div>
                  <span className="font-bold text-xs text-[--ink] block">
                    Razorpay (UPI, Cards, NetBanking, Wallets)
                  </span>
                  <span className="text-[10px] text-[--mut]">Instant sandbox confirmation</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'RAZORPAY'}
                onChange={() => setSelectedMethod('RAZORPAY')}
                className="accent-[--brand] w-4 h-4"
              />
            </label>

            {/* UPI Option */}
            <label
              onClick={() => setSelectedMethod('UPI')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'UPI'
                  ? 'border-[--brand] bg-[--brand-soft]/40 shadow-xs'
                  : 'border-[--line] bg-[--surface-2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  UPI
                </div>
                <div>
                  <span className="font-bold text-xs text-[--ink] block">
                    UPI (Google Pay, PhonePe, Paytm)
                  </span>
                  <span className="text-[10px] text-[--mut]">Direct instant bank transfer</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'UPI'}
                onChange={() => setSelectedMethod('UPI')}
                className="accent-[--brand] w-4 h-4"
              />
            </label>

            {/* Cash on Delivery */}
            <label
              onClick={() => setSelectedMethod('COD')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'COD'
                  ? 'border-[--brand] bg-[--brand-soft]/40 shadow-xs'
                  : 'border-[--line] bg-[--surface-2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  ₹
                </div>
                <div>
                  <span className="font-bold text-xs text-[--ink] block">Cash on Delivery</span>
                  <span className="text-[10px] text-[--mut]">Pay cash upon delivery arrival</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'COD'}
                onChange={() => setSelectedMethod('COD')}
                className="accent-[--brand] w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[--line] space-y-2">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-[var(--radius-input)] bg-[--brand] hover:bg-[--brand-hover] text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment…</span>
              </>
            ) : (
              <>
                <span>Pay ₹{totalRupees}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[--mut]">
            <Lock className="w-3 h-3 text-[--go]" />
            <span>256-bit encrypted secure checkout · 100% money back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
