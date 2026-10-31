import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  Award,
} from 'lucide-react';
import { Product, OrderData } from './types';

interface AnalyticsViewProps {
  products: Product[];
  orders: OrderData[];
}

export const MerchantAnalyticsView: React.FC<AnalyticsViewProps> = () => {
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [activeTab, setActiveTab] = useState<'revenue' | 'orders' | 'products' | 'customers' | 'categories'>('revenue');

  const topProducts = [
    { name: 'Organic Tomatoes', salesPaise: 496000, units: 124, growth: '+22%' },
    { name: 'Cow Milk (Farm Fresh)', salesPaise: 389600, units: 98, growth: '+15%' },
    { name: 'Baby Spinach (Palak)', salesPaise: 210000, units: 84, growth: '+31%' },
    { name: 'Fresh Robusta Bananas', salesPaise: 152500, units: 61, growth: '+9%' },
    { name: 'Aashirvaad Shudh Chakki Atta', salesPaise: 136000, units: 40, growth: '+18%' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track your store sales velocity, order volumes and product conversions
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
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This Quarter</option>
            </select>
          </div>

          <button
            onClick={() => {
              const csv =
                'Metric,Value,Growth\n' +
                'Total Revenue,₹124520,+18%\nTotal Orders,312,+10%\nAvg Order Value,₹399,+₹24\nRepeat Customers,68,+26%';
              const encoded = encodeURI('data:text/csv;charset=utf-8,' + csv);
              const a = document.createElement('a');
              a.href = encoded;
              a.download = `analytics-report-${Date.now()}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Revenue</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₹1,24,520
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +18%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">vs previous 30 days</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total Orders</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">312</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +10%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">99.1% completion rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Average Order Value</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">₹399</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +₹24
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">4.2 items / basket</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Repeat Customers</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">68</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +26%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">44% loyalty retention</span>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'revenue', label: 'Revenue' },
          { id: 'orders', label: 'Orders' },
          { id: 'products', label: 'Products' },
          { id: 'customers', label: 'Customers' },
          { id: 'categories', label: 'Categories' },
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

      {/* Main Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-slate-400">Daily gross retail sales volume</p>
            </div>
            <span className="font-mono text-xs text-slate-400">Daily Average: ₹4,150</span>
          </div>

          <div className="h-60 w-full relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
              <defs>
                <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

              <path
                d="M 20 160 Q 80 120, 150 140 T 300 90 T 450 60 T 560 30 L 560 190 L 20 190 Z"
                fill="url(#analyticsGrad)"
              />

              <path
                d="M 20 160 Q 80 120, 150 140 T 300 90 T 450 60 T 560 30"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {[
                { cx: 20, cy: 160, label: '₹2.8k' },
                { cx: 150, cy: 140, label: '₹3.4k' },
                { cx: 300, cy: 90, label: '₹4.8k' },
                { cx: 450, cy: 60, label: '₹5.9k' },
                { cx: 560, cy: 30, label: '₹6.8k' },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.cx}
                  cy={pt.cy}
                  r="4"
                  className="fill-white dark:fill-slate-900 stroke-emerald-500 stroke-2"
                />
              ))}
            </svg>

            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products Leaderboard */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
              <p className="text-xs text-slate-400">By revenue generated</p>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div
                key={p.name}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.units} units sold
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    ₹{(p.salesPaise / 100).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 block">
                    {p.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
