import { describe, it, expect } from 'vitest';
import { validateAndComputeCoupon, OFFICIAL_COUPONS } from './couponConfig';

describe('couponConfig', () => {
  it('contains exactly two official coupons', () => {
    expect(OFFICIAL_COUPONS).toHaveLength(2);
    expect(OFFICIAL_COUPONS.map((c) => c.code)).toEqual(['WELCOME', 'FRESH50']);
  });

  describe('WELCOME coupon', () => {
    it('applies flat ₹100 discount when cart >= ₹300 on first order', () => {
      const res = validateAndComputeCoupon('WELCOME', 350, true);
      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(100);
      expect(res.coupon?.code).toBe('WELCOME');
    });

    it('rejects when cart < ₹300', () => {
      const res = validateAndComputeCoupon('WELCOME', 200, true);
      expect(res.isValid).toBe(false);
      expect(res.discountAmount).toBe(0);
      expect(res.reason).toContain('Add ₹100 more');
    });

    it('rejects on repeat orders', () => {
      const res = validateAndComputeCoupon('WELCOME', 500, false);
      expect(res.isValid).toBe(false);
      expect(res.discountAmount).toBe(0);
      expect(res.reason).toContain('first order only');
    });
  });

  describe('FRESH50 coupon', () => {
    it('applies flat ₹50 discount when cart >= ₹399', () => {
      const res = validateAndComputeCoupon('FRESH50', 450, false);
      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(50);
    });

    it('rejects when cart < ₹399', () => {
      const res = validateAndComputeCoupon('FRESH50', 300, true);
      expect(res.isValid).toBe(false);
      expect(res.discountAmount).toBe(0);
      expect(res.reason).toContain('Add ₹99 more');
    });
  });

  it('rejects invalid coupon codes', () => {
    const res = validateAndComputeCoupon('INVALID_CODE', 1000, true);
    expect(res.isValid).toBe(false);
    expect(res.discountAmount).toBe(0);
    expect(res.reason).toContain('does not exist');
  });

  it('handles lowercase input cleanly', () => {
    const res = validateAndComputeCoupon('fresh50', 500, false);
    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(50);
  });
});
