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
  const isHi = lang === "hi";

  /* -------------------------------------------------------
     LANGUAGE TEXT
  ------------------------------------------------------- */

  const text = {
    totalBalance: isHi
      ? "कुल बैलेंस"
      : "Total Balance",

    homeExpense: isHi
      ? "घर का खर्च"
      : "Home Expense",

    rentIncome: isHi
      ? "किराए की आय"
      : "Rent Income",

    farmProfit: isHi
      ? "खेती का लाभ"
      : "Farm Profit",

    pendingRent: isHi
      ? "बाकी किराया"
      : "Pending Rent",

    monthIncome: isHi
      ? "इस महीने की आय"
      : "This Month Income",

    monthExpense: isHi
      ? "इस महीने का खर्च"
      : "This Month Expense",

    savings: isHi
      ? "बचत"
      : "Savings",

    topCrop: isHi
      ? "सबसे लाभदायक फसल"
      : "Top Crop",

    bestTenant: isHi
      ? "सबसे अधिक किराया देने वाला"
      : "Best Tenant",

    profit: isHi
      ? "लाभ"
      : "Profit",

    noRecent: isHi
      ? "हाल की कोई लेन-देन नहीं"
      : "No recent transactions",

    addTransaction: isHi
      ? "पहली लेन-देन जोड़ें।"
      : "Add your first transaction.",

    pendingTitle: isHi
      ? "बाकी किराया"
      : "Pending Rent",

    allRentDone: isHi
      ? "सभी किराया भुगतान पूरे हैं।"
      : "All rent payments are complete.",

    incomeExpense: isHi
      ? "आय बनाम खर्च"
      : "Income vs Expense",

    income: isHi
      ? "आय"
      : "Income",

    expense: isHi
      ? "खर्च"
      : "Expense",

    cropAnalytics: isHi
      ? "फसल विश्लेषण"
      : t.cropAnalytics || "Crop Analytics",

    noCropRecords: isHi
      ? "कोई फसल रिकॉर्ड नहीं"
      : "No crop records",

    trend: isHi
      ? "मासिक आय और खर्च"
      : t.trend || "Monthly Income & Expense",

    rentLegend: isHi
      ? "किराया आय"
      : t.rentInc || "Rent Income",

    farmLegend: isHi
      ? "खेती बिक्री"
      : t.farmProf || "Farm Sales",

    homeLegend: isHi
      ? "घर का खर्च"
      : t.homeExp || "Home Expense",

    rent: isHi
      ? "किराया"
      : "Rent",

    farm: isHi
      ? "खेती"
      : "Farm",

    home: isHi
      ? "घर"
      : "Home",

    received: isHi
      ? "जमा"
      : "Received",

    pending: isHi
      ? "बाकी"
      : "Pending",

    partial: isHi
      ? "आंशिक"
      : "Partial",

    noData: isHi
      ? "कोई डेटा नहीं"
      : "No Data",
  };

  /* -------------------------------------------------------
     TOTALS
  ------------------------------------------------------- */

  const homeTotal = useMemo(
    () =>
      home.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ),
    [home]
  );

  const rentTotal = useMemo(
    () =>
      rent
        .filter(
          (r) => r.status === "Received"
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.total || 0),
          0
        ),
    [rent]
  );

  const getExpenseAmount = (
    record: FarmRecord
  ) => {
    if (record.type !== "Expense") return 0;

    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);

    const calculatedAmount = quantity * price;

    // New records: Quantity × Rate
    if (calculatedAmount > 0) {
      return calculatedAmount;
    }

    // Old records: saved amount
    return Number(record.amount || 0);
  };

  const farmExpense = useMemo(
    () =>
      farm
        .filter(
          (r) => r.type === "Expense"
        )
        .reduce(
          (sum, item) =>
            sum + getExpenseAmount(item),
          0
        ),
    [farm]
  );

  /*
   * Sale amount:
   * New records -> amount
   * Older records -> quantity × price
   */

  const getSaleAmount = (
  record: FarmRecord
) => {
  if (record.type !== "Sale") return 0;

  const quantity = Number(record.quantity || 0);
  const price = Number(record.price || 0);

  const calculatedAmount = quantity * price;

  // New records: Quantity × Rate
  if (calculatedAmount > 0) {
    return calculatedAmount;
  }

  // Old records: saved amount
  return Number(record.amount || 0);
};

  const farmSale = useMemo(
    () =>
      farm
        .filter(
          (r) => r.type === "Sale"
        )
        .reduce(
          (sum, item) =>
            sum + getSaleAmount(item),
          0
        ),
    [farm]
  );

  const farmProfit =
    farmSale - farmExpense;

  const netBalance =
    rentTotal +
    farmProfit -
    homeTotal;

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

  /*
   * Partial payment:
   * show remainingAmount instead of full total.
   */

  const getRemainingRent = (
    record: RentRecord
  ) => {
    if (
      typeof record.remainingAmount ===
      "number"
    ) {
      return Math.max(
        0,
        record.remainingAmount
      );
    }

    if (record.status === "Received") {
      return 0;
    }

    return Number(record.total || 0);
  };

  const pendingAmount = useMemo(
    () =>
      pendingRent.reduce(
        (sum, r) =>
          sum + getRemainingRent(r),
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
        detail:
          r.note ||
          (isHi
            ? "घर का खर्च"
            : "Home Expense"),
        amount:
          -Number(r.amount || 0),
        id: `home-${r.id}`,
        icon: "🏠",
      })),

      ...rent.map((r) => ({
        date: r.date,
        label: r.tenant,
        detail:
          r.month ||
          (isHi
            ? "किराया"
            : "Rent"),
        amount:
          r.status === "Received"
            ? Number(r.total || 0)
            : 0,
        id: `rent-${r.id}`,
        icon: "🏢",
      })),

      ...farm
        .filter(
          (r) => r.type !== "Yield"
        )
        .map((r) => ({
          date: r.date,
          label: r.crop,
          detail:
            r.note ||
            (r.type === "Sale"
              ? isHi
                ? "फसल बिक्री"
                : "Farm Sale"
              : isHi
                ? "खेती खर्च"
                : "Farm Expense"),
          amount:
            r.type === "Sale"
              ? getSaleAmount(r)
              : -getExpenseAmount(r),
          id: `farm-${r.id}`,
          icon: "🌾",
        })),
    ];

    return records
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      )
      .slice(0, 5);
  }, [farm, home, rent, isHi]);

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

        if (
          record.type === "Expense"
        ) {
          acc[record.crop].expense +=
            getExpenseAmount(record);
        }

        if (
          record.type === "Sale"
        ) {
          acc[record.crop].sale +=
            getSaleAmount(record);
        }

        return acc;
      }, {}),
    [farm]
  );

  const cropRows = useMemo(
    () => Object.entries(cropMap),
    [cropMap]
  );

  /* -------------------------------------------------------
     TOP CROP
  ------------------------------------------------------- */

  const topCrop = useMemo(() => {
    let best:
      | [
        string,
        {
          expense: number;
          sale: number;
        }
      ]
      | undefined;

    for (const row of cropRows) {
      if (
        !best ||
        row[1].sale -
        row[1].expense >
        best[1].sale -
        best[1].expense
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
    let best:
      | RentRecord
      | undefined;

    for (const record of rent) {
      if (
        record.status !==
        "Received"
      ) {
        continue;
      }

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
     CURRENT DATE
  ------------------------------------------------------- */

  const currentDate = new Date();

  const currentMonth = String(
    currentDate.getMonth() + 1
  ).padStart(2, "0");

  const currentYear =
    currentDate.getFullYear();

  const currentYearMonth = `${currentYear}-${currentMonth}`;

  /* -------------------------------------------------------
     CURRENT MONTH INCOME
  ------------------------------------------------------- */

  const thisMonthIncome = useMemo(() => {
    const rentIncome = rent
      .filter(
        (r) =>
          r.status === "Received" &&
          r.date.startsWith(
            currentYearMonth
          )
      )
      .reduce(
        (sum, r) =>
          sum + Number(r.total || 0),
        0
      );

    const farmIncome = farm
      .filter(
        (r) =>
          r.type === "Sale" &&
          r.date.startsWith(
            currentYearMonth
          )
      )
      .reduce(
        (sum, r) =>
          sum + getSaleAmount(r),
        0
      );

    return (
      rentIncome + farmIncome
    );
  }, [
    rent,
    farm,
    currentYearMonth,
  ]);

  /* -------------------------------------------------------
     CURRENT MONTH EXPENSE
  ------------------------------------------------------- */

  const thisMonthExpense =
    useMemo(() => {
      const homeExpense = home
        .filter((h) =>
          h.date.startsWith(
            currentYearMonth
          )
        )
        .reduce(
          (sum, h) =>
            sum +
            Number(h.amount || 0),
          0
        );

      const farmExpenseAmount =
        farm
          .filter(
            (f) =>
              f.type === "Expense" &&
              f.date.startsWith(
                currentYearMonth
              )
          )
          .reduce(
            (sum, f) =>
              sum +
              getExpenseAmount(f),
            0
          );

      return (
        homeExpense +
        farmExpenseAmount
      );
    }, [
      home,
      farm,
      currentYearMonth,
    ]);

  const savings =
    thisMonthIncome -
    thisMonthExpense;

  /* -------------------------------------------------------
     KPI CARDS
  ------------------------------------------------------- */

  const kpis = useMemo(
    () => [
      {
        title: text.totalBalance,
        value: netBalance,
        color: "text-green-400",
        icon: Wallet,
      },
      {
        title: text.homeExpense,
        value: homeTotal,
        color: "text-red-400",
        icon: Home,
      },
      {
        title: text.rentIncome,
        value: rentTotal,
        color: "text-sky-400",
        icon: Building2,
      },
      {
        title: text.farmProfit,
        value: farmProfit,
        color:
          farmProfit >= 0
            ? "text-emerald-400"
            : "text-red-400",
        icon: Wheat,
      },
      {
        title: text.pendingRent,
        value: pendingAmount,
        color: "text-amber-400",
        icon: Clock3,
      },
      {
        title: text.monthIncome,
        value: thisMonthIncome,
        color: "text-cyan-400",
        icon: TrendingUp,
      },
      {
        title: text.monthExpense,
        value: thisMonthExpense,
        color: "text-rose-400",
        icon: TrendingDown,
      },
      {
        title: text.savings,
        value: savings,
        color:
          savings >= 0
            ? "text-green-400"
            : "text-red-400",
        icon: PiggyBank,
      },
    ],
    [
      text,
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
    const income =
      rentTotal + farmSale;

    const expense =
      homeTotal + farmExpense;

    if (income + expense === 0) {
      return [
        {
          name: text.noData,
          value: 1,
        },
      ];
    }

    return [
      {
        name: text.income,
        value: income,
      },
      {
        name: text.expense,
        value: expense,
      },
    ];
  }, [
    rentTotal,
    farmSale,
    homeTotal,
    farmExpense,
    text,
  ]);

  /* -------------------------------------------------------
     MONTH NAMES
  ------------------------------------------------------- */

  const monthNames = isHi
    ? [
      "जनवरी",
      "फ़रवरी",
      "मार्च",
      "अप्रैल",
      "मई",
      "जून",
      "जुलाई",
      "अगस्त",
      "सितंबर",
      "अक्टूबर",
      "नवंबर",
      "दिसंबर",
    ]
    : [
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

  /* -------------------------------------------------------
     YEARLY TREND
  ------------------------------------------------------- */

  const trendData = useMemo(() => {
    return monthNames.map(
      (monthName, index) => {
        const month = String(
          index + 1
        ).padStart(2, "0");

        const rentIncome = rent
          .filter(
            (r) =>
              r.status ===
              "Received" &&
              r.date.startsWith(
                `${currentYear}-${month}`
              )
          )
          .reduce(
            (sum, r) =>
              sum +
              Number(
                r.total || 0
              ),
            0
          );

        const farmIncome = farm
          .filter(
            (f) =>
              f.type === "Sale" &&
              f.date.startsWith(
                `${currentYear}-${month}`
              )
          )
          .reduce(
            (sum, f) =>
              sum +
              getSaleAmount(f),
            0
          );

        const homeExpense = home
          .filter(
            (h) =>
              h.date.startsWith(
                `${currentYear}-${month}`
              )
          )
          .reduce(
            (sum, h) =>
              sum +
              Number(
                h.amount || 0
              ),
            0
          );

        const farmExpenseAmount =
          farm
            .filter(
              (f) =>
                f.type ===
                "Expense" &&
                f.date.startsWith(
                  `${currentYear}-${month}`
                )
            )
            .reduce(
              (sum, f) =>
                sum +
                getExpenseAmount(f),
              0
            );

        return {
          month: monthName,
          rent: rentIncome,
          farm: farmIncome,
          home:
            homeExpense +
            farmExpenseAmount,
        };
      }
    );
  }, [
    home,
    rent,
    farm,
    currentYear,
    monthNames,
  ]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">

      <SectionHeader
        title={
          t.dashTitle ||
          (isHi
            ? "डैशबोर्ड"
            : "Dashboard")
        }
        sub={
          t.dashSub ||
          (isHi
            ? "आपके घर, किराया और खेती की पूरी जानकारी एक जगह"
            : "Overview of your home, rent and farm management")
        }
      />

      {/* ---------------------------------------------------
          KPI
      --------------------------------------------------- */}

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

                  <div className="text-xs text-[var(--sk-muted)] break-words">
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

      {/* ---------------------------------------------------
          TOP CROP + BEST TENANT
      --------------------------------------------------- */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">

        {/* TOP CROP */}

        <FormCard>

          <div className="flex justify-between items-center gap-3">

            <div className="min-w-0">

              <div className="text-sm text-[var(--sk-muted)]">
                {text.topCrop}
              </div>

              <div className="text-2xl font-bold text-green-400 break-words">
                {topCrop?.[0] || "--"}
              </div>

              {topCrop && (
                <div
                  className={`text-xs mt-1 ${topCrop[1].sale -
                    topCrop[1].expense >=
                    0
                    ? "text-green-400"
                    : "text-red-400"
                    }`}
                >
                  {text.profit}:{" "}
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

        {/* BEST TENANT */}

        <FormCard>

          <div className="flex justify-between items-center gap-3">

            <div className="min-w-0">

              <div className="text-sm text-[var(--sk-muted)]">
                {text.bestTenant}
              </div>

              <div className="text-xl font-bold text-blue-400 break-words">
                {bestTenant?.tenant ||
                  "--"}
              </div>

              {bestTenant && (
                <div className="text-xs text-[var(--sk-muted)] mt-1">
                  {fmt(
                    bestTenant.total
                  )}
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

      {/* ---------------------------------------------------
          RECENT + PENDING
      --------------------------------------------------- */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

        {/* RECENT */}

        <FormCard>

          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {t.last5 ||
              (isHi
                ? "हाल की 5 लेन-देन"
                : "Last 5 Transactions")}
          </div>

          <div className="space-y-4">

            {recentAll.length === 0 ? (

              <div className="text-center py-8 text-[var(--sk-dim)] text-sm">
                {text.noRecent}
                <div className="text-xs mt-1">
                  {text.addTransaction}
                </div>
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
                        {item.detail ||
                          "--"}
                      </div>

                      <div className="text-[11px] text-[var(--sk-dim)]">
                        {item.date}
                      </div>

                    </div>

                  </div>

                  <div
                    className={`font-bold whitespace-nowrap ${item.amount >= 0
                      ? "text-green-400"
                      : "text-red-400"
                      }`}
                  >
                    {item.amount >= 0
                      ? "+"
                      : "-"}
                    {fmt(
                      Math.abs(
                        item.amount
                      )
                    )}
                  </div>

                </div>
              ))

            )}

          </div>

        </FormCard>

        {/* PENDING RENT */}

        <FormCard>

          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3 flex items-center gap-2">

            <AlertCircle
              size={14}
              className="text-amber-400"
            />

            {text.pendingTitle}

          </div>

          {pendingRent.length === 0 ? (

            <div className="text-center py-4 text-[var(--sk-dim)] text-xs">
              {text.allRentDone}
            </div>

          ) : (

            <div className="space-y-0">

              {pendingRent.map((r) => {

                const remaining =
                  getRemainingRent(r);

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0"
                  >

                    <div className="min-w-0">

                      <div className="text-[var(--sk-text2)] text-sm font-semibold break-words">
                        {r.tenant}
                      </div>

                      <div className="text-[var(--sk-dim)] text-xs break-words">
                        {r.month} ·{" "}
                        {r.note ||
                          "—"}
                      </div>

                    </div>

                    <div className="text-right shrink-0">

                      <div className="text-amber-400 font-bold font-mono text-sm">
                        {fmt(remaining)}
                      </div>

                      <StatusBadge
                        status={r.status}
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </FormCard>

      </div>

      {/* ---------------------------------------------------
          ANALYTICS
      --------------------------------------------------- */}

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">

        {/* CROP ANALYTICS */}

        <FormCard>

          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {text.cropAnalytics}
          </div>

          {cropRows.length === 0 ? (

            <div className="text-center py-8 text-[var(--sk-dim)]">
              {text.noCropRecords}
            </div>

          ) : (

            cropRows.map(
              ([crop, values]) => {
                const profit =
                  values.sale -
                  values.expense;

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
                        className={`text-xs font-bold font-mono whitespace-nowrap ${profit >= 0
                          ? "text-green-400"
                          : "text-red-400"
                          }`}
                      >
                        {profit >= 0
                          ? "+"
                          : ""}
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
              }
            )

          )}

        </FormCard>

        {/* PIE CHART */}

        <FormCard>

          <div className="font-semibold text-[var(--sk-text)] mb-4">
            {text.incomeExpense}
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

                {pieData.map(
                  (entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={
                        pieData.length ===
                          1
                          ? "#64748b"
                          : PIE_COLORS[
                          index
                          ]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip
                formatter={(value) =>
                  fmt(Number(value))
                }
              />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </FormCard>

        {/* TREND */}

        <FormCard>

          <div className="font-semibold text-[var(--sk-text)] text-sm mb-3">
            {text.trend} ({currentYear})
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
                  color:
                    "var(--sk-muted)",
                }}
                formatter={(value, name) => [
                  fmt(Number(value)),
                  name === "rent"
                    ? text.rentLegend
                    : name === "farm"
                      ? text.farmLegend
                      : text.homeLegend,
                ]}
              />

              <Legend
                formatter={(value) =>
                  value === "rent"
                    ? text.rentLegend
                    : value === "farm"
                      ? text.farmLegend
                      : text.homeLegend
                }
              />

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

          {/* CUSTOM LEGEND */}

          <div className="flex flex-wrap gap-4 justify-center mt-1 text-[var(--sk-faint)] text-xs">

            {[
              [
                "#60a5fa",
                text.rentLegend,
              ],
              [
                "#4ade80",
                text.farmLegend,
              ],
              [
                "#f87171",
                text.homeLegend,
              ],
            ].map(
              ([color, label]) => (
                <div
                  key={String(label)}
                  className="flex items-center gap-1"
                >

                  <span
                    className="w-3 h-0.5 rounded inline-block"
                    style={{
                      background:
                        color,
                    }}
                  />

                  {label}

                </div>
              )
            )}

          </div>

        </FormCard>

      </div>
    </div>
  );
}
