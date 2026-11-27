import { describe, it, expect } from 'vitest';
import {
  DELIVERY_SLOTS,
  getNextDayDeliveryDate,
  formatFullDeliverySlot,
} from './deliverySlots';

describe('deliverySlots', () => {
  it('defines Morning (6-10 AM) and Evening (5-9 PM) slots', () => {
    expect(DELIVERY_SLOTS).toHaveLength(2);
    expect(DELIVERY_SLOTS[0]).toMatchObject({
      id: 'morning',
      label: 'Morning Delivery',
      timeRange: '6:00 AM – 10:00 AM',
    });
    expect(DELIVERY_SLOTS[1]).toMatchObject({
      id: 'evening',
      label: 'Evening Delivery',
      timeRange: '5:00 PM – 9:00 PM',
    });
  });

  it('computes next-day date in IST', () => {
    // Fixed timestamp: 2026-11-27T12:00:00Z
    const testDate = new Date('2026-11-27T12:00:00Z');
    const nextDay = getNextDayDeliveryDate(testDate);

    expect(nextDay.formattedDate).toContain('Tomorrow');
    expect(nextDay.isoDateString).toBe('2026-11-28');
  });

  it('formats full delivery slot strings without 12:00 PM', () => {
    const testDate = new Date('2026-11-27T12:00:00Z');
    const morningFormatted = formatFullDeliverySlot('morning', testDate);
    const eveningFormatted = formatFullDeliverySlot('evening', testDate);

    expect(morningFormatted).toContain('6:00 AM – 10:00 AM');
    expect(morningFormatted).not.toContain('12:00 PM');
    expect(eveningFormatted).toContain('5:00 PM – 9:00 PM');
  });
});
