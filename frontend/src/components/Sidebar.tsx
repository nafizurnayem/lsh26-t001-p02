import {
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Pill,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";

export type PageView = "dashboard" | "returned";
export type QuickAction = "expired" | "expiring_30";

export interface StockRequirements {
  totalMedicines: number;
  hasRequiredFields: boolean;
  hasExpired: boolean;
  hasExpiringSoon: boolean;
  hasSafeForYear: boolean;
}

interface SidebarProps {
  view: PageView;
  onViewChange: (view: PageView) => void;
  onQuickAction: (action: QuickAction) => void;
  requirements: StockRequirements | null;
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { id: "dashboard" as const, label: "Expiry inventory", icon: LayoutDashboard },
  { id: "returned" as const, label: "Returned stock", icon: RotateCcw },
];

const quickLinks = [
  { action: "expired" as const, label: "Expired stock", icon: TriangleAlert },
  { action: "expiring_30" as const, label: "Expiring soon", icon: Clock3 },
];

export function Sidebar({
  view,
  onViewChange,
  onQuickAction,
  requirements,
  open,
  onClose,
}: SidebarProps) {
  const checks = requirements
    ? [
        { label: "40+ medicines", passed: requirements.totalMedicines >= 40 },
        { label: "Required fields", passed: requirements.hasRequiredFields },
        { label: "Expired samples", passed: requirements.hasExpired },
        { label: "Expiring soon", passed: requirements.hasExpiringSoon },
        { label: "Safe for 1 year", passed: requirements.hasSafeForYear },
      ]
    : [];
  const passedCount = checks.filter((check) => check.passed).length;

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-[#20304e] bg-[#061224] px-4 py-5 shadow-[12px_0_45px_rgba(0,0,0,0.24)] transition-transform duration-200 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 flex h-11 items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_24px_rgba(34,211,238,0.28)]">
              <Pill size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[15px] font-bold tracking-[-0.02em] text-white">ShelfSure</p>
              <p className="text-xs text-slate-500">Pharmacy monitor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-white/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Main menu
        </p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                onViewChange(id);
                onClose();
              }}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${view === id ? "bg-cyan-400/12 text-cyan-300 ring-1 ring-inset ring-cyan-400/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Monitor
        </p>
        <div className="space-y-1">
          {quickLinks.map(({ action, label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                onQuickAction(action);
                onClose();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-white/5 hover:text-slate-100"
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-auto rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-4">
          <div className="flex items-center justify-between gap-3 text-cyan-300">
            <div className="flex items-center gap-2">
            <ShieldCheck size={19} />
              <p className="text-sm font-bold">Requirement check</p>
            </div>
            <span className="tabular-nums rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-cyan-400/20">
              {requirements ? `${passedCount}/5` : "…"}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {requirements ? (
              checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">{check.label}</span>
                  <CheckCircle2
                    size={14}
                    className={check.passed ? "text-emerald-400" : "text-rose-400"}
                    aria-label={check.passed ? "Passed" : "Not passed"}
                  />
                </div>
              ))
            ) : (
              <div className="space-y-2" aria-label="Loading requirement check">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-3 animate-pulse rounded bg-white/5" />
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-cyan-400/10 pt-3 text-[11px] font-semibold text-emerald-300">
            {requirements?.totalMedicines ?? "—"} total stock records
          </div>
        </div>
      </aside>
    </>
  );
}
