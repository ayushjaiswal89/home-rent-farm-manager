"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FarmRecord, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import { FormCard, InputGroup, KpiBox, SearchBar, SectionHeader, StatusBadge, btnPrimary, btnSecondary, inputCls, selectCls } from "../common/UI";

interface FarmSectionProps {
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  lang: Lang;
}

interface FarmForm {
  date: string;
  type: FarmRecord["type"];
  crop: string;
  expenseCategory: string;
  amount: string;
  quantity: string;
  unit: string;
  price: string;
  note: string;
  field: string;
  area: string;
  areaUnit: string;
  worker: string;
  machine: string;
  season: string;
}

export function FarmSection({ records, setRecords, lang }: FarmSectionProps) {
  const t = STRINGS[lang];
  const [form, setForm] = useState<FarmForm>({
    date: new Date().toISOString().split("T")[0],
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
    season: "Kharif",
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FarmRecord["type"]>("all");

  const filteredRecords = useMemo(
    () => records.filter(record => {
      if (typeFilter !== "all" && record.type !== typeFilter) return false;
      return record.crop.toLowerCase().includes(search.toLowerCase()) || record.note.toLowerCase().includes(search.toLowerCase());
    }),
    [records, search, typeFilter]
  );

  const totalExpense = useMemo(() => records.filter(record => record.type === "Expense").reduce((sum, record) => sum + record.amount, 0), [records]);
  const totalSales = useMemo(() => records.filter(record => record.type === "Sale").reduce((sum, record) => sum + record.amount, 0), [records]);
  const profit = useMemo(() => totalSales - totalExpense, [totalSales, totalExpense]);

  const pieData = useMemo(() => {
    const categoryTotals = records.filter(record => record.type === "Expense").reduce<Record<string, number>>((acc, record) => {
      acc[record.expenseCategory] = (acc[record.expenseCategory] || 0) + record.amount;
      return acc;
    }, {});
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [records]);

  const addRecord = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const quantity = Number(form.quantity);
    const price = Number(form.price);
    if (!form.crop || (form.type === "Expense" && amount <= 0) || (form.type === "Sale" && (quantity <= 0 || price <= 0))) {
      return window.alert(lang === "hi" ? "कृपया मान्य फ़ॉर्म विवरण दर्ज करें।" : "Please enter valid form values.");
    }
    setRecords(current => [{
      id: `f${Date.now()}`,
      date: form.date,
      type: form.type,
      crop: form.crop,
      expenseCategory: form.expenseCategory,
      amount: amount || 0,
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
    }, ...current]);
    setForm(current => ({ ...current, amount: "", quantity: "", price: "", note: "", field: "", area: "", worker: "", machine: "" }));
  }, [form, lang, setRecords]);

  const deleteRecord = useCallback((id: string) => {
    setRecords(current => current.filter(record => record.id !== id));
  }, [setRecords]);

  const crops = useMemo(() => ["Wheat", "Rice", "Soybean", "Cotton", "Mustard", "Other"], []);
  const expCategories = useMemo(() => ["बीज", "खाद", "मजदूरी", "डीजल", "सिंचाई", "अन्य"], []);
  const chartData = useMemo(() => [{ month: "Jan", farm: 13000 }, { month: "Feb", farm: 17000 }, { month: "Mar", farm: 40000 }, { month: "Apr", farm: 26000 }, { month: "May", farm: 17000 }, { month: "Jun", farm: 34500 }], []);
  const PIE_COLORS = ["#4ade80", "#f59e0b", "#f87171", "#818cf8", "#38bdf8", "#a78bfa"];

  return (
    <div>
      <SectionHeader title={t.farmTitle} sub={t.farmSub} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { type: "Expense" as const, label: t.farmTypeExpense },
          { type: "Yield" as const, label: t.farmTypeYield },
          { type: "Sale" as const, label: t.farmTypeSale },
        ].map(button => (
          <button
            key={button.type}
            onClick={() => setForm(current => ({ ...current, type: button.type }))}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${form.type === button.type ? "bg-green-500 text-[#0f1221]" : "bg-[var(--sk-hover)] text-[var(--sk-muted)] hover:bg-[var(--sk-hover2)] border border-[var(--sk-border2)]"}`}
          >
            + {button.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FormCard>
          <form onSubmit={addRecord} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label={t.date}>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} />
              </InputGroup>
              <InputGroup label={t.type}>
                <select className={selectCls} value={form.type} onChange={e => setForm(current => ({ ...current, type: e.target.value as FarmRecord["type"] }))}>
                  <option value="Expense">{t.farmTypeExpense}</option>
                  <option value="Yield">{t.farmTypeYield}</option>
                  <option value="Sale">{t.farmTypeSale}</option>
                </select>
              </InputGroup>
              <InputGroup label={t.labelField}>
                <input type="text" className={inputCls} value={form.field} onChange={e => setForm(current => ({ ...current, field: e.target.value }))} />
              </InputGroup>
              <InputGroup label={t.labelArea}>
                <input type="number" min="0" step="0.01" className={inputCls} value={form.area} onChange={e => setForm(current => ({ ...current, area: e.target.value }))} />
              </InputGroup>
              <InputGroup label={t.labelAreaUnit}>
                <select className={selectCls} value={form.areaUnit} onChange={e => setForm(current => ({ ...current, areaUnit: e.target.value }))}>
                  <option>बीघा</option>
                  <option>एकड़</option>
                  <option>हेक्टेयर</option>
                </select>
              </InputGroup>
              <InputGroup label={t.crop}>
                <select className={selectCls} value={form.crop} onChange={e => setForm(current => ({ ...current, crop: e.target.value }))}>
                  {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
              </InputGroup>
              {form.type === "Expense" && (
                <InputGroup label={t.expCat}>
                  <select className={selectCls} value={form.expenseCategory} onChange={e => setForm(current => ({ ...current, expenseCategory: e.target.value }))}>
                    {expCategories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </InputGroup>
              )}
              {form.type === "Expense" && (
                <InputGroup label={t.amount}>
                  <input type="number" min="0" className={inputCls} value={form.amount} onChange={e => setForm(current => ({ ...current, amount: e.target.value }))} />
                </InputGroup>
              )}
              {(form.type === "Yield" || form.type === "Sale") && (
                <>
                  <InputGroup label={t.qty}>
                    <input type="number" min="0" className={inputCls} value={form.quantity} onChange={e => setForm(current => ({ ...current, quantity: e.target.value }))} />
                  </InputGroup>
                  <InputGroup label={t.unit}>
                    <select className={selectCls} value={form.unit} onChange={e => setForm(current => ({ ...current, unit: e.target.value }))}>
                      <option>Kg</option>
                      <option>Quintal</option>
                      <option>Ton</option>
                    </select>
                  </InputGroup>
                  {form.type === "Sale" && (
                    <InputGroup label={t.price}>
                      <input type="number" min="0" className={inputCls} value={form.price} onChange={e => setForm(current => ({ ...current, price: e.target.value }))} />
                    </InputGroup>
                  )}
                </>
              )}
            </div>
            <InputGroup label={t.note}>
              <input type="text" className={inputCls} value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
            </InputGroup>
            <button type="submit" className={btnPrimary}><Plus size={14} />{t.addRecord}</button>
          </form>
        </FormCard>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KpiBox label={t.totExpense} value={fmt(totalExpense)} bar barPct={(totalExpense / 100000) * 100} />
            <KpiBox label={t.totSales} value={fmt(totalSales)} bar barPct={(totalSales / 100000) * 100} />
            <KpiBox label={t.totProfit} value={fmt(profit)} green={profit >= 0} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormCard>
              <div className="text-xs text-[var(--sk-faint)] mb-2">{t.expCatLabel}</div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={28} outerRadius={45} paddingAngle={2}>
                        {pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ background: "var(--sk-card2)", border: "1px solid var(--sk-border2)", borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-1">
                    {pieData.slice(0, 3).map((item, index) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[index] }} />
                        <span className="text-[var(--sk-muted)] flex-1">{item.name}</span>
                        <span className="font-mono text-[var(--sk-text2)]">{fmt(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-[var(--sk-dim)] text-xs text-center py-6">{t.noRecords}</div>
              )}
            </FormCard>

            <FormCard>
              <div className="text-xs text-[var(--sk-faint)] mb-2">{t.monthlyChart}</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sk-grid)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ background: "var(--sk-card2)", border: "none", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="farm" fill="#4ade80" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </FormCard>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <FormCard>
          <div className="flex gap-2 mb-3 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder={t.searchFarm} />
            <select className={selectCls + " w-auto"} value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="all">{t.allTypes}</option>
              <option value="Expense">{t.farmTypeExpense}</option>
              <option value="Yield">{t.farmTypeYield}</option>
              <option value="Sale">{t.farmTypeSale}</option>
            </select>
            <button type="button" className={btnSecondary + " text-xs"} onClick={() => {
              const headers = [t.date, t.type, t.crop, t.labelField, t.labelArea, t.labelAreaUnit, t.expCat, t.amount, t.qty, t.unit, t.price, t.note];
              const rows = filteredRecords.map(record => [record.date, record.type, record.crop, record.field || "", record.area || "", record.areaUnit || "", record.expenseCategory, record.amount, record.quantity, record.unit, record.price, record.note]);
              const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
              const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "farm-records.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}><Download size={13} />CSV</button>
            <button type="button" className={btnSecondary + " text-xs"} onClick={() => {
              const headers = [t.date, t.type, t.crop, t.labelField, t.labelArea, t.labelAreaUnit, t.expCat, t.amount, t.qty, t.unit, t.price, t.note];
              const rows = filteredRecords.map(record => [record.date, record.type, record.crop, record.field || "", record.area || "", record.areaUnit || "", record.expenseCategory, record.amount, record.quantity, record.unit, record.price, record.note]);
              const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${t.farmTitle}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#166534;color:#fff;padding:8px;text-align:left;}td{padding:7px;border-bottom:1px solid #e5e7eb;}</style></head><body><h2>${t.farmTitle}</h2><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
              const win = window.open("", "_blank", "width=900,height=600");
              if (!win) return window.alert(lang === "hi" ? "पॉपअप ब्लॉक हो गया।" : "Popup blocked.");
              win.document.write(html);
              win.document.close();
            }}><FileText size={13} />PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)]">
                  {[t.date, t.type, t.crop, t.note, t.amount, t.tableAction].map(header => (
                    <th key={header} className="py-2 pr-3 text-left font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="py-2.5 pr-3 text-[var(--sk-faint)] font-mono">{record.date.split("-").reverse().join("/")}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={record.type} /></td>
                    <td className="py-2.5 pr-3 text-[var(--sk-text2)] font-semibold">{record.crop}</td>
                    <td className="py-2.5 pr-3 text-[var(--sk-muted)] text-xs max-w-[220px]">{record.note}</td>
                    <td className="py-2.5 pr-3 font-bold font-mono text-green-400">{record.type === "Expense" ? fmt(record.amount) : record.type === "Sale" ? fmt(record.amount) : `${record.quantity} ${record.unit}`}</td>
                    <td className="py-2.5">
                      <button onClick={() => deleteRecord(record.id)} className="text-[var(--sk-dim)] hover:text-red-400"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-[var(--sk-dim)]">{t.noRecords}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
