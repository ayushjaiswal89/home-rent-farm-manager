"use client";

import type { Dispatch, SetStateAction } from "react";
import { Download, FileText, Search } from "lucide-react";

import { FarmRecord, Lang } from "../../lib/types";
import { FarmTranslation } from "../../lib/farmI18n";

interface FarmFiltersProps {
  lang: Lang;
  farmT: FarmTranslation;

  cropSearch: string;
  setCropSearch: Dispatch<SetStateAction<string>>;

  typeFilter: "all" | FarmRecord["type"];
  setTypeFilter: Dispatch<
    SetStateAction<"all" | FarmRecord["type"]>
  >;

  dateFilter: "all" | "today" | "month" | "year";
  setDateFilter: Dispatch<
    SetStateAction<"all" | "today" | "month" | "year">
  >;

  filteredRecords: FarmRecord[];
}

export function FarmFilters({
  lang,
  farmT,
  cropSearch,
  setCropSearch,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  filteredRecords,
}: FarmFiltersProps) {
  /*
   * ---------------------------------------------------------
   * CSV EXPORT
   * ---------------------------------------------------------
   */

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert(
        lang === "hi"
          ? "Export करने के लिए कोई रिकॉर्ड नहीं है।"
          : "No records available to export."
      );
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Crop",
      "Expense Category",
      "Quantity",
      "Unit",
      "Price",
      "Amount",
      "Field",
      "Area",
      "Area Unit",
      "Worker",
      "Machine",
      "Season",
      "Note",
    ];

    const rows = filteredRecords.map((record) => [
      record.date,
      record.type,
      record.crop,
      record.expenseCategory || "",
      record.quantity || "",
      record.unit || "",
      record.price || "",
      record.amount || "",
      record.field || "",
      record.area || "",
      record.areaUnit || "",
      record.worker || "",
      record.machine || "",
      record.season || "",
      record.note || "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-khaata-farm-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ---------------------------------------------------------
   * PDF / PRINT
   * ---------------------------------------------------------
   */

  const exportPDF = () => {
    window.print();
  };

  /*
   * ---------------------------------------------------------
   * FILTER LABELS
   * ---------------------------------------------------------
   */

  const allTypes =
    lang === "hi" ? "सभी प्रकार" : "All Types";

  const allDates =
    lang === "hi" ? "सभी तारीख" : "All Date";

  const today =
    lang === "hi" ? "आज" : "Today";

  const thisMonth =
    lang === "hi" ? "इस महीने" : "This Month";

  const thisYear =
    lang === "hi" ? "इस साल" : "This Year";

  const searchPlaceholder =
    lang === "hi"
      ? "फसल खोजें..."
      : "Search Crop...";

  const csvText = "CSV";
  const pdfText = "PDF";

  return (
    <div className="mb-3">

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]
        gap-2
        items-center
      ">

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="relative">

          <Search
            size={15}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[var(--sk-dim)]
              pointer-events-none
            "
          />

          <input
            type="text"
            value={cropSearch}
            onChange={(e) =>
              setCropSearch(e.target.value)
            }
            placeholder={searchPlaceholder}
            className="
              w-full
              h-9
              rounded-lg
              border
              border-[var(--sk-border)]
              bg-[var(--sk-card2)]
              pl-9
              pr-3
              text-xs
              text-[var(--sk-text)]
              outline-none
              transition
              focus:border-green-500/50
            "
          />

        </div>


        {/* ===================================================
            TYPE FILTER
        =================================================== */}

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(
              e.target.value as
                | "all"
                | FarmRecord["type"]
            )
          }
          className="
            h-9
            rounded-lg
            border
            border-[var(--sk-border)]
            bg-[var(--sk-card2)]
            px-3
            text-xs
            text-[var(--sk-text)]
            outline-none
            focus:border-green-500/50
          "
        >

          <option value="all">
            {allTypes}
          </option>

          <option value="Expense">
            {farmT.expense}
          </option>

          <option value="Yield">
            {farmT.yield}
          </option>

          <option value="Sale">
            {farmT.sale}
          </option>

        </select>


        {/* ===================================================
            DATE FILTER
        =================================================== */}

        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(
              e.target.value as
                | "all"
                | "today"
                | "month"
                | "year"
            )
          }
          className="
            h-9
            rounded-lg
            border
            border-[var(--sk-border)]
            bg-[var(--sk-card2)]
            px-3
            text-xs
            text-[var(--sk-text)]
            outline-none
            focus:border-green-500/50
          "
        >

          <option value="all">
            {allDates}
          </option>

          <option value="today">
            {today}
          </option>

          <option value="month">
            {thisMonth}
          </option>

          <option value="year">
            {thisYear}
          </option>

        </select>


        {/* ===================================================
            CSV
        =================================================== */}

        <button
          type="button"
          onClick={exportCSV}
          className="
            h-9
            px-4
            rounded-lg
            border
            border-green-500/40
            text-green-400
            bg-green-500/5
            hover:bg-green-500/10
            transition
            flex
            items-center
            justify-center
            gap-1.5
            text-xs
            font-semibold
          "
        >
          <Download size={14} />
          {csvText}
        </button>


        {/* ===================================================
            PDF
        =================================================== */}

        <button
          type="button"
          onClick={exportPDF}
          className="
            h-9
            px-4
            rounded-lg
            border
            border-purple-500/40
            text-purple-400
            bg-purple-500/5
            hover:bg-purple-500/10
            transition
            flex
            items-center
            justify-center
            gap-1.5
            text-xs
            font-semibold
          "
        >
          <FileText size={14} />
          {pdfText}
        </button>

      </div>

    </div>
  );
}