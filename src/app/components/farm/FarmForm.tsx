"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Coins,
  FileText,
  Info,
  Leaf,
  Lightbulb,
  Map,
  Package,
  ReceiptText,
  Ruler,
  Save,
  ShoppingCart,
  Sprout,
  Tag,
  Tractor,
  UserRound,
  Wheat,
  X,
} from "lucide-react";

import type { FarmRecord, Lang } from "../../lib/types";

import {
  areaUnitLabel,
  cropLabel,
  expenseCategoryLabel,
  machineLabel,
  seasonLabel,
  unitLabel,
  workerLabel,
} from "../../lib/farmI18n";

interface FarmFormProps {
  lang: Lang;
  farmT: any;
  editingRecord: FarmRecord | null;
  onSave: (record: FarmRecord) => void;
  onCancel: () => void;
}

type TransactionType = FarmRecord["type"];

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Soybean",
  "Cotton",
  "Mustard",
  "Groundnut",
  "Gram",
  "Other",
] as const;

const UNIT_OPTIONS = [
  "Kg",
  "Quintal",
  "Ton",
] as const;

const AREA_UNIT_OPTIONS = [
  "बीघा",
  "एकड़",
  "हेक्टेयर",
] as const;

const SEASON_OPTIONS = [
  "Kharif",
  "Rabi",
  "Zaid",
] as const;

const createEmptyForm = () => ({
  date: new Date().toLocaleDateString("en-CA"),

  crop: "Wheat",

  season: "Rabi",

  field: "",

  area: "",

  areaUnit: "बीघा",

  type: "Expense" as TransactionType,

  expenseCategory: "बीज",

  quantity: "",

  unit: "Quintal",

  price: "",

  worker: "",

  machine: "",

  note: "",

  amount: "",
});

export function FarmForm({
  lang,
  farmT,
  editingRecord,
  onSave,
  onCancel,
}: FarmFormProps) {
  const [form, setForm] = useState(createEmptyForm);

  const isHindi = lang === "hi";

  /*
   * ---------------------------------------------------------
   * LOAD EDITING RECORD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!editingRecord) {
      setForm(createEmptyForm());
      return;
    }

    setForm({
      date: editingRecord.date || "",

      crop: editingRecord.crop || "Wheat",

      season: editingRecord.season || "Rabi",

      field: editingRecord.field || "",

      area:
        editingRecord.area !== undefined
          ? String(editingRecord.area)
          : "",

      areaUnit:
        editingRecord.areaUnit || "बीघा",

      type:
        editingRecord.type || "Expense",

      expenseCategory:
        editingRecord.expenseCategory || "बीज",

      quantity:
        editingRecord.quantity !== undefined
          ? String(editingRecord.quantity)
          : "",

      unit:
        editingRecord.unit || "Quintal",

      price:
        editingRecord.price !== undefined
          ? String(editingRecord.price)
          : "",

      worker:
        editingRecord.worker || "",

      machine:
        editingRecord.machine || "",

      note:
        editingRecord.note || "",

      amount:
        editingRecord.amount !== undefined
          ? String(editingRecord.amount)
          : "",
    });
  }, [editingRecord]);

  /*
   * ---------------------------------------------------------
   * SALE TOTAL
   * ---------------------------------------------------------
   */

  const saleTotal = useMemo(() => {
    if (form.type !== "Sale") {
      return 0;
    }

    return (
      Number(form.quantity || 0) *
      Number(form.price || 0)
    );
  }, [
    form.type,
    form.quantity,
    form.price,
  ]);

  /*
   * ---------------------------------------------------------
   * COMMON CLASSES
   * ---------------------------------------------------------
   */

  const inputClass = `
    h-10
    w-full
    rounded-xl
    border
    border-[var(--sk-border)]
    bg-[var(--sk-card2)]
    px-3
    text-sm
    text-[var(--sk-text)]
    outline-none
    transition
    placeholder:text-slate-500
    focus:border-green-500/70
    focus:ring-2
    focus:ring-green-500/10
  `;

  const labelClass = `
    mb-1.5
    block
    text-xs
    font-medium
    text-[var(--sk-dim)]
  `;

  const sectionTitleClass = `
    text-sm
    font-bold
    tracking-tight
  `;

  /*
   * ---------------------------------------------------------
   * UPDATE FIELD
   * ---------------------------------------------------------
   */

  const updateField = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * CHANGE TYPE
   * ---------------------------------------------------------
   */

  const changeType = (
    type: TransactionType
  ) => {
    setForm((prev) => ({
      ...prev,
      type,
    }));
  };

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const quantity = Number(form.quantity || 0);
    const price = Number(form.price || 0);

    let amount = 0;

    if (form.type === "Expense") {
      amount = quantity * price;
    }

    if (form.type === "Sale") {
      amount = quantity * price;
    }

    const record: FarmRecord = {
      id:
        editingRecord?.id ||
        crypto.randomUUID(),

      date: form.date,

      type: form.type,

      crop: form.crop,

      expenseCategory:
        form.type === "Expense"
          ? form.expenseCategory
          : "",

      amount,

      quantity,

      unit: form.unit,

      price:
        form.type === "Sale" ||
          form.type === "Expense"
          ? price
          : 0,

      note: form.note,

      field: form.field,

      area:
        form.area === ""
          ? undefined
          : Number(form.area),

      areaUnit:
        form.areaUnit,

      worker:
        form.worker,

      machine:
        form.machine,

      season:
        form.season,
    };

    onSave(record);

    if (!editingRecord) {
      setForm(createEmptyForm());
    }
  };

  /*
   * ---------------------------------------------------------
   * TEXT
   * ---------------------------------------------------------
   */

  const text = {
    title: isHindi
      ? "Farm Record"
      : "Farm Record",

    titleHi: isHindi
      ? "खेती का रिकॉर्ड"
      : "Farm Record",

    subtitle: isHindi
      ? "फसल, बिक्री, खर्च और उत्पादन का विवरण दर्ज करें"
      : "Record crop, sales, expenses and production",

    basic:
      isHindi
        ? "बेसिक जानकारी"
        : "Basic Information",

    main:
      isHindi
        ? "मुख्य विवरण"
        : "Main Details",

    fieldInfo:
      isHindi
        ? "खेत की जानकारी"
        : "Field Information",

    workInfo:
      isHindi
        ? "काम से संबंधित जानकारी"
        : "Work Details",

    optional:
      isHindi
        ? "अतिरिक्त जानकारी"
        : "Additional Information",

    alwaysRequired:
      isHindi
        ? "हमेशा जरूरी"
        : "Always Required",

    conditionRequired:
      isHindi
        ? "स्थिति के अनुसार जरूरी"
        : "Required by Type",

    optionalFields:
      isHindi
        ? "वैकल्पिक"
        : "Optional",

    fieldsHelp:
      isHindi
        ? "ये 15 Fields क्या पूछ रहे हैं?"
        : "What are these 15 fields?",

    helpSub:
      isHindi
        ? "और कौन-सी जरूरी हैं"
        : "And which ones are necessary",

    date:
      isHindi
        ? "तारीख"
        : "Date",

    type:
      isHindi
        ? "प्रकार"
        : "Type",

    crop:
      isHindi
        ? "फसल"
        : "Crop",

    quantity:
      isHindi
        ? "मात्रा"
        : "Quantity",

    unit:
      isHindi
        ? "इकाई"
        : "Unit",

    price:
      isHindi
        ? "प्रति यूनिट भाव"
        : "Price / Unit",

    amount:
      isHindi
        ? "राशि"
        : "Amount",

    total:
      isHindi
        ? "कुल राशि"
        : "Total Amount",

    field:
      isHindi
        ? "खेत"
        : "Field",

    area:
      isHindi
        ? "क्षेत्रफल"
        : "Area",

    areaUnit:
      isHindi
        ? "क्षेत्र इकाई"
        : "Area Unit",

    worker:
      isHindi
        ? "मजदूर"
        : "Worker",

    machine:
      isHindi
        ? "मशीन"
        : "Machine",

    season:
      isHindi
        ? "सीजन"
        : "Season",

    note:
      isHindi
        ? "नोट"
        : "Note",

    expenseCategory:
      isHindi
        ? "खर्च की श्रेणी"
        : "Expense Category",

    sale:
      isHindi
        ? "बिक्री"
        : "Sale",

    expense:
      isHindi
        ? "खर्च"
        : "Expense",

    yield:
      isHindi
        ? "उपज"
        : "Yield",

    cancel:
      isHindi
        ? "रद्द करें"
        : "Cancel",

    save:
      isHindi
        ? "सहेजें"
        : "Save",

    update:
      isHindi
        ? "अपडेट करें"
        : "Update",

    saleInfo:
      isHindi
        ? "बिक्री में मात्रा × भाव = कुल राशि"
        : "For sale: quantity × price = total",

    expenseInfo:
      isHindi
        ? "खर्च में मात्रा × दर = कुल खर्च"
        : "For expense: quantity × rate = total expense",

    yieldInfo:
      isHindi
        ? "उपज में मात्रा और इकाई दर्ज करें"
        : "For yield: enter quantity and unit",

    suggestion:
      isHindi
        ? "सही रिकॉर्ड = बेहतर योजना = ज्यादा लाभ"
        : "Good records = better planning = better decisions",
  };

  /*
   * ---------------------------------------------------------
   * FIELD HELP DATA
   * ---------------------------------------------------------
   */

  const fieldGroups = {
    always: [
      isHindi
        ? "Date (तारीख) – रिकॉर्ड कब का है"
        : "Date – when is the record?",

      isHindi
        ? "Type (प्रकार) – Sale / Expense / Yield"
        : "Type – Sale / Expense / Yield",

      isHindi
        ? "Crop (फसल) – कौन-सी फसल"
        : "Crop – which crop?",

      isHindi
        ? "Quantity (मात्रा) – कितनी मात्रा"
        : "Quantity – how much quantity?",
    ],
    condition: [
      isHindi
        ? "Unit (इकाई) – Kg, क्विंटल, Ton"
        : "Unit – Kg, Quintal, Ton",
      isHindi
        ? "Price (भाव) – प्रति unit भाव"
        : "Price – price per unit",
      isHindi
        ? "Expense Category – खर्च किस चीज का"
        : "Expense Category – expense type",
      isHindi
        ? "Field (खेत) – कौन-सा खेत"
        : "Field – which field?",
      isHindi
        ? "Area (क्षेत्रफल) – कितने क्षेत्र में"
        : "Area – field size",
    ],

    optional: [
      isHindi
        ? "Area Unit – बीघा / एकड़ आदि"
        : "Area Unit – Bigha / Acre etc.",
      isHindi
        ? "Worker (मजदूर) – मजदूर का रिकॉर्ड"
        : "Worker – worker record",
      isHindi
        ? "Machine (मशीन) – उपयोग की मशीन"
        : "Machine – machine used",
      isHindi
        ? "Season (सीजन) – खरीफ / रबी / जायद"
        : "Season – Kharif / Rabi / Zaid",
      isHindi
        ? "Note – अतिरिक्त जानकारी"
        : "Note – extra information",
    ],
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="w-full">

      <div className="
        grid
        grid-cols-1
        xl:grid-cols-[minmax(0,1fr)_380px]
        gap-4
        items-start
      ">

        {/* =====================================================
            LEFT SIDE - FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[var(--sk-border)]
            bg-[var(--sk-card)]
            shadow-xl
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="
            border-b
            border-[var(--sk-border)]
            bg-[var(--sk-card2)]
            px-4
            py-4
          ">

            <div className="
              flex
              items-center
              justify-between
              gap-3
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-green-500/50
                  bg-green-500/10
                  text-green-400
                  shadow-[0_0_20px_rgba(34,197,94,0.12)]
                ">
                  <Leaf size={27} />
                </div>

                <div>

                  <h2 className="
                    text-xl
                    font-bold
                    text-[var(--sk-text)]
                  ">
                    {text.title}
                    <span className="
                      ml-2
                      text-green-400
                    ">
                      ({text.titleHi})
                    </span>
                  </h2>

                  <p className="
                    mt-0.5
                    text-xs
                    text-[var(--sk-dim)]
                  ">
                    {text.subtitle}
                  </p>

                </div>

              </div>

              {editingRecord && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-[var(--sk-border)]
                    bg-[var(--sk-card)]
                    text-[var(--sk-dim)]
                    transition
                    hover:border-red-500/40
                    hover:text-red-400
                  "
                  title={text.cancel}
                >
                  <X size={18} />
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              1. BASIC INFORMATION
          ================================================= */}

          <div className="
            border-b
            border-green-500/40
            bg-green-500/[0.025]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-green-500
                text-sm
                font-bold
                text-white
              ">
                1
              </div>

              <div
                className={`
                  ${sectionTitleClass}
                  text-green-400
                `}
              >
                {text.basic}
                <span className="ml-1 opacity-70">
                  (Basic Information)
                </span>
              </div>

            </div>

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            ">

              {/* DATE */}

              <div>
                <label className={labelClass}>
                  {text.date}
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">

                  <CalendarDays
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-green-400
                    "
                  />

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      updateField(
                        "date",
                        e.target.value
                      )
                    }
                    required
                    className={`${inputClass} pl-10`}
                  />

                </div>
              </div>

              {/* TYPE */}

              <div>
                <label className={labelClass}>
                  {text.type}
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    changeType(
                      e.target.value as TransactionType
                    )
                  }
                  required
                  className={inputClass}
                >
                  <option value="Sale">
                    {text.sale}
                  </option>

                  <option value="Expense">
                    {text.expense}
                  </option>

                  <option value="Yield">
                    {text.yield}
                  </option>
                </select>
              </div>

              {/* CROP */}

              <div>
                <label className={labelClass}>
                  {text.crop}
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">

                  <Wheat
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-green-400
                    "
                  />

                  <select
                    value={form.crop}
                    onChange={(e) =>
                      updateField(
                        "crop",
                        e.target.value
                      )
                    }
                    required
                    className={`${inputClass} pl-10`}
                  >
                    {CROP_OPTIONS.map(
                      (crop) => (
                        <option
                          key={crop}
                          value={crop}
                        >
                          {cropLabel(
                            lang,
                            crop
                          )}
                        </option>
                      )
                    )}
                  </select>

                </div>
              </div>

            </div>
          </div>

          {/* =================================================
              2. MAIN DETAILS
          ================================================= */}

          <div className="
            border-b
            border-blue-500/40
            bg-blue-500/[0.025]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-blue-500
                text-sm
                font-bold
                text-white
              ">
                2
              </div>

              <div
                className={`
                  ${sectionTitleClass}
                  text-blue-400
                `}
              >
                {text.main}
                <span className="
                  ml-1
                  text-xs
                  font-normal
                  opacity-70
                ">
                  (Type के अनुसार अलग-अलग)
                </span>
              </div>

            </div>

            {/* TYPE BUTTONS */}

            <div className="
              mb-4
              grid
              grid-cols-3
              gap-2
            ">

              {/* SALE */}

              <button
                type="button"
                onClick={() =>
                  changeType("Sale")
                }
                className={`
                  flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                  transition
                  ${form.type === "Sale"
                    ? "border-green-400 bg-green-500/20 text-green-300 shadow-[0_0_18px_rgba(34,197,94,0.12)]"
                    : "border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-dim)] hover:border-green-500/40 hover:text-green-300"
                  }
                `}
              >
                <ShoppingCart size={17} />
                {text.sale}
              </button>

              {/* EXPENSE */}

              <button
                type="button"
                onClick={() =>
                  changeType("Expense")
                }
                className={`
                  flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                  transition
                  ${form.type === "Expense"
                    ? "border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.12)]"
                    : "border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-dim)] hover:border-blue-500/40 hover:text-blue-300"
                  }
                `}
              >
                <ReceiptText size={17} />
                {text.expense}
              </button>

              {/* YIELD */}

              <button
                type="button"
                onClick={() =>
                  changeType("Yield")
                }
                className={`
                  flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                  transition
                  ${form.type === "Yield"
                    ? "border-purple-400 bg-purple-500/20 text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.12)]"
                    : "border-[var(--sk-border)] bg-[var(--sk-card2)] text-[var(--sk-dim)] hover:border-purple-500/40 hover:text-purple-300"
                  }
                `}
              >
                <Sprout size={17} />
                {text.yield}
              </button>

            </div>

            {/* SALE */}

            {form.type === "Sale" && (
              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-3
              ">

                {/* QUANTITY */}

                <div>
                  <label className={labelClass}>
                    {text.quantity}
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Package
                      size={16}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-blue-400
                      "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.quantity}
                      onChange={(e) =>
                        updateField(
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                      placeholder="0"
                      className={`${inputClass} pl-10`}
                    />

                  </div>
                </div>

                {/* UNIT */}

                <div>
                  <label className={labelClass}>
                    {text.unit}
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    value={form.unit}
                    onChange={(e) =>
                      updateField(
                        "unit",
                        e.target.value
                      )
                    }
                    required
                    className={inputClass}
                  >
                    {UNIT_OPTIONS.map(
                      (unit) => (
                        <option
                          key={unit}
                          value={unit}
                        >
                          {unitLabel(
                            lang,
                            unit
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PRICE */}

                <div>
                  <label className={labelClass}>
                    {text.price}
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Coins
                      size={16}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-green-400
                      "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        updateField(
                          "price",
                          e.target.value
                        )
                      }
                      required
                      placeholder="₹ 0"
                      className={`${inputClass} pl-10`}
                    />

                  </div>
                </div>

                {/* TOTAL */}

                <div>
                  <label className={labelClass}>
                    {text.total}
                  </label>

                  <div className="
                    flex
                    h-10
                    items-center
                    rounded-xl
                    border
                    border-green-500/40
                    bg-green-500/10
                    px-3
                    text-sm
                    font-bold
                    text-green-400
                  ">
                    ₹
                    {saleTotal.toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* EXPENSE */}

            {form.type === "Expense" && (
              <div
                className="
      grid
      grid-cols-1
      sm:grid-cols-2
      xl:grid-cols-5
      gap-3
    "
              >
                {/* EXPENSE CATEGORY */}

                <div>
                  <label className={labelClass}>
                    {text.expenseCategory}
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <select
                    value={form.expenseCategory}
                    onChange={(e) =>
                      updateField(
                        "expenseCategory",
                        e.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="बीज">
                      {isHindi ? "बीज" : "Seeds"}
                    </option>

                    <option value="खाद">
                      {isHindi ? "खाद" : "Fertilizer"}
                    </option>

                    <option value="दवाई">
                      {isHindi ? "दवाई" : "Pesticide / Medicine"}
                    </option>

                    <option value="सिंचाई">
                      {isHindi ? "सिंचाई" : "Irrigation"}
                    </option>

                    <option value="मजदूरी">
                      {isHindi ? "मजदूरी" : "Labor"}
                    </option>

                    <option value="डीजल">
                      {isHindi ? "डीजल" : "Diesel"}
                    </option>

                    <option value="मशीन">
                      {isHindi ? "मशीन" : "Machine"}
                    </option>

                    <option value="अन्य">
                      {isHindi ? "अन्य" : "Other"}
                    </option>
                  </select>
                </div>

                {/* QUANTITY */}

                <div>
                  <label className={labelClass}>
                    {text.quantity}
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <Package
                      size={16}
                      className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-blue-400
          "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.quantity}
                      onChange={(e) =>
                        updateField(
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                      placeholder="0"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* UNIT */}

                <div>
                  <label className={labelClass}>
                    {text.unit}
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <select
                    value={form.unit}
                    onChange={(e) =>
                      updateField(
                        "unit",
                        e.target.value
                      )
                    }
                    required
                    className={inputClass}
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unitLabel(lang, unit)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RATE / PRICE */}

                <div>
                  <label className={labelClass}>
                    {isHindi ? "दर / यूनिट" : "Rate / Unit"}
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <Coins
                      size={16}
                      className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-green-400
          "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        updateField(
                          "price",
                          e.target.value
                        )
                      }
                      required
                      placeholder="₹ 0"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {/* TOTAL EXPENSE */}

                <div>
                  <label className={labelClass}>
                    {text.total}
                  </label>

                  <div
                    className="
          flex
          h-10
          items-center
          rounded-xl
          border
          border-red-500/40
          bg-red-500/10
          px-3
          text-sm
          font-bold
          text-red-400
        "
                  >
                    ₹
                    {(
                      Number(form.quantity || 0) *
                      Number(form.price || 0)
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            )}

            {/* YIELD */}

            {form.type === "Yield" && (
              <div className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-3
              ">

                <div>
                  <label className={labelClass}>
                    {text.quantity}
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <Package
                      size={16}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-purple-400
                      "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.quantity}
                      onChange={(e) =>
                        updateField(
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                      placeholder="0"
                      className={`${inputClass} pl-10`}
                    />

                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    {text.unit}
                    <span className="ml-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    value={form.unit}
                    onChange={(e) =>
                      updateField(
                        "unit",
                        e.target.value
                      )
                    }
                    required
                    className={inputClass}
                  >
                    {UNIT_OPTIONS.map(
                      (unit) => (
                        <option
                          key={unit}
                          value={unit}
                        >
                          {unitLabel(
                            lang,
                            unit
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

              </div>
            )}

            {/* INFO BAR */}

            <div className="
              mt-3
              flex
              items-start
              gap-2
              rounded-lg
              border
              border-blue-500/30
              bg-blue-500/5
              px-3
              py-2
              text-[11px]
              text-blue-300
            ">

              <Info
                size={15}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <span>
                {form.type === "Sale"
                  ? text.saleInfo
                  : form.type === "Expense"
                    ? text.expenseInfo
                    : text.yieldInfo}
              </span>

            </div>

          </div>

          {/* =================================================
              3. FIELD INFORMATION
          ================================================= */}

          <div className="
            border-b
            border-purple-500/40
            bg-purple-500/[0.025]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-purple-500
                text-sm
                font-bold
                text-white
              ">
                3
              </div>

              <div
                className={`
                  ${sectionTitleClass}
                  text-purple-400
                `}
              >
                {text.fieldInfo}
                <span className="ml-1 opacity-70">
                  (Field Information)
                </span>
              </div>

            </div>

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            ">

              {/* FIELD */}

              <div>
                <label className={labelClass}>
                  {text.field}
                </label>

                <div className="relative">

                  <Map
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-purple-400
                    "
                  />

                  <input
                    type="text"
                    value={form.field}
                    onChange={(e) =>
                      updateField(
                        "field",
                        e.target.value
                      )
                    }
                    placeholder={
                      isHindi
                        ? "जैसे: खेत 1"
                        : "e.g. Field 1"
                    }
                    className={`${inputClass} pl-10`}
                  />

                </div>
              </div>

              {/* AREA */}

              <div>
                <label className={labelClass}>
                  {text.area}
                </label>

                <div className="
                  flex
                  gap-2
                ">

                  <div className="relative flex-1">

                    <Ruler
                      size={16}
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-purple-400
                      "
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.area}
                      onChange={(e) =>
                        updateField(
                          "area",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className={`${inputClass} pl-10`}
                    />

                  </div>

                  <select
                    value={form.areaUnit}
                    onChange={(e) =>
                      updateField(
                        "areaUnit",
                        e.target.value
                      )
                    }
                    className="
                      h-10
                      w-[115px]
                      rounded-xl
                      border
                      border-[var(--sk-border)]
                      bg-[var(--sk-card2)]
                      px-2
                      text-xs
                      text-[var(--sk-text)]
                      outline-none
                    "
                  >
                    {AREA_UNIT_OPTIONS.map(
                      (unit) => (
                        <option
                          key={unit}
                          value={unit}
                        >
                          {areaUnitLabel(
                            lang,
                            unit
                          )}
                        </option>
                      )
                    )}
                  </select>

                </div>
              </div>

              {/* AREA UNIT - extra visual field */}

              <div className="
                hidden
                md:block
              ">
                <label className={labelClass}>
                  {text.areaUnit}
                </label>

                <div className="
                  flex
                  h-10
                  items-center
                  rounded-xl
                  border
                  border-purple-500/20
                  bg-purple-500/5
                  px-3
                  text-xs
                  text-purple-300
                ">
                  <Ruler
                    size={15}
                    className="mr-2"
                  />

                  {areaUnitLabel(
                    lang,
                    form.areaUnit
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* =================================================
              4. WORK DETAILS
          ================================================= */}

          <div className="
            border-b
            border-orange-500/40
            bg-orange-500/[0.025]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-orange-500
                text-sm
                font-bold
                text-white
              ">
                4
              </div>

              <div
                className={`
                  ${sectionTitleClass}
                  text-orange-400
                `}
              >
                {text.workInfo}
                <span className="ml-1 opacity-70">
                  (Work Details)
                </span>
              </div>

            </div>

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-3
            ">

              {/* WORKER */}

              <div>
                <label className={labelClass}>
                  {text.worker}
                </label>

                <div className="relative">

                  <UserRound
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-orange-400
                    "
                  />

                  <select
                    value={form.worker}
                    onChange={(e) =>
                      updateField(
                        "worker",
                        e.target.value
                      )
                    }
                    className={`${inputClass} pl-10`}
                  >
                    <option value="">
                      {farmT.selectWorker}
                    </option>

                    <option value="Worker 1">
                      {workerLabel(
                        lang,
                        "Worker 1"
                      )}
                    </option>

                    <option value="Worker 2">
                      {workerLabel(
                        lang,
                        "Worker 2"
                      )}
                    </option>

                    <option value="Worker 3">
                      {workerLabel(
                        lang,
                        "Worker 3"
                      )}
                    </option>

                    <option value="Other">
                      {farmT.other}
                    </option>
                  </select>

                </div>
              </div>

              {/* MACHINE */}

              <div>
                <label className={labelClass}>
                  {text.machine}
                </label>

                <div className="relative">

                  <Tractor
                    size={16}
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-orange-400
                    "
                  />

                  <select
                    value={form.machine}
                    onChange={(e) =>
                      updateField(
                        "machine",
                        e.target.value
                      )
                    }
                    className={`${inputClass} pl-10`}
                  >
                    <option value="">
                      {farmT.selectMachine}
                    </option>

                    <option value="Tractor">
                      {machineLabel(
                        lang,
                        "Tractor"
                      )}
                    </option>

                    <option value="Rotavator">
                      {machineLabel(
                        lang,
                        "Rotavator"
                      )}
                    </option>

                    <option value="Cultivator">
                      {machineLabel(
                        lang,
                        "Cultivator"
                      )}
                    </option>

                    <option value="Harvester">
                      {machineLabel(
                        lang,
                        "Harvester"
                      )}
                    </option>

                    <option value="Sprayer">
                      {machineLabel(
                        lang,
                        "Sprayer"
                      )}
                    </option>

                    <option value="Other">
                      {farmT.other}
                    </option>
                  </select>

                </div>
              </div>

              {/* SEASON */}

              <div>
                <label className={labelClass}>
                  {text.season}
                </label>

                <select
                  value={form.season}
                  onChange={(e) =>
                    updateField(
                      "season",
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  {SEASON_OPTIONS.map(
                    (season) => (
                      <option
                        key={season}
                        value={season}
                      >
                        {seasonLabel(
                          lang,
                          season
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>
          </div>

          {/* =================================================
              5. OPTIONAL NOTE
          ================================================= */}

          <div className="
            border-b
            border-cyan-500/40
            bg-cyan-500/[0.025]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <div className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-cyan-500
                text-sm
                font-bold
                text-white
              ">
                5
              </div>

              <div
                className={`
                  ${sectionTitleClass}
                  text-cyan-400
                `}
              >
                {text.optional}
                <span className="ml-1 opacity-70">
                  (Optional)
                </span>
              </div>

            </div>

            <div>
              <label className={labelClass}>
                {text.note}
              </label>

              <div className="relative">

                <FileText
                  size={17}
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-3
                    text-cyan-400
                  "
                />

                <textarea
                  value={form.note}
                  onChange={(e) =>
                    updateField(
                      "note",
                      e.target.value
                    )
                  }
                  maxLength={500}
                  rows={3}
                  placeholder={
                    isHindi
                      ? "जैसे: अच्छी गुणवत्ता की फसल हुई..."
                      : "e.g. Good quality crop..."
                  }
                  className="
                    min-h-[82px]
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-[var(--sk-border)]
                    bg-[var(--sk-card2)]
                    px-10
                    py-3
                    text-sm
                    text-[var(--sk-text)]
                    outline-none
                    transition
                    placeholder:text-slate-500
                    focus:border-cyan-500/60
                    focus:ring-2
                    focus:ring-cyan-500/10
                  "
                />

                <div className="
                  mt-1
                  text-right
                  text-[10px]
                  text-[var(--sk-dim)]
                ">
                  {form.note.length}/500
                </div>

              </div>
            </div>

          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="
            flex
            flex-col-reverse
            gap-3
            bg-[var(--sk-card2)]
            p-4
            sm:flex-row
          ">

            <button
              type="button"
              onClick={onCancel}
              className="
                flex
                h-11
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[var(--sk-border)]
                bg-[var(--sk-card)]
                px-5
                text-sm
                font-semibold
                text-[var(--sk-dim)]
                transition
                hover:border-slate-500
                hover:text-[var(--sk-text)]
              "
            >
              <X size={17} />

              {text.cancel}
            </button>

            <button
              type="submit"
              className="
                flex
                h-11
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-green-400/40
                bg-green-600
                px-5
                text-sm
                font-bold
                text-white
                shadow-[0_0_20px_rgba(34,197,94,0.12)]
                transition
                hover:bg-green-500
              "
            >
              <Save size={17} />

              {editingRecord
                ? text.update
                : text.save}
            </button>

          </div>

        </form>

        {/* =====================================================
            RIGHT SIDE - INFORMATION PANEL
        ===================================================== */}

        <aside className="
          hidden
          xl:block
          space-y-3
          xl:sticky
          xl:top-4
        ">

          {/* PANEL HEADER */}

          <div className="
            rounded-2xl
            border
            border-green-500/30
            bg-[var(--sk-card)]
            p-4
            shadow-lg
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <div className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-green-500/15
                text-green-400
              ">
                <Leaf size={23} />
              </div>

              <div>

                <h3 className="
                  text-lg
                  font-bold
                  text-[var(--sk-text)]
                ">
                  {text.fieldsHelp}
                </h3>

                <p className="
                  text-xs
                  text-[var(--sk-dim)]
                ">
                  {text.helpSub}
                </p>

              </div>

            </div>

          </div>

          {/* ALWAYS REQUIRED */}

          <div className="
            rounded-2xl
            border
            border-green-500/40
            bg-green-500/[0.035]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <CheckCircle2
                size={20}
                className="text-green-400"
              />

              <h4 className="
                text-sm
                font-bold
                text-green-400
              ">
                1. {text.alwaysRequired}
                <span className="ml-1 opacity-70">
                  (4 Fields)
                </span>
              </h4>

            </div>

            <div className="space-y-2">

              {fieldGroups.always.map(
                (item, index) => (
                  <div
                    key={item}
                    className="
                      flex
                      items-start
                      gap-2
                      text-xs
                    "
                  >

                    <span className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-green-500
                      text-[10px]
                      font-bold
                      text-white
                    ">
                      {index + 1}
                    </span>

                    <span className="
                      pt-1
                      text-slate-300
                    ">
                      {item}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

          {/* CONDITION */}

          <div className="
            rounded-2xl
            border
            border-blue-500/40
            bg-blue-500/[0.035]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <Info
                size={20}
                className="text-blue-400"
              />

              <h4 className="
                text-sm
                font-bold
                text-blue-400
              ">
                2. {text.conditionRequired}
                <span className="ml-1 opacity-70">
                  (4 Fields)
                </span>
              </h4>

            </div>

            <div className="space-y-2">

              {fieldGroups.condition.map(
                (item, index) => (
                  <div
                    key={item}
                    className="
                      flex
                      items-start
                      gap-2
                      text-xs
                    "
                  >

                    <span className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-500
                      text-[10px]
                      font-bold
                      text-white
                    ">
                      {index + 6}
                    </span>

                    <span className="
                      pt-1
                      text-slate-300
                    ">
                      {item}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

          {/* OPTIONAL */}

          <div className="
            rounded-2xl
            border
            border-purple-500/40
            bg-purple-500/[0.035]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <Lightbulb
                size={20}
                className="text-purple-400"
              />

              <h4 className="
                text-sm
                font-bold
                text-purple-400
              ">
                3. {text.optionalFields}
                <span className="ml-1 opacity-70">
                  (4 Fields)
                </span>
              </h4>

            </div>

            <div className="space-y-2">

              {fieldGroups.optional.map(
                (item, index) => (
                  <div
                    key={item}
                    className="
                      flex
                      items-start
                      gap-2
                      text-xs
                    "
                  >

                    <span className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-purple-500
                      text-[10px]
                      font-bold
                      text-white
                    ">
                      {index + 11}
                    </span>

                    <span className="
                      pt-1
                      text-slate-300
                    ">
                      {item}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

          {/* SUGGESTION */}

          <div className="
            rounded-2xl
            border
            border-emerald-500/30
            bg-emerald-500/[0.035]
            p-4
          ">

            <div className="
              mb-3
              flex
              items-center
              gap-2
            ">

              <Lightbulb
                size={19}
                className="text-yellow-400"
              />

              <h4 className="
                text-sm
                font-bold
                text-emerald-400
              ">
                {isHindi
                  ? "जरूरी सुझाव"
                  : "Useful Tips"}
              </h4>

            </div>

            <div className="
              space-y-2
              text-xs
              text-slate-300
            ">

              <div className="flex gap-2">
                <CheckCircle2
                  size={14}
                  className="
                    shrink-0
                    text-green-400
                  "
                />

                <span>
                  {isHindi
                    ? "हर बार सभी 15 fields भरना जरूरी नहीं।"
                    : "You don't need to fill all 15 fields every time."}
                </span>
              </div>

              <div className="flex gap-2">
                <CheckCircle2
                  size={14}
                  className="
                    shrink-0
                    text-green-400
                  "
                />

                <span>
                  {isHindi
                    ? "सही और साफ रिकॉर्ड रखें।"
                    : "Keep accurate and clear records."}
                </span>
              </div>

              <div className="flex gap-2">
                <CheckCircle2
                  size={14}
                  className="
                    shrink-0
                    text-green-400
                  "
                />

                <span>
                  {isHindi
                    ? "बाद में फसल की लागत, बिक्री और लाभ समझना आसान होगा।"
                    : "Later it becomes easier to understand cost, sales and profit."}
                </span>
              </div>

              <div className="flex gap-2">
                <CheckCircle2
                  size={14}
                  className="
                    shrink-0
                    text-green-400
                  "
                />

                <span>
                  {isHindi
                    ? "खेत की वास्तविक स्थिति का रिकॉर्ड बना रहेगा।"
                    : "You will have a record of the actual farm situation."}
                </span>
              </div>

            </div>

            <div className="
              mt-4
              rounded-xl
              border
              border-green-500/30
              bg-green-500/10
              px-3
              py-3
              text-center
              text-xs
              font-bold
              text-green-300
            ">
              {text.suggestion}
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}