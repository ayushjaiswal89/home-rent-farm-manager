import { FarmRecord, Khet, KhetCrop, Partner, PartnerCashEntry } from './types';
import { persistKhetsToDB } from '../services/khatadbService';

export const KHETS_STORAGE_KEY = 'kisan-sathi-khets';
export const CROPS_STORAGE_KEY = 'kisan-sathi-khet-crops';
export const RECORDS_STORAGE_KEY = 'kisan-sathi-records';
export const PARTNERS_STORAGE_KEY = 'sk-partners';
export const PARTNER_CASH_STORAGE_KEY = 'sk-partner-cash';

export const DEFAULT_KHETS: Khet[] = [];

export const DEFAULT_RECORDS: FarmRecord[] = [];


export function loadAndMigrateKhets(): {
  khets: Khet[];
  khetCrops: KhetCrop[];
} {
  // Server या browser उपलब्ध न होने पर खाली डेटा
  if (typeof window === 'undefined') {
    return { khets: [], khetCrops: [] };
  }

  try {
    const rawKhets = localStorage.getItem(KHETS_STORAGE_KEY);

    // पहली बार ऐप खोलने पर डेमो खेत न जोड़ें
    if (rawKhets === null) {
      return { khets: [], khetCrops: [] };
    }

    const parsedKhets: unknown = JSON.parse(rawKhets);

    if (!Array.isArray(parsedKhets)) {
      return { khets: [], khetCrops: [] };
    }

    // सभी खेत डिलीट हो चुके हैं तो फसलें भी खाली रखें
    if (parsedKhets.length === 0) {
      return { khets: [], khetCrops: [] };
    }

    const rawCrops = localStorage.getItem(CROPS_STORAGE_KEY);

    let parsedCrops: KhetCrop[] = [];

    if (rawCrops !== null) {
      const value: unknown = JSON.parse(rawCrops);
      if (Array.isArray(value)) {
        parsedCrops = value as KhetCrop[];
      }
    } else {
      // पुराने डेटा में फसलें खेत के अंदर सेव हो सकती हैं
      parsedCrops = (parsedKhets as Khet[]).flatMap(
        (khet) => khet.crops || []
      );
    }

    const sanitizedKhets: Khet[] = (parsedKhets as any[]).map((k) => {
      const area = Number(k.totalArea || k.area || 0);
      return {
        ...k,
        id: k.id || `khet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: (k.name || 'खेत').trim(),
        crop: k.crop || 'Wheat',
        totalArea: area,
        area: area,
        areaUnit: k.areaUnit || 'बीघा',
        sowingDate: k.sowingDate || '',
      };
    });

    return {
      khets: sanitizedKhets,
      khetCrops: parsedCrops,
    };
  } catch (error) {
    console.error('Error loading khets from storage:', error);
    return { khets: [], khetCrops: [] };
  }
}

export function loadAndMigrateRecords(
  _khets: Khet[],
  _khetCrops: KhetCrop[]
): FarmRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);

    // रिकॉर्ड पहले कभी सेव नहीं हुए, तो खाली सूची दें
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    // [] भी एक वैध और सेव की गई सूची है
    if (Array.isArray(parsed)) {
      return parsed as FarmRecord[];
    }

    return [];
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
}

export function persistKhetsAndCrops(khets: Khet[], khetCrops: KhetCrop[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(khets));
    localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(khetCrops));

    // Asynchronously update IndexedDB
    persistKhetsToDB(khets, khetCrops).catch((err) => {
      console.warn('IndexedDB khets update notice:', err);
    });
  } catch (err) {
    console.error('Error persisting khets:', err);
  }
}

function getParsedStorage(key: string, fallback: any = null) {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function downloadPhysicalBackup(): void {
  if (typeof window === 'undefined') return;
  try {
    const backupData = {
      app: 'Smart Khata - Digital Farm, Batai, Rent & Home Ledger',
      version: '2.5',
      timestamp: new Date().toISOString(),
      khets: getParsedStorage(KHETS_STORAGE_KEY, []),
      crops: getParsedStorage(CROPS_STORAGE_KEY, []),
      records: getParsedStorage(RECORDS_STORAGE_KEY, []),
      partners: getParsedStorage(PARTNERS_STORAGE_KEY, []),
      partnerCash: getParsedStorage(PARTNER_CASH_STORAGE_KEY, []),
      rentRecords: getParsedStorage('sk-rent-records', []),
      homeExpenses: getParsedStorage('sk-home-expenses', []),
      stocks: getParsedStorage('kisan-sathi-stocks', []),
      landSettings: getParsedStorage('sk-land-settings', null),
      farmerProfile: getParsedStorage('sk-farmer-profile', null),
      appName: localStorage.getItem('sk-app-name') || 'स्मार्ट खाता',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-khata-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating backup:', err);
  }
}
