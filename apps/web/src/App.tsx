import { useState, useEffect, useRef } from 'react';
import { LivingBackground } from './components/LivingBackground';
import { Header } from './components/Header';
import { Composer } from './components/Composer';
import { RulesCard } from './components/cards/RulesCard';
import { ItemsCard, ProposalPayload } from './components/cards/ItemsCard';
import { CartCard } from './components/cards/CartCard';
import { ApprovalCard } from './components/cards/ApprovalCard';
import { PaymentCard } from './components/cards/PaymentCard';
import { OrderCard } from './components/cards/OrderCard';
import { ProofCard } from './components/cards/ProofCard';
import {
  Product,
  CartData,
  MandateData,
  PolicyEvaluation,
  OrderData,
  ChatMessage,
  LampStatus,
  ChainVerification,
  AuditEvent,
  ToolCallItem,
} from './types';
import { Bot, User, ShoppingBag, X, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

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

// Seed demo credentials
const DEMO_CREDENTIALS = {
  CUSTOMER: { email: 'customer@example.com', password: 'Customer1234!' },
  MERCHANT: { email: 'merchant@example.com', password: 'Merchant1234!' },
  ADMIN: { email: 'admin@example.com', password: 'Admin1234!' },
};

interface PaymentOrderState {
  order: OrderData;
  razorpay: {
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
  };
}

export function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });
  const [currentRole, setCurrentRole] = useState<'CUSTOMER' | 'MERCHANT' | 'ADMIN'>('CUSTOMER');
  const [authToken, setAuthToken] = useState<string>('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [mandate, setMandate] = useState<MandateData | null>(null);
  const [policyEval, setPolicyEval] = useState<PolicyEvaluation | null>(null);
  const [chainVerification, setChainVerification] = useState<ChainVerification | null>(null);
  const [recentAuditEvents, setRecentAuditEvents] = useState<AuditEvent[]>([]);
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<PaymentOrderState | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial conversational messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      content:
        'Welcome to CartPilot! I am your policy-controlled shopping assistant. I help you find strictly vegetarian groceries, plan meals, and assemble carts governed by deterministic spending mandates. The AI proposes, the policy engine decides, and you confirm payment.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cardType: 'rules',
      cardData: {
        maxOrderAmountPaise: 60000,
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

    // Default fallback while evaluating
    return {
      status: 'none',
      reasonCode: 'EVALUATING',
      reasonText: 'Evaluating mandate policies...',
    };
  };

  const currentLamp = deriveLampState();

  // Show temporary banner
  const showBanner = (type: 'success' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => setFeedbackBanner(null), 4500);
  };

  // Helper to re-evaluate backend policy
  const evaluatePolicy = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/policy/evaluate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPolicyEval(data.data);
      }
    } catch (err) {
      console.warn('Failed to evaluate policy against backend:', err);
    }
  };

  // Helper to fetch live audit verification
  const fetchAuditVerification = async (token: string) => {
    setIsVerifyingChain(true);
    try {
      const [verifyRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/audit/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/audit/events?limit=6`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (verifyRes.ok) {
        const vData = await verifyRes.json();
        setChainVerification(vData.data);
      }
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setRecentAuditEvents(eData.data);
      }
    } catch (err) {
      console.warn('Failed to fetch audit verification:', err);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  // 1. Initial login & data fetch
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const creds = DEMO_CREDENTIALS[currentRole];
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        });

        if (res.ok) {
          const data = await res.json();
          const token = data.data.accessToken;
          setAuthToken(token);

          // Fetch catalog
          const catRes = await fetch(`${API_BASE}/catalog`);
          if (catRes.ok) {
            const catData = await catRes.json();
            setCatalog(catData.data);
          }

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

          // Fetch order history
          const orderRes = await fetch(`${API_BASE}/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            setOrders(orderData.data);
          }

          // Initial policy & audit evaluations
          await evaluatePolicy(token);
          await fetchAuditVerification(token);

          // Fetch or initialize conversational chat session
          if (currentRole === 'CUSTOMER') {
            try {
              const sessionRes = await fetch(`${API_BASE}/chat/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              let session = null;
              if (sessionRes.ok) {
                const sData = await sessionRes.json();
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
            } catch (chatInitErr) {
              console.warn('Chat session initialization fallback:', chatInitErr);
            }
          }
        }
      } catch (err) {
        console.warn('API server unreachable during initialization, using local state mode:', err);
      }
    };

    initializeSession();
  }, [currentRole]);

  // Switch active user role
  const handleSwitchRole = (newRole: 'CUSTOMER' | 'MERCHANT' | 'ADMIN') => {
    setCurrentRole(newRole);
    showBanner('success', `Switched context to ${newRole}`);
  };

  // Add Item to Cart
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    setIsLoading(true);
    try {
      if (authToken) {
        const res = await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ productId, quantity }),
        });

        if (res.ok) {
          const data = await res.json();
          setCart(data.data);
          await evaluatePolicy(authToken);
          showBanner('success', 'Item added to cart with server-side pricing');
        } else {
          const errData = await res.json();
          showBanner('error', errData.error?.message || 'Failed to add item to cart');
        }
      }
    } catch {
      showBanner('error', 'Network error connecting to cart service');
    } finally {
      setIsLoading(false);
    }
  };

  // Add All Proposed Recipe Items to Cart
  const handleAddAllToCart = async (itemsToAdd: Array<{ productId: string; quantity: number }>) => {
    if (!authToken || itemsToAdd.length === 0) return;
    setIsLoading(true);
    try {
      for (const item of itemsToAdd) {
        await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(item),
        });
      }

      const cartRes = await fetch(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (cartRes.ok) {
        const cData = await cartRes.json();
        setCart(cData.data);
        await evaluatePolicy(authToken);
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
    setIsLoading(true);
    try {
      if (authToken) {
        const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ quantity }),
        });

        if (res.ok) {
          const data = await res.json();
          setCart(data.data);
          await evaluatePolicy(authToken);
        } else {
          const errData = await res.json();
          showBanner('error', errData.error?.message || 'Update failed');
        }
      }
    } catch {
      showBanner('error', 'Network error updating cart item');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Item
  const handleRemoveItem = async (productId: string) => {
    setIsLoading(true);
    try {
      if (authToken) {
        const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCart(data.data);
          await evaluatePolicy(authToken);
          showBanner('success', 'Item removed from cart');
        }
      }
    } catch {
      showBanner('error', 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Cart
  const handleClearCart = async () => {
    setIsLoading(true);
    try {
      if (authToken) {
        const res = await fetch(`${API_BASE}/cart`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCart(data.data);
          await evaluatePolicy(authToken);
          showBanner('success', 'Cart cleared successfully');
        }
      }
    } catch {
      showBanner('error', 'Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Approve Pending Purchase Proposal
  const handleApproveProposal = async (approvalId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        await evaluatePolicy(authToken);
        showBanner('success', 'Cryptographic approval recorded. Proceeding to checkout...');
        // Auto-trigger checkout now that approval is locked
        await handleInitiateCheckout();
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Approval recording failed');
      }
    } catch {
      showBanner('error', 'Network error recording approval');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject Purchase Proposal
  const handleRejectProposal = async (approvalId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: 'Rejected by customer' }),
      });

      if (res.ok) {
        await evaluatePolicy(authToken);
        showBanner('error', 'Purchase proposal rejected');
      }
    } catch {
      showBanner('error', 'Network error rejecting proposal');
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate Checkout & Inventory Reservation
  const handleInitiateCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      showBanner('error', 'Cart is empty. Please add items before checking out.');
      return;
    }

    if (currentLamp.status === 'stop') {
      showBanner('error', 'Order blocked by hard mandate cap. Please adjust cart.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        const { order, razorpay } = data.data;

        setActivePaymentOrder({ order, razorpay });
        setIsCartDrawerOpen(false);

        // Append assistant message with PaymentCard
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

        // If approval is required, display the ApprovalCard
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
    if (!activePaymentOrder) return;
    setIsLoading(true);

    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
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
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (cartRes.ok) {
          const cData = await cartRes.json();
          setCart(cData.data);
        }

        await evaluatePolicy(authToken);
        await fetchAuditVerification(authToken);

        // Add confirmed order to list
        setOrders((prev) => [confirmedOrder, ...prev]);

        // Append assistant confirmation messages
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-order-${Date.now()}`,
            sender: 'agent',
            content: `🎉 Payment verified successfully! Order ${confirmedOrder.orderNumber} is confirmed. Stock has been permanently deducted from the catalog.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cardType: 'order',
            cardData: confirmedOrder,
          },
          {
            id: `msg-proof-${Date.now()}`,
            sender: 'agent',
            content: 'Cryptographic audit ledger record appended to hash-chain:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cardType: 'proof',
            cardData: {
              orderNumber: confirmedOrder.orderNumber,
              cartVersion: cart?.version,
              totalPaise: confirmedOrder.pricingSnapshot.totalPaise,
              gatewayOrderId: razorpay.orderId,
            },
          },
        ]);

        showBanner('success', 'Payment verified! Order confirmed.');
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

  // Simulate Tampered Signature Attack
  const handleSimulateTamperedSignature = async () => {
    if (!activePaymentOrder) return;
    setIsLoading(true);

    try {
      const { order, razorpay } = activePaymentOrder;
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
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
        await evaluatePolicy(authToken);
        await fetchAuditVerification(authToken);

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
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/simulate-step`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updatedOrder = data.data;

        setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));

        // Update card in chat messages
        setMessages((prev) =>
          prev.map((m) =>
            m.cardType === 'order' && (m.cardData as OrderData)?._id === orderId
              ? { ...m, cardData: updatedOrder }
              : m
          )
        );

        showBanner('success', `Order fulfillment advanced to ${updatedOrder.status}`);
      } else {
        const errData = await res.json();
        showBanner('error', errData.error?.message || 'Could not advance fulfillment');
      }
    } catch {
      showBanner('error', 'Network error stepping fulfillment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle incoming conversational user messages
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const lower = text.toLowerCase();

    // Direct local shortcuts for checkout
    if (lower === 'checkout' || lower === 'proceed to checkout' || lower === 'pay') {
      handleInitiateCheckout();
      return;
    }

    setIsLoading(true);

    try {
      let sessionId = activeChatSessionId;
      if (!sessionId && authToken) {
        const createRes = await fetch(`${API_BASE}/chat/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ title: 'CartPilot Shopping Session' }),
        });
        if (createRes.ok) {
          const sData = await createRes.json();
          sessionId = sData.data._id;
          setActiveChatSessionId(sessionId);
        }
      }

      if (sessionId && authToken) {
        const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
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
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (cartRes.ok) {
              const cData = await cartRes.json();
              setCart(cData.data);
              await evaluatePolicy(authToken);
            }
          }
        } else {
          const errData = await res.json();
          showBanner('error', errData.error?.message || 'Failed to get agent response');
        }
      } else {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-${Date.now()}`,
              sender: 'agent',
              content: 'Please ensure you are connected to the backend API to query the AI agent.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }, 300);
      }
    } catch (err) {
      console.warn('Network error sending message to chat agent:', err);
      showBanner('error', 'Network error connecting to AI agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-acc selection:text-white">
      {/* Living animated background blobs */}
      <LivingBackground />

      {/* Global Header */}
      <Header
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
        cart={cart}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        lampStatus={currentLamp.status}
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col relative z-10">
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
                    isUser
                      ? 'bg-acc shadow-blue-500/20'
                      : 'bg-gradient-to-tr from-emerald-600 to-blue-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble + Embedded Card */}
                <div
                  className={`flex flex-col gap-2 max-w-[88%] sm:max-w-[80%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Text bubble */}
                  {msg.content && (
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-acc text-white rounded-tr-none shadow-md shadow-blue-500/10'
                          : 'glass-panel text-ink rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                      <span
                        className={`block text-[10px] mt-1 ${
                          isUser ? 'text-blue-100 text-right' : 'text-mut'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  )}

                  {/* Sandboxed Tool Execution Badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {msg.toolCalls.map((tc, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper/90 border border-brd text-[11px] font-mono text-ink shadow-sm"
                        >
                          <span className="text-acc font-bold">⚡ tool:</span>
                          <span className="font-semibold text-ink">{tc.toolName}</span>
                          {tc.durationMs !== undefined && (
                            <span className="text-mut text-[10px]">({tc.durationMs}ms)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Embedded Interactive Card Registry */}
                  {msg.cardType === 'rules' && (
                    <div className="w-full mt-1">
                      <RulesCard
                        rules={
                          mandate || {
                            maxOrderAmountPaise: 60000,
                            dailyBudgetPaise: 150000,
                            requireExplicitApproval: false,
                          }
                        }
                        currentCartTotalPaise={cart?.pricing.totalPaise || 0}
                      />
                    </div>
                  )}

                  {msg.cardType === 'items' && (
                    <div className="w-full mt-1">
                      <ItemsCard
                        cardData={
                          (msg.cardData as Product[] | ProposalPayload) || catalog.slice(0, 4)
                        }
                        onAddToCart={handleAddToCart}
                        onAddAllToCart={handleAddAllToCart}
                      />
                    </div>
                  )}

                  {msg.cardType === 'cart' && cart && (
                    <div className="w-full mt-1">
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
                    </div>
                  )}

                  {msg.cardType === 'approval' && (
                    <div className="w-full mt-1">
                      {(() => {
                        const aData = msg.cardData as {
                          cartTotal?: string;
                          reason?: string;
                          cartVersion?: number;
                          approvalId?: string;
                          approvalHash?: string;
                          approvalStatus?: string;
                        };
                        return (
                          <ApprovalCard
                            cartTotal={aData?.cartTotal || cart?.pricing.formatted.total || '₹0.00'}
                            reason={aData?.reason || currentLamp.reasonText}
                            cartVersion={aData?.cartVersion || cart?.version || 1}
                            approvalHash={aData?.approvalHash}
                            status={aData?.approvalStatus || 'PENDING'}
                            onApprove={() =>
                              handleApproveProposal(
                                aData?.approvalId || policyEval?.approvalId || ''
                              )
                            }
                            onReject={() =>
                              handleRejectProposal(
                                aData?.approvalId || policyEval?.approvalId || ''
                              )
                            }
                            isLoading={isLoading}
                          />
                        );
                      })()}
                    </div>
                  )}

                  {msg.cardType === 'payment' && Boolean(msg.cardData) && (
                    <div className="w-full mt-1">
                      {(() => {
                        const pData = msg.cardData as PaymentOrderState;
                        return (
                          <PaymentCard
                            orderId={pData.order._id}
                            orderNumber={pData.order.orderNumber}
                            razorpayOrderId={pData.razorpay.orderId}
                            amountPaise={pData.razorpay.amountPaise}
                            onVerifySuccess={handleVerifyPaymentSuccess}
                            onVerifyFail={handleSimulateTamperedSignature}
                            isLoading={isLoading}
                          />
                        );
                      })()}
                    </div>
                  )}

                  {msg.cardType === 'order' && Boolean(msg.cardData) && (
                    <div className="w-full mt-1">
                      <OrderCard
                        order={msg.cardData as OrderData}
                        onAdvanceFulfillment={handleAdvanceFulfillment}
                        isLoading={isLoading}
                      />
                    </div>
                  )}

                  {msg.cardType === 'proof' && (
                    <div className="w-full mt-1">
                      {(() => {
                        const prData = msg.cardData as {
                          orderNumber?: string;
                          cartVersion?: number;
                          totalPaise?: number;
                          gatewayOrderId?: string;
                        };
                        return (
                          <ProofCard
                            orderNumber={prData?.orderNumber}
                            cartVersion={prData?.cartVersion || cart?.version}
                            totalPaise={prData?.totalPaise || cart?.pricing.totalPaise}
                            gatewayOrderId={prData?.gatewayOrderId}
                            chainVerification={chainVerification || undefined}
                            recentEvents={recentAuditEvents}
                            onVerify={() => fetchAuditVerification(authToken)}
                            isVerifying={isVerifyingChain}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer Input at bottom */}
        <div className="sticky bottom-3 z-30 pt-2">
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
    </div>
  );
}

export default App;
