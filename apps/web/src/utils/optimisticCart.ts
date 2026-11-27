import { CartData, PopulatedCartItem, PricingBreakdown } from '../types';

/**
 * Formats integer paise into Indian Rupee display string (e.g. 4500 -> "₹45.00")
 */
export function formatPaise(paise: number): string {
  const rupees = (paise / 100).toFixed(2);
  return `₹${rupees}`;
}

export interface MinimalProductInfo {
  _id?: string;
  productId?: string;
  name?: string;
  slug?: string;
  category?: string;
  pricePaise?: number;
  packageSize?: number;
  packageUnit?: string;
  availableStock?: number;
  imageUrl?: string;
}

/**
 * Calculates authoritative pricing matching server-side rules:
 * - 5% GST on subtotal
 * - Free delivery threshold of ₹500 (50,000 paise), standard delivery ₹40 (4,000 paise)
 * - Safe non-negative integer paise math
 */
export function calculateOptimisticPricing(
  items: PopulatedCartItem[],
  existingPricing?: PricingBreakdown
): PricingBreakdown {
  const subtotalPaise = items.reduce((acc, item) => acc + item.pricePaise * item.quantity, 0);

  const deliveryFeePaise =
    subtotalPaise > 0 ? (subtotalPaise >= 50000 ? 0 : 4000) : 0;
  const platformFeePaise = existingPricing?.platformFeePaise ?? 0;
  const taxPaise = Math.round(subtotalPaise * 0.05);
  const discountPaise = existingPricing?.discountPaise ?? 0;
  const totalPaise = Math.max(
    0,
    subtotalPaise + deliveryFeePaise + platformFeePaise + taxPaise - discountPaise
  );

  return {
    subtotalPaise,
    deliveryFeePaise,
    platformFeePaise,
    taxPaise,
    discountPaise,
    totalPaise,
    freeDeliveryThresholdPaise: 50000,
    formatted: {
      subtotal: formatPaise(subtotalPaise),
      deliveryFee: formatPaise(deliveryFeePaise),
      platformFee: formatPaise(platformFeePaise),
      tax: formatPaise(taxPaise),
      discount: formatPaise(discountPaise),
      total: formatPaise(totalPaise),
      freeDeliveryThreshold: '₹500.00',
    },
  };
}

/**
 * Optimistically applies an item quantity change to the CartData state
 * in the same animation frame, without waiting for the network.
 */
export function updateCartOptimistically(
  prevCart: CartData | null,
  product: MinimalProductInfo,
  targetQuantity: number,
  userId: string = 'shopper'
): CartData {
  const productId = product._id || product.productId || '';
  const currentItems = prevCart?.items ? [...prevCart.items] : [];
  const existingIndex = currentItems.findIndex((item) => item.productId === productId);

  // Clamp target quantity against available stock (if specified)
  const stockLimit = product.availableStock ?? 999;
  const clampedQuantity = Math.max(0, Math.min(targetQuantity, stockLimit));

  let updatedItems: PopulatedCartItem[];

  if (clampedQuantity <= 0) {
    // Remove item if quantity is zero or less
    updatedItems = currentItems.filter((item) => item.productId !== productId);
  } else if (existingIndex > -1) {
    // Update existing item quantity and recalculate item total
    const existing = currentItems[existingIndex];
    const itemTotalPaise = existing.pricePaise * clampedQuantity;
    const updatedItem: PopulatedCartItem = {
      ...existing,
      quantity: clampedQuantity,
      itemTotalPaise,
      formattedItemTotal: formatPaise(itemTotalPaise),
    };
    updatedItems = [
      ...currentItems.slice(0, existingIndex),
      updatedItem,
      ...currentItems.slice(existingIndex + 1),
    ];
  } else {
    // Add new item into cart
    const pricePaise = product.pricePaise ?? 0;
    const itemTotalPaise = pricePaise * clampedQuantity;
    const newItem: PopulatedCartItem = {
      productId,
      name: product.name || 'Fresh Produce',
      slug: product.slug || (product.name || 'produce').toLowerCase().replace(/\s+/g, '-'),
      category: product.category || 'GROCERY',
      pricePaise,
      packageSize: product.packageSize || 1,
      packageUnit: product.packageUnit || 'unit',
      availableStock: stockLimit,
      imageUrl: product.imageUrl,
      quantity: clampedQuantity,
      itemTotalPaise,
      formattedItemTotal: formatPaise(itemTotalPaise),
    };
    updatedItems = [...currentItems, newItem];
  }

  const newPricing = calculateOptimisticPricing(updatedItems, prevCart?.pricing);
  const itemCount = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

  return {
    id: prevCart?.id || 'optimistic-cart',
    userId: prevCart?.userId || userId,
    version: (prevCart?.version ?? 0) + 1,
    items: updatedItems,
    pricing: newPricing,
    itemCount,
    deliveryNote: prevCart?.deliveryNote,
    deliveryEstimate: prevCart?.deliveryEstimate,
  };
}
