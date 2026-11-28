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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Wholesale Fulfilment & Pickup Crates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Prepare pure-veg crates for CartPilot Dark-Store collection runners. Zero customer PII.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Harvest Crates</span>
          </button>
          <button
            onClick={fetchLots}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Refresh lots"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLots ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          <strong>Privacy Shield Active:</strong> CartPilot Dark-Store Hub consolidates items across multiple merchants. Customer names, phones, and home addresses are never shared.
        </span>
      </div>

      {/* ── Section 1: Active Pickup Lots (Crates for Runner) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Scheduled Pickup Crates ({lots.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Morning (06:00-10:00 AM) & Evening (05:00-09:00 PM) Runs
          </span>
        </div>

        {lots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Scheduled Crates for Current Window
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              When shoppers place orders before midnight, CartPilot's aggregation engine bundles items into a pickup crate for the morning runner.
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
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {lot.lotNumber}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Slot: {lot.deliverySlot} • {lot.totalUnits} Units Total
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        isCollected
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isReady
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
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
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.name} ({item.packageSize} {item.packageUnit})
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          x{item.totalQuantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                      Payout: ₹{((lot.totalPayoutPaise || 0) / 100).toFixed(2)}
                    </span>

                    {!isCollected && !isReady && (
                      <button
                        onClick={() => handleMarkReady(lot._id)}
                        disabled={updatingLotId === lot._id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {updatingLotId === lot._id ? 'Updating...' : 'Mark Crate Ready'}
                      </button>
                    )}

                    {isReady && (
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Awaiting Runner Arrival</span>
                      </span>
                    )}

                    {isCollected && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
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
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Real-Time Store Orders Overview ({orders.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase">New / Pending</span>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-white">
              {pendingOrders.length}
            </div>
            <p className="text-[10px] text-slate-400">Ready to accept</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">Preparing</span>
            <div className="text-xl font-heading font-black text-amber-500">
              {preparingOrders.length}
            </div>
            <p className="text-[10px] text-slate-400">Harvest & packing</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase">Ready</span>
            <div className="text-xl font-heading font-black text-purple-500">
              {readyOrders.length}
            </div>
            <p className="text-[10px] text-slate-400">Handover to runner</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Dispatched</span>
            <div className="text-xl font-heading font-black text-emerald-500">
              {completedOrders.length}
            </div>
            <p className="text-[10px] text-slate-400">En route / Delivered</p>
          </div>
        </div>
      </div>
    </div>
  );
};
