"use client";

import { useCallback, useMemo, useState } from "react";

import type { FarmRecord, Lang } from "../../lib/types";
import { FARM_STRINGS } from "../../lib/farmI18n";

import { SectionHeader } from "../common/UI";
import { FarmForm } from "../farm/FarmForm";
import { FarmTable } from "../farm/FarmTable";
import FarmSummary from "../farm/FarmSummary";

interface FarmSectionProps {
  records: FarmRecord[];
  setRecords: React.Dispatch<
    React.SetStateAction<FarmRecord[]>
  >;
  lang: Lang;
}

/*
 * ---------------------------------------------------------
 * CHART COLORS
 * ---------------------------------------------------------
 */

const PIE_COLORS = [
  "#4ade80",
  "#f59e0b",
  "#f87171",
  "#818cf8",
  "#38bdf8",
  "#a78bfa",
];

/*
 * ---------------------------------------------------------
 * MONTHS
 * ---------------------------------------------------------
 */

const MONTHS = [
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

/*
 * ---------------------------------------------------------
 * DEFAULT CROPS
 * ---------------------------------------------------------
 */

const DEFAULT_CROPS = [
  "Wheat",
  "Rice",
  "Soybean",
  "Cotton",
  "Mustard",
  "Groundnut",
  "Gram",
  "Other",
];

/*
 * ---------------------------------------------------------
 * FARM SECTION
 * ---------------------------------------------------------
 */

export function FarmSection({
  records,
  setRecords,
  lang,
}: FarmSectionProps) {
  const farmT = FARM_STRINGS[lang];

  /*
   * -------------------------------------------------------
   * TODAY
   * -------------------------------------------------------
   */

  const today = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  /*
   * -------------------------------------------------------
   * EDITING RECORD
   * -------------------------------------------------------
   */

  const [editingRecord, setEditingRecord] =
    useState<FarmRecord | null>(null);

  /*
   * -------------------------------------------------------
   * FILTERS
   * -------------------------------------------------------
   */

  const [cropSearch, setCropSearch] =
    useState("");

  const [selectedCrop, setSelectedCrop] =
    useState("Wheat");

  const [typeFilter, setTypeFilter] =
    useState<
      "all" | FarmRecord["type"]
    >("all");

  const [dateFilter, setDateFilter] =
    useState<
      "all" | "today" | "month" | "year"
    >("all");

  /*
   * -------------------------------------------------------
   * FILTERED RECORDS
   * -------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    const search = cropSearch
      .trim()
      .toLowerCase();

    return records.filter((record) => {
      const cropMatch =
        record.crop
          .toLowerCase()
          .includes(search) ||
        (record.note ?? "")
          .toLowerCase()
          .includes(search) ||
        (record.field ?? "")
          .toLowerCase()
          .includes(search);

      const typeMatch =
        typeFilter === "all"
          ? true
          : record.type === typeFilter;

      let dateMatch = true;

      switch (dateFilter) {
        case "today":
          dateMatch =
            record.date === today;
          break;

        case "month":
          dateMatch =
            record.date.startsWith(month);
          break;

        case "year":
          dateMatch =
            record.date.startsWith(year);
          break;

        default:
          dateMatch = true;
      }

      return (
        cropMatch &&
        typeMatch &&
        dateMatch
      );
    });
  }, [
    records,
    cropSearch,
    typeFilter,
    dateFilter,
    today,
  ]);
  /*
 * -------------------------------------------------------
 * EXPENSE AMOUNT
 * -------------------------------------------------------
 */

  const getExpenseAmount = useCallback(
    (record: FarmRecord) => {
      if (record.type !== "Expense") {
        return 0;
      }

      const quantity = Number(
        record.quantity || 0
      );

      const price = Number(
        record.price || 0
      );

      // New Expense:
      // Quantity × Rate = Total Expense
      const calculatedAmount =
        quantity * price;

      // Old records:
      // If quantity/rate are not available,
      // use the old saved amount.
      if (calculatedAmount > 0) {
        return calculatedAmount;
      }

      return Number(
        record.amount || 0
      );
    },
    []
  );

  /*
 * -------------------------------------------------------
 * SALE AMOUNT
 * -------------------------------------------------------
 */

  const getSaleAmount = useCallback(
    (record: FarmRecord) => {
      if (record.type !== "Sale") {
        return 0;
      }

      const quantity = Number(
        record.quantity || 0
      );

      const price = Number(
        record.price || 0
      );

      // New Sale:
      // Quantity × Rate = Total Sale
      const calculatedAmount =
        quantity * price;

      // Old records:
      // If quantity/rate are not available,
      // use the old saved amount.
      if (calculatedAmount > 0) {
        return calculatedAmount;
      }

      return Number(
        record.amount || 0
      );
    },
    []
  );
  /*
   * -------------------------------------------------------
   * TOTAL EXPENSE
   * -------------------------------------------------------
   */

  const totalExpense = useMemo(
    () =>
      filteredRecords
        .filter(
          (record) =>
            record.type === "Expense"
        )
        .reduce(
          (sum, record) =>
            sum + getExpenseAmount(record),
          0
        ),
    [
      filteredRecords,
      getExpenseAmount,
    ]
  );

  /*
   * -------------------------------------------------------
   * TOTAL SALES
   * -------------------------------------------------------
   */

  const totalSales = useMemo(
    () =>
      filteredRecords
        .filter(
          (record) =>
            record.type === "Sale"
        )
        .reduce(
          (sum, record) =>
            sum + getSaleAmount(record),
          0
        ),
    [
      filteredRecords,
      getSaleAmount,
    ]
  );

  /*
   * -------------------------------------------------------
   * PROFIT
   * -------------------------------------------------------
   */

  const profit = useMemo(
    () =>
      totalSales - totalExpense,
    [
      totalSales,
      totalExpense,
    ]
  );

  /*
   * -------------------------------------------------------
   * CONVERT YIELD TO KG
   * -------------------------------------------------------
   */

  const convertYieldToKg = useCallback(
    (
      quantity: number,
      unit: string
    ) => {
      switch (unit) {
        case "Quintal":
          return quantity * 100;

        case "Ton":
          return quantity * 1000;

        case "Kg":
        default:
          return quantity;
      }
    },
    []
  );

  /*
   * -------------------------------------------------------
   * TOTAL PRODUCTION
   * -------------------------------------------------------
   */

  const totalYield = useMemo(
    () =>
      filteredRecords
        .filter(
          (record) =>
            record.type === "Yield"
        )
        .reduce(
          (sum, record) =>
            sum +
            convertYieldToKg(
              record.quantity,
              record.unit
            ),
          0
        ),
    [
      filteredRecords,
      convertYieldToKg,
    ]
  );

  /*
   * -------------------------------------------------------
   * EXPENSE PIE CHART
   * -------------------------------------------------------
   */

  const pieData = useMemo(() => {
    const totals =
      filteredRecords
        .filter(
          (record) =>
            record.type === "Expense"
        )
        .reduce<Record<string, number>>(
          (acc, record) => {
            const category =
              record.expenseCategory ||
              "अन्य";

            acc[category] =
              (acc[category] || 0) +
              getExpenseAmount(record);
            return acc;
          },
          {}
        );

    return Object.entries(
      totals
    ).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredRecords, getExpenseAmount]);

  /*
   * -------------------------------------------------------
   * CROP STATISTICS
   * -------------------------------------------------------
   */

  const cropStats = useMemo(() => {
    const cropRecords =
      filteredRecords.filter(
        (record) =>
          record.crop === selectedCrop
      );

    const expense =
      cropRecords
        .filter(
          (record) =>
            record.type === "Expense"
        )
        .reduce(
          (sum, record) =>
            sum + getExpenseAmount(record),
          0
        );

    const sale =
      cropRecords
        .filter(
          (record) =>
            record.type === "Sale"
        )
        .reduce(
          (sum, record) =>
            sum + getSaleAmount(record),
          0
        );

    const yieldQty =
      cropRecords
        .filter(
          (record) =>
            record.type === "Yield"
        )
        .reduce(
          (sum, record) =>
            sum +
            convertYieldToKg(
              record.quantity,
              record.unit
            ),
          0
        );

    return {
      expense,
      sale,
      yieldQty,
      profit: sale - expense,
    };
  }, [
    filteredRecords,
    selectedCrop,
    convertYieldToKg,
    getExpenseAmount,
    getSaleAmount,
  ]);

  /*
   * -------------------------------------------------------
   * SAVE / UPDATE RECORD
   * -------------------------------------------------------
   */

  const handleSave = useCallback(
    (record: FarmRecord) => {
      setRecords((current) => {
        const exists = current.some(
          (item) =>
            item.id === record.id
        );

        if (exists) {
          return current.map(
            (item) =>
              item.id === record.id
                ? record
                : item
          );
        }

        return [
          record,
          ...current,
        ];
      });

      setEditingRecord(null);
    },
    [setRecords]
  );

  /*
   * -------------------------------------------------------
   * EDIT RECORD
   * -------------------------------------------------------
   */

  const handleEdit = useCallback(
    (record: FarmRecord) => {
      setEditingRecord(record);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    []
  );

  /*
   * -------------------------------------------------------
   * CANCEL EDIT
   * -------------------------------------------------------
   */

  const handleCancel = useCallback(() => {
    setEditingRecord(null);
  }, []);

  /*
   * -------------------------------------------------------
   * DELETE RECORD
   * -------------------------------------------------------
   */

  const deleteRecord = useCallback(
    (id: string) => {
      const confirmed =
        window.confirm(
          lang === "hi"
            ? "क्या आप यह फार्म रिकॉर्ड हटाना चाहते हैं?"
            : "Do you want to delete this farm record?"
        );

      if (!confirmed) {
        return;
      }

      setRecords((current) =>
        current.filter(
          (record) =>
            record.id !== id
        )
      );

      if (
        editingRecord?.id === id
      ) {
        setEditingRecord(null);
      }
    },
    [
      lang,
      setRecords,
      editingRecord,
    ]
  );

  /*
   * -------------------------------------------------------
   * CROPS
   * -------------------------------------------------------
   */

  const crops = DEFAULT_CROPS;

   /*
   * -------------------------------------------------------
   * MONTHLY CHART
   * -------------------------------------------------------
   */

  const chartData = useMemo(() => {
    const totals = Array.from(
      { length: 12 },
      () => ({
        sale: 0,
        expense: 0,
      })
    );

    filteredRecords.forEach(
      (record) => {
        const month =
          new Date(
            record.date
          ).getMonth();

        if (
          record.type === "Sale"
        ) {
          totals[month].sale +=
            getSaleAmount(record);
        }

        if (
          record.type === "Expense"
        ) {
          totals[month].expense +=
            getExpenseAmount(record);
        }
      }
    );

    return MONTHS.map(
      (month, index) => ({
        month,
        farm:
          totals[index].sale -
          totals[index].expense,
      })
    );
  }, [
    filteredRecords,
    getExpenseAmount,
    getSaleAmount,
  ]);

  /*
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */

  return (
    <div className="
      w-full
      max-w-[1400px]
      mx-auto
      px-3
      sm:px-5
      lg:px-6
      xl:px-8
      pb-8
    ">

      {/* ===================================================
          HEADER
      =================================================== */}

      <SectionHeader
        title={farmT.farmTitle}
        sub={farmT.farmSub}
      />

      {/* ===================================================
          FARM FORM
      =================================================== */}

      <div className="mb-5">
        <FarmForm
          lang={lang}
          farmT={farmT}
          editingRecord={editingRecord}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="mb-5">
        <FarmSummary
          lang={lang}
          totalExpense={totalExpense}
          totalSales={totalSales}
          totalYield={totalYield}
          profit={profit}
          pieData={pieData}
          cropStats={cropStats}
          selectedCrop={selectedCrop}
          setSelectedCrop={
            setSelectedCrop
          }
          crops={crops}
          chartData={chartData}
          pieColors={PIE_COLORS}
        />
      </div>

      {/* ===================================================
          RECORDS TABLE
      =================================================== */}

      <div className="mt-5">
        <FarmTable
          lang={lang}
          filteredRecords={
            filteredRecords
          }
          cropSearch={cropSearch}
          setCropSearch={
            setCropSearch
          }
          typeFilter={typeFilter}
          setTypeFilter={
            setTypeFilter
          }
          dateFilter={dateFilter}
          setDateFilter={
            setDateFilter
          }
          onEdit={handleEdit}
          onDelete={deleteRecord}
        />
      </div>

    </div>
  );
}