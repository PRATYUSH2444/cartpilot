import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
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
import { NotificationsModal } from '../../components/shopper/NotificationsModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
  const { token, user, logout, authFetch } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );

  // Active navigation tab
  const [activeMobileTab, setActiveMobileTab] = useState<TabKey>('home');
  const [selectedBrowseCategory, setSelectedBrowseCategory] = useState<string>('ALL');

  // Core state
  const [cart, setCart] = useState<CartData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mandate, setMandate] = useState<MandateData | null>(null);
  const [policyEval, setPolicyEval] = useState<PolicyEvaluation | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

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
  const [isSplashScreenOpen, setIsSplashScreenOpen] = useState(false);
  const [isPhoneLoginOpen, setIsPhoneLoginOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isUnserviceableModalOpen, setIsUnserviceableModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('cartpilot_wallet_balance');
    return saved ? parseFloat(saved) : 349.0;
  });
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOrdersSheetOpen, setIsOrdersSheetOpen] = useState(false);
  const [isRulesSheetOpen, setIsRulesSheetOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(false);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4000);
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
            setSelectedAddress(def);
          }
        } catch (e) {
          console.warn('Addresses fetch failed:', e);
        }

        // Fetch Wallet balance from real backend
        try {
          const walletRes = await authFetch(`${API_BASE}/users/wallet`);
          if (walletRes.ok) {
            const wData = await walletRes.json();
            if (wData.data?.balanceRupees !== undefined) {
              setWalletBalance(wData.data.balanceRupees);
              localStorage.setItem('cartpilot_wallet_balance', wData.data.balanceRupees.toString());
            }
          }
        } catch (e) {
          console.warn('Wallet fetch failed:', e);
        }

        // Fetch Chat sessions
        const sessionRes = await fetch(`${API_BASE}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
          const createRes = await fetch(`${API_BASE}/chat/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
          const detailRes = await fetch(`${API_BASE}/chat/sessions/${session._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
      if (!token || !sessionId) return;
      try {
        const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    [token]
  );

  const handleSwitchSession = async (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    localStorage.setItem('cartpilot_active_session_id', sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleNewChat = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    if (!token) return;
    const newTitle = window.prompt('Enter new session title:', currentTitle);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    if (!token) return;
    if (!window.confirm('Delete this conversation? All messages will be permanently removed.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  // Cart operations
  const handleAddToCart = async (productId: string, quantity: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
        showBanner('success', 'Added to cart');
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Failed to add item');
      }
    } catch {
      showBanner('error', 'Network error adding item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (quantity <= 0) {
        await handleRemoveItem(productId);
        return;
      }
      const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
      }
    } catch {
      showBanner('error', 'Network error updating quantity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
        showBanner('success', 'Item removed');
      }
    } catch {
      showBanner('error', 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
        showBanner('success', 'Cart cleared');
      }
    } catch {
      showBanner('error', 'Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProposedItems = async (items: Array<{ productId: string; quantity: number }>) => {
    if (!token || items.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of items) {
        if (!item.productId) continue;
        await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(item),
        });
      }
      const cartRes = await fetch(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cartRes.ok) {
        const cData = await cartRes.json();
        setCart(cData.data);
        await evaluatePolicy(token);
      }
      showBanner('success', `Added ${items.length} proposed ingredients to cart!`);
    } catch {
      showBanner('error', 'Failed to add items to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDeliveryNote = async (deliveryNote: string) => {
    if (!token) return;
    if (cart) {
      setCart({ ...cart, deliveryNote });
    }
    try {
      await fetch(`${API_BASE}/cart/delivery-note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryNote }),
      });
    } catch (e) {
      console.warn('Delivery note update failed:', e);
    }
  };

  // Send Chat message
  const handleSendMessage = async (text: string) => {
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
      },
    ]);
    setComposerText('');
    setIsLoading(true);

    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 20000); // 20-second timeout safeguard to prevent hanging

    try {
      let sessionId = activeChatSessionId;
      if (!sessionId) {
        const createRes = await fetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: 'Weekly Grocery Shopping' }),
          signal: abortController.signal,
        });
        if (createRes.ok) {
          const sData = await createRes.json();
          sessionId = sData.data._id;
          setActiveChatSessionId(sessionId);
        }
      }

      if (sessionId) {
        const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
              toolCalls: agentMessage.toolCalls,
              cardType: agentMessage.cardType,
              cardData: agentMessage.cardData,
            },
          ]);

          if (agentMessage.cardType === 'cart' || agentMessage.cardType === 'items') {
            const cartRes = await fetch(`${API_BASE}/cart`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (cartRes.ok) {
              const cData = await cartRes.json();
              setCart(cData.data);
              await evaluatePolicy(token);
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
              content: `I ran into a temporary delay processing that request. Please ask again or explore our catalog in the **Browse** tab.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/mandates/preset/${presetKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMandate(data.data.mandate);
        await evaluatePolicy(token);
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
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/mandates/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          autoApproveUpToPaise: autoApprovePaise,
          perOrderCapPaise: perOrderPaise,
          dailyBudgetPaise: dailyPaise,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMandate(data.data);
        await evaluatePolicy(token);
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
    if (token) {
      fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setCart(d.data))
        .catch(() => {});
    }
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

  const handleAddWalletFunds = async (amount: number) => {
    try {
      const res = await authFetch(`${API_BASE}/users/wallet/top-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaise: Math.round(amount * 100) }),
      });
      if (res.ok) {
        const d = await res.json();
        const newBalance = d.data.balanceRupees;
        setWalletBalance(newBalance);
        localStorage.setItem('cartpilot_wallet_balance', newBalance.toString());
        const bonusMsg = d.data.bonusPaise > 0 ? ` (including ₹${(d.data.bonusPaise / 100).toFixed(0)} bonus)` : '';
        showBanner('success', `Added ₹${amount.toFixed(0)} to CartPilot Wallet${bonusMsg}`);
        return;
      }
    } catch (err) {
      console.warn('Failed to top up wallet on server, falling back to local state:', err);
    }

    setWalletBalance((prev) => {
      const next = prev + amount;
      localStorage.setItem('cartpilot_wallet_balance', next.toString());
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

  const handleSelectTab = (tab: TabKey, categoryId?: string) => {
    setActiveMobileTab(tab);
    if (categoryId) {
      setSelectedBrowseCategory(categoryId);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  return (
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col bg-[--bg] text-[--ink] overflow-hidden relative">
      {/* ── Desktop Full-Width Top Header (Screen >= 1024px) ───────────────── */}
      <DesktopHeader
        activeTab={activeMobileTab}
        onSelectTab={handleSelectTab}
        cart={cart}
        selectedAddress={selectedAddress}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
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
        onToggleTheme={() => setIsDark((d) => !d)}
      />

      {/* ── Main Screen Viewport Switching ──────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Active Tab Screen */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {activeMobileTab === 'home' && (
            <HomeScreen
              products={products}
              cart={cart}
              orders={orders}
              selectedAddress={selectedAddress}
              onSelectTab={handleSelectTab}
              onOpenAddressModal={() => setIsAddressModalOpen(true)}
              onOpenSearchModal={() => setIsGlobalSearchOpen(true)}
              onOpenProfile={() => setActiveMobileTab('account')}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenCoupons={() => setIsCouponsOpen(true)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
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
              onTriggerAIPrompt={(prompt) => {
                setActiveMobileTab('chat');
                setComposerText(prompt);
                setTimeout(() => {
                  handleSendMessage(prompt);
                }, 150);
              }}
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
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onProceedToCheckout={() => setIsCheckoutModalOpen(true)}
              onUpdateDeliveryNote={handleUpdateDeliveryNote}
              onExploreProducts={() => setActiveMobileTab('browse')}
              onOpenCoupons={() => setIsCouponsOpen(true)}
              isLoading={isLoading}
            />
          )}

          {activeMobileTab === 'account' && (
            <AccountScreen
              user={user}
              orders={orders}
              selectedAddress={selectedAddress}
              walletBalance={walletBalance}
              onOpenOrders={() => setIsOrdersSheetOpen(true)}
              onOpenAddresses={() => setIsAddressModalOpen(true)}
              onOpenRules={() => setIsRulesSheetOpen(true)}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onOpenWishlist={() => setIsWishlistOpen(true)}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenCoupons={() => setIsCouponsOpen(true)}
              onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
              onLogout={() => logout()}
              isDark={isDark}
              onToggleTheme={() => setIsDark((d) => !d)}
            />
          )}
        </main>

        {/* Desktop Persistent Context Panel (on wide screens >= 1024px when on chat or cart) */}
        {(activeMobileTab === 'chat' || activeMobileTab === 'cart') && (
          <div className="hidden lg:block h-full border-l border-[--line]">
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
              onInitiateCheckout={() => setIsCheckoutModalOpen(true)}
              onUpdateDeliveryNote={handleUpdateDeliveryNote}
              onOpenRules={() => setIsRulesSheetOpen(true)}
              onOpenBrowse={() => setActiveMobileTab('browse')}
              selectedAddress={selectedAddress}
              onOpenAddressModal={() => setIsAddressModalOpen(true)}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* ── Fixed Bottom 5-Destination Navigation Bar (Visible only on mobile/tablet) ────── */}
      <div className="block lg:hidden flex-shrink-0">
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
        onOpenAddresses={() => setIsAddressModalOpen(true)}
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
        onOpenAddressSelector={() => setIsAddressModalOpen(true)}
        onOrderSuccess={handleOrderSuccess}
        token={token}
        walletBalance={walletBalance}
        onDeductWallet={handleDeductWalletFunds}
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
      />

      {/* ── Available Coupons & Offers Modal ───────────────────────────────── */}
      <CouponsModal
        isOpen={isCouponsOpen}
        onClose={() => setIsCouponsOpen(false)}
        onApplyCoupon={(code) => {
          setActiveMobileTab('cart');
          showBanner('success', `Coupon '${code}' applied to your basket!`);
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
          fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } })
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
        onClose={() => setIsAddressModalOpen(false)}
        token={token}
        selectedAddressId={selectedAddress?._id}
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
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
        onOpenAddresses={() => setIsAddressModalOpen(true)}
        onOpenOrders={() => setIsOrdersSheetOpen(true)}
        onOpenRules={() => setIsRulesSheetOpen(true)}
        onLogout={() => logout()}
      />

      {/* ── Splash Screen (Screen 1) ───────────────────────────────────────── */}
      <SplashScreen
        isOpen={isSplashScreenOpen}
        onGetStarted={() => setIsSplashScreenOpen(false)}
        onSignIn={() => {
          setIsSplashScreenOpen(false);
          setIsPhoneLoginOpen(true);
        }}
        onClose={() => setIsSplashScreenOpen(false)}
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
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-card backdrop-blur-md transition-all ${
            feedbackBanner.type === 'success'
              ? 'bg-[--brand-soft] border-[--go]/30 text-[--go]'
              : 'bg-red-50 dark:bg-red-900/20 border-[--stop]/30 text-[--stop]'
          }`}
        >
          {feedbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedbackBanner.message}</span>
        </div>
      )}
    </div>
  );
};
