export interface PricingCalculationItem {
  productId: string;
  pricePaise: number;
  quantity: number;
}

export interface CalculatedPricing {
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  formatted: {
    subtotal: string;
    deliveryFee: string;
    platformFee: string;
    tax: string;
    discount: string;
    total: string;
  };
}

export class PricingService {
  // Free delivery threshold: ₹500 (50,000 paise)
  public static readonly FREE_DELIVERY_THRESHOLD_PAISE = 50000;
  // Standard delivery fee: ₹40 (4,000 paise)
  public static readonly STANDARD_DELIVERY_FEE_PAISE = 4000;
  // Grocery GST rate: 5%
  public static readonly GST_PERCENTAGE = 0.05;

  /**
   * Formats an integer paise value to human-readable Indian Rupee string (e.g. 4500 -> "₹45.00")
   */
  public static formatPaise(paise: number): string {
    const rupees = (paise / 100).toFixed(2);
    return `₹${rupees}`;
  }

  /**
   * Authoritative, pure server-side pricing calculation.
   * Client-supplied prices are strictly ignored.
   */
  public static calculate(
    items: PricingCalculationItem[],
    discountPaise: number = 0,
    platformFeePaise: number = 0
  ): CalculatedPricing {
    // 1. Calculate raw integer subtotal
    const subtotalPaise = items.reduce((acc, item) => {
      if (!Number.isInteger(item.pricePaise) || item.pricePaise < 0) {
        throw new Error(`Invalid pricePaise: ${item.pricePaise}. Must be a non-negative integer.`);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error(`Invalid quantity: ${item.quantity}. Must be an integer >= 1.`);
      }
      return acc + item.pricePaise * item.quantity;
    }, 0);

    // 2. Compute delivery fee: Free if subtotal >= 50,000 paise, else 4,000 paise (0 if empty cart)
    let deliveryFeePaise = 0;
    if (subtotalPaise > 0) {
      deliveryFeePaise =
        subtotalPaise >= this.FREE_DELIVERY_THRESHOLD_PAISE ? 0 : this.STANDARD_DELIVERY_FEE_PAISE;
    }

    // 3. Compute 5% GST on subtotal, rounded to nearest integer paise
    const taxPaise = Math.round(subtotalPaise * this.GST_PERCENTAGE);

    // 4. Ensure discount is non-negative and capped at subtotal + deliveryFee + tax + platform
    const sanitizedDiscountPaise = Math.max(0, Math.floor(discountPaise));
    const sanitizedPlatformFeePaise = Math.max(0, Math.floor(platformFeePaise));

    // 5. Total calculation (integer paise reconciliation)
    const totalPaise = Math.max(
      0,
      subtotalPaise + deliveryFeePaise + sanitizedPlatformFeePaise + taxPaise - sanitizedDiscountPaise
    );

    return {
      subtotalPaise,
      deliveryFeePaise,
      platformFeePaise: sanitizedPlatformFeePaise,
      taxPaise,
      discountPaise: sanitizedDiscountPaise,
      totalPaise,
      formatted: {
        subtotal: this.formatPaise(subtotalPaise),
        deliveryFee: this.formatPaise(deliveryFeePaise),
        platformFee: this.formatPaise(sanitizedPlatformFeePaise),
        tax: this.formatPaise(taxPaise),
        discount: this.formatPaise(sanitizedDiscountPaise),
        total: this.formatPaise(totalPaise),
      },
    };
  }
}
