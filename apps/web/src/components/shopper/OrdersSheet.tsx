import React, { useState } from 'react';
import {
  X,
  Package,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { OrderData, ProofVerificationResult } from '../../types';
import { API_BASE } from '../../config/api';

interface OrdersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderData[];
  onReorder: (order: OrderData) => void;
  isSlideOver?: boolean;
}

export const OrdersSheet: React.FC<OrdersSheetProps> = ({
  isOpen,
  onClose,
  orders,
  onReorder,
  isSlideOver = false,
}) => {
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [proofResults, setProofResults] = useState<Record<string, ProofVerificationResult>>({});

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVerifyProof = async (orderId: string) => {
    setVerifyingOrderId(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderId}/proof/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const body = await res.json();
        setProofResults((prev) => ({ ...prev, [orderId]: body.data }));
      }
    } catch (err) {
      console.error('Failed to verify proof', err);
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'CONFIRMED':
      case 'PACKING':
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex ${
        isSlideOver ? 'justify-end' : 'items-end sm:items-center justify-center p-0 sm:p-4'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="orders-sheet-title"
    >
      <div
        data-testid="orders-sheet"
        className={`w-full ${
          isSlideOver
            ? 'max-w-xl h-full'
            : 'sm:max-w-2xl max-h-[90dvh] sm:rounded-3xl rounded-t-3xl'
        } bg-card dark:bg-card-top border border-brd shadow-2xl flex flex-col overflow-hidden animate-in ${
          isSlideOver ? 'slide-in-from-right' : 'slide-in-from-bottom'
        } duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {!isSlideOver && (
          <div className="w-12 h-1.5 bg-brd rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-brd flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-acc" />
            <div>
              <h2 id="orders-sheet-title" className="text-base sm:text-lg font-display font-bold text-ink">
                Your Orders &amp; Delivery Tracking
              </h2>
              <p className="text-xs text-mut font-mono">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-mut hover:text-ink hover:bg-paper transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close orders sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {orders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Package className="w-12 h-12 text-mut/40 mx-auto" />
              <h3 className="text-sm font-bold text-ink font-display">No orders yet</h3>
              <p className="text-xs text-mut max-w-sm mx-auto">
                When you place quick-commerce grocery orders, they will appear here with live tracking.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const proof = proofResults[order._id];
              const totalRupees = (order.pricingSnapshot?.totalPaise / 100).toFixed(2);

              return (
                <div
                  key={order._id}
                  className="p-4 rounded-2xl border border-brd bg-paper/50 space-y-3 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-ink">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-mut font-mono mt-0.5 block">
                        Placed: {new Date(order.placedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-black text-sm text-ink block">
                        ₹{totalRupees}
                      </span>
                      <span className="text-[10px] text-mut font-mono">
                        {order.items?.length || 0} items
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="p-2.5 rounded-xl bg-card border border-brd text-xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-ink truncate mr-2">
                          {it.name}{' '}
                          <span className="text-mut font-mono">
                            ({it.packageSize} {it.packageUnit}) × {it.quantity}
                          </span>
                        </span>
                        <span className="font-mono text-ink text-[11px] flex-shrink-0">
                          ₹{(it.subtotalPaise / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Note if present */}
                  {order.deliveryNote && (
                    <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="italic truncate">"{order.deliveryNote}"</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onReorder(order)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[40px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Buy Again</span>
                    </button>

                    <button
                      onClick={() => handleVerifyProof(order._id)}
                      disabled={verifyingOrderId === order._id}
                      className="py-2 px-3 rounded-xl border border-brd bg-card hover:bg-paper text-ink font-mono text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer min-h-[40px]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-acc" />
                      <span>{verifyingOrderId === order._id ? 'Verifying...' : 'Audit Proof'}</span>
                    </button>
                  </div>

                  {/* Proof Result Drawer if checked */}
                  {proof && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cryptographic Ledger Verification Passed</span>
                      </div>
                      <div className="text-[10px] text-mut space-y-0.5 pt-1">
                        <div>Verified Events: {proof.totalAuditEventsVerified}</div>
                        <div className="truncate">Snapshot Hash: {proof.canonicalSnapshotHash}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
