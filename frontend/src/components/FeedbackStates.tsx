import { Inbox, RefreshCw, ServerOff } from "lucide-react";

export function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[142px] animate-pulse rounded-[22px] border border-[#2a3a5a] bg-[#111b35] p-5">
          <div className="h-3 w-24 rounded bg-[#2a3a5a]" />
          <div className="mt-7 h-9 w-16 rounded bg-[#2a3a5a]" />
        </div>
      ))}
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="space-y-2" aria-label="Loading medicines">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[62px] animate-pulse rounded-xl bg-[#172340]" />
      ))}
    </div>
  );
}

export function EmptyState({ returned = false }: { returned?: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[#3a4c6d] bg-[#0a142a]/70 p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#172340] text-slate-400 shadow-sm">
          <Inbox size={21} />
        </span>
        <h3 className="mt-4 font-bold text-slate-100">
          {returned ? "No returned stock yet" : "No medicines found"}
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
          {returned
            ? "Batches marked as returned will appear here with their return date."
            : "Try clearing the search or selecting a different expiry group."}
        </p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-rose-400/30 bg-rose-950/20 p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-400/10 text-rose-400 shadow-sm">
          <ServerOff size={21} />
        </span>
        <h3 className="mt-4 font-bold text-slate-100">Could not load pharmacy stock</h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">{message}</p>
        <button
          onClick={onRetry}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-bold text-white transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98]"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    </div>
  );
}
