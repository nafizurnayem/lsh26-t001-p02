import { CalendarClock, RotateCcw } from "lucide-react";
import {
  formatDate,
  formatDateTime,
  formatDaysLeft,
  formatTaka,
} from "../features/inventory/formatters";
import type { Medicine } from "../features/inventory/types";
import { StatusBadge } from "./StatusBadge";

interface MedicineTableProps {
  medicines: Medicine[];
  returned?: boolean;
  returningId?: string | null;
  onReturn?: (medicine: Medicine) => void;
}

const rowStyles = {
  expired: "bg-rose-400/[0.07] hover:bg-rose-400/[0.12]",
  expiring_30: "bg-amber-400/[0.07] hover:bg-amber-400/[0.12]",
  expiring_90: "bg-blue-400/[0.07] hover:bg-blue-400/[0.12]",
  safe: "bg-emerald-400/[0.06] hover:bg-emerald-400/[0.11]",
};

export function MedicineTable({
  medicines,
  returned = false,
  returningId,
  onReturn,
}: MedicineTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-1.5 text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-2">Medicine</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2">Stock value</th>
              <th className="px-3 py-2">Expiry</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">{returned ? "Returned on" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine) => (
              <tr
                key={medicine.id}
                className={`text-sm text-slate-300 transition-colors duration-150 ${rowStyles[medicine.status]}`}
              >
                <td className="rounded-l-xl px-4 py-3">
                  <p className="font-bold text-slate-100">{medicine.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{medicine.company}</p>
                </td>
                <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-400">
                  {medicine.batch}
                </td>
                <td className="tabular-nums px-3 py-3 font-semibold">{medicine.quantity}</td>
                <td className="tabular-nums px-3 py-3">{formatTaka(medicine.unit_price_bdt)}</td>
                <td className="tabular-nums px-3 py-3 font-bold text-slate-100">
                  {formatTaka(medicine.stock_value_bdt)}
                </td>
                <td className="px-3 py-3">
                  <p className="font-semibold text-slate-200">{formatDate(medicine.expiry_date)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDaysLeft(medicine.days_left)}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={medicine.status} />
                </td>
                <td className="rounded-r-xl px-3 py-3">
                  {returned ? (
                    <span className="text-xs font-semibold text-slate-400">
                      {formatDateTime(medicine.returned_at)}
                    </span>
                  ) : (
                    <button
                      onClick={() => onReturn?.(medicine)}
                      disabled={returningId === medicine.id}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#334565] bg-[#0a142a] px-3 text-xs font-bold text-slate-300 shadow-sm transition-[transform,background-color,border-color] duration-150 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-300 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
                    >
                      <RotateCcw size={15} className={returningId === medicine.id ? "animate-spin" : ""} />
                      {returningId === medicine.id ? "Returning" : "Return"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {medicines.map((medicine) => (
          <article
            key={medicine.id}
            className={`rounded-2xl border border-[#2a3a5a] p-4 ${rowStyles[medicine.status]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-slate-100">{medicine.name}</h3>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {medicine.company} · {medicine.batch}
                </p>
              </div>
              <StatusBadge status={medicine.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Quantity</p>
                <p className="tabular-nums mt-1 font-bold text-slate-200">{medicine.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Stock value</p>
                <p className="tabular-nums mt-1 font-bold text-slate-100">
                  {formatTaka(medicine.stock_value_bdt)}
                </p>
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-xl bg-[#0a142a]/80 px-3 py-2.5 ring-1 ring-[#2a3a5a]">
                <CalendarClock size={16} className="text-slate-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {formatDate(medicine.expiry_date)}
                  </p>
                  <p className="text-[11px] text-slate-500">{formatDaysLeft(medicine.days_left)}</p>
                </div>
              </div>
            </div>
            {returned ? (
              <p className="mt-3 text-xs font-semibold text-slate-400">
                Returned {formatDateTime(medicine.returned_at)}
              </p>
            ) : (
              <button
                onClick={() => onReturn?.(medicine)}
                disabled={returningId === medicine.id}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400/10 text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/20 transition-[transform,background-color] duration-150 hover:bg-cyan-400/15 active:scale-[0.98] disabled:opacity-60"
              >
                <RotateCcw size={16} />
                {returningId === medicine.id ? "Returning…" : "Mark as returned"}
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
