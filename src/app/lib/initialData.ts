import { FarmRecord, HomeExpense, RentRecord } from "./types";

export const INIT_HOME: HomeExpense[] = [
  { id: "h1", date: "2024-06-20", category: "🥦 Grocery", note: "सब्जी और दूध", amount: 1200 },
  { id: "h2", date: "2024-06-18", category: "⚡ Bills", note: "बिजली बिल जून", amount: 2800 },
  { id: "h3", date: "2024-06-15", category: "💊 Medical", note: "दवाई", amount: 650 },
  { id: "h4", date: "2024-06-12", category: "🚗 Transport", note: "पेट्रोल", amount: 900 },
  { id: "h5", date: "2024-06-08", category: "🥦 Grocery", note: "राशन", amount: 3500 },
];

export const INIT_RENT: RentRecord[] = [
  {
    id: "r1", date: "2024-06-01", tenant: "रामेश्वर सिंह", month: "Jun", whatsapp: "9876543210",
    amount: 8000, prevReading: 520, currentReading: 573, ratePerUnit: 8, units: 53, lightBill: 424, total: 8424,
    status: "Received", note: "",
  },
  {
    id: "r2", date: "2024-06-01", tenant: "मोहन लाल", month: "Jun", whatsapp: "9765432109",
    amount: 6500, prevReading: 310, currentReading: 348, ratePerUnit: 8, units: 38, lightBill: 304, total: 6804,
    status: "Pending", note: "देरी से आयेगा",
  },
  {
    id: "r3", date: "2024-06-01", tenant: "सुरेश पाल", month: "Jun", whatsapp: "9654321098",
    amount: 5000, prevReading: 180, currentReading: 214, ratePerUnit: 8, units: 34, lightBill: 272, total: 5272,
    status: "Partial", note: "आधा दिया",
  },
];

export const INIT_FARM: FarmRecord[] = [
  { id: "f1", date: "2024-06-18", type: "Expense", crop: "Wheat", expenseCategory: "खाद", amount: 3200, quantity: 0, unit: "Kg", price: 0, note: "DAP खाद 2 बोरी" },
  { id: "f2", date: "2024-06-17", type: "Expense", crop: "Rice", expenseCategory: "डीजल", amount: 1800, quantity: 0, unit: "Kg", price: 0, note: "ट्रैक्टर डीजल 20L" },
  { id: "f3", date: "2024-06-15", type: "Sale", crop: "Wheat", expenseCategory: "", amount: 45000, quantity: 30, unit: "Quintal", price: 1500, note: "रामपुर मंडी" },
  { id: "f4", date: "2024-06-13", type: "Expense", crop: "Rice", expenseCategory: "मजदूरी", amount: 5500, quantity: 0, unit: "Kg", price: 0, note: "कटाई मजदूरी" },
  { id: "f5", date: "2024-06-10", type: "Yield", crop: "Mustard", expenseCategory: "", amount: 0, quantity: 6.3, unit: "Quintal", price: 0, note: "सरसों कटाई" },
];

export const MONTHLY_TREND = [
  { month: "Jan", rent: 19500, farm: 13000, home: 8200 },
  { month: "Feb", rent: 19500, farm: 17000, home: 9100 },
  { month: "Mar", rent: 20000, farm: 40000, home: 7800 },
  { month: "Apr", rent: 20000, farm: 26000, home: 8900 },
  { month: "May", rent: 20500, farm: 17000, home: 9500 },
  { month: "Jun", rent: 20500, farm: 34500, home: 9050 },
] as const;
