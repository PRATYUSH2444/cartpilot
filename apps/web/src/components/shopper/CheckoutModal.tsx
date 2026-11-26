import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  MapPin,
  Lock,
  ArrowRight,
  Check,
  Loader2,
  Wallet,
  Mail,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  Send,
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
  const { user, sendEmailVerification, verifyEmail: verifyEmailAction, authFetch } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'RAZORPAY' | 'WALLET' | 'UPI' | 'COD'>('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'CODE_SENT' | 'VERIFYING' | 'VERIFIED'>('IDLE');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isEmailVerified = Boolean(user?.isEmailVerified) || verificationStatus === 'VERIFIED';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true);
    setVerificationMessage(null);
    const res = await sendEmailVerification();
    setIsSendingCode(false);
    if (res.success) {
      setVerificationStatus('CODE_SENT');
      setVerificationMessage(res.message || 'Verification code sent to your email.');
      if (res.simulatedCode) {
        setSimulatedEmailCode(res.simulatedCode);
      }
      setResendCooldown(60);
    } else {
      setVerificationMessage(res.error || 'Failed to send verification code.');
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerificationMessage('Please enter a valid 6-digit verification code.');
      return;
    }
    setVerificationStatus('VERIFYING');
    const res = await verifyEmailAction(verificationCode.trim());
    if (res.success) {
      setVerificationStatus('VERIFIED');
      setVerificationMessage('Email verified successfully! You can now complete checkout.');
      setError(null);
    } else {
      setVerificationStatus('CODE_SENT');
      setVerificationMessage(res.error || 'Invalid verification code. Please check and try again.');
    }
  };

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
  const totalRupees = Math.round(totalPaise / 100);

  const isWalletSufficient = walletBalance >= totalRupees;

  const handlePlaceOrder = async () => {
    if (!token) {
      setError('You must be logged in to place an order');
      return;
    }

    if (!isEmailVerified) {
      setError('Email verification is required before checkout. Please complete the verification step above.');
      if (verificationStatus === 'IDLE') {
        handleSendVerificationCode();
      }
      return;
    }

    if (selectedMethod === 'WALLET' && !isWalletSufficient) {
      setError(`Insufficient wallet balance (₹${walletBalance.toFixed(2)}). Please top up or choose Razorpay / COD.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Initiate checkout on the real API
      const res = await authFetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryNote: cart.deliveryNote || 'Standard Morning Delivery',
          notes: selectedMethod === 'WALLET' ? 'Paid via CartPilot Wallet' : `Paid via ${selectedMethod}`,
          shippingAddress: selectedAddress
            ? {
                street: selectedAddress.areaLocality || selectedAddress.apartmentStreet || 'Green Glen Layout',
                city: selectedAddress.city || 'Bengaluru',
                state: selectedAddress.state || 'Karnataka',
                postalCode: selectedAddress.pincode || '560103',
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to initiate checkout');
      }

      const { order, razorpay } = data.data;

      // 2. Complete payment verification via real backend endpoint
      const verifyRes = await authFetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_test_signature',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || verifyData.message || 'Payment verification failed');
      }

      // If paid via wallet, deduct funds
      if (selectedMethod === 'WALLET' && onDeductWallet) {
        onDeductWallet(totalRupees);
      }

      // Order placed successfully!
      onOrderSuccess(verifyData.data || order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden animate-in slide-in-from-bottom duration-250 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-base text-stone-900 dark:text-white">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span>Address</span>
          </div>
          <div className="flex-1 h-[2px] bg-emerald-600 mx-2" />
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
              <Check className="w-3 h-3" />
            </div>
            <span>Items</span>
          </div>
          <div className="flex-1 h-[2px] bg-emerald-600 mx-2" />
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-2 ring-emerald-200 dark:ring-emerald-900">
              3
            </div>
            <span>Payment</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Deliver to:</span>
              </span>
              <button
                type="button"
                onClick={onOpenAddressSelector}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer text-xs"
              >
                Change
              </button>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium pl-5.5">
              {selectedAddress
                ? `${selectedAddress.houseFlat ? selectedAddress.houseFlat + ', ' : ''}${selectedAddress.areaLocality || selectedAddress.apartmentStreet}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                : 'HSR Layout, Sector 2, Bengaluru - 560102'}
            </p>
          </div>

          {/* Email Verification Card */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isEmailVerified
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-2 ring-amber-400/20'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold flex items-center gap-1.5 text-stone-900 dark:text-white">
                <Mail className={`w-4 h-4 ${isEmailVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>Account Email & Verification:</span>
              </span>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3" />
                  Action Required
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium pl-5.5">
              {user?.email || 'customer@example.com'}
            </p>

            {!isEmailVerified && (
              <div className="mt-3 pl-5.5 space-y-2.5">
                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  CartPilot enforces mandatory email verification to send order tracking receipts and ensure autonomous checkout security.
                </p>

                {verificationMessage && (
                  <div className="p-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                    {verificationMessage}
                  </div>
                )}

                {verificationStatus === 'IDLE' ? (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSendingCode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send 6-Digit Verification Code</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold tracking-widest rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={verificationStatus === 'VERIFYING' || verificationCode.length !== 6}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {verificationStatus === 'VERIFYING' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Verify</span>
                        )}
                      </button>
                    </div>

                    {simulatedEmailCode && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 font-mono">Dev simulated code:</span>
                        <button
                          type="button"
                          onClick={() => setVerificationCode(simulatedEmailCode)}
                          className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md hover:underline cursor-pointer"
                        >
                          Auto-fill {simulatedEmailCode}
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-stone-500">
                      {resendCooldown > 0 ? (
                        <span>Resend code in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={isSendingCode}
                          className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                        >
                          Resend verification code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2">
            <h4 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">
              Order Summary
            </h4>
            <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Items ({cart.itemCount})</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">₹{subtotalRupees}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">₹{deliveryRupees}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">₹{platformFeeRupees}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Loyalty Discount</span>
                <span className="font-mono">-₹{discountRupees}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-extrabold text-sm text-stone-900 dark:text-white">
                <span>Total Payable</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-base">₹{totalRupees}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-stone-500 uppercase tracking-wider">
              Payment Method
            </h4>

            {/* CartPilot Wallet Option */}
            <label
              onClick={() => setSelectedMethod('WALLET')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'WALLET'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-stone-900 dark:text-white block">
                      CartPilot Wallet
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.2 rounded-full">
                      1-Tap
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold ${isWalletSufficient ? 'text-stone-500' : 'text-rose-600 font-bold'}`}>
                    Available Balance: ₹{walletBalance.toFixed(2)} {!isWalletSufficient && '(Insufficient)'}
                  </span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'WALLET'}
                onChange={() => setSelectedMethod('WALLET')}
                className="accent-emerald-600 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Razorpay Option */}
            <label
              onClick={() => setSelectedMethod('RAZORPAY')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'RAZORPAY'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  rzp
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-900 dark:text-white block">
                    Razorpay (UPI, Cards, NetBanking)
                  </span>
                  <span className="text-[10px] text-stone-500">Instant secured payment gateway</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'RAZORPAY'}
                onChange={() => setSelectedMethod('RAZORPAY')}
                className="accent-emerald-600 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* UPI Option */}
            <label
              onClick={() => setSelectedMethod('UPI')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'UPI'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center">
                  UPI
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-900 dark:text-white block">
                    Direct UPI (Google Pay, PhonePe, Paytm)
                  </span>
                  <span className="text-[10px] text-stone-500">Fast 1-click mobile verification</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'UPI'}
                onChange={() => setSelectedMethod('UPI')}
                className="accent-emerald-600 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Cash on Delivery */}
            <label
              onClick={() => setSelectedMethod('COD')}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMethod === 'COD'
                  ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  ₹
                </div>
                <div>
                  <span className="font-extrabold text-xs text-stone-900 dark:text-white block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] text-stone-500">Pay cash upon morning arrival</span>
                </div>
              </div>
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'COD'}
                onChange={() => setSelectedMethod('COD')}
                className="accent-emerald-600 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
          <button
            type="button"
            onClick={!isEmailVerified ? handleSendVerificationCode : handlePlaceOrder}
            disabled={isProcessing || (selectedMethod === 'WALLET' && !isWalletSufficient)}
            className={`w-full py-4 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 min-h-[50px] text-white ${
              !isEmailVerified
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/25'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order & Reserving Stock…</span>
              </>
            ) : !isEmailVerified ? (
              <>
                <Mail className="w-4 h-4" />
                <span>Verify Email to Place Order · ₹{totalRupees}</span>
              </>
            ) : (
              <>
                <span>
                  {selectedMethod === 'WALLET' ? 'Pay with Wallet' : 'Place Order'} · ₹{totalRupees}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>256-bit encrypted secure checkout · Pure vegetarian guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
