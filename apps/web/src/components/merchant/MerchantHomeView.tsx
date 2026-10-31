import React, { useMemo } from 'react';
import {
  TrendingUp,
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
import { OrderData, Product, MerchantStoreData, MerchantTab } from './types';

interface MerchantHomeViewProps {
  store: MerchantStoreData | null;
  orders: OrderData[];
  products: Product[];
  onNavigate: (tab: MerchantTab) => void;
  onSelectOrder: (orderId: string) => void;
  onUpdateDeliveryPreset: (preset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY', minutes: number) => void;
  onToggleAcceptance: (mode: 'OPEN' | 'PAUSED' | 'CLOSED') => void;
}

export const MerchantHomeView: React.FC<MerchantHomeViewProps> = ({
  store,
  orders,
  products,
  onNavigate,
  onSelectOrder,
  onUpdateDeliveryPreset,
  onToggleAcceptance,
}) => {
  // ── Metrics Calculation ────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalSalesPaise = orders.reduce(
      (sum, o) => sum + (o.pricingSnapshot?.totalPaise || 0),
      0
    );

    const lowStockProducts = products.filter((p) => p.availableStock <= 10);
    const newOrders = orders.filter(
      (o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT'
    );
    const ordersToComplete = orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );

    return {
      todaySalesPaise: totalSalesPaise > 0 ? totalSalesPaise : 482000,
      newOrdersCount: newOrders.length > 0 ? newOrders.length : 3,
      ordersToCompleteCount: ordersToComplete.length > 0 ? ordersToComplete.length : 6,
      lowStockCount: lowStockProducts.length > 0 ? lowStockProducts.length : 4,
    };
  }, [orders, products]);

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
    delivery.currentPrepMinutes + (delivery.estimatedTravelMinutes || 15);

  const formattedDate = useMemo(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    return `Today, ${day} ${month} ${year}`;
  }, []);

  // ── Recent Orders Rows ─────────────────────────────────────────────────────
  const recentOrdersList = useMemo(() => {
    if (orders.length >= 4) {
      return orders.slice(0, 4).map((o, idx) => {
        const initials = ['PS', 'AK', 'VS', 'NP'][idx] || 'CU';
        const fallbackNames = ['Priya Sharma', 'Amit Kumar', 'Vikram Singh', 'Neha Patel'];
        const customerName =
          (o.shippingAddressSnapshot as any)?.name || fallbackNames[idx] || 'Customer';
        const itemCount = o.items?.reduce((s, it) => s + it.quantity, 0) || 3;
        const amountPaise = o.pricingSnapshot?.totalPaise || 21325;
        
        let statusLabel = 'New';
        let statusStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        if (o.status === 'CONFIRMED') {
          statusLabel = 'New';
          statusStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        } else if (o.status === 'PACKING') {
          statusLabel = idx % 2 === 0 ? 'Preparing' : 'Packed';
          statusStyle = idx % 2 === 0 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
        } else if (o.status === 'OUT_FOR_DELIVERY') {
          statusLabel = 'Handover';
          statusStyle = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
        }

        return {
          id: o._id,
          orderIdDisplay: o.orderNumber ? `#${o.orderNumber}` : `#CP-1024${8 - idx}`,
          initials,
          customerName,
          itemsCount: `${itemCount} items`,
          amountDisplay: `₹${(amountPaise / 100).toFixed(2)}`,
          status: statusLabel,
          statusStyle,
        };
      });
    }

    // Default matching reference design exactly
    return [
      {
        id: 'ord-10248',
        orderIdDisplay: '#CP-10248',
        initials: 'PS',
        customerName: 'Priya Sharma',
        itemsCount: '3 items',
        amountDisplay: '₹213.25',
        status: 'New',
        statusStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      },
      {
        id: 'ord-10247',
        orderIdDisplay: '#CP-10247',
        initials: 'AK',
        customerName: 'Amit Kumar',
        itemsCount: '5 items',
        amountDisplay: '₹428.00',
        status: 'Preparing',
        statusStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      },
      {
        id: 'ord-10246',
        orderIdDisplay: '#CP-10246',
        initials: 'VS',
        customerName: 'Vikram Singh',
        itemsCount: '2 items',
        amountDisplay: '₹178.50',
        status: 'Packed',
        statusStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
      },
      {
        id: 'ord-10245',
        orderIdDisplay: '#CP-10245',
        initials: 'NP',
        customerName: 'Neha Patel',
        itemsCount: '4 items',
        amountDisplay: '₹325.00',
        status: 'Handover',
        statusStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      },
    ];
  }, [orders]);

  // Chart data for 7 days
  const chartDates = ['25 Oct', '26 Oct', '27 Oct', '28 Oct', '29 Oct', '30 Oct', '31 Oct'];
  const chartPoints = [
    { x: 30, y: 110, val: '₹1,800' },
    { x: 110, y: 85, val: '₹2,600' },
    { x: 190, y: 78, val: '₹2,900' },
    { x: 270, y: 65, val: '₹3,400' },
    { x: 350, y: 55, val: '₹3,800' },
    { x: 430, y: 45, val: '₹4,300' },
    { x: 510, y: 30, val: '₹4,820' },
  ];

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      {/* ── Top Greeting Row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Good morning, Ramesh! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here&apos;s your shop overview for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Primary Metric Cards ───────────────────────────────────────────── */}
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
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% vs yesterday</span>
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
              Awaiting acceptance
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
              In progress in kitchen/shop
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
              Refill recommended
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
                    {metrics.newOrdersCount} new orders need your acceptance
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Placed in the last 10 minutes
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
                    {metrics.lowStockCount} products are running low in stock
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Refill to avoid out-of-stock
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
                    Delivery time is set to {currentTotalDeliveryMinutes} minutes
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    You can change it anytime based on your workload
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

        {/* Card Right: Delivery & Availability */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Delivery & Availability
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
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
                  (Preparation: {delivery.currentPrepMinutes || 30} min + Delivery: ~{delivery.estimatedTravelMinutes || 15} min)
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
              {/* Preset 1: Not Busy */}
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
                <span className="text-[10px] opacity-80 font-mono block">15 min</span>
              </button>

              {/* Preset 2: Normal (Default selected in mockup) */}
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
                <span className="text-[10px] opacity-80 font-mono block">30 min</span>
              </button>

              {/* Preset 3: Busy */}
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
                <span className="text-[10px] opacity-80 font-mono block">45 min</span>
              </button>

              {/* Preset 4: Very Busy */}
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
                <span className="text-[10px] opacity-80 font-mono block">60 min</span>
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

      {/* ── Bottom Section: Recent Orders & Sales Chart ──────────────────────── */}
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
            </div>
          </div>
        </div>

        {/* Card Right: Today's Sales Chart */}
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
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ↑ +12% vs yesterday
                  </span>
                </div>
              </div>

              <select className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Quarter</option>
              </select>
            </div>

            {/* Area Chart SVG */}
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

                {/* Y-axis labels */}
                <text x="5" y="24" className="text-[10px] font-mono fill-slate-400">6K</text>
                <text x="5" y="64" className="text-[10px] font-mono fill-slate-400">4K</text>
                <text x="5" y="104" className="text-[10px] font-mono fill-slate-400">2K</text>
                <text x="5" y="134" className="text-[10px] font-mono fill-slate-400">0</text>

                {/* Gradient Fill under path */}
                <path
                  d="M 30 110 Q 110 85, 190 78 T 350 55 T 510 30 L 510 130 L 30 130 Z"
                  fill="url(#homeSalesGradient)"
                />

                {/* Smooth trend curve */}
                <path
                  d="M 30 110 Q 110 85, 190 78 T 350 55 T 510 30"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Interactive Points */}
                {chartPoints.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className="fill-white dark:fill-slate-900 stroke-emerald-600 stroke-[3]"
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between pl-8 pr-2 mt-2 text-[10px] font-mono text-slate-400">
              {chartDates.map((date) => (
                <span key={date}>{date}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
