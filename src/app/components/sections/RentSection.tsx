"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  Clock3,
  Edit3,
  MessageCircle,
  Plus,
  Trash2,
  X,
  IndianRupee,
} from "lucide-react";

import {
  Lang,
  RentRecord,
  RentStatus,
} from "../../lib/types";

import { STRINGS } from "../../lib/i18n";
import { fmt } from "../../lib/utils";

import {
  FormCard,
  SectionHeader,
  StatusBadge,
} from "../common/UI";

interface RentSectionProps {
  records: RentRecord[];
  setRecords: React.Dispatch<
    React.SetStateAction<RentRecord[]>
  >;
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
  status: RentStatus;
  note: string;
}

const EMPTY_FORM: RentForm = {
  date: new Date().toISOString().slice(0, 10),
  tenant: "",
  month: "",
  whatsapp: "",
  amount: "",
  prevReading: "0",
  currentReading: "0",
  ratePerUnit: "8",
  status: "Pending",
  note: "",
};

function getMonthName(date: string) {
  if (!date) return "";

  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "short",
  });
}

function calculateRentValues(form: RentForm) {
  const amount = Math.max(
    0,
    Number(form.amount) || 0
  );

  const prevReading = Math.max(
    0,
    Number(form.prevReading) || 0
  );

  const currentReading = Math.max(
    0,
    Number(form.currentReading) || 0
  );

  const ratePerUnit = Math.max(
    0,
    Number(form.ratePerUnit) || 0
  );

  const units = Math.max(
    0,
    currentReading - prevReading
  );

  const lightBill = units * ratePerUnit;

  const total = amount + lightBill;

  return {
    amount,
    prevReading,
    currentReading,
    ratePerUnit,
    units,
    lightBill,
    total,
  };
}

export function RentSection({
  records,
  setRecords,
  lang,
}: RentSectionProps) {
  const t = STRINGS[lang];
  const isHi = lang === "hi";

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<RentForm>(EMPTY_FORM);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | RentStatus>("All");

  const [error, setError] =
    useState("");

  const calculated = useMemo(
    () => calculateRentValues(form),
    [form]
  );

  /* -------------------------------------------------------
     FILTER + SORT
  ------------------------------------------------------- */

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .filter((record) => {
        if (
          statusFilter !== "All" &&
          record.status !== statusFilter
        ) {
          return false;
        }

        if (!query) return true;

        return (
          record.tenant
            .toLowerCase()
            .includes(query) ||
          record.month
            .toLowerCase()
            .includes(query) ||
          record.whatsapp.includes(query) ||
          record.note
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) =>
        b.date.localeCompare(a.date)
      );
  }, [
    records,
    search,
    statusFilter,
  ]);

  /* -------------------------------------------------------
     SUMMARY
  ------------------------------------------------------- */

  const summary = useMemo(() => {
    const total = records.reduce(
      (sum, record) =>
        sum + Number(record.total || 0),
      0
    );

    const received = records
      .filter(
        (record) =>
          record.status === "Received"
      )
      .reduce(
        (sum, record) =>
          sum + Number(record.total || 0),
        0
      );

    const pending = records
      .filter(
        (record) =>
          record.status === "Pending"
      )
      .reduce(
        (sum, record) =>
          sum + Number(record.total || 0),
        0
      );

    const partial = records
      .filter(
        (record) =>
          record.status === "Partial"
      )
      .reduce(
        (sum, record) =>
          sum + Number(record.total || 0),
        0
      );

    return {
      total,
      received,
      pending,
      partial,
    };
  }, [records]);

  /* -------------------------------------------------------
     OPEN ADD FORM
  ------------------------------------------------------- */

  const openAddForm = () => {
    setEditingId(null);

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    setForm({
      ...EMPTY_FORM,
      date: today,
      month: getMonthName(today),
    });

    setError("");
    setShowForm(true);
  };

  /* -------------------------------------------------------
     OPEN EDIT FORM
  ------------------------------------------------------- */

  const openEditForm = (
    record: RentRecord
  ) => {
    setEditingId(record.id);

    setForm({
      date: record.date,
      tenant: record.tenant,
      month: record.month,
      whatsapp: record.whatsapp,
      amount: String(record.amount),
      prevReading: String(record.prevReading),
      currentReading: String(record.currentReading),
      ratePerUnit: String(record.ratePerUnit),
      status: record.status,
      note: record.note,
    });

    setError("");
    setShowForm(true);
  };

  /* -------------------------------------------------------
     CLOSE FORM
  ------------------------------------------------------- */

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  /* -------------------------------------------------------
     SAVE
  ------------------------------------------------------- */

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    const tenant = form.tenant.trim();

    if (!tenant) {
      setError(
        isHi
          ? "किरायेदार का नाम डालें।"
          : "Please enter tenant name."
      );
      return;
    }

    if (
      !form.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date)
    ) {
      setError(
        isHi
          ? "सही तारीख चुनें।"
          : "Please select a valid date."
      );
      return;
    }

    if (
      calculated.currentReading <
      calculated.prevReading
    ) {
      setError(
        isHi
          ? "वर्तमान मीटर रीडिंग पिछली रीडिंग से कम नहीं हो सकती।"
          : "Current reading cannot be less than previous reading."
      );
      return;
    }

    const record: RentRecord = {
      id:
        editingId ??
        `rent-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      date: form.date,

      tenant,

      month:
        form.month.trim() ||
        getMonthName(form.date),

      whatsapp: form.whatsapp
        .replace(/\D/g, "")
        .slice(0, 15),

      amount: calculated.amount,

      prevReading:
        calculated.prevReading,

      currentReading:
        calculated.currentReading,

      ratePerUnit:
        calculated.ratePerUnit,

      units: calculated.units,

      lightBill:
        calculated.lightBill,

      total: calculated.total,

      paidAmount:
        form.status === "Received"
          ? calculated.total
          : 0,

      remainingAmount:
        form.status === "Received"
          ? 0
          : calculated.total,

      status: form.status,

      note: form.note.trim(),
    };

    setRecords((current) => {
      if (!editingId) {
        return [record, ...current];
      }

      return current.map((item) =>
        item.id === editingId
          ? record
          : item
      );
    });

    closeForm();
  };

  /* -------------------------------------------------------
     DELETE
  ------------------------------------------------------- */

  const deleteRecord = (id: string) => {
    const record = records.find(
      (item) => item.id === id
    );

    if (!record) return;

    const confirmed = window.confirm(
      isHi
        ? `क्या आप ${record.tenant} का किराया रिकॉर्ड हटाना चाहते हैं?`
        : `Delete rent record for ${record.tenant}?`
    );

    if (!confirmed) return;

    setRecords((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    if (editingId === id) {
      closeForm();
    }
  };

  /* -------------------------------------------------------
     MARK RECEIVED
  ------------------------------------------------------- */

  const markReceived = (id: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status: "Received",
              paidAmount: record.total,
              remainingAmount: 0,
            }
          : record
      )
    );
  };

  /* -------------------------------------------------------
     WHATSAPP
  ------------------------------------------------------- */

  const sendWhatsApp = (
    record: RentRecord
  ) => {
    const phone = record.whatsapp.replace(
      /\D/g,
      ""
    );

    if (!phone) {
      window.alert(
        isHi
          ? "इस किरायेदार का WhatsApp नंबर उपलब्ध नहीं है।"
          : "WhatsApp number is not available."
      );
      return;
    }

    const message = isHi
      ? `नमस्ते ${record.tenant},
${record.month} का किराया: ${fmt(record.amount)}
बिजली बिल: ${fmt(record.lightBill)}
कुल राशि: ${fmt(record.total)}
स्थिति: ${
          record.status === "Received"
            ? "जमा"
            : record.status === "Pending"
            ? "बाकी"
            : "आंशिक"
        }`
      : `Hello ${record.tenant},
Rent: ${fmt(record.amount)}
Light Bill: ${fmt(record.lightBill)}
Total: ${fmt(record.total)}
Status: ${record.status}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">

      <SectionHeader
        title={
          t.nav?.rent ||
          (isHi ? "किराया प्रबंधन" : "Rent Management")
        }
        sub={
          isHi
            ? "किरायेदार, मीटर रीडिंग और बकाया भुगतान का प्रबंधन करें"
            : "Manage tenant rent, meter readings and pending payments"
        }
      />

      {/* SUMMARY */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <IndianRupee
                size={20}
                className="text-blue-400"
              />
            </div>

            <div>
              <div className="text-xs text-[var(--sk-muted)]">
                {isHi ? "कुल राशि" : "Total"}
              </div>

              <div className="font-bold text-lg">
                {fmt(summary.total)}
              </div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2
                size={20}
                className="text-green-400"
              />
            </div>

            <div>
              <div className="text-xs text-[var(--sk-muted)]">
                {isHi ? "जमा" : "Received"}
              </div>

              <div className="font-bold text-lg text-green-400">
                {fmt(summary.received)}
              </div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock3
                size={20}
                className="text-amber-400"
              />
            </div>

            <div>
              <div className="text-xs text-[var(--sk-muted)]">
                {isHi ? "बाकी" : "Pending"}
              </div>

              <div className="font-bold text-lg text-amber-400">
                {fmt(summary.pending)}
              </div>
            </div>
          </div>
        </FormCard>

        <FormCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Building2
                size={20}
                className="text-purple-400"
              />
            </div>

            <div>
              <div className="text-xs text-[var(--sk-muted)]">
                {isHi ? "आंशिक" : "Partial"}
              </div>

              <div className="font-bold text-lg text-purple-400">
                {fmt(summary.partial)}
              </div>
            </div>
          </div>
        </FormCard>

      </div>

      {/* TOOLBAR */}

      <FormCard>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">

          <div className="flex flex-col sm:flex-row gap-2 flex-1">

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={
                isHi
                  ? "किरायेदार खोजें..."
                  : "Search tenant..."
              }
              className="w-full sm:max-w-sm bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--sk-text)] outline-none focus:border-green-400/50"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "All"
                    | RentStatus
                )
              }
              className="bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--sk-text)] outline-none"
            >
              <option value="All">
                {isHi
                  ? "सभी स्थिति"
                  : "All Status"}
              </option>

              <option value="Received">
                {isHi ? "जमा" : "Received"}
              </option>

              <option value="Pending">
                {isHi ? "बाकी" : "Pending"}
              </option>

              <option value="Partial">
                {isHi ? "आंशिक" : "Partial"}
              </option>
            </select>

          </div>

          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus size={17} />

            {isHi
              ? "किराया जोड़ें"
              : "Add Rent"}
          </button>

        </div>
      </FormCard>

      {/* FORM */}

      {showForm && (
        <div className="mt-5">
          <FormCard>

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="font-bold text-lg text-[var(--sk-text)]">
                  {editingId
                    ? isHi
                      ? "किराया रिकॉर्ड संपादित करें"
                      : "Edit Rent"
                    : isHi
                    ? "नया किराया रिकॉर्ड"
                    : "Add Rent"}
                </h2>

                <p className="text-xs text-[var(--sk-muted)] mt-1">
                  {isHi
                    ? "किराया और बिजली बिल अपने आप calculate होंगे।"
                    : "Rent + electricity bill will be calculated automatically."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="w-9 h-9 rounded-lg border border-[var(--sk-border)] flex items-center justify-center"
                title={isHi ? "बंद करें" : "Close"}
              >
                <X size={17} />
              </button>

            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-400 px-3 py-2.5 text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* TENANT */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "किरायेदार का नाम *"
                      : "Tenant Name *"}
                  </span>

                  <input
                    required
                    value={form.tenant}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tenant:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder={
                      isHi
                        ? "किरायेदार का नाम"
                        : "Tenant name"
                    }
                  />
                </label>

                {/* DATE */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "तारीख *"
                      : "Date *"}
                  </span>

                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                        month:
                          getMonthName(
                            e.target.value
                          ),
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>

                {/* MONTH */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? "महीना" : "Month"}
                  </span>

                  <input
                    value={form.month}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        month:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder={
                      isHi ? "जून" : "Jun"
                    }
                  />
                </label>

                {/* WHATSAPP */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    WhatsApp
                  </span>

                  <input
                    inputMode="numeric"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        whatsapp:
                          e.target.value.replace(
                            /\D/g,
                            ""
                          ),
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="9876543210"
                  />
                </label>

                {/* RENT */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "मासिक किराया"
                      : "Monthly Rent"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="8000"
                  />
                </label>

                {/* RATE */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "प्रति यूनिट दर"
                      : "Rate / Unit"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ratePerUnit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ratePerUnit:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                    placeholder="8"
                  />
                </label>

                {/* PREVIOUS */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "पिछली मीटर रीडिंग"
                      : "Previous Reading"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.prevReading}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        prevReading:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>

                {/* CURRENT */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi
                      ? "वर्तमान मीटर रीडिंग"
                      : "Current Reading"}
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={form.currentReading}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        currentReading:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>

                {/* STATUS */}

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? "स्थिति" : "Status"}
                  </span>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status:
                          e.target.value as RentStatus,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="Received">
                      {isHi ? "जमा" : "Received"}
                    </option>

                    <option value="Pending">
                      {isHi ? "बाकी" : "Pending"}
                    </option>

                    <option value="Partial">
                      {isHi ? "आंशिक" : "Partial"}
                    </option>
                  </select>
                </label>

                {/* NOTE */}

                <label className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <span className="text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? "नोट" : "Note"}
                  </span>

                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        note:
                          e.target.value,
                      }))
                    }
                    className="w-full bg-[var(--sk-card2)] border border-[var(--sk-border)] rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    placeholder={
                      isHi
                        ? "वैकल्पिक नोट"
                        : "Optional note"
                    }
                  />
                </label>

              </div>

              {/* CALCULATION */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                <div className="rounded-xl bg-blue-400/10 border border-blue-400/20 p-3">
                  <div className="text-xs text-[var(--sk-muted)]">
                    {isHi ? "यूनिट" : "Units"}
                  </div>

                  <div className="text-lg font-bold text-blue-400">
                    {calculated.units}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 p-3">
                  <div className="text-xs text-[var(--sk-muted)]">
                    {isHi
                      ? "बिजली बिल"
                      : "Light Bill"}
                  </div>

                  <div className="text-lg font-bold text-amber-400">
                    {fmt(calculated.lightBill)}
                  </div>
                </div>

                <div className="rounded-xl bg-green-400/10 border border-green-400/20 p-3">
                  <div className="text-xs text-[var(--sk-muted)]">
                    {isHi ? "किराया" : "Rent"}
                  </div>

                  <div className="text-lg font-bold text-green-400">
                    {fmt(calculated.amount)}
                  </div>
                </div>

                <div className="rounded-xl bg-purple-400/10 border border-purple-400/20 p-3">
                  <div className="text-xs text-[var(--sk-muted)]">
                    {isHi ? "कुल राशि" : "Total"}
                  </div>

                  <div className="text-lg font-bold text-purple-400">
                    {fmt(calculated.total)}
                  </div>
                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-2 justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-xl border border-[var(--sk-border)] text-sm font-semibold"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold"
                >
                  {editingId
                    ? isHi
                      ? "किराया अपडेट करें"
                      : "Update Rent"
                    : isHi
                    ? "किराया सेव करें"
                    : "Save Rent"}
                </button>

              </div>

            </form>
          </FormCard>
        </div>
      )}

      {/* RECORDS */}

      <div className="mt-5 space-y-3">

        {filteredRecords.length === 0 ? (
          <FormCard>
            <div className="text-center py-10 text-[var(--sk-muted)]">

              <Building2
                size={34}
                className="mx-auto mb-3 opacity-50"
              />

              <div className="font-semibold">
                {isHi
                  ? "कोई किराया रिकॉर्ड नहीं मिला"
                  : "No rent records found"}
              </div>

              <div className="text-xs mt-1">
                {isHi
                  ? "अपना पहला किराया रिकॉर्ड जोड़ें।"
                  : "Add your first rent record."}
              </div>

            </div>
          </FormCard>
        ) : (
          filteredRecords.map((record) => (
            <FormCard key={record.id}>

              <div className="flex flex-col xl:flex-row xl:items-center gap-4">

                {/* TENANT */}

                <div className="flex items-start gap-3 flex-1 min-w-0">

                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Building2
                      size={21}
                      className="text-blue-400"
                    />
                  </div>

                  <div className="min-w-0">

                    <div className="font-bold text-[var(--sk-text)] break-words">
                      {record.tenant}
                    </div>

                    <div className="text-xs text-[var(--sk-muted)] mt-0.5">
                      {record.month} ·{" "}
                      {record.date}
                    </div>

                    {record.whatsapp && (
                      <div className="text-xs text-[var(--sk-dim)] mt-1">
                        WhatsApp:{" "}
                        {record.whatsapp}
                      </div>
                    )}

                    {record.note && (
                      <div className="text-xs text-[var(--sk-muted)] mt-1 break-words">
                        {record.note}
                      </div>
                    )}

                  </div>
                </div>

                {/* BILL */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:min-w-[520px]">

                  <div>
                    <div className="text-[10px] text-[var(--sk-dim)] uppercase">
                      {isHi ? "किराया" : "Rent"}
                    </div>

                    <div className="font-bold text-sm">
                      {fmt(record.amount)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[var(--sk-dim)] uppercase">
                      {isHi ? "यूनिट" : "Units"}
                    </div>

                    <div className="font-bold text-sm">
                      {record.units}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[var(--sk-dim)] uppercase">
                      {isHi
                        ? "बिजली"
                        : "Light"}
                    </div>

                    <div className="font-bold text-sm text-amber-400">
                      {fmt(record.lightBill)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[var(--sk-dim)] uppercase">
                      {isHi ? "कुल" : "Total"}
                    </div>

                    <div className="font-bold text-sm text-green-400">
                      {fmt(record.total)}
                    </div>
                  </div>

                </div>

                {/* STATUS + ACTIONS */}

                <div className="flex items-center gap-2 flex-wrap">

                  <StatusBadge
                    status={record.status}
                  />

                  {record.status !==
                    "Received" && (
                    <button
                      onClick={() =>
                        markReceived(
                          record.id
                        )
                      }
                      title={
                        isHi
                          ? "जमा के रूप में चिह्नित करें"
                          : "Mark as received"
                      }
                      className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2
                        size={16}
                      />
                    </button>
                  )}

                  {record.whatsapp && (
                    <button
                      onClick={() =>
                        sendWhatsApp(record)
                      }
                      title={
                        isHi
                          ? "WhatsApp रिमाइंडर भेजें"
                          : "WhatsApp reminder"
                      }
                      className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 flex items-center justify-center"
                    >
                      <MessageCircle
                        size={16}
                      />
                    </button>
                  )}

                  <button
                    onClick={() =>
                      openEditForm(record)
                    }
                    title={
                      isHi ? "संपादित करें" : "Edit"
                    }
                    className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() =>
                      deleteRecord(record.id)
                    }
                    title={
                      isHi ? "हटाएं" : "Delete"
                    }
                    className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>
              </div>

              {/* METER DETAILS */}

              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--sk-muted)]">

                <span>
                  {isHi
                    ? "पिछली रीडिंग:"
                    : "Previous:"}{" "}
                  <b className="text-[var(--sk-text)]">
                    {record.prevReading}
                  </b>
                </span>

                <span>
                  {isHi
                    ? "वर्तमान रीडिंग:"
                    : "Current:"}{" "}
                  <b className="text-[var(--sk-text)]">
                    {record.currentReading}
                  </b>
                </span>

                <span>
                  {isHi
                    ? "यूनिट:"
                    : "Units:"}{" "}
                  <b className="text-blue-400">
                    {record.units}
                  </b>
                </span>

                <span>
                  {isHi
                    ? "दर:"
                    : "Rate:"}{" "}
                  <b className="text-[var(--sk-text)]">
                    {fmt(record.ratePerUnit)}
                    /{isHi ? "यूनिट" : "unit"}
                  </b>
                </span>

              </div>

            </FormCard>
          ))
        )}

      </div>
    </div>
  );
}

