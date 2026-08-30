import { CheckCircle2, X, XCircle } from "lucide-react";

export interface ToastMessage {
  type: "success" | "error";
  text: string;
}

export function Toast({ message, onClose }: { message: ToastMessage | null; onClose: () => void }) {
  if (!message) return null;
  const success = message.type === "success";
  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-2xl border bg-[#111b35] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.4)] ${success ? "border-emerald-400/35" : "border-rose-400/35"}`}
    >
      {success ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
      )}
      <p className="max-w-sm text-sm font-semibold leading-5 text-slate-200">{message.text}</p>
      <button
        onClick={onClose}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200"
        aria-label="Dismiss message"
      >
        <X size={16} />
      </button>
    </div>
  );
}
