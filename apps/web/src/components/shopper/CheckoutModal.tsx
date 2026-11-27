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
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Banknote,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { CartData, UserAddress, OrderData } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import {
  DELIVERY_SLOTS,
  formatFullDeliverySlot,
  getNextDayDeliveryDate,
  SlotId,
} from '../../config/deliverySlots';
import { PRICING_CONFIG, computePricing, CartItemData } from '../../config/pricingConfig';

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
  initialDeliverySlot?: SlotId;
  appliedCoupon?: { code: string; discountPaise: number } | null;
}

const QUICK_DELIVERY_INSTRUCTION_CHIPS = [
  'Ring the bell',
  "Don't ring the bell",
  'Leave with guard',
  'Call on arrival',
];

const loadRazorpaySdk = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  selectedAddress,
  onOpenAddressSelector,
  onOrderSuccess,
  token,
  walletBalance = 0,
  onDeductWallet,
  initialDeliverySlot = 'morning',
  appliedCoupon,
}) => {
  const { authFetch, user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | 'WALLET' | 'COD'>('RAZORPAY');
  const [deliverySlot, setDeliverySlot] = useState<SlotId>(initialDeliverySlot);
  const [deliveryInstructions, setDeliveryInstructions] = useState(cart?.deliveryNote || '');
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDeliverySlot) {
      setDeliverySlot(initialDeliverySlot);
    }
  }, [initialDeliverySlot]);

  if (!isOpen || !cart) return null;

  const items = cart.items || [];

  // Unified single source of truth pricing
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
  const pricing = computePricing({
    items: pricingItems,
    couponDiscount: couponDiscountRupees,
    config: PRICING_CONFIG,
  });

  const isWalletSufficient = walletBalance >= pricing.total;
  const fullSlotString = formatFullDeliverySlot(deliverySlot);
  const { formattedDate } = getNextDayDeliveryDate();

  const handleChipClick = (chip: string) => {
    if (!deliveryInstructions) {
      setDeliveryInstructions(chip);
    } else if (!deliveryInstructions.includes(chip)) {
      setDeliveryInstructions(`${deliveryInstructions.trim()}, ${chip}`.slice(0, 200));
    }
  };

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
          deliveryNote: deliveryInstructions.trim() || undefined,
          deliverySlot: fullSlotString,
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
      const completeOrderVerification = async (
        orderId: string,
        rzpOrderId: string,
        rzpPaymentId: string,
        rzpSig: string
      ) => {
        const verifyRes = await authFetch(`${API_BASE}/payments/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            razorpayOrderId: rzpOrderId,
            razorpayPaymentId: rzpPaymentId,
            razorpaySignature: rzpSig,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error?.message || verifyData.message || 'Payment confirmation failed');
        }

        // Deduct from wallet if paid by wallet
        if (selectedMethod === 'WALLET' && onDeductWallet) {
          onDeductWallet(pricing.total);
        }

        // Order placed successfully
        onOrderSuccess(verifyData.data || order);
        onClose();
      };

      if (
        selectedMethod === 'RAZORPAY' &&
        razorpay?.keyId &&
        razorpay.keyId.startsWith('rzp_') &&
        razorpay.keyId !== 'rzp_test_placeholder'
      ) {
        const sdkLoaded = await loadRazorpaySdk();
        if (sdkLoaded) {
          const options = {
            key: razorpay.keyId,
            amount: razorpay.amountPaise || Math.round(pricing.total * 100),
            currency: razorpay.currency || 'INR',
            name: 'CartPilot',
            description: `Order #${order.orderNumber || order._id.slice(-6).toUpperCase()}`,
            order_id: razorpay.orderId,
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: user?.phone || '',
            },
            theme: {
              color: '#10B981',
            },
            handler: async (response: any) => {
              try {
                await completeOrderVerification(
                  order._id,
                  response.razorpay_order_id || razorpay.orderId,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );
              } catch (vErr: any) {
                setError(vErr.message || 'Payment verification failed');
              } finally {
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
              },
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        }
      }

      // Simulation mode fallback
      await completeOrderVerification(
        order._id,
        razorpay?.orderId || `sim_${Date.now()}`,
        selectedMethod === 'WALLET' ? `wallet_${Date.now()}` : `pay_${Date.now()}`,
        'simulated_test_signature'
      );
    } catch (err: any) {
      setError(err.message || 'Unable to complete order. Please check details and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden text-stone-900 dark:text-stone-100 animate-in slide-in-from-bottom duration-250">
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-stone-900">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-white">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
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

          {/* ── Step 1: Delivery Address ──────────────────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>1. Delivery Address</span>
              </span>
              <button
                type="button"
                onClick={onOpenAddressSelector}
                className="text-stone-900 dark:text-white font-bold hover:underline cursor-pointer text-xs"
              >
                {selectedAddress ? 'Change' : 'Select Address'}
              </button>
            </div>
            {selectedAddress ? (
              <div className="pl-5.5 space-y-1">
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed font-sans">
                  {selectedAddress.houseFlat ? `${selectedAddress.houseFlat}, ` : ''}
                  {selectedAddress.apartmentStreet || selectedAddress.areaLocality}, {selectedAddress.city} — {selectedAddress.pincode}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    {selectedAddress.addressType || 'HOME'}
                  </span>
                  {selectedAddress.isServiceable ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      15-20 Min Express Delivery Zone
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      Standard Fulfillment Zone
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pl-5.5 pt-1">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  No delivery address selected.
                </p>
                <button
                  type="button"
                  onClick={onOpenAddressSelector}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Choose Address</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Step 2: Preferred Delivery Slot (Universal IST Next-Day) ──────── */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Delivery Slot ({formattedDate})</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                NEXT DAY
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {DELIVERY_SLOTS.map((slot) => {
                const isSelected = deliverySlot === slot.id;
                const Icon = slot.id === 'morning' ? Sun : Moon;
                const iconColor = slot.id === 'morning' ? 'text-amber-500' : 'text-indigo-400';

                return (
                  <label
                    key={slot.id}
                    onClick={() => setDeliverySlot(slot.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-2xs'
                        : 'border-stone-200 dark:border-stone-750 bg-white dark:bg-stone-900 text-stone-900 dark:text-white hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliverySlot"
                      checked={isSelected}
                      onChange={() => setDeliverySlot(slot.id)}
                      className="mt-0.5 accent-stone-900 dark:accent-white cursor-pointer"
                    />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                        <span className="text-xs font-bold leading-tight">{slot.label}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                        {slot.timeRange}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Step 3: Delivery Instructions (Textarea + Quick Chips) ──────────── */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-stone-900 dark:text-white">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Delivery Instructions (Optional)</span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {200 - deliveryInstructions.length} left
              </span>
            </div>

            <textarea
              maxLength={200}
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Leave at door, call before delivery, gate code #402"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans resize-none"
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {QUICK_DELIVERY_INSTRUCTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 4: Payment Method Selector ───────────────────────────────── */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">
              4. Payment Method
            </h4>

            {/* CartPilot Wallet Option */}
            <label
              onClick={() => setSelectedMethod('WALLET')}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'WALLET'
                  ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-800'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/60 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 flex items-center justify-center shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900 dark:text-white block">
                      CartPilot Wallet
                    </span>
                    <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700">
                      1-Tap
                    </span>
                  </div>
                  <span className={`text-[11px] font-sans ${isWalletSufficient ? 'text-stone-500 dark:text-stone-400' : 'text-rose-600 font-bold'}`}>
                    Available Balance: ₹{walletBalance.toFixed(2)} {!isWalletSufficient && '(Insufficient)'}
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'WALLET'}
                onChange={() => setSelectedMethod('WALLET')}
                className="accent-stone-900 dark:accent-white w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Razorpay Option */}
            <label
              onClick={() => setSelectedMethod('RAZORPAY')}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'RAZORPAY'
                  ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-800'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/60 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xs text-stone-900 dark:text-white block">
                    Razorpay (UPI, Cards, NetBanking)
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">Instant secured payment gateway</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'RAZORPAY'}
                onChange={() => setSelectedMethod('RAZORPAY')}
                className="accent-stone-900 dark:accent-white w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Cash on Delivery Option */}
            <label
              onClick={() => setSelectedMethod('COD')}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'COD'
                  ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-800'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/60 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-stone-700 text-white font-bold text-xs flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xs text-stone-900 dark:text-white block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400">Pay upon arrival</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'COD'}
                onChange={() => setSelectedMethod('COD')}
                className="accent-stone-900 dark:accent-white w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* ── Order Summary Card (Derived from computePricing) ───────────────── */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsItemsExpanded(!isItemsExpanded)}
              className="w-full flex items-center justify-between text-xs font-extrabold text-stone-900 dark:text-white cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Order Summary ({pricing.itemCount} items)</span>
              </span>
              {isItemsExpanded ? (
                <ChevronUp className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              )}
            </button>

            {isItemsExpanded && (
              <div className="space-y-2 pt-1 border-t border-stone-200 dark:border-stone-700 max-h-40 overflow-y-auto">
                {items.map((i) => (
                  <div key={i.productId} className="flex items-center justify-between text-xs py-0.5">
                    <span className="truncate text-stone-700 dark:text-stone-300">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white flex-shrink-0 ml-2">
                      ₹{Math.round((i.itemTotalPaise || (i.pricePaise || 0) * i.quantity) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-200 dark:border-stone-700">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">₹{pricing.itemsTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {pricing.deliveryFee === 0 ? 'FREE' : `₹${pricing.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">₹{pricing.platformFee}</span>
              </div>
              {pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono">-₹{pricing.couponDiscount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-bold text-sm text-stone-900 dark:text-white">
                <span>Total Payable</span>
                <span className="text-base text-stone-900 dark:text-white font-mono tabular-nums font-black">
                  ₹{pricing.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky Bottom Action Bar ───────────────────────────────────────── */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 flex-shrink-0 shadow-lg">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isProcessing || !selectedAddress || (selectedMethod === 'WALLET' && !isWalletSufficient)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 disabled:opacity-50 transition-all cursor-pointer shadow-sm min-h-[46px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Order…</span>
              </>
            ) : (
              <>
                <span>Place Order · ₹{pricing.total}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-sans">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Secure checkout · CartPilot Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
