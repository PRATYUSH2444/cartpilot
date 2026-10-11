import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/Header';
import { LivingBackground } from '../../components/LivingBackground';
import { Composer } from '../../components/Composer';
import { RulesCard } from '../../components/cards/RulesCard';
import { ItemsCard, ProposalPayload } from '../../components/cards/ItemsCard';
import { CartCard } from '../../components/cards/CartCard';
import { ApprovalCard } from '../../components/cards/ApprovalCard';
import { PaymentCard } from '../../components/cards/PaymentCard';
import { OrderCard } from '../../components/cards/OrderCard';
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
  Sparkles,
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

export const ShopperWorkspace: React.FC = () => {
  const { token } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

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
  const [chatSessions, setChatSessions] = useState<{ _id: string; title: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      content:
        'Welcome to CartPilot! I am your policy-controlled shopping assistant. I help you find strictly vegetarian groceries, plan meals, and assemble carts governed by deterministic spending mandates. The AI proposes, the policy engine decides, and you confirm payment.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cardType: 'rules',
      cardData: {
        maxOrderAmountPaise: 50000,
        dailyBudgetPaise: 150000,
        requireExplicitApproval: false,
      },
    },
  ]);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Derive current Decision Lamp state from backend policy evaluation
  const deriveLampState = (): {
    status: LampStatus;
    reasonCode: string;
    reasonText: string;
  } => {
    if (!cart || cart.items.length === 0) {
      return {
        status: 'none',
        reasonCode: 'EMPTY_CART',
        reasonText: 'Cart is empty. Add grocery items to evaluate spending policy.',
      };
    }

    if (policyEval) {
      if (policyEval.outcome === 'ALLOW') {
        return {
          status: 'go',
          reasonCode: policyEval.reasonCode,
          reasonText: policyEval.explanation,
        };
      }
      if (policyEval.outcome === 'NEEDS_HUMAN_APPROVAL') {
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

    return {
      status: 'none',
      reasonCode: 'POLICY_UNRESOLVED',
      reasonText: 'Evaluating mandate policies...',
    };
  };

  const currentLamp = deriveLampState();

  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // Policy Evaluation Call
  const evaluatePolicy = async (authToken: string) => {
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
  };

  // Initial load
  useEffect(() => {
    const initializeShopperSession = async () => {
      if (!token) return;

      try {
        // Fetch active cart
        const cartRes = await fetch(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCart(cartData.data);
        }

        // Fetch mandate rules
        const mandateRes = await fetch(`${API_BASE}/mandate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mandateRes.ok) {
          const mData = await mandateRes.json();
          setMandate(mData.data.mandate);
        }

        // Fetch orders
        const orderRes = await fetch(`${API_BASE}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrders(orderData.data || []);
        }

        await evaluatePolicy(token);

        // Fetch or create chat session
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
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
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
            if (dData.data?.messages && dData.data.messages.length > 0) {
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
        console.warn('Network error initializing shopper session:', err);
      }
    };

    initializeShopperSession();
  }, [token]);

  // Create New Chat Session
  const handleNewChat = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: `Shopping Session #${chatSessions.length + 1}` }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSession = data.data;
        setChatSessions([newSession, ...chatSessions]);
        setActiveChatSessionId(newSession._id);
        setMessages([
          {
            id: `welcome-${Date.now()}`,
            sender: 'agent',
            content:
              'New shopping session started! What vegetarian groceries or meal recipes can I help you assemble today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        showBanner('success', 'Started fresh grocery shopping session');
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (res.ok) {
        const data = await res.json();
        setCart(data.data);
        await evaluatePolicy(token);
        showBanner('success', 'Item added to your cart');
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

  // Add Proposed Items Batch from Recipe/ItemsCard
  const handleAddProposedItems = async (
    itemsToAdd?: Array<{ productId: string; quantity: number }>
  ) => {
    if (!token || !itemsToAdd || itemsToAdd.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of itemsToAdd) {
        await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
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

      showBanner('success', `Added ${itemsToAdd.length} recipe ingredients to your cart!`);
    } catch {
      showBanner('error', 'Failed to add proposed items to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Item Quantity
  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  // Remove Item
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

  // Clear Cart
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

  // Initiate Autonomous Checkout
  const handleInitiateCheckout = async () => {
    if (!cart || cart.items.length === 0 || !token) {
      showBanner('error', 'Cart is empty');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
          showBanner('error', errData.error?.message || 'Human approval required for this cart');
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

  // Verify Payment Success (Valid HMAC)
  const handleVerifyPaymentSuccess = async () => {
    if (!activePaymentOrder || !token) return;
    setIsLoading(true);

    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

        // Refresh cart & policy
        const cartRes = await fetch(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartRes.ok) {
          const cData = await cartRes.json();
          setCart(cData.data);
        }

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

  // Verify Payment Failure (Tamper Test)
  const handleSimulateTamperPayment = async () => {
    if (!activePaymentOrder || !token) return;
    setIsLoading(true);

    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: order._id,
          razorpayOrderId: razorpay.orderId,
          razorpayPaymentId: 'pay_tampered_attack_999',
          razorpaySignature: 'invalid_forged_signature_hex_digest',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showBanner(
          'error',
          `Security Alert: ${errData.error?.code} — ${errData.error?.message}. Stock reservation was safely released!`
        );

        setActivePaymentOrder(null);
        await evaluatePolicy(token);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-tamper-${Date.now()}`,
            sender: 'agent',
            content: `🛡️ Security Guard Triggered: Cryptographic signature mismatch detected. Order ${order.orderNumber} was marked FAILED and all reserved inventory was restored to the catalog.`,
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

  // Simulate Order Fulfillment Step
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

        showBanner('success', `Order fulfillment advanced to ${updatedOrder.status}`);
      }
    } catch {
      showBanner('error', 'Failed to advance order step');
    } finally {
      setIsLoading(false);
    }
  };

  // Grant Approval
  const handleGrantApproval = async (approvalId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showBanner('success', 'Cryptographic human approval recorded in audit chain!');
        await evaluatePolicy(token);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-approved-${Date.now()}`,
            sender: 'agent',
            content:
              'Approval granted! The order is now cleared for checkout. Proceeding to payment reservation...',
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

  // Reject Approval
  const handleRejectApproval = async (approvalId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showBanner('success', 'Order approval rejected. Cart modified.');
        await evaluatePolicy(token);
      }
    } catch {
      showBanner('error', 'Failed to reject approval');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Message to Chat Agent
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !token) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsLoading(true);

    try {
      let sessionId = activeChatSessionId;
      if (!sessionId) {
        const createRes = await fetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
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

  const mandateLimitFormatted = mandate
    ? `Limit: ₹${(mandate.maxOrderAmountPaise / 100).toFixed(0)}`
    : undefined;

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-acc selection:text-white bg-paper text-ink">
      <LivingBackground />

      {/* Shopper Header */}
      <Header
        cart={cart}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        lampStatus={currentLamp.status}
        mandateSummary={mandateLimitFormatted}
        onOpenMandate={() => setIsMandateModalOpen(true)}
      />

      {/* Temporary Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
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

      {/* Main One-Chat Shell */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 relative z-10">
        {/* Left Sidebar: Sessions & Quick Prompts */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-acc text-white hover:bg-blue-600 font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Grocery Chat</span>
          </button>

          {/* Suggested Grocery Prompts */}
          <div className="p-3 rounded-xl bg-card border border-brd space-y-2">
            <span className="text-[10px] uppercase font-bold text-mut flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick AI Prompts</span>
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleSendMessage('Make Paneer Pulao for 4 people with ingredients')}
                className="w-full p-2 rounded-lg bg-paper/60 hover:bg-paper border border-brd text-left text-[11px] text-ink font-medium transition-colors"
              >
                🥘 Paneer Pulao for 4
              </button>
              <button
                onClick={() => handleSendMessage('I need organic milk, curd, and fresh tomatoes')}
                className="w-full p-2 rounded-lg bg-paper/60 hover:bg-paper border border-brd text-left text-[11px] text-ink font-medium transition-colors"
              >
                🥛 Dairy & Salad Essentials
              </button>
              <button
                onClick={() => handleSendMessage('Suggest healthy breakfast groceries under ₹400')}
                className="w-full p-2 rounded-lg bg-paper/60 hover:bg-paper border border-brd text-left text-[11px] text-ink font-medium transition-colors"
              >
                🥗 Healthy Breakfast (&lt; ₹400)
              </button>
            </div>
          </div>

          {/* Past Sessions */}
          <div className="p-3 rounded-xl bg-card border border-brd space-y-2">
            <span className="text-[10px] uppercase font-bold text-mut block">
              Recent Shopping Sessions
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {chatSessions.map((s) => (
                <div
                  key={s._id}
                  className={`p-2 rounded-lg text-xs truncate flex items-center gap-2 cursor-pointer transition-colors ${
                    s._id === activeChatSessionId
                      ? 'bg-acc/10 text-acc font-semibold border border-acc/20'
                      : 'text-mut hover:text-ink hover:bg-paper'
                  }`}
                  onClick={() => setActiveChatSessionId(s._id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Chat Column */}
        <div className="flex-1 flex flex-col bg-card/60 backdrop-blur-md border border-brd rounded-2xl p-4 shadow-sm min-h-[600px]">
          {/* Messages Stream Container */}
          <div className="flex-1 space-y-4 pb-4 overflow-y-auto">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                      isUser ? 'bg-acc shadow-blue-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`space-y-3 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-acc text-white rounded-tr-none'
                          : 'bg-paper border border-brd text-ink rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Sandboxed Tool Call Badges */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-brd/50 space-y-1">
                          <span className="text-[10px] font-mono text-mut block uppercase tracking-wider font-semibold">
                            Sandboxed Tool Execution:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {msg.toolCalls.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-paper border border-brd text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                              >
                                <span>⚡</span>
                                <span>{t.toolName}</span>
                                {t.durationMs !== undefined && (
                                  <span className="text-mut">({t.durationMs}ms)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Embedded Dynamic Cards */}
                    {msg.cardType === 'rules' ? (
                      <RulesCard
                        rules={{
                          maxOrderAmountPaise: mandate?.maxOrderAmountPaise || 50000,
                          dailyBudgetPaise: mandate?.dailyBudgetPaise || 150000,
                          requireExplicitApproval: mandate?.requireExplicitApproval || false,
                        }}
                        currentCartTotalPaise={cart?.pricing.totalPaise || 0}
                      />
                    ) : null}

                    {msg.cardType === 'items' && Boolean(msg.cardData) ? (
                      <ItemsCard
                        cardData={msg.cardData as ProposalPayload}
                        onAddToCart={handleAddToCart}
                        onAddAllToCart={handleAddProposedItems}
                        title="Recipe Ingredients Proposal"
                      />
                    ) : null}

                    {msg.cardType === 'approval' && Boolean(msg.cardData) ? (
                      <ApprovalCard
                        cartTotal={(msg.cardData as { cartTotal: string }).cartTotal}
                        reason={
                          (msg.cardData as { reason?: string }).reason || 'Threshold exceeded'
                        }
                        cartVersion={(msg.cardData as { cartVersion?: number }).cartVersion || 1}
                        approvalHash={(msg.cardData as { approvalHash?: string }).approvalHash}
                        status={
                          (msg.cardData as { approvalStatus?: string }).approvalStatus || 'PENDING'
                        }
                        onApprove={() =>
                          handleGrantApproval(
                            (msg.cardData as { approvalId?: string }).approvalId || ''
                          )
                        }
                        onReject={() =>
                          handleRejectApproval(
                            (msg.cardData as { approvalId?: string }).approvalId || ''
                          )
                        }
                        isLoading={isLoading}
                      />
                    ) : null}

                    {msg.cardType === 'payment' && Boolean(msg.cardData) ? (
                      <PaymentCard
                        orderId={(msg.cardData as PaymentOrderState).order._id}
                        orderNumber={(msg.cardData as PaymentOrderState).order.orderNumber}
                        razorpayOrderId={(msg.cardData as PaymentOrderState).razorpay.orderId}
                        amountPaise={(msg.cardData as PaymentOrderState).razorpay.amountPaise}
                        onVerifySuccess={handleVerifyPaymentSuccess}
                        onVerifyFail={handleSimulateTamperPayment}
                        isLoading={isLoading}
                      />
                    ) : null}

                    {msg.cardType === 'order' && Boolean(msg.cardData) ? (
                      <OrderCard
                        order={msg.cardData as OrderData}
                        onAdvanceFulfillment={handleAdvanceFulfillment}
                        isLoading={isLoading}
                      />
                    ) : null}

                    <span className="text-[10px] text-mut block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Chat Composer Input */}
          <Composer onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>

      {/* Slide-out Cart Drawer Modal */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-card dark:bg-card-top border-l border-brd p-5 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-brd mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-acc" />
                  <h2 className="text-base font-display font-bold text-ink">
                    Active Cart {orders.length > 0 && `(${orders.length} Past Orders)`}
                  </h2>
                </div>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-mut hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart && (
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

            <div className="pt-4 mt-6 border-t border-brd text-center">
              <span className="text-[11px] text-mut font-mono flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                Deterministic policy gateway enforced
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Spending Mandate Modal */}
      {isMandateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMandateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-brd rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brd mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                Autonomous Spending Mandate
              </h3>
              <button
                onClick={() => setIsMandateModalOpen(false)}
                className="p-1 text-mut hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RulesCard
              rules={{
                maxOrderAmountPaise: mandate?.maxOrderAmountPaise || 50000,
                dailyBudgetPaise: mandate?.dailyBudgetPaise || 150000,
                requireExplicitApproval: mandate?.requireExplicitApproval || false,
              }}
              currentCartTotalPaise={cart?.pricing.totalPaise || 0}
            />

            <div className="pt-4 mt-4 border-t border-brd flex justify-end">
              <button
                onClick={() => setIsMandateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-acc text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
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
