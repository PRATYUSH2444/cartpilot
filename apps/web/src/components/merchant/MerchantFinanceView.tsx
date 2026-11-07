import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
} from 'lucide-react';
import { OrderData } from './types';

interface MerchantFinanceViewProps {
  orders?: OrderData[];
}

export const MerchantFinanceView: React.FC<MerchantFinanceViewProps> = ({ orders = [] }) => {
  const [dateRange, setDateRange] = useState('This Month');

  // Compute live revenue, platform fee (5%), gateway fee (2%), net payable
  const totalGrossSalesPaise = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.pricingSnapshot?.totalPaise || 0), 0);
  }, [orders]);

  const platformFeePaise = Math.round(totalGrossSalesPaise * 0.05);
  const gatewayFeePaise = Math.round(totalGrossSalesPaise * 0.02);
  const netEarningsPaise = totalGrossSalesPaise - platformFeePaise - gatewayFeePaise;

  const ledger = useMemo(() => {
    return orders.map((o) => {
      const orderDate = o.createdAt || o.placedAt;
      return {
        id: o._id,
        date: orderDate
          ? new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Recent',
        transactionId: o.paymentDetails?.razorpayPaymentId || `pay_${o._id.slice(-8)}`,
        orderId: `CP-${o.orderNumber}`,
        type: 'Order Payment',
        amountPaise: o.pricingSnapshot?.totalPaise || 0,
        isCredit: true,
        status: o.paymentStatus === 'PAID' ? 'Success' : (o.paymentStatus || 'Success'),
      };
    });
  }, [orders]);

  const handleDownloadStatement = () => {
    const csv =
      'Date,Transaction ID,Order ID,Type,Amount,Status\n' +
      ledger
        .map(
          (t) =>
            `"${t.date}","${t.transactionId}","${t.orderId}","${t.type}",₹${(
              t.amountPaise / 100
            ).toFixed(2)},${t.status}`
        )
        .join('\n');
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `financial-statement-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Finance & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track your gross revenue, platform commission, gateway fees and bank settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Quarter</option>
            </select>
          </div>

          <button
            onClick={handleDownloadStatement}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Statement</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gross Sales</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{(totalGrossSalesPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Total processed GMV</span>
        </div>

        {/* Platform Commission */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Platform Commission</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{(platformFeePaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            <span className="text-xs font-normal text-slate-400 ml-1.5">(5%)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">CartPilot service fee</span>
        </div>

        {/* Payment Fees */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Payment Gateway</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹{(gatewayFeePaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            <span className="text-xs font-normal text-slate-400 ml-1.5">(2%)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Razorpay gateway cost</span>
        </div>

        {/* Net Payable */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">Net Payable</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            ₹{(netEarningsPaise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 inline-block font-medium">
            Direct store settlement
          </span>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 font-normal">Date & Time</th>
                <th className="pb-3 font-normal">Transaction ID</th>
                <th className="pb-3 font-normal">Order ID</th>
                <th className="pb-3 font-normal">Type</th>
                <th className="pb-3 font-normal text-right">Amount</th>
                <th className="pb-3 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                  <td className="py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">{tx.transactionId}</td>
                  <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">{tx.orderId}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{tx.type}</td>
                  <td className="py-3 font-mono font-bold text-right text-slate-900 dark:text-white">
                    ₹{(tx.amountPaise / 100).toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
