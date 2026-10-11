import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../../components/Header';
import { LivingBackground } from '../../components/LivingBackground';
import { useAuth } from '../../context/AuthContext';
import { Product, OrderData } from '../../types';
import {
  Store,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Truck,
  Box,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export const MerchantWorkspace: React.FC = () => {
  const { token } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const fetchMerchantData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);

    try {
      // 1. Fetch catalog
      const catRes = await fetch(`${API_BASE}/catalog`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setProducts(catData.data || []);
      }

      // 2. Fetch orders
      const orderRes = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.data || []);
      }
    } catch {
      showBanner('error', 'Failed to refresh merchant portal data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMerchantData();
  }, [fetchMerchantData]);

  const handleAdvanceStep = async (orderId: string) => {
    if (!token) return;
    setAdvancingOrderId(orderId);

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/simulate-step`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.data;

        setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
        showBanner(
          'success',
          `Order ${updatedOrder.orderNumber} advanced to ${updatedOrder.status}`
        );
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Could not advance fulfillment status');
      }
    } catch {
      showBanner('error', 'Network error simulating fulfillment advancement');
    } finally {
      setAdvancingOrderId(null);
    }
  };

  const totalRevenuePaise = orders
    .filter((o) => o.status !== 'FAILED')
    .reduce((sum, o) => sum + (o.pricingSnapshot?.totalPaise || 0), 0);
  const totalRevenueFormatted = `₹${(totalRevenuePaise / 100).toFixed(2)}`;

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'FAILED'
  ).length;

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-acc selection:text-white bg-paper text-ink">
      <LivingBackground />

      {/* Merchant Header */}
      <Header isDark={isDark} onToggleTheme={toggleTheme} />

      {/* Flash Banner */}
      {banner && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
            banner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Store Hero Card */}
        <div className="p-6 rounded-2xl bg-card border border-brd shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl text-ink">
                  Fresh Greens Organics
                </h1>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs text-mut mt-0.5">
                Koramangala 4th Block, Bengaluru • Organic Vegetarian Groceries & Dairy
              </p>
            </div>
          </div>

          <button
            onClick={fetchMerchantData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-brd bg-paper hover:bg-card text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Portal</span>
          </button>
        </div>

        {/* Analytics Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Active SKUs</span>
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">{products.length}</div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              100% Certified Vegetarian
            </span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Active Orders</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">{activeOrdersCount}</div>
            <span className="text-[10px] text-mut font-medium">Awaiting delivery completion</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Total Orders</span>
              <Box className="w-4 h-4 text-blue-500" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">{orders.length}</div>
            <span className="text-[10px] text-mut font-medium">Recorded in ledger</span>
          </div>

          <div className="p-4 rounded-xl bg-card border border-brd">
            <div className="flex items-center justify-between text-mut text-xs mb-1">
              <span>Gross Volume</span>
              <TrendingUp className="w-4 h-4 text-acc" />
            </div>
            <div className="font-display font-extrabold text-xl text-ink">
              {totalRevenueFormatted}
            </div>
            <span className="text-[10px] text-mut font-medium">Authoritative paise total</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-brd pb-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Store Inventory ({products.length} SKUs)</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Order Fulfillment ({orders.length} Orders)</span>
          </button>
        </div>

        {/* Tab 1: Store Inventory Grid */}
        {activeTab === 'inventory' && (
          <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-ink">Organic Certified Catalog</h3>
                <p className="text-xs text-mut">
                  Live stock reserves updated synchronously across gateway operations
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper/80 border-b border-brd text-mut uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Pack Size</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd/60">
                  {products.map((p) => {
                    const priceFormatted = `₹${(p.pricePaise / 100).toFixed(2)}`;
                    const isLowStock = p.availableStock < 10;
                    const aliasName = p.aliases && p.aliases.length > 0 ? p.aliases[0] : null;

                    return (
                      <tr key={p._id} className="hover:bg-paper/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-ink">{p.name}</div>
                          {aliasName && (
                            <span className="text-[11px] text-mut font-mono">({aliasName})</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-paper border border-brd font-medium text-[11px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-mut">
                          {p.packageSize} {p.packageUnit}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-ink">{priceFormatted}</td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={
                              isLowStock
                                ? 'text-amber-500 font-bold'
                                : 'text-emerald-500 font-semibold'
                            }
                          >
                            {p.availableStock} units
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Vegetarian
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Incoming Orders & Stepper */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-card border border-brd rounded-2xl">
                <Box className="w-10 h-10 text-mut mx-auto mb-2 opacity-50" />
                <h4 className="font-bold text-sm text-ink">No Orders Received Yet</h4>
                <p className="text-xs text-mut max-w-sm mx-auto mt-1">
                  When shoppers place orders through the AI Assistant, they will appear here with
                  real-time stock reservations.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const totalFormatted = `₹${(order.pricingSnapshot?.totalPaise / 100).toFixed(2)}`;
                const isFinal = order.status === 'DELIVERED' || order.status === 'FAILED';
                const isAdvancing = advancingOrderId === order._id;

                return (
                  <div
                    key={order._id}
                    className="p-5 rounded-2xl bg-card border border-brd shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-brd">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-ink">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              order.status === 'DELIVERED'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                                : order.status === 'FAILED'
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                                  : 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-mut font-mono">
                          Placed:{' '}
                          {order.placedAt ? new Date(order.placedAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-ink">
                          {totalFormatted}
                        </span>

                        {!isFinal && (
                          <button
                            onClick={() => handleAdvanceStep(order._id)}
                            disabled={isAdvancing}
                            className="px-3 py-1.5 rounded-lg bg-acc text-white hover:bg-blue-600 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                          >
                            {isAdvancing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <span>Advance Step</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase font-bold text-mut block">
                        Purchased Items:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-paper/60 border border-brd text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-ink truncate mr-2">{item.name}</span>
                            <span className="font-mono font-semibold text-mut flex-shrink-0">
                              x{item.quantity} (₹{(item.unitPricePaise / 100).toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stepper visualization */}
                    <div className="pt-2 border-t border-brd/60">
                      <div className="flex items-center justify-between text-[10px] text-mut font-mono">
                        <span
                          className={
                            order.status !== 'PENDING_PAYMENT'
                              ? 'text-emerald-500 font-bold'
                              : 'text-mut'
                          }
                        >
                          1. Placed
                        </span>
                        <span
                          className={
                            ['CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                              order.status
                            )
                              ? 'text-emerald-500 font-bold'
                              : 'text-mut'
                          }
                        >
                          2. Confirmed
                        </span>
                        <span
                          className={
                            ['PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
                              ? 'text-emerald-500 font-bold'
                              : 'text-mut'
                          }
                        >
                          3. Packing
                        </span>
                        <span
                          className={
                            ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
                              ? 'text-emerald-500 font-bold'
                              : 'text-mut'
                          }
                        >
                          4. Out for Delivery
                        </span>
                        <span
                          className={
                            order.status === 'DELIVERED' ? 'text-emerald-500 font-bold' : 'text-mut'
                          }
                        >
                          5. Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};
