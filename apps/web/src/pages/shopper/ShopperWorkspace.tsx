import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RulesCard } from '../../components/cards/RulesCard';
import { ItemsCard, ProposalPayload } from '../../components/cards/ItemsCard';
import { CartCard } from '../../components/cards/CartCard';
import { ApprovalCard } from '../../components/cards/ApprovalCard';
import { PaymentCard } from '../../components/cards/PaymentCard';
import { OrderCard } from '../../components/cards/OrderCard';
import { DecisionLamp } from '../../components/DecisionLamp';
import { useAuth } from '../../context/AuthContext';
import {
  CartData,
  MandateData,
  PolicyEvaluation,
  OrderData,
  ChatMessage,
  LampStatus,
  ToolCallItem,
} from '../../types';
import {
  Bot,
  User,
  ShoppingBag,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  MessageSquare,
  Send,
  Square,
  Loader2,
  Leaf,
  Settings,
  Package,
  Shield,
  LogOut,
  Menu,
  Search,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

interface ServerChatMessage {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
  toolCalls?: ToolCallItem[];
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: unknown;
}

interface PaymentOrderState {
  order: OrderData;
  razorpay: {
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
  };
}

const EXAMPLE_PROMPTS = [
  { emoji: '🍲', label: 'Quick Paneer Pulao for 4', prompt: 'Make Paneer Pulao for 4 people with all ingredients listed' },
  { emoji: '🍛', label: 'Spicy Dal Tadka, serves 2', prompt: 'Dal Tadka recipe with ingredients for 2 servings' },
  { emoji: '📖', label: 'Weekly groceries under ₹1,200', prompt: 'Weekly vegetarian grocery list under ₹1200' },
  { emoji: '🧄', label: 'Aloo Matar curry, feeds 6', prompt: 'Aloo Matar curry ingredients for 6 people' },
];

const QUICK_REPLIES_DEFAULT = [
  { label: 'Quick Paneer Pulao', prompt: 'Make Paneer Pulao for 4 people with ingredients' },
  { label: 'Dal Tadka', prompt: 'Dal Tadka recipe with grocery items for 2 people' },
  { label: 'Veg Biryani', prompt: 'Vegetable Biryani ingredients for 4 servings' },
  { label: 'Aloo Matar', prompt: 'Aloo Matar curry ingredients for 6 people' },
];

const QUICK_REPLIES_AFTER_PROPOSAL = [
  { label: 'Add all to cart', prompt: 'Add all suggested items to my cart' },
  { label: 'Change servings', prompt: 'Change the servings count' },
  { label: 'Make it cheaper', prompt: 'Find cheaper alternatives for this recipe' },
  { label: 'Add spices', prompt: 'Add spices and masalas for this recipe' },
];

export const ShopperWorkspace: React.FC = () => {
  const { token, user, logout } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [cart, setCart] = useState<CartData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [mandate, setMandate] = useState<MandateData | null>(null);
  const [policyEval, setPolicyEval] = useState<PolicyEvaluation | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderState | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isMandateModalOpen, setIsMandateModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<{ _id: string; title: string; updatedAt?: string }[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [composerText, setComposerText] = useState('');
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Determine quick replies based on last agent message
  const lastAgentMsg = [...messages].reverse().find((m) => m.sender === 'agent');
  const quickReplies =
    lastAgentMsg?.cardType === 'items' ? QUICK_REPLIES_AFTER_PROPOSAL : QUICK_REPLIES_DEFAULT;

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derive current Decision Lamp state from backend policy evaluation
  const deriveLampState = (): {
    status: LampStatus;
    reasonCode: string;
    reasonText: string;
    remedies?: PolicyEvaluation['remedies'];
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
          remedies: policyEval.remedies,
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
          remedies: policyEval.remedies,
        };
      }
      return {
        status: 'stop',
        reasonCode: policyEval.reasonCode,
        reasonText: policyEval.explanation,
        remedies: policyEval.remedies,
      };
    }
    return { status: 'none', reasonCode: 'POLICY_UNRESOLVED', reasonText: 'Evaluating policies…' };
  };

  const currentLamp = deriveLampState();

  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Novelty N1: Mandate Preset Activation
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
      } else {
        showBanner('error', 'Failed to activate preset');
      }
    } catch {
      showBanner('error', 'Network error activating preset');
    }
  };

  // Novelty N2: 1-Tap Policy Remedy Application
  const handleApplyRemedy = async (action: string, requiredCapPaise?: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/policy/apply-remedy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, requiredCapPaise }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicyEval(data.data.policy);
        const mRes = await fetch(`${API_BASE}/mandate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          setMandate(mData.data.mandate);
        }
        showBanner('success', data.data.message || 'Policy remedy applied successfully');
      } else {
        showBanner('error', 'Failed to apply remedy');
      }
    } catch {
      showBanner('error', 'Network error applying remedy');
    }
  };

  const evaluatePolicy = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/policy/evaluate`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPolicyEval(data.data);
      }
    } catch (err) {
      console.warn('Policy evaluation failed:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (!token) return;
      try {
        const [cartRes, mandateRes, orderRes] = await Promise.all([
          fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/mandate`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (cartRes.ok) { const d = await cartRes.json(); setCart(d.data); }
        if (mandateRes.ok) { const d = await mandateRes.json(); setMandate(d.data.mandate); }
        if (orderRes.ok) { const d = await orderRes.json(); setOrders(d.data || []); }

        await evaluatePolicy(token);

        // Chat sessions
        const sessionRes = await fetch(`${API_BASE}/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let session = null;
        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          setChatSessions(sData.data || []);
          session = sData.data?.[0];
        }

        if (!session) {
          const createRes = await fetch(`${API_BASE}/chat/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: 'CartPilot Grocery Shopping' }),
          });
          if (createRes.ok) {
            const cData = await createRes.json();
            session = cData.data;
            setChatSessions([session]);
          }
        }

        if (session) {
          setActiveChatSessionId(session._id);
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
                  timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // Create New Chat Session
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
        setMessages([]);
        setSidebarOpen(false);
        showBanner('success', 'New session started');
      }
    } catch {
      showBanner('error', 'Could not create new session');
    }
  };

  // Add Item to Cart
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
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
        showBanner('success', 'Item added to cart');
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Failed to add item');
      }
    } catch {
      showBanner('error', 'Network error adding to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProposedItems = async (itemsToAdd?: Array<{ productId: string; quantity: number }>) => {
    if (!token || !itemsToAdd || itemsToAdd.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of itemsToAdd) {
        await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
        });
      }
      const cartRes = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (cartRes.ok) {
        const cData = await cartRes.json();
        setCart(cData.data);
        await evaluatePolicy(token);
      }
      showBanner('success', `Added ${itemsToAdd.length} ingredients to cart!`);
    } catch {
      showBanner('error', 'Failed to add proposed items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Update failed');
      }
    } catch {
      showBanner('error', 'Network error updating cart item');
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
        showBanner('success', 'Item removed from cart');
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

  const handleInitiateCheckout = async () => {
    if (!cart || cart.items.length === 0 || !token) {
      showBanner('error', 'Cart is empty');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          deliveryAddress: {
            line1: 'Flat 402, Green Glen Heights, Outer Ring Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560103',
            country: 'India',
          },
          notes: 'Deliver before noon; zero meat/egg guarantee acknowledged',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const { order, razorpay } = data.data;
        setActivePaymentOrder({ order, razorpay });
        setIsCartDrawerOpen(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-checkout-${Date.now()}`,
            sender: 'agent',
            content: `Pre-checkout verification passed! Inventory reserved for 15 minutes. Created Razorpay test order ${razorpay.orderId}. Please complete payment below:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cardType: 'payment',
            cardData: { order, razorpay },
          },
        ]);
        showBanner('success', 'Checkout initiated and inventory reserved');
      } else {
        const errData = await res.json();
        if (errData.error?.code === 'APPROVAL_REQUIRED' || policyEval?.requiresApproval) {
          showBanner('error', errData.error?.message || 'Human approval required');
          setIsCartDrawerOpen(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-approval-${Date.now()}`,
              sender: 'agent',
              content:
                'Deterministic Policy Check: This cart total exceeds your autonomous spending limit. Please review the bound cart snapshot and grant approval:',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              cardType: 'approval',
              cardData: {
                cartTotal: cart.pricing.formatted.total,
                reason: policyEval?.explanation || errData.error?.message,
                cartVersion: cart.version,
                approvalId: policyEval?.approvalId,
                approvalHash: policyEval?.approvalHash,
                approvalStatus: policyEval?.approvalStatus || 'PENDING',
              },
            },
          ]);
        } else {
          showBanner('error', errData.error?.message || 'Checkout initiation failed');
        }
      }
    } catch {
      showBanner('error', 'Network error initiating checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPaymentSuccess = async () => {
    if (!activePaymentOrder || !token) return;
    setIsLoading(true);
    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: `pay_test_${Math.random().toString(36).substring(2, 9)}`,
          razorpaySignature: 'simulated_test_signature',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const confirmedOrder = data.data.order;
        setActivePaymentOrder(null);
        const cartRes = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } });
        if (cartRes.ok) { const cData = await cartRes.json(); setCart(cData.data); }
        await evaluatePolicy(token);
        setOrders((prev) => [confirmedOrder, ...prev]);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-paid-${Date.now()}`,
            sender: 'agent',
            content: `Payment authorized and verified! Stock committed to order ${confirmedOrder.orderNumber}. Order confirmation card:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cardType: 'order',
            cardData: confirmedOrder,
          },
        ]);
        showBanner('success', `Payment confirmed for Order ${confirmedOrder.orderNumber}!`);
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Payment verification failed');
      }
    } catch {
      showBanner('error', 'Network error verifying payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateTamperPayment = async () => {
    if (!activePaymentOrder || !token) return;
    setIsLoading(true);
    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: 'pay_tampered_attack_999',
          razorpaySignature: 'invalid_forged_signature_hex_digest',
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        showBanner('error', `Security Alert: ${errData.error?.code} — ${errData.error?.message}.`);
        setActivePaymentOrder(null);
        await evaluatePolicy(token);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-tamper-${Date.now()}`,
            sender: 'agent',
            content: `🛡️ Security Guard Triggered: Cryptographic signature mismatch detected. Order ${order.orderNumber} was marked FAILED and all reserved inventory was restored.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      showBanner('error', 'Signature verification test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceFulfillment = async (orderId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/simulate-step`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.data;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
        setMessages((prev) =>
          prev.map((m) =>
            m.cardType === 'order' && (m.cardData as OrderData)?._id === orderId
              ? { ...m, cardData: updatedOrder }
              : m
          )
        );
        showBanner('success', `Order advanced to ${updatedOrder.status}`);
      }
    } catch {
      showBanner('error', 'Failed to advance order step');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantApproval = async (approvalId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showBanner('success', 'Cryptographic approval recorded!');
        await evaluatePolicy(token);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-approved-${Date.now()}`,
            sender: 'agent',
            content: 'Approval granted! Proceeding to payment reservation...',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        await handleInitiateCheckout();
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Approval submission failed');
      }
    } catch {
      showBanner('error', 'Failed to grant approval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectApproval = async (approvalId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showBanner('success', 'Approval rejected. Cart modified.');
        await evaluatePolicy(token);
      }
    } catch {
      showBanner('error', 'Failed to reject approval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !token) return;

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

    try {
      let sessionId = activeChatSessionId;
      if (!sessionId) {
        const createRes = await fetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: 'CartPilot Shopping Session' }),
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

          if (agentMessage.cardType === 'cart') {
            const cartRes = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } });
            if (cartRes.ok) {
              const cData = await cartRes.json();
              setCart(cData.data);
              await evaluatePolicy(token);
            }
          }
        } else {
          const errData = await res.json();
          showBanner('error', errData.error?.message || 'Failed to get agent response');
        }
      }
    } catch {
      showBanner('error', 'Network error connecting to AI agent');
    } finally {
      setIsLoading(false);
    }
  };

  // Composer keyboard handler
  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && composerText.trim()) {
        handleSendMessage(composerText);
      }
    }
  };

  const cartItemCount = cart?.itemCount || 0;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const filteredSessions = chatSessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  // ─── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[280px] flex-shrink-0 flex flex-col
        bg-[--surface] border-r border-[--line]
        transition-transform duration-250 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* Brand header */}
      <div className="p-5 border-b border-[--line]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[--brand] flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-base text-[--ink] leading-tight">CartPilot</div>
            <div className="text-[--mut] text-[11px]">AI Shopping</div>
          </div>
          <button
            className="ml-auto md:hidden p-1 text-[--mut]"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat button */}
        <button
          onClick={handleNewChat}
          className="w-full py-2.5 px-4 rounded-chip bg-[--brand] text-white font-body font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[--line]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[--mut] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-chip bg-[--surface-2] border-0 text-xs text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-2 focus:ring-[--brand]/20"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filteredSessions.length === 0 ? (
          <p className="text-center text-[--mut] text-xs py-4">No sessions yet</p>
        ) : (
          filteredSessions.map((s) => (
            <button
              key={s._id}
              onClick={() => { setActiveChatSessionId(s._id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-colors mb-0.5 group ${
                s._id === activeChatSessionId
                  ? 'bg-[--brand-soft] text-[--brand]'
                  : 'text-[--mut] hover:bg-[--surface-2] hover:text-[--ink]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 truncate font-medium">{s.title}</span>
            </button>
          ))
        )}
      </div>

      {/* Bottom nav links */}
      <div className="border-t border-[--line] px-2 py-3 space-y-0.5">
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-[--mut] hover:bg-[--surface-2] hover:text-[--ink] transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>Orders</span>
          {orders.length > 0 && (
            <span className="ml-auto bg-[--brand-soft] text-[--brand] text-[10px] font-bold px-1.5 py-0.5 rounded-chip">
              {orders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsMandateModalOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-[--mut] hover:bg-[--surface-2] hover:text-[--ink] transition-colors"
        >
          <Shield className="w-4 h-4" />
          <span>Rules</span>
        </button>
        <button
          onClick={() => setIsDark((d) => !d)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-[--mut] hover:bg-[--surface-2] hover:text-[--ink] transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      {/* User profile */}
      <div className="border-t border-[--line] p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-chip bg-[--brand] flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[--ink] text-xs font-semibold truncate">{user?.name || 'User'}</div>
          <div className="text-[--mut] text-[10px] truncate">{user?.email}</div>
        </div>
        <button
          onClick={() => logout()}
          className="p-1.5 text-[--mut] hover:text-[--stop] transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );

  // ─── Empty State ─────────────────────────────────────────────────────────────
  const EmptyState = (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[--brand] flex items-center justify-center shadow-card">
          <Leaf className="w-9 h-9 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl text-[--ink]">CartPilot</h2>
          <p className="text-[--mut] text-base mt-1">What would you like to cook today?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleSendMessage(p.prompt)}
            className="flex items-start gap-2.5 px-4 py-3 bg-[--surface] border border-[--line] rounded-card text-left hover:border-[--brand]/30 hover:bg-[--brand-soft]/30 transition-colors shadow-card group"
          >
            <span className="text-lg leading-none mt-0.5">{p.emoji}</span>
            <span className="text-[--ink] text-xs font-medium leading-snug group-hover:text-[--brand] transition-colors">
              {p.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Message renderer ─────────────────────────────────────────────────────
  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender === 'user';

    return (
      <div
        key={msg.id}
        className={`flex gap-3 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        {!isUser && (
          <div className="w-7 h-7 rounded-chip bg-[--brand] flex items-center justify-center flex-shrink-0 mb-5">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
          {/* Text bubble */}
          {msg.content && (
            <div
              className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                isUser
                  ? 'bg-[--brand-soft] text-[--ink] rounded-bubble rounded-tr-sm'
                  : 'bg-[--surface] text-[--ink] rounded-bubble rounded-tl-sm shadow-card'
              }`}
            >
              <p>{msg.content}</p>

              {/* Tool calls trace */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[--line]/60 space-y-1">
                  <span className="text-[10px] font-body text-[--mut] uppercase tracking-wider font-semibold">
                    Tool calls:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {msg.toolCalls.map((t, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[--surface-2] border border-[--line] text-[10px] text-[--go]"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span className="font-mono">{t.toolName}</span>
                        {t.durationMs !== undefined && (
                          <span className="text-[--mut]">({t.durationMs}ms)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Embedded cards */}
          {msg.cardType === 'rules' && (
            <div className="w-full max-w-lg">
              <RulesCard
                rules={{
                  maxOrderAmountPaise: mandate?.maxOrderAmountPaise || 50000,
                  dailyBudgetPaise: mandate?.dailyBudgetPaise || 150000,
                  perOrderCapPaise: mandate?.perOrderCapPaise || 100000,
                  requireExplicitApproval: mandate?.requireExplicitApproval || false,
                }}
                currentCartTotalPaise={cart?.pricing.totalPaise || 0}
                onSelectPreset={handleSelectPreset}
                onApplyRemedy={handleApplyRemedy}
              />
            </div>
          )}

          {msg.cardType === 'items' && Boolean(msg.cardData) && (
            <div className="w-full max-w-lg">
              <ItemsCard
                cardData={msg.cardData as ProposalPayload}
                onAddToCart={handleAddToCart}
                onAddAllToCart={handleAddProposedItems}
                title="Recipe Ingredients Proposal"
              />
            </div>
          )}

          {msg.cardType === 'approval' && Boolean(msg.cardData) && (
            <div className="w-full max-w-lg">
              <ApprovalCard
                cartTotal={(msg.cardData as { cartTotal: string }).cartTotal}
                reason={(msg.cardData as { reason?: string }).reason || 'Threshold exceeded'}
                cartVersion={(msg.cardData as { cartVersion?: number }).cartVersion || 1}
                approvalHash={(msg.cardData as { approvalHash?: string }).approvalHash}
                status={(msg.cardData as { approvalStatus?: string }).approvalStatus || 'PENDING'}
                onApprove={() => handleGrantApproval((msg.cardData as { approvalId?: string }).approvalId || '')}
                onReject={() => handleRejectApproval((msg.cardData as { approvalId?: string }).approvalId || '')}
                isLoading={isLoading}
              />
            </div>
          )}

          {msg.cardType === 'payment' && Boolean(msg.cardData) && (
            <div className="w-full max-w-lg">
              <PaymentCard
                orderId={(msg.cardData as PaymentOrderState).order._id}
                orderNumber={(msg.cardData as PaymentOrderState).order.orderNumber}
                razorpayOrderId={(msg.cardData as PaymentOrderState).razorpay.orderId}
                amountPaise={(msg.cardData as PaymentOrderState).razorpay.amountPaise}
                onVerifySuccess={handleVerifyPaymentSuccess}
                onVerifyFail={handleSimulateTamperPayment}
                isLoading={isLoading}
              />
            </div>
          )}

          {msg.cardType === 'order' && Boolean(msg.cardData) && (
            <div className="w-full max-w-lg">
              <OrderCard
                order={msg.cardData as OrderData}
                onAdvanceFulfillment={handleAdvanceFulfillment}
                isLoading={isLoading}
              />
            </div>
          )}

          <span className="text-[10px] text-[--mut] px-1">{msg.timestamp}</span>
        </div>

        {isUser && (
          <div className="w-7 h-7 rounded-chip bg-[--surface-2] border border-[--line] flex items-center justify-center flex-shrink-0 mb-5">
            <User className="w-3.5 h-3.5 text-[--mut]" />
          </div>
        )}
      </div>
    );
  };

  // ─── Composer ─────────────────────────────────────────────────────────────
  const ComposerBar = (
    <div className="sticky bottom-0 glass border-t border-[--line] px-4 py-3">
      {/* Novelty N2: Live Decision Lamp & 1-Tap Counterfactual Remedy */}
      {cart && cart.items.length > 0 && (currentLamp.status === 'ask' || currentLamp.status === 'stop') && (
        <div className="mb-2.5">
          <DecisionLamp
            status={currentLamp.status}
            reasonCode={currentLamp.reasonCode}
            reasonText={currentLamp.reasonText}
            remedies={currentLamp.remedies}
            onApplyRemedy={handleApplyRemedy}
          />
        </div>
      )}

      {/* Quick replies */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
        {quickReplies.map((qr) => (
          <button
            key={qr.label}
            onClick={() => handleSendMessage(qr.prompt)}
            disabled={isLoading}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-[--surface-2] text-[--ink] rounded-chip border border-[--line] hover:border-[--brand]/40 hover:bg-[--brand-soft]/30 transition-colors disabled:opacity-50 font-body"
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-3">
        <textarea
          ref={composerRef}
          rows={1}
          value={composerText}
          onChange={(e) => {
            setComposerText(e.target.value);
            // Auto-grow (1-4 lines)
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
          onKeyDown={handleComposerKeyDown}
          placeholder="Ask CartPilot for vegetarian groceries, recipes, or spending rules…"
          disabled={isLoading}
          className="flex-1 resize-none rounded-[var(--radius-input)] bg-[--surface] border border-[--line] px-4 py-2.5 text-sm text-[--ink] placeholder:text-[--mut] focus:outline-none focus:ring-2 focus:ring-[--brand]/20 focus:border-[--brand]/40 transition-all overflow-hidden leading-relaxed"
          style={{ minHeight: '42px', maxHeight: '96px' }}
        />

        {isLoading ? (
          <button
            onClick={() => setIsLoading(false)}
            className="w-10 h-10 flex-shrink-0 rounded-[var(--radius-input)] bg-[--stop] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleSendMessage(composerText)}
            disabled={!composerText.trim()}
            className="w-10 h-10 flex-shrink-0 rounded-[var(--radius-input)] bg-[--brand] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            title="Send (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex bg-[--bg] text-[--ink] overflow-hidden relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {Sidebar}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[--line] bg-[--surface] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-[--mut] hover:text-[--ink] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[--go]" />
              <span className="text-[--mut]">
                {chatSessions.find((s) => s._id === activeChatSessionId)?.title || 'CartPilot'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-chip bg-[--brand] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">
                {cart?.pricing?.formatted?.total || '₹0.00'}
              </span>
              {cartItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-[--brand] text-[11px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Chat canvas */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            EmptyState
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-chip bg-[--brand] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-4 py-2.5 bg-[--surface] rounded-bubble rounded-tl-sm shadow-card">
                    <div className="flex items-center gap-2 text-[--mut] text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Thinking…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="max-w-3xl mx-auto w-full">
          {ComposerBar}
        </div>
      </div>

      {/* ── Feedback Banner ───────────────────────────────────────────────── */}
      {feedbackBanner && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-card border text-xs font-semibold flex items-center gap-2 shadow-card backdrop-blur-md transition-all ${
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

      {/* ── Cart Drawer ───────────────────────────────────────────────────── */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-md h-full bg-[--surface] flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[--line]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[--brand]" />
                <h2 className="font-heading font-bold text-base text-[--ink]">Your Cart</h2>
                {cartItemCount > 0 && (
                  <span className="px-2 py-0.5 rounded-chip bg-[--brand-soft] text-[--brand] text-xs font-bold">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-1.5 text-[--mut] hover:text-[--ink] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!cart || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <ShoppingBag className="w-12 h-12 text-[--line]" />
                  <p className="text-[--mut] text-sm font-medium">Your cart is empty</p>
                  <p className="text-[--mut] text-xs">Ask CartPilot to add some groceries</p>
                </div>
              ) : (
                <CartCard
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  onInitiateCheckout={handleInitiateCheckout}
                  lampStatus={currentLamp.status}
                  lampReasonCode={currentLamp.reasonCode}
                  lampReasonText={currentLamp.reasonText}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-[--line]">
              {cart && cart.items.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-semibold text-[--ink]">Total</span>
                  <span className="font-heading font-bold text-xl text-[--brand]">
                    {cart.pricing.formatted.total}
                  </span>
                </div>
              )}
              <button
                onClick={() => { setIsCartDrawerOpen(false); handleInitiateCheckout(); }}
                disabled={!cart || cart.items.length === 0 || isLoading || currentLamp.status === 'stop'}
                className="w-full py-3 rounded-[var(--radius-input)] bg-[--brand] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Review &amp; Checkout
              </button>
              <p className="text-center text-[10px] text-[--mut] mt-3 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-[--go]" />
                Deterministic policy gateway enforced
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mandate Modal ─────────────────────────────────────────────────── */}
      {isMandateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setIsMandateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[--surface] border border-[--line] rounded-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[--line] mb-4">
              <h3 className="font-heading font-bold text-base text-[--ink]">Spending Mandate</h3>
              <button
                onClick={() => setIsMandateModalOpen(false)}
                className="p-1 text-[--mut] hover:text-[--ink]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <RulesCard
              rules={{
                maxOrderAmountPaise: mandate?.maxOrderAmountPaise || 50000,
                dailyBudgetPaise: mandate?.dailyBudgetPaise || 150000,
                perOrderCapPaise: mandate?.perOrderCapPaise || 100000,
                requireExplicitApproval: mandate?.requireExplicitApproval || false,
              }}
              currentCartTotalPaise={cart?.pricing.totalPaise || 0}
              onSelectPreset={handleSelectPreset}
              onApplyRemedy={handleApplyRemedy}
            />
            <div className="pt-4 mt-4 border-t border-[--line] flex justify-end">
              <button
                onClick={() => setIsMandateModalOpen(false)}
                className="px-4 py-2 rounded-[var(--radius-input)] bg-[--brand] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
