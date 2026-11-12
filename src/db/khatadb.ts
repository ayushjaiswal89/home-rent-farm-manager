import Dexie, { type Table } from 'dexie';
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
  FarmerProfile,
} from '../lib/types';

export interface AppSettingEntry {
  key: string;
  value: any;
  updatedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'delete';
  payload?: any;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export class SmartKhataDatabase extends Dexie {
  records!: Table<FarmRecord, string>;
  khets!: Table<Khet, string>;
  crops!: Table<KhetCrop, string>;
  partners!: Table<Partner, string>;
  partnerCash!: Table<PartnerCashEntry, string>;
  rentRecords!: Table<RentRecord, string>;
  homeExpenses!: Table<HomeExpense, string>;
  stocks!: Table<StockItem, string>;
  tasks!: Table<FarmTask, string>;
  appSettings!: Table<AppSettingEntry, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('SmartKhataProDB');

    // Schema definition: Primary keys and indexed search fields
    this.version(1).stores({
      records: 'id, date, type, crop, khetId, cropId, [date+type], updatedAt',
      khets: 'id, name, updatedAt',
      crops: 'id, khetId, cropName, updatedAt',
      partners: 'id, name, relationship, updatedAt',
      partnerCash: 'id, partnerId, date, updatedAt',
      rentRecords: 'id, date, tenant, status, month, updatedAt',
      homeExpenses: 'id, date, category, updatedAt',
      stocks: 'id, crop, updatedAt',
      tasks: 'id, dueDate, status, updatedAt',
      appSettings: 'key, updatedAt',
      syncQueue: '++id, tableName, recordId, action, createdAt',
    });
  }
}

// Single instance export for the application
export const db = new SmartKhataDatabase();
