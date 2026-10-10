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

export interface MandateRules {
  maxOrderAmountPaise: number; // e.g. 60,000 paise (₹600)
  dailyBudgetPaise: number; // e.g. 150,000 paise (₹1,500)
  requireExplicitApproval: boolean;
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
  reservationId?: string;
  paymentId?: string;
  placedAt: string;
  deliveredAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: unknown;
}
