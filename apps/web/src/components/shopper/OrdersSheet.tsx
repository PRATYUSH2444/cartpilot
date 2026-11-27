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
import { useAuth } from '../../context/AuthContext';

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
  const { authFetch } = useAuth();
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
      const res = await authFetch(`${API_BASE}/orders/${orderId}/proof/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
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
      className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex ${
        isSlideOver ? 'justify-end' : 'items-center justify-center p-3 sm:p-4'
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
            : 'max-w-2xl max-h-[88dvh] rounded-3xl'
        } bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 shadow-2xl flex flex-col overflow-hidden animate-in ${
          isSlideOver ? 'slide-in-from-right' : 'zoom-in-95'
        } duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {!isSlideOver && (
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />
        )}

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 id="orders-sheet-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                Your Orders &amp; Delivery Tracking
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close orders sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {orders.length === 0 ? (
            <div className="py-16 text-center space-y-2.5">
              <Package className="w-12 h-12 text-stone-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white">No orders yet</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm mx-auto">
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
                  className="p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/70 space-y-3 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900 dark:text-white">
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
                      <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono mt-0.5 block">
                        Placed: {order.placedAt || (order as any).createdAt ? new Date(order.placedAt || (order as any).createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-black text-sm text-stone-900 dark:text-white block">
                        ₹{totalRupees}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                        {order.items?.length || 0} items
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-stone-900 dark:text-zinc-100 truncate mr-2">
                          {it.name}{' '}
                          <span className="text-stone-500 dark:text-zinc-400 font-mono">
                            ({it.packageSize} {it.packageUnit}) × {it.quantity}
                          </span>
                        </span>
                        <span className="font-mono text-stone-900 dark:text-white text-[11px] flex-shrink-0">
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
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[44px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Buy Again</span>
                    </button>

                    <button
                      onClick={() => handleVerifyProof(order._id)}
                      disabled={verifyingOrderId === order._id}
                      className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-700 text-stone-900 dark:text-white font-mono text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer min-h-[44px]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>{verifyingOrderId === order._id ? 'Verifying...' : 'Integrity Receipt'}</span>
                    </button>
                  </div>

                  {/* Proof Result Drawer if checked */}
                  {proof && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Order Record Integrity Receipt Verified</span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-zinc-400 font-sans pt-0.5">
                        Verifies order snapshot and audit ledger have not been altered on the server (internal integrity verification).
                      </p>
                      <div className="text-[10px] text-stone-500 dark:text-zinc-400 space-y-0.5 pt-1">
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
