"use client";

import { useCallback, useMemo, useState } from "react";
import { FarmRecord, Lang } from "../../lib/types";
import { FarmForm, FarmFormData } from "../farm/FarmForm";
import { STRINGS } from "../../lib/i18n";
import { FARM_STRINGS } from "../../lib/farmI18n";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { SectionHeader } from "../common/UI";
import { FarmTable } from "../farm/FarmTable";
import FarmSummary from "../farm/FarmSummary";

interface FarmSectionProps {
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  lang: Lang;
}

const PIE_COLORS = ["#4ade80", "#f59e0b", "#f87171", "#818cf8", "#38bdf8", "#a78bfa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DEFAULT_CROPS = [
  "Wheat",
  "Rice",
  "Soybean",
  "Cotton",
  "Other",
];

const DEFAULT_WORKERS = [
  "Worker 1",
  "Worker 2",
  "Worker 3",
  "Other",
];

const DEFAULT_MACHINES = [
  "Tractor",
  "Rotavator",
  "Cultivator",
  "Harvester",
  "Sprayer",
  "Other",
];

const DEFAULT_EXPENSE_CATEGORIES = ["बीज", "खाद", "मजदूरी", "डीजल", "सिंचाई", "अन्य",];
export function FarmSection({ records, setRecords, lang }: FarmSectionProps) {

  const t = STRINGS[lang];
  const farmT = FARM_STRINGS[lang];
  const getSeason = useCallback((date: string) => {
    const month = new Date(date).getMonth() + 1;

    if (month >= 6 && month <= 10) return "Kharif";
    if (month >= 11 || month <= 3) return "Rabi";
    return "Zaid";
  }, []);

  const calculateSaleAmount = useCallback(
    (qty: number, price: number) => qty * price,
    []
  );
  const convertYieldToKg = useCallback(
    (quantity: number, unit: string) => {
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

  const today = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );
  const getDefaultForm = useCallback(
    (): FarmFormData => ({
      date: today,
      type: "Expense",
      crop: "Wheat",
      expenseCategory: "खाद",
      amount: "",
      quantity: "",
      unit: "Kg",
      price: "",
      note: "",
      field: "",
      area: "",
      areaUnit: "बीघा",
      worker: "",
      machine: "",
      season: getSeason(today),
    }),
    [getSeason, today]
  );
  const [form, setForm] = useState<FarmFormData>(getDefaultForm);
  const [cropSearch, setCropSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [typeFilter, setTypeFilter] =
    useState<"all" | FarmRecord["type"]>("all");

  const [dateFilter, setDateFilter] =
    useState<"all" | "today" | "month" | "year">("all");

  const filteredRecords = useMemo(() => {



    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    const search = cropSearch.trim().toLowerCase();

    return records.filter(record => {
      const cropMatch =
        record.crop.toLowerCase().includes(search) ||
        (record.note ?? "").toLowerCase().includes(search);

      const typeMatch =
        typeFilter === "all"
          ? true
          : record.type === typeFilter;

      let dateMatch = true;

      switch (dateFilter) {

        case "today":
          dateMatch = record.date === today;
          break;

        case "month":
          dateMatch = record.date.startsWith(month);
          break;

        case "year":
          dateMatch = record.date.startsWith(year);
          break;

        default:
          dateMatch = true;
      }

      return cropMatch && typeMatch && dateMatch;

    });

  }, [records, cropSearch, typeFilter, dateFilter, today]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const totalExpense = useMemo(
    () =>
      filteredRecords
        .filter(record => record.type === "Expense")
        .reduce((sum, record) => sum + record.amount, 0),
    [filteredRecords]
  );
  const totalSales = useMemo(
    () =>
      filteredRecords
        .filter(record => record.type === "Sale")
        .reduce((sum, record) => sum + record.amount, 0),
    [filteredRecords]
  );
  const profit = useMemo(() => totalSales - totalExpense, [totalSales, totalExpense]);

  const totalYield = useMemo(
    () =>
      filteredRecords
        .filter(record => record.type === "Yield")
        .reduce(
          (sum, record) =>
            sum + convertYieldToKg(record.quantity, record.unit),
          0
        ),
    [filteredRecords, convertYieldToKg]
  );

  const pieData = useMemo(() => {
    const totals = filteredRecords
      .filter(r => r.type === "Expense")
      .reduce<Record<string, number>>((acc, r) => {
        acc[r.expenseCategory] =
          (acc[r.expenseCategory] || 0) + r.amount;
        return acc;
      }, {});

    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredRecords]);

  const cropStats = useMemo(() => {
    const cropRecords = records.filter(
      record => record.crop === selectedCrop
    );

    const expense = cropRecords
      .filter(record => record.type === "Expense")
      .reduce((sum, record) => sum + record.amount, 0);

    const sale = cropRecords
      .filter(record => record.type === "Sale")
      .reduce((sum, record) => sum + record.amount, 0);

    const yieldQty = cropRecords
      .filter(record => record.type === "Yield")
      .reduce(
        (sum, record) =>
          sum + convertYieldToKg(record.quantity, record.unit),
        0
      );

    return {
      expense,
      sale,
      yieldQty,
      profit: sale - expense,
    };
  }, [records, selectedCrop, convertYieldToKg]);
  const handleEdit = useCallback((record: FarmRecord) => {
    setEditingId(record.id);

    setForm({
      date: record.date,
      type: record.type,
      crop: record.crop,
      expenseCategory: record.expenseCategory,
      amount: record.type === "Expense" ? String(record.amount) : "",
      quantity: String(record.quantity),
      unit: record.unit,
      price: String(record.price),
      note: record.note,
      field: record.field ?? "",
      area: String(record.area ?? ""),
      areaUnit: record.areaUnit ?? "बीघा",
      worker: record.worker ?? "",
      machine: record.machine ?? "",
      season: record.season ?? getSeason(record.date),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [getSeason]);

  const addRecord = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const amount = Number(form.amount);
      const quantity = Number(form.quantity);
      const price = Number(form.price);

      // 1. पहले validation
      if (
        !form.date ||
        !form.crop.trim() ||
        (form.type === "Expense" && amount <= 0) ||
        (form.type === "Yield" && quantity <= 0) ||
        (form.type === "Sale" && (quantity <= 0 || price <= 0))
      ) {
        window.alert(
          lang === "hi"
            ? "कृपया मान्य फ़ॉर्म विवरण दर्ज करें।"
            : "Please enter valid form values."
        );
        return;
      }

      const finalAmount =
        form.type === "Sale"
          ? calculateSaleAmount(quantity, price)
          : form.type === "Expense"
            ? amount
            : 0;

      // 2. उसके बाद Edit
      if (editingId) {
        setRecords((current) =>
          current.map((record) =>
            record.id === editingId
              ? {
                ...record,
                date: form.date,
                type: form.type,
                crop: form.crop.trim(),
                expenseCategory: form.expenseCategory,
                amount: finalAmount,
                quantity: quantity || 0,
                unit: form.unit,
                price: price || 0,
                note: form.note,
                field: form.field,
                area: Number(form.area || 0),
                areaUnit: form.areaUnit,
                worker: form.worker,
                machine: form.machine,
                season: form.season,
              }
              : record
          )
        );

        setEditingId(null);
        setForm(getDefaultForm());

        return;
      }

      // 3. नया record Add
      setRecords((current) => [
        {
          id: `f${Date.now()}`,
          date: form.date,
          type: form.type,
          crop: form.crop.trim(),
          expenseCategory: form.expenseCategory,
          amount: finalAmount,
          quantity: quantity || 0,
          unit: form.unit,
          price: price || 0,
          note: form.note,
          field: form.field,
          area: Number(form.area || 0),
          areaUnit: form.areaUnit,
          worker: form.worker,
          machine: form.machine,
          season: form.season,
        },
        ...current,
      ]);

      setForm(getDefaultForm());
    },
    [
      form,
      editingId,
      setRecords,
      getDefaultForm,
      lang,
      calculateSaleAmount,
    ]
  );

  const deleteRecord = useCallback((id: string) => {
    if (
      !window.confirm(
        lang === "hi"
          ? "क्या आप यह रिकॉर्ड हटाना चाहते हैं?"
          : "Delete this record?"
      )
    ) {
      return;
    }

    setRecords((current) =>
      current.filter((record) => record.id !== id)
    );
  }, [lang, setRecords]);

  const crops = DEFAULT_CROPS;

  const [expCategories] = useLocalStorage(
    "farm-expense-categories",
    DEFAULT_EXPENSE_CATEGORIES
  );


  const chartData = useMemo(() => {


    const totals = Array.from({ length: 12 }, () => ({
      sale: 0,
      expense: 0,
    }));

    records.forEach((record) => {
      const month = new Date(record.date).getMonth();

      if (record.type === "Sale") {
        totals[month].sale += record.amount;
      }

      if (record.type === "Expense") {
        totals[month].expense += record.amount;
      }
    });

    return MONTHS.map((month, index) => ({
      month,
      farm: totals[index].sale - totals[index].expense,
    }));
  }, [records]);

  const saleAmount = calculateSaleAmount(
    Number(form.quantity || 0),
    Number(form.price || 0)
  );

 return (
  <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 pb-8">

    <SectionHeader
      title={farmT.farmTitle}
      sub={farmT.farmSub}
    />

   

    {/* ================= FORM ================= */}
    <div className="mb-5">
      <FarmForm
        form={form}
        setForm={setForm}
        editingId={editingId}
        setEditingId={setEditingId}
        addRecord={addRecord}
        lang={lang}
        farmT={farmT}
        crops={crops}
        expCategories={expCategories}
        workers={DEFAULT_WORKERS}
        machines={DEFAULT_MACHINES}
        getSeason={getSeason}
        saleAmount={saleAmount}
      />
    </div>

    {/* ================= SUMMARY ================= */}
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
        setSelectedCrop={setSelectedCrop}
        crops={crops}
        chartData={chartData}
        pieColors={PIE_COLORS}
      />
    </div>

    {/* ================= TABLE ================= */}
    <div className="mt-5">
      <FarmTable
        lang={lang}
        filteredRecords={filteredRecords}
        cropSearch={cropSearch}
        setCropSearch={setCropSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onEdit={handleEdit}
        onDelete={deleteRecord}
      />
    </div>

  </div>
)
};