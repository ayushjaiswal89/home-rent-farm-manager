import { db } from '../db/khatadb';
import type { Table } from 'dexie';
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
 * 1. Diff-syncs changes to IndexedDB (Dexie) without wiping tables on every write.
 * 2. Mirrors writes to LocalStorage so synchronous readers stay compatible.
 * 3. Deduplicates and enqueues changes into syncQueue for offline-first Cloud Sync.
 */

const collectionSnapshots = new Map<string, Map<string, string>>();
let syncTriggerTimer: ReturnType<typeof setTimeout> | null = null;
let autoSyncCallback: (() => void) | null = null;
let sheetsAutoSyncCallback: (() => void) | null = null;

export function registerAutoSyncCallback(cb: (() => void) | null): void {
  autoSyncCallback = cb;
}

export function registerSheetsAutoSyncCallback(cb: () => void): void {
  sheetsAutoSyncCallback = cb;
}

function scheduleAutoSync(): void {
  if (typeof window === 'undefined' || (!autoSyncCallback && !sheetsAutoSyncCallback)) return;
  if (syncTriggerTimer) clearTimeout(syncTriggerTimer);
  syncTriggerTimer = setTimeout(() => {
    syncTriggerTimer = null;
    autoSyncCallback?.();
    sheetsAutoSyncCallback?.();
  }, 1200);
}

function serializeWithoutSyncMeta(item: Record<string, any>): string {
  const { updatedAt: _u, serverUpdatedAt: _s, isDeleted: _d, ...rest } = item;
  return JSON.stringify(rest);
}

async function enqueueSyncItem(
  tableName: string,
  recordId: string,
  action: 'insert' | 'update' | 'delete',
  payload?: any
): Promise<void> {
  // Replace any existing queued operation for the same tableName + recordId to keep outbox compact
  const existing = await db.syncQueue
    .where('recordId')
    .equals(recordId)
    .filter((q) => q.tableName === tableName)
    .toArray();

  if (existing.length > 0) {
    const idsToRemove = existing.map((e) => e.id).filter((id): id is number => id !== undefined);
    if (idsToRemove.length > 0) {
      await db.syncQueue.bulkDelete(idsToRemove);
    }
  }

  await db.syncQueue.add({
    tableName,
    recordId,
    action,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  });
}

/**
 * Updates the in-memory snapshot for a collection after a cloud pull or backup restore
 * so React state updates do not re-enqueue already-synced records.
 */
export function refreshCollectionSnapshot<T extends { id: string }>(
  tableName: string,
  items: T[]
): void {
  const snap = new Map<string, string>();
  for (const item of items) {
    if (item && item.id) {
      snap.set(item.id, serializeWithoutSyncMeta(item as Record<string, any>));
    }
  }
  collectionSnapshots.set(tableName, snap);
}

/**
 * Diff-syncs an array of entities into Dexie + syncQueue.
 * Only modified/created/deleted rows are touched and enqueued.
 */
export async function syncCollectionToDb<T extends { id: string; updatedAt?: number }>(
  tableName: string,
  dexieTable: Table<T, string>,
  items: T[],
  options: { skipQueue?: boolean } = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  let prevSnap = collectionSnapshots.get(tableName);

  // Initialize snapshot from existing Dexie records on first write of this session
  if (!prevSnap) {
    prevSnap = new Map<string, string>();
    try {
      const existingRows = await dexieTable.toArray();
      for (const row of existingRows) {
        if (row && row.id) {
          prevSnap.set(row.id, serializeWithoutSyncMeta(row as Record<string, any>));
        }
      }
    } catch {}
    collectionSnapshots.set(tableName, prevSnap);
  }

  const nextSnap = new Map<string, string>();
  const toPut: T[] = [];
  const toDelete: string[] = [];

  for (const rawItem of items) {
    if (!rawItem || !rawItem.id) continue;
    const serialized = serializeWithoutSyncMeta(rawItem as Record<string, any>);
    nextSnap.set(rawItem.id, serialized);

    const prevSerialized = prevSnap.get(rawItem.id);
    if (prevSerialized !== serialized) {
      const withTs: T = {
        ...rawItem,
        updatedAt: options.skipQueue ? rawItem.updatedAt || Date.now() : Date.now(),
      };
      toPut.push(withTs);
    }
  }

  for (const oldId of prevSnap.keys()) {
    if (!nextSnap.has(oldId)) {
      toDelete.push(oldId);
    }
  }

  collectionSnapshots.set(tableName, nextSnap);

  if (toPut.length === 0 && toDelete.length === 0) {
    return false;
  }

  await db.transaction('rw', [dexieTable, db.syncQueue], async () => {
    if (toPut.length > 0) {
      await dexieTable.bulkPut(toPut);
      if (!options.skipQueue) {
        for (const item of toPut) {
          await enqueueSyncItem(tableName, item.id, 'update', item);
        }
      }
    }

    if (toDelete.length > 0) {
      await dexieTable.bulkDelete(toDelete);
      if (!options.skipQueue) {
        for (const id of toDelete) {
          await enqueueSyncItem(tableName, id, 'delete');
        }
      }
    }
  });

  if (!options.skipQueue) {
    scheduleAutoSync();
  }

  return true;
}

export async function initStorageEngine(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const tableCounts = await Promise.all([
      db.records.count(),
      db.khets.count(),
      db.crops.count(),
      db.partners.count(),
      db.partnerCash.count(),
      db.rentRecords.count(),
      db.homeExpenses.count(),
      db.stocks.count(),
      db.tasks.count(),
    ]);
    const legacyCollections = [
      { key: RECORDS_STORAGE_KEY, count: tableCounts[0] },
      { key: KHETS_STORAGE_KEY, count: tableCounts[1] },
      { key: CROPS_STORAGE_KEY, count: tableCounts[2] },
      { key: PARTNERS_STORAGE_KEY, count: tableCounts[3] },
      { key: PARTNER_CASH_STORAGE_KEY, count: tableCounts[4] },
      { key: RENT_STORAGE_KEY, count: tableCounts[5] },
      { key: HOME_STORAGE_KEY, count: tableCounts[6] },
      { key: STOCKS_STORAGE_KEY, count: tableCounts[7] },
      { key: TASKS_STORAGE_KEY, count: tableCounts[8] },
    ];
    const hasUnmigratedData = legacyCollections.some(({ key, count }) => {
      if (count > 0) return false;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    });

    if (hasUnmigratedData) {
      const summary = await migrateLocalStorageToIndexedDB();
      if (!summary.success) {
        throw new Error(summary.error || 'Local data migration failed');
      }
    }
  } catch (err) {
    console.error('Storage initialization check error:', err);
    throw err;
  }
}

export async function clearAllLocalDatabases(options: { keepProfileAndSettings?: boolean } = {}): Promise<void> {
  collectionSnapshots.clear();

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
      db.syncQueue,
    ],
    async () => {
      await db.records.clear();
      await db.khets.clear();
      await db.crops.clear();
      await db.partners.clear();
      await db.partnerCash.clear();
      await db.rentRecords.clear();
      await db.homeExpenses.clear();
      await db.stocks.clear();
      await db.tasks.clear();
      await db.syncQueue.clear();
      if (!options.keepProfileAndSettings) {
        await db.appSettings.clear();
      }
    }
  );

  if (typeof window !== 'undefined') {
    if (options.keepProfileAndSettings) {
      const ledgerKeys = [
        RECORDS_STORAGE_KEY,
        KHETS_STORAGE_KEY,
        CROPS_STORAGE_KEY,
        PARTNERS_STORAGE_KEY,
        PARTNER_CASH_STORAGE_KEY,
        RENT_STORAGE_KEY,
        HOME_STORAGE_KEY,
        STOCKS_STORAGE_KEY,
        TASKS_STORAGE_KEY,
      ];
      for (const k of ledgerKeys) {
        localStorage.setItem(k, JSON.stringify([]));
      }
    } else {
      localStorage.clear();
    }
  }
}

// ----------------- FARM RECORDS -----------------

export async function fetchFarmRecords(): Promise<FarmRecord[]> {
  try {
    const list = await db.records.toArray();
    if (list.length > 0) return list;
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
  await enqueueSyncItem('records', item.id, 'update', item);

  try {
    const all = await db.records.toArray();
    refreshCollectionSnapshot('records', all);
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
}

export async function removeFarmRecord(id: string): Promise<void> {
  await db.records.delete(id);
  await enqueueSyncItem('records', id, 'delete');

  try {
    const all = await db.records.toArray();
    refreshCollectionSnapshot('records', all);
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
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
  await enqueueSyncItem('rentRecords', item.id, 'update', item);

  try {
    const all = await db.rentRecords.toArray();
    refreshCollectionSnapshot('rentRecords', all);
    localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
}

export async function removeRentRecord(id: string): Promise<void> {
  await db.rentRecords.delete(id);
  await enqueueSyncItem('rentRecords', id, 'delete');

  try {
    const all = await db.rentRecords.toArray();
    refreshCollectionSnapshot('rentRecords', all);
    localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
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
  await enqueueSyncItem('homeExpenses', item.id, 'update', item);

  try {
    const all = await db.homeExpenses.toArray();
    refreshCollectionSnapshot('homeExpenses', all);
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
}

export async function removeHomeExpense(id: string): Promise<void> {
  await db.homeExpenses.delete(id);
  await enqueueSyncItem('homeExpenses', id, 'delete');

  try {
    const all = await db.homeExpenses.toArray();
    refreshCollectionSnapshot('homeExpenses', all);
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  scheduleAutoSync();
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
    await syncCollectionToDb('khets', db.khets, khets);
    await syncCollectionToDb('crops', db.crops, crops);
    localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(khets));
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(crops));
  } catch (err) {
    console.error('Error persisting khets to DB:', err);
  }
}

// ----------------- STOCKS -----------------

export async function fetchStocks(): Promise<StockItem[]> {
  try {
    const list = await db.stocks.toArray();
    if (list.length > 0) return list;
    const raw = localStorage.getItem(STOCKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    const raw = localStorage.getItem(STOCKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function persistStocksToDB(stocks: StockItem[]): Promise<void> {
  try {
    await syncCollectionToDb('stocks', db.stocks, stocks);
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks));
  } catch (err) {
    console.error('Error persisting stocks to DB:', err);
  }
}
