import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Truck,
  Package,
  CheckCircle2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Store,
  ShoppingBag,
  MapPin,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

interface AdminFulfilmentViewsProps {
  token: string | null;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  showBanner: (type: 'success' | 'error', message: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TODAY BOARD VIEW
// ─────────────────────────────────────────────────────────────────────────────
export const AdminTodayBoardView: React.FC<AdminFulfilmentViewsProps & { onNavigateTab: (tab: any) => void }> = ({
  token,
  authFetch,
  showBanner,
  onNavigateTab,
}) => {
  const [board, setBoard] = useState<{
    totalOrders: number;
    confirmed: number;
    packing: number;
    packed: number;
    outForDelivery: number;
    delivered: number;
    revenuePaise: number;
    activeLots: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLots, setIsGeneratingLots] = useState(false);

  const fetchBoard = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/orders/admin/today-board`);
      if (res.ok) {
        const d = await res.json();
        setBoard(d.data);
      }
    } catch {
      showBanner('error', 'Failed to load today board metrics');
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, showBanner]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleGenerateLots = async () => {
    setIsGeneratingLots(true);
    try {
      const res = await authFetch(`${API_BASE}/orders/admin/generate-lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: 'MORNING' }),
      });
      if (res.ok) {
        const d = await res.json();
        showBanner('success', d.message || 'Merchant pickup lots generated successfully');
        fetchBoard();
      } else {
        showBanner('error', 'Failed to generate merchant lots');
      }
    } catch {
      showBanner('error', 'Network error generating merchant lots');
    } finally {
      setIsGeneratingLots(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Cutoff Logic */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-brd shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-heading font-black text-ink tracking-tight">
              CartPilot Central Dark Store Hub
            </h2>
            <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 px-2.5 py-0.5 rounded-full uppercase">
              Patna Primary Facility #01
            </span>
          </div>
          <p className="text-xs text-mut">
            Cutoff Engine: Orders before 2:00 PM routed to Same-Day Evening (5-9 PM) • Orders after 2:00 PM routed to Next-Day Morning (6-10 AM).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateLots}
            disabled={isGeneratingLots}
            className="px-4 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-heading font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Layers className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{isGeneratingLots ? 'Aggregating Lots...' : 'Generate Merchant Lots'}</span>
          </button>
          <button
            onClick={fetchBoard}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-brd bg-paper hover:bg-card text-ink transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Grid: Curved Corner Box Radii */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-mut mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Today Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">{board?.totalOrders ?? 0}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% Pure-Veg</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-mut mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">
            ₹{((board?.revenuePaise ?? 0) / 100).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-mut font-medium">Integer paise settled</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-mut mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">In Packing Bins</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">{board?.packing ?? 0}</div>
          <span className="text-[11px] text-mut font-medium">Cross-dock sorting</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-brd shadow-xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-mut mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider">Out for Delivery</span>
            <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-ink my-1">{board?.outForDelivery ?? 0}</div>
          <span className="text-[11px] text-mut font-medium">En route to customers</span>
        </div>
      </div>

      {/* Fulfillment Pipeline Progression Cards */}
      <div className="p-6 rounded-3xl bg-card border border-brd shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-ink flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Dark Store Fulfilment Pipeline Status</span>
          </h3>
          <span className="text-xs text-mut font-medium">Live sync with Master Ledger</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => onNavigateTab('fulfilment')}
            className="p-5 rounded-2xl bg-surface-2/60 border border-brd hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>1. Procurement</span>
                <Store className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-heading font-black text-ink mt-2 mb-1">{board?.activeLots ?? 0} Lots</div>
              <p className="text-[11px] text-mut">Wholesale merchant pickup crates</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-2">
              Open Crates <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('fulfilment')}
            className="p-5 rounded-2xl bg-surface-2/60 border border-brd hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>2. Hub Packing</span>
                <Package className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-heading font-black text-ink mt-2 mb-1">{board?.packing ?? 0} Bins</div>
              <p className="text-[11px] text-mut">Consolidating multi-merchant items</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 pt-2">
              Open Checklist <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('fulfilment')}
            className="p-5 rounded-2xl bg-surface-2/60 border border-brd hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>3. Dispatch</span>
                <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="text-2xl font-heading font-black text-ink mt-2 mb-1">{board?.outForDelivery ?? 0} Orders</div>
              <p className="text-[11px] text-mut">Morning/Evening route runs</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-900 dark:text-zinc-100 pt-2">
              Open Manifest <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('orders')}
            className="p-5 rounded-2xl bg-surface-2/60 border border-brd hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer space-y-2 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>4. Delivered</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-heading font-black text-ink mt-2 mb-1">{board?.delivered ?? 0} Complete</div>
              <p className="text-[11px] text-mut">Fulfilled orders with cashback credited</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-2">
              View All <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CONSOLIDATED ORDERS VIEW (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminOrdersView: React.FC<AdminFulfilmentViewsProps> = ({
  token,
  authFetch,
  showBanner,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/orders`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d.data || []);
      }
    } catch {
      showBanner('error', 'Failed to fetch consolidated orders');
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, showBanner]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAdvanceStage = async (orderId: string, stage: string) => {
    setIsAdvancing(true);
    try {
      const res = await authFetch(`${API_BASE}/orders/${orderId}/fulfilment-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        showBanner('success', `Order advanced to ${stage}`);
        fetchOrders();
        setSelectedOrder(null);
      } else {
        showBanner('error', 'Failed to advance order stage');
      }
    } catch {
      showBanner('error', 'Network error advancing order');
    } finally {
      setIsAdvancing(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (o.orderNumber || '').toLowerCase();
      const name = (o.shippingAddressSnapshot?.name || '').toLowerCase();
      const city = (o.shippingAddressSnapshot?.city || '').toLowerCase();
      return num.includes(q) || name.includes(q) || city.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-card border border-brd shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, recipient, or city..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-paper border border-brd text-xs text-ink placeholder:text-mut focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CONFIRMED', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-paper border border-brd text-mut hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-brd bg-paper hover:bg-card text-mut hover:text-ink transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-brd bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper border-b border-brd text-mut uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Shopper / Recipient</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4">Line Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Slot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brd text-ink">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mut">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-paper/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {o.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <div>{o.shippingAddressSnapshot?.name || 'Shopper'}</div>
                      <div className="text-[11px] text-mut">{o.shippingAddressSnapshot?.phone || '+91 ••••••••••'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-mut">
                      {o.shippingAddressSnapshot?.street}, {o.shippingAddressSnapshot?.city}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold">{o.items?.length || 0} items</span>
                      <div className="text-[10px] text-mut truncate max-w-[150px]">
                        {o.items?.map((i: any) => i.name).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      ₹{((o.pricingSnapshot?.totalPaise || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-paper border border-brd font-bold">
                        {o.deliverySlot || 'MORNING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : o.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700'
                            : o.status === 'PACKED' || o.status === 'PACKING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1 rounded-xl bg-paper hover:bg-card border border-brd font-bold text-xs text-ink transition-colors cursor-pointer shadow-2xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-card border border-brd shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-brd pb-3">
              <div>
                <span className="text-[10px] font-mono text-mut uppercase">Consolidated Dark-Store Order</span>
                <h3 className="font-heading font-black text-lg text-ink">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-mut hover:text-ink text-sm font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Recipient & Address */}
            <div className="p-3.5 rounded-xl bg-paper border border-brd space-y-1">
              <div className="text-xs font-bold text-ink">Delivery Destination:</div>
              <div className="text-xs text-mut">
                {selectedOrder.shippingAddressSnapshot?.name} • {selectedOrder.shippingAddressSnapshot?.phone}
              </div>
              <div className="text-xs text-mut">
                {selectedOrder.shippingAddressSnapshot?.street}, {selectedOrder.shippingAddressSnapshot?.city},{' '}
                {selectedOrder.shippingAddressSnapshot?.state} - {selectedOrder.shippingAddressSnapshot?.postalCode}
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-ink">Packed Items:</div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-paper border border-brd flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-ink">{item.name}</span>
                      <span className="text-mut text-[11px] ml-2">
                        ({item.packageSize} {item.packageUnit}) x {item.quantity}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-ink">
                      ₹{((item.subtotalPaise || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-brd flex items-center justify-between gap-3">
              <span className="font-heading font-bold text-sm text-ink">
                Total: ₹{((selectedOrder.pricingSnapshot?.totalPaise || 0) / 100).toFixed(2)}
              </span>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleAdvanceStage(selectedOrder._id, 'PACKED')}
                    disabled={isAdvancing}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Pack in Bin
                  </button>
                )}
                {(selectedOrder.status === 'PACKED' || selectedOrder.status === 'PACKING') && (
                  <button
                    onClick={() => handleAdvanceStage(selectedOrder._id, 'OUT_FOR_DELIVERY')}
                    disabled={isAdvancing}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Dispatch Driver
                  </button>
                )}
                {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => handleAdvanceStage(selectedOrder._id, 'DELIVERED')}
                    disabled={isAdvancing}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FULFILMENT HUB VIEW (PROCUREMENT / PACKING / DELIVERY)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminFulfilmentHubView: React.FC<AdminFulfilmentViewsProps> = ({
  token,
  authFetch,
  showBanner,
}) => {
  const [subTab, setSubTab] = useState<'procurement' | 'packing' | 'delivery'>('procurement');
  const [procurementList, setProcurementList] = useState<any[]>([]);
  const [packingList, setPackingList] = useState<any[]>([]);
  const [deliveryList, setDeliveryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchFulfilmentData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (subTab === 'procurement') {
        const res = await authFetch(`${API_BASE}/orders/admin/procurement`);
        if (res.ok) {
          const d = await res.json();
          setProcurementList(d.data || []);
        }
      } else if (subTab === 'packing') {
        const res = await authFetch(`${API_BASE}/orders/admin/packing`);
        if (res.ok) {
          const d = await res.json();
          setPackingList(d.data || []);
        }
      } else if (subTab === 'delivery') {
        const res = await authFetch(`${API_BASE}/orders/admin/delivery`);
        if (res.ok) {
          const d = await res.json();
          setDeliveryList(d.data || []);
        }
      }
    } catch {
      showBanner('error', `Failed to load ${subTab} records`);
    } finally {
      setIsLoading(false);
    }
  }, [token, subTab, authFetch, showBanner]);

  useEffect(() => {
    fetchFulfilmentData();
  }, [fetchFulfilmentData]);

  const copyFieldLink = (lotToken: string) => {
    const url = `${window.location.origin}/field/run/${lotToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(lotToken);
    showBanner('success', 'Field runner link copied to clipboard');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleMarkCollected = async (lotToken: string) => {
    try {
      const res = await authFetch(`${API_BASE}/orders/public/field-run/${lotToken}/collect`, {
        method: 'POST',
      });
      if (res.ok) {
        showBanner('success', 'Merchant lot marked collected by runner');
        fetchFulfilmentData();
      } else {
        showBanner('error', 'Failed to mark lot collected');
      }
    } catch {
      showBanner('error', 'Network error marking lot collected');
    }
  };

  const handleAdvancePacking = async (orderId: string) => {
    try {
      const res = await authFetch(`${API_BASE}/orders/${orderId}/fulfilment-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'PACKED' }),
      });
      if (res.ok) {
        showBanner('success', 'Order bin packed successfully');
        fetchFulfilmentData();
      }
    } catch {
      showBanner('error', 'Failed to advance packing status');
    }
  };

  const handleAdvanceDelivery = async (orderId: string, stage: string) => {
    try {
      const res = await authFetch(`${API_BASE}/orders/${orderId}/fulfilment-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) {
        showBanner('success', `Order moved to ${stage}`);
        fetchFulfilmentData();
      }
    } catch {
      showBanner('error', `Failed to update delivery to ${stage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation: Segmented Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="p-1.5 rounded-2xl bg-surface-2 border border-brd flex items-center gap-1.5 overflow-x-auto shadow-2xs">
          <button
            onClick={() => setSubTab('procurement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'procurement'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-mut hover:text-ink hover:bg-card/60'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Procurement (Merchant Crates)</span>
          </button>

          <button
            onClick={() => setSubTab('packing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'packing'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-mut hover:text-ink hover:bg-card/60'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" />
            <span>Hub Packing Bins ({packingList.length})</span>
          </button>

          <button
            onClick={() => setSubTab('delivery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'delivery'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-mut hover:text-ink hover:bg-card/60'
            }`}
          >
            <Truck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <span>Delivery Manifest ({deliveryList.length})</span>
          </button>
        </div>

        <button
          onClick={fetchFulfilmentData}
          className="p-2.5 rounded-2xl border border-brd bg-card hover:bg-paper text-ink transition-colors cursor-pointer self-end sm:self-auto shadow-2xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── SubTab 1: Procurement ── */}
      {subTab === 'procurement' && (
        <div className="space-y-4">
          <div className="text-xs text-mut flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Items aggregated by merchant store for morning harvest runner pickup. Customer PII is completely shielded.
            </span>
          </div>

          {procurementList.length === 0 ? (
            <div className="p-8 rounded-xl border border-brd bg-card text-center text-mut text-xs">
              No active procurement lots pending collection. Generate lots from the Today Board.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {procurementList.map((group) => (
                <div
                  key={group.merchantId}
                  className="p-5 rounded-2xl bg-card border border-brd shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-brd pb-3">
                    <div>
                      <h4 className="font-heading font-black text-sm text-ink">{group.merchantName}</h4>
                      <span className="text-[11px] text-mut">
                        {group.totalUnits} units across {group.distinctProducts} items
                      </span>
                    </div>

                    {group.lot ? (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          group.lot.status === 'COLLECTED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {group.lot.status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-mut">Lot Pending Generation</span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {group.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-paper border border-brd flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-ink">{item.name}</span>
                          <span className="text-mut text-[11px] ml-1.5">
                            ({item.packageSize} {item.packageUnit})
                          </span>
                        </div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Qty: {item.totalQuantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lot Actions */}
                  {group.lot && (
                    <div className="pt-2 border-t border-brd flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyFieldLink(group.lot.token)}
                        className="px-2.5 py-1.5 rounded-lg bg-paper hover:bg-card border border-brd text-xs font-bold text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedToken === group.lot.token ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Runner Link</span>
                      </button>

                      {group.lot.status !== 'COLLECTED' && (
                        <button
                          onClick={() => handleMarkCollected(group.lot.token)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SubTab 2: Packing Bins Checklist ── */}
      {subTab === 'packing' && (
        <div className="space-y-4">
          <div className="text-xs text-mut">
            Hub packing bins: Cross-dock workers check off items from multiple merchants into a single customer delivery bin.
          </div>

          {packingList.length === 0 ? (
            <div className="p-8 rounded-xl border border-brd bg-card text-center text-mut text-xs">
              All orders are packed and ready for delivery dispatch.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packingList.map((o) => (
                <div key={o._id} className="p-4 rounded-xl bg-card border border-brd shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-brd pb-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {o.orderNumber}
                      </span>
                      <span className="text-[11px] text-mut ml-2">({o.totalItems} items)</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'PACKED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {o.items?.map((i: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-paper">
                        <span className="text-ink">
                          {i.name} ({i.packageSize} {i.packageUnit})
                        </span>
                        <span className="font-bold text-ink">x{i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {o.status !== 'PACKED' && (
                    <button
                      onClick={() => handleAdvancePacking(o._id)}
                      className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Complete Bin Packing → PACKED
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SubTab 3: Delivery Manifest ── */}
      {subTab === 'delivery' && (
        <div className="space-y-4">
          <div className="text-xs text-mut">
            Driver Run Sheet: Packed customer orders dispatched for the morning 6-10 AM or evening 5-9 PM slot.
          </div>

          {deliveryList.length === 0 ? (
            <div className="p-8 rounded-xl border border-brd bg-card text-center text-mut text-xs">
              No orders queued for driver dispatch.
            </div>
          ) : (
            <div className="space-y-2.5">
              {deliveryList.map((d) => (
                <div
                  key={d._id}
                  className="p-4 rounded-xl bg-card border border-brd shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {d.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-ink">• {d.recipientName}</span>
                      <span className="text-xs text-mut">({d.phone})</span>
                    </div>
                    <div className="text-xs text-mut flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-mut" />
                      <span>{d.address}</span>
                    </div>
                    {d.deliveryNote && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400">
                        Note: {d.deliveryNote}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-xs text-ink">₹{((d.totalPaise || 0) / 100).toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">{d.paymentStatus}</span>
                    </div>

                    {d.status === 'PACKED' && (
                      <button
                        onClick={() => handleAdvanceDelivery(d._id, 'OUT_FOR_DELIVERY')}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Dispatch Driver
                      </button>
                    )}
                    {d.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleAdvanceDelivery(d._id, 'DELIVERED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
