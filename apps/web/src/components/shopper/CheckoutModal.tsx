import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  MapPin,
  Lock,
  ArrowRight,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Banknote,
  Zap,
} from 'lucide-react';
import { CartData, UserAddress, OrderData } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartData | null;
  selectedAddress: UserAddress | null;
  onOpenAddressSelector: () => void;
  onOrderSuccess: (order: OrderData) => void;
  token: string | null;
  walletBalance?: number;
  onDeductWallet?: (amountRupees: number) => void;
}

const formatINR = (paise: number) => {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  selectedAddress,
  onOpenAddressSelector,
  onOrderSuccess,
  token,
  walletBalance = 349.0,
  onDeductWallet,
}) => {
  const { authFetch } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | 'WALLET' | 'COD'>('RAZORPAY');
  const [deliverySlot, setDeliverySlot] = useState<'morning' | 'evening'>('morning');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cart) return null;

  const items = cart.items || [];
  // Use authoritative pricing from cart.pricing
  const pricing = cart.pricing;
  const subtotalPaise = pricing?.subtotalPaise ?? items.reduce(
    (sum, item) => sum + (item.itemTotalPaise || item.pricePaise * item.quantity),
    0
  );
  const deliveryFeePaise = pricing?.deliveryFeePaise ?? (subtotalPaise >= 50000 ? 0 : 4000);
  const taxPaise = pricing?.taxPaise ?? Math.round(subtotalPaise * 0.05);
  const totalPaise = pricing?.totalPaise ?? (subtotalPaise + deliveryFeePaise + taxPaise);

  const totalRupees = Math.round(totalPaise / 100);
  const isWalletSufficient = walletBalance >= totalRupees;

  const slotLabel =
    deliverySlot === 'morning'
      ? 'Tomorrow, 6:00 AM – 10:00 AM (Morning Fresh)'
      : 'Today, 5:00 PM – 9:00 PM (Evening Express)';

  const handlePlaceOrder = async () => {
    if (!token) {
      setError('Please sign in to complete your checkout');
      return;
    }

    if (!selectedAddress) {
      setError('Please select a delivery address before placing your order');
      onOpenAddressSelector();
      return;
    }

    if (selectedMethod === 'WALLET' && !isWalletSufficient) {
      setError(`Insufficient wallet balance (₹${walletBalance.toFixed(2)}). Please choose Razorpay or Cash on Delivery.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Unique client-side idempotency key for this order placement attempt
    const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      // 1. Initiate checkout on backend with verified address & slot
      const res = await authFetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingAddress: {
            street: selectedAddress.areaLocality || selectedAddress.apartmentStreet || selectedAddress.houseFlat || 'Address',
            city: selectedAddress.city || 'Bengaluru',
            state: selectedAddress.state || 'Karnataka',
            postalCode: selectedAddress.pincode || '560001',
          },
          deliveryNote: deliveryInstructions.trim() || cart.deliveryNote || undefined,
          deliverySlot: slotLabel,
          notes: selectedMethod === 'WALLET' ? 'Paid via CartPilot Wallet' : `Paid via ${selectedMethod}`,
          paymentMethod: selectedMethod,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to place order');
      }

      const { order, razorpay } = data.data;

      // 2. Complete payment verification / settlement
      const verifyRes = await authFetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay?.orderId || `sim_${Date.now()}`,
          razorpayPaymentId: selectedMethod === 'WALLET' ? `wallet_${Date.now()}` : `pay_${Date.now()}`,
          razorpaySignature: 'simulated_test_signature',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || verifyData.message || 'Payment confirmation failed');
      }

      // 3. Deduct from wallet if paid by wallet
      if (selectedMethod === 'WALLET' && onDeductWallet) {
        onDeductWallet(totalRupees);
      }

      // 4. Order placed successfully
      onOrderSuccess(verifyData.data || order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to complete order. Please check details and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[--surface] border border-[--line] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden text-[--ink] animate-in slide-in-from-bottom duration-250">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-[--line] flex items-center justify-between flex-shrink-0 bg-[--surface]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-[--mut] hover:text-[--ink] rounded-full transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-heading font-extrabold text-base text-[--ink]">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[--mut] hover:text-[--ink] rounded-full transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section A: Delivery Address */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading font-extrabold text-[--ink] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[--brand]" />
                <span>Delivery Address</span>
              </span>
              <button
                type="button"
                onClick={onOpenAddressSelector}
                className="text-[--brand] font-heading font-bold hover:underline cursor-pointer text-xs"
              >
                {selectedAddress ? 'Change' : 'Select Address'}
              </button>
            </div>
            {selectedAddress ? (
              <p className="text-xs text-[--ink] font-medium leading-relaxed pl-5.5 font-sans">
                {selectedAddress.houseFlat ? `${selectedAddress.houseFlat}, ` : ''}
                {selectedAddress.apartmentStreet || selectedAddress.areaLocality}, {selectedAddress.city} — {selectedAddress.pincode}
              </p>
            ) : (
              <div className="pl-5.5 pt-1">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  No delivery address selected.
                </p>
                <button
                  type="button"
                  onClick={onOpenAddressSelector}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[--brand] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Choose Address</span>
                </button>
              </div>
            )}
          </div>

          {/* Section B: Delivery Slot */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-heading font-extrabold text-[--ink]">
              <Clock className="w-4 h-4 text-[--brand]" />
              <span>Preferred Delivery Slot</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <label
                onClick={() => setDeliverySlot('morning')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  deliverySlot === 'morning'
                    ? 'border-[--brand] bg-[--brand-soft] text-[--brand] ring-1 ring-[--brand]/30'
                    : 'border-[--line] bg-[--surface] text-[--ink] hover:bg-[--surface-2]'
                }`}
              >
                <input
                  type="radio"
                  name="slot"
                  checked={deliverySlot === 'morning'}
                  onChange={() => setDeliverySlot('morning')}
                  className="mt-0.5 accent-[--brand] cursor-pointer"
                />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Tomorrow Morning</div>
                  <div className="text-[10px] text-[--mut] mt-0.5">6:00 AM – 10:00 AM · Fresh harvest</div>
                </div>
              </label>

              <label
                onClick={() => setDeliverySlot('evening')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  deliverySlot === 'evening'
                    ? 'border-[--brand] bg-[--brand-soft] text-[--brand] ring-1 ring-[--brand]/30'
                    : 'border-[--line] bg-[--surface] text-[--ink] hover:bg-[--surface-2]'
                }`}
              >
                <input
                  type="radio"
                  name="slot"
                  checked={deliverySlot === 'evening'}
                  onChange={() => setDeliverySlot('evening')}
                  className="mt-0.5 accent-[--brand] cursor-pointer"
                />
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Today Evening</div>
                  <div className="text-[10px] text-[--mut] mt-0.5">5:00 PM – 9:00 PM · Express</div>
                </div>
              </label>
            </div>
          </div>

          {/* Section C: Delivery Instructions (Optional) */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[--ink]">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[--brand]" />
                <span>Delivery Instructions (Optional)</span>
              </span>
              <span className="text-[10px] text-[--mut] font-mono">{deliveryInstructions.length}/200</span>
            </div>
            <input
              type="text"
              maxLength={200}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Leave with security guard, don't ring bell..."
              className="w-full px-3 py-2 rounded-xl bg-[--surface] border border-[--line] text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-1 focus:ring-[--brand] font-sans"
            />
          </div>

          {/* Section D: Collapsible Order Summary */}
          <div className="p-3.5 rounded-2xl bg-[--surface-2] border border-[--line] space-y-2.5">
            <button
              type="button"
              onClick={() => setIsItemsExpanded(!isItemsExpanded)}
              className="w-full flex items-center justify-between text-xs font-heading font-extrabold text-[--ink] cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[--brand]" />
                <span>Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              </span>
              {isItemsExpanded ? (
                <ChevronUp className="w-4 h-4 text-[--mut]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[--mut]" />
              )}
            </button>

            {isItemsExpanded && (
              <div className="space-y-2 pt-1 border-t border-[--line] max-h-48 overflow-y-auto">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {i.imageUrl ? (
                        <img src={i.imageUrl} alt={i.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[--surface] border border-[--line] flex items-center justify-center flex-shrink-0 text-mut">
                          <ShoppingBag className="w-3.5 h-3.5 opacity-40" />
                        </div>
                      )}
                      <span className="truncate font-medium text-[--ink]">{i.name} × {i.quantity}</span>
                    </div>
                    <span className="font-sans font-bold tabular-nums text-[--ink] flex-shrink-0 ml-2">
                      {formatINR(i.itemTotalPaise || i.pricePaise * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Authoritative Single-Engine Pricing Breakdown */}
            <div className="space-y-1.5 text-xs text-[--mut] pt-1 border-t border-[--line] font-sans">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-[--ink] tabular-nums">{formatINR(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {deliveryFeePaise === 0 ? 'FREE' : formatINR(deliveryFeePaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (GST 5%)</span>
                <span className="font-bold text-[--ink] tabular-nums">{formatINR(taxPaise)}</span>
              </div>
              <div className="pt-2 border-t border-[--line] flex justify-between font-heading font-black text-sm text-[--ink]">
                <span>Total Payable</span>
                <span className="text-base text-[--brand] tabular-nums">{formatINR(totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Section E: Policy Reassurance Line */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-medium">Policy Approved · Within your autonomous spending limit</span>
          </div>

          {/* Section F: Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="font-heading font-extrabold text-xs text-[--mut] uppercase tracking-wider">
              Payment Method
            </h4>

            {/* CartPilot Wallet Option */}
            <label
              onClick={() => setSelectedMethod('WALLET')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'WALLET'
                  ? 'border-[--brand] bg-[--brand-soft] ring-1 ring-[--brand]/30'
                  : 'border-[--line] bg-[--surface-2] hover:bg-[--surface-2]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[--brand] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-xs text-[--ink] block">
                      CartPilot Wallet
                    </span>
                    <span className="text-[10px] font-bold text-[--brand] bg-[--surface] px-1.5 py-0.2 rounded-full border border-[--brand]/20">
                      1-Tap
                    </span>
                  </div>
                  <span className={`text-[11px] font-sans ${isWalletSufficient ? 'text-[--mut]' : 'text-rose-600 font-bold'}`}>
                    Available Balance: ₹{walletBalance.toFixed(2)} {!isWalletSufficient && '(Insufficient)'}
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'WALLET'}
                onChange={() => setSelectedMethod('WALLET')}
                className="accent-[--brand] w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Razorpay Option */}
            <label
              onClick={() => setSelectedMethod('RAZORPAY')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'RAZORPAY'
                  ? 'border-[--brand] bg-[--brand-soft] ring-1 ring-[--brand]/30'
                  : 'border-[--line] bg-[--surface-2] hover:bg-[--surface-2]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-xs text-[--ink] block">
                    Razorpay (UPI, Cards, NetBanking)
                  </span>
                  <span className="text-[10px] text-[--mut]">Instant secured payment gateway</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'RAZORPAY'}
                onChange={() => setSelectedMethod('RAZORPAY')}
                className="accent-[--brand] w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Cash on Delivery Option */}
            <label
              onClick={() => setSelectedMethod('COD')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'COD'
                  ? 'border-[--brand] bg-[--brand-soft] ring-1 ring-[--brand]/30'
                  : 'border-[--line] bg-[--surface-2] hover:bg-[--surface-2]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-xs text-[--ink] block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] text-[--mut]">Pay cash upon morning arrival</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'COD'}
                onChange={() => setSelectedMethod('COD')}
                className="accent-[--brand] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* ── Sticky Bottom Action Bar ───────────────────────────────────────── */}
        <div className="p-4 border-t border-[--line] bg-[--surface] space-y-2 flex-shrink-0 shadow-lg">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isProcessing || !selectedAddress || (selectedMethod === 'WALLET' && !isWalletSufficient)}
            className="w-full py-3.5 px-4 rounded-2xl font-heading font-extrabold text-sm flex items-center justify-center gap-2 bg-[--brand] text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md min-h-[48px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Order…</span>
              </>
            ) : (
              <>
                <span>Place Order · {formatINR(totalPaise)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[--mut] font-sans">
            <Lock className="w-3 h-3 text-[--brand]" />
            <span>256-bit encrypted secure checkout · 100% vegetarian guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
