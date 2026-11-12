import { Lang } from './types';

export interface FarmTranslation {
  title: string;
  subtitle: string;
  addRecord: string;
  addExpense: string;
  addYield: string;
  addSale: string;
  expense: string;
  yield: string;
  sale: string;
  type: string;
  crop: string;
  date: string;
  amount: string;
  quantity: string;
  unit: string;
  rate: string;
  field: string;
  area: string;
  worker: string;
  notes: string;
  totalExpense: string;
  totalSales: string;
  paymentReceived: string;
  pendingPayment: string;
  realizedProfit: string;
  noRecords: string;
}

export const FARM_STRINGS: Record<Lang, FarmTranslation> = {
  hi: {
    title: 'डिजिटल कृषि बहीखाता',
    subtitle: 'खाद-बीज खर्च, पैदावार, बिक्री और बटाईदार का सम्पूर्ण हिसाब',
    addRecord: '+ नया हिसाब दर्ज करें',
    addExpense: '+ नया खर्च',
    addYield: '+ पैदावार',
    addSale: '+ फसल बिक्री',
    expense: 'लागत खर्च',
    yield: 'उपज / पैदावार',
    sale: 'फसल बिक्री',
    type: 'प्रकार',
    crop: 'फसल',
    date: 'दिनांक',
    amount: 'रकम (₹)',
    quantity: 'मात्रा',
    unit: 'इकाई',
    rate: 'भाव (दर)',
    field: 'खेत (चक)',
    area: 'क्षेत्रफल (रकबा)',
    worker: 'श्रमिक / ऑपरेटर',
    notes: 'विवरण / टिप्पणी',
    totalExpense: 'कुल खर्च',
    totalSales: 'कुल बिक्री',
    paymentReceived: 'प्राप्त भुगतान',
    pendingPayment: 'बकाया लेना',
    realizedProfit: 'शुद्ध नकद मुनाफा',
    noRecords: 'कोई रिकॉर्ड दर्ज नहीं है',
  },
  en: {
    title: 'Digital Farm Ledger',
    subtitle: 'Track crop expenses, harvest yields, sales and partner sharecropping',
    addRecord: '+ Add Record',
    addExpense: '+ Add Expense',
    addYield: '+ Add Yield',
    addSale: '+ Add Sale',
    expense: 'Expense',
    yield: 'Yield',
    sale: 'Sale',
    type: 'Type',
    crop: 'Crop',
    date: 'Date',
    amount: 'Amount (₹)',
    quantity: 'Quantity',
    unit: 'Unit',
    rate: 'Rate (₹)',
    field: 'Field / Plot',
    area: 'Area',
    worker: 'Worker / Operator',
    notes: 'Notes / Remarks',
    totalExpense: 'Total Expenses',
    totalSales: 'Total Sales',
    paymentReceived: 'Payment Received',
    pendingPayment: 'Pending Due',
    realizedProfit: 'Realized Profit',
    noRecords: 'No records found',
  },
};

export const CANONICAL_CROPS: Record<
  string,
  { hi: string; en: string; aliases: string[] }
> = {
  wheat: {
    hi: 'गेहूं',
    en: 'Wheat',
    aliases: ['wheat', 'गेहूं', 'गेहूँ', 'gehu', 'gehun', 'gehoon', 'kanak'],
  },
  soybean: {
    hi: 'सोयाबीन',
    en: 'Soybean',
    aliases: ['soybean', 'soyabean', 'soya', 'सोयाबीन', 'सोया'],
  },
  gram: {
    hi: 'चना',
    en: 'Gram',
    aliases: ['gram', 'chana', 'चना', 'chickpea'],
  },
  mustard: {
    hi: 'सरसों',
    en: 'Mustard',
    aliases: ['mustard', 'सरसों', 'sarso', 'sarson', 'rai', 'राई'],
  },
  rice: {
    hi: 'धान / चावल',
    en: 'Rice / Paddy',
    aliases: ['rice', 'paddy', 'धान', 'चावल', 'dhan', 'chawal'],
  },
  cotton: {
    hi: 'कपास',
    en: 'Cotton',
    aliases: ['cotton', 'कपास', 'kapas', 'ruhi', 'रूई'],
  },
  maize: {
    hi: 'मक्का',
    en: 'Maize',
    aliases: ['maize', 'corn', 'मक्का', 'makka', 'bhutta', 'भुट्टा'],
  },
  garlic: {
    hi: 'लहसुन',
    en: 'Garlic',
    aliases: ['garlic', 'लहसुन', 'लहसन', 'lahsun', 'lahsan'],
  },
  groundnut: {
    hi: 'मूंगफली',
    en: 'Groundnut',
    aliases: ['groundnut', 'peanut', 'मूंगफली', 'mungfali', 'moongfali'],
  },
  onion: {
    hi: 'प्याज',
    en: 'Onion',
    aliases: ['onion', 'प्याज', 'प्याज़', 'pyaj', 'kanda', 'कांदा'],
  },
  potato: {
    hi: 'आलू',
    en: 'Potato',
    aliases: ['potato', 'आलू', 'aloo'],
  },
  tomato: {
    hi: 'टमाटर',
    en: 'Tomato',
    aliases: ['tomato', 'टमाटर', 'tamatar'],
  },
  sugarcane: {
    hi: 'गन्ना',
    en: 'Sugarcane',
    aliases: ['sugarcane', 'गन्ना', 'ganna', 'eekh', 'ईख'],
  },
  bajra: {
    hi: 'बाजरा',
    en: 'Bajra',
    aliases: ['bajra', 'बाजरा', 'millet'],
  },
  jowar: {
    hi: 'ज्वार',
    en: 'Jowar',
    aliases: ['jowar', 'ज्वार', 'sorghum'],
  },
  peas: {
    hi: 'मटर',
    en: 'Peas',
    aliases: ['peas', 'pea', 'मटर', 'matar'],
  },
  moong: {
    hi: 'मूंग',
    en: 'Moong',
    aliases: ['moong', 'mung', 'मूंग'],
  },
  urad: {
    hi: 'उड़द',
    en: 'Urad',
    aliases: ['urad', 'udid', 'उड़द'],
  },
  arhar: {
    hi: 'तुअर / अरहर',
    en: 'Pigeon Pea',
    aliases: ['arhar', 'tur', 'toor', 'tuwar', 'अरहर', 'तुअर', 'तुवर'],
  },
  coriander: {
    hi: 'धनिया',
    en: 'Coriander',
    aliases: ['coriander', 'धनिया', 'dhaniya'],
  },
  barley: {
    hi: 'जौ',
    en: 'Barley',
    aliases: ['barley', 'जौ', 'jau'],
  },
};

export const CROP_LABELS_HI: Record<string, string> = {
  Wheat: 'गेहूं',
  Soybean: 'सोयाबीन',
  Gram: 'चना',
  Mustard: 'सरसों',
  Rice: 'धान / चावल',
  Cotton: 'कपास',
  Maize: 'मक्का',
  Garlic: 'लहसुन',
  Groundnut: 'मूंगफली',
  Onion: 'प्याज',
  Potato: 'आलू',
  Tomato: 'टमाटर',
  Sugarcane: 'गन्ना',
  Bajra: 'बाजरा',
  Jowar: 'ज्वार',
  Peas: 'मटर',
  Other: 'अन्य फसल',
};

export function normalizeCropKey(raw?: string): string {
  if (!raw) return 'other';
  const clean = raw.trim().toLowerCase().replace(/[\(\)\[\]\/\-\_]/g, ' ').trim();
  for (const [key, info] of Object.entries(CANONICAL_CROPS)) {
    if (
      clean === key ||
      info.aliases.some((alias) => clean === alias || clean.split(' ').includes(alias) || alias.split(' ').includes(clean))
    ) {
      return key;
    }
  }
  return clean || 'other';
}

export function isSameCrop(cropA?: string, cropB?: string): boolean {
  if (!cropA || !cropB) return false;
  const a = cropA.trim().toLowerCase();
  const b = cropB.trim().toLowerCase();
  if (a === b) return true;
  return normalizeCropKey(cropA) === normalizeCropKey(cropB);
}

export function cropLabel(lang: Lang, cropName?: string): string {
  if (!cropName) return '';
  const key = normalizeCropKey(cropName);
  const found = CANONICAL_CROPS[key];
  if (found) {
    return lang === 'hi' ? found.hi : found.en;
  }
  if (lang === 'hi') {
    return CROP_LABELS_HI[cropName] || cropName;
  }
  return cropName;
}

export function matchesCropSearch(cropName?: string, searchQuery?: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!cropName) return false;
  const q = searchQuery.trim().toLowerCase();
  const c = cropName.trim().toLowerCase();
  if (c.includes(q)) return true;
  const key = normalizeCropKey(cropName);
  const found = CANONICAL_CROPS[key];
  if (found) {
    if (found.hi.toLowerCase().includes(q) || found.en.toLowerCase().includes(q)) return true;
    if (found.aliases.some((a) => a.includes(q))) return true;
  }
  return false;
}

export function typeLabel(lang: Lang, type: 'Expense' | 'Yield' | 'Sale'): string {
  if (lang === 'hi') {
    if (type === 'Expense') return 'लागत खर्च';
    if (type === 'Yield') return 'पैदावार';
    return 'फसल बिक्री';
  }
  return type;
}

export function unitLabel(lang: Lang, unit?: string): string {
  if (!unit) return '';
  if (lang === 'hi') {
    if (unit === 'Quintal') return 'क्विंटल';
    if (unit === 'Kg') return 'किलो';
    if (unit === 'Ton') return 'टन';
    return unit;
  }
  return unit;
}
