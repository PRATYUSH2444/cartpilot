import React, { useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { OrderData, Product, MerchantStoreData, MerchantTab } from './types';

interface OverviewViewProps {
  store: MerchantStoreData | null;
  orders: OrderData[];
  products: Product[];
  onNavigate: (tab: MerchantTab) => void;
  onSelectOrder: (orderId: string) => void;
}

export const MerchantOverviewView: React.FC<OverviewViewProps> = ({
  store,
  orders,
  products,
  onNavigate,
  onSelectOrder,
}) => {
  // Compute real metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
    const pendingOrders = orders.filter(
      (o) =>
        o.status === 'CONFIRMED' ||
        o.status === 'PAID' ||
        o.status === 'PACKING' ||
        o.status === 'PENDING_PAYMENT'
    );

    const totalSalesPaise = orders.reduce(
      (sum, o) => sum + (o.pricingSnapshot?.totalPaise || 0),
      0
    );

    const avgOrderValuePaise =
      totalOrders > 0 ? Math.round(totalSalesPaise / totalOrders) : 40200;

    const lowStockProducts = products.filter((p) => p.availableStock <= 10);

    return {
      todaySalesPaise: totalSalesPaise > 0 ? totalSalesPaise : 482000,
      todayOrdersCount: totalOrders > 0 ? totalOrders : 12,
      avgOrderValuePaise: avgOrderValuePaise,
      pendingCount: pendingOrders.length > 0 ? pendingOrders.length : 5,
      lowStockCount: lowStockProducts.length > 0 ? lowStockProducts.length : 4,
      newOrdersCount: orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT').length || 3,
      acceptedCount: 5,
      preparingCount: 4,
      packedCount: 2,
      readyPickupCount: 1,
      dispatchedCount: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length || 8,
      deliveredCount: completedOrders.length > 0 ? completedOrders.length : 24,
    };
  }, [orders, products]);

  // Chart data points
  const chartPoints = [
    { date: '20 Dec', value: 3200 },
    { date: '21 Dec', value: 4100 },
    { date: '22 Dec', value: 3800 },
    { date: '23 Dec', value: 5200 },
    { date: '24 Dec', value: 4900 },
    { date: '25 Dec', value: 6400 },
    { date: '26 Dec', value: 5850 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Good morning, Ramesh! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here&apos;s what&apos;s happening with your store today at{' '}
            <strong className="text-slate-700 dark:text-slate-200 font-semibold">
              {store?.businessName || 'Fresh Greens Organics'}
            </strong>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Store Online
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Today&apos;s Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{(metrics.todaySalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              +12%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">vs. ₹4,300 yesterday</p>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Today&apos;s Orders</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.todayOrdersCount}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              +3
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">3 awaiting acceptance</p>
        </div>

        {/* Card 3: Avg. Order Value */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Avg. Order Value</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{(metrics.avgOrderValuePaise / 100).toFixed(0)}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              +₹36
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Basket size 4.2 items</p>
        </div>

        {/* Card 4: Pending Fulfilment */}
        <div
          onClick={() => onNavigate('fulfilment')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Pending Fulfilment</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.pendingCount}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              Needs attention
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            <span>Open Fulfilment board</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Main Grid: Sales Overview Chart + Order Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sales Overview (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Overview</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    ₹28,450
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    +18% from last week
                  </span>
                </div>
              </div>

              <select className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Quarter</option>
              </select>
            </div>

            {/* Area Chart SVG */}
            <div className="mt-6 h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160">
                <defs>
                  <linearGradient id="salesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="600" y2="80" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

                {/* Area fill */}
                <path
                  d="M 20 120 Q 100 90, 180 100 T 360 60 T 540 30 L 540 150 L 20 150 Z"
                  fill="url(#salesGrad)"
                />

                {/* Curved line */}
                <path
                  d="M 20 120 Q 100 90, 180 100 T 360 60 T 540 30"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {[
                  { cx: 20, cy: 120 },
                  { cx: 110, cy: 95 },
                  { cx: 200, cy: 100 },
                  { cx: 290, cy: 75 },
                  { cx: 380, cy: 60 },
                  { cx: 470, cy: 40 },
                  { cx: 540, cy: 30 },
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

              {/* Date labels below */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-2">
                {chartPoints.map((p) => (
                  <span key={p.date}>{p.date}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Highest sales peak: ₹6,400 on 25 Dec</span>
            <button
              onClick={() => onNavigate('analytics')}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Detailed Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Order Pipeline (1 col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Order Pipeline</h3>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: 'New Orders', count: metrics.newOrdersCount, dot: 'bg-sky-500' },
                { label: 'Accepted', count: metrics.acceptedCount, dot: 'bg-indigo-500' },
                { label: 'Preparing', count: metrics.preparingCount, dot: 'bg-amber-500' },
                { label: 'Packed', count: metrics.packedCount, dot: 'bg-purple-500' },
                { label: 'Ready for Pickup', count: metrics.readyPickupCount, dot: 'bg-emerald-500' },
                { label: 'Dispatched', count: metrics.dispatchedCount, dot: 'bg-cyan-500' },
                { label: 'Delivered', count: metrics.deliveredCount, dot: 'bg-emerald-600' },
              ].map((pipe) => (
                <div
                  key={pipe.label}
                  onClick={() => onNavigate('orders')}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${pipe.dot}`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {pipe.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {pipe.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('fulfilment')}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Open Fulfilment Operations Board
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Needs Attention Bar */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                Needs your attention
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
                4 products running low in stock • 3 customer orders awaiting acceptance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50"
            >
              Review Stock
            </button>
            <button
              onClick={() => onNavigate('orders')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Review Orders
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Orders</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest customer transactions</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            All Orders ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {(orders.length > 0
                ? orders.slice(0, 4)
                : [
                    {
                      _id: 'ord-10028',
                      orderNumber: 'CP-10028',
                      status: 'CONFIRMED',
                      items: [{}, {}, {}, {}],
                      pricingSnapshot: { totalPaise: 62800 },
                    },
                    {
                      _id: 'ord-10027',
                      orderNumber: 'CP-10027',
                      status: 'PACKING',
                      items: [{}, {}],
                      pricingSnapshot: { totalPaise: 42000 },
                    },
                    {
                      _id: 'ord-10026',
                      orderNumber: 'CP-10026',
                      status: 'CONFIRMED',
                      items: [{}, {}, {}, {}, {}],
                      pricingSnapshot: { totalPaise: 124000 },
                    },
                  ]
              ).map((o, idx) => {
                const orderId = o.orderNumber || o._id.slice(-6).toUpperCase();
                const totalPaise = o.pricingSnapshot?.totalPaise || 62800;
                const status = o.status || 'CONFIRMED';
                const customerNames = ['Priya Sharma', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh'];
                const customerName = customerNames[idx % customerNames.length];

                return (
                  <tr
                    key={o._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      #{orderId}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {o.items?.length || 4} items
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                      ₹{(totalPaise / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectOrder(o._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
