import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  Coins,
  Truck,
  Check,
  Coffee,
  Hourglass,
  Users,
  ChevronRight,
  Calendar,
  Settings,
  Bell,
  ShoppingCart,
} from 'lucide-react';
import { OrderData, Product, MerchantStoreData, MerchantTab, MerchantStoreAnalytics } from './types';
import { useLiveClock } from '../../hooks/useLiveClock';

interface MerchantHomeViewProps {
  store: MerchantStoreData | null;
  analytics?: MerchantStoreAnalytics | null;
  orders: OrderData[];
  products: Product[];
  user?: { name?: string; email?: string; role?: string } | null;
  onNavigate: (tab: MerchantTab) => void;
  onSelectOrder: (orderId: string) => void;
  onUpdateDeliveryPreset: (preset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY', minutes: number) => void;
  onToggleAcceptance: (mode: 'OPEN' | 'PAUSED' | 'CLOSED') => void;
}

export const MerchantHomeView: React.FC<MerchantHomeViewProps> = ({
  store,
  analytics,
  orders,
  products,
  user,
  onNavigate,
  onSelectOrder,
  onUpdateDeliveryPreset,
  onToggleAcceptance,
}) => {
  // ── Dynamic Clock & Timezone-Aware Greeting ──────────────────────────────
  const clock = useLiveClock('Asia/Kolkata');
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  // Derive personalized greeting name
  const ownerName = user?.name || store?.businessName || 'Merchant';
  const firstName = ownerName.split(' ')[0] || 'Merchant';

  // ── Authoritative Real-Time Metrics ───────────────────────────────────────
  const metrics = useMemo(() => {
    // 1. Today's Sales: Strictly from backend analytics or paid orders today
    const todaySalesPaise = analytics?.todaySalesPaise !== undefined
      ? analytics.todaySalesPaise
      : orders.reduce((sum, o) => {
          if (
            o.status !== 'CANCELLED' &&
            o.status !== 'FAILED' &&
            o.status !== 'REJECTED' &&
            o.status !== 'PENDING_PAYMENT'
          ) {
            return sum + (o.pricingSnapshot?.totalPaise || 0);
          }
          return sum;
        }, 0);

    // 2. New Orders: Awaiting merchant acceptance
    const newOrdersCount = analytics?.newOrdersCount !== undefined
      ? analytics.newOrdersCount
      : orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT' || o.status === 'PAID').length;

    // 3. Orders to Complete: Active in fulfillment pipeline
    const ordersToCompleteCount = analytics?.ordersToCompleteCount !== undefined
      ? analytics.ordersToCompleteCount
      : orders.filter((o) =>
          [
            'ACCEPTED',
            'PREPARING',
            'PACKING',
            'PACKED',
            'READY_FOR_HANDOVER',
            'OUT_FOR_DELIVERY',
            'DISPATCHED',
          ].includes(o.status)
        ).length;

    // 4. Low-Stock Products: availableStock <= 10 (or threshold) & > 0
    const lowStockCount = analytics?.lowStockCount !== undefined
      ? analytics.lowStockCount
      : products.filter((p) => p.availableStock <= 10 && p.availableStock > 0 && p.isActive).length;

    return {
      todaySalesPaise,
      newOrdersCount,
      ordersToCompleteCount,
      lowStockCount,
      salesGrowthDisplay: analytics?.salesGrowthDisplay || '0% vs yesterday',
      isGrowthPositive: !analytics?.salesGrowthDisplay?.startsWith('-'),
    };
  }, [analytics, orders, products]);

  // Delivery settings from store profile or defaults
  const delivery = store?.deliverySettings || {
    standardPrepMinutes: 30,
    currentPrepMinutes: 30,
    estimatedTravelMinutes: 15,
    totalDeliveryMinutes: 45,
    orderAcceptanceMode: 'OPEN' as const,
    workloadPreset: 'NORMAL' as const,
  };

  const currentTotalDeliveryMinutes =
    delivery.totalDeliveryMinutes ||
    (delivery.currentPrepMinutes || 30) + (delivery.estimatedTravelMinutes || 15);

  // ── Recent Orders Rows ─────────────────────────────────────────────────────
  const recentOrdersList = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.slice(0, 5).map((o) => {
      const customerName =
        (o.shippingAddressSnapshot as any)?.name ||
        o.deliveryNote?.replace(/^Merchant direct order:? */, '') ||
        'Store Customer';

      const initials = customerName
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'SC';

      const itemCount = o.items?.reduce((s, it) => s + it.quantity, 0) || o.items?.length || 1;
      const amountPaise = o.pricingSnapshot?.totalPaise || 0;

      let statusLabel = 'New';
      let statusStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

      if (o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT' || o.status === 'PAID') {
        statusLabel = 'New';
        statusStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      } else if (o.status === 'ACCEPTED') {
        statusLabel = 'Accepted';
        statusStyle = 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300';
      } else if (o.status === 'PREPARING' || o.status === 'PACKING') {
        statusLabel = 'Preparing';
        statusStyle = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      } else if (o.status === 'PACKED' || o.status === 'READY_FOR_HANDOVER') {
        statusLabel = 'Packed';
        statusStyle = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      } else if (o.status === 'OUT_FOR_DELIVERY' || o.status === 'DISPATCHED') {
        statusLabel = 'Handover';
        statusStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      } else if (o.status === 'DELIVERED') {
        statusLabel = 'Delivered';
        statusStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      } else if (o.status === 'CANCELLED' || o.status === 'REJECTED') {
        statusLabel = 'Cancelled';
        statusStyle = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      }

      return {
        id: o._id,
        orderIdDisplay: o.orderNumber ? `#${o.orderNumber}` : `#${o._id.slice(-6).toUpperCase()}`,
        initials,
        customerName,
        itemsCount: `${itemCount} items`,
        amountDisplay: `₹${(amountPaise / 100).toFixed(2)}`,
        status: statusLabel,
        statusStyle,
      };
    });
  }, [orders]);

  // ── Dynamic Sales Chart Generation ─────────────────────────────────────────
  const activeChartData = useMemo(() => {
    if (chartPeriod === '30d' && analytics?.chart30d && analytics.chart30d.length > 0) {
      return analytics.chart30d;
    }
    if (analytics?.chart7d && analytics.chart7d.length > 0) {
      return analytics.chart7d;
    }
    // Fallback if analytics not yet loaded
    const days: { date: string; label: string; salesPaise: number; orderCount: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        salesPaise: 0,
        orderCount: 0,
      });
    }
    return days;
  }, [chartPeriod, analytics]);

  // SVG Chart Dimensions & Dynamic Scaling
  const chartPoints = useMemo(() => {
    const dataLen = activeChartData.length;
    if (dataLen === 0) return [];

    const maxSales = Math.max(...activeChartData.map((d) => d.salesPaise), 50000); // minimum scale: ₹500
    const width = 500;
    const height = 110;
    const paddingX = 20;
    const paddingY = 15;

    return activeChartData.map((item, idx) => {
      const x = paddingX + (idx / Math.max(dataLen - 1, 1)) * width;
      const normalizedRatio = item.salesPaise / maxSales;
      const y = height + paddingY - normalizedRatio * (height - 10);
      return {
        x: Math.round(x),
        y: Math.round(y),
        val: `₹${(item.salesPaise / 100).toFixed(0)}`,
        label: item.label,
        orders: item.orderCount,
      };
    });
  }, [activeChartData]);

  // Build SVG path strings
  const { pathD, fillD } = useMemo(() => {
    if (chartPoints.length === 0) return { pathD: '', fillD: '' };

    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];

    let path = `M ${first.x} ${first.y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const pt = chartPoints[i];
      const prev = chartPoints[i - 1];
      const cx = (prev.x + pt.x) / 2;
      path += ` Q ${prev.x} ${prev.y}, ${cx} ${(prev.y + pt.y) / 2} T ${pt.x} ${pt.y}`;
    }

    const fill = `${path} L ${last.x} 130 L ${first.x} 130 Z`;
    return { pathD: path, fillD: fill };
  }, [chartPoints]);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* ── Top Greeting Row (Dynamic Clock & Personalized Name) ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            {clock.greeting}, {firstName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here&apos;s your live shop overview and real-time operations for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs text-slate-700 dark:text-slate-200 font-mono">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{clock.formattedDate}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{clock.formattedTime}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards (Authoritative Database Derivations) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Today&apos;s Sales
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              ₹{(metrics.todaySalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <div
              className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${
                metrics.isGrowthPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              {metrics.isGrowthPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{metrics.salesGrowthDisplay}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: New Orders */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
        >
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              New Orders
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {metrics.newOrdersCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Awaiting merchant acceptance
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Orders to Complete */}
        <div
          onClick={() => onNavigate('orders')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
        >
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Orders to Complete
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {metrics.ordersToCompleteCount}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              In progress in shop
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Low-Stock Products */}
        <div
          onClick={() => onNavigate('products')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
        >
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Low-Stock Products
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {metrics.lowStockCount}
            </div>
            <div className="mt-1 text-[11px] text-rose-500 dark:text-rose-400 font-medium">
              Threshold alert (≤ 10 units)
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Middle Section: Needs Your Attention & Delivery/Availability ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Left: Needs Your Attention */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Needs Your Attention
            </h3>
          </div>

          <div className="space-y-3">
            {/* Attention Item 1: New Orders */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {metrics.newOrdersCount > 0
                      ? `${metrics.newOrdersCount} new orders awaiting acceptance`
                      : 'All new orders accepted'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {metrics.newOrdersCount > 0
                      ? 'Accept promptly to meet delivery promises'
                      : 'Zero pending unaccepted orders'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>View Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Attention Item 2: Low Stock */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {metrics.lowStockCount > 0
                      ? `${metrics.lowStockCount} products running low in stock`
                      : 'Stock levels healthy across catalog'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {metrics.lowStockCount > 0 ? 'Refill inventory to avoid stockouts' : 'All products have adequate stock'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Update Stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Attention Item 3: Delivery Preset */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Delivery promise active: {currentTotalDeliveryMinutes} minutes
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Synchronized with customer checkout delivery calculations
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('delivery')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Change Time</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card Right: Delivery & Availability Controls */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Delivery & Availability
              </h3>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                delivery.orderAcceptanceMode === 'OPEN'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                  : delivery.orderAcceptanceMode === 'PAUSED'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  delivery.orderAcceptanceMode === 'OPEN'
                    ? 'bg-emerald-500 animate-pulse'
                    : delivery.orderAcceptanceMode === 'PAUSED'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              {delivery.orderAcceptanceMode === 'OPEN'
                ? 'Live'
                : delivery.orderAcceptanceMode === 'PAUSED'
                ? 'Paused'
                : 'Closed'}
            </span>
          </div>

          {/* Time & Mode Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            {/* Delivery Time Overview */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 shrink-0 shadow-2xs">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Current Delivery Time</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block leading-tight">
                  {currentTotalDeliveryMinutes} min
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (Prep: {delivery.currentPrepMinutes || 30} min + Transit: ~{delivery.estimatedTravelMinutes || 15} min)
                </span>
              </div>
            </div>

            {/* Order Acceptance Dropdown */}
            <div className="flex flex-col justify-center sm:items-end">
              <span className="text-[11px] text-slate-400 mb-1">Order Acceptance</span>
              <select
                value={delivery.orderAcceptanceMode || 'OPEN'}
                onChange={(e) => onToggleAcceptance(e.target.value as any)}
                className="w-full sm:w-36 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="OPEN">🟢 Open</option>
                <option value="PAUSED">🟠 Paused</option>
                <option value="CLOSED">🔴 Closed</option>
              </select>
            </div>
          </div>

          {/* 4 Workload Presets in a row */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Workload Presets (1-tap ETA adjustment)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Preset 1: Not Busy (15m prep -> 30m total) */}
              <button
                onClick={() => onUpdateDeliveryPreset('NOT_BUSY', 15)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  delivery.workloadPreset === 'NOT_BUSY'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                <Coffee className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold leading-tight block">Not Busy</span>
                <span className="text-[10px] opacity-80 font-mono block">15 min prep</span>
              </button>

              {/* Preset 2: Normal (30m prep -> 45m total) */}
              <button
                onClick={() => onUpdateDeliveryPreset('NORMAL', 30)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  delivery.workloadPreset === 'NORMAL'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                <Check className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold leading-tight block">Normal</span>
                <span className="text-[10px] opacity-80 font-mono block">30 min prep</span>
              </button>

              {/* Preset 3: Busy (45m prep -> 60m total) */}
              <button
                onClick={() => onUpdateDeliveryPreset('BUSY', 45)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  delivery.workloadPreset === 'BUSY'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                <Hourglass className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold leading-tight block">Busy</span>
                <span className="text-[10px] opacity-80 font-mono block">45 min prep</span>
              </button>

              {/* Preset 4: Very Busy (60m prep -> 75m total) */}
              <button
                onClick={() => onUpdateDeliveryPreset('VERY_BUSY', 60)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  delivery.workloadPreset === 'VERY_BUSY'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span className="text-xs font-bold leading-tight block">Very Busy</span>
                <span className="text-[10px] opacity-80 font-mono block">60 min prep</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <button
            onClick={() => onNavigate('delivery')}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Manage Delivery Settings</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Bottom Section: Recent Orders & Authoritative Sales Chart ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Left: Recent Orders Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Recent Orders
                </h3>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              {recentOrdersList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    No orders placed yet
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live orders from customer checkouts will appear here immediately
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2.5 pr-2">Order ID</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Items</th>
                      <th className="py-2.5 px-2">Amount</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 pl-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {recentOrdersList.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => onSelectOrder(ord.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 pr-2 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.orderIdDisplay}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {ord.initials}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                              {ord.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400">
                          {ord.itemsCount}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.amountDisplay}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ord.statusStyle}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Card Right: Live Sales Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Today&apos;s Sales</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    ₹{(metrics.todaySalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      metrics.isGrowthPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {metrics.salesGrowthDisplay}
                  </span>
                </div>
              </div>

              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as '7d' | '30d')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Area Chart SVG (Dynamic Real Coordinates) */}
            <div className="mt-6 h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 540 150">
                <defs>
                  <linearGradient id="homeSalesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="20" y1="20" x2="520" y2="20" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="20" y1="60" x2="520" y2="60" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="20" y1="100" x2="520" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                <line x1="20" y1="130" x2="520" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />

                {/* Gradient Fill under path */}
                {fillD && (
                  <path d={fillD} fill="url(#homeSalesGradient)" />
                )}

                {/* Smooth trend curve */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Interactive Points */}
                {chartPoints.map((pt, i) => (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-white dark:fill-slate-900 stroke-emerald-600 stroke-[3] group-hover/dot:r-6 transition-all"
                    />
                    {/* Tooltip on point hover */}
                    <title>{`${pt.label}: ${pt.val} (${pt.orders} orders)`}</title>
                  </g>
                ))}
              </svg>
            </div>

            {/* X-axis labels (Directly from Database Date Keys) */}
            <div className="flex justify-between pl-4 pr-4 mt-2 text-[10px] font-mono text-slate-400">
              {activeChartData.map((d) => (
                <span key={d.date} className="truncate max-w-[45px]">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
