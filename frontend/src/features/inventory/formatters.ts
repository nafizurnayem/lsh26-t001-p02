import type { ExpiryStatus } from "./types";

export function formatTaka(value: number): string {
  return `৳${new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year!, month! - 1, day!));
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDaysLeft(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export const statusLabels: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring_30: "Within 30 days",
  expiring_90: "Within 90 days",
  safe: "Safe",
};
