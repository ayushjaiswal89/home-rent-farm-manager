"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FarmRecord, HomeExpense, Lang, RentRecord } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt, fmtNum } from "../../lib/utils";
import { FormCard, KpiBox, SectionHeader } from "../common/UI";

interface ReportsSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

export function ReportsSection({ home, rent, farm, lang }: ReportsSectionProps) {
  const t = STRINGS[lang];

  const homeTotal = useMemo(() => home.reduce((sum, item) => sum + item.amount, 0), [home]);
  const rentTotal = useMemo(() => rent.filter(item => item.status === "Received").reduce((sum, item) => sum + item.total, 0), [rent]);
  const farmExpense = useMemo(() => farm.filter(item => item.type === "Expense").reduce((sum, item) => sum + item.amount, 0), [farm]);
  const farmSale = useMemo(() => farm.filter(item => item.type === "Sale").reduce((sum, item) => sum + item.amount, 0), [farm]);
  const farmProfit = useMemo(() => farmSale - farmExpense, [farmSale, farmExpense]);
  const netBalance = useMemo(() => rentTotal + farmProfit - homeTotal, [rentTotal, farmProfit, homeTotal]);
  const totalIncome = useMemo(() => rentTotal + farmSale, [rentTotal, farmSale]);
  const farmPct = useMemo(() => (totalIncome > 0 ? Math.round((farmSale / totalIncome) * 100) : 0), [farmSale, totalIncome]);
  const rentPct = useMemo(() => (totalIncome > 0 ? Math.round((rentTotal / totalIncome) * 100) : 0), [rentTotal, totalIncome]);
  const cropSet = useMemo(() => [...new Set(farm.map(item => item.crop))], [farm]);
  const insights = useMemo(() => [
    rentTotal > homeTotal ? `✅ ${lang === "hi" ? "किराया" : "Rent"} ${fmt(rentTotal)} ${lang === "hi" ? "घर के खर्च से अधिक है।" : "is higher than home expense."}` : `⚠️ ${lang === "hi" ? "घर का खर्च किराये से अधिक है।" : "Home expense exceeds rent."}`,
    farmProfit >= 0 ? `🌾 ${lang === "hi" ? "खेती में" : "Farm has"} ${fmt(farmProfit)} ${lang === "hi" ? "का लाभ है।" : "profit."}` : `📉 ${lang === "hi" ? "खेती में" : "Farm has"} ${fmt(Math.abs(farmProfit))} ${lang === "hi" ? "का नुकसान है।" : "loss."}`,
    `📅 ${lang === "hi" ? "ट्रैक किए गए फसल" : "Tracked crops"}: ${cropSet.length}`,
    `💼 ${lang === "hi" ? "कुल लेनदेन" : "Total transactions"}: ${fmtNum(home.length + rent.length + farm.length)}`,
  ], [cropSet.length, farmProfit, home.length, lang, rent.length, rentTotal]);

  const chartData = useMemo(() => [
    { month: "Jan", rent: 19500, farm: 13000, home: 8200 },
    { month: "Feb", rent: 19500, farm: 17000, home: 9100 },
    { month: "Mar", rent: 20000, farm: 40000, home: 7800 },
    { month: "Apr", rent: 20000, farm: 26000, home: 8900 },
    { month: "May", rent: 20500, farm: 17000, home: 9500 },
    { month: "Jun", rent: 20500, farm: 34500, home: 9050 },
  ], []);

  return (
    <div>
      <SectionHeader title={t.reportsTitle} sub={t.reportsSub} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.homeSpend}</div>
          <div className="text-2xl font-bold font-mono text-red-400">{fmt(homeTotal)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.rentIncome}</div>
          <div className="text-2xl font-bold font-mono text-blue-400">{fmt(rentTotal)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.farmProfitLabel}</div>
          <div className={`text-2xl font-bold font-mono ${farmProfit >= 0 ? "text-teal-400" : "text-red-400"}`}>{fmt(farmProfit)}</div>
        </FormCard>
        <FormCard>
          <div className="text-[var(--sk-faint)] text-xs mb-1">{t.netBalance}</div>
          <div className={`text-2xl font-bold font-mono ${netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(netBalance)}</div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.monthlyChart}</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sk-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={value => `₹${value / 1000}K`} width={36} />
              <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} />
              <Bar dataKey="rent" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="farm" fill="#4ade80" radius={[3, 3, 0, 0]} />
              <Bar dataKey="home" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </FormCard>

        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.netBreakdown}</div>
          <div className="space-y-3">
            {[
              { label: t.rentIncome, value: rentTotal, color: "text-blue-400" },
              { label: t.farmProfitLabel, value: farmProfit, color: farmProfit >= 0 ? "text-teal-400" : "text-red-400" },
              { label: t.homeSpend, value: -homeTotal, color: "text-red-400" },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-[var(--sk-muted)]">{item.label}</span>
                <span className={`font-bold font-mono ${item.color}`}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={[{ name: "Farm", value: farmPct }, { name: "Rent", value: rentPct }]} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value">
                <Cell fill="#4ade80" />
                <Cell fill="#60a5fa" />
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, ""]} contentStyle={{ background: "var(--sk-card2)", border: "none", borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1 text-xs text-[var(--sk-faint)]">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{t.farmProfitLabel} {farmPct}%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{t.rentIncome} {rentPct}%</div>
          </div>
        </FormCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.quickStats}</div>
          <div className="space-y-2">
            {[
              { label: t.tenantsLabel, value: fmtNum(rent.length) },
              { label: t.cropsLabel, value: fmtNum(cropSet.length) },
              { label: t.expensesLabel, value: fmtNum(home.length + farm.filter(item => item.type === "Expense").length) },
              { label: t.txLabel, value: fmtNum(home.length + rent.length + farm.length) },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-[var(--sk-muted)] text-sm">{item.label}</span>
                <strong className="text-white font-mono">{item.value}</strong>
              </div>
            ))}
          </div>
        </FormCard>

        <FormCard>
          <div className="text-xs text-[var(--sk-faint)] mb-2">{t.insightsLabel}</div>
          <ul className="space-y-2.5">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-[var(--sk-muted)] flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </FormCard>
      </div>
    </div>
  );
}
