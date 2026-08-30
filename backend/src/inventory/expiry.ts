import type { ExpiryStatus } from "./types.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseCalendarDate(value: string): number {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

export function getDhakaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function daysUntil(expiryDate: string, today: string): number {
  const millisecondsPerDay = 86_400_000;
  return Math.round(
    (parseCalendarDate(expiryDate) - parseCalendarDate(today)) /
      millisecondsPerDay,
  );
}

export function classifyExpiry(daysLeft: number): ExpiryStatus {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring_30";
  if (daysLeft <= 90) return "expiring_90";
  return "safe";
}
