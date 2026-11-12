/**
 * 6-Month Crop Cycle & 2-Season-Per-Year Engine for Smart Khaata Pro
 * 
 * In Indian farming, an agricultural year consists of 2 primary 6-month crop cycles:
 * 1. खरीफ (Kharif Season) - 6 महीने (जून से नवंबर / June to November)
 *    - मुख्य फसलें: सोयाबीन, धान (चावल), मक्का, मूंगफली, कपास, बाजरा, उड़द, मूंग
 * 2. रबी (Rabi Season) - 6 महीने (दिसंबर से मई / December to May)
 *    - मुख्य फसलें: गेहूं, चना, सरसों, मटर, आलू, मसूर, लहसुन, प्याज, धनिया
 */

import { FarmRecord, Lang } from './types';
import { getRecordAmount } from './farmAccounting';
import { cropLabel, normalizeCropKey } from './farmI18n';

export type SeasonType = 'Kharif' | 'Rabi';

export interface CropSeasonInfo {
  id: string; // e.g. "kharif-2026" or "rabi-2026-27"
  type: SeasonType;
  yearLabel: string; // "2026" or "2026-27"
  labelHi: string; // "खरीफ 2026 (जून - नवंबर)"
  labelEn: string; // "Kharif 2026 (Jun - Nov)"
  shortHi: string; // "खरीफ 2026"
  shortEn: string; // "Kharif 2026"
  monthsHi: string; // "जून - नवंबर" or "दिसंबर - मई"
  monthsEn: string; // "Jun - Nov" or "Dec - May"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent: boolean;
}

export type CropSeason = CropSeasonInfo;

export const KHARIF_CROPS = [
  'सोयाबीन (Soyabean)',
  'धान / चावल (Paddy/Rice)',
  'मक्का (Maize)',
  'कपास (Cotton)',
  'मूंगफली (Groundnut)',
  'बाजरा (Bajra)',
  'उड़द (Urad)',
  'मूंग (Moong)',
  'अरहर / तुअर (Pigeon Pea)',
  'तिल (Sesame)',
];

export const RABI_CROPS = [
  'गेहूं (Wheat)',
  'चना (Gram/Chickpea)',
  'सरसों (Mustard)',
  'मटर (Pea)',
  'आलू (Potato)',
  'मसूर (Lentil)',
  'लहसुन (Garlic)',
  'प्याज (Onion)',
  'धनिया (Coriander)',
  'जौ (Barley)',
];

/**
 * Returns season details for any given date
 */
export function getCropSeasonForDate(dateStr?: string): CropSeasonInfo {
  const d = dateStr ? new Date(dateStr) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const year = validDate.getFullYear();
  const month = validDate.getMonth() + 1; // 1 to 12

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (month >= 6 && month <= 11) {
    // Kharif: June to November (6 months)
    const isCurrent = currentYear === year && currentMonth >= 6 && currentMonth <= 11;
    return {
      id: `kharif-${year}`,
      type: 'Kharif',
      yearLabel: `${year}`,
      labelHi: `खरीफ ${year} (जून - नवंबर)`,
      labelEn: `Kharif ${year} (Jun - Nov)`,
      shortHi: `खरीफ ${year}`,
      shortEn: `Kharif ${year}`,
      monthsHi: 'जून - नवंबर',
      monthsEn: 'Jun - Nov',
      startDate: `${year}-06-01`,
      endDate: `${year}-11-30`,
      isCurrent,
    };
  } else {
    // Rabi: December to May (6 months)
    const startYear = month === 12 ? year : year - 1;
    const endYear = startYear + 1;
    const endYearShort = String(endYear).slice(-2);
    const isCurrent =
      (currentMonth === 12 && currentYear === startYear) ||
      (currentMonth <= 5 && currentYear === endYear);

    return {
      id: `rabi-${startYear}-${endYear}`,
      type: 'Rabi',
      yearLabel: `${startYear}-${endYearShort}`,
      labelHi: `रबी ${startYear}-${endYearShort} (दिसंबर - मई)`,
      labelEn: `Rabi ${startYear}-${endYearShort} (Dec - May)`,
      shortHi: `रबी ${startYear}-${endYearShort}`,
      shortEn: `Rabi ${startYear}-${endYearShort}`,
      monthsHi: 'दिसंबर - मई',
      monthsEn: 'Dec - May',
      startDate: `${startYear}-12-01`,
      endDate: `${endYear}-05-31`,
      isCurrent,
    };
  }
}

/**
 * Generates an array of recent 6-month seasons for selectors
 */
export function getRecentCropSeasons(limit?: number): CropSeasonInfo[] {
  const today = new Date();
  const seasons: CropSeasonInfo[] = [];

  // Generate for current year +/- 2 years
  const baseYear = today.getFullYear();
  const sampleDates = [
    // Future upcoming
    `${baseYear + 1}-08-01`,
    `${baseYear + 1}-01-15`,
    // Current / near
    `${baseYear}-08-01`,
    `${baseYear}-01-15`,
    // Past seasons
    `${baseYear - 1}-08-01`,
    `${baseYear - 1}-01-15`,
    `${baseYear - 2}-08-01`,
    `${baseYear - 2}-01-15`,
  ];

  const seenIds = new Set<string>();
  for (const dateStr of sampleDates) {
    const s = getCropSeasonForDate(dateStr);
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      seasons.push(s);
    }
  }

  // Sort descending: latest first
  seasons.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return typeof limit === 'number' && limit > 0 ? seasons.slice(0, limit) : seasons;
}

/**
 * Checks whether a date string falls inside a 6-month season
 */
export function isDateInSeason(dateStr: string, season: CropSeasonInfo): boolean {
  if (!dateStr) return false;
  const cleanDate = dateStr.slice(0, 10);
  return cleanDate >= season.startDate && cleanDate <= season.endDate;
}

/**
 * Checks if a farm record belongs to a specific 6-month season
 * Matches by explicit record.season tag OR by date range
 */
export function isRecordInCropSeason(record: FarmRecord, season: CropSeasonInfo): boolean {
  // If record has explicit matching season tag (e.g. "kharif-2026", "रबी 2026", "Rabi 2026")
  if (record.season) {
    const sLower = record.season.toLowerCase().trim();
    if (sLower === season.id.toLowerCase()) return true;
    if (sLower.includes(season.type.toLowerCase()) && sLower.includes(season.startDate.slice(0, 4))) return true;
    if (sLower.includes(season.shortHi.toLowerCase()) || sLower.includes(season.shortEn.toLowerCase())) return true;
  }

  // Otherwise, fallback to date range check (reliable 6-month bounds)
  if (record.date) {
    return isDateInSeason(record.date, season);
  }

  return false;
}

/**
 * Calculates 6-month crop cycle profit & loss ledger
 */
export function calculateCropSeasonAccounting(
  records: FarmRecord[],
  season: CropSeasonInfo,
  lang: Lang = 'hi'
): {
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
  recordsCount: number;
  cropWiseBreakdown: { [crop: string]: { expense: number; income: number; net: number } };
} {
  const seasonRecords = records.filter((r) => isRecordInCropSeason(r, season));

  let totalExpense = 0;
  let totalIncome = 0;
  const cropWiseBreakdown: { [crop: string]: { expense: number; income: number; net: number } } = {};

  for (const r of seasonRecords) {
    const amt = getRecordAmount(r);
    const cropKey = cropLabel(lang, r.crop || 'other') || (lang === 'hi' ? 'अन्य फसल' : 'Other Crop');

    if (!cropWiseBreakdown[cropKey]) {
      cropWiseBreakdown[cropKey] = { expense: 0, income: 0, net: 0 };
    }

    if (r.type === 'Expense') {
      totalExpense += amt;
      cropWiseBreakdown[cropKey].expense += amt;
    } else if (r.type === 'Sale') {
      const actualIncome = r.paidAmount !== undefined ? Number(r.paidAmount) : amt;
      totalIncome += actualIncome;
      cropWiseBreakdown[cropKey].income += actualIncome;
    }

    cropWiseBreakdown[cropKey].net =
      cropWiseBreakdown[cropKey].income - cropWiseBreakdown[cropKey].expense;
  }

  return {
    totalExpense,
    totalIncome,
    netProfit: totalIncome - totalExpense,
    recordsCount: seasonRecords.length,
    cropWiseBreakdown,
  };
}
