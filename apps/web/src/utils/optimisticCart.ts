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
 * Guarantees zero duplicate rows and strict monotonic state consistency.
 */
export function updateCartOptimistically(
  prevCart: CartData | null,
  product: MinimalProductInfo,
  targetQuantity: number,
  userId: string = 'shopper'
): CartData {
  const productId = product._id || product.productId || '';
  if (!productId && prevCart) return prevCart;

  // 1. Normalize and deduplicate existing items by productId
  const itemsMap = new Map<string, PopulatedCartItem>();
  for (const it of prevCart?.items || []) {
    const pId = it.productId;
    if (!pId) continue;
    if (itemsMap.has(pId)) {
      const existing = itemsMap.get(pId)!;
      existing.quantity += it.quantity;
      existing.itemTotalPaise += it.itemTotalPaise || existing.pricePaise * it.quantity;
      existing.formattedItemTotal = formatPaise(existing.itemTotalPaise);
    } else {
      itemsMap.set(pId, { ...it });
    }
  }

  // 2. Clamp target quantity against available stock (if specified)
  const stockLimit = product.availableStock ?? 999;
  const clampedQuantity = Math.max(0, Math.min(targetQuantity, stockLimit));

  // 3. Apply target quantity
  if (clampedQuantity <= 0) {
    itemsMap.delete(productId);
  } else if (itemsMap.has(productId)) {
    const existing = itemsMap.get(productId)!;
    existing.quantity = clampedQuantity;
    existing.itemTotalPaise = existing.pricePaise * clampedQuantity;
    existing.formattedItemTotal = formatPaise(existing.itemTotalPaise);
  } else {
    const pricePaise = product.pricePaise ?? 0;
    const itemTotalPaise = pricePaise * clampedQuantity;
    itemsMap.set(productId, {
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
    });
  }

  const updatedItems = Array.from(itemsMap.values());
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
