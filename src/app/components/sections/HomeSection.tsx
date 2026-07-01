"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import { HomeExpense, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import { FormCard, InputGroup, KpiBox, SearchBar, SectionHeader, btnPrimary, btnSecondary, inputCls, selectCls } from "../common/UI";

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
  const [form, setForm] = useState<HomeForm>({
    date: new Date().toISOString().split("T")[0],
    category: t.groceryCat,
    note: "",
    amount: "",
  });
  const [search, setSearch] = useState("");

  const categories = useMemo(() => [
    t.groceryCat,
    t.billsCat,
    t.medicalCat,
    t.transportCat,
    t.educationCat,
    t.otherCat,
  ], [t]);

  const categoryMap = useMemo<Record<string, string>>(() => ({
    "🥦 Grocery": t.groceryCat,
    "⚡ Bills": t.billsCat,
    "💊 Medical": t.medicalCat,
    "🚗 Transport": t.transportCat,
    "🎓 Education": t.educationCat,
    "🧾 Other": t.otherCat,
    "🥦 किराना": t.groceryCat,
    "⚡ बिल": t.billsCat,
    "💊 चिकित्सा": t.medicalCat,
    "🚗 परिवहन": t.transportCat,
    "🎓 शिक्षा": t.educationCat,
    "🧾 अन्य": t.otherCat,
  }), [t]);

  const filteredRecords = useMemo(
    () => records.filter(record =>
      record.category.toLowerCase().includes(search.toLowerCase()) ||
      record.note.toLowerCase().includes(search.toLowerCase())
    ),
    [records, search]
  );

  const monthTotal = useMemo(() => records.reduce((acc, record) => acc + record.amount, 0), [records]);
  const dailyAvg = useMemo(() => (records.length ? monthTotal / 30 : 0), [monthTotal, records.length]);
  const topCatName = useMemo(() => {
    const totals = records.reduce<Record<string, number>>((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + record.amount;
      return acc;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [records]);

  const resetForm = useCallback(() => {
    setForm({ date: new Date().toISOString().split("T")[0], category: t.groceryCat, note: "", amount: "" });
  }, [t.groceryCat]);

  const onAddRecord = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const amount = Number(form.amount);
      if (!form.date || !form.category || amount <= 0) {
        window.alert("Please fill in all required fields with valid values.");
        return;
      }
      setRecords(current => [{ id: `h${Date.now()}`, ...form, amount }, ...current]);
      resetForm();
    },
    [form, resetForm, setRecords]
  );

  const onDelete = useCallback((id: string) => {
    setRecords(current => current.filter(record => record.id !== id));
  }, [setRecords]);

  return (
    <div>
      <SectionHeader title={t.homeTitle} sub={t.homeSub} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FormCard>
          <form onSubmit={onAddRecord} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label={t.date}>
                <input
                  type="date"
                  className={inputCls}
                  value={form.date}
                  onChange={e => setForm(current => ({ ...current, date: e.target.value }))}
                  required
                />
              </InputGroup>
              <InputGroup label={t.category}>
                <select
                  className={selectCls}
                  value={form.category}
                  onChange={e => setForm(current => ({ ...current, category: e.target.value }))}
                >
                  {categories.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </InputGroup>
              <InputGroup label={t.amount}>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm(current => ({ ...current, amount: e.target.value }))}
                  required
                />
              </InputGroup>
              <InputGroup label={t.note}>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={lang === "hi" ? "दूध, सब्जी, बिजली बिल..." : "Milk, vegetables, bill..."}
                  value={form.note}
                  onChange={e => setForm(current => ({ ...current, note: e.target.value }))}
                />
              </InputGroup>
            </div>
            <div className="flex gap-2 pt-1 flex-wrap">
              <button type="submit" className={btnPrimary}><Plus size={14} />{t.addExpense}</button>
              <button type="button" className={btnSecondary} onClick={() => setRecords([])}>{t.clearList}</button>
            </div>
          </form>
        </FormCard>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <KpiBox label={t.monthTotal} value={fmt(monthTotal)} bar barPct={(monthTotal / 20000) * 100} />
            <KpiBox label={t.dailyAvg} value={fmt(dailyAvg)} trend="↑ 8%" />
            <KpiBox label={t.topCat} value={categoryMap[topCatName] || topCatName} />
          </div>

          <FormCard>
            <div className="flex gap-2 mb-3 flex-wrap">
              <SearchBar value={search} onChange={setSearch} placeholder={t.searchCat} />
              <button
                type="button"
                className={btnSecondary + " text-xs"}
                onClick={() => {
                  const headers = [t.date, t.category, t.note, t.amount];
                  const rows = filteredRecords.map(record => [record.date, categoryMap[record.category] || record.category, record.note, record.amount]);
                  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
                  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "home-expenses.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              ><Download size={13} />{t.csvExport}</button>
              <button
                type="button"
                className={btnSecondary + " text-xs"}
                onClick={() => {
                  const headers = [t.date, t.category, t.note, t.amount];
                  const rows = filteredRecords.map(record => [record.date, categoryMap[record.category] || record.category, record.note, fmt(record.amount)]);
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${t.homeTitle}</title>
                      <style>body{font-family:Arial,sans-serif;padding:24px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#166534;color:#fff;padding:8px;text-align:left;}td{padding:7px;border-bottom:1px solid #e5e7eb;}</style></head><body><h2>${t.homeTitle}</h2><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
                  const win = window.open("", "_blank", "width=900,height=600");
                  if (!win) return window.alert(lang === "hi" ? "पॉपअप ब्लॉक हो गया।" : "Popup blocked.");
                  win.document.write(html);
                  win.document.close();
                }}
              ><FileText size={13} />{t.pdfDownload}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)] text-xs">
                    <th className="text-left py-2 pr-3 font-semibold">{t.date}</th>
                    <th className="text-left py-2 pr-3 font-semibold">{t.category}</th>
                    <th className="text-left py-2 pr-3 font-semibold">{t.note}</th>
                    <th className="text-right py-2 pr-3 font-semibold">{t.amount}</th>
                    <th className="py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-2.5 pr-3 text-[var(--sk-faint)] text-xs font-mono">{record.date.split("-").reverse().join("/")}</td>
                      <td className="py-2.5 pr-3 text-[var(--sk-muted)] text-xs">{categoryMap[record.category] || record.category}</td>
                      <td className="py-2.5 pr-3 text-[var(--sk-text2)] text-xs max-w-[120px] truncate">{record.note}</td>
                      <td className="py-2.5 pr-3 text-right font-bold font-mono text-red-400 text-xs">{fmt(record.amount)}</td>
                      <td className="py-2.5 text-center">
                        <button onClick={() => onDelete(record.id)} className="text-[var(--sk-dim)] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-[var(--sk-dim)] text-xs">{t.noRecords}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </FormCard>
        </div>
      </div>
    </div>
  );
}
