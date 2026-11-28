import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';
import { ModalPortal } from '../../components/common/ModalPortal';
import { useScrollLock } from '../../hooks/useScrollLock';
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
import { MerchantFulfilmentView } from '../../components/merchant/MerchantFulfilmentView';
import { MerchantOrderDetailDrawer } from '../../components/merchant/MerchantOrderDetailDrawer';
import { MerchantProductsView } from '../../components/merchant/MerchantProductsView';
import { MerchantProductFormModal } from '../../components/merchant/MerchantProductFormModal';
import { MerchantCreateOrderModal } from '../../components/merchant/MerchantCreateOrderModal';
import { IntegrationsModal } from '../../components/IntegrationsModal';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const MerchantWorkspace: React.FC = () => {
  const { token, user, logout, authFetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainScrollRef = useRef<HTMLElement>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cartpilot_theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Default = Light per user specifications
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // State
  const [activeTab, setActiveTab] = useState<MerchantTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync route from URL
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/orders') || path.includes('/fulfilment')) {
      setActiveTab('orders');
    } else if (
      path.includes('/products') ||
      path.includes('/inventory') ||
      path.includes('/categories')
    ) {
      setActiveTab('products');
    } else if (path.includes('/delivery') || path.includes('/delivery-settings')) {
      setActiveTab('delivery');
    } else if (
      path.includes('/shop') ||
      path.includes('/store-profile') ||
      path.includes('/staff') ||
      path.includes('/customers') ||
      path.includes('/finance') ||
      path.includes('/analytics') ||
      path.includes('/marketing') ||
      path.includes('/notifications') ||
      path.includes('/security') ||
      path.includes('/support')
    ) {
      setActiveTab('shop');
    } else {
      setActiveTab('home');
    }
  }, [location.pathname]);

  const handleSelectTab = useCallback(
    (tab: MerchantTab) => {
      setActiveTab(tab);
      let targetSubpath = '';
      if (tab === 'home' || tab === 'overview') targetSubpath = '';
      else if (tab === 'orders' || tab === 'fulfilment') targetSubpath = '/orders';
      else if (tab === 'products' || tab === 'inventory' || tab === 'categories') targetSubpath = '/products';
      else if (tab === 'delivery' || tab === 'delivery-settings') targetSubpath = '/delivery';
      else targetSubpath = '/shop';

      const fullPath = `/merchant${targetSubpath}`;
      if (location.pathname !== fullPath) {
        navigate(fullPath);
      }
    },
    [location.pathname, navigate]
  );

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
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
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
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cartpilot_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  // ── Smart In-App Back Navigation & History Trap (Merchant) ─────────────────
  // Prevents browser back button from leaking into Google OAuth or Login.
  const merchantBackStateRef = useRef({
    hasOpenModal: false,
    closeAllModals: () => {},
    activeTab: 'home',
    goToHome: () => {},
  });

  merchantBackStateRef.current = {
    hasOpenModal: Boolean(
      isCommandPaletteOpen ||
      isNotificationsOpen ||
      isAddProductOpen ||
      isCreateOrderOpen ||
      productToEdit ||
      isIntegrationsOpen ||
      isMobileSidebarOpen
    ),
    closeAllModals: () => {
      setIsCommandPaletteOpen(false);
      setIsNotificationsOpen(false);
      setIsAddProductOpen(false);
      setIsCreateOrderOpen(false);
      setProductToEdit(null);
      setIsIntegrationsOpen(false);
      setIsMobileSidebarOpen(false);
    },
    activeTab,
    goToHome: () => {
      setActiveTab('home');
      navigate('/merchant');
    },
  };

  useEffect(() => {
    window.history.replaceState({ cartpilotMerchant: true }, '', window.location.pathname);
    window.history.pushState({ cartpilotMerchant: true, guard: true }, '', window.location.pathname);

    const handlePopState = () => {
      // 1. Immediately re-arm guard on current path
      window.history.pushState({ cartpilotMerchant: true, guard: true }, '', window.location.pathname);

      const navState = merchantBackStateRef.current;

      // 2. Close open merchant modals
      if (navState.hasOpenModal) {
        navState.closeAllModals();
        return;
      }

      // 3. Return to 'home' if on another tab
      if (navState.activeTab !== 'home' && navState.activeTab !== 'overview') {
        navState.goToHome();
        return;
      }

      // 4. Anchor on merchant home
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

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
  const fetchMerchantData = useCallback(async (silent = false) => {
    if (!token || (user && user.role !== 'MERCHANT' && user.role !== 'ADMIN')) return;
    if (!silent) setIsLoading(true);

    try {
      // 1. Fetch store profile
      const storeRes = await authFetch(`${API_BASE}/merchants/my-store`);

      if (storeRes.status === 401 || storeRes.status === 403) {
        return;
      }

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setStore(storeData.data);
      }

      // 2. Fetch catalog products
      const catRes = await authFetch(`${API_BASE}/catalog`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setProducts(catData.data || []);
      }

      // 3. Fetch real orders
      const orderRes = await authFetch(`${API_BASE}/orders`);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.data || []);
      }

      // 4. Fetch staff list
      const staffRes = await authFetch(`${API_BASE}/merchants/staff`);
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
      const analyticsRes = await authFetch(`${API_BASE}/merchants/my-store/analytics`);
      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setStoreAnalytics(aData.data);
      }
    } catch {
      if (!silent) {
        showBanner('error', 'Failed to synchronize merchant portal data');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [token, user, authFetch]);

  useEffect(() => {
    fetchMerchantData();
  }, [fetchMerchantData]);

  // Proactive live synchronization polling (every 10s)
  useEffect(() => {
    if (!token || (user && user.role !== 'MERCHANT' && user.role !== 'ADMIN')) return;
    const pollInterval = setInterval(() => {
      fetchMerchantData(true);
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [token, user, fetchMerchantData]);

  // Handle Explicit Order Acceptance
  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;
    setIsAdvancingOrder(true);
    try {
      const res = await authFetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
        showBanner('success', `Order #${updated.orderNumber || orderId} accepted for fulfillment`);
        fetchMerchantData(true);
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
      const res = await authFetch(`${API_BASE}/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Merchant declined order' }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
        showBanner('success', `Order #${updated.orderNumber || orderId} rejected and stock released`);
        fetchMerchantData(true);
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
      const res = await authFetch(`${API_BASE}/orders/${orderId}/advance-status`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
        showBanner('success', `Order #${updatedOrder.orderNumber || orderId} advanced to ${updatedOrder.status}`);
        fetchMerchantData(true);
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

      const res = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showBanner('success', `Product "${data.data.name}" ${isEdit ? 'updated' : 'added'} successfully`);
        setIsAddProductOpen(false);
        setProductToEdit(null);
        fetchMerchantData(true);
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
      const res = await authFetch(`${API_BASE}/merchants/my-store/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await authFetch(`${API_BASE}/merchants/my-store/products/${productId}`, {
        method: 'DELETE',
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
      const res = await authFetch(`${API_BASE}/merchants/my-store`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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
      const res = await authFetch(`${API_BASE}/merchants/staff/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, permissions, role }),
      });

      const data = await res.json();
      if (res.ok) {
        showBanner('success', `Invitation generated for ${email}`);
        fetchMerchantData(true);
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
      const res = await authFetch(`${API_BASE}/merchants/staff/${staffUserId}`, {
        method: 'DELETE',
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
      const res = await authFetch(`${API_BASE}/merchants/my-store`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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

  // Background page scroll lock when any dialog or drawer is active
  const isAnyModalOpen =
    isCreateOrderOpen ||
    isAddProductOpen ||
    Boolean(selectedOrderId) ||
    isCommandPaletteOpen ||
    isNotificationsOpen ||
    isIntegrationsOpen ||
    isMobileSidebarOpen;

  useScrollLock(isAnyModalOpen);

  return (
    <div
      className="merchant-app-shell font-sans text-slate-800 dark:text-slate-100 transition-colors duration-150"
      style={{ '--sidebar-col-width': isSidebarCollapsed ? '72px' : '250px' } as React.CSSProperties}
    >
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
          <button onClick={() => setBanner(null)} className="ml-2 hover:opacity-80 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar Cell */}
      <div className="hidden md:block merchant-sidebar-cell">
        <MerchantSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          store={store}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer (Rendered via Portal with backdrop & scroll-lock) */}
      {isMobileSidebarOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 h-full bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
              <MerchantSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  handleSelectTab(tab);
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
        </ModalPortal>
      )}

      {/* Fixed Top Global Header Cell */}
      <div className="merchant-header-cell">
        <MerchantHeader
          store={store}
          user={user}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotificationsCount={pendingOrdersCount + lowStockCount}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onNavigate={handleSelectTab}
          onLogout={logout}
          onToggleStoreOnline={handleToggleStoreOnline}
          isUpdatingOnline={isSavingProfile}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
        />
      </div>

      {/* Main Independently-Scrollable Content Cell */}
      <main
        id="merchant-main-scroll"
        ref={mainScrollRef}
        className="merchant-main-cell p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
      >
        <div className="max-w-[1540px] w-full mx-auto">
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
              user={user}
              onNavigate={handleSelectTab}
              onSelectOrder={(id) => setSelectedOrderId(id)}
              onUpdateDeliveryPreset={handleUpdateDeliveryPreset}
              onToggleAcceptance={handleToggleAcceptance}
            />
          )}

          {activeTab === 'orders' && (
            <MerchantOrdersView
              orders={orders}
              onSelectOrder={(id) => setSelectedOrderId(id)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onAdvanceStatus={handleAdvanceStatus}
              onAcceptOrder={handleAcceptOrder}
            />
          )}

          {activeTab === 'fulfilment' && (
            <MerchantFulfilmentView
              orders={orders}
              onSelectOrder={(id: string) => setSelectedOrderId(id)}
              onAdvanceStatus={handleAdvanceStatus}
              isAdvancing={isAdvancingOrder}
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
              orders={orders}
              analytics={storeAnalytics}
              initialSubTab={
                activeTab === 'customers'
                  ? 'customers'
                  : activeTab === 'finance'
                  ? 'earnings'
                  : activeTab === 'staff'
                  ? 'staff'
                  : activeTab === 'security'
                  ? 'security'
                  : activeTab === 'support'
                  ? 'support'
                  : 'business'
              }
              onSaveProfile={handleSaveStoreProfile}
              isSavingProfile={isSavingProfile}
              onInviteStaff={handleInviteStaff}
              onRevokeStaff={handleRevokeStaff}
              isInvitingStaff={isInvitingStaff}
            />
          )}
        </div>
      </main>

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
        onNavigate={handleSelectTab}
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


      {/* Direct Storefront / Phone Intake Manual Order Creation Modal */}
      <MerchantCreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        token={token}
        onOrderCreated={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          showBanner('success', `Order #${newOrder.orderNumber} placed & confirmed in live database!`);
          setSelectedOrderId(newOrder._id);
          fetchMerchantData();
        }}
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
