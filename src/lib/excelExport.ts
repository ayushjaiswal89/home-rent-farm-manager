import * as XLSX from 'xlsx';
import { FarmRecord, Khet, KhetCrop, Lang, Partner, PartnerCashEntry, RentRecord, HomeExpense } from './types';
import { cropLabel } from './farmI18n';
import { getRecordAmount } from './farmAccounting';

export interface ExportExcelOptions {
  filename?: string;
  lang: Lang;
  records: FarmRecord[];
  khets?: Khet[];
  khetCrops?: KhetCrop[];
  partners?: Partner[];
  partnerCash?: PartnerCashEntry[];
  rentRecords?: RentRecord[];
  homeExpenses?: HomeExpense[];
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Clean sanitization of filenames
 */
export function sanitizeFilename(name: string, ext: string): string {
  const base = name.replace(/[/\\?%*:|"<> ]/g, '-').replace(new RegExp(`\\.${ext}$`, 'i'), '');
  return `${base}.${ext}`;
}

/**
 * Formats CSV cells adhering to RFC 4180:
 * - Unquotes pure numbers so Excel & Sheets support SUM() and formulas
 * - Escapes double quotes (" -> "")
 * - Normalizes embedded line breaks
 * - Prevents spreadsheet formula injection for untrusted strings
 */
export function formatCsvCell(val: unknown): string {
  if (val === null || val === undefined || val === '') {
    return '""';
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '""';
  }

  let str = String(val).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Prevent formula injection in spreadsheets (e.g. =SUM, +cmd, -cmd, @cmd)
  if (/^[=+\-@]/.test(str)) {
    str = ' ' + str;
  }

  // Double quotes escape
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Exports genuine OpenXML (.xlsx) multi-sheet workbook:
 * Sheet 1: Financial Summary (कुल वित्तीय सारांश)
 * Sheet 2: Farm Ledger (खेतवार लेन-देन बहीखाता)
 * Sheet 3: Field Plots (खेत रकबा व मुख्य फसल)
 * Sheet 4: Batai Partners (बटाईदार साझेदार)
 * Sheet 5: Rental Ledger (किराया हिसाब - if enabled)
 * Sheet 6: Home Expenses (घरेलू खर्च - if enabled)
 */
export function exportToExcel(options: ExportExcelOptions): void {
  const isHi = options.lang === 'hi';
  const wb = XLSX.utils.book_new();

  // Helper for type names
  const typeName = (type: string) => {
    if (!isHi) return type;
    if (type === 'Expense') return 'खर्च (लागत)';
    if (type === 'Sale') return 'फसल बिक्री';
    if (type === 'Yield') return 'उपज / पैदावार';
    return type;
  };

  // --- 1. Financial Summary Sheet ---
  let totalSales = 0;
  let totalExpenses = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalYieldQtl = 0;

  options.records.forEach((r) => {
    const amt = getRecordAmount(r);
    const qty = Number(r.quantity || 0);
    if (r.type === 'Sale') {
      totalSales += amt;
      const paid = r.paidAmount !== undefined && r.paidAmount !== null ? Number(r.paidAmount) : amt;
      totalReceived += paid;
      totalPending += r.remainingAmount !== undefined ? Number(r.remainingAmount) : Math.max(0, amt - paid);
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

  const netFarmProfit = totalSales - totalExpenses;

  let rentReceived = 0;
  let rentPending = 0;
  if (options.rentRecords && options.rentRecords.length > 0) {
    options.rentRecords.forEach((rr) => {
      const amt = Number(rr.total || rr.amount || 0);
      if (rr.status === 'Received') rentReceived += amt;
      else rentPending += amt;
    });
  }

  let totalHomeExpenses = 0;
  if (options.homeExpenses && options.homeExpenses.length > 0) {
    options.homeExpenses.forEach((he) => {
      totalHomeExpenses += Number(he.amount || 0);
    });
  }

  const overallSavings = (totalSales + rentReceived) - (totalExpenses + totalHomeExpenses);

  const summaryHeaders = isHi
    ? ['वित्तीय मद (Particulars)', 'रकम / मान (₹ / मात्रा)', 'विवरण (Notes)']
    : ['Financial Particulars', 'Amount / Value', 'Notes'];

  const summaryRows = isHi
    ? [
        ['कुल कृषि उपज बिक्री (Total Farm Sales)', totalSales, 'सभी फसलों की कुल बिक्री'],
        ['कुल कृषि लागत खर्च (Total Farm Inputs)', totalExpenses, 'बीज, खाद, डीजल, दवा व मजदूरी'],
        ['शुद्ध कृषि मुनाफा (Net Farm Profit)', netFarmProfit, 'फसल बिक्री - कुल लागत'],
        ['प्राप्त नकद बिक्री (Cash Received)', totalReceived, 'खरीदारों से प्राप्त राशि'],
        ['बकाया फसल बिक्री (Sales Due / Pending)', totalPending, 'खरीदारों पर बाकी'],
        ['कुल पैदावार / उपज (Total Harvest)', `${Math.round(totalYieldQtl * 10) / 10} क्विंटल`, 'क्विंटल में रूपांतरित'],
        ['कुल प्राप्त किराया (Received Rent)', rentReceived, 'मकान / दुकान किराया'],
        ['कुल बकाया किराया (Pending Rent)', rentPending, 'किराएदारों पर बाकी'],
        ['कुल घरेलू खर्च (Total Home Expenses)', totalHomeExpenses, 'राशन, बिजली, शिक्षा व अन्य'],
        ['कुल शुद्ध बचत (Net Overall Savings)', overallSavings, 'कुल आय - कुल व्यय'],
      ]
    : [
        ['Total Farm Sales', totalSales, 'Gross revenue from harvest sales'],
        ['Total Farm Input Expenses', totalExpenses, 'Seeds, fertilizer, diesel, labor'],
        ['Net Farm Profit', netFarmProfit, 'Total Sales - Total Expenses'],
        ['Cash Received', totalReceived, 'Payment collected from buyers'],
        ['Pending Sales Due', totalPending, 'Receivables from buyers'],
        ['Total Harvest Yield', `${Math.round(totalYieldQtl * 10) / 10} Quintals`, 'Converted to quintals'],
        ['Received Rent Income', rentReceived, 'From rental properties'],
        ['Pending Rent Due', rentPending, 'Rent overdue from tenants'],
        ['Home Expenses', totalHomeExpenses, 'Household expenditures'],
        ['Net Overall Savings', overallSavings, 'Total Income - Total Expenses'],
      ];

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, isHi ? 'वित्तीय सारांश' : 'Summary');

  // --- 2. Farm Records Sheet ---
  const headers = isHi
    ? [
        'दिनांक',
        'खेत का नाम',
        'फसल',
        'प्रकार',
        'मद / श्रेणी',
        'मात्रा',
        'इकाई',
        'दर / भाव (₹)',
        'कुल रकम (₹)',
        'प्राप्त रकम (₹)',
        'बकाया रकम (₹)',
        'खरीदार / श्रमिक',
        'टिप्पणी',
      ]
    : [
        'Date',
        'Field Name',
        'Crop',
        'Type',
        'Category / Details',
        'Quantity',
        'Unit',
        'Rate (₹)',
        'Amount (₹)',
        'Paid Amount (₹)',
        'Remaining (₹)',
        'Buyer / Worker',
        'Note',
      ];

  const rows = options.records.map((r) => {
    const rawQty = typeof r.quantity === 'number' && !isNaN(r.quantity) ? r.quantity : '';
    const rawPrice = typeof r.price === 'number' && !isNaN(r.price) ? r.price : '';
    const rawAmount = getRecordAmount(r);
    const rawPaid = typeof r.paidAmount === 'number' && !isNaN(r.paidAmount)
      ? r.paidAmount
      : (r.type === 'Sale' ? rawAmount : '');
    const rawRemaining = typeof r.remainingAmount === 'number' && !isNaN(r.remainingAmount)
      ? r.remainingAmount
      : (r.type === 'Sale' && typeof rawPaid === 'number' ? Math.max(0, rawAmount - rawPaid) : '');

    return [
      r.date || '',
      r.field || '',
      cropLabel(options.lang, r.crop),
      typeName(r.type),
      r.expenseCategory || '',
      typeof rawQty === 'number' && !isNaN(rawQty) ? rawQty : '',
      r.unit || '',
      typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : '',
      rawAmount,
      typeof rawPaid === 'number' && !isNaN(rawPaid) ? rawPaid : '',
      typeof rawRemaining === 'number' && !isNaN(rawRemaining) ? rawRemaining : '',
      r.buyerName || r.worker || '',
      r.note || '',
    ];
  });

  const wsRecords = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  wsRecords['!cols'] = [
    { wch: 12 }, // Date
    { wch: 16 }, // Field
    { wch: 14 }, // Crop
    { wch: 15 }, // Type
    { wch: 18 }, // Category
    { wch: 10 }, // Quantity
    { wch: 10 }, // Unit
    { wch: 14 }, // Rate
    { wch: 15 }, // Amount
    { wch: 15 }, // Paid
    { wch: 15 }, // Due
    { wch: 18 }, // Buyer/Worker
    { wch: 28 }, // Note
  ];
  XLSX.utils.book_append_sheet(wb, wsRecords, isHi ? 'खेत लेन-देन' : 'Farm Ledger');

  // --- 3. Khet Summary Sheet (if plots exist) ---
  if (options.khets && options.khets.length > 0) {
    const khetHeaders = isHi
      ? ['खेत का नाम', 'रकबा', 'इकाई', 'मुख्य फसल', 'सत्र', 'बुवाई तिथि', 'मिट्टी का प्रकार', 'सिंचाई साधन']
      : ['Field Name', 'Area', 'Unit', 'Main Crop', 'Season', 'Sowing Date', 'Soil Type', 'Irrigation'];

    const khetRows = options.khets.map((k) => [
      k.name || '',
      k.totalArea || k.area || '',
      k.areaUnit || '',
      cropLabel(options.lang, k.crop || ''),
      k.season || '',
      k.sowingDate || '',
      k.soilType || '',
      k.irrigationSource || '',
    ]);

    const wsKhets = XLSX.utils.aoa_to_sheet([khetHeaders, ...khetRows]);
    wsKhets['!cols'] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsKhets, isHi ? 'खेतवार रकबा' : 'Field Plots');
  }

  // --- 4. Partners Sheet (if batai partners exist) ---
  if (options.partners && options.partners.length > 0) {
    const partnerHeaders = isHi
      ? ['साझीदार का नाम', 'फोन नंबर', 'साझेदारी प्रकार', 'हिस्सा (%)', 'संबद्ध खेत', 'फसल', 'टिप्पणी']
      : ['Partner Name', 'Phone', 'Partnership Type', 'Share (%)', 'Field', 'Crop', 'Note'];

    const partnerRows = options.partners.map((p) => [
      p.name || '',
      p.phone || '',
      p.relationship || '',
      p.sharePercent || 50,
      p.khetName || '',
      p.crop || '',
      p.notes || '',
    ]);

    const wsPartners = XLSX.utils.aoa_to_sheet([partnerHeaders, ...partnerRows]);
    wsPartners['!cols'] = [
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsPartners, isHi ? 'बटाईदार साझेदार' : 'Batai Partners');
  }

  // --- 5. Rental Records Sheet (if present) ---
  if (options.rentRecords && options.rentRecords.length > 0) {
    const rentHeaders = isHi
      ? ['दिनांक', 'किराएदार', 'माह', 'WhatsApp', 'कमरा किराया (₹)', 'बिजली बिल (₹)', 'कुल योग (₹)', 'भुगतान स्थिति', 'टिप्पणी']
      : ['Date', 'Tenant', 'Month', 'WhatsApp', 'Room Rent (₹)', 'Light Bill (₹)', 'Total Amount (₹)', 'Status', 'Note'];

    const rentRows = options.rentRecords.map((rr) => [
      rr.date || '',
      rr.tenant || '',
      rr.month || '',
      rr.whatsapp || '',
      Number(rr.amount || 0),
      Number(rr.lightBill || 0),
      Number(rr.total || rr.amount || 0),
      rr.status === 'Received' ? (isHi ? 'प्राप्त (Paid)' : 'Paid') : (isHi ? 'बाकी (Pending)' : 'Pending'),
      rr.note || '',
    ]);

    const wsRent = XLSX.utils.aoa_to_sheet([rentHeaders, ...rentRows]);
    wsRent['!cols'] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 16 },
      { wch: 15 },
      { wch: 16 },
      { wch: 16 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRent, isHi ? 'किराया बहीखाता' : 'Rental Ledger');
  }

  // --- 6. Home Expenses Sheet (if present) ---
  if (options.homeExpenses && options.homeExpenses.length > 0) {
    const homeHeaders = isHi
      ? ['दिनांक', 'मद / श्रेणी', 'रकम (₹)', 'टिप्पणी']
      : ['Date', 'Expense Category', 'Amount (₹)', 'Note'];

    const homeRows = options.homeExpenses.map((he) => [
      he.date || '',
      he.category || '',
      Number(he.amount || 0),
      he.note || '',
    ]);

    const wsHome = XLSX.utils.aoa_to_sheet([homeHeaders, ...homeRows]);
    wsHome['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsHome, isHi ? 'घरेलू खर्च' : 'Home Expenses');
  }

  // Generate genuine OpenXML .xlsx binary data
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const baseName = options.filename
    ? options.filename.replace(/\.csv$/i, '').replace(/\.xlsx$/i, '')
    : `Smart-Khaata-${new Date().toISOString().slice(0, 10)}`;
  const finalFilename = sanitizeFilename(baseName, 'xlsx');

  // Mobile Web Share API: User can tap and directly open in MS Excel / Google Sheets or WhatsApp
  if (
    typeof navigator !== 'undefined' &&
    typeof File !== 'undefined' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const file = new File([blob], finalFilename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (navigator.canShare({ files: [file] })) {
        navigator
          .share({
            files: [file],
            title: isHi ? 'स्मार्ट खाता एक्सेल रिपोर्ट' : 'Smart Khata Excel Report',
            text: isHi
              ? 'स्मार्ट खाता - डिजिटल कृषि बहीखाता एक्सेल रिपोर्ट (.xlsx)'
              : 'Smart Khata - Farm Ledger Excel Report (.xlsx)',
          })
          .catch(() => {
            triggerDownload(blob, finalFilename);
          });
        return;
      }
    } catch {
      // Continue to direct download
    }
  }

  triggerDownload(blob, finalFilename);
}

/**
 * Standard RFC 4180 compliant CSV export with UTF-8 BOM (\uFEFF) for Devanagari Hindi support.
 * Numbers remain unquoted for instant SUM() in Excel & Google Sheets.
 * Multiline cells, quotes, commas are safely escaped.
 */
export function exportToCsv(options: ExportExcelOptions): void {
  const isHi = options.lang === 'hi';
  const headers = isHi
    ? [
        'दिनांक',
        'खेत का नाम',
        'फसल',
        'प्रकार',
        'श्रेणी / मद',
        'मात्रा',
        'इकाई',
        'दर / भाव (₹)',
        'कुल रकम (₹)',
        'प्राप्त रकम (₹)',
        'बाकी रकम (₹)',
        'खरीदार / श्रमिक',
        'टिप्पणी',
      ]
    : [
        'Date',
        'Field Name',
        'Crop',
        'Type',
        'Category / Details',
        'Quantity',
        'Unit',
        'Rate (₹)',
        'Amount (₹)',
        'Paid Amount (₹)',
        'Remaining (₹)',
        'Buyer / Worker',
        'Note',
      ];

  const typeName = (type: string) => {
    if (!isHi) return type;
    if (type === 'Expense') return 'खर्च (लागत)';
    if (type === 'Sale') return 'फसल बिक्री';
    if (type === 'Yield') return 'उपज / पैदावार';
    return type;
  };

  const headerLine = headers.map(formatCsvCell).join(',');
  const rowLines = options.records.map((r) => {
    const rawQty = typeof r.quantity === 'number' && !isNaN(r.quantity) ? r.quantity : '';
    const rawPrice = typeof r.price === 'number' && !isNaN(r.price) ? r.price : '';
    const rawAmount = getRecordAmount(r);
    const rawPaid = typeof r.paidAmount === 'number' && !isNaN(r.paidAmount)
      ? r.paidAmount
      : (r.type === 'Sale' ? rawAmount : '');
    const rawRemaining = typeof r.remainingAmount === 'number' && !isNaN(r.remainingAmount)
      ? r.remainingAmount
      : (r.type === 'Sale' && typeof rawPaid === 'number' ? Math.max(0, rawAmount - rawPaid) : '');

    const cells = [
      r.date || '',
      r.field || '',
      cropLabel(options.lang, r.crop),
      typeName(r.type),
      r.expenseCategory || '',
      typeof rawQty === 'number' && !isNaN(rawQty) ? rawQty : '',
      r.unit || '',
      typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : '',
      rawAmount,
      typeof rawPaid === 'number' && !isNaN(rawPaid) ? rawPaid : '',
      typeof rawRemaining === 'number' && !isNaN(rawRemaining) ? rawRemaining : '',
      r.buyerName || r.worker || '',
      r.note || '',
    ];
    return cells.map(formatCsvCell).join(',');
  });

  // UTF-8 BOM prefix \uFEFF ensures Excel on Windows immediately reads Hindi Devanagari correctly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const baseName = options.filename
    ? options.filename.replace(/\.xlsx$/i, '').replace(/\.csv$/i, '')
    : `kisan-khata-records-${new Date().toISOString().slice(0, 10)}`;
  const finalFilename = sanitizeFilename(baseName, 'csv');

  // Mobile Web Share API support
  if (
    typeof navigator !== 'undefined' &&
    typeof File !== 'undefined' &&
    typeof navigator.canShare === 'function'
  ) {
    try {
      const file = new File([blob], finalFilename, { type: 'text/csv;charset=utf-8;' });
      if (navigator.canShare({ files: [file] })) {
        navigator
          .share({
            files: [file],
            title: finalFilename,
            text: 'स्मार्ट खाता - कृषि लेन-देन CSV फ़ाइल',
          })
          .catch(() => {
            triggerDownload(blob, finalFilename);
          });
        return;
      }
    } catch {
      // Continue to direct download
    }
  }

  triggerDownload(blob, finalFilename);
}
