import { AppSettings } from "./types";

const SETTINGS_KEY = "sk_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  goalExpense: "20000",
  goalRent: "20000",
  lang: "hi",
  currency: "INR",
  darkMode: true,
  notifs: true,
  backupReminder: true,
  exportCsv: false,
  dateFormat: "DD/MM/YYYY",

  // New
  appLock: false,
  pin: "",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function persistSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore write errors
  }
}
