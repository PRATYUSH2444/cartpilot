/**
 * deliverySlots.ts
 * Authoritative, single source of truth for delivery slot definitions & next-day date computation across CartPilot.
 */

export type SlotId = 'morning' | 'evening';

export interface DeliverySlotDefinition {
  id: SlotId;
  label: string;      // "Morning Delivery" | "Evening Delivery"
  timeRange: string;  // "6:00 AM – 10:00 AM" | "5:00 PM – 9:00 PM"
  startHour: number;
  endHour: number;
}

export const DELIVERY_SLOTS: DeliverySlotDefinition[] = [
  {
    id: 'morning',
    label: 'Morning Delivery',
    timeRange: '6:00 AM – 10:00 AM',
    startHour: 6,
    endHour: 10,
  },
  {
    id: 'evening',
    label: 'Evening Delivery',
    timeRange: '5:00 PM – 9:00 PM',
    startHour: 17,
    endHour: 21,
  },
];

/**
 * Computes the real NEXT-DAY delivery date in Indian Standard Time (IST, UTC+5:30).
 * Rule: Every order placed is delivered NEXT DAY. No same-day delivery option.
 */
export function getNextDayDeliveryDate(now: Date = new Date()): {
  date: Date;
  isoDateString: string; // YYYY-MM-DD
  dayOfWeek: string;     // e.g. "Sat"
  dayOfMonth: number;    // e.g. 28
  monthName: string;     // e.g. "Nov"
  formattedDate: string; // e.g. "Tomorrow, Sat 28 Nov"
} {
  // Compute IST timestamp
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffsetMillis = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(utcMillis + istOffsetMillis);

  // Add 1 day for strict NEXT-DAY delivery policy
  const nextDay = new Date(istNow);
  nextDay.setDate(nextDay.getDate() + 1);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayOfWeek = days[nextDay.getDay()];
  const monthName = months[nextDay.getMonth()];
  const dayOfMonth = nextDay.getDate();
  const year = nextDay.getFullYear();
  const monthPadded = String(nextDay.getMonth() + 1).padStart(2, '0');
  const datePadded = String(dayOfMonth).padStart(2, '0');

  return {
    date: nextDay,
    isoDateString: `${year}-${monthPadded}-${datePadded}`,
    dayOfWeek,
    dayOfMonth,
    monthName,
    formattedDate: `Tomorrow, ${dayOfWeek} ${dayOfMonth} ${monthName}`,
  };
}

/**
 * Formats full human-readable delivery slot string:
 * e.g. "Tomorrow, Sat 28 Nov · 6:00 AM – 10:00 AM"
 */
export function formatFullDeliverySlot(slotId: SlotId, now: Date = new Date()): string {
  const slotDef = DELIVERY_SLOTS.find((s) => s.id === slotId) || DELIVERY_SLOTS[0];
  const { formattedDate } = getNextDayDeliveryDate(now);
  return `${formattedDate} · ${slotDef.timeRange}`;
}
