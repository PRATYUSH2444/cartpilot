import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import {
  CartData,
  MandateData,
  PolicyEvaluation,
  OrderData,
  ChatMessage,
  LampStatus,
  ToolCallItem,
  Product,
  UserAddress,
} from '../../types';
import { API_BASE } from '../../config/api';
import { BottomTabBar, TabKey } from '../../components/shopper/BottomTabBar';
import { HomeScreen } from '../../components/shopper/HomeScreen';
import { BrowseScreen } from '../../components/shopper/BrowseScreen';
import { AIShopScreen } from '../../components/shopper/AIShopScreen';
import { CartScreen } from '../../components/shopper/CartScreen';
import { AccountScreen } from '../../components/shopper/AccountScreen';
import { ConversationDrawer } from '../../components/shopper/ConversationDrawer';
import { CheckoutModal } from '../../components/shopper/CheckoutModal';
import { LiveTrackingModal } from '../../components/shopper/LiveTrackingModal';
import { GlobalSearchModal } from '../../components/shopper/GlobalSearchModal';
import { SplashScreen } from '../../components/shopper/SplashScreen';
import { WelcomeSheet } from '../../components/shopper/WelcomeSheet';
import { GuidedTour } from '../../components/shopper/GuidedTour';
import { PhoneLoginModal } from '../../components/shopper/PhoneLoginModal';
import { ProductSheet } from '../../components/shopper/ProductSheet';
import { AddressModal } from '../../components/shopper/AddressModal';
import { UnserviceableModal } from '../../components/shopper/UnserviceableModal';
import { OrdersSheet } from '../../components/shopper/OrdersSheet';
import { RulesSheet } from '../../components/shopper/RulesSheet';
import { ProfileModal } from '../../components/shopper/ProfileModal';
import { ContextPanel } from '../../components/shopper/ContextPanel';
import { IntegrationsModal } from '../../components/IntegrationsModal';
import { DesktopHeader } from '../../components/shopper/DesktopHeader';
import { WishlistModal } from '../../components/shopper/WishlistModal';
import { WalletModal } from '../../components/shopper/WalletModal';
import { CouponsModal } from '../../components/shopper/CouponsModal';
import { validateAndComputeCoupon } from '../../config/couponConfig';
import { NotificationsModal } from '../../components/shopper/NotificationsModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { updateCartOptimistically, calculateOptimisticPricing } from '../../utils/optimisticCart';

interface ServerChatMessage {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
  toolCalls?: ToolCallItem[];
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: unknown;
}

export const ShopperWorkspace: React.FC = () => {
  const { token, user, logout, authFetch, setUserProfile } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cartpilot_theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Default = Light, regardless of system
  });

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cartpilot_theme', next ? 'dark' : 'light');
      } catch {}
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Active navigation tab
  const [activeMobileTab, setActiveMobileTab] = useState<TabKey>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'assistant' || tabParam === 'chat') return 'chat';
      if (tabParam === 'browse') return 'browse';
      if (tabParam === 'cart') return 'cart';
      if (tabParam === 'orders') return 'account';
      if (tabParam === 'account') return 'account';
      if (window.location.pathname.includes('/shopper/assistant')) return 'chat';
    } catch {}
    return 'home';
  });
  const [previousTab, setPreviousTab] = useState<TabKey>('home');
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<string>('ALL');

  // Core state
  const [cart, setCart] = useState<CartData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mandate, setMandate] = useState<MandateData | null>(null);
  const [policyEval, setPolicyEval] = useState<PolicyEvaluation | null>(null);
  const {
    selectedAddress,
    selectAddress,
    isAddressModalOpen,
    openAddressModal,
    closeAddressModal,
  } = useLocation();

  // Cart & Checkout configuration state
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<'morning' | 'evening'>('morning');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerText, setComposerText] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<
    { _id: string; title: string; updatedAt?: string }[]
  >([]);

  // Modals & Overlays state
  const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<OrderData | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  // Premium First-Run Flow State (Splash -> Welcome Sheet -> Guided Tour)
  const [isSplashActive, setIsSplashActive] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('cartpilot_session_splash_seen') !== 'true';
    } catch {
      return false;
    }
  });
  const [isWelcomeSheetOpen, setIsWelcomeSheetOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const checkAndTriggerTour = useCallback(() => {
    try {
      const localTourDone = localStorage.getItem('cartpilot_tour_completed') === 'true';
      const serverTourDone = Boolean(user?.hasSeenTour);
      if (!localTourDone && !serverTourDone) {
        setTimeout(() => {
          setIsTourOpen(true);
        }, 300);
      }
    } catch {
      // Ignore
    }
  }, [user]);

  const handleSplashComplete = useCallback(() => {
    setIsSplashActive(false);
    try {
      const welcomeSeen = localStorage.getItem('cartpilot_welcome_sheet_seen') === 'true';
      if (!welcomeSeen) {
        setIsWelcomeSheetOpen(true);
        return;
      }
    } catch {}

    checkAndTriggerTour();
  }, [checkAndTriggerTour]);

  const handleWelcomeComplete = useCallback(() => {
    setIsWelcomeSheetOpen(false);
    checkAndTriggerTour();
  }, [checkAndTriggerTour]);

  const handleTourComplete = useCallback(async () => {
    setIsTourOpen(false);
    try {
      localStorage.setItem('cartpilot_tour_completed', 'true');
      if (token && user) {
        await authFetch(`${API_BASE}/users/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hasSeenTour: true }),
        });
        setUserProfile({ ...user, hasSeenTour: true });
      }
    } catch (err) {
      console.warn('Could not persist tour completion to server:', err);
    }
  }, [token, user, authFetch, setUserProfile]);

  const handleReplayTour = useCallback(() => {
    setActiveMobileTab('home');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    try {
      localStorage.removeItem('cartpilot_tour_completed');
    } catch {}
    setIsTourOpen(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setIsTourOpen(true);
    }, 150);
  }, []);

  useEffect(() => {
    if (!isSplashActive) {
      try {
        const welcomeSeen = localStorage.getItem('cartpilot_welcome_sheet_seen') === 'true';
        if (!welcomeSeen) {
          setIsWelcomeSheetOpen(true);
        } else {
          checkAndTriggerTour();
        }
      } catch {}
    }
  }, [isSplashActive, checkAndTriggerTour]);

  const [isPhoneLoginOpen, setIsPhoneLoginOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isUnserviceableModalOpen, setIsUnserviceableModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('cartpilot_wallet_balance');
    return saved ? parseFloat(saved) : 0;
  });

  // Authoritative real-time ledger wallet sync via REST & WebSocket
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const syncWalletBalance = async () => {
      try {
        const res = await authFetch(`${API_BASE}/wallet`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.data?.wallet && typeof data.data.wallet.balancePaise === 'number' && isMounted) {
          const balRupees = data.data.wallet.balancePaise / 100;
          setWalletBalance(balRupees);
          try {
            localStorage.setItem('cartpilot_wallet_balance', balRupees.toString());
          } catch {}
        }
      } catch {}
    };

    // 1. Initial live balance fetch
    syncWalletBalance();

    // 2. Window focus listener to refresh balance whenever user returns to tab
    const handleFocus = () => {
      syncWalletBalance();
    };
    window.addEventListener('focus', handleFocus);

    // 3. Periodic polling fallback (every 45s) for zero-latency balance accuracy
    const pollInterval = setInterval(syncWalletBalance, 45000);

    // 4. Connect to backend WebSocket for instantaneous push updates
    let ws: WebSocket | null = null;
    try {
      let wsHost = window.location.host;
      let wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      const explicitWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
      if (explicitWsUrl && explicitWsUrl.trim()) {
        const url = new URL(explicitWsUrl.trim());
        wsHost = url.host;
        wsProtocol = url.protocol;
      } else if (API_BASE && API_BASE.startsWith('http')) {
        const url = new URL(API_BASE);
        wsHost = url.host;
        wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      }

      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'wallet:updated' && msg.data?.balancePaise !== undefined && isMounted) {
            const updatedRupees = msg.data.balancePaise / 100;
            setWalletBalance(updatedRupees);
            try {
              localStorage.setItem('cartpilot_wallet_balance', updatedRupees.toString());
            } catch {}
          }
        } catch {}
      };

      ws.onerror = () => {
        // Silent recovery: HTTP polling & window focus continue seamlessly
      };
      ws.onclose = () => {
        // Handled cleanly
      };
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        } catch {}
      }
    };
  }, [token, authFetch]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cartpilot_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);

  const handleOpenCoupons = (_mode: 'view' | 'apply' = 'view') => {
    setIsCouponsOpen(true);
  };

  const calculateCouponDiscount = useCallback(
    (code: string, currentCart: CartData | null): number => {
      const itemsTotal = (currentCart?.items || []).reduce(
        (sum, i) => sum + (i.pricePaise || 0) * i.quantity,
        0
      ) / 100;
      const isFirstOrder = orders.length === 0;
      const res = validateAndComputeCoupon(code, itemsTotal, isFirstOrder);
      return res.isValid ? Math.round(res.discountAmount * 100) : 0;
    },
    [orders.length]
  );

  const handleApplyCoupon = useCallback(
    (code: string): boolean => {
      const itemsTotal = (cart?.items || []).reduce(
        (sum, i) => sum + (i.pricePaise || 0) * i.quantity,
        0
      ) / 100;
      const isFirstOrder = orders.length === 0;
      const res = validateAndComputeCoupon(code, itemsTotal, isFirstOrder);
      if (res.isValid) {
        setAppliedCoupon({
          code: res.coupon?.code || code.trim().toUpperCase(),
          discountPaise: Math.round(res.discountAmount * 100),
        });
        showBanner('success', `Coupon '${res.coupon?.code}' applied! Saved ₹${res.discountAmount}`);
        return true;
      }
      showBanner('error', res.reason || 'Invalid coupon');
      return false;
    },
    [cart, orders.length]
  );

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Sync discount dynamically if cart items change
  useEffect(() => {
    if (appliedCoupon && cart) {
      const updatedDiscount = calculateCouponDiscount(appliedCoupon.code, cart);
      if (updatedDiscount !== appliedCoupon.discountPaise) {
        setAppliedCoupon((prev) => (prev ? { ...prev, discountPaise: updatedDiscount } : null));
      }
    }
  }, [cart, calculateCouponDiscount, appliedCoupon]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrdersSheetOpen, setIsOrdersSheetOpen] = useState(false);
  const [isRulesSheetOpen, setIsRulesSheetOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false);

  // Optimistic Cart & Background Sync state references
  const lastConfirmedCartRef = useRef<CartData | null>(null);
  const pendingQuantitiesRef = useRef<Map<string, number>>(new Map());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const syncQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showBanner = (
    type: 'success' | 'error',
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    setFeedbackBanner({ type, message, action });
    setTimeout(() => {
      setFeedbackBanner((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Policy derivation
  const deriveLampState = (): {
    status: LampStatus;
    reasonCode: string;
    reasonText: string;
  } => {
    if (!cart || cart.items.length === 0) {
      return { status: 'none', reasonCode: 'EMPTY_CART', reasonText: 'Cart is empty.' };
    }
    if (policyEval) {
      if (policyEval.outcome === 'ALLOW') {
        return {
          status: 'go',
          reasonCode: policyEval.reasonCode,
          reasonText: policyEval.explanation,
        };
      }
      if (
        policyEval.outcome === 'NEEDS_HUMAN_APPROVAL' ||
        policyEval.outcome === 'NEEDS_APPROVAL'
      ) {
        return {
          status: 'ask',
          reasonCode: policyEval.reasonCode,
          reasonText: policyEval.explanation,
        };
      }
      return {
        status: 'stop',
        reasonCode: policyEval.reasonCode,
        reasonText: policyEval.explanation,
      };
    }
    return { status: 'none', reasonCode: 'POLICY_UNRESOLVED', reasonText: 'Evaluating policies…' };
  };

  const currentLamp = deriveLampState();

  const evaluatePolicy = useCallback(async (_tokenOverride?: string) => {
    try {
      const res = await authFetch(`${API_BASE}/policy/evaluate`);
      if (res.ok) {
        const data = await res.json();
        setPolicyEval(data.data);
      }
    } catch (err) {
      console.warn('Policy evaluation failed:', err);
    }
  }, [authFetch]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (!token) return;
      try {
        const [cartRes, mandateRes, orderRes, catalogRes] = await Promise.all([
          authFetch(`${API_BASE}/cart`),
          authFetch(`${API_BASE}/mandate`),
          authFetch(`${API_BASE}/orders`),
          authFetch(`${API_BASE}/catalog?limit=50`),
        ]);

        if (cartRes.ok) {
          const d = await cartRes.json();
          lastConfirmedCartRef.current = d.data;
          setCart(d.data);
        }
        if (mandateRes.ok) {
          const d = await mandateRes.json();
          setMandate(d.data.mandate);
        }
        if (orderRes.ok) {
          const d = await orderRes.json();
          const ords = d.data || [];
          setOrders(ords);
          if (ords.length > 0) {
            setTrackedOrder(ords[0]);
          }
        }
        if (catalogRes.ok) {
          const d = await catalogRes.json();
          setProducts(d.data || []);
        }

        await evaluatePolicy();

        // Fetch addresses
        try {
          const addrRes = await authFetch(`${API_BASE}/addresses`);
          if (addrRes.ok) {
            const addrData = await addrRes.json();
            const addrs: UserAddress[] = addrData.data || [];
            const def = addrs.find((a) => a.isDefault) || addrs[0] || null;
            if (def && !selectedAddress) {
              selectAddress(def);
            }
          }
        } catch (e) {
          console.warn('Addresses fetch failed:', e);
        }

        // Fetch Wallet balance from real backend
        try {
          const walletRes = await authFetch(`${API_BASE}/wallet`);
          if (walletRes.ok) {
            const wData = await walletRes.json();
            const bal =
              wData.data?.wallet?.balancePaise !== undefined
                ? wData.data.wallet.balancePaise / 100
                : wData.data?.balanceRupees;
            if (bal !== undefined) {
              setWalletBalance(bal);
              localStorage.setItem('cartpilot_wallet_balance', bal.toString());
            }
          }
        } catch (e) {
          console.warn('Wallet fetch failed:', e);
        }

        // Fetch Chat sessions
        const sessionRes = await authFetch(`${API_BASE}/chat/sessions`);

        let session = null;
        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          const sessList = sData.data || [];
          setChatSessions(sessList);

          const savedId = localStorage.getItem('cartpilot_active_session_id');
          if (savedId && sessList.some((s: any) => s._id === savedId)) {
            session = sessList.find((s: any) => s._id === savedId);
          } else {
            session = sessList[0];
          }
        }

        if (!session) {
          const createRes = await authFetch(`${API_BASE}/chat/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Weekly Grocery Shopping' }),
          });
          if (createRes.ok) {
            const cData = await createRes.json();
            session = cData.data;
            setChatSessions([session]);
          }
        }

        if (session) {
          setActiveChatSessionId(session._id);
          localStorage.setItem('cartpilot_active_session_id', session._id);
          const detailRes = await authFetch(`${API_BASE}/chat/sessions/${session._id}`);
          if (detailRes.ok) {
            const dData = await detailRes.json();
            if (dData.data?.messages?.length > 0) {
              setMessages(
                dData.data.messages.map((m: ServerChatMessage) => ({
                  id: m._id,
                  sender: m.sender.toLowerCase() as 'user' | 'agent' | 'system',
                  content: m.content,
                  timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                createdAt: m.createdAt,
                  toolCalls: m.toolCalls,
                  cardType: m.cardType,
                  cardData: m.cardData,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    };
    init();
  }, [token, evaluatePolicy]);

  // Load session messages on switch
  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return;
      try {
        const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}`);
        if (res.ok) {
          const dData = await res.json();
          if (dData.data?.messages) {
            setMessages(
              dData.data.messages.map((m: ServerChatMessage) => ({
                id: m._id,
                sender: m.sender.toLowerCase() as 'user' | 'agent' | 'system',
                content: m.content,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                createdAt: m.createdAt,
                toolCalls: m.toolCalls,
                cardType: m.cardType,
                cardData: m.cardData,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Failed to load session messages:', err);
      }
    },
    [authFetch]
  );

  const handleSwitchSession = async (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    localStorage.setItem('cartpilot_active_session_id', sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleNewChat = async () => {
    try {
      const res = await authFetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Shopping Session #${chatSessions.length + 1}` }),
      });
      if (res.ok) {
        const data = await res.json();
        const newSession = data.data;
        setChatSessions((prev) => [newSession, ...prev]);
        setActiveChatSessionId(newSession._id);
        localStorage.setItem('cartpilot_active_session_id', newSession._id);
        setMessages([]);
        showBanner('success', 'New conversation started');
      }
    } catch {
      showBanner('error', 'Could not create new session');
    }
  };

  const handleRenameSession = async (sessionId: string, currentTitle: string) => {
    const newTitle = window.prompt('Enter new session title:', currentTitle);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

    try {
      const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setChatSessions((prev) =>
          prev.map((s) => (s._id === sessionId ? { ...s, title: newTitle.trim() } : s))
        );
        showBanner('success', 'Conversation renamed');
      }
    } catch {
      showBanner('error', 'Failed to rename conversation');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this conversation? All messages will be permanently removed.')) {
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = chatSessions.filter((s) => s._id !== sessionId);
        setChatSessions(remaining);
        showBanner('success', 'Conversation deleted');
        if (activeChatSessionId === sessionId) {
          if (remaining.length > 0) {
            handleSwitchSession(remaining[0]._id);
          } else {
            handleNewChat();
          }
        }
      }
    } catch {
      showBanner('error', 'Failed to delete conversation');
    }
  };

  // ── Rollback Single Item on Network Failure with Retry ─────────────────────
  const handleRollback = useCallback(
    (productId: string, failedQty: number, errorMsg: string) => {
      // 1. Get confirmed item quantity from lastConfirmedCartRef
      const confirmedItem = lastConfirmedCartRef.current?.items?.find(
        (i) => i.productId === productId
      );
      const confirmedQty = confirmedItem?.quantity || 0;

      // 2. Clear pending quantity for this item
      pendingQuantitiesRef.current.delete(productId);

      // 3. Roll back ONLY this item to its last confirmed quantity
      const prod =
        products.find((p) => p._id === productId) ||
        confirmedItem || { _id: productId, pricePaise: 0 };
      setCart((prev) =>
        updateCartOptimistically(prev, prod, confirmedQty, user?.id || 'shopper')
      );

      // 4. Non-blocking banner with Retry option
      showBanner('error', `${errorMsg}. Restored previous quantity.`, {
        label: 'Retry',
        onClick: () => {
          handleUpdateQuantity(productId, failedQty);
        },
      });
    },
    [products, user?.id]
  );

  // ── Background Network Synchronization with Debounce & Serialization ──────
  const executeBackgroundSync = useCallback(
    (productId: string) => {
      // Chain onto existing promise for this productId to guarantee serialization
      const currentChain = syncQueueRef.current.get(productId) || Promise.resolve();

      const nextPromise = currentChain.then(async () => {
        const desiredQty = pendingQuantitiesRef.current.get(productId);
        if (desiredQty === undefined) return;

        // Is item already confirmed in the server cart?
        const confirmedItem = lastConfirmedCartRef.current?.items?.find(
          (i) => i.productId === productId
        );
        const isConfirmedInCart = Boolean(confirmedItem);
        const confirmedQty = confirmedItem?.quantity || 0;

        // If desired quantity equals confirmed server quantity, no call needed
        if (desiredQty === confirmedQty) {
          pendingQuantitiesRef.current.delete(productId);
          return;
        }

        // Guest handling: if no token, persist in localStorage and return
        if (!token) {
          pendingQuantitiesRef.current.delete(productId);
          return;
        }

        try {
          let res: Response;
          if (desiredQty <= 0) {
            if (isConfirmedInCart) {
              res = await authFetch(`${API_BASE}/cart/items/${productId}`, {
                method: 'DELETE',
              });
            } else {
              pendingQuantitiesRef.current.delete(productId);
              return;
            }
          } else if (isConfirmedInCart) {
            // Update quantity via PATCH
            res = await authFetch(`${API_BASE}/cart/items/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: desiredQty }),
            });
          } else {
            // Add new item via POST
            res = await authFetch(`${API_BASE}/cart/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId, quantity: desiredQty }),
            });
          }

          if (res.ok) {
            const data = await res.json();
            const serverCart: CartData = data.data;
            lastConfirmedCartRef.current = serverCart;

            // Reconcile: only replace client cart if user didn't tap again mid-request
            const currentDesired = pendingQuantitiesRef.current.get(productId);
            if (currentDesired === undefined || currentDesired === desiredQty) {
              setCart(serverCart);
              pendingQuantitiesRef.current.delete(productId);
            }

            evaluatePolicy().catch(() => {});
          } else {
            const errData = await res.json().catch(() => ({}));

            // Handle live stock limits (INSUFFICIENT_STOCK 409)
            if (res.status === 409 || errData.error?.code === 'INSUFFICIENT_STOCK') {
              const availableStock =
                errData.error?.details?.availableStock ??
                products.find((p) => p._id === productId)?.availableStock ??
                0;
              const cappedQty = Math.max(0, availableStock);

              showBanner('error', `Only ${cappedQty} units left in stock. Adjusted quantity.`);

              pendingQuantitiesRef.current.set(productId, cappedQty);
              const prod =
                products.find((p) => p._id === productId) ||
                lastConfirmedCartRef.current?.items?.find((i) => i.productId === productId);
              setCart((prev) =>
                updateCartOptimistically(prev, prod || { _id: productId }, cappedQty, user?.id || 'shopper')
              );

              // If capped quantity > 0, sync the clamped quantity to the server
              if (cappedQty > 0) {
                executeBackgroundSync(productId);
              }
            } else {
              handleRollback(productId, desiredQty, errData.error?.message || 'Failed to update item');
            }
          }
        } catch {
          handleRollback(productId, desiredQty, 'Network error updating item');
        }
      });

      syncQueueRef.current.set(productId, nextPromise);
    },
    [token, user?.id, products, evaluatePolicy, authFetch, handleRollback]
  );

  // ── Synchronous Instant Optimistic Actions ────────────────────────────────
  const handleAddToCart = useCallback(
    (productId: string, quantity: number = 1) => {
      const prod =
        products.find((p) => p._id === productId) ||
        cart?.items?.find((i) => i.productId === productId);
      const currentQty =
        pendingQuantitiesRef.current.get(productId) ??
        cart?.items?.find((i) => i.productId === productId)?.quantity ??
        0;

      const stock = prod?.availableStock ?? 999;
      if (stock <= 0) {
        showBanner('error', `${prod?.name || 'Item'} is out of stock`);
        return;
      }

      let targetQty = currentQty + quantity;
      if (targetQty > stock) {
        targetQty = stock;
        showBanner('error', `Only ${stock} units available in stock`);
      }

      // 1. Synchronous optimistic state update (client-side first, 0ms latency)
      pendingQuantitiesRef.current.set(productId, targetQty);
      setCart((prev) =>
        updateCartOptimistically(prev, prod || { _id: productId }, targetQty, user?.id || 'shopper')
      );

      // 2. Debounce background synchronization (300ms)
      const existingTimer = debounceTimersRef.current.get(productId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(productId);
        executeBackgroundSync(productId);
      }, 300);
      debounceTimersRef.current.set(productId, timer);
    },
    [products, cart?.items, user?.id, executeBackgroundSync]
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const prod =
        products.find((p) => p._id === productId) ||
        cart?.items?.find((i) => i.productId === productId);

      const stock = prod?.availableStock ?? 999;
      let targetQty = Math.max(0, quantity);

      if (targetQty > stock) {
        targetQty = stock;
        showBanner('error', `Only ${stock} units available in stock`);
      }

      // 1. Synchronous optimistic state update (client-side first, 0ms latency)
      pendingQuantitiesRef.current.set(productId, targetQty);
      setCart((prev) =>
        updateCartOptimistically(prev, prod || { _id: productId }, targetQty, user?.id || 'shopper')
      );

      // 2. Debounce background synchronization (300ms)
      const existingTimer = debounceTimersRef.current.get(productId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(productId);
        executeBackgroundSync(productId);
      }, 300);
      debounceTimersRef.current.set(productId, timer);
    },
    [products, cart?.items, user?.id, executeBackgroundSync]
  );

  const handleRemoveItem = useCallback(
    (productId: string) => {
      const prod =
        products.find((p) => p._id === productId) ||
        cart?.items?.find((i) => i.productId === productId);

      // 1. Synchronous optimistic removal
      pendingQuantitiesRef.current.set(productId, 0);
      setCart((prev) =>
        updateCartOptimistically(prev, prod || { _id: productId }, 0, user?.id || 'shopper')
      );

      // 2. Debounce background synchronization (300ms)
      const existingTimer = debounceTimersRef.current.get(productId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        debounceTimersRef.current.delete(productId);
        executeBackgroundSync(productId);
      }, 300);
      debounceTimersRef.current.set(productId, timer);
    },
    [products, cart?.items, user?.id, executeBackgroundSync]
  );

  const handleClearCart = useCallback(async () => {
    // Clear all pending debounce timers
    debounceTimersRef.current.forEach((t) => clearTimeout(t));
    debounceTimersRef.current.clear();
    pendingQuantitiesRef.current.clear();

    // 1. Synchronous optimistic clear
    setCart((prev) =>
      prev
        ? {
            ...prev,
            items: [],
            itemCount: 0,
            pricing: calculateOptimisticPricing([]),
          }
        : null
    );

    // 2. Background sync
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/cart`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        lastConfirmedCartRef.current = data.data;
        setCart(data.data);
        evaluatePolicy().catch(() => {});
        showBanner('success', 'Cart cleared');
      } else {
        // Rollback
        setCart(lastConfirmedCartRef.current);
        showBanner('error', 'Failed to clear cart on server');
      }
    } catch {
      // Rollback
      setCart(lastConfirmedCartRef.current);
      showBanner('error', 'Network error clearing cart');
    }
  }, [token, authFetch, evaluatePolicy]);

  const handleAddProposedItems = async (items: Array<{ productId: string; quantity: number }>) => {
    if (items.length === 0) return;
    setIsLoading(true);
    try {
      const validItems = items.filter((i) => Boolean(i.productId));
      await Promise.all(
        validItems.map((item) =>
          authFetch(`${API_BASE}/cart/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        )
      );
      const cartRes = await authFetch(`${API_BASE}/cart`);
      if (cartRes.ok) {
        const cData = await cartRes.json();
        setCart(cData.data);
        await evaluatePolicy();
      }
      showBanner('success', `Added ${validItems.length} ingredients to cart!`);
    } catch {
      showBanner('error', 'Failed to add items to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeliveryNote = async (deliveryNote: string) => {
    if (cart) {
      setCart({ ...cart, deliveryNote });
    }
    try {
      await authFetch(`${API_BASE}/cart/delivery-note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryNote }),
      });
    } catch (e) {
      console.warn('Delivery note update failed:', e);
    }
  };

  // Send Chat message
  const handleSendMessage = async (text: string, sessionIdOverride?: string) => {
    const trimmed = text.trim();
    if (!trimmed || !token) return;

    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
      },
    ]);
    setComposerText('');
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 20000); // 20-second timeout safeguard to prevent hanging

    try {
      let sessionId = sessionIdOverride || activeChatSessionId;
      if (!sessionId) {
        const createRes = await authFetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmed.slice(0, 30) }),
          signal: abortController.signal,
        });
        if (createRes.ok) {
          const sData = await createRes.json();
          sessionId = sData.data._id;
          setActiveChatSessionId(sessionId);
        }
      }

      if (sessionId) {
        const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed }),
          signal: abortController.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const { agentMessage } = data.data;
          setMessages((prev) => [
            ...prev,
            {
              id: agentMessage._id || `agent-${Date.now()}`,
              sender: 'agent',
              content: agentMessage.content,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: Date.now(),
              toolCalls: agentMessage.toolCalls,
              cardType: agentMessage.cardType,
              cardData: agentMessage.cardData,
            },
          ]);

          if (agentMessage.cardType === 'cart' || agentMessage.cardType === 'items') {
            const cartRes = await authFetch(`${API_BASE}/cart`);
            if (cartRes.ok) {
              const cData = await cartRes.json();
              setCart(cData.data);
              await evaluatePolicy();
            }
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || 'The AI assistant is momentarily syncing. Please try again.';
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-err-${Date.now()}`,
              sender: 'agent',
              content: `I ran into a temporary delay processing that request. Please try again.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: Date.now(),
              isError: true,
              retryText: trimmed,
            },
          ]);
          showBanner('error', errMsg);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-aborted-${Date.now()}`,
            sender: 'agent',
            content: 'Response generation stopped.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-err-${Date.now()}`,
            sender: 'agent',
            content: 'Network connection interrupted. Please try asking again in a moment!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        showBanner('error', 'Network error connecting to AI agent');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Spending Mandates
  const handleSelectPreset = async (presetKey: string) => {
    try {
      const res = await authFetch(`${API_BASE}/mandates/preset/${presetKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setMandate(data.data.mandate);
        await evaluatePolicy();
        showBanner('success', `Activated "${data.data.preset.name}" spending mandate preset`);
      }
    } catch {
      showBanner('error', 'Network error activating preset');
    }
  };

  const handleUpdateCustomLimits = async (
    autoApprovePaise: number,
    perOrderPaise: number,
    dailyPaise: number
  ) => {
    try {
      const res = await authFetch(`${API_BASE}/mandates/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoApproveUpToPaise: autoApprovePaise,
          perOrderCapPaise: perOrderPaise,
          dailyBudgetPaise: dailyPaise,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMandate(data.data);
        await evaluatePolicy();
        showBanner('success', 'Custom spending mandate updated');
      }
    } catch {
      showBanner('error', 'Network error saving limits');
    }
  };

  const handleOrderSuccess = (order: OrderData) => {
    setOrders((prev) => [order, ...prev]);
    setTrackedOrder(order);
    setIsLiveTrackingOpen(true);
    showBanner('success', `Order #${order.orderNumber} placed successfully!`);
    // Refresh cart
    authFetch(`${API_BASE}/cart`)
      .then((r) => r.json())
      .then((d) => setCart(d.data))
      .catch(() => {});
  };

  const handleReorder = async (pastOrder: OrderData) => {
    if (!token || !pastOrder.items || pastOrder.items.length === 0) return;
    const toAdd = pastOrder.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));
    await handleAddProposedItems(toAdd);
    setIsOrdersSheetOpen(false);
    setActiveMobileTab('cart');
    showBanner('success', `Added ${toAdd.length} items from #${pastOrder.orderNumber} to cart`);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem('cartpilot_favorites', JSON.stringify(next));
      showBanner('success', next.includes(productId) ? 'Saved to Wishlist' : 'Removed from Wishlist');
      return next;
    });
  };

  const handleAddWalletFunds = (amount: number) => {
    setWalletBalance((prev) => {
      const next = prev + amount;
      try {
        localStorage.setItem('cartpilot_wallet_balance', next.toString());
      } catch {}
      showBanner('success', `Added ₹${amount.toFixed(0)} to CartPilot Wallet`);
      return next;
    });
  };

  const handleDeductWalletFunds = (amount: number) => {
    setWalletBalance((prev) => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem('cartpilot_wallet_balance', next.toString());
      return next;
    });
  };

  // ── Smart In-App Back Navigation & History Trap ──────────────────────────────
  // Prevents the browser's back gesture/button from leaking into Google OAuth or Login.
  // 1. Closes any open modal/sheet first.
  // 2. Returns to the 'home' tab if on a sub-tab (browse, chat, cart, account).
  // 3. Anchors on 'home' so user stays safely inside CartPilot until explicit logout.
  const backNavigationStateRef = useRef({
    hasOpenModal: false,
    closeAllModals: () => {},
    activeTab: 'home' as TabKey,
    goToHome: () => {},
  });

  // Keep state ref updated on each render without tearing down or polluting browser history
  backNavigationStateRef.current = {
    hasOpenModal: Boolean(
      isProductSheetOpen ||
      isCheckoutModalOpen ||
      isLiveTrackingOpen ||
      isGlobalSearchOpen ||
      isAddressModalOpen ||
      isWishlistOpen ||
      isWalletOpen ||
      isCouponsOpen ||
      isNotificationsOpen ||
      isOrdersSheetOpen ||
      isRulesSheetOpen ||
      isProfileModalOpen ||
      isIntegrationsModalOpen ||
      isConversationDrawerOpen
    ),
    closeAllModals: () => {
      setIsProductSheetOpen(false);
      setIsCheckoutModalOpen(false);
      setIsLiveTrackingOpen(false);
      setIsGlobalSearchOpen(false);
      closeAddressModal();
      setIsWishlistOpen(false);
      setIsWalletOpen(false);
      setIsCouponsOpen(false);
      setIsNotificationsOpen(false);
      setIsOrdersSheetOpen(false);
      setIsRulesSheetOpen(false);
      setIsProfileModalOpen(false);
      setIsIntegrationsModalOpen(false);
      setIsConversationDrawerOpen(false);
    },
    activeTab: activeMobileTab,
    goToHome: () => setActiveMobileTab('home'),
  };

  useEffect(() => {
    // Clean up any Clerk/OAuth parameters and anchor the root state
    window.history.replaceState({ cartpilotApp: true, tab: 'home' }, '', window.location.pathname);

    // Push the active guard entry ahead of the history stack
    window.history.pushState({ cartpilotApp: true, guard: true }, '', window.location.pathname);

    const handlePopState = () => {
      // 1. CRITICAL: Immediately re-arm the forward history guard on the current pathname.
      // This prevents ANY backward escape to external domains (accounts.google.com) or /login.
      window.history.pushState({ cartpilotApp: true, guard: true }, '', window.location.pathname);

      const navState = backNavigationStateRef.current;

      // 2. If any modal is open, close the modal first
      if (navState.hasOpenModal) {
        navState.closeAllModals();
        return;
      }

      // 3. If on sub-tab, navigate smoothly back to 'home'
      if (navState.activeTab !== 'home') {
        navState.goToHome();
        return;
      }

      // 4. Already on 'home' with no open overlays: user is safely anchored on Home
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = useCallback((tab: TabKey, categoryId?: string) => {
    setActiveMobileTab((prev) => {
      if (prev !== tab) setPreviousTab(prev);
      return tab;
    });
    if (categoryId) {
      setSelectedBrowseCategory(categoryId);
    }
    try {
      const url = new URL(window.location.href);
      if (tab === 'chat') {
        url.searchParams.set('tab', 'assistant');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.pushState({ tab }, '', url.toString());
    } catch {}
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const tab = e.state?.tab;
      if (tab) {
        setActiveMobileTab(tab);
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam === 'assistant' || tabParam === 'chat') setActiveMobileTab('chat');
        else if (tabParam === 'browse') setActiveMobileTab('browse');
        else if (tabParam === 'cart') setActiveMobileTab('cart');
        else if (tabParam === 'orders') setActiveMobileTab('account');
        else if (tabParam === 'account') setActiveMobileTab('account');
        else if (window.location.pathname.includes('/shopper/assistant')) setActiveMobileTab('chat');
        else setActiveMobileTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTriggerCookingPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    // Immediately switch to the AI Assistant tab and set composer
    setActiveMobileTab('chat');
    setComposerText(trimmed);

    // Create a new fresh chat session for this cooking query
    try {
      if (token) {
        setIsLoading(true);
        const title = trimmed.length > 30 ? `${trimmed.slice(0, 27)}...` : trimmed;
        const createRes = await authFetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });

        if (createRes.ok) {
          const sData = await createRes.json();
          const newSession = sData.data;
          const newSessionId = newSession._id;

          setActiveChatSessionId(newSessionId);
          localStorage.setItem('cartpilot_active_session_id', newSessionId);
          setChatSessions((prev) => [newSession, ...prev]);
          setMessages([]);

          await handleSendMessage(trimmed, newSessionId);
          return;
        }
      }
    } catch (err) {
      console.warn('Fresh chat session init error, using fallback:', err);
    }

    // Fallback: send through existing session
    setTimeout(() => {
      handleSendMessage(trimmed);
    }, 150);
  };

  // ── Silent Live Data Sync on Tab Visibility / Focus (Zero Banners or Shifts) ──
  useEffect(() => {
    if (!token) return;

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        // Refetch quietly in background with no banners, toasts, or indicators
        authFetch(`${API_BASE}/catalog?limit=50`)
          .then(async (res) => {
            if (res.ok) {
              const d = await res.json();
              setProducts(d.data || []);
            }
          })
          .catch(() => {});

        authFetch(`${API_BASE}/cart`)
          .then(async (res) => {
            if (res.ok) {
              const d = await res.json();
              if (pendingQuantitiesRef.current.size === 0) {
                lastConfirmedCartRef.current = d.data;
                setCart(d.data);
              }
            }
          })
          .catch(() => {});

        authFetch(`${API_BASE}/orders`)
          .then(async (res) => {
            if (res.ok) {
              const d = await res.json();
              const ords = d.data || [];
              setOrders(ords);
              if (ords.length > 0) {
                setTrackedOrder(ords[0]);
              }
            }
          })
          .catch(() => {});

        authFetch(`${API_BASE}/wallet`)
          .then(async (res) => {
            if (res.ok) {
              const wData = await res.json();
              const bal =
                wData.data?.wallet?.balancePaise !== undefined
                  ? wData.data.wallet.balancePaise / 100
                  : wData.data?.balanceRupees;
              if (bal !== undefined) {
                setWalletBalance(bal);
                localStorage.setItem(
                  'cartpilot_wallet_balance',
                  bal.toString()
                );
              }
            }
          })
          .catch(() => {});

        authFetch(`${API_BASE}/chat/sessions`)
          .then(async (res) => {
            if (res.ok) {
              const sData = await res.json();
              setChatSessions(sData.data || []);
            }
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token, authFetch]);

  // ── Mobile Viewport Lock on Chat (Strictly locks window scrolling and elastic bouncing) ──
  useEffect(() => {
    if (activeMobileTab === 'chat') {
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origHtmlHeight = document.documentElement.style.height;
      const origBodyOverflow = document.body.style.overflow;
      const origBodyHeight = document.body.style.height;
      const origBodyPosition = document.body.style.position;
      const origBodyTop = document.body.style.top;
      const origBodyLeft = document.body.style.left;
      const origBodyWidth = document.body.style.width;
      const origBodyOverscroll = document.body.style.overscrollBehaviorY;

      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100dvh';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100dvh';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.width = '100%';
      document.body.style.overscrollBehaviorY = 'none';

      window.scrollTo(0, 0);

      return () => {
        document.documentElement.style.overflow = origHtmlOverflow;
        document.documentElement.style.height = origHtmlHeight;
        document.body.style.overflow = origBodyOverflow;
        document.body.style.height = origBodyHeight;
        document.body.style.position = origBodyPosition;
        document.body.style.top = origBodyTop;
        document.body.style.left = origBodyLeft;
        document.body.style.width = origBodyWidth;
        document.body.style.overscrollBehaviorY = origBodyOverscroll;
      };
    }
  }, [activeMobileTab]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  return (
    <div
      className={`w-full flex flex-col bg-[--bg] text-[--ink] selection:bg-brand selection:text-white ${
        activeMobileTab === 'chat'
          ? 'fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden lg:relative lg:inset-auto'
          : activeMobileTab === 'cart'
            ? 'min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden'
            : 'min-h-screen'
      }`}
    >
      {/* ── Desktop Full-Width Top Header (Screen >= 1024px) ───────────────── */}
      <DesktopHeader
        activeTab={activeMobileTab}
        onSelectTab={handleSelectTab}
        cart={cart}
        selectedAddress={selectedAddress}
        onOpenAddressModal={openAddressModal}
        onOpenSearchModal={() => setIsGlobalSearchOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenRules={() => setIsRulesSheetOpen(true)}
        onOpenOrders={() => setIsOrdersSheetOpen(true)}
        onOpenProfile={() => setActiveMobileTab('account')}
        onLogout={() => logout()}
        userInitial={userInitial}
        userName={user?.name || 'Customer'}
        walletBalance={walletBalance}
        favoritesCount={favorites.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* ── Main Screen Viewport Switching ──────────────────────────────────── */}
      <div
        className={`flex-1 flex min-w-0 w-full relative ${
          activeMobileTab === 'chat'
            ? 'min-h-0 overflow-hidden'
            : activeMobileTab === 'cart'
              ? 'min-h-0 lg:overflow-hidden'
              : ''
        }`}
      >
        {/* Active Tab Screen */}
        <main
          className={`flex-1 flex flex-col min-w-0 w-full ${
            activeMobileTab === 'chat'
              ? 'min-h-0 overflow-hidden pb-0'
              : activeMobileTab === 'cart'
                ? 'min-h-0 lg:overflow-hidden pb-16 lg:pb-0'
                : activeMobileTab === 'account'
                  ? 'pb-[72px] lg:pb-6'
                  : 'pb-20 lg:pb-0'
          }`}
        >
          {activeMobileTab === 'home' && (
            <HomeScreen
              products={products}
              cart={cart}
              orders={orders}
              selectedAddress={selectedAddress}
              onSelectTab={handleSelectTab}
              onOpenAddressModal={openAddressModal}
              onOpenSearchModal={() => setIsGlobalSearchOpen(true)}
              onOpenProfile={() => setActiveMobileTab('account')}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenCoupons={() => handleOpenCoupons('view')}
              onOpenWishlist={() => setIsWishlistOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenRules={() => setIsRulesSheetOpen(true)}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setIsProductSheetOpen(true);
              }}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenTracking={(ord) => {
                setTrackedOrder(ord);
                setIsLiveTrackingOpen(true);
              }}
              userInitial={userInitial}
              walletBalance={walletBalance}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onTriggerAIPrompt={handleTriggerCookingPrompt}
            />
          )}

          {activeMobileTab === 'browse' && (
            <BrowseScreen
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setIsProductSheetOpen(true);
              }}
              initialCategory={selectedBrowseCategory}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeMobileTab === 'chat' && (
            <AIShopScreen
              messages={messages}
              isLoading={isLoading}
              composerText={composerText}
              setComposerText={setComposerText}
              onSendMessage={handleSendMessage}
              onStopGeneration={() => {
                if (chatAbortControllerRef.current) {
                  chatAbortControllerRef.current.abort();
                }
                setIsLoading(false);
              }}
              onOpenDrawer={() => setIsConversationDrawerOpen(true)}
              onOpenCartDrawer={() => {
                setPreviousTab('chat');
                handleSelectTab('cart');
              }}
              onNewChat={handleNewChat}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onAddProposedItems={handleAddProposedItems}
              lampStatus={currentLamp.status}
              lampReasonCode={currentLamp.reasonCode}
              lampReasonText={currentLamp.reasonText}
            />
          )}

          {activeMobileTab === 'cart' && (
            <CartScreen
              cart={cart}
              products={products}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onProceedToCheckout={() => setIsCheckoutModalOpen(true)}
              onUpdateDeliveryNote={handleUpdateDeliveryNote}
              onExploreProducts={() => setActiveMobileTab('browse')}
              onOpenCoupons={() => handleOpenCoupons((cart?.items?.length ?? 0) > 0 ? 'apply' : 'view')}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              selectedDeliverySlot={selectedDeliverySlot}
              onSelectDeliverySlot={setSelectedDeliverySlot}
              onBack={() => handleSelectTab(previousTab || 'browse')}
              isLoading={isLoading}
            />
          )}

          {activeMobileTab === 'account' && (
            <AccountScreen
              user={user}
              orders={orders}
              selectedAddress={selectedAddress}
              walletBalance={walletBalance}
              favoritesCount={favorites.length}
              onOpenOrders={() => setIsOrdersSheetOpen(true)}
              onOpenAddresses={openAddressModal}
              onOpenRules={() => setIsRulesSheetOpen(true)}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenCoupons={() => handleOpenCoupons('view')}
              onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
              onLogout={() => logout()}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onReplayTour={handleReplayTour}
            />
          )}
        </main>

        {/* Desktop Persistent Context Panel (on wide screens >= 1100px when on chat) */}
        {activeMobileTab === 'chat' && (
          <div className="hidden min-[1100px]:flex flex-col h-full min-h-0 border-l border-[--line] w-[clamp(360px,28vw,440px)] flex-shrink-0 overflow-hidden">
            <ContextPanel
              cart={cart}
              mandate={mandate}
              lampStatus={currentLamp.status}
              lampReasonCode={currentLamp.reasonCode}
              lampReasonText={currentLamp.reasonText}
              isCollapsed={isContextPanelCollapsed}
              onToggleCollapse={() => setIsContextPanelCollapsed(!isContextPanelCollapsed)}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onInitiateCheckout={() => { evaluatePolicy().catch(() => {}); setIsCheckoutModalOpen(true); }}
              onUpdateDeliveryNote={handleUpdateDeliveryNote}
              onOpenRules={() => setIsRulesSheetOpen(true)}
              onOpenBrowse={() => setActiveMobileTab('browse')}
              selectedAddress={selectedAddress}
              onOpenAddressModal={openAddressModal}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* ── Static Bottom 5-Destination Navigation Bar (Visible only on mobile/tablet) ────── */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800">
        <BottomTabBar
          activeTab={activeMobileTab}
          onSelectTab={handleSelectTab}
          cart={cart}
        />
      </div>

      {/* ── Slide-Over Conversation Drawer (Screen 9) ──────────────────────── */}
      <ConversationDrawer
        isOpen={isConversationDrawerOpen}
        onClose={() => setIsConversationDrawerOpen(false)}
        sessions={chatSessions}
        activeSessionId={activeChatSessionId}
        onSelectSession={handleSwitchSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onOpenOrders={() => setIsOrdersSheetOpen(true)}
        onOpenAddresses={openAddressModal}
        onOpenRules={() => setIsRulesSheetOpen(true)}
        onOpenAccount={() => setActiveMobileTab('account')}
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
        activeOrdersCount={
          orders.filter(
            (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED'
          ).length
        }
      />

      {/* ── Checkout Modal (Screen 12) ─────────────────────────────────────── */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cart={cart}
        selectedAddress={selectedAddress}
        onOpenAddressSelector={openAddressModal}
        onOrderSuccess={handleOrderSuccess}
        token={token}
        walletBalance={walletBalance}
        onDeductWallet={handleDeductWalletFunds}
        initialDeliverySlot={selectedDeliverySlot}
        appliedCoupon={appliedCoupon}
      />

      {/* ── Wishlist & Favorites Modal ─────────────────────────────────────── */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        favoriteIds={favorites}
        onRemoveFavorite={handleToggleFavorite}
        onAddToCart={handleAddToCart}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setIsProductSheetOpen(true);
        }}
      />

      {/* ── CartPilot Wallet Modal ─────────────────────────────────────────── */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={walletBalance}
        onAddFunds={handleAddWalletFunds}
        token={token}
      />

      {/* ── Available Coupons & Offers Modal ───────────────────────────────── */}
      <CouponsModal
        isOpen={isCouponsOpen}
        onClose={() => setIsCouponsOpen(false)}
        showApply={(cart?.items?.length ?? 0) > 0}
        itemsTotalRupees={
          ((cart?.items || []).reduce((sum, i) => sum + (i.pricePaise || 0) * i.quantity, 0)) / 100
        }
        isFirstOrder={orders.length === 0}
        onApplyCoupon={(code) => {
          handleApplyCoupon(code);
          setActiveMobileTab('cart');
        }}
      />

      {/* ── Notifications Center Modal ─────────────────────────────────────── */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* ── Live Tracking Modal (Screen 13) ─────────────────────────────────── */}
      <LiveTrackingModal
        isOpen={isLiveTrackingOpen}
        onClose={() => setIsLiveTrackingOpen(false)}
        order={trackedOrder}
        onRefresh={() => {
          if (!token) return;
          authFetch(`${API_BASE}/orders`)
            .then((r) => r.json())
            .then((d) => {
              const ords = d.data || [];
              setOrders(ords);
              if (trackedOrder) {
                const refreshed = ords.find((o: OrderData) => o._id === trackedOrder._id);
                if (refreshed) setTrackedOrder(refreshed);
              }
            })
            .catch(() => {});
        }}
      />

      {/* ── Global Search Modal (Screen 14) ─────────────────────────────────── */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        products={products}
        orders={orders}
        chatSessions={chatSessions}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setIsProductSheetOpen(true);
        }}
        onAddToCart={handleAddToCart}
        onSelectOrder={(ord) => {
          setTrackedOrder(ord);
          setIsLiveTrackingOpen(true);
        }}
        onSelectChat={(id) => {
          handleSwitchSession(id);
          setActiveMobileTab('chat');
        }}
      />

      {/* ── Product Details Sheet (Screen 4) ───────────────────────────────── */}
      <ProductSheet
        product={selectedProduct}
        isOpen={isProductSheetOpen}
        onClose={() => setIsProductSheetOpen(false)}
        cartItems={cart?.items}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onViewInChat={(p) => {
          setIsProductSheetOpen(false);
          setActiveMobileTab('chat');
          setComposerText(`Tell me recipe ideas and nutrition for ${p.name}`);
        }}
      />

      {/* ── Location Selector & Address Management Modal (Screens 7 & 11) ──── */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={closeAddressModal}
        token={token}
        selectedAddressId={selectedAddress?._id}
        onSelectAddress={(addr) => {
          selectAddress(addr);
          if (addr.isServiceable === false) {
            setIsUnserviceableModalOpen(true);
          }
        }}
      />

      {/* ── Unserviceable Location Notice Modal (Reference Screen 5) ────────── */}
      <UnserviceableModal
        isOpen={isUnserviceableModalOpen}
        onClose={() => setIsUnserviceableModalOpen(false)}
        locality={selectedAddress?.areaLocality || selectedAddress?.city}
      />

      {/* ── Orders & Delivery Tracking Sheet (Screen 8) ─────────────────────── */}
      <OrdersSheet
        isOpen={isOrdersSheetOpen}
        onClose={() => setIsOrdersSheetOpen(false)}
        orders={orders}
        onReorder={handleReorder}
        isSlideOver={typeof window !== 'undefined' && window.innerWidth >= 641}
      />

      {/* ── Spending Rules Modal (Spending Mandate) ────────────────────────── */}
      <RulesSheet
        isOpen={isRulesSheetOpen}
        onClose={() => setIsRulesSheetOpen(false)}
        mandate={mandate}
        cart={cart}
        onSelectPreset={handleSelectPreset}
        onUpdateCustomLimits={handleUpdateCustomLimits}
        isSlideOver={typeof window !== 'undefined' && window.innerWidth >= 641}
      />

      {/* ── Customer Account & Profile Modal ──────────────────────────────── */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        token={token}
        onOpenAddresses={openAddressModal}
        onOpenOrders={() => setIsOrdersSheetOpen(true)}
        onOpenRules={() => setIsRulesSheetOpen(true)}
        onLogout={() => logout()}
      />

      {/* ── Premium First-Run Flow: Splash -> Welcome Sheet -> Guided Tour ── */}
      <SplashScreen onComplete={handleSplashComplete} />

      <WelcomeSheet
        isOpen={isWelcomeSheetOpen}
        onComplete={handleWelcomeComplete}
      />

      <GuidedTour
        isOpen={isTourOpen}
        onComplete={handleTourComplete}
      />

      {/* ── Phone Login Modal ──────────────────────────────────────────────── */}
      <PhoneLoginModal
        isOpen={isPhoneLoginOpen}
        onClose={() => setIsPhoneLoginOpen(false)}
      />

      {/* ── Integrations & Real AI Engine Modal ────────────────────────────── */}
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        token={token}
      />

      {/* ── Feedback Banner ───────────────────────────────────────────────── */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 shadow-lg backdrop-blur-md transition-all animate-in fade-in duration-150 ${
            feedbackBanner.type === 'success'
              ? 'bg-[--brand-soft] border-[--go]/30 text-[--go]'
              : 'bg-red-50 dark:bg-red-900/20 border-[--stop]/30 text-[--stop]'
          }`}
        >
          {feedbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="flex-1">{feedbackBanner.message}</span>
          {feedbackBanner.action && (
            <button
              type="button"
              onClick={() => {
                feedbackBanner.action?.onClick();
                setFeedbackBanner(null);
              }}
              className="ml-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
            >
              {feedbackBanner.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
