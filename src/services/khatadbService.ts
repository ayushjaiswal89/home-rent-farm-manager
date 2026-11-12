import { db } from '../db/khatadb';
import type {
  FarmRecord,
  RentRecord,
  HomeExpense,
  Partner,
  PartnerCashEntry,
  Khet,
  KhetCrop,
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
  RENT_STORAGE_KEY,
  HOME_STORAGE_KEY,
  STOCKS_STORAGE_KEY,
  migrateLocalStorageToIndexedDB,
} from './migrationService';
import { TASKS_STORAGE_KEY } from '../lib/profileAndSecurity';

/**
 * High-reliability data service:
 * 1. Reads and writes directly to IndexedDB (Dexie).
 * 2. Mirrors writes to LocalStorage so existing components and fallbacks continue working 100%.
 * 3. Enqueues changes in syncQueue for Cloud Sync.
 */

export async function initStorageEngine(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // Check if migration is needed
    const count = await db.records.count();
    const hasLocalRecords = Boolean(localStorage.getItem(RECORDS_STORAGE_KEY));
    if (count === 0 && hasLocalRecords) {
      await migrateLocalStorageToIndexedDB();
    }
  } catch (err) {
    console.error('Storage initialization check error:', err);
  }
}

// ----------------- FARM RECORDS -----------------

export async function fetchFarmRecords(): Promise<FarmRecord[]> {
  try {
    const list = await db.records.toArray();
    if (list.length > 0) return list;
    // Fallback if DB empty
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function putFarmRecord(record: FarmRecord): Promise<void> {
  const item = { ...record, updatedAt: Date.now() };
  await db.records.put(item);
  await db.syncQueue.add({
    tableName: 'records',
    recordId: item.id,
    action: 'update',
    payload: item,
    createdAt: Date.now(),
    retryCount: 0,
  });

  // Mirror to LocalStorage
  try {
    const all = await db.records.toArray();
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function removeFarmRecord(id: string): Promise<void> {
  await db.records.delete(id);
  await db.syncQueue.add({
    tableName: 'records',
    recordId: id,
    action: 'delete',
    createdAt: Date.now(),
    retryCount: 0,
  });

  try {
    const all = await db.records.toArray();
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

// ----------------- RENT RECORDS -----------------

export async function fetchRentRecords(): Promise<RentRecord[]> {
  try {
    const list = await db.rentRecords.toArray();
    if (list.length > 0) return list;
    const raw = localStorage.getItem(RENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    const raw = localStorage.getItem(RENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function putRentRecord(record: RentRecord): Promise<void> {
  const item = { ...record, updatedAt: Date.now() };
  await db.rentRecords.put(item);
  await db.syncQueue.add({
    tableName: 'rentRecords',
    recordId: item.id,
    action: 'update',
    payload: item,
    createdAt: Date.now(),
    retryCount: 0,
  });

  try {
    const all = await db.rentRecords.toArray();
    localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function removeRentRecord(id: string): Promise<void> {
  await db.rentRecords.delete(id);
  await db.syncQueue.add({
    tableName: 'rentRecords',
    recordId: id,
    action: 'delete',
    createdAt: Date.now(),
    retryCount: 0,
  });

  try {
    const all = await db.rentRecords.toArray();
    localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

// ----------------- HOME EXPENSES -----------------

export async function fetchHomeExpenses(): Promise<HomeExpense[]> {
  try {
    const list = await db.homeExpenses.toArray();
    if (list.length > 0) return list;
    const raw = localStorage.getItem(HOME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    const raw = localStorage.getItem(HOME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function putHomeExpense(expense: HomeExpense): Promise<void> {
  const item = { ...expense, updatedAt: Date.now() };
  await db.homeExpenses.put(item);
  await db.syncQueue.add({
    tableName: 'homeExpenses',
    recordId: item.id,
    action: 'update',
    payload: item,
    createdAt: Date.now(),
    retryCount: 0,
  });

  try {
    const all = await db.homeExpenses.toArray();
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export async function removeHomeExpense(id: string): Promise<void> {
  await db.homeExpenses.delete(id);
  await db.syncQueue.add({
    tableName: 'homeExpenses',
    recordId: id,
    action: 'delete',
    createdAt: Date.now(),
    retryCount: 0,
  });

  try {
    const all = await db.homeExpenses.toArray();
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

// ----------------- KHETS & CROPS -----------------

export async function fetchKhets(): Promise<Khet[]> {
  try {
    const list = await db.khets.toArray();
    if (list.length > 0) return list;
    const raw = localStorage.getItem(KHETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    const raw = localStorage.getItem(KHETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function persistKhetsToDB(khets: Khet[], crops: KhetCrop[]): Promise<void> {
  try {
    await db.transaction('rw', [db.khets, db.crops], async () => {
      await db.khets.clear();
      if (khets.length > 0) await db.khets.bulkPut(khets);
      await db.crops.clear();
      if (crops.length > 0) await db.crops.bulkPut(crops);
    });

    localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(khets));
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(crops));
  } catch (err) {
    console.error('Error persisting khets to DB:', err);
  }
}
