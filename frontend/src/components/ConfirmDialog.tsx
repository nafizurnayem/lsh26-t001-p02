import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import type { Medicine } from "../features/inventory/types";

interface ConfirmDialogProps {
  medicine: Medicine | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ medicine, busy, onConfirm, onClose }: ConfirmDialogProps) {
  useEffect(() => {
    if (!medicine) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [medicine, busy, onClose]);

  if (!medicine) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title"
        className="w-full max-w-md animate-[dialog-in_180ms_ease-out] rounded-[24px] border border-[#334565] bg-[#111b35] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle size={21} />
          </span>
          <button
            onClick={onClose}
            disabled={busy}
            className="grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-white/5 disabled:opacity-50"
            aria-label="Close return confirmation"
          >
            <X size={19} />
          </button>
        </div>
        <h2 id="return-title" className="mt-5 text-xl font-extrabold tracking-[-0.03em] text-white">
          Return this stock batch?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          <strong className="text-slate-100">{medicine.name}</strong>, batch{" "}
          <strong className="font-mono text-slate-100">{medicine.batch}</strong>, will leave all active
          counts and value totals and move to Returned stock.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={busy}
            className="min-h-11 rounded-xl border border-[#334565] px-4 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            Keep active
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="min-h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(6,182,212,0.22)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Returning batch…" : "Yes, mark as returned"}
          </button>
        </div>
      </div>
    </div>
  );
}
