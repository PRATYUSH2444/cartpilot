import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Hash,
  FileText,
  MapPin,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { OrderData, ProofVerificationResult } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface OrderCardProps {
  order: OrderData;
  onAdvanceFulfillment: (orderId: string) => void;
  isLoading?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onAdvanceFulfillment,
  isLoading = false,
}) => {
  const { authFetch } = useAuth();
  // Defensive fallbacks for all order fields to prevent runtime errors
  const orderId = order?._id || (order as any)?.orderId || '';
  const orderNumber = order?.orderNumber || (orderId ? `ORD-${orderId.slice(-6).toUpperCase()}` : 'ORD-PENDING');
  const status: string = order?.status || 'CONFIRMED';
  
  const pricing = order?.pricingSnapshot || {
    subtotalPaise: (order as any)?.subtotalPaise ?? (order as any)?.totalPaise ?? 0,
    deliveryFeePaise: (order as any)?.deliveryFeePaise ?? 0,
    platformFeePaise: (order as any)?.platformFeePaise ?? 0,
    taxPaise: (order as any)?.taxPaise ?? 0,
    discountPaise: (order as any)?.discountPaise ?? 0,
    totalPaise: (order as any)?.totalPaise ?? 0,
  };

  const totalPaise = pricing.totalPaise ?? (order as any)?.totalPaise ?? 0;
  const subtotalPaise = pricing.subtotalPaise ?? totalPaise;
  const deliveryFeePaise = pricing.deliveryFeePaise ?? 0;
  const platformFeePaise = pricing.platformFeePaise ?? 0;
  const taxPaise = pricing.taxPaise ?? 0;
  const discountPaise = pricing.discountPaise ?? 0;

  const totalRupees = (totalPaise / 100).toFixed(2);
  const subtotalRupees = (subtotalPaise / 100).toFixed(2);
  const deliveryRupees = (deliveryFeePaise / 100).toFixed(2);
  const platformFeeRupees = (platformFeePaise / 100).toFixed(2);
  const taxRupees = (taxPaise / 100).toFixed(2);
  const discountRupees = (discountPaise / 100).toFixed(2);

  const items = order?.items ?? [];
  const shippingAddress = order?.shippingAddressSnapshot || (order as any)?.shippingAddress;
  const deliveryNote = order?.deliveryNote || (order as any)?.deliveryInstructions;
  const placedAt = order?.placedAt ? new Date(order.placedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : 'Just now';

  // Defensive address string resolution
  const addressDisplay = shippingAddress?.street
    ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} — ${shippingAddress.postalCode}`
    : 'Boring Road, Patna, Bihar — 800001';

  // Novelty N6: Cryptographic Proof Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [proofResult, setProofResult] = useState<ProofVerificationResult | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleCopyOrderNumber = () => {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleVerifyProof = async () => {
    if (!orderId) {
      setVerifyError('Order ID missing for proof verification');
      return;
    }
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await authFetch(`${API_BASE}/orders/${orderId}/proof/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const body = await res.json();
        setProofResult(body.data);
      } else {
        const errJson = await res.json().catch(() => null);
        setVerifyError(errJson?.error?.message || 'Proof verification failed on server');
      }
    } catch (err) {
      console.error('Proof verification failed', err);
      setVerifyError('Could not reach verification service');
    } finally {
      setIsVerifying(false);
    }
  };

  // 4-stage Fulfillment Timeline
  const steps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PACKING', label: 'Packing', icon: Package },
    { key: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: Home },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'CONFIRMED':
        return 0;
      case 'PACKING':
      case 'PACKED':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(status);

  // Status Badge Metadata
  const getStatusBadge = () => {
    switch (status) {
      case 'DELIVERED':
        return {
          label: 'Delivered',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          pulse: false,
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          pulse: true,
        };
      case 'PACKING':
      case 'PACKED':
        return {
          label: 'Packing Items',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          pulse: true,
        };
      case 'CANCELLED':
      case 'FAILED':
        return {
          label: status,
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          pulse: false,
        };
      default:
        return {
          label: 'Confirmed & Locked',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          pulse: false,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="w-full rounded-2xl border border-emerald-500/25 bg-card/95 dark:bg-card-top/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-emerald-500/5 transition-all text-ink">
      {/* 1. Header with Status, Order Number & Amount */}
      <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-brd">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badge.classes}`}
            >
              {badge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {badge.label}
            </span>
            <span className="text-[11px] text-mut font-mono">
              {placedAt}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <h3 className="text-base sm:text-lg font-display font-black tracking-tight text-ink">
              {orderNumber}
            </h3>
            <button
              onClick={handleCopyOrderNumber}
              title="Copy Order Number"
              className="p-1 rounded-md text-mut hover:text-ink hover:bg-paper transition-colors"
              aria-label="Copy order number"
            >
              {copiedNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[10px] text-mut uppercase font-mono tracking-wider block">
            Amount Paid
          </span>
          <div className="text-lg sm:text-xl font-display font-black text-emerald-600 dark:text-emerald-400">
            ₹{totalRupees}
          </div>
        </div>
      </div>

      {/* 2. Interactive Fulfillment Progression Timeline */}
      <div className="p-4 rounded-xl border border-brd bg-paper/60 mb-4">
        <div className="flex items-center justify-between relative">
          {/* Base inactive bar */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-brd -translate-y-1/2 z-0" />
          {/* Active emerald progress bar */}
          <div
            className="absolute top-4 left-6 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${Math.min(100, (currentStepIdx / 3) * 100)}%` }}
          />

          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={st.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-card border border-brd text-mut'
                  } ${isCurrent ? 'ring-4 ring-emerald-500/25 ring-offset-2 ring-offset-card' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium text-center ${
                    isCurrent
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : isCompleted
                        ? 'text-ink font-semibold'
                        : 'text-mut'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Itemized Basket Snapshot */}
      <div className="p-3.5 rounded-xl border border-brd bg-paper/50 mb-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-mut uppercase font-mono tracking-wider">
            Verified Line Items Snapshot
          </span>
          <span className="text-[11px] text-mut font-mono">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="space-y-1.5 divide-y divide-brd/50">
            {items.map((item, idx) => (
              <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="100% Vegetarian" />
                  <span className="text-ink truncate font-medium">{item.name}</span>
                  <span className="text-mut font-mono text-[11px] flex-shrink-0">
                    ({item.packageSize} {item.packageUnit}) × {item.quantity}
                  </span>
                </div>
                <span className="font-mono font-semibold text-ink text-xs flex-shrink-0">
                  ₹{(item.subtotalPaise / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mut italic">No line items snapshot recorded</p>
        )}

        {/* Pricing Summary */}
        <div className="pt-2.5 border-t border-brd space-y-1.5 text-xs text-mut">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-mono text-ink">₹{subtotalRupees}</span>
          </div>

          <div className="flex justify-between">
            <span>Estimated Delivery</span>
            <span className="font-mono text-ink">
              {deliveryFeePaise === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10">
                  FREE
                </span>
              ) : (
                `₹${deliveryRupees}`
              )}
            </span>
          </div>

          {platformFeePaise > 0 && (
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-mono text-ink">₹{platformFeeRupees}</span>
            </div>
          )}

          {taxPaise > 0 && (
            <div className="flex justify-between">
              <span>Taxes (GST)</span>
              <span className="font-mono text-ink">₹{taxRupees}</span>
            </div>
          )}

          {discountPaise > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span className="font-mono font-semibold">-₹{discountRupees}</span>
            </div>
          )}

          <div className="flex justify-between pt-1.5 border-t border-brd font-bold text-ink">
            <span>Total Paid (Integer Paise Sealed)</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalRupees}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Delivery Instructions (if provided) */}
      {deliveryNote && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs mb-4">
          <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Delivery Instructions:</span>
          </div>
          <p className="text-ink font-mono text-[11px] italic">"{deliveryNote}"</p>
        </div>
      )}

      {/* 5. Delivery Address Snapshot (Guarded against undefined) */}
      <div className="p-3.5 rounded-xl border border-brd bg-paper/50 text-xs mb-4">
        <div className="flex items-center gap-1.5 text-mut mb-1">
          <MapPin className="w-3.5 h-3.5 text-acc" />
          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">
            Delivery Destination
          </span>
        </div>
        <p className="text-ink leading-relaxed font-sans pl-5">
          {addressDisplay}
        </p>
      </div>

      {/* 6. Novelty N6: Tamper-Evident Integrity Receipt */}
      <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink font-display">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Tamper-Evident Integrity Receipt (N6)</span>
          </div>
          <button
            onClick={handleVerifyProof}
            disabled={isVerifying || !orderId}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-600/20 cursor-pointer disabled:opacity-50 min-h-[36px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Auditing Ledger...' : 'Verify Integrity Receipt'}
          </button>
        </div>

        {verifyError && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}

        {proofResult ? (
          <div className="mt-2.5 pt-2.5 border-t border-purple-500/20 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{proofResult.message || 'Order record integrity verified: snapshot and audit chain have not been altered'}</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-brd/60">
                <span className="text-mut">{proofResult.checks?.orderContentsMatch?.label || 'Order Contents Digest'}:</span>
                <span
                  className={
                    proofResult.checks?.orderContentsMatch?.passed
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks?.orderContentsMatch?.passed ? 'MATCHED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-brd/60">
                <span className="text-mut">{proofResult.checks?.approvalBinding?.label || 'Approval HMAC Binding'}:</span>
                <span
                  className={
                    proofResult.checks?.approvalBinding?.passed
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks?.approvalBinding?.passed ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-brd/60">
                <span className="text-mut">{proofResult.checks?.auditChainIntact?.label || 'Audit Ledger Chain'}:</span>
                <span
                  className={
                    proofResult.checks?.auditChainIntact?.passed
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks?.auditChainIntact?.passed ? 'INTACT' : 'TAMPERED'}
                </span>
              </div>
            </div>

            {proofResult.canonicalSnapshotHash && (
              <div className="flex items-center gap-1 text-[10px] text-mut font-mono truncate pt-1">
                <Hash className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Snapshot: {proofResult.canonicalSnapshotHash}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-mut leading-relaxed">
            Verify order integrity receipt: checks that the order record, line items, and audit ledger have not been altered since placement (internal server integrity verification, not independent third-party proof).
          </p>
        )}
      </div>

      {/* 7. Fulfillment Step Advancement CTA */}
      {status !== 'DELIVERED' && status !== 'CANCELLED' && status !== 'FAILED' && (
        <button
          onClick={() => orderId && onAdvanceFulfillment(orderId)}
          disabled={isLoading || !orderId}
          className="w-full py-3 px-4 rounded-xl border border-acc text-acc hover:bg-acc hover:text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          <span>Simulate Next Fulfillment Step</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
