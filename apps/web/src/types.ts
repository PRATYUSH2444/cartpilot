export type LampStatus = 'none' | 'go' | 'ask' | 'stop';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricePaise: number;
  packageSize: number;
  packageUnit: string;
  availableStock: number;
  aliases: string[];
  isVegetarian: boolean;
  imageUrl?: string;
}

export interface PopulatedCartItem {
  productId: string;
  name: string;
  slug: string;
  category: string;
  pricePaise: number;
  packageSize: number;
  packageUnit: string;
  availableStock: number;
  imageUrl?: string;
  quantity: number;
  itemTotalPaise: number;
  formattedItemTotal: string;
}

export interface PricingBreakdown {
  subtotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  formatted: {
    subtotal: string;
    deliveryFee: string;
    tax: string;
    discount: string;
    total: string;
  };
}

export interface CartData {
  id: string;
  userId: string;
  version: number;
  items: PopulatedCartItem[];
  pricing: PricingBreakdown;
  itemCount: number;
}

export interface MandateData {
  _id: string;
  userId: string;
  version: number;
  maxOrderAmountPaise: number; // e.g. 60,000 paise (₹600)
  dailyBudgetPaise: number; // e.g. 150,000 paise (₹1,500)
  allowedMerchantIds?: string[];
  blockedCategories: string[];
  requireExplicitApproval: boolean;
  isActive: boolean;
}

export type MandateRules = Partial<MandateData> & {
  maxOrderAmountPaise: number;
  dailyBudgetPaise: number;
  requireExplicitApproval?: boolean;
};

export interface PolicyEvaluation {
  outcome: 'ALLOW' | 'NEEDS_HUMAN_APPROVAL' | 'DENY';
  reasonCode: string;
  explanation: string;
  dailyBudgetPaise: number;
  todaySpentPaise: number;
  cartTotalPaise: number;
  maxOrderAmountPaise: number;
  requiresApproval: boolean;
  approvalId?: string;
  approvalHash?: string;
  approvalStatus?: string;
}

export interface ApprovalData {
  _id: string;
  userId: string;
  cartId: string;
  cartVersion: number;
  mandateVersion: number;
  calculatedTotalPaise: number;
  approvalHash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'INVALIDATED';
  expiresAt: string;
  decidedAt?: string;
  rejectionReason?: string;
}

export interface AuditEvent {
  sequenceNumber: number;
  timestamp: string;
  eventType: string;
  actorId: string;
  actorRole: string;
  resourceId: string;
  resourceType: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  previousHash: string;
  currentHash: string;
}

export interface ChainVerification {
  valid: boolean;
  totalEvents: number;
  compromisedAtSequence?: number;
  message: string;
  latestHash?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  category: string;
  unitPricePaise: number;
  quantity: number;
  subtotalPaise: number;
  packageSize: number;
  packageUnit: string;
}

export interface OrderData {
  _id: string;
  orderNumber: string;
  userId: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'CONFIRMED'
    | 'PACKING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'FAILED';
  items: OrderItemSnapshot[];
  pricingSnapshot: {
    subtotalPaise: number;
    deliveryFeePaise: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
  };
  shippingAddressSnapshot: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  approvalSnapshot?: {
    approvalId: string;
    approvalHash: string;
  };
  reservationId?: string;
  paymentId?: string;
  placedAt: string;
  deliveredAt?: string;
}

export interface ToolCallItem {
  toolName: string;
  arguments: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCallItem[];
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: unknown;
}

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
