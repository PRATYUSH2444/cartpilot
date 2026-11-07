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
  isActive?: boolean;
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

export interface OrderLine {
  variantId?: string;
  productId: string;
  name: string;
  packageSize: number;
  packageUnit: string;
  unitPricePaise: number;
  quantity: number;
  subtotalPaise: number;
  category?: string;
}

export interface PricingBreakdown {
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise?: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  freeDeliveryThresholdPaise?: number;
  formatted: {
    subtotal: string;
    deliveryFee: string;
    platformFee?: string;
    tax: string;
    discount: string;
    total: string;
    freeDeliveryThreshold?: string;
  };
}

export interface CartDeliveryEstimate {
  prepMinutes: number;
  travelMinutes: number;
  totalDeliveryMinutes: number;
  workloadPreset: string;
  orderAcceptanceMode: string;
  formattedEta: string;
}

export interface CartData {
  id: string;
  userId: string;
  version: number;
  items: PopulatedCartItem[];
  pricing: PricingBreakdown;
  itemCount: number;
  deliveryNote?: string;
  deliveryEstimate?: CartDeliveryEstimate;
}

export interface MandateData {
  _id: string;
  userId: string;
  version: number;
  maxOrderAmountPaise: number; // e.g. 60,000 paise (₹600)
  dailyBudgetPaise: number; // e.g. 150,000 paise (₹1,500)
  autoApproveUpToPaise?: number;
  perOrderCapPaise?: number;
  dailyCapPaise?: number;
  allowedMerchantIds?: string[];
  blockedCategories: string[];
  requireExplicitApproval: boolean;
  isActive: boolean;
}

export interface MandatePreset {
  key: string;
  name: string;
  tagline: string;
  description: string;
  autoApproveUpToPaise: number;
  perOrderCapPaise: number;
  dailyCapPaise: number;
  icon: string;
  isDefault?: boolean;
}

export interface PolicyRemedy {
  id: string;
  label: string;
  effect: string;
  action: 'RAISE_CAP' | 'ENABLE_AGENT' | 'REMOVE_OPTIONAL_ITEMS' | 'ORDER_LATER' | 'REDUCE_QTY';
}

export type MandateRules = Partial<MandateData> & {
  maxOrderAmountPaise: number;
  dailyBudgetPaise: number;
  requireExplicitApproval?: boolean;
};

export interface PolicyEvaluation {
  outcome: 'ALLOW' | 'NEEDS_HUMAN_APPROVAL' | 'NEEDS_APPROVAL' | 'DENY';
  reasonCode: string;
  explanation: string;
  dailyBudgetPaise: number;
  todaySpentPaise: number;
  cartTotalPaise: number;
  maxOrderAmountPaise: number;
  dailyCapPaise?: number;
  perOrderCapPaise?: number;
  autoApproveUpToPaise?: number;
  requiresApproval: boolean;
  approvalId?: string;
  approvalHash?: string;
  approvalStatus?: string;
  remedies?: PolicyRemedy[];
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
  _id?: string;
  hash?: string;
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
  merchantId?: string;
  status:
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'CONFIRMED'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'PACKING'
    | 'PACKED'
    | 'READY_FOR_HANDOVER'
    | 'OUT_FOR_DELIVERY'
    | 'DISPATCHED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'FAILED';
  items: OrderLine[];
  itemsSnapshot?: OrderLine[];
  pricingSnapshot: {
    subtotalPaise: number;
    deliveryFeePaise: number;
    platformFeePaise?: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
    freeDeliveryThresholdPaise?: number;
  };
  shippingAddressSnapshot: {
    name?: string;
    phone?: string;
    email?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  deliveryNote?: string;
  approvalSnapshot?: {
    approvalId: string;
    approvalHash: string;
  };
  reservationId?: string;
  paymentId?: string;
  paymentStatus?: string;
  paymentDetails?: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    method?: string;
  };
  placedAt?: string;
  createdAt?: string;
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

export interface RecipeItemExplain {
  matchMethod: 'DIRECT_EXACT' | 'DIRECT_ALIAS' | 'NORMALIZED_KEYWORD' | 'CATEGORY_FALLBACK';
  confidenceScore: number;
  matchedAlias?: string;
  leftoverPackGrams?: number;
  leftoverPackCostPaise?: number;
  ingredientSource: 'FRESH_GREENS' | 'DESI_KIRANA' | 'STANDARD_CATALOG';
  fssaiCertified: boolean;
}

export interface RecipeBudgetComparison {
  budgetPaise: number;
  subtotalPaise: number;
  totalPaise: number;
  freeDeliveryThresholdPaise?: number;
  isOverBudget: boolean;
  differencePaise: number;
}

export interface OrderProofBundle {
  orderId: string;
  orderNumber: string;
  status: string;
  placedAt: string;
  canonicalSnapshotHash: string;
  policyDecision: string;
  reasonCode: string;
  mandateVersion: number;
  approvalSnapshot?: { approvalId: string; approvalHash: string } | null;
  pricingSnapshot: {
    subtotalPaise: number;
    deliveryFeePaise: number;
    taxPaise: number;
    discountPaise: number;
    totalPaise: number;
  freeDeliveryThresholdPaise?: number;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  auditSequenceRange: {
    start: number;
    end: number;
    eventCount: number;
  };
  auditEvents: Array<{
    sequenceNumber: number;
    eventType: string;
    currentHash: string;
    previousHash: string;
    timestamp: string;
  }>;
}

export interface ProofVerificationResult {
  valid: boolean;
  orderNumber: string;
  checks: {
    orderContentsMatch: {
      passed: boolean;
      label: string;
      description: string;
    };
    approvalBinding: {
      passed: boolean;
      label: string;
      description: string;
    };
    auditChainIntact: {
      passed: boolean;
      label: string;
      description: string;
    };
  };
  canonicalSnapshotHash: string;
  totalAuditEventsVerified: number;
  message: string;
}


export type UserGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type AddressType = 'HOME' | 'WORK' | 'OTHER';

export interface INotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface UserAddress {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  houseFlat: string;
  apartmentStreet: string;
  areaLocality: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isServiceable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: UserGender;
  dietaryPreferences: string[];
  notificationPreferences: INotificationPreferences;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  defaultAddress?: UserAddress | null;
  createdAt: string;
}

export interface ServiceabilityInfo {
  isServiceable: boolean;
  pincode: string;
  estimatedMinutes: number;
  deliveryFeePaise: number;
  freeDeliveryThresholdPaise: number;
  message: string;
}
