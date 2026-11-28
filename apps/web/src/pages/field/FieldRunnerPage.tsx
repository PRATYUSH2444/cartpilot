import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  RefreshCw,
  Store,
  Check,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

export const FieldRunnerPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [lot, setLot] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRun = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders/public/field-run/${token}`);
      if (res.ok) {
        const d = await res.json();
        setLot(d.data);
      } else {
        const d = await res.json();
        setError(d.error?.message || 'Invalid or expired collection run sheet link');
      }
    } catch {
      setError('Cannot connect to CartPilot Dark-Store server');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  const toggleCheckItem = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const handleMarkCollected = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders/public/field-run/${token}/collect`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuccessMessage('Crate collection confirmed! Items logged for Dark-Store Hub transfer.');
        fetchRun();
      } else {
        const d = await res.json();
        setError(d.error?.message || 'Failed to confirm pickup');
      }
    } catch {
      setError('Network error confirming pickup');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm font-bold">Loading Field Collection Sheet...</span>
        </div>
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-heading font-black">Run Sheet Unavailable</h2>
          <p className="text-xs text-stone-400">{error || 'This link may have expired or already been completed.'}</p>
          <button
            onClick={fetchRun}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isCollected = lot.status === 'COLLECTED';
  const merchant = lot.merchantId || {};

  return (
    <div className="min-h-screen bg-stone-950 text-white p-4 pb-20 select-none">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span className="font-heading font-black text-sm tracking-tight">CartPilot Field Collection</span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                isCollected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {lot.status}
            </span>
          </div>

          <div className="text-xs text-stone-300 font-mono">Lot: #{lot.lotNumber}</div>
        </div>

        {/* Merchant Pickup Address */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Store className="w-4 h-4" />
            <span>Pickup From:</span>
          </div>
          <div className="text-sm font-bold text-white">{merchant.businessName || 'Partner Merchant'}</div>
          {merchant.contactPhone && (
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{merchant.contactPhone}</span>
            </div>
          )}
          {merchant.address && (
            <div className="text-xs text-stone-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {merchant.address.street}, {merchant.address.city} - {merchant.address.postalCode}
              </span>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Items to Collect */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span>Crate Inventory ({lot.items?.length || 0} items)</span>
            <span className="font-mono text-emerald-400">{lot.totalUnits} Units Total</span>
          </div>

          <div className="space-y-2">
            {lot.items?.map((item: any, idx: number) => {
              const isChecked = checkedItems.has(item.productId || String(idx)) || isCollected;
              return (
                <div
                  key={idx}
                  onClick={() => !isCollected && toggleCheckItem(item.productId || String(idx))}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-stone-800/80 border-stone-700 text-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-stone-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="text-[11px] text-stone-400">
                        {item.packageSize} {item.packageUnit}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-heading font-black text-white">Qty: {item.totalQuantity}</div>
                    <div className="text-[10px] text-stone-400">{item.orderCount} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {!isCollected ? (
          <button
            onClick={handleMarkCollected}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming Pickup...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>Confirm Physical Crate Pickup</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-xs font-bold text-emerald-300">Pickup Completed</div>
            <p className="text-[11px] text-stone-400">
              Transport crate to CartPilot Central Dark Store Hub for cross-dock sorting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
