import { describe, it, expect } from 'vitest';
import {
  formatPaise,
  calculateOptimisticPricing,
  updateCartOptimistically,
} from './optimisticCart';
import { PopulatedCartItem } from '../types';

describe('Optimistic Cart & Pricing Engine', () => {
  it('correctly formats paise to rupees', () => {
    expect(formatPaise(0)).toBe('₹0.00');
    expect(formatPaise(4000)).toBe('₹40.00');
    expect(formatPaise(50000)).toBe('₹500.00');
    expect(formatPaise(12345)).toBe('₹123.45');
  });

  it('calculates pricing with 5% GST and delivery fee under ₹500', () => {
    const items: PopulatedCartItem[] = [
      {
        productId: 'prod-1',
        name: 'Organic Tomatoes',
        slug: 'organic-tomatoes',
        category: 'VEGETABLES',
        pricePaise: 4000, // ₹40
        packageSize: 1,
        packageUnit: 'kg',
        availableStock: 20,
        quantity: 2,
        itemTotalPaise: 8000, // ₹80
        formattedItemTotal: '₹80.00',
      },
    ];

    const pricing = calculateOptimisticPricing(items);
    expect(pricing.subtotalPaise).toBe(8000); // ₹80
    expect(pricing.deliveryFeePaise).toBe(4000); // ₹40 delivery fee
    expect(pricing.taxPaise).toBe(400); // 5% of ₹80 = ₹4
    expect(pricing.totalPaise).toBe(8000 + 4000 + 400); // ₹124 = 12400 paise
    expect(pricing.formatted.total).toBe('₹124.00');
  });

  it('applies free delivery when subtotal is at or above ₹500 (50,000 paise)', () => {
    const items: PopulatedCartItem[] = [
      {
        productId: 'prod-1',
        name: 'Basmati Rice',
        slug: 'basmati-rice',
        category: 'GRAINS',
        pricePaise: 60000, // ₹600
        packageSize: 5,
        packageUnit: 'kg',
        availableStock: 10,
        quantity: 1,
        itemTotalPaise: 60000,
        formattedItemTotal: '₹600.00',
      },
    ];

    const pricing = calculateOptimisticPricing(items);
    expect(pricing.subtotalPaise).toBe(60000);
    expect(pricing.deliveryFeePaise).toBe(0); // Free delivery!
    expect(pricing.taxPaise).toBe(3000); // 5% of 60000 = 3000
    expect(pricing.totalPaise).toBe(63000); // ₹630.00
    expect(pricing.formatted.deliveryFee).toBe('₹0.00');
  });

  it('adds an item to an initially empty cart optimistically', () => {
    const product = {
      _id: 'prod-apple',
      name: 'Shimla Apples',
      pricePaise: 15000, // ₹150
      availableStock: 15,
      packageSize: 1,
      packageUnit: 'kg',
    };

    const cart = updateCartOptimistically(null, product, 2, 'user-123');

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('prod-apple');
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[0].itemTotalPaise).toBe(30000);
    expect(cart.itemCount).toBe(2);
    expect(cart.pricing.subtotalPaise).toBe(30000);
    expect(cart.version).toBe(1);
  });

  it('increments quantity and updates totals in existing cart', () => {
    const initialProduct = {
      _id: 'prod-apple',
      name: 'Shimla Apples',
      pricePaise: 15000,
      availableStock: 15,
    };
    const cart1 = updateCartOptimistically(null, initialProduct, 1);
    expect(cart1.itemCount).toBe(1);

    const cart2 = updateCartOptimistically(cart1, initialProduct, 3);
    expect(cart2.items[0].quantity).toBe(3);
    expect(cart2.itemCount).toBe(3);
    expect(cart2.items[0].itemTotalPaise).toBe(45000);
    expect(cart2.version).toBe(2);
  });

  it('removes item completely when quantity is set to 0', () => {
    const prod1 = { _id: 'prod-1', name: 'Item 1', pricePaise: 1000, availableStock: 5 };
    const prod2 = { _id: 'prod-2', name: 'Item 2', pricePaise: 2000, availableStock: 5 };

    let cart = updateCartOptimistically(null, prod1, 2);
    cart = updateCartOptimistically(cart, prod2, 1);
    expect(cart.items).toHaveLength(2);
    expect(cart.itemCount).toBe(3);

    // Remove prod1
    cart = updateCartOptimistically(cart, prod1, 0);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('prod-2');
    expect(cart.itemCount).toBe(1);
    expect(cart.pricing.subtotalPaise).toBe(2000);
  });

  it('clamps quantity to available stock', () => {
    const prod = { _id: 'prod-milk', name: 'Cow Milk', pricePaise: 6800, availableStock: 4 };

    const cart = updateCartOptimistically(null, prod, 10);
    expect(cart.items[0].quantity).toBe(4); // Clamped to 4
    expect(cart.itemCount).toBe(4);
    expect(cart.items[0].itemTotalPaise).toBe(27200);
  });
});
