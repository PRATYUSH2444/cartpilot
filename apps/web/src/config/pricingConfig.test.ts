import { describe, it, expect } from 'vitest';
import { computePricing, PRICING_CONFIG, CartItemData } from './pricingConfig';

describe('computePricing', () => {
  const mockItems: CartItemData[] = [
    {
      productId: 'p1',
      name: 'Eggless Pav',
      unitLabel: '6 pcs',
      price: 35,
      mrp: 45,
      qty: 2,
      image: '',
    },
    {
      productId: 'p2',
      name: 'Cow Milk',
      unitLabel: '1 L',
      price: 68,
      mrp: 75,
      qty: 1,
      image: '',
    },
  ];

  it('calculates totals correctly when below free delivery threshold', () => {
    // itemsTotal = 35 * 2 + 68 * 1 = 70 + 68 = 138
    // itemCount = 2 + 1 = 3
    // subtotal = 138
    // deliveryFee = 40 (below 500)
    // platformFee = 5
    // total = 138 + 40 + 5 = 183
    // remainingForFree = 500 - 138 = 362
    // progressPct = Math.round((138 / 500) * 100) = 28%
    const pricing = computePricing({ items: mockItems });

    expect(pricing.itemsTotal).toBe(138);
    expect(pricing.itemCount).toBe(3);
    expect(pricing.subtotal).toBe(138);
    expect(pricing.deliveryFee).toBe(40);
    expect(pricing.platformFee).toBe(5);
    expect(pricing.total).toBe(183);
    expect(pricing.remainingForFree).toBe(362);
    expect(pricing.progressPct).toBe(28);
    // MRP savings: (45-35)*2 + (75-68)*1 = 20 + 7 = 27
    expect(pricing.savings).toBe(27);
  });

  it('unlocks free delivery when subtotal meets or exceeds threshold', () => {
    const qualifyingItems: CartItemData[] = [
      {
        productId: 'p1',
        name: 'Organic Basmati Rice',
        unitLabel: '5 kg',
        price: 520,
        qty: 1,
        image: '',
      },
    ];

    const pricing = computePricing({ items: qualifyingItems });

    expect(pricing.itemsTotal).toBe(520);
    expect(pricing.subtotal).toBe(520);
    expect(pricing.deliveryFee).toBe(0);
    expect(pricing.platformFee).toBe(5);
    expect(pricing.total).toBe(525);
    expect(pricing.remainingForFree).toBe(0);
    expect(pricing.progressPct).toBe(100);
  });

  it('applies coupon discount correctly and adjusts subtotal and total', () => {
    // Items total = 138, coupon discount = 50 -> subtotal = 88
    // deliveryFee = 40, platformFee = 5 -> total = 88 + 40 + 5 = 133
    const pricing = computePricing({
      items: mockItems,
      couponDiscount: 50,
    });

    expect(pricing.couponDiscount).toBe(50);
    expect(pricing.subtotal).toBe(88);
    expect(pricing.deliveryFee).toBe(40);
    expect(pricing.total).toBe(133);
    expect(pricing.savings).toBe(27 + 50); // MRP savings + coupon discount
  });

  it('handles empty cart gracefully', () => {
    const pricing = computePricing({ items: [] });

    expect(pricing.itemsTotal).toBe(0);
    expect(pricing.itemCount).toBe(0);
    expect(pricing.subtotal).toBe(0);
    expect(pricing.deliveryFee).toBe(0);
    expect(pricing.platformFee).toBe(0);
    expect(pricing.total).toBe(0);
    expect(pricing.remainingForFree).toBe(PRICING_CONFIG.freeDeliveryThreshold);
  });
});
