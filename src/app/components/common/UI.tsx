import { ReactNode } from "react";

export function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{title}</h2>
      <p className="text-[var(--sk-faint)] text-xs sm:text-sm">{sub}</p>
    </div>
  );
}

export function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--sk-card)] rounded-2xl p-5 border border-[var(--sk-border)] overflow-hidden">
      {children}
    </div>
  );
}

export function KpiBox({ label, value, bar, barPct, trend, green }: {
  label: string;
  value: string;
  bar?: boolean;
  barPct?: number;
  trend?: string;
  green?: boolean;
}) {
  return (
    <div className="bg-[var(--sk-card2)] rounded-xl p-4 border border-[var(--sk-border)]">
      <div className="text-[var(--sk-muted)] text-xs mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${green ? "text-green-400" : "text-[var(--sk-text)]"}`}>{value}</div>
      {bar && (
        <div className="mt-2 bg-white/10 rounded-full h-1.5">
          <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(barPct || 0, 100)}%` }} />
        </div>
      )}
      {trend && <div className="text-xs text-[var(--sk-faint)] mt-1">{trend}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Received: "bg-green-400/15 text-green-400",
    Pending: "bg-amber-400/15 text-amber-400",
    Partial: "bg-blue-400/15 text-blue-400",
    Expense: "bg-red-400/15 text-red-400",
    Yield: "bg-teal-400/15 text-teal-400",
    Sale: "bg-green-400/15 text-green-400",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg[status] || "bg-white/10 text-white/60"}`}>{status}</span>;
}

export function InputGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--sk-muted)] font-semibold">{label}</label>
      {children}
    </div>
  );
}

export const inputCls = "bg-[var(--sk-card2)] border border-[var(--sk-border2)] rounded-lg px-3 py-2 text-[var(--sk-text)] text-sm outline-none focus:border-green-400/60 transition-colors w-full placeholder:text-[var(--sk-dim)]";
export const selectCls = inputCls;
export const btnPrimary = "bg-green-500 hover:bg-green-400 text-[#0f1221] font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5";
export const btnSecondary = "bg-[var(--sk-hover)] hover:bg-[var(--sk-hover2)] text-[var(--sk-muted)] font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-[var(--sk-border2)] flex items-center gap-1.5";

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="flex-1 relative min-w-[150px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-faint)]">🔍</span>
      <input
        className="bg-[var(--sk-card2)] border border-[var(--sk-border2)] rounded-lg px-3 py-2 pl-9 text-[var(--sk-text)] text-sm outline-none focus:border-green-400/60 transition-colors w-full placeholder:text-[var(--sk-dim)]"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${checked ? "bg-green-500" : "bg-[var(--sk-card2)] border border-[var(--sk-border2)]"}`}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ left: 2, transform: checked ? "translateX(24px)" : "translateX(0px)" }}
      />
    </button>
  );
}
