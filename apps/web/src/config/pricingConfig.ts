/**
 * pricingConfig.ts
 * Single source of truth for pricing calculations, thresholds, and fee structures across CartPilot.
 */

export interface CartItemData {
  productId: string;
  name: string;
  unitLabel: string;
  price: number; // In Rupees
  mrp?: number;  // In Rupees (used for savings calculation)
  qty: number;
  image: string;
}

export interface PricingConfig {
  freeDeliveryThreshold: number; // e.g. 500 Rupees
  deliveryFee: number;           // e.g. 40 Rupees
  platformFee: number;           // e.g. 5 Rupees
  maxQtyPerItem: number;         // e.g. 10 units max per item
}

export const PRICING_CONFIG: PricingConfig = {
  freeDeliveryThreshold: 500,
  deliveryFee: 40,
  platformFee: 5,
  maxQtyPerItem: 10,
};

export interface PricingResult {
  itemsTotal: number;       // Raw sum of item price * qty
  itemCount: number;        // Total units (sum of qty across all lines)
  couponDiscount: number;   // Calculated discount in Rupees
  subtotal: number;         // itemsTotal - couponDiscount
  deliveryFee: number;      // 0 if subtotal >= freeDeliveryThreshold or empty, else deliveryFee
  platformFee: number;      // 0 if empty cart, else platformFee
  total: number;            // Final payable amount (subtotal + deliveryFee + platformFee)
  remainingForFree: number; // Amount needed to unlock free delivery
  progressPct: number;      // Progress percentage (0 to 100) towards free delivery
  savings: number;          // Total user savings (couponDiscount + MRP discount)
}

/**
 * Pure pricing computation function.
 * Every number displayed on the cart page, header badge, and checkout summary derives from this function.
 */
export function computePricing({
  items,
  couponDiscount = 0,
  config = PRICING_CONFIG,
}: {
  items: CartItemData[];
  couponDiscount?: number;
  config?: PricingConfig;
}): PricingResult {
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const sanitizedCouponDiscount = Math.max(0, Math.min(itemsTotal, couponDiscount));
  const subtotal = Math.max(0, itemsTotal - sanitizedCouponDiscount);

  // Free delivery when subtotal >= freeDeliveryThreshold (40 if below, 0 if empty or threshold met)
  const deliveryFee = itemsTotal === 0 || subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee;
  const platformFee = itemsTotal === 0 ? 0 : config.platformFee;
  const total = subtotal + deliveryFee + platformFee;

  const remainingForFree = Math.max(0, config.freeDeliveryThreshold - subtotal);
  const progressPct =
    config.freeDeliveryThreshold > 0
      ? Math.min(100, Math.round((subtotal / config.freeDeliveryThreshold) * 100))
      : 100;

  // MRP markup savings + coupon discount
  const mrpSavings = items.reduce((sum, i) => {
    const originalPrice = i.mrp && i.mrp > i.price ? i.mrp : i.price;
    return sum + (originalPrice - i.price) * i.qty;
  }, 0);
  const savings = mrpSavings + sanitizedCouponDiscount;

  return {
    itemsTotal,
    itemCount,
    couponDiscount: sanitizedCouponDiscount,
    subtotal,
    deliveryFee,
    platformFee,
    total,
    remainingForFree,
    progressPct,
    savings,
  };
}
