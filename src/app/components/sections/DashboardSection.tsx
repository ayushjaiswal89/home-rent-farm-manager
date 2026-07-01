"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FarmRecord, HomeExpense, Lang, RentRecord } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import { FormCard, KpiBox, SectionHeader, StatusBadge } from "../common/UI";

interface DashboardSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

export function DashboardSection({ home, rent, farm, lang }: DashboardSectionProps) {
  const t = STRINGS[lang];

  const homeTotal = useMemo(() => home.reduce((sum, item) => sum + item.amount, 0), [home]);
  const rentTotal = useMemo(() => rent.filter(r => r.status === "Received").reduce((sum, item) => sum + item.total, 0), [rent]);
  const farmExpense = useMemo(() => farm.filter(r => r.type === "Expense").reduce((sum, item) => sum + item.amount, 0), [farm]);
  const farmSale = useMemo(() => farm.filter(r => r.type === "Sale").reduce((sum, item) => sum + item.amount, 0), [farm]);
  const farmProfit = farmSale - farmExpense;
  const netBalance = rentTotal + farmProfit - homeTotal;

  const pendingRent = useMemo(() => rent.filter(r => r.status === "Pending"), [rent]);

  const recentAll = useMemo(() => [
    ...home.map(r => ({ date: r.date, label: r.category, detail: r.note, amount: -r.amount, id: r.id })),
    ...rent.map(r => ({ date: r.date, label: `${r.tenant}`, detail: r.month, amount: r.total, id: r.id })),
    ...farm.filter(r => r.type !== "Yield").map(r => ({ date: r.date, label: r.crop, detail: r.note, amount: r.type === "Sale" ? r.amount : -r.amount, id: r.id })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [farm, home, rent]);

  const cropMap = useMemo(() => farm.reduce<Record<string, { expense: number; sale: number }>>((acc, record) => {
    if (!acc[record.crop]) acc[record.crop] = { expense: 0, sale: 0 };
    if (record.type === "Expense") acc[record.crop].expense += record.amount;
    if (record.type === "Sale") acc[record.crop].sale += record.amount;
    return acc;
  }, {}), [farm]);

  const cropRows = useMemo(() => Object.entries(cropMap), [cropMap]);

  const trendData = useMemo(() => [
    { month: "Jan", rent: 19500, farm: 13000, home: 8200 },
    { month: "Feb", rent: 19500, farm: 17000, home: 9100 },
    { month: "Mar", rent: 20000, farm: 40000, home: 7800 },
    { month: "Apr", rent: 20000, farm: 26000, home: 8900 },
    { month: "May", rent: 20500, farm: 17000, home: 9500 },
    { month: "Jun", rent: 20500, farm: 34500, home: 9050 },
  ], []);

  return (
    <div>
      <SectionHeader title={t.dashTitle} sub={t.dashSub} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-400/20 rounded-2xl p-4">
          <div className="text-green-400 text-xs font-semibold mb-1">{t.netBalance}</div>
          <div className={`text-2xl font-bold font-mono ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(Math.abs(netBalance))}</div>
          <div className="text-[var(--sk-faint)] text-xs mt-1">{netBalance >= 0 ? t.profit : t.loss}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">{t.homeExp}</div>
          <div className="text-2xl font-bold font-mono text-red-400">{fmt(homeTotal)}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">{t.rentInc}</div>
          <div className="text-2xl font-bold font-mono text-blue-400">{fmt(rentTotal)}</div>
        </div>
        <div className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-2xl p-4">
          <div className="text-[var(--sk-muted)] text-xs mb-1">{t.farmProf}</div>
          <div className={`text-2xl font-bold font-mono ${farmProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmt(farmProfit)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.last5}</div>
          <div className="space-y-2">
            {recentAll.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-[var(--sk-text2)] text-xs font-semibold">{item.label}</div>
                  <div className="text-[var(--sk-dim)] text-xs">{item.detail} · {item.date.split("-").reverse().join("/")}</div>
                </div>
                <span className={`font-bold font-mono text-sm ${item.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {item.amount >= 0 ? "+" : ""}{fmt(Math.abs(item.amount))}
                </span>
              </div>
            ))}
          </div>
        </FormCard>

        <FormCard>
          <div className="font-semibold text-white text-sm mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-amber-400" />{t.pendingAlert}</div>
          {pendingRent.length === 0 ? (
            <div className="text-center py-4 text-[var(--sk-dim)] text-xs">{t.allRentDone}</div>
          ) : (
            pendingRent.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-[var(--sk-text2)] text-sm font-semibold">{r.tenant}</div>
                  <div className="text-[var(--sk-dim)] text-xs">{r.month} · {r.note || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold font-mono text-sm">{fmt(r.total)}</div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))
          )}
        </FormCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.cropAnalytics}</div>
          {cropRows.map(([crop, values], index) => (
            <div key={crop} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--sk-muted)] text-xs">{crop}</span>
                <span className={`text-xs font-bold font-mono ${values.sale - values.expense >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {values.sale - values.expense >= 0 ? "+" : ""}{fmt(values.sale - values.expense)}
                </span>
              </div>
              <div className="flex gap-1">
                <div className="bg-red-400/20 rounded-full h-1.5 flex-1">
                  <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${Math.min((values.expense / 50000) * 100, 100)}%` }} />
                </div>
                <div className="bg-green-400/20 rounded-full h-1.5 flex-1">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${Math.min((values.sale / 50000) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </FormCard>

        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.trend}</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
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
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={value => `₹${value / 1000}K`} width={36} />
              <Tooltip contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} labelStyle={{ color: "var(--sk-muted)" }} formatter={(value: number) => [fmt(value), ""]} />
              <Area type="monotone" dataKey="rent" stroke="#60a5fa" fill="url(#gRent)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="farm" stroke="#4ade80" fill="url(#gFarm)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="home" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1 text-[var(--sk-faint)] text-xs">
            {[["#60a5fa", t.rentInc], ["#4ade80", t.farmProf], ["#f87171", t.homeExp]].map(([color, label]) => (
              <div key={String(label)} className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }} />{label}
              </div>
            ))}
          </div>
        </FormCard>
      </div>
    </div>
  );
}
