import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  RefreshCw,
  Store,
  Check,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { OrderData } from './types';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

interface FulfilmentViewProps {
  orders: OrderData[];
  onSelectOrder?: (orderId: string) => void;
  onAdvanceStatus?: (orderId: string) => Promise<void>;
  isAdvancing?: boolean;
}

export const MerchantFulfilmentView: React.FC<FulfilmentViewProps> = ({
  orders,
}) => {
  const { authFetch } = useAuth();
  const [lots, setLots] = useState<any[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [updatingLotId, setUpdatingLotId] = useState<string | null>(null);

  const fetchLots = useCallback(async () => {
    setIsLoadingLots(true);
    try {
      const res = await authFetch(`${API_BASE}/orders/merchant/lots`);
      if (res.ok) {
        const d = await res.json();
        setLots(d.data || []);
      }
    } catch {
      console.warn('Could not load merchant lots');
    } finally {
      setIsLoadingLots(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const handleMarkReady = async (lotId: string) => {
    setUpdatingLotId(lotId);
    try {
      const res = await authFetch(`${API_BASE}/orders/merchant/lots/${lotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY_FOR_PICKUP' }),
      });
      if (res.ok) {
        fetchLots();
      }
    } catch (err) {
      console.error('Failed to update lot status', err);
    } finally {
      setUpdatingLotId(null);
    }
  };

  // Real orders grouped by fulfillment stage
  const pendingOrders = orders.filter((o) => ['CONFIRMED', 'PAID', 'PENDING_PAYMENT'].includes(o.status));
  const preparingOrders = orders.filter((o) => ['ACCEPTED', 'PREPARING', 'PACKING'].includes(o.status));
  const readyOrders = orders.filter((o) => ['PACKED', 'READY_FOR_HANDOVER'].includes(o.status));
  const completedOrders = orders.filter((o) => ['OUT_FOR_DELIVERY', 'DISPATCHED', 'DELIVERED'].includes(o.status));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-card border border-brd shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-display text-ink tracking-tight">
              Wholesale Fulfilment & Pickup Crates
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
              Merchant Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-mut mt-1">
            Prepare pure-veg harvest crates for CartPilot Dark-Store collection runners. Zero customer PII.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-brd text-xs font-semibold text-ink bg-paper hover:bg-card cursor-pointer shadow-2xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Harvest Crates</span>
          </button>
          <button
            onClick={fetchLots}
            className="p-2 rounded-2xl border border-brd text-ink bg-paper hover:bg-card cursor-pointer transition-colors"
            title="Refresh lots"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingLots ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-surface-2 border border-brd text-xs text-ink flex items-center gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
        <span>
          <strong>Privacy Shield Active:</strong> CartPilot Dark-Store Hub consolidates items across multiple merchants. Customer names, phones, and home addresses are never shared.
        </span>
      </div>

      {/* ── Section 1: Active Pickup Lots (Crates for Runner) ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-display text-ink flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-500" />
            <span>Scheduled Pickup Crates ({lots.length})</span>
          </h2>
          <span className="text-[11px] text-mut font-medium">
            Morning (06:00-10:00 AM) & Evening (05:00-09:00 PM) Runs
          </span>
        </div>

        {lots.length === 0 ? (
          <div className="p-10 rounded-3xl bg-card border border-brd text-center space-y-2.5 shadow-xs">
            <Package className="w-10 h-10 text-mut mx-auto opacity-60" />
            <div className="text-sm font-bold text-ink">
              No Scheduled Crates for Current Window
            </div>
            <p className="text-xs text-mut max-w-sm mx-auto">
              When shoppers place orders before cutoff, CartPilot's aggregation engine bundles items into a pickup crate for the runner.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lots.map((lot) => {
              const isCollected = lot.status === 'COLLECTED';
              const isReady = lot.status === 'READY_FOR_PICKUP';

              return (
                <div
                  key={lot._id}
                  className="p-5 sm:p-6 rounded-3xl bg-card border border-brd shadow-xs space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-brd pb-3">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {lot.lotNumber}
                      </span>
                      <div className="text-[11px] text-mut mt-0.5">
                        Slot: {lot.deliverySlot} • {lot.totalUnits} Units Total
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        isCollected
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isReady
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {lot.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Items to pack into crate */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {lot.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-2 border border-brd flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-ink">
                          {item.name} ({item.packageSize} {item.packageUnit})
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          x{item.totalQuantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-3 border-t border-brd flex items-center justify-between">
                    <span className="font-heading font-black text-xs text-ink">
                      Payout: ₹{((lot.totalPayoutPaise || 0) / 100).toFixed(2)}
                    </span>

                    {!isCollected && !isReady && (
                      <button
                        onClick={() => handleMarkReady(lot._id)}
                        disabled={updatingLotId === lot._id}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {updatingLotId === lot._id ? 'Updating...' : 'Mark Crate Ready'}
                      </button>
                    )}

                    {isReady && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Awaiting Runner Arrival</span>
                      </span>
                    )}

                    {isCollected && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Collected by Runner</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Real Order Handover Board ── */}
      <div className="space-y-3.5 pt-2">
        <h2 className="text-sm font-bold font-display text-ink flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-500" />
          <span>Real-Time Store Orders Overview ({orders.length})</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd space-y-1 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
            <span className="text-[11px] font-mono text-mut font-semibold uppercase tracking-wider">New / Pending</span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">
              {pendingOrders.length}
            </div>
            <p className="text-[11px] text-mut">Ready to accept</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd space-y-1 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Preparing</span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-amber-500 my-1">
              {preparingOrders.length}
            </div>
            <p className="text-[11px] text-mut">Harvest & packing</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd space-y-1 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
            <span className="text-[11px] font-mono text-zinc-900 dark:text-zinc-100 font-semibold uppercase tracking-wider">Ready</span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">
              {readyOrders.length}
            </div>
            <p className="text-[11px] text-mut">Handover to runner</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd space-y-1 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Dispatched</span>
            <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-500 my-1">
              {completedOrders.length}
            </div>
            <p className="text-[11px] text-mut">En route / Delivered</p>
          </div>
        </div>
      </div>
    </div>
  );
};
