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
   * =========================================================
   * HELPERS
   * =========================================================
   */

  const escapeCSV = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const escapeHTML = (value: unknown) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const getSaleAmount = (record: FarmRecord) => {
    if (record.type !== "Sale") return 0;

    const quantity = Number(record.quantity || 0);
    const price = Number(record.price || 0);

    // New Sale:
    // Quantity × Price = Total Sale
    const calculatedAmount = quantity * price;

    // Old records:
    // If quantity/price are not available,
    // use the old saved amount.
    if (calculatedAmount > 0) {
      return calculatedAmount;
    }

    return Number(record.amount || 0);
  };

  const getAmount = (record: FarmRecord) => {
    if (record.type === "Sale") {
      return getSaleAmount(record);
    }

    if (record.type === "Expense") {
      const quantity = Number(record.quantity || 0);
      const price = Number(record.price || 0);

      // New records:
      // Quantity × Rate = Expense
      const calculatedAmount = quantity * price;

      // Old records:
      // If quantity/rate are not available, keep old amount
      if (calculatedAmount > 0) {
        return calculatedAmount;
      }

      return Number(record.amount || 0);
    }

    return 0;
  };

  const getDetails = (record: FarmRecord) => {
    if (record.type === "Expense") {
      return record.expenseCategory || record.note || "";
    }

    if (record.type === "Yield") {
      return `${record.quantity || 0} ${record.unit || ""}`.trim();
    }

    if (record.type === "Sale") {
      return `${record.quantity || 0} ${record.unit || ""
        } × ₹${Number(record.price || 0).toLocaleString(
          "en-IN"
        )}`;
    }

    return record.note || "";
  };

  const typeText = (type: FarmRecord["type"]) => {
    if (type === "Expense") return farmT.expense;
    if (type === "Yield") return farmT.yield;
    return farmT.sale;
  };

  /*
   * =========================================================
   * CSV EXPORT
   * =========================================================
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

    const headers =
      lang === "hi"
        ? [
          "तारीख",
          "फसल",
          "सीजन",
          "खेत",
          "क्षेत्रफल",
          "क्षेत्रफल यूनिट",
          "टाइप",
          "विवरण",
          "मात्रा",
          "मात्रा यूनिट",
          "रेट",
          "राशि",
          "मजदूर",
          "मशीन",
          "नोट",
        ]
        : [
          "Date",
          "Crop",
          "Season",
          "Field",
          "Area",
          "Area Unit",
          "Type",
          "Details",
          "Quantity",
          "Quantity Unit",
          "Rate",
          "Amount",
          "Worker",
          "Machine",
          "Note",
        ];

    const rows = filteredRecords.map((record) => [
      record.date,
      record.crop,
      record.season || "",
      record.field || "",
      record.area ?? "",
      record.areaUnit || "",
      typeText(record.type),
      getDetails(record),
      record.quantity ?? "",
      record.unit || "",
      record.type === "Sale" || record.type === "Expense"
        ? Number(record.price || 0)
        : "",
      getAmount(record),
      record.worker || "",
      record.machine || "",
      record.note || "",
    ]);

    const totalExpense = filteredRecords.reduce(
      (sum, record) =>
        sum +
        (record.type === "Expense"
          ? getAmount(record)
          : 0),
      0
    );

    const totalSales = filteredRecords.reduce(
      (sum, record) =>
        sum +
        (record.type === "Sale"
          ? getSaleAmount(record)
          : 0),
      0
    );

    const convertYieldToKg = (
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
    };

    const totalProduction = filteredRecords.reduce(
      (sum, record) => {
        if (record.type !== "Yield") return sum;

        const quantity = Number(record.quantity || 0);
        const unit = record.unit || "Kg";

        return sum + convertYieldToKg(quantity, unit);
      },
      0
    );

    const profit = totalSales - totalExpense;

    const summaryRows =
      lang === "hi"
        ? [
          [],
          ["सारांश"],
          ["कुल खर्च", totalExpense],
          ["कुल बिक्री", totalSales],
          ["लाभ / हानि", profit],
          ["कुल उत्पादन (KG)", totalProduction],
        ]
        : [
          [],
          ["Summary"],
          ["Total Expense", totalExpense],
          ["Total Sales", totalSales],
          ["Profit / Loss", profit],
          ["Total Production (KG)", totalProduction],
        ];

    const csv = [
      headers,
      ...rows,
      ...summaryRows,
    ]
      .map((row) =>
        row
          .map((value) => escapeCSV(value))
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `farm-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * =========================================================
   * PDF / PRINT REPORT
   * =========================================================
   *
   * Browser print dialog will open.
   * Choose "Save as PDF".
   * =========================================================
   */

  const exportPDF = () => {
    if (filteredRecords.length === 0) {
      alert(
        lang === "hi"
          ? "PDF बनाने के लिए कोई रिकॉर्ड नहीं है।"
          : "No records available for PDF."
      );
      return;
    }

    const totalExpense = filteredRecords.reduce(
      (sum, record) =>
        sum +
        (record.type === "Expense"
          ? getAmount(record)
          : 0),
      0
    );

    const totalSales = filteredRecords.reduce(
      (sum, record) =>
        sum +
        (record.type === "Sale"
          ? getSaleAmount(record)
          : 0),
      0
    );

    const convertYieldToKg = (
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
    };

    const totalProduction = filteredRecords.reduce(
      (sum, record) => {
        if (record.type !== "Yield") return sum;

        const quantity = Number(record.quantity || 0);
        const unit = record.unit || "Kg";

        return sum + convertYieldToKg(quantity, unit);
      },
      0
    );

    const profit = totalSales - totalExpense;

    const title =
      lang === "hi"
        ? "🌾 खेती प्रबंधन रिपोर्ट"
        : "🌾 Farm Management Report";

    const summaryTitle =
      lang === "hi" ? "सारांश" : "Summary";

    const expenseTitle =
      lang === "hi" ? "कुल खर्च" : "Total Expense";

    const salesTitle =
      lang === "hi" ? "कुल बिक्री" : "Total Sales";

    const profitTitle =
      lang === "hi" ? "लाभ / हानि" : "Profit / Loss";

    const productionTitle =
      lang === "hi"
        ? "कुल उत्पादन (KG)"
        : "Total Production (KG)";

    const recordsTitle =
      lang === "hi" ? "रिकॉर्ड" : "Records";

    const htmlRows = filteredRecords
      .map((record) => {
        const amount = getAmount(record);

        const quantity =
          record.type === "Yield" ||
            record.type === "Sale" ||
            record.type === "Expense"
            ? `${record.quantity || 0} ${record.unit || ""
            }`
            : "-";

        const rate =
          record.type === "Sale" || record.type === "Expense"
            ? `₹${Number(
              record.price || 0
            ).toLocaleString("en-IN")}`
            : "-";

        const area =
          record.area !== undefined &&
            record.area !== null &&
            record.area !== 0
            ? `${record.area} ${record.areaUnit || ""
            }`
            : "-";

        return `
          <tr>
            <td>${escapeHTML(record.date)}</td>

            <td>
              <strong>${escapeHTML(
          record.crop
        )}</strong>
              ${record.field
            ? `<br><small>${escapeHTML(
              record.field
            )}</small>`
            : ""
          }
            </td>

            <td>${escapeHTML(
            typeText(record.type)
          )}</td>

            <td>${escapeHTML(
            getDetails(record)
          )}</td>

            <td>${escapeHTML(quantity)}</td>

            <td>${escapeHTML(rate)}</td>

            <td>${escapeHTML(area)}</td>

            <td class="amount">
              ${record.type === "Expense" ||
            record.type === "Sale"
            ? `₹${amount.toLocaleString(
              "en-IN"
            )}`
            : "-"
          }
            </td>
          </tr>
        `;
      })
      .join("");

    const reportWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );

    if (!reportWindow) {
      alert(
        lang === "hi"
          ? "PDF विंडो नहीं खुल सकी। कृपया browser में popup allow करें।"
          : "PDF window could not open. Please allow popups in your browser."
      );
      return;
    }

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${lang === "hi" ? "hi" : "en"}">
      <head>

        <meta charset="UTF-8" />

        <title>${escapeHTML(title)}</title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              "Noto Sans Devanagari",
              sans-serif;

            margin: 0;
            padding: 28px;

            color: #222;
            background: white;
          }

          .header {
            text-align: center;
            margin-bottom: 24px;
          }

          .header h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }

          .header p {
            margin: 0;
            color: #666;
            font-size: 12px;
          }

          .summary-title {
            font-size: 17px;
            font-weight: 700;
            margin: 0 0 10px;
          }

          .summary {
            display: grid;
            grid-template-columns:
              repeat(4, 1fr);

            gap: 10px;
            margin-bottom: 28px;
          }

          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #fafafa;
          }

          .card-label {
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
          }

          .card-value {
            font-size: 18px;
            font-weight: 700;
          }

          .profit {
            color: ${profit >= 0
        ? "#16803c"
        : "#c62828"
      };
          }

          .section-title {
            font-size: 17px;
            font-weight: 700;
            margin-bottom: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          th {
            background: #f1f3f5;
            font-weight: 700;
          }

          th,
          td {
            border: 1px solid #d9d9d9;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
          }

          .amount {
            text-align: right;
            font-weight: 600;
            white-space: nowrap;
          }

          small {
            color: #777;
            font-size: 9px;
          }

          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #777;
            text-align: center;
          }

          @media print {

            body {
              padding: 12px;
            }

            .summary {
              grid-template-columns:
                repeat(4, 1fr);
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            thead {
              display: table-header-group;
            }

          }

          @media (max-width: 700px) {

            .summary {
              grid-template-columns:
                repeat(2, 1fr);
            }

            table {
              font-size: 8px;
            }

            th,
            td {
              padding: 4px;
            }

          }

        </style>

      </head>

      <body>

        <div class="header">

          <h1>
            ${escapeHTML(title)}
          </h1>

          <p>
            ${lang === "hi"
        ? "रिपोर्ट दिनांक"
        : "Report Date"
      }:
            ${new Date().toLocaleDateString(
        lang === "hi"
          ? "hi-IN"
          : "en-IN"
      )}
          </p>

        </div>

        <div class="summary-title">
          ${escapeHTML(summaryTitle)}
        </div>

        <div class="summary">

          <div class="card">
            <div class="card-label">
              ${escapeHTML(expenseTitle)}
            </div>

            <div class="card-value">
              ₹${totalExpense.toLocaleString(
        "en-IN"
      )}
            </div>
          </div>

          <div class="card">
            <div class="card-label">
              ${escapeHTML(salesTitle)}
            </div>

            <div class="card-value">
              ₹${totalSales.toLocaleString(
        "en-IN"
      )}
            </div>
          </div>

          <div class="card">
            <div class="card-label">
              ${escapeHTML(profitTitle)}
            </div>

            <div class="card-value profit">
              ₹${profit.toLocaleString(
        "en-IN"
      )}
            </div>
          </div>

          <div class="card">
            <div class="card-label">
              ${escapeHTML(productionTitle)}
            </div>

            <div class="card-value">
              ${totalProduction.toLocaleString(
        "en-IN"
      )}
            </div>
          </div>

        </div>

        <div class="section-title">
          ${escapeHTML(recordsTitle)}
        </div>

        <table>

          <thead>
            <tr>

              <th>
                ${lang === "hi"
        ? "तारीख"
        : "Date"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "फसल / खेत"
        : "Crop / Field"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "टाइप"
        : "Type"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "विवरण"
        : "Details"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "मात्रा"
        : "Quantity"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "रेट"
        : "Rate"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "क्षेत्रफल"
        : "Area"
      }
              </th>

              <th>
                ${lang === "hi"
        ? "राशि"
        : "Amount"
      }
              </th>

            </tr>
          </thead>

          <tbody>
            ${htmlRows}
          </tbody>

        </table>

        <div class="footer">
          ${lang === "hi"
        ? "Smart Khaata • Farm Management"
        : "Smart Khaata • Farm Management"
      }
        </div>

      </body>
      </html>
    `);

    reportWindow.document.close();

    reportWindow.focus();

    setTimeout(() => {
      reportWindow.print();
    }, 400);
  };

  /*
   * =========================================================
   * FILTER LABELS
   * =========================================================
   */

  const allTypes =
    lang === "hi"
      ? "सभी प्रकार"
      : "All Types";

  const allDates =
    lang === "hi"
      ? "सभी तारीख"
      : "All Dates";

  const today =
    lang === "hi"
      ? "आज"
      : "Today";

  const thisMonth =
    lang === "hi"
      ? "इस महीने"
      : "This Month";

  const thisYear =
    lang === "hi"
      ? "इस साल"
      : "This Year";

  const searchPlaceholder =
    lang === "hi"
      ? "फसल खोजें..."
      : "Search Crop...";

  return (
    <div className="mb-3">

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]
          gap-2
          items-center
        "
      >

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

          CSV

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

          PDF

        </button>

      </div>

    </div>
  );
}