import { db } from '../db/khatadb';
import type {
  FarmRecord,
  Khet,
  KhetCrop,
  Partner,
  PartnerCashEntry,
  RentRecord,
  HomeExpense,
  StockItem,
  FarmTask,
} from '../lib/types';
import {
  RECORDS_STORAGE_KEY,
  KHETS_STORAGE_KEY,
  CROPS_STORAGE_KEY,
  PARTNERS_STORAGE_KEY,
  PARTNER_CASH_STORAGE_KEY,
} from '../lib/storageMigration';
import {
  PROFILE_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  SECURITY_STORAGE_KEY,
  ACCOUNT_AUTH_STORAGE_KEY,
} from '../lib/profileAndSecurity';

export const MIGRATION_FLAG_KEY = 'sk-indexeddb-migrated-v1';
export const RENT_STORAGE_KEY = 'sk-rent-records';
export const HOME_STORAGE_KEY = 'sk-home-expenses';
export const STOCKS_STORAGE_KEY = 'kisan-sathi-stocks';
export const LAND_SETTINGS_STORAGE_KEY = 'sk-land-settings';
export const APP_NAME_STORAGE_KEY = 'sk-app-name';

export interface MigrationSummary {
  success: boolean;
  farmRecordsCount: number;
  khetsCount: number;
  cropsCount: number;
  partnersCount: number;
  partnerCashCount: number;
  rentRecordsCount: number;
  homeExpensesCount: number;
  stocksCount: number;
  tasksCount: number;
  profileMigrated: boolean;
  error?: string;
}

function safeParseArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[Migration] Failed to parse array for key ${key}:`, err);
    return [];
  }
}

function safeParseObject<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn(`[Migration] Failed to parse object for key ${key}:`, err);
    return null;
  }
}

/**
 * Safely copies all existing LocalStorage records into IndexedDB.
 * Idempotent: Uses bulkPut so re-running will not create duplicates.
 * Zero-Risk: Does not delete LocalStorage keys.
 */
export async function migrateLocalStorageToIndexedDB(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    success: false,
    farmRecordsCount: 0,
    khetsCount: 0,
    cropsCount: 0,
    partnersCount: 0,
    partnerCashCount: 0,
    rentRecordsCount: 0,
    homeExpensesCount: 0,
    stocksCount: 0,
    tasksCount: 0,
    profileMigrated: false,
  };

  if (typeof window === 'undefined') {
    return summary;
  }

  try {
    // 1. Read all existing data from their exact localStorage keys
    const rawFarmRecords = safeParseArray<FarmRecord>(RECORDS_STORAGE_KEY);
    const rawKhets = safeParseArray<Khet>(KHETS_STORAGE_KEY);
    const rawCrops = safeParseArray<KhetCrop>(CROPS_STORAGE_KEY);
    const rawPartners = safeParseArray<Partner>(PARTNERS_STORAGE_KEY);
    const rawPartnerCash = safeParseArray<PartnerCashEntry>(PARTNER_CASH_STORAGE_KEY);
    const rawRent = safeParseArray<RentRecord>(RENT_STORAGE_KEY);
    const rawHome = safeParseArray<HomeExpense>(HOME_STORAGE_KEY);
    const rawStocks = safeParseArray<StockItem>(STOCKS_STORAGE_KEY);
    const rawTasks = safeParseArray<FarmTask>(TASKS_STORAGE_KEY);

    const rawProfile = safeParseObject<any>(PROFILE_STORAGE_KEY);
    const rawLandSettings = safeParseObject<any>(LAND_SETTINGS_STORAGE_KEY);
    const rawAppName = localStorage.getItem(APP_NAME_STORAGE_KEY) || 'स्मार्ट खाता';
    const rawAuth = safeParseObject<any>(ACCOUNT_AUTH_STORAGE_KEY);
    const rawSecurity = safeParseObject<any>(SECURITY_STORAGE_KEY);

    const now = Date.now();

    // 2. Normalize and ensure IDs + timestamps
    const farmRecords: FarmRecord[] = rawFarmRecords.map((r, idx) => ({
      ...r,
      id: r.id || `farm_${now}_${idx}`,
      amount: Number(r.amount) || 0,
    }));

    const khets: Khet[] = rawKhets.map((k, idx) => ({
      ...k,
      id: k.id || `khet_${now}_${idx}`,
    }));

    const crops: KhetCrop[] = rawCrops.map((c, idx) => ({
      ...c,
      id: c.id || `crop_${now}_${idx}`,
    }));

    const partners: Partner[] = rawPartners.map((p, idx) => ({
      ...p,
      id: p.id || `partner_${now}_${idx}`,
    }));

    const partnerCash: PartnerCashEntry[] = rawPartnerCash.map((pc, idx) => ({
      ...pc,
      id: pc.id || `pcash_${now}_${idx}`,
      amount: Number(pc.amount) || 0,
    }));

    const rentRecords: RentRecord[] = rawRent.map((rt, idx) => ({
      ...rt,
      id: rt.id || `rent_${now}_${idx}`,
      amount: Number(rt.amount) || 0,
      total: Number(rt.total) || 0,
    }));

    const homeExpenses: HomeExpense[] = rawHome.map((h, idx) => ({
      ...h,
      id: h.id || `home_${now}_${idx}`,
      amount: Number(h.amount) || 0,
    }));

    const stocks: StockItem[] = rawStocks.map((s, idx) => ({
      ...s,
      id: s.id || `stock_${now}_${idx}`,
      quantity: Number(s.quantity) || 0,
    }));

    const tasks: FarmTask[] = rawTasks.map((t, idx) => ({
      ...t,
      id: t.id || `task_${now}_${idx}`,
    }));

    // 3. Atomically write to IndexedDB
    await db.transaction(
      'rw',
      [
        db.records,
        db.khets,
        db.crops,
        db.partners,
        db.partnerCash,
        db.rentRecords,
        db.homeExpenses,
        db.stocks,
        db.tasks,
        db.appSettings,
      ],
      async () => {
        if (farmRecords.length > 0 && await db.records.count() === 0) await db.records.bulkPut(farmRecords);
        if (khets.length > 0 && await db.khets.count() === 0) await db.khets.bulkPut(khets);
        if (crops.length > 0 && await db.crops.count() === 0) await db.crops.bulkPut(crops);
        if (partners.length > 0 && await db.partners.count() === 0) await db.partners.bulkPut(partners);
        if (partnerCash.length > 0 && await db.partnerCash.count() === 0) await db.partnerCash.bulkPut(partnerCash);
        if (rentRecords.length > 0 && await db.rentRecords.count() === 0) await db.rentRecords.bulkPut(rentRecords);
        if (homeExpenses.length > 0 && await db.homeExpenses.count() === 0) await db.homeExpenses.bulkPut(homeExpenses);
        if (stocks.length > 0 && await db.stocks.count() === 0) await db.stocks.bulkPut(stocks);
        if (tasks.length > 0 && await db.tasks.count() === 0) await db.tasks.bulkPut(tasks);

        // Save app settings
        if (rawProfile) {
          await db.appSettings.put({ key: PROFILE_STORAGE_KEY, value: rawProfile, updatedAt: now });
        }
        if (rawLandSettings) {
          await db.appSettings.put({ key: LAND_SETTINGS_STORAGE_KEY, value: rawLandSettings, updatedAt: now });
        }
        if (rawAppName) {
          await db.appSettings.put({ key: APP_NAME_STORAGE_KEY, value: rawAppName, updatedAt: now });
        }
        if (rawAuth) {
          await db.appSettings.put({ key: ACCOUNT_AUTH_STORAGE_KEY, value: rawAuth, updatedAt: now });
        }
        if (rawSecurity) {
          await db.appSettings.put({ key: SECURITY_STORAGE_KEY, value: rawSecurity, updatedAt: now });
        }
      }
    );

    // 4. Mark migration successful
    localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify({ migratedAt: now, version: 1 }));

    summary.success = true;
    summary.farmRecordsCount = farmRecords.length;
    summary.khetsCount = khets.length;
    summary.cropsCount = crops.length;
    summary.partnersCount = partners.length;
    summary.partnerCashCount = partnerCash.length;
    summary.rentRecordsCount = rentRecords.length;
    summary.homeExpensesCount = homeExpenses.length;
    summary.stocksCount = stocks.length;
    summary.tasksCount = tasks.length;
    summary.profileMigrated = Boolean(rawProfile);

    console.log('[Migration] Successfully migrated localStorage into IndexedDB:', summary);
    return summary;
  } catch (error) {
    console.error('[Migration] Failed migrating localStorage into IndexedDB:', error);
    summary.success = false;
    summary.error = String(error);
    return summary;
  }
}
