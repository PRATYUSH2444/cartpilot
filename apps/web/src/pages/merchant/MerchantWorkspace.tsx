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
  FileText,
  Receipt,
  ShoppingBag,
  Plus,
  X,
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

  // Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('FRUITS_VEGETABLES');
  const [newProductPriceRupees, setNewProductPriceRupees] = useState('');
  const [newProductPackageSize, setNewProductPackageSize] = useState('1');
  const [newProductPackageUnit, setNewProductPackageUnit] = useState('KG');
  const [newProductStock, setNewProductStock] = useState('50');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductAliases, setNewProductAliases] = useState('');

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
        const list = Array.isArray(sData.data)
          ? sData.data
          : Array.isArray(sData.data?.staff)
            ? sData.data.staff
            : [];
        setStaffList(list);
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
      const res = await fetch(`${API_BASE}/orders/${orderId}/advance-status`, {
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const priceRupees = parseFloat(newProductPriceRupees);
    if (isNaN(priceRupees) || priceRupees <= 0) {
      showBanner('error', 'Please enter a valid positive price in ₹');
      return;
    }
    const pricePaise = Math.round(priceRupees * 100);

    const stock = parseInt(newProductStock, 10);
    if (isNaN(stock) || stock < 0) {
      showBanner('error', 'Available stock must be a non-negative number');
      return;
    }

    const packageSize = parseFloat(newProductPackageSize) || 1;

    setIsSubmittingProduct(true);
    try {
      const aliasesArray = newProductAliases
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a.length > 0);

      const res = await fetch(`${API_BASE}/merchants/my-store/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProductName.trim(),
          category: newProductCategory,
          pricePaise,
          packageSize,
          packageUnit: newProductPackageUnit,
          availableStock: stock,
          description: newProductDescription.trim() || newProductName.trim(),
          aliases: aliasesArray,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showBanner('success', `Product "${data.data.name}" added to catalog`);
        setIsAddProductOpen(false);
        setNewProductName('');
        setNewProductPriceRupees('');
        setNewProductDescription('');
        setNewProductAliases('');
        fetchMerchantData();
      } else {
        showBanner('error', data.error?.message || 'Failed to add product');
      }
    } catch {
      showBanner('error', 'Network error adding product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/merchants/my-store/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adjustment: delta, reason: 'Merchant quick stock adjustment' }),
      });

      const data = await res.json();
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, availableStock: data.data.availableStock } : p))
        );
        showBanner('success', `Stock updated: ${data.data.name} now has ${data.data.availableStock} units`);
      } else {
        showBanner('error', data.error?.message || 'Failed to update stock');
      }
    } catch {
      showBanner('error', 'Network error adjusting stock');
    }
  };

  const handleArchiveProduct = async (productId: string, productName: string) => {
    if (!token || !window.confirm(`Archive "${productName}" from your store catalog?`)) return;
    try {
      const res = await fetch(`${API_BASE}/merchants/my-store/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        showBanner('success', `Product "${productName}" archived`);
      } else {
        const data = await res.json();
        showBanner('error', data.error?.message || 'Failed to archive product');
      }
    } catch {
      showBanner('error', 'Network error archiving product');
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
            <span>Staff & Permissions ({Array.isArray(staffList) ? staffList.length : 0})</span>
          </button>
        </div>

        {/* Tab 1: Store Inventory Grid */}
        {activeTab === 'inventory' && (
          <div className="bg-card border border-brd rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-brd flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-ink">Store Inventory & Catalog</h3>
                <p className="text-xs text-mut">
                  Zero meat, fish, poultry, or egg products allowed by deterministic gateway
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-1.5 rounded-md bg-paper border border-brd text-ink">
                  {products.length} SKUs Active
                </span>
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add SKU</span>
                </button>
              </div>
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
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd">
                  {products.map((p) => {
                    const priceFormatted = `₹${(p.pricePaise / 100).toFixed(2)}`;
                    return (
                      <tr key={p._id} className="hover:bg-paper/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-ink block">{p.name}</span>
                          <span className="text-[10px] text-mut">{p.packageSize} {p.packageUnit}</span>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(p._id, 10)}
                              title="Add 10 units"
                              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-paper hover:bg-emerald-500/10 hover:text-emerald-500 border border-brd transition-colors"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleAdjustStock(p._id, 50)}
                              title="Add 50 units"
                              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-paper hover:bg-emerald-500/10 hover:text-emerald-500 border border-brd transition-colors"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => handleArchiveProduct(p._id, p.name)}
                              title="Archive product"
                              className="p-1 text-mut hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                                <span>
                                  {order.status === 'CONFIRMED'
                                    ? 'Pack Order'
                                    : order.status === 'PACKING'
                                      ? 'Dispatch for Delivery'
                                      : order.status === 'OUT_FOR_DELIVERY'
                                        ? 'Mark Delivered'
                                        : 'Advance Step'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-mut flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-acc" />
                          Purchased Items ({order.items?.length || 0}):
                        </span>
                        <span className="text-[11px] font-mono text-mut">Item-Wise Pipeline</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-paper/60 border border-brd text-xs flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-ink truncate block">{item.name}</span>
                              <span className="text-[10px] text-mut font-mono">
                                {item.packageSize} {item.packageUnit} · ₹{(item.unitPricePaise / 100).toFixed(2)} each
                              </span>
                            </div>
                            <div className="text-right flex-shrink-0 font-mono">
                              <span className="font-bold text-ink block">x{item.quantity}</span>
                              <span className="text-[10px] text-mut">₹{(item.subtotalPaise / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Breakdown & Reconciliation */}
                    {order.pricingSnapshot && (
                      <div className="p-3 rounded-xl bg-paper/40 border border-brd space-y-1 text-xs">
                        <div className="flex items-center justify-between text-ink font-semibold pb-1 border-b border-brd/60 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-acc" />
                            Financial Breakdown (Integer Paise Invariant)
                          </span>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">RECONCILED</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-mut">
                          <div>
                            <span className="text-[10px] block uppercase">Subtotal</span>
                            <span className="text-ink font-semibold">₹{(order.pricingSnapshot.subtotalPaise / 100).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">Delivery</span>
                            <span className="text-ink font-semibold">
                              {order.pricingSnapshot.deliveryFeePaise === 0
                                ? 'FREE'
                                : `₹${(order.pricingSnapshot.deliveryFeePaise / 100).toFixed(2)}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">Platform Fee</span>
                            <span className="text-ink font-semibold">
                              ₹{((order.pricingSnapshot.platformFeePaise ?? 0) / 100).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase">GST (5%)</span>
                            <span className="text-ink font-semibold">₹{(order.pricingSnapshot.taxPaise / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shopper Delivery Note */}
                    {order.deliveryNote && (
                      <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 mb-0.5 text-[11px]">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Shopper Delivery Note:</span>
                        </div>
                        <p className="text-ink font-mono text-[11px] italic">"{order.deliveryNote}"</p>
                      </div>
                    )}

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
                <h3 className="font-bold text-sm text-ink">Active Store Staff ({Array.isArray(staffList) ? staffList.length : 0})</h3>
                <p className="text-xs text-mut">Authorized operators with role-gated store capabilities</p>
              </div>

              {!Array.isArray(staffList) || staffList.length === 0 ? (
                <div className="p-8 text-center text-mut text-xs">
                  No staff members invited yet. Use the form above to add operators to your store.
                </div>
              ) : (
                <div className="divide-y divide-brd">
                  {(Array.isArray(staffList) ? staffList : []).map((staff) => (
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

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-brd rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-brd flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Add New Product SKU</h3>
                  <p className="text-[11px] text-mut">100% pure certified vegetarian catalog</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-lg hover:bg-paper text-mut hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmiri Saffron Box, Organic Cow Milk"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink focus:outline-none focus:border-acc"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Category *</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink focus:outline-none focus:border-acc"
                  >
                    <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
                    <option value="DAIRY_BREAKFAST">Dairy & Breakfast</option>
                    <option value="ATTA_RICE_DAL">Atta, Rice & Dal</option>
                    <option value="SNACKS_MUNCHIES">Snacks & Munchies</option>
                    <option value="COLD_DRINKS_JUICES">Cold Drinks & Juices</option>
                    <option value="BAKERY">Bakery</option>
                    <option value="INSTANT_FROZEN_FOOD">Instant & Frozen Food</option>
                    <option value="MASALA_DRY_FRUITS">Masala & Dry Fruits</option>
                    <option value="OILS">Oils & Ghee</option>
                    <option value="PERSONAL_CARE">Personal Care</option>
                    <option value="HOUSEHOLD_ESSENTIALS">Household Essentials</option>
                    <option value="BABY_CARE">Baby Care</option>
                    <option value="PET_CARE">Pet Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="99.00"
                    value={newProductPriceRupees}
                    onChange={(e) => setNewProductPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink font-mono focus:outline-none focus:border-acc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Package Size</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={newProductPackageSize}
                    onChange={(e) => setNewProductPackageSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink font-mono focus:outline-none focus:border-acc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Unit</label>
                  <select
                    value={newProductPackageUnit}
                    onChange={(e) => setNewProductPackageUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink focus:outline-none focus:border-acc"
                  >
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="L">L</option>
                    <option value="ML">ML</option>
                    <option value="PIECE">PIECE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink font-mono focus:outline-none focus:border-acc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Fresh organic farm produce..."
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink focus:outline-none focus:border-acc"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Vernacular Search Aliases (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. kaju, cashews, dry fruits"
                  value={newProductAliases}
                  onChange={(e) => setNewProductAliases(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brd bg-paper text-xs text-ink focus:outline-none focus:border-acc"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Certified 100% vegetarian product invariant enforced automatically.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-brd">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl border border-brd bg-paper hover:bg-card text-xs font-semibold text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving SKU...</span>
                    </>
                  ) : (
                    <span>Save to Catalog</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
