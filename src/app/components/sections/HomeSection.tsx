
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Search,
  Trash2,
  Pencil,
  Plus,
  X,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import type { HomeExpense, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";

import {
  FormCard,
  InputGroup,
  KpiBox,
  SectionHeader,
  btnPrimary,
  btnSecondary,
  inputCls,
  selectCls,
} from "../common/UI";

interface HomeSectionProps {
  records: HomeExpense[];
  setRecords: React.Dispatch<
    React.SetStateAction<HomeExpense[]>
  >;
  lang: Lang;
}

interface HomeForm {
  date: string;
  category: string;
  note: string;
  amount: string;
}

type DateFilter =
  | "all"
  | "today"
  | "month"
  | "year";

export function HomeSection({
  records,
  setRecords,
  lang,
}: HomeSectionProps) {
  const t = STRINGS[lang];
  const isHi = lang === "hi";

  // =====================================================
  // FORM
  // =====================================================

  const getToday = () =>
    new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<HomeForm>({
    date: getToday(),
    category: "grocery",
    note: "",
    amount: "",
  });

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // =====================================================
  // CATEGORY LABELS
  // =====================================================

  const categoryLabels = useMemo(
    () => ({
      grocery: t.groceryCat,
      bills: t.billsCat,
      medical: t.medicalCat,
      transport: t.transportCat,
      education: t.educationCat,
      other: t.otherCat,
    }),
    [t]
  );

  const categories = Object.keys(
    categoryLabels
  );

  // =====================================================
  // FILTERED RECORDS
  // =====================================================

  const filteredRecords = useMemo(() => {
    const today = getToday();
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    const searchText =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const categoryText =
        categoryLabels[
          record.category as keyof typeof categoryLabels
        ] || record.category;

      const matchesSearch =
        categoryText
          .toLowerCase()
          .includes(searchText) ||
        record.category
          .toLowerCase()
          .includes(searchText) ||
        (record.note || "")
          .toLowerCase()
          .includes(searchText);

      if (
        searchText &&
        !matchesSearch
      ) {
        return false;
      }

      if (
        dateFilter === "today" &&
        record.date !== today
      ) {
        return false;
      }

      if (
        dateFilter === "month" &&
        !record.date.startsWith(month)
      ) {
        return false;
      }

      if (
        dateFilter === "year" &&
        !record.date.startsWith(year)
      ) {
        return false;
      }

      if (
        minAmount &&
        record.amount <
          Number(minAmount)
      ) {
        return false;
      }

      if (
        maxAmount &&
        record.amount >
          Number(maxAmount)
      ) {
        return false;
      }

      return true;
    });
  }, [
    records,
    search,
    dateFilter,
    minAmount,
    maxAmount,
    categoryLabels,
  ]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const filteredTotal = useMemo(
    () =>
      filteredRecords.reduce(
        (sum, record) =>
          sum + Number(record.amount || 0),
        0
      ),
    [filteredRecords]
  );

  const dailyAvg = useMemo(() => {
    if (!filteredRecords.length) {
      return 0;
    }

    const uniqueDays = new Set(
      filteredRecords.map(
        (record) => record.date
      )
    ).size;

    return uniqueDays
      ? filteredTotal / uniqueDays
      : 0;
  }, [filteredRecords, filteredTotal]);

  const topCatName = useMemo(() => {
    const totals =
      filteredRecords.reduce<
        Record<string, number>
      >((acc, record) => {
        acc[record.category] =
          (acc[record.category] || 0) +
          Number(record.amount || 0);

        return acc;
      }, {});

    return (
      Object.entries(totals).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || ""
    );
  }, [filteredRecords]);

  const topCatLabel = useMemo(() => {
    if (!topCatName) {
      return "—";
    }

    return (
      categoryLabels[
        topCatName as keyof typeof categoryLabels
      ] || topCatName
    );
  }, [
    topCatName,
    categoryLabels,
  ]);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = useCallback(() => {
    setForm({
      date: getToday(),
      category: "grocery",
      note: "",
      amount: "",
    });

    setEditingId(null);
  }, []);

  // =====================================================
  // EDIT
  // =====================================================

  const startEdit = useCallback(
    (record: HomeExpense) => {
      setEditingId(record.id);

      setForm({
        date: record.date,
        category: record.category,
        note: record.note || "",
        amount: String(record.amount),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    []
  );

  // =====================================================
  // SAVE / UPDATE
  // =====================================================

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const amount = Number(form.amount);

      if (
        !form.date ||
        !form.category ||
        Number.isNaN(amount) ||
        amount <= 0
      ) {
        window.alert(
          isHi
            ? "कृपया सभी आवश्यक जानकारी सही भरें।"
            : "Please fill in all required fields with valid values."
        );

        return;
      }

      if (editingId) {
        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? {
                  ...record,
                  date: form.date,
                  category:
                    form.category,
                  note: form.note,
                  amount,
                }
              : record
          )
        );
      } else {
        setRecords((current) => [
          {
            id: `h${Date.now()}`,
            date: form.date,
            category: form.category,
            note: form.note,
            amount,
          },
          ...current,
        ]);
      }

      resetForm();
    },
    [
      form,
      editingId,
      isHi,
      resetForm,
      setRecords,
    ]
  );

  // =====================================================
  // DELETE
  // =====================================================

  const onDelete = useCallback(
    (id: string) => {
      const confirmed =
        window.confirm(
          isHi
            ? "क्या आप यह खर्च रिकॉर्ड हटाना चाहते हैं?"
            : "Delete this expense record?"
        );

      if (!confirmed) {
        return;
      }

      setRecords((current) =>
        current.filter(
          (record) => record.id !== id
        )
      );

      if (editingId === id) {
        resetForm();
      }
    },
    [
      isHi,
      editingId,
      resetForm,
      setRecords,
    ]
  );

  // =====================================================
  // CLEAR ALL
  // =====================================================

  const clearAllRecords = useCallback(() => {
    if (!records.length) {
      return;
    }

    const confirmed =
      window.confirm(
        isHi
          ? `क्या आप सभी ${records.length} Home Expense रिकॉर्ड हटाना चाहते हैं?`
          : `Delete all ${records.length} home expense records?`
      );

    if (!confirmed) {
      return;
    }

    setRecords([]);
    resetForm();
  }, [
    records.length,
    isHi,
    resetForm,
    setRecords,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = useCallback(() => {
    setSearch("");
    setDateFilter("all");
    setMinAmount("");
    setMaxAmount("");
  }, []);

  // =====================================================
  // CSV EXPORT
  // =====================================================

  const exportCSV = useCallback(() => {
    if (!filteredRecords.length) {
      window.alert(
        isHi
          ? "Export करने के लिए कोई रिकॉर्ड नहीं है।"
          : "There are no records to export."
      );

      return;
    }

    const headers = [
      t.date,
      t.category,
      t.note,
      t.amount,
    ];

    const rows = filteredRecords.map(
      (record) => [
        record.date,
        categoryLabels[
          record.category as keyof typeof categoryLabels
        ] || record.category,
        record.note || "",
        record.amount,
      ]
    );

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = `home-expenses-${getToday()}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, [
    filteredRecords,
    categoryLabels,
    isHi,
    t,
  ]);

  // =====================================================
  // PDF EXPORT
  // =====================================================

  const exportPDF = useCallback(() => {
    if (!filteredRecords.length) {
      window.alert(
        isHi
          ? "PDF बनाने के लिए कोई रिकॉर्ड नहीं है।"
          : "There are no records to export."
      );

      return;
    }

    const headers = [
      t.date,
      t.category,
      t.note,
      t.amount,
    ];

    const rows = filteredRecords.map(
      (record) => [
        record.date,
        categoryLabels[
          record.category as keyof typeof categoryLabels
        ] || record.category,
        record.note || "—",
        fmt(record.amount),
      ]
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${t.homeTitle}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111827;
          }

          h2 {
            margin: 0 0 5px;
          }

          .date {
            color: #6b7280;
            font-size: 11px;
            margin-bottom: 18px;
          }

          .summary {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }

          .box {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
          }

          .label {
            color: #6b7280;
            font-size: 10px;
          }

          .value {
            font-size: 16px;
            font-weight: bold;
            margin-top: 4px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          th {
            background: #166534;
            color: white;
            padding: 8px;
            text-align: left;
          }

          td {
            padding: 7px;
            border-bottom:
              1px solid #e5e7eb;
          }

          .amount {
            text-align: right;
            font-weight: bold;
          }

          .total {
            margin-top: 18px;
            text-align: right;
            font-size: 15px;
            font-weight: bold;
          }

          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>

      <body>

        <h2>${t.homeTitle}</h2>

        <div class="date">
          ${
            isHi
              ? "रिपोर्ट तारीख"
              : "Report Date"
          }: ${getToday()}
        </div>

        <div class="summary">

          <div class="box">
            <div class="label">
              ${t.amount}
            </div>

            <div class="value">
              ${fmt(filteredTotal)}
            </div>
          </div>

          <div class="box">
            <div class="label">
              ${
                isHi
                  ? "रिकॉर्ड"
                  : "Records"
              }
            </div>

            <div class="value">
              ${filteredRecords.length}
            </div>
          </div>

          <div class="box">
            <div class="label">
              ${
                isHi
                  ? "दैनिक औसत"
                  : "Daily Average"
              }
            </div>

            <div class="value">
              ${fmt(dailyAvg)}
            </div>
          </div>

        </div>

        <table>

          <thead>
            <tr>
              ${headers
                .map(
                  (header) =>
                    `<th>${header}</th>`
                )
                .join("")}
            </tr>
          </thead>

          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>${row[2]}</td>
                    <td class="amount">
                      ${row[3]}
                    </td>
                  </tr>
                `
              )
              .join("")}
          </tbody>

        </table>

        <div class="total">
          ${
            isHi
              ? "कुल खर्च"
              : "Total Expense"
          }: ${fmt(filteredTotal)}
        </div>

      </body>
      </html>
    `;

    const win = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!win) {
      window.alert(
        isHi
          ? "Popup block हो गया। कृपया browser में popup allow करें।"
          : "Popup was blocked. Please allow popups in your browser."
      );

      return;
    }

    win.document.write(html);
    win.document.close();

    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  }, [
    filteredRecords,
    categoryLabels,
    dailyAvg,
    filteredTotal,
    isHi,
    t,
  ]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">

      {/* =================================================
          HEADER
      ================================================== */}

      <SectionHeader
        title={t.homeTitle}
        sub={
          isHi
            ? "अपने घर के दैनिक खर्चों को आसानी से ट्रैक करें"
            : "Track and manage your daily household expenses"
        }
      />

      {/* =================================================
          TOP AREA
      ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4 lg:gap-5 mb-5">

        {/* =================================================
            FORM
        ================================================== */}

        <FormCard>

          <div className="flex items-center justify-between gap-3 mb-5">

            <div className="flex items-center gap-3">

              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/15 text-green-400">
                {editingId ? (
                  <Pencil size={18} />
                ) : (
                  <Plus size={18} />
                )}
              </div>

              <div>

                <h2 className="text-base font-bold text-[var(--sk-text)]">
                  {editingId
                    ? isHi
                      ? "खर्च रिकॉर्ड संपादित करें"
                      : "Edit Expense"
                    : t.addExpense}
                </h2>

                <p className="text-xs text-[var(--sk-muted)] mt-0.5">
                  {editingId
                    ? isHi
                      ? "मौजूदा रिकॉर्ड की जानकारी बदलें"
                      : "Update the existing expense record"
                    : isHi
                      ? "नया खर्च रिकॉर्ड जोड़ें"
                      : "Add a new household expense"}
                </p>

              </div>

            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-[var(--sk-muted)] hover:bg-white/5 hover:text-[var(--sk-text)]"
              >
                <X size={14} />
                {isHi
                  ? "रद्द करें"
                  : "Cancel"}
              </button>
            )}

          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* DATE */}

              <InputGroup label={t.date}>
                <input
                  type="date"
                  className={`${inputCls} w-full`}
                  value={form.date}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                  required
                />
              </InputGroup>

              {/* CATEGORY */}

              <InputGroup label={t.category}>
                <select
                  className={`${selectCls} w-full`}
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category:
                        e.target.value,
                    }))
                  }
                >
                  {categories.map(
                    (key) => (
                      <option
                        key={key}
                        value={key}
                      >
                        {
                          categoryLabels[
                            key as keyof typeof categoryLabels
                          ]
                        }
                      </option>
                    )
                  )}
                </select>
              </InputGroup>

              {/* AMOUNT */}

              <InputGroup label={t.amount}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputCls} w-full`}
                  placeholder="₹ 0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      amount:
                        e.target.value,
                    }))
                  }
                  required
                />
              </InputGroup>

              {/* NOTE */}

              <InputGroup label={t.note}>
                <input
                  type="text"
                  className={`${inputCls} w-full`}
                  placeholder={
                    isHi
                      ? "दूध, सब्जी, बिजली बिल..."
                      : "Milk, vegetables, bill..."
                  }
                  value={form.note}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      note: e.target.value,
                    }))
                  }
                />
              </InputGroup>

            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">

              <button
                type="submit"
                className={`${btnPrimary} w-full sm:w-auto justify-center px-6`}
              >
                {editingId ? (
                  <Save size={15} />
                ) : (
                  <Plus size={15} />
                )}

                {editingId
                  ? isHi
                    ? "अपडेट करें"
                    : "Update Expense"
                  : t.addExpense}
              </button>

              {editingId && (
                <button
                  type="button"
                  className={`${btnSecondary} w-full sm:w-auto justify-center px-6`}
                  onClick={resetForm}
                >
                  <X size={15} />

                  {isHi
                    ? "रद्द करें"
                    : "Cancel"}
                </button>
              )}

              {!editingId && (
                <button
                  type="button"
                  className={`${btnSecondary} w-full sm:w-auto justify-center px-6`}
                  onClick={clearAllRecords}
                >
                  <Trash2 size={15} />

                  {t.clearList}
                </button>
              )}

            </div>

          </form>

        </FormCard>

        {/* =================================================
            KPI
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">

          <KpiBox
            label={t.monthTotal}
            value={fmt(filteredTotal)}
            bar
            barPct={Math.min(
              (filteredTotal / 20000) *
                100,
              100
            )}
          />

          <KpiBox
            label={t.dailyAvg}
            value={fmt(dailyAvg)}
          />

          <KpiBox
            label={t.topCat}
            value={topCatLabel}
          />

        </div>

      </div>

      {/* =================================================
          RECORDS
      ================================================== */}

      <FormCard>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div className="flex items-center gap-3">

            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400">
              <SlidersHorizontal size={18} />
            </div>

            <div>

              <h2 className="text-sm font-bold text-[var(--sk-text)]">
                {isHi
                  ? "खर्च रिकॉर्ड"
                  : "Expense Records"}
              </h2>

              <p className="text-[11px] text-[var(--sk-muted)]">
                {filteredRecords.length}{" "}
                {isHi
                  ? "रिकॉर्ड"
                  : "records"}
              </p>

            </div>

          </div>

          <div className="text-xs text-[var(--sk-muted)]">
            {isHi
              ? "कुल"
              : "Total"}{" "}
            <span className="font-bold text-[var(--sk-text2)]">
              {fmt(filteredTotal)}
            </span>
          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3 sm:p-4 mb-4">

          <div className="flex items-center gap-2 mb-3">

            <Search
              size={15}
              className="text-green-400"
            />

            <span className="text-xs font-semibold text-[var(--sk-text2)]">
              {isHi
                ? "खोजें और फ़िल्टर करें"
                : "Search & Filter"}
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sk-dim)] pointer-events-none"
              />

              <input
                className={`${inputCls} w-full pl-9`}
                placeholder={
                  isHi
                    ? "खर्च खोजें..."
                    : "Search expenses..."
                }
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            {/* DATE */}

            <select
              className={`${selectCls} w-full`}
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value as DateFilter
                )
              }
            >

              <option value="all">
                {isHi
                  ? "सभी तारीख"
                  : "All Dates"}
              </option>

              <option value="today">
                {isHi
                  ? "आज"
                  : "Today"}
              </option>

              <option value="month">
                {isHi
                  ? "इस महीने"
                  : "This Month"}
              </option>

              <option value="year">
                {isHi
                  ? "इस साल"
                  : "This Year"}
              </option>

            </select>

            {/* MIN */}

            <input
              type="number"
              min="0"
              className={`${inputCls} w-full`}
              placeholder={
                isHi
                  ? "न्यूनतम ₹"
                  : "Min ₹"
              }
              value={minAmount}
              onChange={(e) =>
                setMinAmount(
                  e.target.value
                )
              }
            />

            {/* MAX */}

            <input
              type="number"
              min="0"
              className={`${inputCls} w-full`}
              placeholder={
                isHi
                  ? "अधिकतम ₹"
                  : "Max ₹"
              }
              value={maxAmount}
              onChange={(e) =>
                setMaxAmount(
                  e.target.value
                )
              }
            />

            {/* CLEAR */}

            <button
              type="button"
              className={`${btnSecondary} w-full justify-center`}
              onClick={clearFilters}
            >
              {isHi
                ? "फ़िल्टर साफ़ करें"
                : "Clear Filters"}
            </button>

          </div>

        </div>

        {/* =================================================
            EXPORT
        ================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div className="text-xs text-[var(--sk-muted)]">
            {isHi
              ? "दिखाए जा रहे रिकॉर्ड"
              : "Showing records"}{" "}

            <span className="font-semibold text-[var(--sk-text2)]">
              {filteredRecords.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">

            <button
              type="button"
              className={`${btnSecondary} w-full sm:w-auto justify-center text-xs`}
              onClick={exportCSV}
            >
              <Download size={13} />

              {t.csvExport}
            </button>

            <button
              type="button"
              className={`${btnSecondary} w-full sm:w-auto justify-center text-xs`}
              onClick={exportPDF}
            >
              <FileText size={13} />

              {t.pdfDownload}
            </button>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================== */}

        <div className="w-full overflow-x-auto rounded-xl border border-[var(--sk-border)]">

          <table className="min-w-[800px] w-full text-sm">

            <thead>

              <tr className="bg-[var(--sk-card2)] border-b border-[var(--sk-border)] text-[var(--sk-faint)] text-[11px]">

                <th className="text-left py-3 px-3 font-semibold">
                  {t.date}
                </th>

                <th className="text-left py-3 px-3 font-semibold">
                  {t.category}
                </th>

                <th className="text-left py-3 px-3 font-semibold">
                  {t.note}
                </th>

                <th className="text-right py-3 px-3 font-semibold">
                  {t.amount}
                </th>

                <th className="text-center py-3 px-3 font-semibold">
                  {isHi
                    ? "संपादित"
                    : "Edit"}
                </th>

                <th className="text-center py-3 px-3 font-semibold">
                  {isHi
                    ? "हटाएं"
                    : "Delete"}
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredRecords.map(
                (record) => (

                  <tr
                    key={record.id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025] transition-colors"
                  >

                    {/* DATE */}

                    <td className="py-3 px-3 text-[var(--sk-faint)] text-xs font-mono whitespace-nowrap">
                      {record.date
                        ? record.date
                            .split("-")
                            .reverse()
                            .join("/")
                        : "—"}
                    </td>

                    {/* CATEGORY */}

                    <td className="py-3 px-3">

                      <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/15 px-2.5 py-1 text-[10px] font-semibold text-green-400 whitespace-nowrap">

                        {
                          categoryLabels[
                            record.category as keyof typeof categoryLabels
                          ] ||
                            record.category
                        }

                      </span>

                    </td>

                    {/* NOTE */}

                    <td className="py-3 px-3 text-[var(--sk-text2)] text-xs max-w-[300px]">

                      <div
                        className="truncate"
                        title={
                          record.note ||
                          ""
                        }
                      >
                        {record.note ||
                          "—"}
                      </div>

                    </td>

                    {/* AMOUNT */}

                    <td className="py-3 px-3 text-right">

                      <span className="font-bold font-mono text-red-400 text-xs whitespace-nowrap">
                        {fmt(
                          record.amount
                        )}
                      </span>

                    </td>

                    {/* EDIT */}

                    <td className="py-3 px-3 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          startEdit(record)
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                        title={
                          isHi
                            ? "संपादित करें"
                            : "Edit"
                        }
                        aria-label={
                          isHi
                            ? "संपादित करें"
                            : "Edit"
                        }
                      >
                        <Pencil
                          size={15}
                        />
                      </button>

                    </td>

                    {/* DELETE */}

                    <td className="py-3 px-3 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(
                            record.id
                          )
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title={
                          isHi
                            ? "हटाएं"
                            : "Delete"
                        }
                        aria-label={
                          isHi
                            ? "हटाएं"
                            : "Delete"
                        }
                      >
                        <Trash2
                          size={15}
                        />
                      </button>

                    </td>

                  </tr>
                )
              )}

              {/* EMPTY */}

              {filteredRecords.length ===
                0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center gap-2">

                      <div className="w-10 h-10 rounded-full bg-[var(--sk-hover)] flex items-center justify-center text-[var(--sk-dim)]">
                        <Search
                          size={18}
                        />
                      </div>

                      <p className="text-xs font-medium text-[var(--sk-muted)]">
                        {t.noRecords}
                      </p>

                      <p className="text-[10px] text-[var(--sk-dim)]">
                        {isHi
                          ? "फ़िल्टर बदलकर फिर से प्रयास करें"
                          : "Try changing your filters"}
                      </p>

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </FormCard>

    </div>
  );
}
