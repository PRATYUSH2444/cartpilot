import { useState, useEffect } from 'react';

export interface LiveClockState {
  greeting: 'Good morning' | 'Good afternoon' | 'Good evening' | 'Welcome back';
  formattedDate: string; // e.g. "Today, 7 Nov 2026"
  formattedTime: string; // e.g. "4:15 PM"
  hour: number;
  rawDate: Date;
}

/**
 * Real-time clock and timezone-aware greeting hook.
 * Computes hours and dates strictly according to the specified store timezone (defaults to Asia/Kolkata).
 * Automatically updates every 5 seconds so midnight rollovers and 12:00 PM / 5:00 PM greeting
 * boundaries transition dynamically without requiring a page refresh.
 */
export function useLiveClock(timezone: string = 'Asia/Kolkata'): LiveClockState {
  const [clock, setClock] = useState<LiveClockState>(() => getClockState(new Date(), timezone));

  useEffect(() => {
    // Initial evaluation
    setClock(getClockState(new Date(), timezone));

    const interval = setInterval(() => {
      setClock(getClockState(new Date(), timezone));
    }, 5000);

    return () => clearInterval(interval);
  }, [timezone]);

  return clock;
}

function getClockState(now: Date, timezone: string): LiveClockState {
  // Extract parts in the specified timezone
  let hour = now.getHours();
  try {
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const parsedHour = parseInt(hourFormatter.format(now), 10);
    if (!isNaN(parsedHour)) {
      hour = parsedHour;
    }
  } catch {
    hour = now.getHours();
  }

  // Authoritative greeting rules:
  // 05:00–11:59: Good morning
  // 12:00–16:59: Good afternoon
  // 17:00–20:59: Good evening
  // 21:00–04:59: Welcome back
  let greeting: LiveClockState['greeting'] = 'Good morning';
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening';
  } else {
    greeting = 'Welcome back';
  }

  // Format date: "Today, 7 Nov 2026"
  let formattedDate = '';
  try {
    const dayFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    formattedDate = `Today, ${dayFormatter.format(now)}`;
  } catch {
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    formattedDate = `Today, ${day} ${month} ${year}`;
  }

  // Format time: "4:15 PM"
  let formattedTime = '';
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    formattedTime = timeFormatter.format(now);
  } catch {
    formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return {
    greeting,
    formattedDate,
    formattedTime,
    hour,
    rawDate: now,
  };
}
