"use client";

import type { Dispatch, SetStateAction } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { FarmRecord, Lang } from "../../lib/types";
import { fmt } from "../../lib/utils";

import { FARM_STRINGS } from "../../lib/farmI18n";

import { FormCard } from "../common/UI";

import { FarmFilters } from "./FarmFilters";

import {
  cropLabel,
  typeLabel,
  unitLabel,
} from "../../lib/farmI18n";

interface FarmTableProps {
  filteredRecords: FarmRecord[];

  lang: Lang;

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

  onEdit: (record: FarmRecord) => void;
  onDelete: (id: string) => void;
}

export function FarmTable({
  filteredRecords,
  lang,
  cropSearch,
  setCropSearch,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  onEdit,
  onDelete,
}: FarmTableProps) {
  const farmT = FARM_STRINGS[lang];

  /*
   * ---------------------------------------------------------
   * DETAILS
   * ---------------------------------------------------------
   */

  const getDetails = (record: FarmRecord) => {
    if (record.note?.trim()) {
      return record.note;
    }

    if (record.type === "Expense") {
      return record.expenseCategory || "-";
    }

    if (record.type === "Yield") {
      return record.quantity
        ? `${record.quantity} ${unitLabel(lang, record.unit)}`
        : "-";
    }

    if (record.type === "Sale") {
      if (record.quantity && record.price) {
        return `${record.quantity} ${unitLabel(
          lang,
          record.unit
        )} × ₹${Number(record.price).toLocaleString("en-IN")}`;
      }

      return "-";
    }

    return "-";
  };

  /*
   * ---------------------------------------------------------
   * AMOUNT
   * ---------------------------------------------------------
   */

  const getAmount = (record: FarmRecord) => {
    if (record.type === "Yield") {
      return record.quantity
        ? `${record.quantity} ${unitLabel(lang, record.unit)}`
        : "-";
    }

    if (record.type === "Sale") {
      const amount =
        Number(record.amount) ||
        Number(record.quantity) * Number(record.price);

      return amount > 0 ? fmt(amount) : "-";
    }

    return fmt(Number(record.amount) || 0);
  };

  /*
   * ---------------------------------------------------------
   * TYPE BADGE
   * ---------------------------------------------------------
   */

  const getTypeClass = (type: FarmRecord["type"]) => {
    if (type === "Expense") {
      return "bg-red-500/15 text-red-400 border-red-500/20";
    }

    if (type === "Yield") {
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/20";
    }

    return "bg-green-500/15 text-green-400 border-green-500/20";
  };

  return (
    <FormCard>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <FarmFilters
        lang={lang}
        farmT={farmT}
        cropSearch={cropSearch}
        setCropSearch={setCropSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        filteredRecords={filteredRecords}
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="mt-3 w-full overflow-x-auto">

        <table className="min-w-[850px] w-full text-xs">

          {/* =================================================
              HEADER
          ================================================= */}

          <thead>

            <tr className="border-b border-[var(--sk-border)]">

              <th className="py-3 px-2 text-left font-semibold text-[var(--sk-faint)]">
                {farmT.date}
              </th>

              <th className="py-3 px-2 text-left font-semibold text-[var(--sk-faint)]">
                {farmT.type}
              </th>

              <th className="py-3 px-2 text-left font-semibold text-[var(--sk-faint)]">
                {farmT.crop}
              </th>

              <th className="py-3 px-2 text-left font-semibold text-[var(--sk-faint)]">
                {farmT.details}
              </th>

              <th className="py-3 px-2 text-left font-semibold text-[var(--sk-faint)]">
                {farmT.amount} (₹)
              </th>

              <th className="py-3 px-2 text-center font-semibold text-[var(--sk-faint)]">
                {farmT.action}
              </th>

            </tr>

          </thead>


          {/* =================================================
              BODY
          ================================================= */}

          <tbody>

            {filteredRecords.map((record) => (

              <tr
                key={record.id}
                className="
                  border-b
                  border-white/5
                  transition-colors
                  hover:bg-white/[0.03]
                "
              >

                {/* ===========================================
                    DATE
                =========================================== */}

                <td className="py-3 px-2">

                  <span className="font-mono text-[var(--sk-text2)]">

                    {record.date
                      ? record.date
                          .split("-")
                          .reverse()
                          .join("/")
                      : "-"}

                  </span>

                </td>


                {/* ===========================================
                    TYPE
                =========================================== */}

                <td className="py-3 px-2">

                  <span
                    className={`
                      inline-flex
                      items-center
                      px-2.5
                      py-1
                      rounded-full
                      border
                      text-[10px]
                      font-bold
                      whitespace-nowrap
                      ${getTypeClass(record.type)}
                    `}
                  >
                    {typeLabel(lang, record.type)}
                  </span>

                </td>


                {/* ===========================================
                    CROP
                =========================================== */}

                <td className="py-3 px-2">

                  <span className="font-semibold text-[var(--sk-text)]">
                    {cropLabel(lang, record.crop)}
                  </span>

                </td>


                {/* ===========================================
                    DETAILS
                =========================================== */}

                <td className="py-3 px-2 max-w-[260px]">

                  <div
                    className="
                      truncate
                      text-[var(--sk-muted)]
                    "
                    title={getDetails(record)}
                  >
                    {getDetails(record)}
                  </div>

                </td>


                {/* ===========================================
                    AMOUNT
                =========================================== */}

                <td className="py-3 px-2">

                  <span
                    className={`
                      font-bold
                      ${
                        record.type === "Expense"
                          ? "text-red-400"
                          : record.type === "Sale"
                            ? "text-green-400"
                            : "text-cyan-400"
                      }
                    `}
                  >
                    {getAmount(record)}
                  </span>

                </td>


                {/* ===========================================
                    ACTION
                =========================================== */}

                <td className="py-3 px-2">

                  <div className="flex items-center justify-center gap-3">

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="
                        p-1.5
                        rounded-md
                        text-blue-400
                        hover:bg-blue-500/10
                        hover:text-blue-300
                        transition
                      "
                      title={
                        lang === "hi"
                          ? "रिकॉर्ड संपादित करें"
                          : "Edit Record"
                      }
                    >
                      <Pencil size={15} />
                    </button>


                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() => onDelete(record.id)}
                      className="
                        p-1.5
                        rounded-md
                        text-red-400
                        hover:bg-red-500/10
                        hover:text-red-300
                        transition
                      "
                      title={
                        lang === "hi"
                          ? "रिकॉर्ड हटाएं"
                          : "Delete Record"
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </td>

              </tr>

            ))}


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {filteredRecords.length === 0 && (

              <tr>

                <td
                  colSpan={6}
                  className="
                    py-10
                    text-center
                    text-sm
                    text-[var(--sk-dim)]
                  "
                >
                  {farmT.noRecords}
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>


      {/* =====================================================
          RECORD COUNT
      ===================================================== */}

      {filteredRecords.length > 0 && (

        <div
          className="
            mt-3
            pt-3
            border-t
            border-white/5
            text-[11px]
            text-[var(--sk-dim)]
          "
        >
          {lang === "hi"
            ? `कुल ${filteredRecords.length} रिकॉर्ड`
            : `Total ${filteredRecords.length} records`}
        </div>

      )}

    </FormCard>
  );
}