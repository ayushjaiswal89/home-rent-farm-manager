"use client";
import { useState, useMemo, useRef } from "react";
import {
  Home, BarChart2, Building2, Wheat, TrendingUp, HardDrive,
  Settings, Menu, X, Plus, Search, Wifi, WifiOff, Download,
  Upload, Moon, Sun, Bell, ChevronDown, ChevronUp, Trash2,
  MessageCircle, AlertCircle, CheckCircle, Clock, IndianRupee,
  RefreshCw, FileText, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "home" | "dashboard" | "rent" | "farm" | "reports" | "backup" | "settings";

interface HomeExpense {
  id: string; date: string; category: string; note: string; amount: number;
}
interface RentRecord {
  id: string; date: string; tenant: string; month: string;
  whatsapp: string; amount: number; prevReading: number;
  currentReading: number; ratePerUnit: number; units: number;
  lightBill: number; total: number; status: "Received" | "Pending" | "Partial"; note: string;
}
interface FarmRecord {
  id: string; date: string; type: "Expense" | "Yield" | "Sale";
  crop: string; expenseCategory: string; amount: number;
  quantity: number; unit: string; price: number; note: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const INIT_HOME: HomeExpense[] = [
  { id: "h1", date: "2024-06-20", category: "🥦 Grocery", note: "सब्जी और दूध", amount: 1200 },
  { id: "h2", date: "2024-06-18", category: "⚡ Bills", note: "बिजली बिल जून", amount: 2800 },
  { id: "h3", date: "2024-06-15", category: "💊 Medical", note: "दवाई", amount: 650 },
  { id: "h4", date: "2024-06-12", category: "🚗 Transport", note: "पेट्रोल", amount: 900 },
  { id: "h5", date: "2024-06-08", category: "🥦 Grocery", note: "राशन", amount: 3500 },
];

const INIT_RENT: RentRecord[] = [
  { id: "r1", date: "2024-06-01", tenant: "रामेश्वर सिंह", month: "Jun", whatsapp: "9876543210", amount: 8000, prevReading: 520, currentReading: 573, ratePerUnit: 8, units: 53, lightBill: 424, total: 8424, status: "Received", note: "" },
  { id: "r2", date: "2024-06-01", tenant: "मोहन लाल", month: "Jun", whatsapp: "9765432109", amount: 6500, prevReading: 310, currentReading: 348, ratePerUnit: 8, units: 38, lightBill: 304, total: 6804, status: "Pending", note: "देरी से आयेगा" },
  { id: "r3", date: "2024-06-01", tenant: "सुरेश पाल", month: "Jun", whatsapp: "9654321098", amount: 5000, prevReading: 180, currentReading: 214, ratePerUnit: 8, units: 34, lightBill: 272, total: 5272, status: "Partial", note: "आधा दिया" },
];

const INIT_FARM: FarmRecord[] = [
  { id: "f1", date: "2024-06-18", type: "Expense", crop: "Wheat", expenseCategory: "खाद", amount: 3200, quantity: 0, unit: "Kg", price: 0, note: "DAP खाद 2 बोरी" },
  { id: "f2", date: "2024-06-17", type: "Expense", crop: "Rice", expenseCategory: "डीजल", amount: 1800, quantity: 0, unit: "Kg", price: 0, note: "ट्रैक्टर डीजल 20L" },
  { id: "f3", date: "2024-06-15", type: "Sale", crop: "Wheat", expenseCategory: "", amount: 45000, quantity: 30, unit: "Quintal", price: 1500, note: "रामपुर मंडी" },
  { id: "f4", date: "2024-06-13", type: "Expense", crop: "Rice", expenseCategory: "मजदूरी", amount: 5500, quantity: 0, unit: "Kg", price: 0, note: "कटाई मजदूरी" },
  { id: "f5", date: "2024-06-10", type: "Yield", crop: "Mustard", expenseCategory: "", amount: 0, quantity: 6.3, unit: "Quintal", price: 0, note: "सरसों कटाई" },
];

const MONTHLY_TREND = [
  { month: "Jan", rent: 19500, farm: 13000, home: 8200 },
  { month: "Feb", rent: 19500, farm: 17000, home: 9100 },
  { month: "Mar", rent: 20000, farm: 40000, home: 7800 },
  { month: "Apr", rent: 20000, farm: 26000, home: 8900 },
  { month: "May", rent: 20500, farm: 17000, home: 9500 },
  { month: "Jun", rent: 20500, farm: 34500, home: 9050 },
];

// ─── Utils ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
const fmtNum = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(title: string, headers: string[], rows: (string | number)[][]) {
  const ths = headers.map(h => `<th>${h}</th>`).join("");
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h2 { color: #166534; margin-bottom: 4px; }
    p { color: #666; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #166534; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h2>Smart Khaata — ${title}</h2>
  <p>Generated: ${new Date().toLocaleString("hi-IN")}</p>
  <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const w = window.open("", "_blank", "width=900,height=600");
  if (!w) { alert("Popup blocked. Please allow popups for PDF download."); return; }
  w.document.write(html);
  w.document.close();
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function KpiBox({ label, value, bar, barPct, trend, green }: {
  label: string; value: string; bar?: boolean; barPct?: number;
  trend?: string; green?: boolean;
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

function StatusBadge({ status }: { status: string }) {
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

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-[var(--sk-faint)] text-sm mt-0.5">{sub}</p>
    </div>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-[var(--sk-card)] rounded-2xl p-5 border border-[var(--sk-border)]">{children}</div>;
}

function InputGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[var(--sk-muted)] font-semibold">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "bg-[var(--sk-card2)] border border-[var(--sk-border2)] rounded-lg px-3 py-2 text-[var(--sk-text)] text-sm outline-none focus:border-green-400/60 transition-colors w-full placeholder:text-[var(--sk-dim)]";
const selectCls = inputCls;
const btnPrimary = "bg-green-500 hover:bg-green-400 text-[#0f1221] font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5";
const btnSecondary = "bg-[var(--sk-hover)] hover:bg-[var(--sk-hover2)] text-[var(--sk-muted)] font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-[var(--sk-border2)] flex items-center gap-1.5";

// ─── Home Section ─────────────────────────────────────────────────────────────

function HomeSection({ records, setRecords }: {
  records: HomeExpense[]; setRecords: (r: HomeExpense[]) => void;
}) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], category: "🥦 Grocery", note: "", amount: "" });
  const [search, setSearch] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setRecords([{ id: `h${Date.now()}`, ...form, amount: Number(form.amount) }, ...records]);
    setForm(f => ({ ...f, note: "", amount: "" }));
  };

  const del = (id: string) => setRecords(records.filter(r => r.id !== id));

  const filtered = records.filter(r =>
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    r.note.toLowerCase().includes(search.toLowerCase())
  );

  const monthTotal = records.reduce((s, r) => s + r.amount, 0);
  const dailyAvg = records.length ? monthTotal / 30 : 0;
  const topCat = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);
  const topCatName = Object.entries(topCat).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const categories = ["🥦 Grocery", "⚡ Bills", "💊 Medical", "🚗 Transport", "🎓 Education", "🧾 Other"];

  return (
    <div>
      <SectionHeader title="🏠 Home Expenses" sub="घर के खर्च जोड़ें, कैटेगरी के हिसाब से ट्रैक करें।" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <FormCard>
          <form onSubmit={add} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="तारीख">
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </InputGroup>
              <InputGroup label="कैटेगरी">
                <select className={selectCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="राशि (₹)">
                <input type="number" className={inputCls} placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </InputGroup>
              <InputGroup label="विवरण">
                <input type="text" className={inputCls} placeholder="दूध, सब्जी, बिजली बिल..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </InputGroup>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className={btnPrimary}><Plus size={14} />खर्च जोड़ें</button>
              <button type="button" className={btnSecondary} onClick={() => setRecords([])}>सूची साफ़ करें</button>
            </div>
          </form>
        </FormCard>

        {/* KPI + List */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KpiBox label="इस माह कुल खर्च 💰" value={fmt(monthTotal)} bar barPct={(monthTotal / 20000) * 100} />
            <KpiBox label="दैनिक औसत 📈" value={fmt(dailyAvg)} trend="↑ 8% from last week" />
            <KpiBox label="सबसे बड़ी कैटेगरी ⭐" value={topCatName.split(" ")[0] || "—"} />
          </div>

          <FormCard>
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="flex-1 relative min-w-[150px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-faint)]" />
                <input className={inputCls + " pl-8"} placeholder="खोजें (कैटेगरी/विवरण)" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className={btnSecondary + " text-xs"} onClick={() => downloadCSV(
                  "home-expenses.csv",
                  ["तारीख","कैटेगरी","विवरण","राशि (₹)"],
                  filtered.map(r => [r.date, r.category, r.note, r.amount])
                )}><Download size={13} />CSV</button>
              <button className={btnSecondary + " text-xs"} onClick={() => downloadPDF(
                  "Home Expenses",
                  ["तारीख","कैटेगरी","विवरण","राशि (₹)"],
                  filtered.map(r => [r.date, r.category, r.note, fmt(r.amount)])
                )}><FileText size={13} />PDF</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)] text-xs">
                    <th className="text-left py-2 pr-3 font-semibold">तारीख</th>
                    <th className="text-left py-2 pr-3 font-semibold">कैटेगरी</th>
                    <th className="text-left py-2 pr-3 font-semibold">विवरण</th>
                    <th className="text-right py-2 pr-3 font-semibold">राशि</th>
                    <th className="py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-2.5 pr-3 text-[var(--sk-faint)] text-xs font-mono">{r.date.split("-").reverse().join("/")}</td>
                      <td className="py-2.5 pr-3 text-[var(--sk-muted)] text-xs">{r.category}</td>
                      <td className="py-2.5 pr-3 text-[var(--sk-text2)] text-xs max-w-[120px] truncate">{r.note}</td>
                      <td className="py-2.5 pr-3 text-right font-bold font-mono text-red-400 text-xs">{fmt(r.amount)}</td>
                      <td className="py-2.5 text-center">
                        <button onClick={() => del(r.id)} className="text-[var(--sk-dim)] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-[var(--sk-dim)] text-xs">कोई रिकॉर्ड नहीं</td></tr>}
                </tbody>
              </table>
            </div>
          </FormCard>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────

function DashboardSection({ home, rent, farm }: {
  home: HomeExpense[]; rent: RentRecord[]; farm: FarmRecord[];
}) {
  const homeTotal = home.reduce((s, r) => s + r.amount, 0);
  const rentTotal = rent.filter(r => r.status === "Received").reduce((s, r) => s + r.total, 0);
  const farmExpense = farm.filter(r => r.type === "Expense").reduce((s, r) => s + r.amount, 0);
  const farmSale = farm.filter(r => r.type === "Sale").reduce((s, r) => s + r.amount, 0);
  const farmProfit = farmSale - farmExpense;
  const netBalance = rentTotal + farmProfit - homeTotal;

  const pending = rent.filter(r => r.status === "Pending");
  const recentAll = [
    ...home.map(r => ({ date: r.date, label: r.category, detail: r.note, amount: -r.amount, type: "home" })),
    ...rent.map(r => ({ date: r.date, label: `किराया – ${r.tenant}`, detail: r.month, amount: r.total, type: "rent" })),
    ...farm.filter(r => r.type !== "Yield").map(r => ({ date: r.date, label: r.crop, detail: r.note, amount: r.type === "Sale" ? r.amount : -r.amount, type: "farm" })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const cropMap = farm.reduce((acc, r) => {
    if (!acc[r.crop]) acc[r.crop] = { expense: 0, sale: 0 };
    if (r.type === "Expense") acc[r.crop].expense += r.amount;
    if (r.type === "Sale") acc[r.crop].sale += r.amount;
    return acc;
  }, {} as Record<string, { expense: number; sale: number }>);

  return (
    <div>
      <SectionHeader title="📊 Dashboard" sub="Net balance, recent activity, and pending rent alerts" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-400/20 rounded-2xl p-4">
          <div className="text-green-400 text-xs font-semibold mb-1">💰 Net Balance</div>
          <div className={`text-2xl font-bold font-mono ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(Math.abs(netBalance))}</div>
          <div className="text-[var(--sk-faint)] text-xs mt-1">{netBalance >= 0 ? "Profit" : "Loss"}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">🏠 Home Expense</div>
          <div className="text-2xl font-bold font-mono text-red-400">{fmt(homeTotal)}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">🏢 Rent Income</div>
          <div className="text-2xl font-bold font-mono text-blue-400">{fmt(rentTotal)}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">🌾 Farm Profit</div>
          <div className={`text-2xl font-bold font-mono ${farmProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmt(farmProfit)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Recent */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Last 5 Transactions</div>
          <div className="space-y-2">
            {recentAll.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-[var(--sk-text2)] text-xs font-semibold">{r.label}</div>
                  <div className="text-[var(--sk-dim)] text-xs">{r.detail} · {r.date.split("-").reverse().join("/")}</div>
                </div>
                <span className={`font-bold font-mono text-sm ${r.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {r.amount >= 0 ? "+" : ""}{fmt(Math.abs(r.amount))}
                </span>
              </div>
            ))}
          </div>
        </FormCard>

        {/* Pending Rent */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-400" />Pending Rent Alert
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-4 text-[var(--sk-dim)] text-xs">सभी किराये प्राप्त हो गए ✅</div>
          ) : pending.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <div>
                <div className="text-[var(--sk-text2)] text-sm font-semibold">{r.tenant}</div>
                <div className="text-[var(--sk-dim)] text-xs">{r.month} · {r.note}</div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-bold font-mono text-sm">{fmt(r.total)}</div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </FormCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Crop Analytics */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Crop Wise Analytics</div>
          {Object.entries(cropMap).map(([crop, d]) => (
            <div key={crop} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--sk-muted)] text-xs">{crop}</span>
                <span className={`text-xs font-bold font-mono ${d.sale - d.expense >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d.sale - d.expense >= 0 ? "+" : ""}{fmt(d.sale - d.expense)}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="bg-red-400/20 rounded-full h-1.5 flex-1">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${Math.min((d.expense / 50000) * 100, 100)}%` }} />
                </div>
                <div className="bg-green-400/20 rounded-full h-1.5 flex-1">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${Math.min((d.sale / 50000) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </FormCard>

        {/* Monthly Trend */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Monthly Trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={MONTHLY_TREND}>
              <defs>
                <linearGradient id="gRent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sk-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} width={36} />
              <Tooltip contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} labelStyle={{ color: "var(--sk-muted)" }} formatter={(v: number) => [fmt(v), ""]} />
              <Area type="monotone" dataKey="rent" stroke="#60a5fa" fill="url(#gRent)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="farm" stroke="#4ade80" fill="url(#gFarm)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="home" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1">
            {[["#60a5fa","Rent"],["#4ade80","Farm"],["#f87171","Home"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1 text-xs text-[var(--sk-faint)]">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
        </FormCard>
      </div>
    </div>
  );
}

// ─── Rent Section ─────────────────────────────────────────────────────────────

function RentSection({ records, setRecords }: {
  records: RentRecord[]; setRecords: (r: RentRecord[]) => void;
}) {
  const emptyForm = {
    date: new Date().toISOString().split("T")[0], tenant: "", month: "Jun",
    whatsapp: "", amount: "", prevReading: "", currentReading: "",
    ratePerUnit: "8", status: "Received" as const, note: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const units = Math.max(0, Number(form.currentReading) - Number(form.prevReading));
  const lightBill = units * Number(form.ratePerUnit);
  const totalCalc = Number(form.amount) + lightBill;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setRecords([{
      id: `r${Date.now()}`, date: form.date, tenant: form.tenant, month: form.month,
      whatsapp: form.whatsapp, amount: Number(form.amount),
      prevReading: Number(form.prevReading), currentReading: Number(form.currentReading),
      ratePerUnit: Number(form.ratePerUnit), units, lightBill, total: totalCalc,
      status: form.status as RentRecord["status"], note: form.note,
    }, ...records]);
    setForm(emptyForm);
  };

  const del = (id: string) => setRecords(records.filter(r => r.id !== id));

  const filtered = records.filter(r =>
    r.tenant.toLowerCase().includes(search.toLowerCase()) || r.note.toLowerCase().includes(search.toLowerCase())
  );

  const monthTotal = records.reduce((s, r) => s + r.amount, 0);
  const electricTotal = records.reduce((s, r) => s + r.lightBill, 0);
  const combinedTotal = records.reduce((s, r) => s + r.total, 0);
  const received = records.filter(r => r.status === "Received").reduce((s, r) => s + r.total, 0);
  const pending = records.filter(r => r.status === "Pending").reduce((s, r) => s + r.total, 0);
  const partial = records.filter(r => r.status === "Partial").reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <SectionHeader title="🏢 Rent Income" sub="किराये की इनकम, देय/प्राप्ति और टेनेंट ट्रैक करें।" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FormCard>
          <form onSubmit={add} className="space-y-4">
            <div className="text-xs font-semibold text-[#4ade80] mb-2">Tenant Details</div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="तारीख">
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </InputGroup>
              <InputGroup label="टेनेंट">
                <input type="text" className={inputCls} placeholder="नाम" value={form.tenant} onChange={e => setForm(f => ({ ...f, tenant: e.target.value }))} required />
              </InputGroup>
              <InputGroup label="महीना">
                <select className={selectCls} value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </InputGroup>
              <InputGroup label="📱 WhatsApp">
                <input type="tel" className={inputCls} placeholder="9876543210" maxLength={10} value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
              </InputGroup>
            </div>

            <div className="text-xs font-semibold text-[#4ade80] mt-2 mb-1">Rent Details</div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="किराया (₹)">
                <input type="number" className={inputCls} placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </InputGroup>
              <InputGroup label="स्टेटस">
                <select className={selectCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                  <option>Received</option><option>Pending</option><option>Partial</option>
                </select>
              </InputGroup>
            </div>

            <div className="text-xs font-semibold text-[#4ade80] mt-2 mb-1">Electricity</div>
            <div className="grid grid-cols-3 gap-3">
              <InputGroup label="पहला रीडिंग">
                <input type="number" className={inputCls} placeholder="520" value={form.prevReading} onChange={e => setForm(f => ({ ...f, prevReading: e.target.value }))} />
              </InputGroup>
              <InputGroup label="वर्तमान रीडिंग">
                <input type="number" className={inputCls} placeholder="573" value={form.currentReading} onChange={e => setForm(f => ({ ...f, currentReading: e.target.value }))} />
              </InputGroup>
              <InputGroup label="दर/यूनिट">
                <input type="number" className={inputCls} value={form.ratePerUnit} onChange={e => setForm(f => ({ ...f, ratePerUnit: e.target.value }))} />
              </InputGroup>
            </div>

            {/* Auto-calc display */}
            <div className="bg-[var(--sk-bg)] rounded-xl p-3 border border-[var(--sk-border)] text-xs space-y-1">
              <div className="flex justify-between text-[var(--sk-muted)]">
                <span>यूनिट (ऑटो)</span><span className="font-mono text-white">{units.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--sk-muted)]">
                <span>बिजली बिल (ऑटो)</span><span className="font-mono text-white">{fmt(lightBill)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--sk-border)] pt-1 mt-1">
                <span className="font-semibold text-white">कुल (किराया + बिल)</span>
                <span className="font-bold font-mono text-green-400">{fmt(totalCalc)}</span>
              </div>
            </div>

            <InputGroup label="नोट">
              <input type="text" className={inputCls} placeholder="कोई विशेष जानकारी..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </InputGroup>

            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}><Plus size={14} />इनकम जोड़ें</button>
              <button type="button" className={btnSecondary} onClick={() => setRecords([])}>साफ़ करें</button>
            </div>
          </form>
        </FormCard>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <KpiBox label="माह कुल वसूली" value={fmt(monthTotal)} />
            <KpiBox label="लाइट बिल कुल" value={fmt(electricTotal)} />
            <KpiBox label="माह कुल (R+L)" value={fmt(combinedTotal)} green />
            <KpiBox label="✓ Received" value={fmt(received)} />
            <KpiBox label="⏳ Pending" value={fmt(pending)} />
            <KpiBox label="◐ Partial" value={fmt(partial)} />
          </div>

          <FormCard>
            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="flex-1 relative min-w-[120px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-faint)]" />
                <input className={inputCls + " pl-8"} placeholder="टेनेंट/नोट खोजें" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className={btnSecondary + " text-xs"} onClick={() => downloadCSV(
                  "rent-records.csv",
                  ["Date","Tenant","Month","Rent (₹)","Units","Light Bill (₹)","Total (₹)","Status","WhatsApp","Note"],
                  filtered.map(r => [r.date, r.tenant, r.month, r.amount, r.units, r.lightBill, r.total, r.status, r.whatsapp, r.note])
                )}><Download size={13} />CSV</button>
              <button className={btnSecondary + " text-xs"} onClick={() => downloadPDF(
                  "Rent Income",
                  ["Date","Tenant","Month","Rent","Units","Light","Total","Status"],
                  filtered.map(r => [r.date, r.tenant, r.month, fmt(r.amount), r.units, fmt(r.lightBill), fmt(r.total), r.status])
                )}><FileText size={13} />PDF</button>
              <button className={btnSecondary + " text-xs"} onClick={() => {
                const pending = filtered.filter(r => r.status === "Pending");
                if (!pending.length) { alert("कोई pending किराया नहीं है।"); return; }
                pending.forEach(r => {
                  if (r.whatsapp) window.open(`https://wa.me/91${r.whatsapp}?text=${encodeURIComponent(`नमस्ते ${r.tenant} जी, ${r.month} माह का किराया ${fmt(r.total)} अभी बाकी है। कृपया जल्द जमा करें। — Smart Khaata`)}`, "_blank");
                });
              }}><Bell size={13} />Reminder</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)]">
                    {["Date","Tenant","Month","Rent","Units","Light","Total","Status","WA",""].map((h,i) => (
                      <th key={i} className={`py-2 pr-2 font-semibold text-left ${i >= 8 ? "w-6" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-2 pr-2 text-[var(--sk-faint)] font-mono">{r.date.split("-").reverse().join("/")}</td>
                      <td className="py-2 pr-2 text-[var(--sk-text2)] font-semibold">{r.tenant}</td>
                      <td className="py-2 pr-2 text-[var(--sk-muted)]">{r.month}</td>
                      <td className="py-2 pr-2 font-mono text-[var(--sk-text2)]">{fmt(r.amount)}</td>
                      <td className="py-2 pr-2 text-[var(--sk-muted)] font-mono">{r.units}</td>
                      <td className="py-2 pr-2 text-[var(--sk-muted)] font-mono">{fmt(r.lightBill)}</td>
                      <td className="py-2 pr-2 font-bold font-mono text-green-400">{fmt(r.total)}</td>
                      <td className="py-2 pr-2"><StatusBadge status={r.status} /></td>
                      <td className="py-2 pr-2">
                        {r.whatsapp && (
                          <a href={`https://wa.me/91${r.whatsapp}`} className="text-green-400 hover:text-green-300">
                            <MessageCircle size={13} />
                          </a>
                        )}
                      </td>
                      <td className="py-2">
                        <button onClick={() => del(r.id)} className="text-[var(--sk-dim)] hover:text-red-400"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-5 text-[var(--sk-dim)]">कोई रिकॉर्ड नहीं</td></tr>}
                </tbody>
              </table>
            </div>
          </FormCard>
        </div>
      </div>
    </div>
  );
}

// ─── Farm Section ─────────────────────────────────────────────────────────────

function FarmSection({ records, setRecords }: {
  records: FarmRecord[]; setRecords: (r: FarmRecord[]) => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0], type: "Expense" as "Expense" | "Yield" | "Sale",
    crop: "Wheat", expenseCategory: "खाद", amount: "", quantity: "", unit: "Kg", price: "", note: "",
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setRecords([{
      id: `f${Date.now()}`, ...form,
      amount: Number(form.amount), quantity: Number(form.quantity), price: Number(form.price),
    }, ...records]);
    setForm(f => ({ ...f, note: "", amount: "", quantity: "", price: "" }));
  };

  const del = (id: string) => setRecords(records.filter(r => r.id !== id));

  const filtered = records.filter(r => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return r.crop.toLowerCase().includes(search.toLowerCase()) || r.note.toLowerCase().includes(search.toLowerCase());
  });

  const totalExpense = records.filter(r => r.type === "Expense").reduce((s, r) => s + r.amount, 0);
  const totalSales = records.filter(r => r.type === "Sale").reduce((s, r) => s + r.amount, 0);
  const profit = totalSales - totalExpense;

  const crops = ["Wheat", "Rice", "Soybean", "Cotton", "Mustard", "Other"];
  const expCats = ["बीज", "खाद", "मजदूरी", "डीजल", "सिंचाई", "अन्य"];

  // Pie data for expense categories
  const catMap = records.filter(r => r.type === "Expense").reduce((acc, r) => {
    acc[r.expenseCategory] = (acc[r.expenseCategory] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#4ade80", "#f59e0b", "#f87171", "#818cf8", "#38bdf8", "#a78bfa"];

  return (
    <div>
      <SectionHeader title="🌾 Farm Management" sub="खर्च/उत्पादन/बिक्री—एक ही जगह।" />

      <div className="flex gap-2 mb-4">
        {(["Expense", "Yield", "Sale"] as const).map(t => (
          <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${form.type === t ? "bg-green-500 text-[#0f1221]" : "bg-[var(--sk-hover)] text-[var(--sk-muted)] hover:bg-[var(--sk-hover2)] border border-[var(--sk-border2)]"}`}>
            + {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FormCard>
          <form onSubmit={add} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="तारीख">
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </InputGroup>
              <InputGroup label="टाइप">
                <select className={selectCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                  <option>Expense</option><option>Yield</option><option>Sale</option>
                </select>
              </InputGroup>
              <InputGroup label="फ़सल">
                <select className={selectCls} value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
                  {crops.map(c => <option key={c}>{c}</option>)}
                </select>
              </InputGroup>
              {form.type === "Expense" && (
                <InputGroup label="खर्च की श्रेणी">
                  <select className={selectCls} value={form.expenseCategory} onChange={e => setForm(f => ({ ...f, expenseCategory: e.target.value }))}>
                    {expCats.map(c => <option key={c}>{c}</option>)}
                  </select>
                </InputGroup>
              )}
              {form.type === "Expense" && (
                <InputGroup label="राशि (₹)">
                  <input type="number" className={inputCls} placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </InputGroup>
              )}
              {(form.type === "Yield" || form.type === "Sale") && (
                <>
                  <InputGroup label="मात्रा">
                    <input type="number" className={inputCls} placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </InputGroup>
                  <InputGroup label="यूनिट">
                    <select className={selectCls} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                      <option>Kg</option><option>Quintal</option><option>Ton</option>
                    </select>
                  </InputGroup>
                  {form.type === "Sale" && (
                    <InputGroup label="कीमत/यूनिट">
                      <input type="number" className={inputCls} placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                    </InputGroup>
                  )}
                </>
              )}
            </div>
            <InputGroup label="नोट">
              <input type="text" className={inputCls} placeholder="विवरण..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </InputGroup>
            <button type="submit" className={btnPrimary}><Plus size={14} />रिकॉर्ड जोड़ें</button>
          </form>
        </FormCard>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KpiBox label="कुल खर्च" value={fmt(totalExpense)} bar barPct={(totalExpense / 100000) * 100} />
            <KpiBox label="कुल बिक्री" value={fmt(totalSales)} bar barPct={(totalSales / 100000) * 100} />
            <KpiBox label="लाभ" value={fmt(profit)} green={profit >= 0} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-3">
            <FormCard>
              <div className="text-xs text-[var(--sk-faint)] mb-2">Expense by Category</div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                        {pieData.map((entry, i) => <Cell key={`farm-cell-${entry.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {pieData.slice(0,3).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-[var(--sk-muted)] flex-1">{d.name}</span>
                        <span className="font-mono text-[var(--sk-text2)]">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="text-[var(--sk-dim)] text-xs text-center py-6">कोई डेटा नहीं</div>}
            </FormCard>

            <FormCard>
              <div className="text-xs text-[var(--sk-faint)] mb-2">Monthly Trend</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={MONTHLY_TREND} barGap={1}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ background: "var(--sk-card2)", border: "none", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="farm" fill="#4ade80" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </FormCard>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        <FormCard>
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="flex-1 relative min-w-[120px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-faint)]" />
              <input className={inputCls + " pl-8"} placeholder="खोजें (फ़सल/नोट)" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={selectCls + " w-auto"} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">सभी टाइप</option>
              <option>Expense</option><option>Yield</option><option>Sale</option>
            </select>
            <button className={btnSecondary + " text-xs"} onClick={() => downloadCSV(
                "farm-records.csv",
                ["Date","Type","Crop","Category","Amount (₹)","Quantity","Unit","Price","Note"],
                filtered.map(r => [r.date, r.type, r.crop, r.expenseCategory, r.amount, r.quantity, r.unit, r.price, r.note])
              )}><Download size={13} />CSV</button>
            <button className={btnSecondary + " text-xs"} onClick={() => downloadPDF(
                "Farm Management",
                ["Date","Type","Crop","Details","Amount / Qty"],
                filtered.map(r => [r.date, r.type, r.crop, `${r.expenseCategory ? r.expenseCategory + " · " : ""}${r.note}`, r.type !== "Yield" ? fmt(r.amount || r.quantity * r.price) : `${r.quantity} ${r.unit}`])
              )}><FileText size={13} />PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)]">
                  {["तारीख","टाइप","फ़सल","Details","राशि","Action"].map(h => (
                    <th key={h} className="py-2 pr-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-2.5 pr-3 text-[var(--sk-faint)] font-mono">{r.date.split("-").reverse().join("/")}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={r.type} /></td>
                    <td className="py-2.5 pr-3 text-[var(--sk-text2)] font-semibold">{r.crop}</td>
                    <td className="py-2.5 pr-3 text-[var(--sk-muted)] max-w-[150px]">
                      {r.expenseCategory && <span className="mr-1">{r.expenseCategory} ·</span>}
                      {r.quantity > 0 && <span>{r.quantity} {r.unit} ·</span>} {r.note}
                    </td>
                    <td className="py-2.5 pr-3 font-bold font-mono">
                      <span className={r.type === "Expense" ? "text-red-400" : "text-green-400"}>
                        {r.type !== "Yield" ? fmt(r.amount || r.quantity * r.price) : `${r.quantity} ${r.unit}`}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => del(r.id)} className="text-[var(--sk-dim)] hover:text-red-400"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-[var(--sk-dim)]">कोई रिकॉर्ड नहीं</td></tr>}
              </tbody>
            </table>
          </div>
        </FormCard>
      </div>
    </div>
  );
}

// ─── Reports Section ──────────────────────────────────────────────────────────

function ReportsSection({ home, rent, farm }: {
  home: HomeExpense[]; rent: RentRecord[]; farm: FarmRecord[];
}) {
  const homeTotal = home.reduce((s, r) => s + r.amount, 0);
  const rentTotal = rent.filter(r => r.status === "Received").reduce((s, r) => s + r.total, 0);
  const farmExpense = farm.filter(r => r.type === "Expense").reduce((s, r) => s + r.amount, 0);
  const farmSale = farm.filter(r => r.type === "Sale").reduce((s, r) => s + r.amount, 0);
  const farmProfit = farmSale - farmExpense;
  const netBalance = rentTotal + farmProfit - homeTotal;

  const totalIncome = rentTotal + farmSale;
  const farmPct = totalIncome > 0 ? Math.round((farmSale / totalIncome) * 100) : 0;
  const rentPct = totalIncome > 0 ? Math.round((rentTotal / totalIncome) * 100) : 0;

  const cropSet = [...new Set(farm.map(r => r.crop))];

  const insights = [
    rentTotal > homeTotal ? `✅ किराया (${fmt(rentTotal)}) घर के खर्च (${fmt(homeTotal)}) से ज़्यादा है।` : `⚠️ घर का खर्च किराये से ज़्यादा है।`,
    farmProfit > 0 ? `🌾 खेती में ${fmt(farmProfit)} का मुनाफा।` : `📉 खेती में ${fmt(Math.abs(farmProfit))} का नुकसान।`,
    `📅 सबसे अच्छा माह: मार्च (${fmt(62000)})`,
    `🌱 ${cropSet.length} फसलें ट्रैक की जा रही हैं: ${cropSet.join(", ")}`,
  ];

  return (
    <div>
      <SectionHeader title="📊 Reports & Insights" sub="सभी कैटेगरी का विश्लेषण" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          <button className={btnSecondary + " text-xs"}><RefreshCw size={13} />Refresh</button>
          <span className="text-[var(--sk-dim)] text-xs self-center">Updated: आज</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "🏠 Home", value: fmt(homeTotal), color: "text-red-400" },
          { label: "🏢 Rent", value: fmt(rentTotal), color: "text-blue-400" },
          { label: "🌾 Farm", value: fmt(farmProfit), color: farmProfit >= 0 ? "text-teal-400" : "text-red-400" },
          { label: "💰 Net Balance", value: fmt(netBalance), color: netBalance >= 0 ? "text-green-400" : "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4 text-center">
            <div className="text-[var(--sk-faint)] text-xs mb-1">{s.label}</div>
            <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Monthly Trend Chart */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">मासिक ट्रेंड</div>
          <div className="flex gap-4 mb-2">
            {[["#60a5fa","Rent"],["#4ade80","Farm"],["#f87171","Home"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-[var(--sk-faint)]">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_TREND} barGap={1}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sk-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} width={36} />
              <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="rent" fill="#60a5fa" radius={[3,3,0,0]} />
              <Bar dataKey="farm" fill="#4ade80" radius={[3,3,0,0]} />
              <Bar dataKey="home" fill="#f87171" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </FormCard>

        {/* Breakdown + Pie */}
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Net Balance Breakdown</div>
          <div className="space-y-2 mb-4">
            {[
              { label: "Rent Income", val: rentTotal, color: "text-blue-400" },
              { label: "Farm Profit", val: farmProfit, color: farmProfit >= 0 ? "text-teal-400" : "text-red-400" },
              { label: "Home Spend", val: -homeTotal, color: "text-red-400" },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-[var(--sk-muted)]">{r.label}</span>
                <span className={`font-bold font-mono ${r.color}`}>{fmt(r.val)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1">
              <span className="font-semibold text-white">Net Balance</span>
              <strong className={`font-mono text-base ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(netBalance)}</strong>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={[{ name: "Farm", value: farmPct }, { name: "Rent", value: rentPct }]} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" paddingAngle={3}>
                <Cell key="cell-farm" fill="#4ade80" />
                <Cell key="cell-rent" fill="#60a5fa" />
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} contentStyle={{ background: "var(--sk-card2)", border: "none", borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1 text-xs text-[var(--sk-faint)]">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Farm {farmPct}%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Rent {rentPct}%</div>
          </div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Quick Stats</div>
          <div className="space-y-2">
            {[
              { label: "🏢 Tenants", val: fmtNum(rent.length) },
              { label: "🌾 Crops", val: fmtNum(cropSet.length) },
              { label: "🧾 Expenses", val: fmtNum(home.length + farm.filter(r=>r.type==="Expense").length) },
              { label: "💵 Transactions", val: fmtNum(home.length + rent.length + farm.length) },
            ].map(s => (
              <div key={s.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-[var(--sk-muted)] text-sm">{s.label}</span>
                <strong className="text-white font-mono">{s.val}</strong>
              </div>
            ))}
          </div>
        </FormCard>

        <FormCard>
          <div className="font-semibold text-white text-sm mb-3">Insights</div>
          <ul className="space-y-2.5">
            {insights.map((ins, i) => (
              <li key={i} className="text-sm text-[var(--sk-muted)] flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                {ins}
              </li>
            ))}
          </ul>
        </FormCard>
      </div>
    </div>
  );
}

// ─── Backup Section ───────────────────────────────────────────────────────────

function BackupSection({ home, rent, farm }: {
  home: HomeExpense[]; rent: RentRecord[]; farm: FarmRecord[];
}) {
  const [text, setText] = useState("");
  const exportData = () => {
    const data = JSON.stringify({ home, rent, farm, exportedAt: new Date().toISOString() }, null, 2);
    setText(data);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-khaata-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader title="🗄️ Backup / Restore" sub="अपना डेटा export करें या import करें।" />
      <FormCard>
        <div className="flex gap-2 mb-4">
          <button className={btnPrimary} onClick={exportData}><Download size={14} />JSON Export</button>
          <label className={btnSecondary + " cursor-pointer"}>
            <Upload size={14} />JSON Import
            <input type="file" accept="application/json" className="hidden" onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = ev => setText(ev.target?.result as string);
              reader.readAsText(f);
            }} />
          </label>
        </div>
        <textarea
          className={inputCls + " h-48 resize-none font-mono text-xs"}
          placeholder="यहाँ JSON दिखेगा…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <p className="text-[var(--sk-faint)] text-xs mt-2">⚠️ Import करने पर मौजूदा डेटा बदल सकता है। पहले Export ले लें।</p>
      </FormCard>
    </div>
  );
}

// ─── Toggle (shared) ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
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

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const [goalExpense, setGoalExpense] = useState("15000");
  const [goalRent, setGoalRent] = useState("12000");
  const [lang, setLang] = useState("hi");
  const [currency, setCurrency] = useState("INR");
  const [notifs, setNotifs] = useState(true);
  const [backupReminder, setBackupReminder] = useState(true);
  const [exportCsv, setExportCsv] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("sk_settings", JSON.stringify({ goalExpense, goalRent, lang, currency, darkMode, notifs, backupReminder }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeader title="⚙️ Settings" sub="ऐप की सेटिंग्स कस्टमाइज़ करें।" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormCard>
          <div className="text-xs font-semibold text-green-400 mb-3">Goals & Preferences</div>
          <div className="space-y-4">
            <InputGroup label="महीने का खर्च लक्ष्य (₹)">
              <input type="number" className={inputCls} placeholder="15000" value={goalExpense} onChange={e => setGoalExpense(e.target.value)} />
            </InputGroup>
            <InputGroup label="किराया लक्ष्य (₹)">
              <input type="number" className={inputCls} placeholder="12000" value={goalRent} onChange={e => setGoalRent(e.target.value)} />
            </InputGroup>
            <InputGroup label="भाषा / Language">
              <select className={selectCls} value={lang} onChange={e => setLang(e.target.value)}>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </InputGroup>
            <InputGroup label="Currency">
              <select className={selectCls} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </InputGroup>
          </div>
        </FormCard>

        <FormCard>
          <div className="text-xs font-semibold text-green-400 mb-4">App Settings</div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--sk-text2)] text-sm font-semibold">Dark Mode 🌙</div>
                <div className="text-[var(--sk-dim)] text-xs">Comfortable night view</div>
              </div>
              <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--sk-text2)] text-sm font-semibold">Backup Reminder ☁️</div>
                <div className="text-[var(--sk-dim)] text-xs">Weekly local backup alert</div>
              </div>
              <Toggle checked={backupReminder} onChange={() => setBackupReminder(v => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--sk-text2)] text-sm font-semibold">Notifications 🔔</div>
                <div className="text-[var(--sk-dim)] text-xs">Rent and expense alerts</div>
              </div>
              <Toggle checked={notifs} onChange={() => setNotifs(v => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--sk-text2)] text-sm font-semibold">Auto CSV Export 📤</div>
                <div className="text-[var(--sk-dim)] text-xs">Keep monthly export ready</div>
              </div>
              <Toggle checked={exportCsv} onChange={() => setExportCsv(v => !v)} />
            </div>
          </div>
        </FormCard>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button className={btnPrimary} onClick={save}><CheckCircle size={14} />सेटिंग सेव करें</button>
        <button className={btnSecondary} onClick={() => {
          setGoalExpense("15000"); setGoalRent("12000");
          setLang("hi"); setCurrency("INR");
          setNotifs(true); setBackupReminder(true); setExportCsv(false);
        }}>रीसेट</button>
        {saved && (
          <span className="text-green-400 text-sm flex items-center gap-1.5 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
            <CheckCircle size={14} />✅ सेटिंग सेव हो गई!
          </span>
        )}
      </div>
      <p className="text-[var(--sk-dim)] text-xs mt-3">App version 1.0 • Local save only</p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [darkMode, setDarkMode] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [homeRecords, setHomeRecords] = useState<HomeExpense[]>(INIT_HOME);
  const [rentRecords, setRentRecords] = useState<RentRecord[]>(INIT_RENT);
  const [farmRecords, setFarmRecords] = useState<FarmRecord[]>(INIT_FARM);
  const [isOnline] = useState(true);

  const navItems: { id: Tab; icon: React.ReactNode; label: string; emoji: string }[] = [
    { id: "home", icon: <Home size={16} />, label: "Home", emoji: "🏠" },
    { id: "dashboard", icon: <BarChart2 size={16} />, label: "Dashboard", emoji: "📊" },
    { id: "rent", icon: <Building2 size={16} />, label: "Rent", emoji: "🏢" },
    { id: "farm", icon: <Wheat size={16} />, label: "Farm", emoji: "🌾" },
    { id: "reports", icon: <TrendingUp size={16} />, label: "Reports", emoji: "📈" },
    { id: "backup", icon: <HardDrive size={16} />, label: "Backup", emoji: "🗄️" },
    { id: "settings", icon: <Settings size={16} />, label: "Settings", emoji: "⚙️" },
  ];

  const go = (tab: Tab) => { setActiveTab(tab); setDrawerOpen(false); setFabOpen(false); };

  return (
    <div data-theme={darkMode ? "dark" : "light"}>
      <style>{`
        [data-theme="dark"] {
          --sk-bg: #0f1221; --sk-card: #111827; --sk-card2: #1a2236;
          --sk-text: #f1f5f9; --sk-text2: #e2e8f0; --sk-muted: #94a3b8;
          --sk-faint: #64748b; --sk-dim: #475569;
          --sk-border: rgba(255,255,255,0.08); --sk-border2: rgba(255,255,255,0.12);
          --sk-hover: rgba(255,255,255,0.06); --sk-hover2: rgba(255,255,255,0.12);
          --sk-grid: rgba(255,255,255,0.05);
        }
        [data-theme="light"] {
          --sk-bg: #f1f5f9; --sk-card: #ffffff; --sk-card2: #f8fafc;
          --sk-text: #0f172a; --sk-text2: #1e293b; --sk-muted: #475569;
          --sk-faint: #64748b; --sk-dim: #94a3b8;
          --sk-border: rgba(0,0,0,0.08); --sk-border2: rgba(0,0,0,0.12);
          --sk-hover: rgba(0,0,0,0.04); --sk-hover2: rgba(0,0,0,0.08);
          --sk-grid: rgba(0,0,0,0.05);
        }
      `}</style>
      <div className="bg-[var(--sk-bg)] min-h-screen text-[var(--sk-text)] font-['Inter',sans-serif]">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[var(--sk-bg)] backdrop-blur border-b border-[var(--sk-border)]">
          <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-[#0f1221] font-black text-sm">SK</div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Smart Khaata</div>
                <div className="text-[var(--sk-dim)] text-xs leading-tight">Home • Rent • Farm</div>
              </div>
            </div>

            {/* Desktop Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(n => (
                <button key={n.id} onClick={() => go(n.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === n.id ? "bg-green-500/20 text-green-400 border border-green-400/30" : "text-[var(--sk-faint)] hover:text-white hover:bg-[var(--sk-hover)]"}`}>
                  {n.emoji} {n.label}
                </button>
              ))}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <div className={`hidden md:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isOnline ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                {isOnline ? "Online" : "Offline"}
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className="w-8 h-8 rounded-lg bg-[var(--sk-hover)] flex items-center justify-center text-[var(--sk-muted)] hover:text-white transition-colors">
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button onClick={() => setDrawerOpen(true)} className="md:hidden w-8 h-8 rounded-lg bg-[var(--sk-hover)] flex items-center justify-center text-[var(--sk-muted)]">
                <Menu size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Banner */}
        <div className="bg-green-500/10 border-b border-green-400/15 px-4 py-2">
          <p className="text-xs text-green-400/80 text-center max-w-7xl mx-auto">अपने खर्च, किराया और खेती को एक ही जगह पर ट्रैक करें। डेटा आपके डिवाइस में सुरक्षित रहता है।</p>
        </div>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <>
            <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <aside className="fixed left-0 top-0 h-full w-72 bg-[var(--sk-card)] border-r border-[var(--sk-border)] z-50 flex flex-col">
              <div className="p-5 border-b border-[var(--sk-border)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-bold">Smart Khaata</div>
                    <div className="text-[var(--sk-dim)] text-xs">Home • Rent • Farm</div>
                    <div className="text-[var(--sk-dim)] text-xs mt-0.5">Local data on device</div>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 bg-[var(--sk-hover)] rounded-lg flex items-center justify-center text-[var(--sk-faint)]"><X size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: "💰 Net Balance", val: fmt(rentRecords.reduce((s,r)=>s+r.total,0) - homeRecords.reduce((s,r)=>s+r.amount,0)) },
                    { label: "🏢 Tenants", val: String(rentRecords.length) },
                    { label: "🌾 Crops", val: String(new Set(farmRecords.map(r=>r.crop)).size) },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[var(--sk-faint)] text-xs">{s.label}</div>
                      <div className="text-white font-bold text-sm font-mono">{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.slice(0, 5).map(n => (
                  <button key={n.id} onClick={() => go(n.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === n.id ? "bg-green-500/20 text-green-400" : "text-[var(--sk-muted)] hover:bg-[var(--sk-hover)] hover:text-white"}`}>
                    {n.emoji} {n.label}
                  </button>
                ))}
                <div className="border-t border-[var(--sk-border)] my-2" />
                {navItems.slice(5).map(n => (
                  <button key={n.id} onClick={() => go(n.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === n.id ? "bg-green-500/20 text-green-400" : "text-[var(--sk-muted)] hover:bg-[var(--sk-hover)] hover:text-white"}`}>
                    {n.emoji} {n.label}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-[var(--sk-border)]">
                <div className="text-[var(--sk-dim)] text-xs text-center">Smart Khaata v1.0 · Made with ❤️</div>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-8">
          {activeTab === "home" && <HomeSection records={homeRecords} setRecords={setHomeRecords} />}
          {activeTab === "dashboard" && <DashboardSection home={homeRecords} rent={rentRecords} farm={farmRecords} />}
          {activeTab === "rent" && <RentSection records={rentRecords} setRecords={setRentRecords} />}
          {activeTab === "farm" && <FarmSection records={farmRecords} setRecords={setFarmRecords} />}
          {activeTab === "reports" && <ReportsSection home={homeRecords} rent={rentRecords} farm={farmRecords} />}
          {activeTab === "backup" && <BackupSection home={homeRecords} rent={rentRecords} farm={farmRecords} />}
          {activeTab === "settings" && <SettingsSection darkMode={darkMode} setDarkMode={setDarkMode} />}
        </main>

        {/* Bottom Nav (mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--sk-card)] border-t border-[var(--sk-border)] z-30">
          <div className="flex">
            {navItems.slice(0, 5).map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${activeTab === n.id ? "text-green-400" : "text-[var(--sk-dim)]"}`}>
                <span className="text-lg leading-none">{n.emoji}</span>
                <span className="text-xs font-semibold">{n.label}</span>
                {activeTab === n.id && <div className="w-1 h-1 rounded-full bg-green-400" />}
              </button>
            ))}
          </div>
        </nav>

        {/* FAB */}
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          {fabOpen && (
            <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end">
              {[
                { label: "🏠 Home Expense", tab: "home" as Tab },
                { label: "🏢 Rent Entry", tab: "rent" as Tab },
                { label: "🌾 Farm Record", tab: "farm" as Tab },
                { label: "📤 Export", tab: "backup" as Tab },
              ].map(a => (
                <button key={a.label} onClick={() => { go(a.tab); setFabOpen(false); }}
                  className="bg-[var(--sk-card2)] border border-white/15 text-[var(--sk-text2)] text-sm font-semibold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setFabOpen(!fabOpen)}
            className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-[#0f1221] text-2xl font-bold shadow-xl shadow-green-500/30 active:scale-95 transition-transform">
            {fabOpen ? <X size={22} /> : <Plus size={22} />}
          </button>
        </div>

        {/* Footer */}
        <footer className="hidden md:block text-center py-4 text-[var(--sk-dim)] text-xs border-t border-white/5">
          Smart Khaata • खर्च, किराया, खेती — सब एक जगह
        </footer>
      </div>
    </div>
  );
}
