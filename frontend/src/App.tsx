import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EmptyState, ErrorState, LoadingCards, TableLoading } from "./components/FeedbackStates";
import { MedicineTable } from "./components/MedicineTable";
import { RiskCard } from "./components/RiskCard";
import {
  type PageView,
  type QuickAction,
  Sidebar,
  type StockRequirements,
} from "./components/Sidebar";
import { StatusCard } from "./components/StatusCard";
import { Toast, type ToastMessage } from "./components/Toast";
import { getDashboard, getMedicines, getReturns, markReturned } from "./features/inventory/api";
import { formatDate, statusLabels } from "./features/inventory/formatters";
import type { Dashboard, ExpiryStatus, Medicine } from "./features/inventory/types";

const statusCards = [
  { status: "expired" as const, label: "Expired stock", helper: "Past the expiry date", icon: AlertTriangle },
  { status: "expiring_30" as const, label: "Expiring soon", helper: "0–30 days remaining", icon: Clock3 },
  { status: "expiring_90" as const, label: "Watch list", helper: "31–90 days remaining", icon: CalendarDays },
  { status: "safe" as const, label: "Safe stock", helper: "More than 90 days", icon: ShieldCheck },
];

export default function App() {
  const [view, setView] = useState<PageView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [returned, setReturned] = useState<Medicine[]>([]);
  const [requirements, setRequirements] = useState<StockRequirements | null>(null);
  const [status, setStatus] = useState<ExpiryStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const loadSummaryAndReturns = useCallback(async () => {
    const [nextDashboard, nextReturns, allActive] = await Promise.all([
      getDashboard(),
      getReturns(),
      getMedicines(),
    ]);
    const allMedicines = [...allActive.medicines, ...nextReturns.medicines];
    setDashboard(nextDashboard);
    setReturned(nextReturns.medicines);
    setRequirements({
      totalMedicines: allMedicines.length,
      hasRequiredFields: allMedicines.every(
        (medicine) =>
          medicine.name.trim().length > 0 &&
          medicine.batch.trim().length > 0 &&
          Number.isFinite(medicine.quantity) &&
          medicine.expiry_date.length > 0,
      ),
      hasExpired: allMedicines.some((medicine) => medicine.status === "expired"),
      hasExpiringSoon: allMedicines.some((medicine) => medicine.status === "expiring_30"),
      hasSafeForYear: allMedicines.some((medicine) => medicine.days_left >= 365),
    });
  }, []);

  const loadActiveList = useCallback(async (showLoader = true) => {
    if (showLoader) setListLoading(true);
    try {
      const response = await getMedicines({ status, search });
      setMedicines(response.medicines);
    } finally {
      if (showLoader) setListLoading(false);
    }
  }, [status, search]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadSummaryAndReturns(), loadActiveList(false)]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected server error.");
    } finally {
      setLoading(false);
    }
  }, [loadActiveList, loadSummaryAndReturns]);

  useEffect(() => {
    void loadAll();
    // The filter-specific effect below handles subsequent status/search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    setError(null);
    void loadActiveList().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Could not filter stock.");
    });
  }, [status, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setStatus(undefined);
    setSearchInput("");
    setSearch("");
  };

  const handleQuickAction = (action: QuickAction) => {
    setView("dashboard");

    setStatus(action);
    window.setTimeout(() => {
      document.getElementById("inventory-table")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const handleReturn = async () => {
    if (!selectedMedicine) return;
    setReturningId(selectedMedicine.id);
    try {
      await markReturned(selectedMedicine.id);
      setSelectedMedicine(null);
      await Promise.all([loadSummaryAndReturns(), loadActiveList(false)]);
      setToast({
        type: "success",
        text: `${selectedMedicine.name} (${selectedMedicine.batch}) moved to Returned stock.`,
      });
    } catch (returnError) {
      setToast({
        type: "error",
        text: returnError instanceof Error ? returnError.message : "Could not return this batch.",
      });
    } finally {
      setReturningId(null);
    }
  };

  const filteredLabel = useMemo(
    () => (status ? statusLabels[status] : "All active stock"),
    [status],
  );

  const mainError = error && !dashboard;

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <Sidebar
        view={view}
        onViewChange={setView}
        onQuickAction={handleQuickAction}
        requirements={requirements}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-20 border-b border-[#243250] bg-[#071325]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#2a3a5a] bg-[#111b35] text-slate-300 shadow-sm lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search medicine or company…"
                aria-label="Search medicine or company"
                className="h-11 w-full rounded-xl border border-[#2a3a5a] bg-[#111b35] pl-11 pr-10 text-sm text-slate-100 shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:flex">
                <span className={`size-2 rounded-full ${dashboard ? "bg-emerald-500" : "bg-slate-300"}`} />
                {dashboard ? "System online" : "Connecting"}
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                RX
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-400">
                Shelf intelligence
              </p>
              <h1 className="text-balance text-3xl font-extrabold tracking-[-0.045em] text-white lg:text-4xl">
                {view === "dashboard" ? "Expiry management" : "Returned stock"}
              </h1>
              <p className="mt-2 text-pretty text-sm text-slate-400">
                {view === "dashboard"
                  ? "Find at-risk batches early and protect the pharmacy from avoidable loss."
                  : "A clear audit trail of medicine batches sent back to distributors."}
              </p>
            </div>
            {dashboard && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CalendarDays size={16} /> As of {formatDate(dashboard.as_of_date)}
              </div>
            )}
          </div>

          {mainError ? (
            <ErrorState message={error} onRetry={() => void loadAll()} />
          ) : view === "dashboard" ? (
            <>
              {loading || !dashboard ? (
                <LoadingCards />
              ) : (
                <section aria-label="Expiry group summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {statusCards.map((card) => (
                    <StatusCard
                      key={card.status}
                      {...card}
                      count={dashboard.counts[card.status]}
                      active={status === card.status}
                      onClick={() => setStatus((current) => (current === card.status ? undefined : card.status))}
                    />
                  ))}
                </section>
              )}

              {dashboard && (
                <section
                  id="risk-summary"
                  aria-label="Value at risk"
                  className="mt-4 grid scroll-mt-24 gap-4 md:grid-cols-3"
                >
                  <RiskCard
                    label="Expired value"
                    value={dashboard.values.expired_bdt}
                    helper="Purchase value already exposed to loss"
                    icon={AlertTriangle}
                    tone="rose"
                  />
                  <RiskCard
                    label="Expiring soon value"
                    value={dashboard.values.expiring_soon_bdt}
                    helper="Only stock with 0–30 days remaining"
                    icon={Clock3}
                    tone="amber"
                  />
                  <RiskCard
                    label="Total value at risk"
                    value={dashboard.values.total_at_risk_bdt}
                    helper="Expired plus the within-30-day group"
                    icon={CircleDollarSign}
                    tone="teal"
                  />
                </section>
              )}

              <section
                id="inventory-table"
                className="mt-6 scroll-mt-24 rounded-[24px] border border-[#2a3a5a] bg-[#111b35]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-5"
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold tracking-[-0.025em] text-white">
                        Expiry management inventory
                      </h2>
                      {dashboard && (
                        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300 ring-1 ring-cyan-400/20">
                          {medicines.length}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{filteredLabel}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative sm:hidden">
                      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search medicine or company…"
                        className="h-11 w-full rounded-xl border border-[#2a3a5a] bg-[#0a142a] pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                      />
                    </div>
                    {(status || searchInput) && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#334565] px-4 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        <X size={16} /> Clear filters
                      </button>
                    )}
                    <button
                      onClick={() => void loadAll()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(6,182,212,0.22)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98]"
                    >
                      <RefreshCw size={16} /> Refresh
                    </button>
                  </div>
                </div>

                {error ? (
                  <ErrorState message={error} onRetry={() => void loadAll()} />
                ) : listLoading || loading ? (
                  <TableLoading />
                ) : medicines.length === 0 ? (
                  <EmptyState />
                ) : (
                  <MedicineTable
                    medicines={medicines}
                    returningId={returningId}
                    onReturn={setSelectedMedicine}
                  />
                )}
              </section>
            </>
          ) : (
            <section className="rounded-[24px] border border-[#2a3a5a] bg-[#111b35]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-5">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold tracking-[-0.025em] text-white">Returned batches</h2>
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                      {returned.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Removed from all active counts and value totals</p>
                </div>
                <button
                  onClick={() => setView("dashboard")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-bold text-white transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  View active stock <ArrowRight size={16} />
                </button>
              </div>
              {loading ? <TableLoading /> : returned.length ? <MedicineTable medicines={returned} returned /> : <EmptyState returned />}
            </section>
          )}
        </div>
      </main>

      <ConfirmDialog
        medicine={selectedMedicine}
        busy={Boolean(returningId)}
        onClose={() => !returningId && setSelectedMedicine(null)}
        onConfirm={() => void handleReturn()}
      />
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
