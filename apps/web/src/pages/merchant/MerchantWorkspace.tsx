import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import {
  MerchantTab,
  MerchantStoreData,
  StaffMemberData,
  MerchantStoreAnalytics,
  Product,
  OrderData,
} from '../../components/merchant/types';
import { MerchantSidebar } from '../../components/merchant/MerchantSidebar';
import { MerchantHeader } from '../../components/merchant/MerchantHeader';
import { MerchantCommandPalette } from '../../components/merchant/MerchantCommandPalette';
import { MerchantNotificationsDrawer } from '../../components/merchant/MerchantNotificationsDrawer';
import { MerchantHomeView } from '../../components/merchant/MerchantHomeView';
import { MerchantDeliveryView } from '../../components/merchant/MerchantDeliveryView';
import { MerchantShopView } from '../../components/merchant/MerchantShopView';
import { MerchantOrdersView } from '../../components/merchant/MerchantOrdersView';
import { MerchantOrderDetailDrawer } from '../../components/merchant/MerchantOrderDetailDrawer';
import { MerchantProductsView } from '../../components/merchant/MerchantProductsView';
import { MerchantProductFormModal } from '../../components/merchant/MerchantProductFormModal';
import { IntegrationsModal } from '../../components/IntegrationsModal';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const MerchantWorkspace: React.FC = () => {
  const { token, logout } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  // State
  const [activeTab, setActiveTab] = useState<MerchantTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data
  const [store, setStore] = useState<MerchantStoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [staffList, setStaffList] = useState<StaffMemberData[]>([]);
  const [storeAnalytics, setStoreAnalytics] = useState<MerchantStoreAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isAdvancingOrder, setIsAdvancingOrder] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isInvitingStaff, setIsInvitingStaff] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  // Banner notifications
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real data from central backend
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

      // 2. Fetch catalog products
      const catRes = await fetch(`${API_BASE}/catalog`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setProducts(catData.data || []);
      }

      // 3. Fetch real orders
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

      // 5. Fetch store aggregated analytics
      const analyticsRes = await fetch(`${API_BASE}/merchants/my-store/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setStoreAnalytics(aData.data);
      }
    } catch {
      showBanner('error', 'Failed to synchronize merchant portal data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMerchantData();
  }, [fetchMerchantData]);

  // Handle Explicit Order Acceptance
  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;
    setIsAdvancingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
        showBanner('success', `Order #${updated.orderNumber || orderId} accepted for fulfillment`);
        fetchMerchantData();
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Could not accept order');
      }
    } catch {
      showBanner('error', 'Network error accepting order');
    } finally {
      setIsAdvancingOrder(false);
    }
  };

  // Handle Explicit Order Rejection
  const handleRejectOrder = async (orderId: string, reason?: string) => {
    if (!token) return;
    setIsAdvancingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason || 'Merchant declined order' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
        showBanner('success', `Order #${updated.orderNumber || orderId} rejected and stock released`);
        fetchMerchantData();
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Could not reject order');
      }
    } catch {
      showBanner('error', 'Network error rejecting order');
    } finally {
      setIsAdvancingOrder(false);
    }
  };

  // Handle Advance Fulfillment Status
  const handleAdvanceStatus = async (orderId: string) => {
    if (!token) return;
    setIsAdvancingOrder(true);

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/advance-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
        showBanner('success', `Order #${updatedOrder.orderNumber || orderId} advanced to ${updatedOrder.status}`);
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Could not advance order fulfillment status');
      }
    } catch {
      showBanner('error', 'Network error during fulfillment advancement');
    } finally {
      setIsAdvancingOrder(false);
    }
  };

  // Handle Add / Edit Product Submit
  const handleProductSubmit = async (formData: any) => {
    if (!token) return;
    setIsSubmittingProduct(true);

    try {
      const isEdit = !!productToEdit;
      const url = isEdit
        ? `${API_BASE}/merchants/my-store/products/${productToEdit._id}`
        : `${API_BASE}/merchants/my-store/products`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showBanner('success', `Product "${data.data.name}" ${isEdit ? 'updated' : 'added'} successfully`);
        setIsAddProductOpen(false);
        setProductToEdit(null);
        fetchMerchantData();
      } else {
        showBanner('error', data.error?.message || 'Failed to save product');
      }
    } catch {
      showBanner('error', 'Network error saving product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Handle Quick Stock Adjust
  const handleAdjustStock = async (productId: string, delta: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/merchants/my-store/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adjustment: delta, reason: 'Merchant stock adjustment' }),
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
      showBanner('error', 'Network error updating stock');
    }
  };

  // Handle Archive Product
  const handleArchiveProduct = async (productId: string, productName: string) => {
    if (!token || !window.confirm(`Archive "${productName}" from your active store catalogue?`)) return;
    try {
      const res = await fetch(`${API_BASE}/merchants/my-store/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
        showBanner('success', `Product "${productName}" archived`);
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Failed to archive product');
      }
    } catch {
      showBanner('error', 'Network error archiving product');
    }
  };

  // Handle Save Store Profile
  const handleSaveStoreProfile = async (updates: Partial<MerchantStoreData>) => {
    if (!token) return;
    setIsSavingProfile(true);

    try {
      const res = await fetch(`${API_BASE}/merchants/my-store`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (res.ok) {
        setStore(data.data);
        showBanner('success', 'Store profile settings saved to database');
      } else {
        showBanner('error', data.error?.message || 'Failed to update store profile');
      }
    } catch {
      showBanner('error', 'Network error updating store settings');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Toggle Online/Offline
  const handleToggleStoreOnline = async () => {
    if (!store) return;
    const newStatus = !store.isActive;
    await handleSaveStoreProfile({ isActive: newStatus });
  };

  // Handle Staff Invitation
  const handleInviteStaff = async (name: string, email: string, permissions: string[], role?: string) => {
    if (!token) return null;
    setIsInvitingStaff(true);

    try {
      const res = await fetch(`${API_BASE}/merchants/staff/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, permissions, role }),
      });

      const data = await res.json();
      if (res.ok) {
        showBanner('success', `Invitation generated for ${email}`);
        fetchMerchantData();
        return {
          token: data.data.token,
          link: data.data.inviteLink,
          email,
        };
      } else {
        showBanner('error', data.error?.message || 'Failed to send invite');
        return null;
      }
    } catch {
      showBanner('error', 'Network error sending staff invitation');
      return null;
    } finally {
      setIsInvitingStaff(false);
    }
  };

  // Handle Revoke Staff
  const handleRevokeStaff = async (staffUserId: string) => {
    if (!token || !window.confirm('Revoke store access for this employee?')) return;
    try {
      const res = await fetch(`${API_BASE}/merchants/staff/${staffUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.userId !== staffUserId));
        showBanner('success', 'Staff access revoked');
      } else {
        const err = await res.json();
        showBanner('error', err.error?.message || 'Failed to revoke staff');
      }
    } catch {
      showBanner('error', 'Network error revoking staff access');
    }
  };

  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // Handle Delivery Settings Save
  const handleSaveDeliverySettings = async (deliverySettings: any) => {
    if (!token) return;
    setIsSavingDelivery(true);
    try {
      const res = await fetch(`${API_BASE}/merchants/my-store`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliverySettings }),
      });

      const data = await res.json();
      if (res.ok) {
        setStore(data.data);
        showBanner('success', 'Delivery settings and operating hours saved successfully');
      } else {
        showBanner('error', data.error?.message || 'Failed to update delivery settings');
      }
    } catch {
      showBanner('error', 'Network error updating delivery settings');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  // Handle Quick Workload Preset Change from Home View
  const handleUpdateDeliveryPreset = async (
    preset: 'NOT_BUSY' | 'NORMAL' | 'BUSY' | 'VERY_BUSY',
    prepMinutes: number
  ) => {
    const travel = store?.deliverySettings?.estimatedTravelMinutes || 15;
    const updatedSettings = {
      ...(store?.deliverySettings || {}),
      workloadPreset: preset,
      currentPrepMinutes: prepMinutes,
      totalDeliveryMinutes: prepMinutes + travel,
    };
    await handleSaveDeliverySettings(updatedSettings);
  };

  // Handle Order Acceptance Toggle (OPEN / PAUSED / CLOSED)
  const handleToggleAcceptance = async (mode: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    const updatedSettings = {
      ...(store?.deliverySettings || {}),
      orderAcceptanceMode: mode,
    };
    await handleSaveDeliverySettings(updatedSettings);
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'CONFIRMED' || o.status === 'PENDING_PAYMENT'
  ).length;

  const lowStockCount = products.filter((p) => p.availableStock <= 10).length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Banner Notification */}
      {banner && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold animate-in slide-in-from-top duration-200 ${
            banner.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-rose-600 text-white shadow-rose-500/20'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="ml-2 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Shell Container */}
      <div className="flex-1 flex overflow-hidden h-screen">
        {/* Desktop Collapsible Left Sidebar */}
        <div className="hidden md:flex">
          <MerchantSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            store={store}
            pendingOrdersCount={pendingOrdersCount}
            lowStockCount={lowStockCount}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 h-full bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col">
              <MerchantSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileSidebarOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => {}}
                store={store}
                pendingOrdersCount={pendingOrdersCount}
                lowStockCount={lowStockCount}
              />
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Global Header */}
          <MerchantHeader
            store={store}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadNotificationsCount={3}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onNavigate={(tab) => setActiveTab(tab)}
            onLogout={logout}
            onToggleStoreOnline={handleToggleStoreOnline}
            isUpdatingOnline={isSavingProfile}
            onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          />

          {/* Main Workspace Screen Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1540px] w-full mx-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {isLoading && !store && (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                <span className="animate-spin mr-2">⏳</span> Loading merchant workspace...
              </div>
            )}
            {(activeTab === 'home' || activeTab === 'overview') && (
              <MerchantHomeView
                store={store}
                analytics={storeAnalytics}
                orders={orders}
                products={products}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectOrder={(id) => setSelectedOrderId(id)}
                onUpdateDeliveryPreset={handleUpdateDeliveryPreset}
                onToggleAcceptance={handleToggleAcceptance}
              />
            )}

            {(activeTab === 'orders' || activeTab === 'fulfilment') && (
              <MerchantOrdersView
                orders={orders}
                onSelectOrder={(id) => setSelectedOrderId(id)}
                onOpenCreateOrder={() => {
                  showBanner('success', 'Order draft created. Ready for customer assignment.');
                }}
                onAdvanceStatus={handleAdvanceStatus}
                onAcceptOrder={handleAcceptOrder}
              />
            )}

            {(activeTab === 'products' || activeTab === 'inventory' || activeTab === 'categories') && (
              <MerchantProductsView
                products={products}
                onOpenAddProduct={() => {
                  setProductToEdit(null);
                  setIsAddProductOpen(true);
                }}
                onEditProduct={(p) => {
                  setProductToEdit(p);
                  setIsAddProductOpen(true);
                }}
                onAdjustStock={handleAdjustStock}
                onArchiveProduct={handleArchiveProduct}
                onQuickAddProduct={handleProductSubmit}
              />
            )}

            {(activeTab === 'delivery' || activeTab === 'delivery-settings') && (
              <MerchantDeliveryView
                store={store}
                onSaveDeliverySettings={handleSaveDeliverySettings}
                isSaving={isSavingDelivery}
              />
            )}

            {(activeTab === 'shop' ||
              activeTab === 'store-profile' ||
              activeTab === 'staff' ||
              activeTab === 'customers' ||
              activeTab === 'finance' ||
              activeTab === 'analytics' ||
              activeTab === 'marketing' ||
              activeTab === 'notifications' ||
              activeTab === 'security' ||
              activeTab === 'support') && (
              <MerchantShopView
                store={store}
                staffList={staffList}
                onSaveProfile={handleSaveStoreProfile}
                isSavingProfile={isSavingProfile}
                onInviteStaff={handleInviteStaff}
                onRevokeStaff={handleRevokeStaff}
                isInvitingStaff={isInvitingStaff}
              />
            )}
          </main>
        </div>
      </div>

      {/* Slide-over Order Details Drawer */}
      <MerchantOrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orders={orders}
        onAdvanceStatus={handleAdvanceStatus}
        onAcceptOrder={handleAcceptOrder}
        onRejectOrder={handleRejectOrder}
        isAdvancing={isAdvancingOrder}
      />

      {/* Global Linear-style Command Palette (Ctrl+K) */}
      <MerchantCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        products={products}
        orders={orders}
        onOpenAddProduct={() => {
          setProductToEdit(null);
          setIsAddProductOpen(true);
        }}
        onToggleTheme={toggleTheme}
        onToggleStoreOnline={handleToggleStoreOnline}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
      />

      {/* Slide-over Notification Center */}
      <MerchantNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        orders={orders}
        products={products}
        onSelectOrder={(id) => setSelectedOrderId(id)}
      />

      {/* Structured Add / Edit Product Modal */}
      <MerchantProductFormModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSubmit={handleProductSubmit}
        isSubmitting={isSubmittingProduct}
      />

      {/* External Cloud Integrations & Real AI Engine Modal */}
      <IntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        token={token}
      />
    </div>
  );
};
