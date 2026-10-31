import React, { useState } from 'react';
import {
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { TransactionRecord } from './types';

export const MerchantFinanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'settlements' | 'payouts' | 'refunds' | 'reports'>('transactions');
  const [dateRange, setDateRange] = useState('This Month');

  const ledger: TransactionRecord[] = [
    {
      id: 'tx-1',
      date: '26 Dec, 10:24',
      transactionId: 'pay_3H2dK89sL912',
      orderId: 'CP-10028',
      type: 'Order Payment',
      amountPaise: 22900,
      isCredit: true,
      status: 'Success',
    },
    {
      id: 'tx-2',
      date: '25 Dec, 14:12',
      transactionId: 'pay_8Jd7Kp1xM441',
      orderId: 'CP-10027',
      type: 'Order Payment',
      amountPaise: 42000,
      isCredit: true,
      status: 'Success',
    },
    {
      id: 'tx-3',
      date: '25 Dec, 11:05',
      transactionId: 'ref_9Ls5Px2wK190',
      orderId: 'CP-10021',
      type: 'Refund',
      amountPaise: 12000,
      isCredit: false,
      status: 'Processed',
    },
    {
      id: 'tx-4',
      date: '24 Dec, 16:32',
      transactionId: 'pay_7Hq2Qs8dL102',
      orderId: 'CP-10020',
      type: 'Order Payment',
      amountPaise: 89000,
      isCredit: true,
      status: 'Success',
    },
    {
      id: 'tx-5',
      date: '24 Dec, 12:18',
      transactionId: 'pay_1Wp9Rz3xK991',
      orderId: 'CP-10019',
      type: 'Order Payment',
      amountPaise: 53500,
      isCredit: true,
      status: 'Success',
    },
  ];

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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
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
            ₹1,24,520
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Total processed GMV</span>
        </div>

        {/* Platform Commission */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Platform Commission</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹6,225
            <span className="text-xs font-normal text-slate-400 ml-1.5">(5%)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">CartPilot service fee</span>
        </div>

        {/* Payment Fees */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Payment Gateway</span>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            ₹2,490
            <span className="text-xs font-normal text-slate-400 ml-1.5">(2%)</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Razorpay gateway cost</span>
        </div>

        {/* Net Payable */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
          <span className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold">Net Payable</span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            ₹1,15,805
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 inline-block font-medium">
            Next payout: Tuesday
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'transactions', label: 'Transactions' },
          { id: 'settlements', label: 'Settlements' },
          { id: 'payouts', label: 'Payouts' },
          { id: 'refunds', label: 'Refunds' },
          { id: 'reports', label: 'Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {ledger.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.date}</td>

                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {item.transactionId}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    #{item.orderId}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        item.isCredit ? 'text-slate-700 dark:text-slate-200' : 'text-amber-600'
                      }`}
                    >
                      {item.isCredit ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {item.type}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold">
                    <span
                      className={
                        item.isCredit
                          ? 'text-slate-900 dark:text-white'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {item.isCredit ? '+' : '-'}₹{(item.amountPaise / 100).toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
