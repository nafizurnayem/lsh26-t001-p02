import type { LucideIcon } from "lucide-react";
import type { ExpiryStatus } from "../features/inventory/types";

interface StatusCardProps {
  status: ExpiryStatus;
  label: string;
  helper: string;
  count: number;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

const styles: Record<ExpiryStatus, { card: string; icon: string; count: string }> = {
  expired: {
    card: "border-rose-400/40 bg-gradient-to-br from-[#17213c] to-rose-950/35",
    icon: "bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/20",
    count: "text-rose-400",
  },
  expiring_30: {
    card: "border-amber-400/40 bg-gradient-to-br from-[#17213c] to-amber-950/35",
    icon: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20",
    count: "text-amber-400",
  },
  expiring_90: {
    card: "border-blue-400/40 bg-gradient-to-br from-[#17213c] to-blue-950/35",
    icon: "bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/20",
    count: "text-blue-400",
  },
  safe: {
    card: "border-emerald-400/40 bg-gradient-to-br from-[#17213c] to-emerald-950/30",
    icon: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20",
    count: "text-emerald-400",
  },
};

export function StatusCard({
  status,
  label,
  helper,
  count,
  icon: Icon,
  active,
  onClick,
}: StatusCardProps) {
  const style = styles[status];
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`group min-h-[142px] w-full rounded-[22px] border p-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.26)] active:scale-[0.985] ${style.card} ${active ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#050b1d]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-100">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${style.icon}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <p className={`tabular-nums text-4xl font-extrabold tracking-[-0.05em] ${style.count}`}>
          {count}
        </p>
        <p className="pb-1 text-xs font-semibold text-slate-400">items</p>
      </div>
    </button>
  );
}
