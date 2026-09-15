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
import { FARM_STRINGS } from "../../lib/farmI18n";

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
  };

  selectedCrop: string;
  setSelectedCrop: Dispatch<SetStateAction<string>>;

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

  const text = {
    cropStatistics:
      lang === "hi" ? "फसल का विवरण" : "Crop Statistics",

    yieldSummary:
      lang === "hi" ? "उत्पादन सारांश" : "Yield Summary",

    expense:
      lang === "hi" ? "खर्च" : "Expense",

    yield:
      lang === "hi" ? "उत्पादन" : "Yield",

    sales:
      lang === "hi" ? "बिक्री" : "Sales",

    profit:
      lang === "hi" ? "लाभ" : "Profit",

    noRecords:
      lang === "hi"
        ? "अभी कोई रिकॉर्ड नहीं है"
        : "No records found",

    monthlyTrend:
      lang === "hi"
        ? "मासिक ट्रेंड"
        : "Monthly Trend (Expense)",
  };

  /* --------------------------------
     Crop Names
  -------------------------------- */

  const getCropName = (crop: string): string => {
    const cropMap: Record<string, string> =
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
     KPI progress
  -------------------------------- */

  const expenseBarPct = Math.min(
    Math.max((totalExpense / 100000) * 100, 0),
    100
  );

  const salesBarPct = Math.min(
    Math.max((totalSales / 100000) * 100, 0),
    100
  );

  return (
    <div className="space-y-3">

      {/* =========================================
          KPI CARDS
      ========================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">

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
          PIE + CROP STATISTICS
      ========================================= */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-4
        "
      >

        {/* =====================================
            EXPENSE BY CATEGORY
        ===================================== */}

        <FormCard>

          <div
            className="
              text-xs
              sm:text-sm
              font-bold
              text-[var(--sk-text)]
              mb-2
            "
          >
            {farmT.expenseByCategory}
          </div>

          {pieData.length > 0 ? (
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                items-center
                gap-2
              "
            >

              {/* Pie */}

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

                      {pieData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={
                            pieColors[
                              index % pieColors.length
                            ]
                          }
                        />
                      ))}

                    </Pie>

                    <Tooltip
                      formatter={(value: number | string) => [
                        fmt(Number(value)),
                        text.expense,
                      ]}
                      contentStyle={{
                        background: "var(--sk-card2)",
                        border:
                          "1px solid var(--sk-border2)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>


              {/* Category List */}

              <div className="space-y-2">

                {pieData.map((item, index) => {

                  const total = pieData.reduce(
                    (sum, x) => sum + x.value,
                    0
                  );

                  const percentage =
                    total > 0
                      ? ((item.value / total) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="
                        flex
                        items-center
                        gap-2
                        text-xs
                      "
                    >

                      <span
                        className="
                          w-2.5
                          h-2.5
                          rounded-full
                          shrink-0
                        "
                        style={{
                          background:
                            pieColors[
                              index % pieColors.length
                            ],
                        }}
                      />

                      <span
                        className="
                          text-[var(--sk-muted)]
                          flex-1
                        "
                      >
                        {item.name}
                      </span>

                      <span
                        className="
                          text-[var(--sk-text2)]
                          font-mono
                          whitespace-nowrap
                        "
                      >
                        {fmt(item.value)}
                      </span>

                      <span
                        className="
                          text-[var(--sk-faint)]
                          font-mono
                          w-12
                          text-right
                        "
                      >
                        ({percentage}%)
                      </span>

                    </div>
                  );
                })}

              </div>

            </div>
          ) : (
            <div
              className="
                text-[var(--sk-dim)]
                text-xs
                text-center
                py-8
              "
            >
              {text.noRecords}
            </div>
          )}

        </FormCard>


        {/* =====================================
            CROP STATISTICS
        ===================================== */}

        <FormCard>

          <div
            className="
              text-xs
              sm:text-sm
              font-bold
              text-[var(--sk-text)]
              mb-2
            "
          >
            {text.cropStatistics}
          </div>


          <InputGroup label={farmT.crop}>

            <select
              className={selectCls}
              value={selectedCrop}
              onChange={(e) =>
                setSelectedCrop(e.target.value)
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


          <div
            className="
              text-[10px]
              text-[var(--sk-faint)]
              mt-2
              mb-2
            "
          >
            {text.yieldSummary}
          </div>


          <div
            className="
              rounded-lg
              border
              border-[var(--sk-border)]
              bg-[var(--sk-card2)]
              px-3
              py-2.5
            "
          >

            {/* Crop Name */}

            <div
              className="
                text-sm
                font-bold
                mb-2
                text-[var(--sk-text)]
              "
            >
              🌾 {getCropName(selectedCrop)}
            </div>


            {/* Expense */}

            <div
              className="
                flex
                justify-between
                items-center
                py-1
                text-xs
              "
            >

              <span>
                {text.expense}
              </span>

              <span
                className="
                  text-red-400
                  font-semibold
                "
              >
                {fmt(cropStats.expense)}
              </span>

            </div>


            {/* Yield */}

            <div
              className="
                flex
                justify-between
                items-center
                py-1
                text-xs
              "
            >

              <span>
                {text.yield}
              </span>

              <span
                className="
                  text-yellow-400
                  font-semibold
                "
              >
                {cropStats.yieldQty.toFixed(2)} Kg
              </span>

            </div>


            {/* Sales */}

            <div
              className="
                flex
                justify-between
                items-center
                py-1
                text-xs
              "
            >

              <span>
                {text.sales}
              </span>

              <span
                className="
                  text-green-400
                  font-semibold
                "
              >
                {fmt(cropStats.sale)}
              </span>

            </div>


            {/* Profit */}

            <div
              className="
                flex
                justify-between
                items-center
                border-t
                border-white/10
                mt-1
                pt-2
                text-xs
              "
            >

              <span className="font-bold">
                {text.profit}
              </span>

              <span
                className={
                  cropStats.profit >= 0
                    ? "text-green-400 font-bold"
                    : "text-red-400 font-bold"
                }
              >
                {fmt(cropStats.profit)}
              </span>

            </div>

          </div>

        </FormCard>

      </div>


      {/* =========================================
          MONTHLY TREND
      ========================================= */}

      <FormCard>

        <div
          className="
            text-xs
            sm:text-sm
            font-bold
            text-[var(--sk-text)]
            mb-1
          "
        >
          {text.monthlyTrend}
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

              <YAxis
                hide
              />

              <Tooltip
                formatter={(value: number | string) => [
                  fmt(Number(value)),
                  text.expense,
                ]}
                contentStyle={{
                  background: "var(--sk-card2)",
                  border:
                    "1px solid var(--sk-border2)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />

              <Bar
                dataKey="farm"
                fill="#4ade80"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </FormCard>

    </div>
  );
}