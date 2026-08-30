import type { LucideIcon } from "lucide-react";
import { formatTaka } from "../features/inventory/formatters";

interface RiskCardProps {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  tone: "rose" | "amber" | "teal";
}

const tones = {
  rose: "bg-rose-400/15 text-rose-300 ring-1 ring-rose-400/20",
  amber: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20",
  teal: "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20",
};

export function RiskCard({ label, value, helper, icon: Icon, tone }: RiskCardProps) {
  return (
    <div className="rounded-2xl border border-[#2a3a5a] bg-[#111b35]/90 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-400">{label}</p>
          <p className="tabular-nums mt-0.5 truncate text-xl font-extrabold tracking-[-0.03em] text-white">
            {formatTaka(value)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">{helper}</p>
    </div>
  );
}
