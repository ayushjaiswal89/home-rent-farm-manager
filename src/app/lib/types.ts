export type Tab = "home" | "dashboard" | "rent" | "farm" | "reports" | "backup" | "settings";
export type Lang = "hi" | "en";

export interface HomeExpense {
  id: string;
  date: string;
  category: string;
  note: string;
  amount: number;
}

export type RentStatus = "Received" | "Pending" | "Partial";

export interface RentRecord {
  id: string;
  date: string;
  tenant: string;
  month: string;
  whatsapp: string;
  amount: number;
  prevReading: number;
  currentReading: number;
  ratePerUnit: number;
  units: number;
  lightBill: number;
  total: number;
  status: RentStatus;
  note: string;
}

export type FarmType = "Expense" | "Yield" | "Sale";

export interface FarmRecord {
  id: string;
  date: string;
  type: FarmType;
  crop: string;
  expenseCategory: string;
  amount: number;
  quantity: number;
  unit: string;
  price: number;
  note: string;
  field?: string;
  area?: number;
  areaUnit?: string;
  worker?: string;
  machine?: string;
  season?: string;
}

export interface AppSettings {
  goalExpense: string;
  goalRent: string;
  lang: "hi" | "en";
  currency: "INR" | "USD" | "EUR";
   dateFormat:
    | "DD/MM/YYYY"
    | "MM/DD/YYYY"
    | "YYYY-MM-DD";
  darkMode: boolean;
  notifs: boolean;
  backupReminder: boolean;
  exportCsv: boolean;
}
