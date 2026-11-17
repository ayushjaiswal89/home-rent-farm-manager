"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, X, Save, Pencil, Trash2, ShoppingBag, Download, Printer, FileSpreadsheet } from "lucide-react";

import type { HomeExpense, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt, getLocalDateString } from "../../lib/utils";
import { exportCsvFile, generateCsvString } from "../../lib/csvExport";
import { printFinancialReport } from "../../lib/pdfExport";
import { exportToExcel } from "../../lib/excelExport";

import {
  InputGroup,
  KpiBox,
  btnPrimary,
  btnSecondary,
  inputCls,
  selectCls,
} from "../common/UI";
import { ConfirmDeleteModal } from "../common/ConfirmDeleteModal";

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

export function HomeSection({ records, setRecords, lang }: HomeSectionProps) {
  const t = STRINGS[lang];
  const isHi = lang === "hi";

  const getToday = () => getLocalDateString();

  const [form, setForm] = useState<HomeForm>({
    date: getToday(),
    category: "grocery",
    note: "",
    amount: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeHomeTab, setActiveHomeTab] = useState<'transactions' | 'categories' | 'summary'>('transactions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<HomeExpense | null>(null);

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

  const categoryIcons: Record<string, string> = {
    grocery: "🥦",
    bills: "⚡",
    medical: "💊",
    transport: "🚗",
    education: "📚",
    other: "📦",
  };

  const resetForm = useCallback(() => {
    setForm({
      date: getToday(),
      category: "grocery",
      note: "",
      amount: "",
    });
    setEditingId(null);
    setIsModalOpen(false);
  }, []);

  const openAddModal = useCallback(() => {
    setForm({
      date: getToday(),
      category: "grocery",
      note: "",
      amount: "",
    });
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  const startEdit = useCallback((record: HomeExpense) => {
    setEditingId(record.id);
    setForm({
      date: record.date,
      category: record.category,
      note: record.note || "",
      amount: String(record.amount),
    });
    setIsModalOpen(true);
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const amount = Number(form.amount);

      if (!form.date || !form.category || Number.isNaN(amount) || amount <= 0) {
        return;
      }

      if (editingId) {
        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? {
                  ...record,
                  date: form.date,
                  category: form.category,
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
    [form, editingId, resetForm, setRecords]
  );

  const onDelete = useCallback(
    (id: string) => {
      setRecords((current) => current.filter((record) => record.id !== id));
    },
    [setRecords]
  );

  const totalExpense = useMemo(
    () => records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  const groceryTotal = useMemo(
    () =>
      records
        .filter((record) => record.category === "grocery")
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  const billsTotal = useMemo(
    () =>
      records
        .filter((record) => record.category === "bills")
        .reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [records]
  );

  const exportHomeCSV = async () => {
    if (records.length === 0) return;
    const isHindi = lang === "hi";
    const headers = isHindi
      ? ["तारीख", "श्रेणी (Category)", "राशि (₹)", "नोट / विवरण"]
      : ["Date", "Category", "Amount (INR)", "Note / Details"];

    const rows = records.map((r) => [
      r.date,
      categoryLabels[r.category as keyof typeof categoryLabels] || r.category,
      r.amount,
      r.note || "",
    ]);

    const csvString = generateCsvString([headers, ...rows]);
    const todayStr = getLocalDateString();
    await exportCsvFile({
      filename: `ghar-kharch-${todayStr}.csv`,
      csvString,
      title: isHindi ? `घर खर्च रिपोर्ट (${todayStr})` : `Home Expense Report (${todayStr})`,
    });
  };

  const exportHomeExcel = () => {
    if (records.length === 0) return;
    const todayStr = getLocalDateString();
    exportToExcel({
      filename: `ghar-kharch-${todayStr}.xlsx`,
      lang,
      records: [],
      homeExpenses: records,
    });
  };

  const printHomePDF = () => {
    if (records.length === 0) return;
    const isHindi = lang === "hi";
    const catMap: Record<string, string> = {
      grocery: isHindi ? "राशन / किराना" : "Grocery",
      bills: isHindi ? "बिल / बिजली / पानी" : "Bills / Utilities",
      medical: isHindi ? "दवा / चिकित्सा" : "Medical",
      transport: isHindi ? "आवागमन / पेट्रोल" : "Transport",
      education: isHindi ? "शिक्षा / स्कूल" : "Education",
      other: isHindi ? "अन्य घरेलू खर्च" : "Other",
    };

    const totalExp = records.reduce((sum, r) => sum + r.amount, 0);

    printFinancialReport({
      title: isHindi ? "घरेलू खर्च स्टेटमेंट (Home Expenses)" : "Household Expense Statement",
      subtitle: isHindi ? "राशन, बिल, चिकित्सा एवं अन्य दैनिक खर्चों का रिकॉर्ड" : "Grocery, utility bills, health and daily expenditures",
      lang: isHindi ? "hi" : "en",
      summaryCards: [
        { label: isHindi ? "कुल खर्च रिकॉर्ड्स" : "Total Entries", value: `${records.length}`, color: "#2563eb" },
        { label: isHindi ? "कुल घरेलू खर्च" : "Total Household Spend", value: `₹${totalExp.toLocaleString("en-IN")}`, color: "#dc2626" },
      ],
      tableHeaders: isHindi
        ? ["तारीख", "श्रेणी (Category)", "विवरण / नोट", "राशि (₹)"]
        : ["Date", "Category", "Description / Note", "Amount (₹)"],
      tableRows: records.map((r) => ({
        cells: [
          r.date,
          catMap[r.category] || r.category,
          r.note || "—",
          `-₹${r.amount.toLocaleString("en-IN")}`,
        ],
      })),
      footerNotes: isHindi
        ? "स्मार्ट खाता द्वारा डिजिटल घरेलू खर्च स्टेटमेंट"
        : "Digital Household Statement generated by Smart Khaata",
    });
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 pb-24 sm:pb-16 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--sk-text)] flex items-center gap-2">
            <ShoppingBag className="text-amber-500" size={24} />
            <span>{isHi ? "घरेलू खर्च" : "Household Expenses"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sk-muted)] mt-0.5">
            {isHi ? "दैनिक घरेलू खर्च (राशन, बिजली, दवाइयां, शिक्षा) का बहीखाता" : "Daily household groceries, bills, healthcare and domestic expenses"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={exportHomeExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-white/5 text-[var(--sk-text)] font-semibold text-xs sm:text-sm transition cursor-pointer"
            title={isHi ? "Excel (.xlsx) डाउनलोड करें" : "Export Excel"}
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            Excel
          </button>
          <button
            type="button"
            onClick={exportHomeCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] hover:bg-white/5 text-[var(--sk-text)] font-semibold text-xs sm:text-sm transition cursor-pointer"
            title="CSV Export"
          >
            <Download size={14} className="text-teal-500" />
            CSV
          </button>
          <button
            type="button"
            onClick={printHomePDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 font-semibold text-xs sm:text-sm transition cursor-pointer"
            title={isHi ? "PDF प्रिंट करें" : "Print PDF"}
          >
            <Printer size={14} />
            {isHi ? "PDF" : "PDF"}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            {isHi ? "+ नया खर्च" : "+ Add Expense"}
          </button>
        </div>
      </div>

      {/* 3 TABS matching Screen 6: [लेन-देन] [श्रेणी] [मासिक सारांश] */}
      <div className="flex rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] p-1 w-full overflow-x-auto no-scrollbar shadow-sm gap-1">
        <button
          type="button"
          onClick={() => setActiveHomeTab('transactions')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer flex-1 ${
            activeHomeTab === 'transactions'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <span>{isHi ? 'लेन-देन' : 'Transactions'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHomeTab('categories')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer flex-1 ${
            activeHomeTab === 'categories'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <span>{isHi ? 'श्रेणी' : 'Categories'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHomeTab('summary')}
          className={`shrink-0 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold min-h-[38px] transition cursor-pointer flex-1 ${
            activeHomeTab === 'summary'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card)]'
          }`}
        >
          <span>{isHi ? 'मासिक सारांश' : 'Monthly Summary'}</span>
        </button>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiBox label={isHi ? "कुल घर खर्च" : "Total Expense"} value={fmt(totalExpense)} color="text-red-400" />
        <KpiBox label={isHi ? "कुल प्रविष्टियां" : "Entries"} value={String(records.length)} />
        <KpiBox label="🥦 किराना (Grocery)" value={fmt(groceryTotal)} />
        <KpiBox label="⚡ बिल (Utilities)" value={fmt(billsTotal)} />
      </div>

      {/* LIST */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-4 py-3 bg-[var(--sk-card2)]">
          <div className="text-sm font-bold text-[var(--sk-text)]">
            {isHi ? "हाल के घरेलू खर्च" : "Recent Household Expenses"}
          </div>
          <span className="text-xs text-[var(--sk-dim)] font-mono">{records.length} items</span>
        </div>

        {records.length > 0 ? (
          <div className="divide-y divide-white/5">
            {records.map((record) => {
              const icon = categoryIcons[record.category] || "📦";
              const category =
                categoryLabels[record.category as keyof typeof categoryLabels] ||
                record.category;

              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[var(--sk-text)]">{category}</div>
                    <div className="text-xs text-[var(--sk-muted)] mt-0.5 truncate">
                      {record.note || "—"} • {record.date ? record.date.split("-").reverse().join("-") : "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-sm font-bold font-mono text-red-400 whitespace-nowrap">
                      {fmt(record.amount)}
                    </div>

                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500/20 active:scale-95 transition cursor-pointer"
                      title={isHi ? "संपादित करें" : "Edit"}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(record)}
                      className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition cursor-pointer"
                      title={isHi ? "हटाएं" : "Delete"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <div className="text-4xl mb-2">🧾</div>
            <p className="text-sm font-semibold text-[var(--sk-muted)]">
              {isHi ? "अभी कोई खर्च दर्ज नहीं है" : "No expenses yet"}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className={`${btnPrimary} mt-4 px-4 py-2 cursor-pointer`}
            >
              <Plus size={15} />
              {isHi ? "पहला खर्च जोड़ें" : "Add First Expense"}
            </button>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sk-border)]">
              <h3 className="text-base font-bold text-[var(--sk-text)]">
                {editingId
                  ? isHi
                    ? "खर्च संपादित करें"
                    : "Edit Expense"
                  : isHi
                  ? "नया घरेलू खर्च जोड़ें"
                  : "Add Household Expense"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:bg-white/5 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 space-y-3.5">
              <InputGroup label={t.date}>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date}
                  onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
                  required
                />
              </InputGroup>

              <InputGroup label={t.category}>
                <select
                  className={selectCls}
                  value={form.category}
                  onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                >
                  {categories.map((key) => (
                    <option key={key} value={key}>
                      {categoryIcons[key]} {categoryLabels[key as keyof typeof categoryLabels]}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label={t.amount}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  placeholder="₹ 0"
                  value={form.amount}
                  onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                  required
                  autoFocus
                />
              </InputGroup>

              <InputGroup label={t.note}>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={isHi ? "सब्जी, दूध, राशन आदि..." : "Vegetables, milk, ration..."}
                  value={form.note}
                  onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))}
                />
              </InputGroup>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${btnSecondary} flex-1 justify-center cursor-pointer`}
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`${btnPrimary} flex-1 justify-center cursor-pointer`}
                >
                  {editingId ? <Save size={15} /> : <Plus size={15} />}
                  {editingId ? (isHi ? "अपडेट करें" : "Update") : (isHi ? "सेव करें" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            onDelete(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        title={isHi ? "घरेलू खर्च हटाएं?" : "Delete Expense?"}
        message={
          isHi
            ? "क्या आप वाकई इस खर्च को हटाना चाहते हैं? यह प्रविष्टि बहीखाते से हमेशा के लिए हट जाएगी।"
            : "Are you sure you want to delete this expense entry?"
        }
        confirmText={isHi ? "हाँ, हटाएं" : "Delete"}
        cancelText={isHi ? "रद्द करें" : "Cancel"}
        itemDetails={
          expenseToDelete ? (
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--sk-text)] flex items-center gap-1.5">
                <span>{categoryIcons[expenseToDelete.category] || "📦"}</span>
                <span>{categoryLabels[expenseToDelete.category as keyof typeof categoryLabels] || expenseToDelete.category}</span>
                {expenseToDelete.note && <span className="text-[var(--sk-muted)] font-normal">({expenseToDelete.note})</span>}
              </span>
              <span className="font-mono text-red-500 font-bold">{fmt(expenseToDelete.amount)}</span>
            </div>
          ) : null
        }
      />
    </div>
  );
}
