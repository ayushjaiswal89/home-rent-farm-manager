"use client";

import { FarmRecord, Lang } from "../../lib/types";

import {
  FormCard,
  InputGroup,
  btnPrimary,
  btnSecondary,
  inputCls,
  selectCls,
} from "../common/UI";

import { fmt } from "../../lib/utils";

import {
  FarmTranslation,
  cropLabel,
  workerLabel,
  machineLabel,
  seasonLabel,
  expenseCategoryLabel,
  areaUnitLabel,
  unitLabel,
} from "../../lib/farmI18n";

interface FarmFormProps {
  form: FarmFormData;

  setForm: React.Dispatch<React.SetStateAction<FarmFormData>>;

  editingId: string | null;

  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;

  addRecord: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;

  lang: Lang;

  farmT: FarmTranslation;

  crops: string[];

  expCategories: string[];

  workers: string[];

  machines: string[];

  getSeason: (date: string) => string;

  saleAmount: number;
}

export interface FarmFormData {
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

export function FarmForm({
  form,
  setForm,
  editingId,
  setEditingId,
  addRecord,
  lang,
  farmT,
  crops,
  expCategories,
  workers,
  machines,
  getSeason,
  saleAmount,
}: FarmFormProps) {
  const changeType = (type: FarmRecord["type"]) => {
    setForm((current) => ({
      ...current,
      type,
    }));
  };

  const resetForm = () => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    setEditingId(null);

    setForm({
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
    });
  };

  return (
    <FormCard>
      <form
        onSubmit={addRecord}
        className="space-y-4"
      >
        {/* =====================================================
            ACTION TYPE BUTTONS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

          <button
            type="button"
            onClick={() => changeType("Expense")}
            className={`h-10 rounded-lg border text-sm font-semibold transition ${
              form.type === "Expense"
                ? "bg-green-500 text-black border-green-400"
                : "bg-[var(--sk-card2)] text-[var(--sk-text2)] border-[var(--sk-border)] hover:border-green-400"
            }`}
          >
            + {farmT.expense}
          </button>

          <button
            type="button"
            onClick={() => changeType("Yield")}
            className={`h-10 rounded-lg border text-sm font-semibold transition ${
              form.type === "Yield"
                ? "bg-green-500 text-black border-green-400"
                : "bg-[var(--sk-card2)] text-[var(--sk-text2)] border-[var(--sk-border)] hover:border-green-400"
            }`}
          >
            + {farmT.yield}
          </button>

          <button
            type="button"
            onClick={() => changeType("Sale")}
            className={`h-10 rounded-lg border text-sm font-semibold transition ${
              form.type === "Sale"
                ? "bg-green-500 text-black border-green-400"
                : "bg-[var(--sk-card2)] text-[var(--sk-text2)] border-[var(--sk-border)] hover:border-green-400"
            }`}
          >
            + {farmT.sale}
          </button>

        </div>

        {/* =====================================================
            BASIC DETAILS
        ====================================================== */}

        <div>
          <h3 className="text-sm font-bold text-green-400 mb-3 border-b border-white/10 pb-2">
            🌾 {farmT.basicDetails}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            {/* DATE */}

            <InputGroup label={farmT.date}>
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => {
                  const date = e.target.value;

                  setForm((current) => ({
                    ...current,
                    date,
                    season: getSeason(date),
                  }));
                }}
              />
            </InputGroup>

            {/* TYPE */}

            <InputGroup label={farmT.type}>
              <select
                className={selectCls}
                value={form.type}
                onChange={(e) =>
                  changeType(
                    e.target.value as FarmRecord["type"]
                  )
                }
              >
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
            </InputGroup>

            {/* CROP */}

            <InputGroup label={farmT.crop}>
              <select
                className={selectCls}
                value={form.crop}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    crop: e.target.value,
                  }))
                }
              >
                {crops.map((crop) => (
                  <option
                    key={crop}
                    value={crop}
                  >
                    {cropLabel(lang, crop)}
                  </option>
                ))}
              </select>
            </InputGroup>

            {/* SEASON */}

            <InputGroup label={farmT.season}>
              <input
                className={inputCls}
                value={seasonLabel(
                  lang,
                  form.season
                )}
                readOnly
              />
            </InputGroup>

          </div>
        </div>

        {/* =====================================================
            FIELD DETAILS
        ====================================================== */}

        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-3 border-b border-white/10 pb-2">
            📍 {farmT.fieldDetails}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <InputGroup label={farmT.field}>
              <input
                type="text"
                className={inputCls}
                value={form.field}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    field: e.target.value,
                  }))
                }
                placeholder={
                  lang === "hi"
                    ? "खेत का नाम"
                    : "Field name"
                }
              />
            </InputGroup>

            <InputGroup label={farmT.area}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={form.area}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    area: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </InputGroup>

            <InputGroup label={farmT.areaUnit}>
              <select
                className={selectCls}
                value={form.areaUnit}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    areaUnit: e.target.value,
                  }))
                }
              >
                <option value="बीघा">
                  {areaUnitLabel(lang, "बीघा")}
                </option>

                <option value="एकड़">
                  {areaUnitLabel(lang, "एकड़")}
                </option>

                <option value="हेक्टेयर">
                  {areaUnitLabel(
                    lang,
                    "हेक्टेयर"
                  )}
                </option>
              </select>
            </InputGroup>

          </div>
        </div>

        {/* =====================================================
            TRANSACTION
        ====================================================== */}

        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3 border-b border-white/10 pb-2">
            💰 {farmT.transaction}
          </h3>

          {/* EXPENSE */}

          {form.type === "Expense" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

              <InputGroup
                label={farmT.expenseCategory}
              >
                <select
                  className={selectCls}
                  value={form.expenseCategory}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      expenseCategory:
                        e.target.value,
                    }))
                  }
                >
                  {expCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {expenseCategoryLabel(
                          lang,
                          category
                        )}
                      </option>
                    )
                  )}
                </select>
              </InputGroup>

              <InputGroup label={farmT.amount}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="₹ 0"
                />
              </InputGroup>

            </div>
          )}

          {/* YIELD / SALE */}

          {(form.type === "Yield" ||
            form.type === "Sale") && (
            <div
              className={`grid grid-cols-1 ${
                form.type === "Sale"
                  ? "lg:grid-cols-3"
                  : "lg:grid-cols-2"
              } gap-3`}
            >

              <InputGroup
                label={farmT.quantity}
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </InputGroup>

              <InputGroup label={farmT.unit}>
                <select
                  className={selectCls}
                  value={form.unit}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      unit: e.target.value,
                    }))
                  }
                >
                  <option value="Kg">
                    {unitLabel(lang, "Kg")}
                  </option>

                  <option value="Quintal">
                    {unitLabel(
                      lang,
                      "Quintal"
                    )}
                  </option>

                  <option value="Ton">
                    {unitLabel(lang, "Ton")}
                  </option>
                </select>
              </InputGroup>

              {form.type === "Sale" && (
                <InputGroup label={farmT.price}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputCls}
                    value={form.price}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        price: e.target.value,
                      }))
                    }
                    placeholder="₹ / Unit"
                  />
                </InputGroup>
              )}

            </div>
          )}
        </div>

        {/* =====================================================
            SALE TOTAL
        ====================================================== */}

        {form.type === "Sale" &&
          Number(form.quantity) > 0 &&
          Number(form.price) > 0 && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center justify-between">

              <div>
                <div className="text-xs text-[var(--sk-muted)]">
                  {farmT.totalSaleAmount}
                </div>

                <div className="text-xl font-bold text-green-400">
                  {fmt(saleAmount)}
                </div>
              </div>

              <div className="text-2xl">
                ₹
              </div>

            </div>
          )}

        {/* =====================================================
            EXTRA DETAILS
        ====================================================== */}

        <div>
          <h3 className="text-sm font-bold text-purple-400 mb-3 border-b border-white/10 pb-2">
            📝 {farmT.extraDetails}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

            <InputGroup label={farmT.worker}>
              <select
                className={selectCls}
                value={form.worker}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    worker: e.target.value,
                  }))
                }
              >
                <option value="">
                  {farmT.selectWorker}
                </option>

                {workers.map((worker) => (
                  <option
                    key={worker}
                    value={worker}
                  >
                    {workerLabel(
                      lang,
                      worker
                    )}
                  </option>
                ))}
              </select>
            </InputGroup>

            <InputGroup label={farmT.machine}>
              <select
                className={selectCls}
                value={form.machine}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    machine: e.target.value,
                  }))
                }
              >
                <option value="">
                  {farmT.selectMachine}
                </option>

                {machines.map((machine) => (
                  <option
                    key={machine}
                    value={machine}
                  >
                    {machineLabel(
                      lang,
                      machine
                    )}
                  </option>
                ))}
              </select>
            </InputGroup>

            <div className="lg:col-span-2">
              <InputGroup label={farmT.note}>
                <input
                  type="text"
                  className={inputCls}
                  value={form.note}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      note: e.target.value,
                    }))
                  }
                  placeholder={
                    lang === "hi"
                      ? "विवरण लिखें..."
                      : "Enter description..."
                  }
                />
              </InputGroup>
            </div>

          </div>
        </div>

        {/* =====================================================
            BUTTONS
        ====================================================== */}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">

          <button
            type="submit"
            className={`${btnPrimary} w-full sm:w-auto px-6`}
          >
            {editingId
              ? `✓ ${farmT.updateRecord}`
              : ` ${farmT.addRecord}`}
          </button>

          {editingId && (
            <button
              type="button"
              className={`${btnSecondary} w-full sm:w-auto px-6`}
              onClick={resetForm}
            >
              ✕ {farmT.cancel}
            </button>
          )}

        </div>

      </form>
    </FormCard>
  );
}