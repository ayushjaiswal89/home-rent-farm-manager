import { db } from '../db/khatadb';
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from '../lib/firebase';
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
  Lang,
} from '../lib/types';
import { cropLabel } from '../lib/farmI18n';
import { getRecordAmount, getSalePaidAmount, getSaleRemainingAmount } from '../lib/farmAccounting';
import { getRentPaidAmount, getRentRemainingAmount, getRentTotal } from '../lib/rentAccounting';
import {
  RECORDS_STORAGE_KEY,
  KHETS_STORAGE_KEY,
  CROPS_STORAGE_KEY,
  PARTNERS_STORAGE_KEY,
  PARTNER_CASH_STORAGE_KEY,
} from '../lib/storageMigration';
import { RENT_STORAGE_KEY, HOME_STORAGE_KEY, STOCKS_STORAGE_KEY } from './migrationService';
import { TASKS_STORAGE_KEY } from '../lib/profileAndSecurity';
import { registerSheetsAutoSyncCallback } from './khatadbService';

// Workspace Google Sheets OAuth Scopes (Least Privilege)
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEETS_META_STORAGE_KEY = 'sk-google-sheet-meta';

export type SheetsSyncStatus = 'idle' | 'connecting' | 'syncing' | 'synced' | 'needs_reconnect' | 'error';

export interface GoogleSheetMeta {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  connectedEmail?: string;
  autoSyncEnabled: boolean;
  lastSyncedAt?: number;
  lastError?: string;
}

export interface SheetsDataSummary {
  farmRecordsCount: number;
  khetsCount: number;
  cropsCount: number;
  partnersCount: number;
  partnerCashCount: number;
  rentRecordsCount: number;
  homeExpensesCount: number;
  stocksCount: number;
  tasksCount: number;
  totalRows: number;
}

// STRICT SECURITY: OAuth access token is ONLY cached in memory (never localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let currentStatus: SheetsSyncStatus = 'idle';
let isSyncingSheets = false;
let sheetsListeners: ((status: SheetsSyncStatus, meta: GoogleSheetMeta | null, hasToken: boolean) => void)[] = [];

const SHEETS_PROVIDER = new GoogleAuthProvider();
SCOPES.forEach((s) => SHEETS_PROVIDER.addScope(s));

// Clear in-memory token automatically on Firebase sign-out
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
      notifyListeners('idle');
    }
  });
}

function readStoredMeta(): GoogleSheetMeta | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SHEETS_META_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.spreadsheetId === 'string' && parsed.spreadsheetId) {
      return parsed as GoogleSheetMeta;
    }
  } catch {}
  return null;
}

function writeStoredMeta(meta: GoogleSheetMeta | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!meta) {
      localStorage.removeItem(SHEETS_META_STORAGE_KEY);
    } else {
      localStorage.setItem(SHEETS_META_STORAGE_KEY, JSON.stringify(meta));
    }
  } catch {}
}

function notifyListeners(status: SheetsSyncStatus): void {
  currentStatus = status;
  const meta = readStoredMeta();
  const hasToken = Boolean(cachedAccessToken);
  for (const fn of sheetsListeners) {
    fn(status, meta, hasToken);
  }
}

export function subscribeGoogleSheets(
  fn: (status: SheetsSyncStatus, meta: GoogleSheetMeta | null, hasToken: boolean) => void
): () => void {
  sheetsListeners.push(fn);
  fn(currentStatus, readStoredMeta(), Boolean(cachedAccessToken));
  return () => {
    sheetsListeners = sheetsListeners.filter((l) => l !== fn);
  };
}

export function getGoogleSheetMeta(): GoogleSheetMeta | null {
  return readStoredMeta();
}

export function hasActiveGoogleSheetsToken(): boolean {
  return Boolean(cachedAccessToken);
}

export function setGoogleSheetsAutoSync(enabled: boolean): void {
  const meta = readStoredMeta();
  if (!meta) return;
  writeStoredMeta({ ...meta, autoSyncEnabled: enabled });
  notifyListeners(currentStatus);
}

export function disconnectGoogleSheet(): void {
  cachedAccessToken = null;
  writeStoredMeta(null);
  notifyListeners('idle');
}

/**
 * Interactive Google OAuth sign-in / token refresh triggered explicitly by user click.
 */
export async function connectGoogleSheetsAccount(options: { forceConsent?: boolean } = {}): Promise<{
  email: string;
  accessToken: string;
}> {
  notifyListeners('connecting');
  try {
    if (!auth) {
      throw new Error('Firebase is not configured. Populate firebase-applet-config.json first.');
    }

    const firebaseOptions = auth.app.options;
    if (!firebaseOptions.apiKey || !firebaseOptions.authDomain || !firebaseOptions.projectId) {
      throw new Error('Firebase is not configured. Populate firebase-applet-config.json first.');
    }

    if (options.forceConsent) {
      SHEETS_PROVIDER.setCustomParameters({ prompt: 'consent select_account' });
    } else {
      SHEETS_PROVIDER.setCustomParameters({ prompt: 'select_account' });
    }
    const result = await signInWithPopup(auth, SHEETS_PROVIDER);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Sheets access token.');
    }
    cachedAccessToken = credential.accessToken;
    const email = result.user.email || '';

    const existing = readStoredMeta();
    if (existing) {
      writeStoredMeta({
        ...existing,
        connectedEmail: email || existing.connectedEmail,
        lastError: undefined,
      });
    }

    notifyListeners(existing ? 'idle' : 'idle');
    return { email, accessToken: cachedAccessToken };
  } catch (err: any) {
    const msg = String(err?.message || err);
    const existing = readStoredMeta();
    if (existing) {
      writeStoredMeta({ ...existing, lastError: msg });
    }
    notifyListeners('error');
    throw err;
  }
}

async function readArrayFromDbOrStorage<T>(dexieTable: any, storageKey: string): Promise<T[]> {
  try {
    const rows = await dexieTable.toArray();
    if (Array.isArray(rows) && rows.length > 0) return rows as T[];
  } catch {}
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as T[];
      }
    } catch {}
  }
  return [];
}

async function gatherAllLedgerData() {
  const [
    records,
    khets,
    crops,
    partners,
    partnerCash,
    rentRecords,
    homeExpenses,
    stocks,
    tasks,
  ] = await Promise.all([
    readArrayFromDbOrStorage<FarmRecord>(db.records, RECORDS_STORAGE_KEY),
    readArrayFromDbOrStorage<Khet>(db.khets, KHETS_STORAGE_KEY),
    readArrayFromDbOrStorage<KhetCrop>(db.crops, CROPS_STORAGE_KEY),
    readArrayFromDbOrStorage<Partner>(db.partners, PARTNERS_STORAGE_KEY),
    readArrayFromDbOrStorage<PartnerCashEntry>(db.partnerCash, PARTNER_CASH_STORAGE_KEY),
    readArrayFromDbOrStorage<RentRecord>(db.rentRecords, RENT_STORAGE_KEY),
    readArrayFromDbOrStorage<HomeExpense>(db.homeExpenses, HOME_STORAGE_KEY),
    readArrayFromDbOrStorage<StockItem>(db.stocks, STOCKS_STORAGE_KEY),
    readArrayFromDbOrStorage<FarmTask>(db.tasks, TASKS_STORAGE_KEY),
  ]);

  return { records, khets, crops, partners, partnerCash, rentRecords, homeExpenses, stocks, tasks };
}

export async function getSheetsDataSummary(): Promise<SheetsDataSummary> {
  const d = await gatherAllLedgerData();
  const totalRows =
    d.records.length +
    d.khets.length +
    d.crops.length +
    d.partners.length +
    d.partnerCash.length +
    d.rentRecords.length +
    d.homeExpenses.length +
    d.stocks.length +
    d.tasks.length;
  return {
    farmRecordsCount: d.records.length,
    khetsCount: d.khets.length,
    cropsCount: d.crops.length,
    partnersCount: d.partners.length,
    partnerCashCount: d.partnerCash.length,
    rentRecordsCount: d.rentRecords.length,
    homeExpensesCount: d.homeExpenses.length,
    stocksCount: d.stocks.length,
    tasksCount: d.tasks.length,
    totalRows,
  };
}

interface TabPayload {
  title: string;
  rows: (string | number)[][];
}

function buildTabsPayload(
  data: Awaited<ReturnType<typeof gatherAllLedgerData>>,
  lang: Lang
): TabPayload[] {
  const isHi = lang === 'hi';

  // Calculate summary totals
  let totalSales = 0;
  let totalExpenses = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalYieldQtl = 0;

  data.records.forEach((r) => {
    const amt = getRecordAmount(r);
    const qty = Number(r.quantity || 0);
    if (r.type === 'Sale') {
      totalSales += amt;
      const paid = getSalePaidAmount(r, amt);
      totalReceived += paid;
      totalPending += getSaleRemainingAmount(r, amt);
    } else if (r.type === 'Expense') {
      totalExpenses += amt;
    } else if (r.type === 'Yield') {
      let q = qty;
      if (r.unit === 'Kg' || r.unit === 'किलो') q = qty / 100;
      else if (r.unit === 'Ton' || r.unit === 'टन') q = qty * 10;
      else if (r.unit?.includes('बोरी') || r.unit?.includes('Bags')) q = qty * 0.5;
      totalYieldQtl += q;
    }
  });

  let rentReceived = 0;
  let rentPending = 0;
  data.rentRecords.forEach((rr) => {
    const total = getRentTotal(rr);
    rentReceived += getRentPaidAmount(rr, total);
    rentPending += getRentRemainingAmount(rr, total);
  });

  const totalHomeExpenses = data.homeExpenses.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  const netFarmProfit = totalSales - totalExpenses;
  const overallSavings = totalSales + rentReceived - (totalExpenses + totalHomeExpenses);

  const summaryTab: TabPayload = {
    title: 'Summary',
    rows: [
      isHi ? ['वित्तीय मद', 'राशि / मान', 'विवरण'] : ['Financial Metric', 'Amount / Value', 'Notes'],
      [isHi ? 'अंतिम अपडेट' : 'Last Synced', new Date().toLocaleString(isHi ? 'hi-IN' : 'en-IN'), 'Smart Khata Pro'],
      [isHi ? 'कुल फसल बिक्री (₹)' : 'Total Farm Sales (₹)', totalSales, `${data.records.filter((r) => r.type === 'Sale').length} entries`],
      [isHi ? 'कुल कृषि लागत (₹)' : 'Total Farm Expenses (₹)', totalExpenses, `${data.records.filter((r) => r.type === 'Expense').length} entries`],
      [isHi ? 'शुद्ध कृषि मुनाफा (₹)' : 'Net Farm Profit (₹)', netFarmProfit, 'Sales - Expenses'],
      [isHi ? 'नकद प्राप्त बिक्री (₹)' : 'Cash Sales Received (₹)', totalReceived, 'Collected'],
      [isHi ? 'बकाया फसल बिक्री (₹)' : 'Sales Receivable (₹)', totalPending, 'Pending'],
      [isHi ? 'कुल पैदावार (क्विंटल)' : 'Total Harvest (Quintal)', Math.round(totalYieldQtl * 100) / 100, 'Normalized to Quintal'],
      [isHi ? 'प्राप्त किराया (₹)' : 'Rent Received (₹)', rentReceived, `${data.rentRecords.length} bills`],
      [isHi ? 'बकाया किराया (₹)' : 'Rent Pending (₹)', rentPending, 'Due from tenants'],
      [isHi ? 'कुल घरेलू खर्च (₹)' : 'Home Expenses (₹)', totalHomeExpenses, `${data.homeExpenses.length} entries`],
      [isHi ? 'कुल शुद्ध बचत (₹)' : 'Overall Net Savings (₹)', overallSavings, 'Total Income - Expenses'],
    ],
  };

  const farmTab: TabPayload = {
    title: 'Farm_Ledger',
    rows: [
      isHi
        ? ['ID', 'दिनांक', 'खेत', 'फसल', 'प्रकार', 'मद / श्रेणी', 'मात्रा', 'इकाई', 'दर (₹)', 'कुल रकम (₹)', 'प्राप्त (₹)', 'बकाया (₹)', 'खरीदार / श्रमिक', 'टिप्पणी']
        : ['ID', 'Date', 'Field', 'Crop', 'Type', 'Category', 'Quantity', 'Unit', 'Rate (₹)', 'Amount (₹)', 'Paid (₹)', 'Remaining (₹)', 'Buyer / Worker', 'Note'],
      ...data.records.map((r) => {
        const amt = getRecordAmount(r);
        const paid = r.type === 'Sale' ? getSalePaidAmount(r, amt) : '';
        const rem = r.type === 'Sale' ? getSaleRemainingAmount(r, amt) : '';
        return [
          r.id,
          r.date || '',
          r.field || '',
          cropLabel(lang, r.crop),
          r.type,
          r.expenseCategory || '',
          r.quantity ?? '',
          r.unit || '',
          r.price ?? '',
          amt,
          paid,
          rem,
          r.buyerName || r.worker || '',
          r.note || '',
        ];
      }),
    ],
  };

  const khetCropTab: TabPayload = {
    title: 'Fields_Crops',
    rows: [
      isHi
        ? ['प्रकार', 'ID', 'खेत का नाम', 'फसल', 'सीजन', 'रकबा', 'इकाई', 'बुवाई तारीख', 'कटाई तारीख', 'स्थिति / सिंचाई']
        : ['Kind', 'ID', 'Field Name', 'Crop', 'Season', 'Area', 'Unit', 'Sowing Date', 'Harvest Date', 'Status / Irrigation'],
      ...data.khets.map((k) => [
        isHi ? 'खेत' : 'Field',
        k.id,
        k.name,
        cropLabel(lang, k.crop),
        k.season || '',
        k.totalArea || k.area || 0,
        k.areaUnit || '',
        k.sowingDate || '',
        '',
        k.irrigationSource || k.soilType || '',
      ]),
      ...data.crops.map((c) => {
        const khetName = data.khets.find((k) => k.id === c.khetId)?.name || c.khetId;
        return [
          isHi ? 'फसल' : 'Crop',
          c.id,
          khetName,
          c.cropNameHi || cropLabel(lang, c.cropName),
          c.season || '',
          c.allocatedArea || 0,
          c.areaUnit || '',
          c.sowingDate || '',
          c.harvestDate || '',
          c.status || '',
        ];
      }),
    ],
  };

  const bataiTab: TabPayload = {
    title: 'Batai_Ledger',
    rows: [
      isHi
        ? ['प्रकार', 'ID', 'बटाईदार नाम', 'फोन', 'खेत / फसल', 'साझा % / प्रकार', 'तारीख', 'राशि (₹)', 'टिप्पणी']
        : ['Entry Type', 'ID', 'Partner Name', 'Phone', 'Field / Crop', 'Share % / Mode', 'Date', 'Amount (₹)', 'Note'],
      ...data.partners.map((p) => [
        isHi ? 'बटाईदार' : 'Partner',
        p.id,
        p.name,
        p.phone || '',
        `${p.khetName || ''} ${p.crop ? `(${cropLabel(lang, p.crop)})` : ''}`.trim(),
        `${p.sharePercent}%`,
        p.startDate || '',
        '',
        p.notes || '',
      ]),
      ...data.partnerCash.map((pc) => {
        const pName = data.partners.find((p) => p.id === pc.partnerId)?.name || pc.partnerId;
        return [
          pc.type === 'gave_to_partner' ? (isHi ? 'दिया' : 'Paid Out') : (isHi ? 'मिला' : 'Received'),
          pc.id,
          pName,
          '',
          pc.purpose || '',
          pc.mode || 'cash',
          pc.date || '',
          Number(pc.amount) || 0,
          pc.note || '',
        ];
      }),
    ],
  };

  const rentTab: TabPayload = {
    title: 'Rent_Ledger',
    rows: [
      isHi
        ? ['ID', 'दिनांक', 'किरायेदार', 'महीना', 'WhatsApp', 'किराया (₹)', 'पुरानी रीडिंग', 'नई रीडिंग', 'यूनिट', 'बिजली बिल (₹)', 'कुल बिल (₹)', 'प्राप्त (₹)', 'बाकी (₹)', 'स्थिति', 'टिप्पणी']
        : ['ID', 'Date', 'Tenant', 'Month', 'WhatsApp', 'Rent (₹)', 'Prev Meter', 'Curr Meter', 'Units', 'Light Bill (₹)', 'Total (₹)', 'Paid (₹)', 'Due (₹)', 'Status', 'Note'],
      ...data.rentRecords.map((r) => [
        r.id,
        r.date || '',
        r.tenant,
        r.month,
        r.whatsapp || '',
        r.amount || 0,
        r.prevReading || 0,
        r.currentReading || 0,
        r.units || 0,
        r.lightBill || 0,
        r.total || 0,
        getRentPaidAmount(r),
        getRentRemainingAmount(r),
        r.status,
        r.note || '',
      ]),
    ],
  };

  const homeTab: TabPayload = {
    title: 'Home_Expenses',
    rows: [
      isHi ? ['ID', 'दिनांक', 'श्रेणी', 'राशि (₹)', 'विवरण'] : ['ID', 'Date', 'Category', 'Amount (₹)', 'Note'],
      ...data.homeExpenses.map((h) => [
        h.id,
        h.date || '',
        h.category || '',
        Number(h.amount) || 0,
        h.note || '',
      ]),
    ],
  };

  const stockTasksTab: TabPayload = {
    title: 'Stock_And_Tasks',
    rows: [
      isHi
        ? ['प्रकार', 'ID', 'नाम / फसल', 'मात्रा / श्रेणी', 'इकाई / तारीख', 'स्थान / खेत', 'अपेक्षित भाव / स्थिति', 'टिप्पणी']
        : ['Kind', 'ID', 'Crop / Task', 'Qty / Category', 'Unit / Due Date', 'Storage / Field', 'Exp Rate / Status', 'Note'],
      ...data.stocks.map((s) => [
        isHi ? 'गोदाम स्टॉक' : 'Stock',
        s.id,
        cropLabel(lang, s.crop),
        s.quantity || 0,
        s.unit || '',
        s.storageLocation || s.khetName || '',
        s.expectedPrice ?? '',
        s.notes || '',
      ]),
      ...data.tasks.map((t) => [
        isHi ? 'कृषि कार्य' : 'Task',
        t.id,
        t.title,
        t.category,
        t.dueDate,
        t.khetName || '',
        t.status,
        t.notes || '',
      ]),
    ],
  };

  return [summaryTab, farmTab, khetCropTab, bataiTab, rentTab, homeTab, stockTasksTab];
}

async function sheetsFetch(url: string, init: RequestInit = {}): Promise<any> {
  if (!cachedAccessToken) {
    throw new Error('Google Sheets session expired or not connected.');
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    notifyListeners('needs_reconnect');
    const bodyText = await res.text();
    throw new Error(`Google authorization expired (${res.status}). ${bodyText}`);
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${errBody}`);
  }

  return res.json();
}

async function createSpreadsheetWithTabs(title: string, tabTitles: string[]): Promise<GoogleSheetMeta> {
  const payload = {
    properties: { title },
    sheets: tabTitles.map((t, index) => ({
      properties: {
        title: t,
        index,
        gridProperties: { frozenRowCount: 1 },
      },
    })),
  };

  const created = await sheetsFetch(SHEETS_API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // Format header rows on each newly created tab
  const requests = (created.sheets || []).map((s: any) => ({
    repeatCell: {
      range: {
        sheetId: s.properties.sheetId,
        startRowIndex: 0,
        endRowIndex: 1,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.024, green: 0.373, blue: 0.275 },
          textFormat: {
            foregroundColor: { red: 1, green: 1, blue: 1 },
            bold: true,
          },
        },
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)',
    },
  }));

  if (requests.length > 0) {
    await sheetsFetch(`${SHEETS_API_BASE}/${created.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    }).catch(() => {});
  }

  const meta: GoogleSheetMeta = {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    spreadsheetTitle: created.properties?.title || title,
    connectedEmail: auth?.currentUser?.email || readStoredMeta()?.connectedEmail,
    autoSyncEnabled: true,
  };
  writeStoredMeta(meta);
  return meta;
}

/**
 * Fetches spreadsheet metadata dynamically and adds any missing tabs (never assumes tab names blindly).
 */
async function ensureTabsExist(spreadsheetId: string, requiredTabs: string[]): Promise<void> {
  const info = await sheetsFetch(
    `${SHEETS_API_BASE}/${spreadsheetId}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties`
  );
  const existingTitles = new Set<string>(
    (info.sheets || []).map((s: any) => String(s?.properties?.title || ''))
  );

  const missingTabs = requiredTabs.filter((t) => !existingTitles.has(t));
  if (missingTabs.length === 0) return;

  const batchRes = await sheetsFetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: missingTabs.map((t) => ({
        addSheet: {
          properties: {
            title: t,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      })),
    }),
  });

  const styleRequests = (batchRes.replies || [])
    .map((r: any) => r?.addSheet?.properties?.sheetId)
    .filter((id: any) => typeof id === 'number')
    .map((sheetId: number) => ({
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.024, green: 0.373, blue: 0.275 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    }));

  if (styleRequests.length > 0) {
    await sheetsFetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests: styleRequests }),
    }).catch(() => {});
  }
}

/**
 * Syncs all Smart Khata data to the user's connected Google Sheet (or creates a new one).
 */
export async function syncAllDataToGoogleSheet(options: {
  lang?: Lang;
  createNewSheet?: boolean;
  appName?: string;
} = {}): Promise<{ success: boolean; meta?: GoogleSheetMeta; error?: string }> {
  if (isSyncingSheets) {
    return { success: false, error: 'Sync already in progress' };
  }
  if (!cachedAccessToken) {
    notifyListeners('needs_reconnect');
    return { success: false, error: 'Google session expired. Please reconnect.' };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Device is offline' };
  }

  isSyncingSheets = true;
  notifyListeners('syncing');

  try {
    const lang: Lang = options.lang || 'hi';
    const ledgerData = await gatherAllLedgerData();
    const tabs = buildTabsPayload(ledgerData, lang);
    const tabTitles = tabs.map((t) => t.title);

    let meta = options.createNewSheet ? null : readStoredMeta();

    if (!meta) {
      const sheetName = `${options.appName || 'Smart Khata'} - ${lang === 'hi' ? 'मेरा पूरा हिसाब' : 'Complete Ledger'}`;
      meta = await createSpreadsheetWithTabs(sheetName, tabTitles);
    } else {
      try {
        await ensureTabsExist(meta.spreadsheetId, tabTitles);
      } catch (err: any) {
        // If user deleted the old sheet in Drive (404), recreate a fresh sheet cleanly
        if (String(err?.message || '').includes('(404)')) {
          const sheetName = `${options.appName || 'Smart Khata'} - ${lang === 'hi' ? 'मेरा पूरा हिसाब' : 'Complete Ledger'}`;
          meta = await createSpreadsheetWithTabs(sheetName, tabTitles);
        } else {
          throw err;
        }
      }
    }

    // Clear existing ranges first so deleted local records do not linger as stale rows
    await sheetsFetch(`${SHEETS_API_BASE}/${meta.spreadsheetId}/values:batchClear`, {
      method: 'POST',
      body: JSON.stringify({
        ranges: tabs.map((t) => `'${t.title}'!A1:Z5000`),
      }),
    });

    // Write fresh headers + rows across all tabs in one batch request
    await sheetsFetch(`${SHEETS_API_BASE}/${meta.spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: tabs.map((t) => ({
          range: `'${t.title}'!A1`,
          majorDimension: 'ROWS',
          values: t.rows,
        })),
      }),
    });

    const updatedMeta: GoogleSheetMeta = {
      ...meta,
      lastSyncedAt: Date.now(),
      lastError: undefined,
    };
    writeStoredMeta(updatedMeta);
    notifyListeners('synced');
    return { success: true, meta: updatedMeta };
  } catch (err: any) {
    const msg = String(err?.message || err);
    const existing = readStoredMeta();
    if (existing) {
      writeStoredMeta({ ...existing, lastError: msg });
    }
    notifyListeners(cachedAccessToken ? 'error' : 'needs_reconnect');
    return { success: false, error: msg };
  } finally {
    isSyncingSheets = false;
  }
}

// Register background auto-sync callback with khatadbService
let sheetAutoSyncTimer: ReturnType<typeof setTimeout> | null = null;

registerSheetsAutoSyncCallback(() => {
  const meta = readStoredMeta();
  if (!meta || !meta.autoSyncEnabled) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  if (!cachedAccessToken) {
    notifyListeners('needs_reconnect');
    return;
  }

  if (sheetAutoSyncTimer) clearTimeout(sheetAutoSyncTimer);
  sheetAutoSyncTimer = setTimeout(() => {
    sheetAutoSyncTimer = null;
    syncAllDataToGoogleSheet().catch(console.warn);
  }, 1500);
});
