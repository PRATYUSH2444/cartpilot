export interface DeliveryWindowInfo {
  title: string;          // e.g. "Delivery tomorrow"
  slot: string;           // e.g. "6AM – 9AM"
  cutoffHeadline: string; // e.g. "Order Till Midnight"
  cutoffSubline: string;  // e.g. "Get next day DELIVERY"
  remainingText: string;  // e.g. "Order within 3 hrs 15 mins"
  isLateNight: boolean;
}

export function getDeliveryWindowInfo(date: Date = new Date()): DeliveryWindowInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // If time is between midnight (00:00) and 6:00 AM
  if (hours >= 0 && hours < 6) {
    const remainingMinutes = (6 - hours) * 60 - minutes;
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remMins = remainingMinutes % 60;

    return {
      title: 'Delivery today',
      slot: '7AM – 9AM',
      cutoffHeadline: 'Order Till 6 AM',
      cutoffSubline: 'Get morning DELIVERY',
      remainingText: `Order within ${remainingHours}h ${remMins}m for morning delivery`,
      isLateNight: true,
    };
  }

  // Regular hours (6:00 AM to 23:59 PM): cutoff is midnight for tomorrow morning
  const remainingMinutes = (24 - hours) * 60 - minutes;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remMins = remainingMinutes % 60;

  return {
    title: 'Delivery tomorrow',
    slot: '6AM – 9AM',
    cutoffHeadline: 'Order Till Midnight',
    cutoffSubline: 'Get next day DELIVERY',
    remainingText: `Order within ${remainingHours}h ${remMins}m for tomorrow morning delivery`,
    isLateNight: false,
  };
}
