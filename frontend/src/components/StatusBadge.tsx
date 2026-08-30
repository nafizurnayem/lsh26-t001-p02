import { Circle } from "lucide-react";
import { statusLabels } from "../features/inventory/formatters";
import type { ExpiryStatus } from "../features/inventory/types";

const badgeStyles: Record<ExpiryStatus, string> = {
  expired: "bg-rose-400/15 text-rose-300 ring-rose-400/25",
  expiring_30: "bg-amber-400/15 text-amber-300 ring-amber-400/25",
  expiring_90: "bg-blue-400/15 text-blue-300 ring-blue-400/25",
  safe: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/25",
};

export function StatusBadge({ status }: { status: ExpiryStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${badgeStyles[status]}`}
    >
      <Circle size={7} fill="currentColor" strokeWidth={0} />
      {statusLabels[status]}
    </span>
  );
}
