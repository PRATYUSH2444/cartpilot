import React, { useState } from 'react';
import {
  Plus,
  Trash2,
} from 'lucide-react';
import { CouponRecord } from './types';

export const MerchantMarketingView: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponRecord[]>([
    {
      id: 'c-1',
      code: 'FRESH20',
      discountPercent: 20,
      minOrderPaise: 50000,
      maxDiscountPaise: 15000,
      validUntil: '31 Dec 2026',
      usageCount: 148,
      isActive: true,
    },
    {
      id: 'c-2',
      code: 'VEG10',
      discountPercent: 10,
      minOrderPaise: 20000,
      maxDiscountPaise: 5000,
      validUntil: '15 Jan 2027',
      usageCount: 82,
      isActive: true,
    },
    {
      id: 'c-3',
      code: 'ORGANIC15',
      discountPercent: 15,
      minOrderPaise: 60000,
      maxDiscountPaise: 20000,
      validUntil: '28 Feb 2027',
      usageCount: 43,
      isActive: true,
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('15');
  const [newMinOrder, setNewMinOrder] = useState('400');
  const [newMaxCap, setNewMaxCap] = useState('100');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;
    const item: CouponRecord = {
      id: `c-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      discountPercent: parseInt(newDiscount, 10) || 10,
      minOrderPaise: Math.round(parseFloat(newMinOrder || '0') * 100),
      maxDiscountPaise: Math.round(parseFloat(newMaxCap || '0') * 100),
      validUntil: '31 Dec 2027',
      usageCount: 0,
      isActive: true,
    };
    setCoupons([item, ...coupons]);
    setIsAddModalOpen(false);
    setNewCode('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Marketing & Offers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create promotional discount codes and manage seasonal shopping campaigns
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Promotional Campaign Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Redemptions</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">273</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-block">
            +38 this week
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Discount Given</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">₹18,450</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Avg. ₹67 savings / order</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Incremental Sales</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹1,08,200
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">5.8x marketing ROI</span>
        </div>
      </div>

      {/* Active Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-sm tracking-wider">
                  {c.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {c.discountPercent}% OFF on orders
                </p>
                <p className="text-slate-400">
                  Min order ₹{(c.minOrderPaise / 100).toFixed(0)} • Max discount ₹{(c.maxDiscountPaise / 100).toFixed(0)}
                </p>
                <p className="text-[11px] text-slate-400">Valid until: {c.validUntil}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{c.usageCount} times redeemed</span>
              <button
                onClick={() => setCoupons(coupons.filter((x) => x.id !== c.id))}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Remove coupon"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create Promotional Coupon
            </h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE25"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={newMaxCap}
                    onChange={(e) => setNewMaxCap(e.target.value)}
                    placeholder="100"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  placeholder="400"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-semibold"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
