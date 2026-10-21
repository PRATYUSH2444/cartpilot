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
} from 'lucide-react';
import { OrderData, ProofVerificationResult } from '../../types';

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
  const { status, pricingSnapshot, items, shippingAddressSnapshot } = order;

  const totalRupees = (pricingSnapshot.totalPaise / 100).toFixed(2);
  const subtotalRupees = (pricingSnapshot.subtotalPaise / 100).toFixed(2);
  const deliveryRupees = (pricingSnapshot.deliveryFeePaise / 100).toFixed(2);
  const taxRupees = (pricingSnapshot.taxPaise / 100).toFixed(2);

  // Novelty N6: Tamper-Evident Proof Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [proofResult, setProofResult] = useState<ProofVerificationResult | null>(null);

  const handleVerifyProof = async () => {
    setIsVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/v1/orders/${order._id}/proof/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProofResult(data.data);
      }
    } catch (err) {
      console.error('Proof verification failed', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Status steps
  const steps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PACKING', label: 'Packing', icon: Package },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: Home },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'CONFIRMED':
        return 0;
      case 'PACKING':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(status);

  return (
    <div className="w-full rounded-2xl border border-emerald-500/30 bg-card/90 dark:bg-card-top/90 backdrop-blur-xl p-5 shadow-xl shadow-emerald-500/5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-brd">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
              Order Confirmed & Locked
            </span>
            <h3 className="text-sm font-display font-extrabold text-ink tracking-tight">
              {order.orderNumber}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-mut uppercase font-mono">Paid Total</span>
          <div className="text-base font-display font-black text-emerald-600 dark:text-emerald-400">
            ₹{totalRupees}
          </div>
        </div>
      </div>

      {/* Fulfillment Stepper Timeline */}
      <div className="p-4 rounded-xl border border-brd bg-paper/60 mb-4">
        <div className="flex items-center justify-between relative">
          {/* Connector line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-brd -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
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
                  } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-sans font-medium ${
                    isCompleted ? 'text-ink font-bold' : 'text-mut'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line Item Snapshots */}
      <div className="p-3.5 rounded-xl border border-brd bg-paper/50 mb-4 space-y-2">
        <span className="text-[10px] text-mut uppercase font-mono tracking-wider">
          Frozen Snapshot Line Items
        </span>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-ink">
              {item.name} <span className="text-mut">× {item.quantity}</span>
            </span>
            <span className="font-mono font-medium text-ink">
              ₹{(item.subtotalPaise / 100).toFixed(2)}
            </span>
          </div>
        ))}

        <div className="pt-2 border-t border-brd/80 space-y-1 text-[11px] text-mut">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">₹{subtotalRupees}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span className="font-mono">₹{deliveryRupees}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (5% GST):</span>
            <span className="font-mono">₹{taxRupees}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address Snapshot */}
      <div className="p-3 rounded-xl border border-brd bg-paper/40 text-xs mb-4">
        <span className="text-[10px] text-mut uppercase font-mono tracking-wider block mb-1">
          Delivery Address Snapshot
        </span>
        <p className="text-ink leading-relaxed">
          {shippingAddressSnapshot.street}, {shippingAddressSnapshot.city},{' '}
          {shippingAddressSnapshot.state} — {shippingAddressSnapshot.postalCode}
        </p>
      </div>

      {/* Novelty N6: Cryptographic Tamper-Evident Proof Button & Verification Box */}
      <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink font-display">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Tamper-Evident Cryptographic Order Proof</span>
          </div>
          <button
            onClick={handleVerifyProof}
            disabled={isVerifying}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-600/20"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Verify Cryptographic Proof'}
          </button>
        </div>

        {proofResult ? (
          <div className="mt-2 pt-2 border-t border-purple-500/20 space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{proofResult.message}</span>
            </div>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5">
                <span>{proofResult.checks.orderContentsMatch.label}:</span>
                <span
                  className={
                    proofResult.checks.orderContentsMatch.passed
                      ? 'text-emerald-600 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks.orderContentsMatch.passed ? 'MATCHED' : 'FAILED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5">
                <span>{proofResult.checks.approvalBinding.label}:</span>
                <span
                  className={
                    proofResult.checks.approvalBinding.passed
                      ? 'text-emerald-600 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks.approvalBinding.passed ? 'VERIFIED' : 'FAILED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/5 dark:bg-white/5">
                <span>{proofResult.checks.auditChainIntact.label}:</span>
                <span
                  className={
                    proofResult.checks.auditChainIntact.passed
                      ? 'text-emerald-600 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {proofResult.checks.auditChainIntact.passed ? 'INTACT' : 'TAMPERED'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-mut font-mono truncate">
              <Hash className="w-3 h-3 flex-shrink-0" />
              <span>Snapshot Digest: {proofResult.canonicalSnapshotHash.substring(0, 24)}...</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-mut">
            Click to cryptographically re-hash order items, check approval binding, and walk the
            SHA-256 audit ledger.
          </p>
        )}
      </div>

      {/* Step advancement CTA for demonstration */}
      {status !== 'DELIVERED' && (
        <button
          onClick={() => onAdvanceFulfillment(order._id)}
          disabled={isLoading}
          className="w-full py-2.5 px-3 rounded-xl border border-acc text-acc hover:bg-acc hover:text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <span>Simulate Next Fulfillment Step</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
