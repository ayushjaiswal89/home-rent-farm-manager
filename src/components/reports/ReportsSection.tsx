import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Calendar,
  Wheat,
  Building2,
  ShoppingBag,
  Layers,
  Download,
  FileDown,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, RentRecord, HomeExpense } from '../../lib/types';
import { getRecordAmount } from '../../lib/farmAccounting';
import { exportToExcel, exportToCsv } from '../../lib/excelExport';
import { printFinancialReport, downloadFinancialReportPdf } from '../../lib/pdfExport';
import {
  getCropSeasonForDate,
  getRecentCropSeasons,
  isRecordInCropSeason,
  isDateInSeason,
  type CropSeason,
} from '../../lib/cropCycles';

interface ReportsSectionProps {
  records: FarmRecord[];
  rentRecords?: RentRecord[];
  homeExpenses?: HomeExpense[];
  khets?: Khet[];
  lang: Lang;
  onBack?: () => void;
  onOpenPdfModal?: () => void;
}

const money = (val: number) => `₹ ${Math.round(val || 0).toLocaleString('en-IN')}`;

export function ReportsSection({
  records,
  rentRecords = [],
  homeExpenses = [],
  khets = [],
  lang,
  onBack,
  onOpenPdfModal,
}: ReportsSectionProps) {
  const isHi = lang === 'hi';
  const [activeReportTab, setActiveReportTab] = useState<'farm' | 'rent' | 'home' | 'total'>('total');
  const [periodMode, setPeriodMode] = useState<'season' | 'month' | 'all'>('season');

  const seasons = useMemo(() => getRecentCropSeasons(6), []);
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState<number>(0);
  const activeSeason = seasons[selectedSeasonIndex] || seasons[0];

  const monthNames = isHi
    ? ['जुलाई 2026', 'अगस्त 2026', 'सितंबर 2026', 'अक्टूबर 2026', 'नवंबर 2026', 'दिसंबर 2026']
    : ['July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'];
  const monthKeys = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(3); // October 2026
  const curKey = monthKeys[selectedMonthIndex] || '';

  const handlePrevPeriod = () => {
    if (periodMode === 'season') {
      setSelectedSeasonIndex((prev) => (prev < seasons.length - 1 ? prev + 1 : prev));
    } else if (periodMode === 'month') {
      setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
  };

  const handleNextPeriod = () => {
    if (periodMode === 'season') {
      setSelectedSeasonIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (periodMode === 'month') {
      setSelectedMonthIndex((prev) => (prev < monthNames.length - 1 ? prev + 1 : prev));
    }
  };

  // Real calculation from records
  const {
    periodFarmRecords,
    farmIncome,
    farmExpense,
    rentIncome,
    rentPending,
    homeExpenseTotal,
    totalIncome,
    totalExpense,
    netSavings,
    breakdown,
    cropSeasonBreakdown,
  } = useMemo(() => {
    const periodFarm = records.filter((r) => {
      if (periodMode === 'all') return true;
      if (periodMode === 'season') return isRecordInCropSeason(r, activeSeason);
      return !curKey || !r.date || r.date.startsWith(curKey);
    });

    let fInc = 0;
    let fExp = 0;
    const cropMap: Record<string, { exp: number; sale: number; net: number }> = {};

    periodFarm.forEach((r) => {
      const amt = getRecordAmount(r);
      const cropName = r.crop || (isHi ? 'अन्य' : 'Other');
      if (!cropMap[cropName]) {
        cropMap[cropName] = { exp: 0, sale: 0, net: 0 };
      }

      if (r.type === 'Sale') {
        const received = r.paidAmount !== undefined ? Number(r.paidAmount) : amt;
        fInc += received;
        cropMap[cropName].sale += received;
        cropMap[cropName].net += received;
      } else if (r.type === 'Expense') {
        fExp += amt;
        cropMap[cropName].exp += amt;
        cropMap[cropName].net -= amt;
      }
    });

    const periodRent = rentRecords.filter((r) => {
      if (periodMode === 'all') return true;
      if (periodMode === 'season') {
        return !r.date || isDateInSeason(r.date, activeSeason);
      }
      return !curKey || !r.date || r.date.startsWith(curKey);
    });

    let rInc = 0;
    let rPend = 0;
    periodRent.forEach((r) => {
      const tot = Number(r.total) || 0;
      const pd = r.paidAmount !== undefined ? Number(r.paidAmount) : (r.status === 'Received' ? tot : 0);
      rInc += pd;
      rPend += Math.max(0, tot - pd);
    });

    const periodHome = homeExpenses.filter((h) => {
      if (periodMode === 'all') return true;
      if (periodMode === 'season') {
        return !h.date || isDateInSeason(h.date, activeSeason);
      }
      return !curKey || !h.date || h.date.startsWith(curKey);
    });

    let hExp = 0;
    periodHome.forEach((h) => {
      hExp += Number(h.amount) || 0;
    });

    const totInc = fInc + rInc;
    const totExp = fExp + hExp;
    const net = totInc - totExp;

    let pctFarm = 0;
    let pctRent = 0;
    let pctOther = 0;
    if (totInc > 0) {
      pctFarm = Math.round((fInc / totInc) * 100);
      pctRent = Math.round((rInc / totInc) * 100);
      pctOther = Math.max(0, 100 - pctFarm - pctRent);
    }

    const cropList = Object.entries(cropMap).map(([crop, data]) => ({
      crop,
      ...data,
    })).sort((a, b) => b.sale - a.sale);

    return {
      periodFarmRecords: periodFarm,
      farmIncome: fInc,
      farmExpense: fExp,
      rentIncome: rInc,
      rentPending: rPend,
      homeExpenseTotal: hExp,
      totalIncome: totInc,
      totalExpense: totExp,
      netSavings: net,
      breakdown: {
        farm: { amt: fInc, pct: pctFarm },
        rent: { amt: rInc, pct: pctRent },
        other: { amt: 0, pct: pctOther },
      },
      cropSeasonBreakdown: cropList,
    };
  }, [records, rentRecords, homeExpenses, curKey, periodMode, activeSeason, isHi]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [reportNotice, setReportNotice] = useState<string | null>(null);

  const showReportNotice = (msg: string) => {
    setReportNotice(msg);
    setTimeout(() => setReportNotice(null), 3500);
  };

  const handleExportExcel = () => {
    exportToExcel({
      records,
      lang,
      filename: isHi ? 'स्मार्ट_खाता_वित्तीय_रिपोर्ट' : 'Smart_Khata_Financial_Report',
      khets,
      rentRecords,
      homeExpenses,
    });
    showReportNotice(isHi ? '✓ Excel (.xlsx) रिपोर्ट डाउनलोड हो गई' : '✓ Excel (.xlsx) report downloaded');
  };

  const handleExportCSV = () => {
    exportToCsv({
      records,
      lang,
      filename: isHi ? 'स्मार्ट_खाता_लेन-देन_csv' : 'Smart_Khata_Records_csv',
      khets,
      rentRecords,
      homeExpenses,
    });
    showReportNotice(isHi ? '✓ CSV फ़ाइल डाउनलोड हो गई' : '✓ CSV records downloaded');
  };

  const handleExportPDF = async () => {
    if (onOpenPdfModal) {
      onOpenPdfModal();
      return;
    }
    const subtitleText = periodMode === 'season'
      ? `${activeSeason.labelHi} (${activeSeason.monthsHi}) - 6-माह फसल चक्र रिपोर्ट`
      : periodMode === 'month'
      ? `${monthNames[selectedMonthIndex]} - कुल आय एवं व्यय विवरण`
      : isHi ? 'संपूर्ण वित्तीय रिपोर्ट' : 'All-time Financial Report';

    try {
      setIsGeneratingPdf(true);
      await downloadFinancialReportPdf({
        title: isHi ? 'स्मार्ट खाता - संपूर्ण वित्तीय रिपोर्ट' : 'Smart Khata - Financial Report',
        subtitle: subtitleText,
        lang: isHi ? 'hi' : 'en',
        season: periodMode === 'season' ? activeSeason.labelHi : undefined,
        summaryCards: [
          { label: isHi ? 'कुल आय' : 'Total Income', value: money(totalIncome), color: '#16a34a' },
          { label: isHi ? 'कुल व्यय' : 'Total Expense', value: money(totalExpense), color: '#dc2626' },
          { label: isHi ? 'शुद्ध बचत' : 'Net Savings', value: money(netSavings), color: '#2563eb' },
        ],
        tableHeaders: isHi
          ? ['स्रोत / विवरण', 'प्रतिशत (%)', 'राशि (₹)']
          : ['Source / Particulars', 'Percentage (%)', 'Amount (INR)'],
        tableRows: [
          { cells: [isHi ? 'खेती उपज बिक्री' : 'Farm Harvest Sales', `${breakdown.farm.pct}%`, money(breakdown.farm.amt)] },
          { cells: [isHi ? 'मकान व दुकान किराया' : 'Property Rental', `${breakdown.rent.pct}%`, money(breakdown.rent.amt)] },
          { cells: [isHi ? 'अन्य कृषि व्यवसाय' : 'Other Income', `${breakdown.other.pct}%`, money(breakdown.other.amt)] },
        ],
        footerNotes: isHi
          ? 'स्मार्ट खाता - डिजिटल हिसाब-किताब | किसान का भरोसेमंद साथी'
          : 'Smart Khata - Digital Farm Ledger & Accounting',
      });
      showReportNotice(isHi ? '✓ वित्तीय PDF रिपोर्ट सफलतापूर्वक तैयार व डाउनलोड हो गई' : '✓ PDF statement downloaded');
    } catch (err) {
      console.error('PDF error:', err);
      printFinancialReport({
        title: isHi ? 'स्मार्ट खाता - संपूर्ण वित्तीय रिपोर्ट' : 'Smart Khata - Financial Report',
        subtitle: subtitleText,
        lang: isHi ? 'hi' : 'en',
        summaryCards: [
          { label: isHi ? 'कुल आय' : 'Total Income', value: money(totalIncome), color: '#16a34a' },
          { label: isHi ? 'कुल व्यय' : 'Total Expense', value: money(totalExpense), color: '#dc2626' },
          { label: isHi ? 'शुद्ध बचत' : 'Net Savings', value: money(netSavings), color: '#2563eb' },
        ],
        tableHeaders: isHi
          ? ['स्रोत / विवरण', 'प्रतिशत (%)', 'राशि (₹)']
          : ['Source / Particulars', 'Percentage (%)', 'Amount (INR)'],
        tableRows: [
          { cells: [isHi ? 'खेती उपज बिक्री' : 'Farm Harvest Sales', `${breakdown.farm.pct}%`, money(breakdown.farm.amt)] },
          { cells: [isHi ? 'मकान व दुकान किराया' : 'Property Rental', `${breakdown.rent.pct}%`, money(breakdown.rent.amt)] },
          { cells: [isHi ? 'अन्य कृषि व्यवसाय' : 'Other Income', `${breakdown.other.pct}%`, money(breakdown.other.amt)] },
        ],
        footerNotes: isHi
          ? 'स्मार्ट खाता - डिजिटल हिसाब-किताब | किसान का भरोसेमंद साथी'
          : 'Smart Khata - Digital Farm Ledger & Accounting',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // SVG Donut calculation
  // Circle radius 60, circumference = 2 * PI * 60 ≈ 377
  const circumference = 377;
  const farmLength = totalIncome > 0 ? (circumference * breakdown.farm.pct) / 100 : 0;
  const rentLength = totalIncome > 0 ? (circumference * breakdown.rent.pct) / 100 : 0;
  const otherLength = totalIncome > 0 ? (circumference * breakdown.other.pct) / 100 : 0;

  const farmOffset = 0;
  const rentOffset = -farmLength;
  const otherOffset = -(farmLength + rentLength);

  return (
    <div className="max-w-[720px] mx-auto px-3 sm:px-4 pb-24">
      {/* Top Header bar matching Screen 8 */}
      <div className="flex items-center justify-between py-3 mb-3 border-b border-slate-200 dark:border-[#1a3525]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12271c] rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isHi ? 'रिपोर्ट एवं बहीखाता' : 'Reports & Ledger'}
          </h1>
        </div>
      </div>

      {/* 4 Tabs matching Screen 8: [खेती] [किराया] [घरेलू] [कुल] */}
      <div className="flex bg-slate-100 dark:bg-[#0c1a13] p-1 rounded-2xl mb-3 border border-slate-200 dark:border-[#1e3c2c] overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveReportTab('farm')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'farm'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'खेती' : 'Farm'}
        </button>
        <button
          onClick={() => setActiveReportTab('rent')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'rent'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'किराया' : 'Rental'}
        </button>
        <button
          onClick={() => setActiveReportTab('home')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'home'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'घरेलू' : 'Home'}
        </button>
        <button
          onClick={() => setActiveReportTab('total')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeReportTab === 'total'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'कुल' : 'Total'}
        </button>
      </div>

      {/* Period Mode Selector: 6-माह फसल चक्र vs माहवार vs संपूर्ण */}
      <div className="flex bg-slate-200/70 dark:bg-[#12271c] p-1 rounded-xl mb-2.5 gap-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setPeriodMode('season')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            periodMode === 'season'
              ? 'bg-emerald-700 text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/50'
          }`}
        >
          <Wheat size={13} className="shrink-0" />
          <span>{isHi ? '6-माह फसल चक्र' : '6-Month Crop Season'}</span>
        </button>
        <button
          type="button"
          onClick={() => setPeriodMode('month')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            periodMode === 'month'
              ? 'bg-emerald-700 text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/50'
          }`}
        >
          <Calendar size={13} className="shrink-0" />
          <span>{isHi ? 'माहवार' : 'Monthly'}</span>
        </button>
        <button
          type="button"
          onClick={() => setPeriodMode('all')}
          className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            periodMode === 'all'
              ? 'bg-emerald-700 text-white shadow-xs font-bold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-300/50'
          }`}
        >
          <Layers size={13} className="shrink-0" />
          <span>{isHi ? 'संपूर्ण' : 'All'}</span>
        </button>
      </div>

      {/* Period Navigator */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] mb-4 shadow-xs">
        <button
          onClick={handlePrevPeriod}
          disabled={
            periodMode === 'season'
              ? selectedSeasonIndex === seasons.length - 1
              : periodMode === 'month'
              ? selectedMonthIndex === 0
              : true
          }
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
          title={isHi ? 'पिछला' : 'Previous'}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            {periodMode === 'season' ? (
              <Wheat size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Calendar size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {periodMode === 'season'
                ? activeSeason.labelHi
                : periodMode === 'month'
                ? monthNames[selectedMonthIndex]
                : isHi ? 'संपूर्ण रिकॉर्ड (All Time)' : 'All Time Records'}
            </span>
          </div>
          {periodMode === 'season' && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {activeSeason.monthsHi} (साल में 2 फसलें - 6 माह चक्र)
            </span>
          )}
        </div>
        <button
          onClick={handleNextPeriod}
          disabled={
            periodMode === 'season'
              ? selectedSeasonIndex === 0
              : periodMode === 'month'
              ? selectedMonthIndex === monthNames.length - 1
              : true
          }
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
          title={isHi ? 'अगला' : 'Next'}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Donut Chart Card matching Screen 8 */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs mb-5">
        <div className="flex flex-col items-center">
          {/* Donut Chart SVG */}
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="18"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* 1. Farm (खेती 58%) - Green */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="18"
                strokeDasharray={`${farmLength} ${circumference}`}
                strokeDashoffset={farmOffset}
                strokeLinecap="round"
              />
              {/* 2. Rent (किराया 24%) - Red/Pink */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth="18"
                strokeDasharray={`${rentLength} ${circumference}`}
                strokeDashoffset={rentOffset}
                strokeLinecap="round"
              />
              {/* 3. Other (अन्य 18%) - Yellow/Amber */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="18"
                strokeDasharray={`${otherLength} ${circumference}`}
                strokeDashoffset={otherOffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {activeReportTab === 'farm'
                  ? isHi ? 'खेती आय' : 'Farm Income'
                  : activeReportTab === 'rent'
                  ? isHi ? 'किराया प्राप्ति' : 'Rent Received'
                  : activeReportTab === 'home'
                  ? isHi ? 'घरेलू खर्च' : 'Home Expense'
                  : isHi ? 'कुल आय' : 'Total Income'}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {activeReportTab === 'farm'
                  ? money(farmIncome)
                  : activeReportTab === 'rent'
                  ? money(rentIncome)
                  : activeReportTab === 'home'
                  ? money(homeExpenseTotal)
                  : money(totalIncome)}
              </span>
            </div>
          </div>

          {/* Legend Items matching Screen 8 */}
          <div className="w-full max-w-sm space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {activeReportTab === 'total' && (
              <>
                {/* 1. खेती */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'खेती' : 'Farm'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{breakdown.farm.pct}%</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{money(breakdown.farm.amt)}</span>
                  </div>
                </div>

                {/* 2. किराया */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'किराया' : 'Rental'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{breakdown.rent.pct}%</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{money(breakdown.rent.amt)}</span>
                  </div>
                </div>

                {/* 3. अन्य */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'अन्य' : 'Other'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 dark:text-slate-400">{breakdown.other.pct}%</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{money(breakdown.other.amt)}</span>
                  </div>
                </div>
              </>
            )}

            {activeReportTab === 'farm' && (
              <>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'उपज बिक्री (आय)' : 'Crop Sales (Income)'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{money(farmIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'खेती खर्च' : 'Farm Expense'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{money(farmExpense)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{isHi ? 'शुद्ध खेती बचत' : 'Net Farm Savings'}</span>
                  <span className={`font-mono font-bold ${farmIncome - farmExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {money(farmIncome - farmExpense)}
                  </span>
                </div>

                {cropSeasonBreakdown.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      {isHi ? 'फसलवार बहीखाता विवरण:' : 'Crop-wise Details:'}
                    </span>
                    <div className="space-y-1.5">
                      {cropSeasonBreakdown.map((item) => (
                        <div
                          key={item.crop}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Wheat size={12} className="text-emerald-500" />
                            {item.crop}
                          </span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-rose-600 dark:text-rose-400 text-[11px]">
                              {isHi ? 'लागत:' : 'Exp:'} {money(item.exp)}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                              {isHi ? 'बिक्री:' : 'Sale:'} {money(item.sale)}
                            </span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                item.net >= 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {item.net >= 0 ? '+' : ''}{money(item.net)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeReportTab === 'rent' && (
              <>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'प्राप्त किराया' : 'Received Rent'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{money(rentIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-800 dark:text-slate-200">{isHi ? 'बाकी / लंबित' : 'Pending Rent'}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{money(rentPending)}</span>
                </div>
              </>
            )}

            {activeReportTab === 'home' && (
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-800 dark:text-slate-200">{isHi ? 'कुल घरेलू खर्च' : 'Total Home Expense'}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{money(homeExpenseTotal)}</span>
              </div>
            )}

            {totalIncome === 0 && totalExpense === 0 && (
              <p className="text-[11px] text-center text-slate-400 pt-2 italic">
                {isHi ? 'नई प्रविष्टि दर्ज होने पर वास्तविक रिपोर्ट यहाँ दिखेगी।' : 'Add new entries to view dynamic reports here.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {reportNotice && (
        <div className="mb-3 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{reportNotice}</span>
        </div>
      )}

      {/* 3 Export Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Excel डाउनलोड (Green Button) */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer"
          title={isHi ? 'Excel (.xlsx) फाइल डाउनलोड करें' : 'Download Excel (.xlsx)'}
        >
          <FileSpreadsheet size={16} className="shrink-0" />
          <span>{isHi ? 'Excel (.xlsx)' : 'Excel (.xlsx)'}</span>
        </button>

        {/* CSV डाउनलोड (Teal Button) */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="py-3 px-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer"
          title={isHi ? 'CSV फाइल डाउनलोड करें' : 'Download CSV file'}
        >
          <FileText size={16} className="shrink-0" />
          <span>{isHi ? 'CSV फाइल' : 'CSV File'}</span>
        </button>

        {/* PDF रिपोर्ट (Blue Button) */}
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isGeneratingPdf}
          className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-60"
          title={isHi ? 'PDF रिपोर्ट डाउनलोड करें' : 'Download PDF statement'}
        >
          {isGeneratingPdf ? (
            <Loader2 size={16} className="animate-spin shrink-0" />
          ) : (
            <FileDown size={16} className="shrink-0" />
          )}
          <span>{isGeneratingPdf ? (isHi ? 'PDF बन रही है...' : 'Generating...') : (isHi ? 'PDF रिपोर्ट' : 'PDF Report')}</span>
        </button>
      </div>
    </div>
  );
}
