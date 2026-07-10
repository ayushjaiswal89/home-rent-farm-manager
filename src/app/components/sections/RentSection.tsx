"use client";

import { useCallback, useMemo, useState } from "react";
import { Bell, Download, FileText, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RentRecord, Lang } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";
import { FormCard, InputGroup, KpiBox, SearchBar, SectionHeader, StatusBadge, btnPrimary, btnSecondary, inputCls, selectCls } from "../common/UI";

interface RentSectionProps {
  records: RentRecord[];
  setRecords: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  lang: Lang;
}

interface RentForm {
  date: string;
  tenant: string;
  month: string;
  whatsapp: string;
  amount: string;
  prevReading: string;
  currentReading: string;
  ratePerUnit: string;
  status: RentRecord["status"];
  note: string;
}

export function RentSection({ records, setRecords, lang }: RentSectionProps) {
  const t = STRINGS[lang];
  const months = useMemo(() => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], []);

  const [form, setForm] = useState<RentForm>({
    date: new Date().toISOString().split("T")[0],
    tenant: "",
    month: "Jun",
    whatsapp: "",
    amount: "",
    prevReading: "0",
    currentReading: "0",
    ratePerUnit: "8",
    status: "Received",
    note: "",
  });
  const [search, setSearch] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [monthFilter, setMonthFilter] = useState("");

  const units = useMemo(() => Math.max(0, Number(form.currentReading) - Number(form.prevReading)), [form.currentReading, form.prevReading]);
  const lightBill = useMemo(() => units * Number(form.ratePerUnit), [units, form.ratePerUnit]);
  const totalCalc = useMemo(() => Number(form.amount) + lightBill, [form.amount, lightBill]);
  const filteredRecords = useMemo(() => {
  return records.filter((record) => {

    const searchMatch =
      record.tenant.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      record.note.toLowerCase().includes(tenantSearch.toLowerCase());

    const statusMatch =
      statusFilter === "all"
        ? true
        : record.status === statusFilter;

    const monthMatch =
      monthFilter === ""
        ? true
        : record.month === monthFilter;

    return searchMatch && statusMatch && monthMatch;
  });
}, [records, tenantSearch, statusFilter, monthFilter]);

 

  const monthTotal = useMemo(() => filteredRecords.reduce((sum, record) => sum + record.amount, 0), [records]);
  const electricTotal = useMemo(() => records.reduce((sum, record) => sum + record.lightBill, 0), [records]);
  const combinedTotal = useMemo(() => records.reduce((sum, record) => sum + record.total, 0), [records]);
  const receivedTotal = useMemo(() => records.filter(record => record.status === "Received").reduce((sum, record) => sum + record.total, 0), [records]);
  const pendingTotal = useMemo(() => records.filter(record => record.status === "Pending").reduce((sum, record) => sum + record.total, 0), [records]);
  const partialTotal = useMemo(() => records.filter(record => record.status === "Partial").reduce((sum, record) => sum + record.total, 0), [records]);

  const resetForm = useCallback(() => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      tenant: "",
      month: "Jun",
      whatsapp: "",
      amount: "",
      prevReading: "0",
      currentReading: "0",
      ratePerUnit: "8",
      status: "Received",
      note: "",
    });
  }, []);

  const addRecord = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.tenant || amount <= 0) {
      window.alert(lang === "hi" ? "कृपया मान्य टेनेंट और राशि दर्ज करें।" : "Please enter a valid tenant and amount.");
      return;
    }
    setRecords(current => [
      {
        id: `r${Date.now()}`,
        date: form.date,
        tenant: form.tenant,
        month: form.month,
        whatsapp: form.whatsapp,
        amount,
        prevReading: Number(form.prevReading),
        currentReading: Number(form.currentReading),
        ratePerUnit: Number(form.ratePerUnit),
        units,
        lightBill,
        total: totalCalc,
        status: form.status,
        note: form.note,
      },
      ...current,
    ]);
    resetForm();
  }, [form, lightBill, totalCalc, units, lang, resetForm, setRecords]);

  const deleteRecord = useCallback((id: string) => {
    setRecords(current => current.filter(record => record.id !== id));
  }, [setRecords]);

  const sendReminder = useCallback(() => {
    const pending = filteredRecords.filter(record => record.status === "Pending");
    if (!pending.length) {
      return window.alert(lang === "hi" ? "कोई pending किराया नहीं है।" : "No pending rent records.");
    }
    pending.forEach(record => {
      if (!record.whatsapp) return;
      window.open(
        `https://wa.me/91${record.whatsapp}?text=${encodeURIComponent(
          `${lang === "hi" ? "नमस्ते" : "Hello"} ${record.tenant}, ${record.month} ${lang === "hi" ? "माह का किराया" : "month rent"} ${fmt(record.total)} ${lang === "hi" ? "बाकी है।" : "is pending."}`
        )}`,
        "_blank"
      );
    });
  }, [filteredRecords, lang]);

  return (
  <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
      <SectionHeader title={t.rentTitle} sub={t.rentSub} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <FormCard>
          <form onSubmit={addRecord} className="space-y-4">
            <div className="text-xs font-semibold text-[#4ade80] mb-2">{t.tenantDets}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputGroup label={t.date}>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} required />
              </InputGroup>
              <InputGroup label={t.tenant}>
                <input type="text" className={inputCls} value={form.tenant} onChange={e => setForm(current => ({ ...current, tenant: e.target.value }))} required />
              </InputGroup>
              <InputGroup label={t.month}>
                <select className={selectCls} value={form.month} onChange={e => setForm(current => ({ ...current, month: e.target.value }))}>
                  {months.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
              </InputGroup>
              <InputGroup label={t.whatsapp}>
                <input type="tel" maxLength={10} className={inputCls} value={form.whatsapp} onChange={e => setForm(current => ({ ...current, whatsapp: e.target.value }))} />
              </InputGroup>
            </div>

            <div className="text-xs font-semibold text-[#4ade80] mt-2 mb-1">{t.rentDets}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <InputGroup label={t.rent}>
                <input type="number" min="0" className={inputCls} value={form.amount} onChange={e => setForm(current => ({ ...current, amount: e.target.value }))} required />
              </InputGroup>
              <InputGroup label={t.status}>
                <select className={selectCls} value={form.status} onChange={e => setForm(current => ({ ...current, status: e.target.value as RentRecord["status"] }))}>
                  <option value="Received">{t.received}</option>
                  <option value="Pending">{t.pending}</option>
                  <option value="Partial">{t.partial}</option>
                </select>
              </InputGroup>
            </div>

            <div className="text-xs font-semibold text-[#4ade80] mt-2 mb-1">{t.elec}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputGroup label={t.prevReading}>
                <input type="number" min="0" className={inputCls} value={form.prevReading} onChange={e => setForm(current => ({ ...current, prevReading: e.target.value }))} />
              </InputGroup>
              <InputGroup label={t.currReading}>
                <input type="number" min="0" className={inputCls} value={form.currentReading} onChange={e => setForm(current => ({ ...current, currentReading: e.target.value }))} />
              </InputGroup>
              <InputGroup label={t.rateUnit}>
                <input type="number" min="0" className={inputCls} value={form.ratePerUnit} onChange={e => setForm(current => ({ ...current, ratePerUnit: e.target.value }))} />
              </InputGroup>
            </div>

            <div className="bg-[var(--sk-bg)] rounded-xl p-3 sm:p-4 border border-[var(--sk-border)] text-xs space-y-1">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-white/5 pb-2">
                <span>{t.unitsAuto}</span><span className="font-mono text-[var(--sk-text)]">{units.toFixed(2)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-white/5 pb-2">
                <span>{t.lightAuto}</span><span className="font-mono text-[var(--sk-text)]">{fmt(lightBill)}</span>
              </div>
             <div className="flex flex-col sm:flex-row sm:justify-between gap-2 border-b border-white/5 pb-2">
                <span className="font-semibold text-[var(--sk-text)]">{t.totalRentBill}</span>
                <span className="font-bold font-mono text-green-400">{fmt(totalCalc)}</span>
              </div>
            </div>

            <InputGroup label={t.note}>
              <input type="text" className={inputCls} value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
            </InputGroup>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>{t.addIncome}</button>
              <button type="button" className={`${btnSecondary} w-full sm:w-auto`} onClick={() => setRecords([])}>{t.clearRent}</button>
            </div>
          </form>
        </FormCard>

        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiBox label={t.monthColl} value={fmt(monthTotal)} />
            <KpiBox label={t.electricTot} value={fmt(electricTotal)} />
            <KpiBox label={t.combined} value={fmt(combinedTotal)} green />
            <KpiBox label={t.received} value={fmt(receivedTotal)} />
            <KpiBox label={t.pending} value={fmt(pendingTotal)} />
            <KpiBox label={t.partial} value={fmt(partialTotal)} />
          </div>

          <FormCard>
         <div className="grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
xl:grid-cols-6
gap-3
mb-4">

<select
  className={`${selectCls} w-full`}
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="all">All Status</option>
  <option value="Received">Received</option>
  <option value="Pending">Pending</option>
  <option value="Partial">Partial</option>
</select>

<select
  className={`${selectCls} w-full`}
  value={monthFilter}
  onChange={(e) => setMonthFilter(e.target.value)}
>
  <option value="">All Month</option>

  {months.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
  ))}
</select>
              <SearchBar value={search} onChange={setSearch} placeholder={t.searchTenant} />
              <button type="button" className={btnSecondary + " w-full text-xs"} onClick={() => {
                const headers = [t.date, t.tenant, t.month, t.rent, t.unitsAuto, t.elec, t.totalRentBill, t.status];
                const rows = filteredRecords.map(record => [record.date, record.tenant, record.month, fmt(record.amount), record.units, fmt(record.lightBill), fmt(record.total), record.status]);
                const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
                const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "rent-records.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}><Download size={13} />CSV</button>
              <button type="button" className={btnSecondary + " text-xs"} onClick={() => {
                const headers = [t.date, t.tenant, t.month, t.rent, t.unitsAuto, t.elec, t.totalRentBill, t.status];
                const rows = filteredRecords.map(record => [record.date, record.tenant, record.month, fmt(record.amount), record.units, fmt(record.lightBill), fmt(record.total), record.status]);
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${t.rentTitle}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#166534;color:#fff;padding:8px;text-align:left;}td{padding:7px;border-bottom:1px solid #e5e7eb;}</style></head><body><h2>${t.rentTitle}</h2><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
                const win = window.open("", "_blank", "width=900,height=600");
                if (!win) return window.alert(lang === "hi" ? "पॉपअप ब्लॉक हो गया।" : "Popup blocked.");
                win.document.write(html);
                win.document.close();
              }}><FileText size={13} />PDF</button>
              <button type="button" className={btnSecondary + " text-xs"} onClick={sendReminder}><Bell size={13} />{t.reminder}</button>
            </div>
            <div className="w-full overflow-x-auto rounded-xl">
              <table className="min-w-[950px] w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--sk-border)] text-[var(--sk-faint)]">
                    {[t.date, t.tenant, t.month, t.rent, t.unitsAuto, t.elec, t.totalRentBill, t.status, t.tableWA, ""].map((heading, index) => (
                      <th key={index} className="py-2 pr-2 font-semibold text-left">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-2 pr-2 whitespace-nowrap text-[var(--sk-faint)] font-mono">{record.date.split("-").reverse().join("/")}</td>
                      <td className="py-2 pr-2 font-semibold whitespace-nowrap">{record.tenant}</td>
                      <td className="py-2 pr-2 whitespace-nowrap text-[var(--sk-muted)]">{record.month}</td>
                      <td className="py-2 pr-2 whitespace-nowrap font-mono text-[var(--sk-text2)]">{fmt(record.amount)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap text-[var(--sk-muted)] font-mono">{record.units}</td>
                      <td className="py-2 pr-2 whitespace-nowrap text-[var(--sk-muted)] font-mono">{fmt(record.lightBill)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap font-bold font-mono text-green-400">{fmt(record.total)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap"><StatusBadge status={record.status} /></td>
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {record.whatsapp ? (
                          <a href={`https://wa.me/91${record.whatsapp}`} className="text-green-400 hover:text-green-300"><MessageCircle size={13} /></a>
                        ) : "-"}
                      </td>
                      <td className="py-2">
                        <button onClick={() => deleteRecord(record.id)} className="text-[var(--sk-dim)] hover:text-red-400"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-5 text-[var(--sk-dim)]">{t.noRecords}</td>
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
