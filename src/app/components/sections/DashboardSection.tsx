"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  Wallet,
  Home,
  Building2,
  Wheat,
  Clock3,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Trophy,
  Users,
} from "lucide-react";

import {Area,AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
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
    ...home.map(r => ({
  date: r.date,
  label: r.category,
  detail: r.note,
  amount: -r.amount,
  id: r.id,
  icon: "🏠",
})),
    ...rent.map(r => ({ date: r.date, label: `${r.tenant}`, detail: r.month, amount: r.total, id: r.id, icon: "🏢" })),
    ...farm.filter(r => r.type !== "Yield").map(r => ({ date: r.date, label: r.crop, detail: r.note, amount: r.type === "Sale" ? r.amount : -r.amount, id: r.id, icon: "🌾" })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [farm, home, rent]);

  const cropMap = useMemo(() => farm.reduce<Record<string, { expense: number; sale: number }>>((acc, record) => {
    if (!acc[record.crop]) acc[record.crop] = { expense: 0, sale: 0 };
    if (record.type === "Expense") acc[record.crop].expense += record.amount;
    if (record.type === "Sale") acc[record.crop].sale += record.amount;
    return acc;
  }, {}), [farm]);

  const cropRows = useMemo(() => Object.entries(cropMap), [cropMap]);

  const month = new Date().toISOString().slice(0, 7);

  const thisMonthIncome =
    rent
      .filter(r => r.status === "Received" && r.date.startsWith(month))
      .reduce((s, r) => s + r.total, 0) +
    farm
      .filter(r => r.type === "Sale" && r.date.startsWith(month))
      .reduce((s, r) => s + r.amount, 0);

  const thisMonthExpense =
    home
      .filter(h => h.date.startsWith(month))
      .reduce((s, h) => s + h.amount, 0) +
    farm
      .filter(f => f.type === "Expense" && f.date.startsWith(month))
      .reduce((s, f) => s + f.amount, 0);

  const savings = thisMonthIncome - thisMonthExpense;

  const pendingAmount = rent
    .filter(r => r.status === "Pending")
    .reduce((s, r) => s + r.total, 0);

  const kpis = [
    {
      title: "Total Balance",
      value: netBalance,
      color: "text-green-400",
      icon: Wallet,
    },
    {
      title: "Home Expense",
      value: homeTotal,
      color: "text-red-400",
      icon: Home,
    },
    {
      title: "Rent Income",
      value: rentTotal,
      color: "text-sky-400",
      icon: Building2,
    },
    {
      title: "Farm Profit",
      value: farmProfit,
      color: "text-emerald-400",
      icon: Wheat,
    },
    {
      title: "Pending Rent",
      value: pendingAmount,
      color: "text-amber-400",
      icon: Clock3,
    },
    {
      title: "This Month Income",
      value: thisMonthIncome,
      color: "text-cyan-400",
      icon: TrendingUp,
    },
    {
      title: "This Month Expense",
      value: thisMonthExpense,
      color: "text-rose-400",
      icon: TrendingDown,
    },
    {
      title: "Savings",
      value: savings,
      color: savings >= 0 ? "text-green-400" : "text-red-400",
      icon: PiggyBank,
    },
  ];

  const pieData = [
    {
      name: "Income",
      value: rentTotal + farmSale,
    },
    {
      name: "Expense",
      value: homeTotal + farmExpense,
    },
  ];

  const COLORS = [
    "#22c55e",
    "#ef4444",
  ];

  const topCrop = [...cropRows].sort(
    (a, b) =>
      (b[1].sale - b[1].expense) -
      (a[1].sale - a[1].expense)
  )[0];

  const bestTenant = [...rent]
    .filter(r => r.status === "Received")
    .sort((a, b) => b.total - a.total)[0];

  const trendData = useMemo(() => {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return months.map((monthName, index) => {
    const month = String(index + 1).padStart(2, "0");

    const rentIncome = rent
      .filter(
        r =>
          r.status === "Received" &&
          r.date.split("-")[1] === month
      )
      .reduce((s, r) => s + r.total, 0);

    const farmIncome = farm
      .filter(
        f =>
          f.type === "Sale" &&
          f.date.split("-")[1] === month
      )
      .reduce((s, f) => s + f.amount, 0);

    const homeExpense = home
      .filter(
        h =>
          h.date.split("-")[1] === month
      )
      .reduce((s, h) => s + h.amount, 0);

    return {
      month: monthName,
      rent: rentIncome,
      farm: farmIncome,
      home: homeExpense,
    };
  });

}, [home, rent, farm]);





  return (
  <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
      <SectionHeader title={t.dashTitle} sub={t.dashSub} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
  <div
    key={kpi.title}
    className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all"
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
      <kpi.icon className={kpi.color} size={24} />
    </div>

    <div className="text-xs text-[var(--sk-muted)]">
      {kpi.title}
    </div>

    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-2 ${kpi.color}`}>
      {fmt(kpi.value)}
    </div>
  </div>
))}
     
 </div>

 



<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">

  
<FormCard>
  <div className="flex justify-between items-center">
    <div>
      <div className="text-sm text-[var(--sk-muted)]">Top Crop</div>
      <div className="text-2xl font-bold text-green-400">
        {topCrop?.[0] || "--"}
      </div>
    </div>

    <Trophy className="text-yellow-400" size={34} />
  </div>
</FormCard>



<FormCard>
  <div className="flex justify-between items-center">
    <div>
      <div className="text-sm text-[var(--sk-muted)]">Best Tenant</div>
      <div className="text-xl font-bold text-blue-400">
        {bestTenant?.tenant || "--"}
      </div>
    </div>

    <Users className="text-blue-400" size={34} />
  </div>
</FormCard>
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.last5}</div>
          <div className="space-y-4">

  {recentAll.map((item) => (

    <div
  key={item.id}
  className="relative flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3  pl-8 border-l-2 border-green-500 pb-5"
>

  {/* Timeline Dot */}
  <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-green-500 border-4 border-[var(--sk-card)]" />

  <div className="flex items-center gap-3">

    <div className="text-2xl">
      {item.icon}
    </div>

    <div>
      <div className="font-semibold text-white text-sm sm:text-base break-words">
        {item.label}
      </div>

      <div className="text-xs text-gray-400">
        {item.detail || "--"}
      </div>

      <div className="text-[11px] text-gray-500">
        {item.date}
      </div>
    </div>

  </div>

  <div
    className={`font-bold ${
      item.amount >= 0
        ? "text-green-400"
        : "text-red-400"
    }`}
  >
    {item.amount >= 0 ? "+" : "-"}
    {fmt(Math.abs(item.amount))}
  </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.cropAnalytics}</div>
          {cropRows.map(([crop, values], index) => (
            <div key={crop} className="mb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[var(--sk-muted)] text-xs break-words">
                  {crop}
                </span>

                <span
                  className={`text-xs font-bold font-mono whitespace-nowrap flex-shrink-0 ${values.sale - values.expense >= 0
                    ? "text-green-400"
                    : "text-red-400"
                    }`}
                >
                  {values.sale - values.expense >= 0 ? "+" : ""}
                  {fmt(values.sale - values.expense)}
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

          <div className="font-semibold text-[var(--sk-text)] mb-4">
            Income vs Expense
          </div>

          <ResponsiveContainer width="100%" height={250}>

            <PieChart>

              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >

                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </FormCard>



        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">{t.trend}</div>
          <ResponsiveContainer width="100%" height={220}>
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
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(value) => fmt(value)} width={36} />
              <Tooltip contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 10, fontSize: 11 }} labelStyle={{ color: "var(--sk-muted)" }} formatter={(value: number, name: string) => [fmt(value), name.toUpperCase(),]} />
              <Legend />
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
