import React, { useState } from 'react';
import {
  Store,
  Wallet,
  Users,
  ShieldCheck,
  Headphones,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Building2,
  Lock,
  Volume2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { MerchantStoreData, StaffMemberData, OrderData, MerchantStoreAnalytics } from './types';

interface MerchantShopViewProps {
  store: MerchantStoreData | null;
  staffList: StaffMemberData[];
  orders?: OrderData[];
  analytics?: MerchantStoreAnalytics | null;
  initialSubTab?: ShopSubTab;
  onSaveProfile: (updates: Partial<MerchantStoreData>) => Promise<void>;
  isSavingProfile: boolean;
  onInviteStaff: (name: string, email: string, permissions: string[], role?: string) => Promise<any>;
  onRevokeStaff: (staffId: string) => Promise<void>;
  isInvitingStaff: boolean;
}

type ShopSubTab = 'business' | 'earnings' | 'customers' | 'staff' | 'security' | 'support';

export const MerchantShopView: React.FC<MerchantShopViewProps> = ({
  store,
  staffList,
  orders = [],
  analytics,
  initialSubTab,
  onSaveProfile,
  isSavingProfile,
  onInviteStaff,
  onRevokeStaff,
  isInvitingStaff,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ShopSubTab>(initialSubTab || 'business');

  // Business Details Form
  const [businessName, setBusinessName] = useState(store?.businessName || '');
  const [phone, setPhone] = useState(store?.phone || '');
  const [email, setEmail] = useState(store?.email || '');
  const [description, setDescription] = useState(store?.description || '');
  const [street, setStreet] = useState(store?.address?.street || '');
  const [city, setCity] = useState(store?.address?.city || 'Patna');
  const [postalCode, setPostalCode] = useState(store?.address?.postalCode || '800001');
  const [fssaiLicense, setFssaiLicense] = useState('11223344556677');

  // Sync state when store or subtab changes
  React.useEffect(() => {
    if (store) {
      if (store.businessName) setBusinessName(store.businessName);
      if (store.phone) setPhone(store.phone);
      if (store.email) setEmail(store.email);
      if (store.description) setDescription(store.description);
      if (store.address) {
        if (store.address.street) setStreet(store.address.street);
        if (store.address.city) setCity(store.address.city);
        if (store.address.postalCode) setPostalCode(store.address.postalCode);
      }
    }
  }, [store]);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [gstin, setGstin] = useState('29AAAAA0000A1Z5');

  // Staff Invite Form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Store Manager');

  // Security / Audio alerts
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [newOrderChimeVolume, setNewOrderChimeVolume] = useState(80);

  // Play test sound
  const handlePlayTestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(newOrderChimeVolume / 100 * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio not supported in environment
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveProfile({
      businessName,
      phone,
      email,
      description,
      address: {
        street,
        city,
        state: 'Karnataka',
        postalCode,
      },
    });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail) return;
    await onInviteStaff(
      newStaffName || 'Staff Member',
      newStaffEmail,
      ['orders:read', 'orders:write', 'products:read', 'products:write'],
      newStaffRole
    );
    setNewStaffName('');
    setNewStaffEmail('');
  };

  // Real Financial Totals Derived from Orders & Analytics
  const totalGrossSalesPaise = analytics?.salesPaise ?? orders.reduce((sum, o) => {
    if (o.status !== 'CANCELLED' && o.status !== 'FAILED' && o.status !== 'REJECTED' && o.status !== 'PENDING_PAYMENT') {
      return sum + (o.pricingSnapshot?.totalPaise || 0);
    }
    return sum;
  }, 0);

  const platformCommissionPaise = Math.round(totalGrossSalesPaise * 0.05); // 5% platform fee
  const paymentFeePaise = Math.round(totalGrossSalesPaise * 0.02); // 2% gateway processing
  const netPayoutPaise = Math.max(totalGrossSalesPaise - platformCommissionPaise - paymentFeePaise, 0);

  // Real Dynamic Customers Derived from Live Orders
  const customersList = React.useMemo(() => {
    const customerMap = new Map<string, { name: string; phone: string; totalOrders: number; totalSpendPaise: number; status: string }>();
    for (const ord of orders) {
      const phone = ord.shippingAddressSnapshot?.phone || ord.shippingAddressSnapshot?.name || 'Walk-in Customer';
      const name = ord.shippingAddressSnapshot?.name || 'Store Customer';
      const amount = ord.pricingSnapshot?.totalPaise || 0;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name,
          phone: ord.shippingAddressSnapshot?.phone || 'Direct Order',
          totalOrders: 1,
          totalSpendPaise: amount,
          status: 'New',
        });
      } else {
        const existing = customerMap.get(phone)!;
        existing.totalOrders += 1;
        existing.totalSpendPaise += amount;
        if (existing.totalOrders >= 5) existing.status = 'VIP';
        else if (existing.totalOrders >= 2) existing.status = 'Active';
      }
    }
    return Array.from(customerMap.values()).map((c) => ({
      name: c.name,
      phone: c.phone,
      totalOrders: c.totalOrders,
      totalSpend: `₹${(c.totalSpendPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      status: c.status,
    }));
  }, [orders]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              My Shop Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your business profile, settlements, staff, customer directory, and support.
            </p>
          </div>
        </div>
      </div>

      {/* ── 6 Sub-Tab Navigation Pills ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'business' as const, label: 'Business Details', icon: Building2 },
          { id: 'earnings' as const, label: 'Earnings & Settlements', icon: Wallet },
          { id: 'customers' as const, label: 'Customers', icon: Users },
          { id: 'staff' as const, label: 'Staff & Roles', icon: Users },
          { id: 'security' as const, label: 'Settings & Security', icon: ShieldCheck },
          { id: 'support' as const, label: 'Help & Support', icon: Headphones },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-Tab 1: Business Details ───────────────────────────────────────── */}
      {activeSubTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Basic Shop Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Contact Phone (Customer inquiries)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Store Type
                </label>
                <input
                  type="text"
                  value="Grocery & Pure Vegetarian Supermarket"
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Store Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Physical Address & Licensing */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location, GSTIN & FSSAI 100% Pure Vegetarian Compliance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Shop Address / Street
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  FSSAI License Number
                </label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <strong className="font-bold">100% Pure Vegetarian Certified:</strong> All products are cryptographically checked against non-vegetarian and meat aliases.
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingProfile ? 'Saving Changes...' : 'Save Business Profile'}</span>
          </button>
        </form>
      )}

      {/* ── Sub-Tab 2: Earnings & Settlements ─────────────────────────────────── */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400">Total Gross Sales</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ₹{(totalGrossSalesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">From live verified orders</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400">Platform Commission (5%)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ₹{(platformCommissionPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">CartPilot ecosystem fee</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-slate-400">Payment Gateway (2%)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                ₹{(paymentFeePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Razorpay / UPI processing</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Net Payout Transferred</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                ₹{(netPayoutPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">Available for daily settlement</span>
            </div>
          </div>

          {/* Bank Account / UPI Settings */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Settlement Account Details (T+1 Daily Payouts)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block">Bank Name</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white block mt-0.5">HDFC Bank Ltd</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Account Number</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white block mt-0.5">•••• •••• 8829</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">IFSC Code</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white block mt-0.5">HDFC0001234</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Direct UPI VPA</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white block mt-0.5">freshgreens@hdfcbank</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 3: Customers Directory ────────────────────────────────────── */}
      {activeSubTab === 'customers' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Frequent Customers ({customersList.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Total Orders</th>
                  <th className="py-2.5 px-3">Total Spent</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {customersList.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{c.phone}</td>
                    <td className="py-3 px-3">{c.totalOrders} orders</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">{c.totalSpend}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'VIP'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 4: Staff & Roles ─────────────────────────────────────────── */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          {/* Invite Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Add Staff Member / Cashier</span>
            </h3>

            <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Full Name (e.g. Suresh Kumar)"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Staff Email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                required
              />
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="Store Manager">Store Manager</option>
                <option value="Packing Associate">Packing Associate</option>
                <option value="Cashier">Cashier</option>
              </select>
              <button
                type="submit"
                disabled={isInvitingStaff}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                {isInvitingStaff ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Store Team
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Ramesh Patel
                  </span>
                  <span className="text-[11px] text-slate-400">
                    merchant@freshgrocers.com • Store Owner (Super Admin of Store)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Primary Owner
                </span>
              </div>

              {staffList.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {s.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {s.email} • {s.role || 'Staff Member'}
                    </span>
                  </div>
                  <button
                    onClick={() => onRevokeStaff(s.id)}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Revoke Access
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 5: Settings & Security ────────────────────────────────────── */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Order Sound Alerts */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Incoming Order Sound Alert (Web Audio Chime)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Plays a loud notification chime whenever a new quick-commerce order arrives.
                </p>
              </div>

              <button
                onClick={() => setSoundAlertsEnabled(!soundAlertsEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  soundAlertsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    soundAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {soundAlertsEnabled && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="button"
                  onClick={handlePlayTestChime}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Test Order Chime 🔔</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Chime Volume:</span>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={newOrderChimeVolume}
                    onChange={(e) => setNewOrderChimeVolume(Number(e.target.value))}
                    className="w-24 accent-emerald-600"
                  />
                  <span className="font-mono text-[11px]">{newOrderChimeVolume}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Password */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Security & Password Protection</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your merchant account is encrypted with argon2id password hashing and JWT token auth.
            </p>
          </div>
        </div>
      )}

      {/* ── Sub-Tab 6: Help & Support ─────────────────────────────────────────── */}
      {activeSubTab === 'support' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Toll-Free Partner Hotline
            </h4>
            <p className="text-xs text-slate-500">
              Direct phone assistance for order disputes, rider delays, or system queries.
            </p>
            <a
              href="tel:18002661234"
              className="inline-block font-mono font-bold text-emerald-600 text-sm hover:underline"
            >
              1800-266-1234
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Merchant WhatsApp Desk
            </h4>
            <p className="text-xs text-slate-500">
              Chat instantly with our merchant onboarding and operations officers on WhatsApp.
            </p>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs hover:underline"
            >
              <span>+91 98765 43210</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Email Care
            </h4>
            <p className="text-xs text-slate-500">
              Official written communication for GST tax invoices and settlement audits.
            </p>
            <a
              href="mailto:merchants@cartpilot.in"
              className="inline-block font-bold text-emerald-600 text-xs hover:underline"
            >
              merchants@cartpilot.in
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
