"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Download,
  FileText,
  Search,
  Trash2,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { HomeExpense, Lang } from "../../lib/types";
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
  setRecords: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
  lang: Lang;
}

interface HomeForm {
  date: string;
  category: string;
  note: string;
  amount: string;
}

export function HomeSection({
  records,
  setRecords,
  lang,
}: HomeSectionProps) {
  const t = STRINGS[lang];

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState<HomeForm>({
    date: new Date().toISOString().split("T")[0],
    category: "grocery",
    note: "",
    amount: "",
  });

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
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

  const categories = Object.keys(categoryLabels);

  // =====================================================
  // FILTERED RECORDS
  // =====================================================

  const filteredRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    const searchText = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        record.category.toLowerCase().includes(searchText) ||
        (record.note || "").toLowerCase().includes(searchText);

      if (searchText && !matchesSearch) {
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
        record.amount < Number(minAmount)
      ) {
        return false;
      }

      if (
        maxAmount &&
        record.amount > Number(maxAmount)
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
  ]);

  // =====================================================
  // KPI
  // =====================================================

  const monthTotal = useMemo(
    () =>
      filteredRecords.reduce(
        (acc, record) => acc + record.amount,
        0
      ),
    [filteredRecords]
  );

  const dailyAvg = useMemo(() => {
    if (!filteredRecords.length) return 0;

    const uniqueDays = new Set(
      filteredRecords.map((record) => record.date)
    ).size;

    return uniqueDays
      ? monthTotal / uniqueDays
      : 0;
  }, [filteredRecords, monthTotal]);

  const topCatName = useMemo(() => {
    const totals = filteredRecords.reduce<Record<string, number>>(
      (acc, record) => {
        acc[record.category] =
          (acc[record.category] || 0) + record.amount;

        return acc;
      },
      {}
    );

    return (
      Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      ""
    );
  }, [filteredRecords]);

  const topCatLabel = useMemo(() => {
    if (!topCatName) return "—";

    return (
      categoryLabels[
      topCatName as keyof typeof categoryLabels
      ] || topCatName
    );
  }, [topCatName, categoryLabels]);

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = useCallback(() => {
    setForm({
      date: new Date()
        .toISOString()
        .split("T")[0],
      category: "grocery",
      note: "",
      amount: "",
    });
  }, []);

  // =====================================================
  // ADD
  // =====================================================

  const onAddRecord = useCallback(
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
          lang === "hi"
            ? "कृपया सभी आवश्यक जानकारी सही भरें।"
            : "Please fill in all required fields with valid values."
        );
        return;
      }

      setRecords((current) => [
        {
          id: `h${Date.now()}`,
          ...form,
          amount,
        },
        ...current,
      ]);

      resetForm();
    },
    [form, lang, resetForm, setRecords]
  );

  // =====================================================
  // DELETE
  // =====================================================

  const onDelete = useCallback(
    (id: string) => {
      setRecords((current) =>
        current.filter(
          (record) => record.id !== id
        )
      );
    },
    [setRecords]
  );

  // =====================================================
  // CLEAR ALL
  // =====================================================

  const clearAllRecords = useCallback(() => {
    const confirmed = window.confirm(
      lang === "hi"
        ? "क्या आप सभी Home Expense रिकॉर्ड हटाना चाहते हैं?"
        : "Delete all home expense records?"
    );

    if (confirmed) {
      setRecords([]);
    }
  }, [lang, setRecords]);

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
  // CSV
  // =====================================================

  const exportCSV = useCallback(() => {
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
        ],
        record.note,
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

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "home-expenses.csv";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, [filteredRecords, categoryLabels, t]);

  // =====================================================
  // PDF
  // =====================================================

  const exportPDF = useCallback(() => {
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
        ],
        record.note,
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
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111;
          }

          h2 {
            margin-bottom: 20px;
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
            border-bottom: 1px solid #e5e7eb;
          }

          .total {
            margin-top: 20px;
            font-weight: bold;
          }
        </style>
      </head>

      <body>

        <h2>${t.homeTitle}</h2>

        <table>
          <thead>
            <tr>
              ${headers
        .map(
          (h) =>
            `<th>${h}</th>`
        )
        .join("")}
            </tr>
          </thead>

          <tbody>
            ${rows
        .map(
          (row) => `
                  <tr>
                    ${row
              .map(
                (cell) =>
                  `<td>${cell}</td>`
              )
              .join("")}
                  </tr>
                `
        )
        .join("")}
          </tbody>
        </table>

        <div class="total">
          Total: ${fmt(monthTotal)}
        </div>

      </body>
      </html>
    `;

    const win = window.open(
      "",
      "_blank",
      "width=900,height=600"
    );

    if (!win) {
      window.alert(
        lang === "hi"
          ? "Popup block हो गया।"
          : "Popup blocked."
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
    lang,
    monthTotal,
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
          lang === "hi"
            ? "अपने घर के दैनिक खर्चों को आसानी से ट्रैक करें"
            : "Track and manage your daily household expenses"
        }
      />

      {/* =================================================
          MAIN TOP AREA
      ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-4 lg:gap-5 mb-5">

        {/* =================================================
            ADD EXPENSE CARD
        ================================================== */}

        <FormCard>

          <div className="flex items-center gap-3 mb-5">

            

            <div>
              <h2 className="text-base font-bold text-[var(--sk-text)]">
                {t.addExpense}
              </h2>

              <p className="text-xs text-[var(--sk-muted)] mt-0.5">
                {lang === "hi"
                  ? "नया खर्च रिकॉर्ड जोड़ें"
                  : "Add a new household expense"}
              </p>
            </div>

          </div>

          <form
            onSubmit={onAddRecord}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

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

              <InputGroup label={t.category}>
                <select
                  className={`${selectCls} w-full`}
                  value={form.category}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                >
                  {categories.map((key) => (
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
                  ))}
                </select>
              </InputGroup>

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
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </InputGroup>

              <InputGroup label={t.note}>
                <input
                  type="text"
                  className={`${inputCls} w-full`}
                  placeholder={
                    lang === "hi"
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
                 {t.addExpense}
              </button>

              <button
                type="button"
                className={`${btnSecondary} w-full sm:w-auto justify-center px-6`}
                onClick={clearAllRecords}
              >
                {t.clearList}
              </button>

            </div>

          </form>

        </FormCard>

        {/* =================================================
            KPI AREA
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">

          <KpiBox
            label={t.monthTotal}
            value={fmt(monthTotal)}
            bar
            barPct={Math.min(
              (monthTotal / 20000) * 100,
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
          RECORDS SECTION
      ================================================== */}

      <FormCard>

        {/* RECORD HEADER */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div className="flex items-center gap-3">

            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400">
              <SlidersHorizontal size={18} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[var(--sk-text)]">
                {lang === "hi"
                  ? "खर्च रिकॉर्ड"
                  : "Expense Records"}
              </h2>

              <p className="text-[11px] text-[var(--sk-muted)]">
                {filteredRecords.length}{" "}
                {lang === "hi"
                  ? "रिकॉर्ड"
                  : "records"}
              </p>
            </div>

          </div>

          <div className="text-xs text-[var(--sk-muted)]">
            {fmt(monthTotal)}
          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-3 sm:p-4 mb-4">

          <div className="flex items-center gap-2 mb-3">

            <Search size={15} className="text-green-400" />

            <span className="text-xs font-semibold text-[var(--sk-text2)]">
              {lang === "hi"
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
                  lang === "hi"
                    ? "खर्च खोजें..."
                    : "Search expenses..."
                }
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {/* DATE */}

            <select
              className={`${selectCls} w-full`}
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
            >

              <option value="all">
                {lang === "hi"
                  ? "सभी तारीख"
                  : "All Dates"}
              </option>

              <option value="today">
                {lang === "hi"
                  ? "आज"
                  : "Today"}
              </option>

              <option value="month">
                {lang === "hi"
                  ? "इस महीने"
                  : "This Month"}
              </option>

              <option value="year">
                {lang === "hi"
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
                lang === "hi"
                  ? "न्यूनतम ₹"
                  : "Min ₹"
              }
              value={minAmount}
              onChange={(e) =>
                setMinAmount(e.target.value)
              }
            />

            {/* MAX */}

            <input
              type="number"
              min="0"
              className={`${inputCls} w-full`}
              placeholder={
                lang === "hi"
                  ? "अधिकतम ₹"
                  : "Max ₹"
              }
              value={maxAmount}
              onChange={(e) =>
                setMaxAmount(e.target.value)
              }
            />

            {/* CLEAR */}

            <button
              type="button"
              className={`${btnSecondary} w-full justify-center`}
              onClick={clearFilters}
            >
              {lang === "hi"
                ? "फ़िल्टर साफ़ करें"
                : "Clear Filters"}
            </button>

          </div>

        </div>

        {/* =================================================
            EXPORT BAR
        ================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

          <div className="text-xs text-[var(--sk-muted)]">
            {lang === "hi"
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

          <table className="min-w-[700px] w-full text-sm">

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

                <th className="text-center py-3 px-3 font-semibold w-14">
                  {lang === "hi"
                    ? "कार्य"
                    : "Action"}
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredRecords.map((record) => (

                <tr
                  key={record.id}
                  className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.025] transition-colors"
                >

                  {/* DATE */}

                  <td className="py-3 px-3 text-[var(--sk-faint)] text-xs font-mono whitespace-nowrap">
                    {record.date
                      .split("-")
                      .reverse()
                      .join("/")}
                  </td>

                  {/* CATEGORY */}

                  <td className="py-3 px-3">

                    <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/15 px-2.5 py-1 text-[10px] font-semibold text-green-400 whitespace-nowrap">

                      {
                        categoryLabels[
                        record.category as keyof typeof categoryLabels
                        ]
                      }

                    </span>

                  </td>

                  {/* NOTE */}

                  <td className="py-3 px-3 text-[var(--sk-text2)] text-xs max-w-[300px]">

                    <div className="truncate">
                      {record.note || "—"}
                    </div>

                  </td>

                  {/* AMOUNT */}

                  <td className="py-3 px-3 text-right">

                    <span className="font-bold font-mono text-red-400 text-xs whitespace-nowrap">
                      {fmt(record.amount)}
                    </span>

                  </td>

                  {/* ACTION */}

                  <td className="py-3 px-3 text-center">

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(record.id)
                      }
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--sk-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title={
                        lang === "hi"
                          ? "हटाएं"
                          : "Delete"
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </td>

                </tr>

              ))}

              {/* EMPTY */}

              {filteredRecords.length === 0 && (

                <tr>

                  <td
                    colSpan={5}
                    className="py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center gap-2">

                      <div className="w-10 h-10 rounded-full bg-[var(--sk-hover)] flex items-center justify-center text-[var(--sk-dim)]">
                        <Search size={18} />
                      </div>

                      <p className="text-xs font-medium text-[var(--sk-muted)]">
                        {t.noRecords}
                      </p>

                      <p className="text-[10px] text-[var(--sk-dim)]">
                        {lang === "hi"
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