"use client";

import type { Dispatch, SetStateAction } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { FarmRecord, Lang } from "../../lib/types";
import { fmt } from "../../lib/utils";

import {
  FARM_STRINGS,
  cropLabel,
  typeLabel,
  unitLabel,
} from "../../lib/farmI18n";

import { FormCard } from "../common/UI";
import { FarmFilters } from "./FarmFilters";

interface FarmTableProps {
  filteredRecords: FarmRecord[];

  lang: Lang;

  cropSearch: string;
  setCropSearch: Dispatch<
    SetStateAction<string>
  >;

  typeFilter: "all" | FarmRecord["type"];
  setTypeFilter: Dispatch<
    SetStateAction<"all" | FarmRecord["type"]>
  >;

  dateFilter:
    | "all"
    | "today"
    | "month"
    | "year";

  setDateFilter: Dispatch<
    SetStateAction<
      "all" | "today" | "month" | "year"
    >
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
  /*
   * Note has highest priority
   */
  if (record.note?.trim()) {
    return record.note;
  }

  /*
   * Expense
   * Example:
   * बीज • 20 Kg × ₹50
   * खाद • 2 Quintal × ₹2500
   */
  if (record.type === "Expense") {
    const category = record.expenseCategory || "-";
    const quantity = Number(record.quantity) || 0;
    const price = Number(record.price) || 0;

    if (quantity > 0 && price > 0) {
      return `${category} • ${quantity} ${unitLabel(
        lang,
        record.unit
      )} × ₹${price.toLocaleString("en-IN")}`;
    }

    if (quantity > 0) {
      return `${category} • ${quantity} ${unitLabel(
        lang,
        record.unit
      )}`;
    }

    return category;
  }

  /*
   * Production / Yield
   */
  if (record.type === "Yield") {
    const quantity = Number(record.quantity) || 0;

    if (quantity <= 0) {
      return "-";
    }

    return `${quantity} ${unitLabel(
      lang,
      record.unit
    )}`;
  }

  /*
   * Sale
   */
  if (record.type === "Sale") {
    const quantity = Number(record.quantity) || 0;
    const price = Number(record.price) || 0;

    if (quantity > 0 && price > 0) {
      return `${quantity} ${unitLabel(
        lang,
        record.unit
      )} × ₹${price.toLocaleString("en-IN")}`;
    }

    return "-";
  }

  return "-";
};

/*
 * ---------------------------------------------------------
 * TYPE BADGE
 * ---------------------------------------------------------
 */

const getTypeClass = (
  type: FarmRecord["type"]
) => {
  if (type === "Expense") {
    return `
      bg-red-500/15
      text-red-400
      border-red-500/20
    `;
  }

  if (type === "Yield") {
    return `
      bg-cyan-500/15
      text-cyan-400
      border-cyan-500/20
    `;
  }

  return `
    bg-green-500/15
    text-green-400
    border-green-500/20
  `;
};
 
/*
 * ---------------------------------------------------------
 * AMOUNT / QUANTITY
 * ---------------------------------------------------------
 */
const getAmountClass = (
  type: FarmRecord["type"]
) => {
  if (type === "Expense") {
    return "text-red-400";
  }

  if (type === "Sale") {
    return "text-green-400";
  }

  return "text-cyan-400";
};

const getAmount = (record: FarmRecord) => {
  /*
   * Yield
   */
  if (record.type === "Yield") {
    const quantity = Number(record.quantity) || 0;

    return quantity > 0
      ? `${quantity} ${unitLabel(
          lang,
          record.unit
        )}`
      : "-";
  }

  /*
   * Sale
   */
  if (record.type === "Sale") {
    const amount =
      Number(record.amount) ||
      Number(record.quantity || 0) *
        Number(record.price || 0);

    return amount > 0
      ? fmt(amount)
      : "-";
  }

  /*
   * Expense
   */
  if (record.type === "Expense") {
    const savedAmount = Number(record.amount) || 0;

    const calculatedAmount =
      Number(record.quantity || 0) *
      Number(record.price || 0);

    const amount =
      savedAmount > 0
        ? savedAmount
        : calculatedAmount;

    return amount > 0
      ? fmt(amount)
      : "-";
  }

  return "-";
};


  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <FormCard>
      {/* ===================================================
          FILTERS
      =================================================== */}

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

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="mt-3 w-full overflow-x-auto">
        <table className="min-w-[900px] w-full text-xs">
          {/* =================================================
              HEADER
          ================================================= */}

          <thead>
            <tr className="border-b border-[var(--sk-border)]">
              {/* DATE */}

              <th className="
                px-2
                py-3
                text-left
                font-semibold
                text-[var(--sk-faint)]
              ">
                {farmT.date}
              </th>

              {/* CROP */}

              <th className="
                px-2
                py-3
                text-left
                font-semibold
                text-[var(--sk-faint)]
              ">
                {farmT.crop}
              </th>

              {/* TYPE */}

              <th className="
                px-2
                py-3
                text-left
                font-semibold
                text-[var(--sk-faint)]
              ">
                {farmT.type}
              </th>

              {/* DETAILS */}

              <th className="
                px-2
                py-3
                text-left
                font-semibold
                text-[var(--sk-faint)]
              ">
                {farmT.details}
              </th>

              {/* AMOUNT */}

              <th className="
                px-2
                py-3
                text-left
                font-semibold
                text-[var(--sk-faint)]
              ">
                {farmT.amount}
              </th>

              {/* EDIT */}

              <th className="
                px-2
                py-3
                text-center
                font-semibold
                text-[var(--sk-faint)]
              ">
                {lang === "hi"
                  ? "संपादित"
                  : "Edit"}
              </th>

              {/* DELETE */}

              <th className="
                px-2
                py-3
                text-center
                font-semibold
                text-[var(--sk-faint)]
              ">
                {lang === "hi"
                  ? "हटाएं"
                  : "Delete"}
              </th>
            </tr>
          </thead>

          {/* =================================================
              BODY
          ================================================= */}

          <tbody>
            {filteredRecords.map(
              (record) => (
                <tr
                  key={record.id}
                  className="
                    border-b
                    border-white/5
                    transition-colors
                    hover:bg-white/[0.03]
                  "
                >
                  {/* DATE */}

                  <td className="px-2 py-3">
                    <span className="
                      font-mono
                      text-[var(--sk-text2)]
                    ">
                      {record.date
                        ? record.date
                            .split("-")
                            .reverse()
                            .join("/")
                        : "-"}
                    </span>
                  </td>

                  {/* CROP */}

                  <td className="px-2 py-3">
                    <div className="
                      font-semibold
                      text-[var(--sk-text)]
                    ">
                      {cropLabel(
                        lang,
                        record.crop
                      )}
                    </div>

                    {(record.field ||
                      record.area) && (
                      <div className="
                        mt-0.5
                        text-[10px]
                        text-[var(--sk-faint)]
                      ">
                        {record.field ||
                          ""}

                        {record.field &&
                        record.area
                          ? " • "
                          : ""}

                        {record.area
                          ? `${record.area} ${
                              record.areaUnit ||
                              ""
                            }`
                          : ""}
                      </div>
                    )}

                    {record.season && (
                      <div className="
                        mt-0.5
                        text-[9px]
                        text-[var(--sk-dim)]
                      ">
                        {record.season}
                      </div>
                    )}
                  </td>

                  {/* TYPE */}

                  <td className="px-2 py-3">
                    <span
                      className={`
                        inline-flex
                        items-center
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        whitespace-nowrap
                        ${getTypeClass(
                          record.type
                        )}
                      `}
                    >
                      {typeLabel(
                        lang,
                        record.type
                      )}
                    </span>
                  </td>

                  {/* DETAILS */}

                  <td className="
                    max-w-[280px]
                    px-2
                    py-3
                  ">
                    <div
                      className="
                        truncate
                        text-[var(--sk-muted)]
                      "
                      title={getDetails(
                        record
                      )}
                    >
                      {getDetails(record)}
                    </div>
                  </td>

                  {/* AMOUNT */}

                  <td className="px-2 py-3">
                    <span
                      className={`
                        font-bold
                        ${getAmountClass(
                          record.type
                        )}
                      `}
                    >
                      {getAmount(record)}
                    </span>
                  </td>

                  {/* EDIT */}

                  <td className="
                    px-2
                    py-3
                    text-center
                  ">
                    <button
                      type="button"
                      onClick={() =>
                        onEdit(record)
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-md
                        p-1.5
                        text-blue-400
                        transition
                        hover:bg-blue-500/10
                        hover:text-blue-300
                      "
                      title={
                        lang === "hi"
                          ? "रिकॉर्ड संपादित करें"
                          : "Edit Record"
                      }
                      aria-label={
                        lang === "hi"
                          ? "रिकॉर्ड संपादित करें"
                          : "Edit Record"
                      }
                    >
                      <Pencil size={15} />
                    </button>
                  </td>

                  {/* DELETE */}

                  <td className="
                    px-2
                    py-3
                    text-center
                  ">
                    <button
                      type="button"
                      onClick={() =>
                        onDelete(record.id)
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-md
                        p-1.5
                        text-red-400
                        transition
                        hover:bg-red-500/10
                        hover:text-red-300
                      "
                      title={
                        lang === "hi"
                          ? "रिकॉर्ड हटाएं"
                          : "Delete Record"
                      }
                      aria-label={
                        lang === "hi"
                          ? "रिकॉर्ड हटाएं"
                          : "Delete Record"
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {filteredRecords.length ===
              0 && (
              <tr>
                <td
                  colSpan={7}
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

      {/* ===================================================
          RECORD COUNT
      =================================================== */}

      {filteredRecords.length > 0 && (
        <div className="
          mt-3
          border-t
          border-white/5
          pt-3
          text-[11px]
          text-[var(--sk-dim)]
        ">
          {lang === "hi"
            ? `कुल ${filteredRecords.length} रिकॉर्ड`
            : `Total ${filteredRecords.length} records`}
        </div>
      )}
    </FormCard>
  );
}