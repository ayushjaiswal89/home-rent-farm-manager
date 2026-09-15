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

import {
  Area,
  AreaChart,
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

import {
  FarmRecord,
  HomeExpense,
  Lang,
  RentRecord,
} from "../../lib/types";

import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import {
  FormCard,
  SectionHeader,
  StatusBadge,
} from "../common/UI";

const PIE_COLORS = ["#22c55e", "#ef4444"];

interface DashboardSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

interface RecentItem {
  date: string;
  label: string;
  detail: string;
  amount: number;
  id: string;
  icon: string;
}

export function DashboardSection({
  home,
  rent,
  farm,
  lang,
}: DashboardSectionProps) {
  const t = STRINGS[lang];

  /* -------------------------------------------------------
     TOTALS
  ------------------------------------------------------- */

  const homeTotal = useMemo(
    () =>
      home.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [home]
  );

  const rentTotal = useMemo(
    () =>
      rent
        .filter((r) => r.status === "Received")
        .reduce(
          (sum, item) => sum + Number(item.total || 0),
          0
        ),
    [rent]
  );

  const farmExpense = useMemo(
    () =>
      farm
        .filter((r) => r.type === "Expense")
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
    [farm]
  );

  const farmSale = useMemo(
    () =>
      farm
        .filter((r) => r.type === "Sale")
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
    [farm]
  );

  const farmProfit = farmSale - farmExpense;

  const netBalance = rentTotal + farmProfit - homeTotal;

  /* -------------------------------------------------------
     PENDING RENT
  ------------------------------------------------------- */

  const pendingRent = useMemo(
    () =>
      rent.filter(
        (r) =>
          r.status === "Pending" ||
          r.status === "Partial"
      ),
    [rent]
  );

  const pendingAmount = useMemo(
    () =>
      pendingRent.reduce(
        (sum, r) => sum + Number(r.total || 0),
        0
      ),
    [pendingRent]
  );

  /* -------------------------------------------------------
     RECENT TRANSACTIONS
  ------------------------------------------------------- */

  const recentAll = useMemo<RecentItem[]>(() => {
    const records: RecentItem[] = [
      ...home.map((r) => ({
        date: r.date,
        label: r.category,
        detail: r.note,
        amount: -Number(r.amount || 0),
        id: `home-${r.id}`,
        icon: "🏠",
      })),

      ...rent.map((r) => ({
        date: r.date,
        label: r.tenant,
        detail: r.month,
        amount:
          r.status === "Received"
            ? Number(r.total || 0)
            : 0,
        id: `rent-${r.id}`,
        icon: "🏢",
      })),

      ...farm
        .filter((r) => r.type !== "Yield")
        .map((r) => ({
          date: r.date,
          label: r.crop,
          detail: r.note,
          amount:
            r.type === "Sale"
              ? Number(r.amount || 0)
              : -Number(r.amount || 0),
          id: `farm-${r.id}`,
          icon: "🌾",
        })),
    ];

    return records
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      )
      .slice(0, 5);
  }, [farm, home, rent]);

  /* -------------------------------------------------------
     CROP ANALYTICS
  ------------------------------------------------------- */

  const cropMap = useMemo(
    () =>
      farm.reduce<
        Record<
          string,
          {
            expense: number;
            sale: number;
          }
        >
      >((acc, record) => {
        if (!acc[record.crop]) {
          acc[record.crop] = {
            expense: 0,
            sale: 0,
          };
        }

        if (record.type === "Expense") {
          acc[record.crop].expense += Number(
            record.amount || 0
          );
        }

        if (record.type === "Sale") {
          acc[record.crop].sale += Number(
            record.amount || 0
          );
        }

        return acc;
      }, {}),
    [farm]
  );

  const cropRows = useMemo(
    () => Object.entries(cropMap),
    [cropMap]
  );

  const topCrop = useMemo(() => {
    let best:
      | [string, { expense: number; sale: number }]
      | undefined;

    for (const row of cropRows) {
      if (
        !best ||
        row[1].sale - row[1].expense >
          best[1].sale - best[1].expense
      ) {
        best = row;
      }
    }

    return best;
  }, [cropRows]);

  /* -------------------------------------------------------
     BEST TENANT
  ------------------------------------------------------- */

  const bestTenant = useMemo(() => {
    let best: RentRecord | undefined;

    for (const record of rent) {
      if (record.status !== "Received") continue;

      if (
        !best ||
        Number(record.total || 0) >
          Number(best.total || 0)
      ) {
        best = record;
      }
    }

    return best;
  }, [rent]);

  /* -------------------------------------------------------
     CURRENT MONTH
  ------------------------------------------------------- */

  const currentMonth = useMemo(
    () => new Date().toISOString().slice(0, 7),
    []
  );

  const thisMonthIncome = useMemo(() => {
    const rentIncome = rent
      .filter(
        (r) =>
          r.status === "Received" &&
          r.date.startsWith(currentMonth)
      )
      .reduce(
        (sum, r) => sum + Number(r.total || 0),
        0
      );

    const farmIncome = farm
      .filter(
        (r) =>
          r.type === "Sale" &&
          r.date.startsWith(currentMonth)
      )
      .reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
      );

    return rentIncome + farmIncome;
  }, [rent, farm, currentMonth]);

  const thisMonthExpense = useMemo(() => {
    const homeExpense = home
      .filter((h) =>
        h.date.startsWith(currentMonth)
      )
      .reduce(
        (sum, h) => sum + Number(h.amount || 0),
        0
      );

    const farmExpenseAmount = farm
      .filter(
        (f) =>
          f.type === "Expense" &&
          f.date.startsWith(currentMonth)
      )
      .reduce(
        (sum, f) => sum + Number(f.amount || 0),
        0
      );

    return homeExpense + farmExpenseAmount;
  }, [home, farm, currentMonth]);

  const savings =
    thisMonthIncome - thisMonthExpense;

  /* -------------------------------------------------------
     KPI CARDS
  ------------------------------------------------------- */

  const kpis = useMemo(
    () => [
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
        color:
          farmProfit >= 0
            ? "text-emerald-400"
            : "text-red-400",
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
        color:
          savings >= 0
            ? "text-green-400"
            : "text-red-400",
        icon: PiggyBank,
      },
    ],
    [
      netBalance,
      homeTotal,
      rentTotal,
      farmProfit,
      pendingAmount,
      thisMonthIncome,
      thisMonthExpense,
      savings,
    ]
  );

  /* -------------------------------------------------------
     PIE DATA
  ------------------------------------------------------- */

  const pieData = useMemo(() => {
    const income = rentTotal + farmSale;
    const expense = homeTotal + farmExpense;

    if (income + expense === 0) {
      return [
        {
          name: "No Data",
          value: 1,
        },
      ];
    }

    return [
      {
        name: "Income",
        value: income,
      },
      {
        name: "Expense",
        value: expense,
      },
    ];
  }, [
    rentTotal,
    farmSale,
    homeTotal,
    farmExpense,
  ]);

  /* -------------------------------------------------------
     YEARLY TREND
  ------------------------------------------------------- */

  const trendData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((monthName, index) => {
      const month = String(index + 1).padStart(
        2,
        "0"
      );

      const rentIncome = rent
        .filter(
          (r) =>
            r.status === "Received" &&
            r.date.split("-")[1] === month
        )
        .reduce(
          (sum, r) => sum + Number(r.total || 0),
          0
        );

      const farmIncome = farm
        .filter(
          (f) =>
            f.type === "Sale" &&
            f.date.split("-")[1] === month
        )
        .reduce(
          (sum, f) => sum + Number(f.amount || 0),
          0
        );

      const homeExpense = home
        .filter(
          (h) =>
            h.date.split("-")[1] === month
        )
        .reduce(
          (sum, h) => sum + Number(h.amount || 0),
          0
        );

      return {
        month: monthName,
        rent: rentIncome,
        farm: farmIncome,
        home: homeExpense,
      };
    });
  }, [home, rent, farm]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
      <SectionHeader
        title={t.dashTitle}
        sub={t.dashSub}
      />

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.title}
              className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon
                    className={kpi.color}
                    size={24}
                  />
                </div>

                <div className="text-right min-w-0">
                  <div className="text-xs text-[var(--sk-muted)] truncate">
                    {kpi.title}
                  </div>

                  <div
                    className={`text-xl sm:text-2xl lg:text-3xl font-bold ${kpi.color} break-words`}
                  >
                    {fmt(kpi.value)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOP CROP + BEST TENANT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <FormCard>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[var(--sk-muted)]">
                Top Crop
              </div>

              <div className="text-2xl font-bold text-green-400 break-words">
                {topCrop?.[0] || "--"}
              </div>

              {topCrop && (
                <div
                  className={`text-xs mt-1 ${
                    topCrop[1].sale -
                      topCrop[1].expense >=
                    0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  Profit:{" "}
                  {fmt(
                    topCrop[1].sale -
                      topCrop[1].expense
                  )}
                </div>
              )}
            </div>

            <Trophy
              className="text-yellow-400 shrink-0"
              size={34}
            />
          </div>
        </FormCard>

        <FormCard>
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="text-sm text-[var(--sk-muted)]">
                Best Tenant
              </div>

              <div className="text-xl font-bold text-blue-400 break-words">
                {bestTenant?.tenant || "--"}
              </div>

              {bestTenant && (
                <div className="text-xs text-[var(--sk-muted)] mt-1">
                  {fmt(bestTenant.total)}
                </div>
              )}
            </div>

            <Users
              className="text-blue-400 shrink-0"
              size={34}
            />
          </div>
        </FormCard>
      </div>

      {/* RECENT + PENDING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {t.last5}
          </div>

          <div className="space-y-4">
            {recentAll.length === 0 ? (
              <div className="text-center py-8 text-[var(--sk-dim)] text-sm">
                No recent transactions
              </div>
            ) : (
              recentAll.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pl-8 border-l-2 border-green-500 pb-5 last:pb-0"
                >
                  <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-green-500 border-4 border-[var(--sk-card)]" />

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--sk-text)] text-sm sm:text-base break-words">
                        {item.label}
                      </div>

                      <div className="text-xs text-[var(--sk-muted)] break-words">
                        {item.detail || "--"}
                      </div>

                      <div className="text-[11px] text-[var(--sk-dim)]">
                        {item.date}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-bold whitespace-nowrap ${
                      item.amount >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {item.amount >= 0 ? "+" : "-"}
                    {fmt(Math.abs(item.amount))}
                  </div>
                </div>
              ))
            )}
          </div>
        </FormCard>

        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3 flex items-center gap-2">
            <AlertCircle
              size={14}
              className="text-amber-400"
            />
            {t.pendingAlert}
          </div>

          {pendingRent.length === 0 ? (
            <div className="text-center py-4 text-[var(--sk-dim)] text-xs">
              {t.allRentDone}
            </div>
          ) : (
            <div className="space-y-0">
              {pendingRent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-[var(--sk-text2)] text-sm font-semibold break-words">
                      {r.tenant}
                    </div>

                    <div className="text-[var(--sk-dim)] text-xs break-words">
                      {r.month} · {r.note || "—"}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-amber-400 font-bold font-mono text-sm">
                      {fmt(r.total)}
                    </div>

                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormCard>
      </div>

      {/* ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
        {/* Crop Analytics */}
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {t.cropAnalytics}
          </div>

          {cropRows.length === 0 ? (
            <div className="text-center py-8 text-[var(--sk-dim)]">
              {lang === "hi"
                ? "कोई फसल रिकॉर्ड नहीं"
                : "No crop records"}
            </div>
          ) : (
            cropRows.map(([crop, values]) => {
              const profit =
                values.sale - values.expense;

              return (
                <div
                  key={crop}
                  className="mb-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[var(--sk-muted)] text-xs break-words">
                      {crop}
                    </span>

                    <span
                      className={`text-xs font-bold font-mono whitespace-nowrap ${
                        profit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {profit >= 0 ? "+" : ""}
                      {fmt(profit)}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <div className="bg-red-400/20 rounded-full h-1.5 flex-1 overflow-hidden">
                      <div
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            (values.expense /
                              50000) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="bg-green-400/20 rounded-full h-1.5 flex-1 overflow-hidden">
                      <div
                        className="bg-green-400 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            (values.sale /
                              50000) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </FormCard>

        {/* Pie Chart */}
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] mb-4">
            Income vs Expense
          </div>

          <ResponsiveContainer
            width="100%"
            height={250}
          >
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
                    key={`${entry.name}-${index}`}
                    fill={
                      pieData.length === 1
                        ? "#64748b"
                        : PIE_COLORS[index]
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: number) =>
                  fmt(Number(value))
                }
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </FormCard>

        {/* Trend */}
        <FormCard>
          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {t.trend}
          </div>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <AreaChart data={trendData}>
              <defs>
                <linearGradient
                  id="gRent"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#60a5fa"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#60a5fa"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="gFarm"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#4ade80"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#4ade80"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--sk-grid)"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  fmt(Number(value))
                }
                width={45}
              />

              <Tooltip
                contentStyle={{
                  background:
                    "var(--sk-card2)",
                  border:
                    "1px solid var(--sk-border2)",
                  borderRadius: 10,
                  fontSize: 11,
                }}
                labelStyle={{
                  color: "var(--sk-muted)",
                }}
                formatter={(
                  value: number,
                  name: string
                ) => [
                  fmt(Number(value)),
                  name.toUpperCase(),
                ]}
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="rent"
                stroke="#60a5fa"
                fill="url(#gRent)"
                strokeWidth={2}
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="farm"
                stroke="#4ade80"
                fill="url(#gFarm)"
                strokeWidth={2}
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="home"
                stroke="#f87171"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-4 justify-center mt-1 text-[var(--sk-faint)] text-xs">
            {[
              ["#60a5fa", t.rentInc],
              ["#4ade80", t.farmProf],
              ["#f87171", t.homeExp],
            ].map(([color, label]) => (
              <div
                key={String(label)}
                className="flex items-center gap-1"
              >
                <span
                  className="w-3 h-0.5 rounded inline-block"
                  style={{
                    background: color,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </FormCard>
      </div>
    </div>
  );
}