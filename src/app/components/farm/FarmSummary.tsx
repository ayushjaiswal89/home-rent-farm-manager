
"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { fmt } from "../../lib/utils";

import {
  FormCard,
  InputGroup,
  KpiBox,
  selectCls,
} from "../common/UI";

import { Lang } from "../../lib/types";

import {
  FARM_STRINGS,
  unitLabel,
} from "../../lib/farmI18n";

interface FarmSummaryProps {
  lang: Lang;

  totalExpense: number;
  totalSales: number;
  totalYield: number;
  profit: number;
  
  pieData: {
    name: string;
    value: number;
  }[];

  cropStats: {
    expense: number;
    sale: number;
    yieldQty: number;
    profit: number;
    yieldUnit?: string;
  };

  selectedCrop: string;
  setSelectedCrop: Dispatch<
    SetStateAction<string>
  >;

  crops: string[];

  chartData: {
    month: string;
    farm: number;
  }[];

  pieColors: string[];
}

export default function FarmSummary({
  lang,
  totalExpense,
  totalSales,
  totalYield,
  profit,
  pieData,
  chartData,
  pieColors,
  selectedCrop,
  setSelectedCrop,
  crops,
  cropStats,
}: FarmSummaryProps) {
  const farmT = FARM_STRINGS[lang];

  const isHi = lang === "hi";

  const text = {
    cropStatistics: isHi
      ? "फसल का विवरण"
      : "Crop Statistics",

    productionSummary: isHi
      ? "उत्पादन और बिक्री"
      : "Production & Sales",

    expense: isHi
      ? "कुल खर्च"
      : "Total Expense",

    production: isHi
      ? "उत्पादन"
      : "Production",

    sales: isHi
      ? "कुल बिक्री"
      : "Total Sales",

    profit: isHi
      ? "लाभ"
      : "Profit",

    noRecords: isHi
      ? "अभी कोई रिकॉर्ड नहीं है"
      : "No records found",

    expenseByCategory: isHi
      ? "खर्च का विवरण"
      : "Expense by Category",

    monthlyTrend: isHi
      ? "मासिक लाभ / हानि"
      : "Monthly Profit / Loss",

    netResult: isHi
      ? "नेट परिणाम"
      : "Net Result",

    positive: isHi
      ? "लाभ"
      : "Profit",

    negative: isHi
      ? "हानि"
      : "Loss",
  };

  /* --------------------------------
     Crop Names
  -------------------------------- */

  const getCropName = (
    crop: string
  ): string => {
    const cropMap: Record<
      string,
      string
    > =
      lang === "hi"
        ? {
            Wheat: "गेहूं",
            Rice: "धान",
            Soybean: "सोयाबीन",
            Cotton: "कपास",
            Mustard: "सरसों",
            Groundnut: "मूंगफली",
            Gram: "चना",
            Other: "अन्य",
          }
        : {
            Wheat: "Wheat",
            Rice: "Rice",
            Soybean: "Soybean",
            Cotton: "Cotton",
            Mustard: "Mustard",
            Groundnut: "Groundnut",
            Gram: "Gram",
            Other: "Other",
          };

    return cropMap[crop] ?? crop;
  };

  /* --------------------------------
     Production Unit
  -------------------------------- */

  const getProductionUnit = (
    unit?: string
  ): string => {
    if (!unit) {
      return lang === "hi"
        ? "Kg"
        : "Kg";
    }

    return unitLabel(lang, unit);
  };

  /* --------------------------------
     KPI Progress
  -------------------------------- */

  const expenseBarPct =
    Math.min(
      Math.max(
        (totalExpense / 100000) * 100,
        0
      ),
      100
    );

  const salesBarPct =
    Math.min(
      Math.max(
        (totalSales / 100000) * 100,
        0
      ),
      100
    );

  return (
    <div className="space-y-4">

      {/* =========================================
          MAIN KPI CARDS
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <KpiBox
          label={farmT.totalExpense}
          value={fmt(totalExpense)}
          bar
          barPct={expenseBarPct}
        />

        <KpiBox
          label={farmT.totalSales}
          value={fmt(totalSales)}
          bar
          barPct={salesBarPct}
        />

        <KpiBox
          label={text.profit}
          value={fmt(profit)}
          green={profit >= 0}
        />

        <KpiBox
          label={farmT.totalYield}
          value={`${totalYield.toFixed(2)} Kg`}
        />

      </div>

      {/* =========================================
          PROFIT SUMMARY
      ========================================= */}

      <div
        className="
          rounded-xl
          border
          border-[var(--sk-border)]
          bg-[var(--sk-card)]
          p-4
        "
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-[var(--sk-text)]">
              {isHi
                ? "फार्म का वित्तीय सारांश"
                : "Farm Financial Summary"}
            </div>

            <div className="mt-1 text-[10px] text-[var(--sk-faint)]">
              {isHi
                ? "कुल खर्च और बिक्री के आधार पर परिणाम"
                : "Result based on total expense and sales"}
            </div>
          </div>

          <div
            className={
              profit >= 0
                ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-500"
                : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-500"
            }
          >
            {profit >= 0
              ? `✓ ${text.positive}`
              : `⚠ ${text.negative}`}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3">
            <div className="text-[10px] text-[var(--sk-faint)]">
              {text.expense}
            </div>

            <div className="mt-1 text-base font-bold text-red-400">
              {fmt(totalExpense)}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3">
            <div className="text-[10px] text-[var(--sk-faint)]">
              {text.sales}
            </div>

            <div className="mt-1 text-base font-bold text-green-400">
              {fmt(totalSales)}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3">
            <div className="text-[10px] text-[var(--sk-faint)]">
              {text.netResult}
            </div>

            <div
              className={
                profit >= 0
                  ? "mt-1 text-base font-bold text-green-400"
                  : "mt-1 text-base font-bold text-red-400"
              }
            >
              {fmt(profit)}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================
          EXPENSE + CROP STATISTICS
      ========================================= */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

        {/* EXPENSE BY CATEGORY */}

        <FormCard>

          <div className="mb-3 text-xs font-bold text-[var(--sk-text)] sm:text-sm">
            {text.expenseByCategory}
          </div>

          {pieData.length > 0 ? (
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2">

              <div className="h-44 sm:h-48">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="var(--sk-card)"
                      strokeWidth={1}
                    >
                      {pieData.map(
                        (entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={
                              pieColors[
                                index %
                                  pieColors.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(
                        value:
                          | number
                          | string
                      ) => [
                        fmt(Number(value)),
                        text.expense,
                      ]}
                      contentStyle={{
                        background:
                          "var(--sk-card2)",
                        border:
                          "1px solid var(--sk-border2)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="space-y-2">

                {pieData.map(
                  (item, index) => {
                    const total =
                      pieData.reduce(
                        (sum, x) =>
                          sum + x.value,
                        0
                      );

                    const percentage =
                      total > 0
                        ? (
                            (item.value /
                              total) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            background:
                              pieColors[
                                index %
                                  pieColors.length
                              ],
                          }}
                        />

                        <span className="flex-1 text-[var(--sk-muted)]">
                          {item.name}
                        </span>

                        <span className="whitespace-nowrap font-mono text-[var(--sk-text2)]">
                          {fmt(item.value)}
                        </span>

                        <span className="w-12 text-right font-mono text-[var(--sk-faint)]">
                          ({percentage}%)
                        </span>
                      </div>
                    );
                  }
                )}

              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--sk-dim)]">
              {text.noRecords}
            </div>
          )}

        </FormCard>

        {/* CROP STATISTICS */}

        <FormCard>

          <div className="mb-3 text-xs font-bold text-[var(--sk-text)] sm:text-sm">
            {text.cropStatistics}
          </div>

          <InputGroup label={farmT.crop}>
            <select
              className={selectCls}
              value={selectedCrop}
              onChange={(e) =>
                setSelectedCrop(
                  e.target.value
                )
              }
            >
              {crops.map((crop) => (
                <option
                  key={crop}
                  value={crop}
                >
                  {getCropName(crop)}
                </option>
              ))}
            </select>
          </InputGroup>

          <div className="mt-4 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-4">

            <div className="mb-3 flex items-center gap-2">

              <span className="text-xl">
                🌾
              </span>

              <div>
                <div className="text-sm font-bold text-[var(--sk-text)]">
                  {getCropName(
                    selectedCrop
                  )}
                </div>

                <div className="text-[10px] text-[var(--sk-faint)]">
                  {text.productionSummary}
                </div>
              </div>

            </div>

            {/* Expense */}

            <div className="flex items-center justify-between border-b border-[var(--sk-border)] py-2 text-xs">
              <span className="text-[var(--sk-muted)]">
                💸 {text.expense}
              </span>

              <span className="font-semibold text-red-400">
                {fmt(
                  cropStats.expense
                )}
              </span>
            </div>

            {/* Production */}

            <div className="flex items-center justify-between border-b border-[var(--sk-border)] py-2 text-xs">

              <span className="text-[var(--sk-muted)]">
                🌾 {text.production}
              </span>

              <span className="font-semibold text-yellow-400">
                {cropStats.yieldQty.toFixed(2)}{" "}
                {getProductionUnit(
                  cropStats.yieldUnit
                )}
              </span>

            </div>

            {/* Sales */}

            <div className="flex items-center justify-between border-b border-[var(--sk-border)] py-2 text-xs">

              <span className="text-[var(--sk-muted)]">
                🛒 {text.sales}
              </span>

              <span className="font-semibold text-green-400">
                {fmt(
                  cropStats.sale
                )}
              </span>

            </div>

            {/* Profit */}

            <div className="flex items-center justify-between pt-3 text-xs">

              <span className="font-bold text-[var(--sk-text)]">
                📈 {text.profit}
              </span>

              <span
                className={
                  cropStats.profit >= 0
                    ? "font-bold text-green-400"
                    : "font-bold text-red-400"
                }
              >
                {fmt(
                  cropStats.profit
                )}
              </span>

            </div>

          </div>

        </FormCard>

      </div>
      {/* =========================================
          MONTHLY TREND
      ========================================= */}

      <FormCard>

        <div className="mb-1 text-xs font-bold text-[var(--sk-text)] sm:text-sm">
          {text.monthlyTrend}
        </div>

        <div className="mb-2 text-[10px] text-[var(--sk-faint)]">
          {isHi
            ? "बिक्री − खर्च"
            : "Sales − Expense"}
        </div>

        <div className="h-36 sm:h-40">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={chartData}
              barGap={4}
              margin={{
                top: 10,
                right: 5,
                left: 0,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--sk-grid)"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 9,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis hide />

              <Tooltip
                formatter={(
                  value:
                    | number
                    | string
                ) => {
                  const numericValue =
                    Number(value);

                  return [
                    fmt(
                      Math.abs(
                        numericValue
                      )
                    ),
                    numericValue >= 0
                      ? text.positive
                      : text.negative,
                  ];
                }}
                contentStyle={{
                  background:
                    "var(--sk-card2)",
                  border:
                    "1px solid var(--sk-border2)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />

              <Bar
                dataKey="farm"
                fill="#4ade80"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={32}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </FormCard>

    </div>
  );
}