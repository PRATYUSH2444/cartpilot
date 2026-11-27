/**
 * couponConfig.ts
 * Authoritative definitions for the exactly two allowed coupons in CartPilot.
 * Rule: Exactly two coupons exist, defined in this single configuration.
 */

export interface CouponDefinition {
  code: string;
  title: string;
  description: string;
  discountType: 'FLAT' | 'PERCENT';
  discountAmount: number;   // In Rupees
  minCartValue: number;     // In Rupees
  firstOrderOnly: boolean;
  badge?: string;
}

export const OFFICIAL_COUPONS: CouponDefinition[] = [
  {
    code: 'WELCOME',
    title: 'Welcome First Order Bonus',
    description: 'Flat ₹100 OFF on your first grocery basket of ₹300 or more.',
    discountType: 'FLAT',
    discountAmount: 100,
    minCartValue: 300,
    firstOrderOnly: true,
    badge: 'FIRST ORDER',
  },
  {
    code: 'FRESH50',
    title: 'Everyday Fresh Savings',
    description: 'Flat ₹50 OFF on orders above ₹399 across all groceries.',
    discountType: 'FLAT',
    discountAmount: 50,
    minCartValue: 399,
    firstOrderOnly: false,
    badge: 'POPULAR',
  },
];

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: CouponDefinition;
  discountAmount: number;
  reason?: string;
}

/**
 * Pure coupon validation and discount computation.
 * Validates eligibility (min order value, first-order restriction) and computes discount.
 */
export function validateAndComputeCoupon(
  code: string,
  itemsTotalRupees: number,
  isFirstOrder: boolean = true
): CouponValidationResult {
  const cleanCode = code.trim().toUpperCase();
  const coupon = OFFICIAL_COUPONS.find((c) => c.code === cleanCode);

  if (!coupon) {
    return {
      isValid: false,
      discountAmount: 0,
      reason: `Coupon '${cleanCode}' does not exist. Available coupons: WELCOME, FRESH50`,
    };
  }

  if (coupon.firstOrderOnly && !isFirstOrder) {
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      reason: `Coupon '${coupon.code}' is valid on your first order only.`,
    };
  }

  if (itemsTotalRupees < coupon.minCartValue) {
    const shortfall = Math.ceil(coupon.minCartValue - itemsTotalRupees);
    return {
      isValid: false,
      coupon,
      discountAmount: 0,
      reason: `Add ₹${shortfall} more to use '${coupon.code}' (min order ₹${coupon.minCartValue}).`,
    };
  }

  const discount = Math.min(itemsTotalRupees, coupon.discountAmount);

  return {
    isValid: true,
    coupon,
    discountAmount: discount,
  };
}
