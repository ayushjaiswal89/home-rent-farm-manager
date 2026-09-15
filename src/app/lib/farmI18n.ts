import type { Lang } from "./types";

export const FARM_STRINGS = {
  hi: {
    farmTitle: "🌾 खेती प्रबंधन",
    farmSub: "खर्च/उत्पादन/बिक्री—एक ही जगह।",

    cropWheat: "गेहूं",
    cropRice: "चावल",
    cropSoybean: "सोयाबीन",
    cropCotton: "कपास",
    cropMustard: "सरसों",
    cropOther: "अन्य",

    profit: "लाभ",
    cropStatistics: "फसल आँकड़े",
    sales: "बिक्री",

    basicDetails: "मूल जानकारी",
    fieldDetails: "खेत की जानकारी",
    transaction: "लेन-देन",
    extraDetails: "अतिरिक्त जानकारी",

    date: "तारीख",
    type: "टाइप",
    crop: "फसल",
    season: "सीजन",

    field: "खेत का नाम",
    area: "क्षेत्रफल",
    areaUnit: "यूनिट",

    expenseCategory: "खर्च की श्रेणी",
    amount: "राशि (₹)",
    quantity: "मात्रा",
    unit: "यूनिट",
    price: "कीमत/यूनिट",

    worker: "मजदूर",
    machine: "मशीन",
    selectWorker: "मजदूर चुनें",
    selectMachine: "मशीन चुनें",

    note: "विवरण",

    expense: "खर्च",
    yield: "उत्पादन",
    sale: "बिक्री",

    totalExpense: "कुल खर्च",
    totalSales: "कुल बिक्री",
    totalProfit: "लाभ",
    totalYield: "कुल उत्पादन",

    expenseByCategory: "श्रेणी-वार खर्च",
    monthlyTrend: "मासिक ट्रेंड",

    cropStatsTitle: "फसल आँकड़े",
    yieldSummary: "उपज सारांश",
    expenseLabel: "खर्च",
    yieldLabel: "उपज",
    salesLabel: "बिक्री",
    profitLabel: "लाभ",

    allTypes: "सभी टाइप",
    allDate: "सभी तारीख",
    today: "आज",
    thisMonth: "इस महीने",
    thisYear: "इस वर्ष",

    searchCrop: "फसल खोजें...",

    action: "कार्रवाई",
    details: "विवरण",
    noRecords: "कोई रिकॉर्ड उपलब्ध नहीं",

    csv: "CSV",
    pdf: "PDF",

    addRecord: "➕ रिकॉर्ड जोड़ें",
    updateRecord: "रिकॉर्ड अपडेट करें",
    cancel: "रद्द करें",

    totalSaleAmount: "कुल बिक्री राशि",

    wheat: "गेहूँ",
    rice: "चावल",
    soybean: "सोयाबीन",
    cotton: "कपास",
    other: "अन्य",

    worker1: "मजदूर 1",
    worker2: "मजदूर 2",
    worker3: "मजदूर 3",

    tractor: "ट्रैक्टर",
    rotavator: "रोटावेटर",
    cultivator: "कल्टीवेटर",
    harvester: "हार्वेस्टर",
    sprayer: "स्प्रेयर",

    kharif: "खरीफ",
    rabi: "रबी",
    zaid: "जायद",

    seed: "बीज",
    fertilizer: "खाद",
    labor: "मजदूरी",
    diesel: "डीजल",
    irrigation: "सिंचाई",

    kg: "किलोग्राम",
    quintal: "क्विंटल",
    ton: "टन",

    bigha: "बीघा",
    acre: "एकड़",
    hectare: "हेक्टेयर",

    january: "जनवरी",
    february: "फ़रवरी",
    march: "मार्च",
    april: "अप्रैल",
    may: "मई",
    june: "जून",
    july: "जुलाई",
    august: "अगस्त",
    september: "सितंबर",
    october: "अक्टूबर",
    november: "नवंबर",
    december: "दिसंबर",
  },

  en: {
    farmTitle: "🌾 Farm Management",
    farmSub: "Expense / Yield / Sale — all in one place.",

    cropWheat: "Wheat",
    cropRice: "Rice",
    cropSoybean: "Soybean",
    cropCotton: "Cotton",
    cropMustard: "Mustard",
    cropOther: "Other",

    profit: "Profit",
    cropStatistics: "Crop Statistics",
    sales: "Sales",
    basicDetails: "Basic Details",
    fieldDetails: "Field Details",
    transaction: "Transaction",
    extraDetails: "Extra Details",

    date: "Date",
    type: "Type",
    crop: "Crop",
    season: "Season",

    field: "Field Name",
    area: "Area",
    areaUnit: "Area Unit",

    expenseCategory: "Expense Category",
    amount: "Amount (₹)",
    quantity: "Quantity",
    unit: "Unit",
    price: "Price / Unit",

    worker: "Worker",
    machine: "Machine",
    selectWorker: "Select Worker",
    selectMachine: "Select Machine",

    note: "Description",

    expense: "Expense",
    yield: "Yield",
    sale: "Sale",

    totalExpense: "Total Expense",
    totalSales: "Total Sales",
    totalProfit: "Profit",
    totalYield: "Total Yield",

    expenseByCategory: "Expense by Category",
    monthlyTrend: "Monthly Trend",

    cropStatsTitle: "Crop Statistics",
    yieldSummary: "Yield Summary",
    expenseLabel: "Expense",
    yieldLabel: "Yield",
    salesLabel: "Sales",
    profitLabel: "Profit",

    allTypes: "All Types",
    allDate: "All Date",
    today: "Today",
    thisMonth: "This Month",
    thisYear: "This Year",

    searchCrop: "Search Crop...",

    action: "Action",
    details: "Details",
    noRecords: "No records found",

    csv: "CSV",
    pdf: "PDF",

    addRecord: "➕ Add Record",
    updateRecord: "Update Record",
    cancel: "Cancel",

    totalSaleAmount: "Total Sale Amount",

    wheat: "Wheat",
    rice: "Rice",
    soybean: "Soybean",
    cotton: "Cotton",
    other: "Other",

    worker1: "Worker 1",
    worker2: "Worker 2",
    worker3: "Worker 3",

    tractor: "Tractor",
    rotavator: "Rotavator",
    cultivator: "Cultivator",
    harvester: "Harvester",
    sprayer: "Sprayer",

    kharif: "Kharif",
    rabi: "Rabi",
    zaid: "Zaid",

    seed: "Seeds",
    fertilizer: "Fertilizer",
    labor: "Labor",
    diesel: "Diesel",
    irrigation: "Irrigation",

    kg: "Kg",
    quintal: "Quintal",
    ton: "Ton",

    bigha: "Bigha",
    acre: "Acre",
    hectare: "Hectare",

    january: "Jan",
    february: "Feb",
    march: "Mar",
    april: "Apr",
    may: "May",
    june: "Jun",
    july: "Jul",
    august: "Aug",
    september: "Sep",
    october: "Oct",
    november: "Nov",
    december: "Dec",
  },
} as const;

export type FarmTranslation = (typeof FARM_STRINGS)[Lang];

export function cropLabel(lang: Lang, crop: string) {
  const t = FARM_STRINGS[lang];

  switch (crop) {
    case "Wheat":
      return t.wheat;
    case "Rice":
      return t.rice;
    case "Soybean":
      return t.soybean;
    case "Cotton":
      return t.cotton;
    case "Other":
      return t.other;
    default:
      return crop;
  }
}

export function workerLabel(lang: Lang, worker: string) {
  const t = FARM_STRINGS[lang];

  switch (worker) {
    case "Worker 1":
      return t.worker1;
    case "Worker 2":
      return t.worker2;
    case "Worker 3":
      return t.worker3;
    case "Other":
      return t.other;
    default:
      return worker;
  }
}

export function machineLabel(lang: Lang, machine: string) {
  const t = FARM_STRINGS[lang];

  switch (machine) {
    case "Tractor":
      return t.tractor;
    case "Rotavator":
      return t.rotavator;
    case "Cultivator":
      return t.cultivator;
    case "Harvester":
      return t.harvester;
    case "Sprayer":
      return t.sprayer;
    case "Other":
      return t.other;
    default:
      return machine;
  }
}

export function seasonLabel(lang: Lang, season: string) {
  const t = FARM_STRINGS[lang];

  switch (season) {
    case "Kharif":
      return t.kharif;
    case "Rabi":
      return t.rabi;
    case "Zaid":
      return t.zaid;
    default:
      return season;
  }
}

export function expenseCategoryLabel(lang: Lang, category: string) {
  const t = FARM_STRINGS[lang];

  switch (category) {
    case "बीज":
    case "Seeds":
      return t.seed;

    case "खाद":
    case "Fertilizer":
      return t.fertilizer;

    case "मजदूरी":
    case "Labor":
      return t.labor;

    case "डीजल":
    case "Diesel":
      return t.diesel;

    case "सिंचाई":
    case "Irrigation":
      return t.irrigation;

    case "अन्य":
    case "Other":
      return t.other;

    default:
      return category;
  }
}

export function areaUnitLabel(lang: Lang, unit: string) {
  const t = FARM_STRINGS[lang];

  switch (unit) {
    case "बीघा":
    case "Bigha":
      return t.bigha;

    case "एकड़":
    case "Acre":
      return t.acre;

    case "हेक्टेयर":
    case "Hectare":
      return t.hectare;

    default:
      return unit;
  }
}

export function unitLabel(lang: Lang, unit: string) {
  const t = FARM_STRINGS[lang];

  switch (unit) {
    case "Kg":
      return t.kg;

    case "Quintal":
      return t.quintal;

    case "Ton":
      return t.ton;

    default:
      return unit;
  }
}

export function typeLabel(lang: Lang, type: string) {
  const t = FARM_STRINGS[lang];

  switch (type) {
    case "Expense":
      return t.expense;

    case "Yield":
      return t.yield;

    case "Sale":
      return t.sale;

    default:
      return type;
  }
}