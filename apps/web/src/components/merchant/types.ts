import { Product, OrderData } from '../../types';

export type MerchantTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'categories'
  | 'fulfilment'
  | 'customers'
  | 'analytics'
  | 'finance'
  | 'marketing'
  | 'store-profile'
  | 'delivery-settings'
  | 'staff'
  | 'notifications'
  | 'security'
  | 'support';

export interface MerchantStoreData {
  _id: string;
  businessName: string;
  slug: string;
  email: string;
  phone: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  serviceAreaPincodes?: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  suspensionReason?: string;
  isVegetarianCertified?: boolean;
  isActive: boolean;
  rating?: number;
}

export interface StaffMemberData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role?: string;
  permissions: string[];
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpendPaise: number;
  lastOrderDate: string;
  status: 'Active' | 'VIP' | 'New';
  address?: string;
}

export interface TransactionRecord {
  id: string;
  date: string;
  transactionId: string;
  orderId: string;
  type: 'Order Payment' | 'Platform Fee' | 'Refund' | 'Settlement';
  amountPaise: number;
  isCredit: boolean;
  status: 'Success' | 'Processed' | 'Pending';
}

export interface CouponRecord {
  id: string;
  code: string;
  discountPercent: number;
  minOrderPaise: number;
  maxDiscountPaise: number;
  validUntil: string;
  usageCount: number;
  isActive: boolean;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  isActive: boolean;
  iconName: string;
  subcategories: string[];
}

export interface StockAdjustmentEntry {
  productId: string;
  productName: string;
  sku: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
  timestamp: string;
}

export type { Product, OrderData };
