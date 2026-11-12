import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, firestore } from '../lib/firebase';
import { db, SyncQueueItem } from '../db/khatadb';
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
import { RENT_STORAGE_KEY, HOME_STORAGE_KEY, STOCKS_STORAGE_KEY } from './migrationService';
import { TASKS_STORAGE_KEY } from '../lib/profileAndSecurity';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

class SyncEngine {
  private isSyncing = false;
  private listeners: ((state: SyncState, pendingCount: number) => void)[] = [];
  private currentState: SyncState = 'idle';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncNow();
      });
    }
  }

  public subscribe(fn: (state: SyncState, pendingCount: number) => void) {
    this.listeners.push(fn);
    fn(this.currentState, 0);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(state: SyncState, pendingCount: number) {
    this.currentState = state;
    for (const l of this.listeners) {
      l(state, pendingCount);
    }
  }

  /**
   * Main synchronization function (Push outbox + Pull updates)
   */
  public async syncNow(): Promise<{ success: boolean; pushed: number; pulled: number; error?: string }> {
    if (this.isSyncing) return { success: false, pushed: 0, pulled: 0, error: 'Already syncing' };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notify('offline', await db.syncQueue.count());
      return { success: false, pushed: 0, pulled: 0, error: 'Offline' };
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      this.notify('idle', await db.syncQueue.count());
      return { success: false, pushed: 0, pulled: 0, error: 'User not signed in' };
    }

    this.isSyncing = true;
    const initialPending = await db.syncQueue.count();
    this.notify('syncing', initialPending);

    let pushedCount = 0;
    let pulledCount = 0;

    try {
      const uid = currentUser.uid;

      // 1. PUSH: Process local syncQueue to Firestore
      const queueItems = await db.syncQueue.limit(50).toArray();

      for (const item of queueItems) {
        try {
          const targetDoc = doc(firestore, 'users', uid, item.tableName, item.recordId);

          if (item.action === 'delete') {
            // Tombstone / Soft Delete pattern to prevent reviving on other devices
            await setDoc(
              targetDoc,
              {
                id: item.recordId,
                isDeleted: true,
                updatedAt: Date.now(),
                serverUpdatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } else if (item.payload) {
            const cleanPayload = {
              ...item.payload,
              isDeleted: false,
              updatedAt: item.payload.updatedAt || Date.now(),
              serverUpdatedAt: serverTimestamp(),
            };
            await setDoc(targetDoc, cleanPayload, { merge: true });
          }

          if (item.id !== undefined) {
            await db.syncQueue.delete(item.id);
          }
          pushedCount++;
        } catch (itemErr: any) {
          console.warn(`[SyncEngine] Error pushing item ${item.recordId}:`, itemErr);
          if (item.id !== undefined) {
            await db.syncQueue.update(item.id, {
              retryCount: (item.retryCount || 0) + 1,
              lastError: String(itemErr?.message || itemErr),
            });
          }
        }
      }

      // 2. PULL: Download latest records from Cloud Firestore into IndexedDB
      pulledCount = await this.pullFromCloud(uid);

      const remainingPending = await db.syncQueue.count();
      this.notify(remainingPending > 0 ? 'idle' : 'synced', remainingPending);
      return { success: true, pushed: pushedCount, pulled: pulledCount };
    } catch (err: any) {
      console.error('[SyncEngine] Sync failed:', err);
      const remainingPending = await db.syncQueue.count();
      this.notify('error', remainingPending);
      return { success: false, pushed: pushedCount, pulled: pulledCount, error: String(err?.message || err) };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls all collections from Firestore under users/{uid} and merges via Last-Write-Wins
   */
  private async pullFromCloud(uid: string): Promise<number> {
    let pulledCount = 0;

    // Helper for syncing a subcollection
    const syncCollection = async <T extends { id: string; updatedAt?: number; isDeleted?: boolean }>(
      collectionName: string,
      dexieTable: any,
      localStorageKey: string
    ) => {
      try {
        const snap = await getDocs(collection(firestore, 'users', uid, collectionName));
        if (snap.empty) return;

        const remoteDocs: T[] = [];
        snap.forEach((d) => {
          remoteDocs.push(d.data() as T);
        });

        for (const remote of remoteDocs) {
          const local = await dexieTable.get(remote.id);
          const remoteTime = remote.updatedAt || 0;
          const localTime = local?.updatedAt || 0;

          // Conflict resolution: Last-Write-Wins
          if (!local || remoteTime >= localTime) {
            if (remote.isDeleted) {
              await dexieTable.delete(remote.id);
            } else {
              await dexieTable.put(remote);
            }
            pulledCount++;
          }
        }

        // Mirror latest state to LocalStorage
        const allLocal = await dexieTable.toArray();
        localStorage.setItem(localStorageKey, JSON.stringify(allLocal));
      } catch (colErr) {
        console.warn(`[SyncEngine] Pull failed for ${collectionName}:`, colErr);
      }
    };

    await syncCollection<FarmRecord>('records', db.records, RECORDS_STORAGE_KEY);
    await syncCollection<Khet>('khets', db.khets, KHETS_STORAGE_KEY);
    await syncCollection<KhetCrop>('crops', db.crops, CROPS_STORAGE_KEY);
    await syncCollection<Partner>('partners', db.partners, PARTNERS_STORAGE_KEY);
    await syncCollection<PartnerCashEntry>('partnerCash', db.partnerCash, PARTNER_CASH_STORAGE_KEY);
    await syncCollection<RentRecord>('rentRecords', db.rentRecords, RENT_STORAGE_KEY);
    await syncCollection<HomeExpense>('homeExpenses', db.homeExpenses, HOME_STORAGE_KEY);
    await syncCollection<StockItem>('stocks', db.stocks, STOCKS_STORAGE_KEY);
    await syncCollection<FarmTask>('tasks', db.tasks, TASKS_STORAGE_KEY);

    return pulledCount;
  }
}

export const syncEngine = new SyncEngine();
