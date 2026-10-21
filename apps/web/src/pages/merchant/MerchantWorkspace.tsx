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
  Users,
  UserPlus,
  Trash2,
  ShieldAlert,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

interface MerchantStoreData {
  _id: string;
  businessName: string;
  slug: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  serviceAreaPincodes?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  suspensionReason?: string;
  isVegetarianCertified?: boolean;
}

interface StaffMemberData {
  id: string;
  userId: string;
  name: string;
  email: string;
  permissions: string[];
  createdAt: string;
}

export const MerchantWorkspace: React.FC = () => {
  const { token, user, logout } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  const [store, setStore] = useState<MerchantStoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [staffList, setStaffList] = useState<StaffMemberData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'staff'>('inventory');
  const [advancingOrderId, setAdvancingOrderId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Staff Invitation Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<string[]>([
    'orders.update',
    'products.edit',
  ]);
  const [isInvitingStaff, setIsInvitingStaff] = useState(false);
  const [lastInviteResult, setLastInviteResult] = useState<{
    token: string;
    link: string;
    email: string;
  } | null>(null);
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false);

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
      // 1. Fetch store profile
      const storeRes = await fetch(`${API_BASE}/merchants/my-store`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData.data);
      }

      // 2. Fetch catalog
      const catRes = await fetch(`${API_BASE}/catalog`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setProducts(catData.data || []);
      }

      // 3. Fetch orders
      const orderRes = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.data || []);
      }

      // 4. Fetch staff list
      const staffRes = await fetch(`${API_BASE}/merchants/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (staffRes.ok) {
        const sData = await staffRes.json();
        setStaffList(sData.data || []);
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
    if (!token || store?.status === 'SUSPENDED') return;
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

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsInvitingStaff(true);

    try {
      const res = await fetch(`${API_BASE}/merchants/staff/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          permissions: invitePermissions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('success', `Invitation generated for ${inviteEmail}`);
        setLastInviteResult({
          token: data.data.inviteToken,
          link: data.data.inviteLink,
          email: inviteEmail,
        });
        setInviteName('');
        setInviteEmail('');
        fetchMerchantData();
      } else {
        showBanner('error', data.error?.message || 'Failed to dispatch staff invitation');
      }
    } catch {
      showBanner('error', 'Network error during staff invitation');
    } finally {
      setIsInvitingStaff(false);
    }
  };

  const handleRevokeStaff = async (staffUserId: string, staffName: string) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to revoke store access for ${staffName}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/merchants/staff/${staffUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showBanner('success', `Staff access revoked for ${staffName}`);
        fetchMerchantData();
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Failed to revoke staff access');
      }
    } catch {
      showBanner('error', 'Network error revoking staff access');
    }
  };

  const togglePermission = (perm: string) => {
    setInvitePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // State 1: PENDING APPLICATION SCREEN
  if (store && store.status === 'PENDING') {
    return (
      <div className="relative min-h-screen flex flex-col font-sans bg-paper text-ink">
        <LivingBackground />
        <Header isDark={isDark} onToggleTheme={toggleTheme} />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 relative z-10 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20 mb-2">
            Status: Awaiting Verification
          </span>

          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight mb-2">
            Application Under Review
          </h1>

          <p className="text-xs text-mut max-w-md mx-auto mb-6">
            Your merchant registration for <strong className="text-ink">{store.businessName}</strong> has
            been received and is being verified by the CartPilot compliance committee for 100% vegetarian adherence.
          </p>

          <div className="w-full bg-card border border-brd rounded-xl p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between border-b border-brd/50 pb-2">
              <span className="text-mut">Registered Business:</span>
              <span className="font-semibold text-ink">{store.businessName}</span>
            </div>
            <div className="flex justify-between border-b border-brd/50 pb-2">
              <span className="text-mut">Location:</span>
              <span className="font-semibold text-ink">{store.address.city}, {store.address.state} ({store.address.postalCode})</span>
            </div>
            <div className="flex justify-between border-b border-brd/50 pb-2">
              <span className="text-mut">Vegetarian Pledge:</span>
              <span className="text-emerald-500 font-bold">100% Certified Compliant</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mut">Applicant Email:</span>
              <span className="font-mono text-ink">{store.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMerchantData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl border border-brd bg-paper hover:bg-card text-xs font-semibold text-mut hover:text-ink transition-colors"
            >
              Sign Out
            </button>
          </div>
        </main>
      </div>
    );
  }

  // State 2: REJECTED APPLICATION SCREEN
  if (store && store.status === 'REJECTED') {
    return (
      <div className="relative min-h-screen flex flex-col font-sans bg-paper text-ink">
        <LivingBackground />
        <Header isDark={isDark} onToggleTheme={toggleTheme} />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 relative z-10 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/20 mb-2">
            Application Rejected
          </span>

          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight mb-2">
            Merchant Application Not Approved
          </h1>

          <p className="text-xs text-mut max-w-md mx-auto mb-4">
            The compliance review for <strong className="text-ink">{store.businessName}</strong> could not be approved at this time.
          </p>

          {store.rejectionReason && (
            <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left text-xs mb-6 text-rose-700 dark:text-rose-300">
              <span className="font-semibold block mb-1">Reason for Rejection:</span>
              <p>{store.rejectionReason}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 transition-colors"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </main>
      </div>
    );
  }

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

      {/* Suspended Alert Banner */}
      {store && store.status === 'SUSPENDED' && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs font-semibold flex items-center justify-between shadow-md relative z-20">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <div>
              <span>Store Account Suspended: Fulfillment and catalog modifications are locked. </span>
              {store.suspensionReason && (
                <span className="opacity-90">Reason: {store.suspensionReason}</span>
              )}
            </div>
          </div>
        </div>
      )}

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
                  {store?.businessName || 'Fresh Greens Organics'}
                </h1>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {store?.status === 'APPROVED' ? 'Verified Merchant' : store?.status || 'Active'}
                </span>
                {user?.isStaff && (
                  <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                    Staff Member
                  </span>
                )}
              </div>
              <p className="text-xs text-mut mt-0.5">
                {store?.address.street || 'Koramangala 4th Block'}, {store?.address.city || 'Bengaluru'} • 100% Pure Vegetarian Certified
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
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-acc text-white shadow-sm'
                : 'text-mut hover:text-ink hover:bg-paper'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Permissions ({staffList.length})</span>
          </button>
        </div>

        {/* Tab 1: Store Inventory Grid */}
        {activeTab === 'inventory' && (
          <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-ink">Organic Certified Catalog</h3>
                <p className="text-xs text-mut">
                  Zero meat, fish, poultry, or egg products allowed by deterministic gateway
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-paper border border-brd text-ink">
                {products.length} SKUs Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brd bg-paper/50 text-mut uppercase font-mono text-[10px]">
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">Available Stock</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd">
                  {products.map((p) => {
                    const priceFormatted = `₹${(p.pricePaise / 100).toFixed(2)}`;
                    return (
                      <tr key={p._id} className="hover:bg-paper/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-ink block">{p.name}</span>
                          <span className="text-[10px] text-mut">{p.packageUnit}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-paper border border-brd text-mut">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-ink">{priceFormatted}</td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={
                              p.availableStock < 10
                                ? 'text-amber-500 font-bold'
                                : 'text-emerald-500 font-medium'
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
                            disabled={isAdvancing || store?.status === 'SUSPENDED'}
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

        {/* Tab 3: Staff & Permissions */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Invite Form */}
            <div className="bg-card border border-brd rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-acc" />
                <h3 className="font-bold text-sm text-ink">Invite Store Staff Member</h3>
              </div>

              <form onSubmit={handleInviteStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Staff Member Name</label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Anand Verma"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="anand@freshgreens.in"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">
                    Fulfillment Permissions Granted:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'orders.update', label: 'Order Fulfillment (simulate-step)' },
                      { key: 'products.edit', label: 'Edit Products & Catalog' },
                      { key: 'stock.adjust', label: 'Adjust Available Stock' },
                      { key: 'pricing.edit', label: 'Update Pricing' },
                      { key: 'settings.edit', label: 'Store Settings' },
                    ].map((p) => {
                      const isChecked = invitePermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-acc/10 border-acc/40 text-acc font-semibold'
                              : 'bg-paper/40 border-brd text-mut hover:bg-paper'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.key)}
                            className="rounded text-acc focus:ring-acc border-brd"
                          />
                          <span>{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isInvitingStaff || store?.status === 'SUSPENDED'}
                  className="px-4 py-2.5 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isInvitingStaff ? 'Generating Invitation...' : 'Send Staff Invitation'}</span>
                </button>
              </form>

              {/* Dev Copy Box if invitation generated */}
              {lastInviteResult && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Invitation Dispatched for {lastInviteResult.email}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          window.location.origin + '/accept-invite?token=' + lastInviteResult.token
                        );
                        setHasCopiedInvite(true);
                        setTimeout(() => setHasCopiedInvite(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      {hasCopiedInvite ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{hasCopiedInvite ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-ink break-all bg-card/60 p-2 rounded border border-emerald-500/20">
                    {window.location.origin + '/accept-invite?token=' + lastInviteResult.token}
                  </div>
                </div>
              )}
            </div>

            {/* Existing Staff Members List */}
            <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-brd">
                <h3 className="font-bold text-sm text-ink">Active Store Staff ({staffList.length})</h3>
                <p className="text-xs text-mut">Authorized operators with role-gated store capabilities</p>
              </div>

              {staffList.length === 0 ? (
                <div className="p-8 text-center text-mut text-xs">
                  No staff members invited yet. Use the form above to add operators to your store.
                </div>
              ) : (
                <div className="divide-y divide-brd">
                  {staffList.map((staff) => (
                    <div
                      key={staff.id}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-paper/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-ink">{staff.name}</span>
                          <span className="font-mono text-[10px] text-mut">({staff.email})</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {staff.permissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-paper border border-brd text-mut"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeStaff(staff.userId, staff.name)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Immediately revoke store credentials"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
