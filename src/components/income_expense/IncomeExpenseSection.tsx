import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Wheat,
  Sparkles,
  Droplets,
  Fuel,
  Users,
  CreditCard,
  ShoppingBag,
  Maximize2,
} from 'lucide-react';
import type { FarmRecord, Lang } from '../../lib/types';
import { getRecordAmount } from '../../lib/farmAccounting';
import { cropLabel } from '../../lib/farmI18n';

interface IncomeExpenseSectionProps {
  records: FarmRecord[];
  lang: Lang;
  onBack?: () => void;
  onSelectRecord?: (record: FarmRecord) => void;
  onAddNew?: (type: 'Expense' | 'Sale') => void;
}

const money = (val: number) => `₹ ${Math.round(val || 0).toLocaleString('en-IN')}`;

export function IncomeExpenseSection({
  records,
  lang,
  onBack,
  onSelectRecord,
  onAddNew,
}: IncomeExpenseSectionProps) {
  const isHi = lang === 'hi';
  const [viewTab, setViewTab] = useState<'summary' | 'transactions' | 'category'>('summary');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(3); // October 2026

  const monthNames = isHi
    ? ['जुलाई 2026', 'अगस्त 2026', 'सितंबर 2026', 'अक्टूबर 2026']
    : ['July 2026', 'August 2026', 'September 2026', 'October 2026'];

  const shortMonthLabels = isHi
    ? ['जुल', 'अग', 'सित', 'अक्टू']
    : ['Jul', 'Aug', 'Sep', 'Oct'];

  // Real computations from user records
  const { totalIncome, totalExpense, netSavings } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    records.forEach((r) => {
      const amt = getRecordAmount(r);
      if (r.type === 'Sale') inc += (r.paidAmount !== undefined ? Number(r.paidAmount) : amt);
      else if (r.type === 'Expense') exp += amt;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      netSavings: inc - exp,
    };
  }, [records]);

  // Compute real monthly chart data from records
  const monthlyChartData = useMemo(() => {
    const curYear = new Date().getFullYear();
    const months = [
      { key: `${curYear}-07`, label: shortMonthLabels[0] },
      { key: `${curYear}-08`, label: shortMonthLabels[1] },
      { key: `${curYear}-09`, label: shortMonthLabels[2] },
      { key: `${curYear}-10`, label: shortMonthLabels[3] },
    ];
    return months.map((m) => {
      let inc = 0;
      let exp = 0;
      records.forEach((r) => {
        if (r.date && r.date.startsWith(m.key)) {
          const amt = getRecordAmount(r);
          if (r.type === 'Sale') inc += (r.paidAmount !== undefined ? Number(r.paidAmount) : amt);
          else if (r.type === 'Expense') exp += amt;
        }
      });
      return { label: m.label, inc, exp };
    });
  }, [records, shortMonthLabels]);

  // Dynamic category breakdown from real expense records
  const categoryBreakdown = useMemo(() => {
    const expenseRecs = records.filter((r) => r.type === 'Expense');
    const map = new Map<string, number>();
    let expSum = 0;
    expenseRecs.forEach((r) => {
      const amt = getRecordAmount(r);
      expSum += amt;
      const cat = r.expenseCategory || r.crop || (isHi ? 'अन्य खर्च' : 'Other Expense');
      map.set(cat, (map.get(cat) || 0) + amt);
    });
    if (expSum === 0) return [];
    const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, amt], idx) => ({
        label,
        amt,
        pct: Math.round((amt / expSum) * 100),
        color: colors[idx % colors.length],
      }));
  }, [records, isHi]);

  const getTransactionIcon = (r: FarmRecord) => {
    if (r.type === 'Sale') {
      return { icon: ArrowUpRight, bg: 'bg-emerald-500', text: 'text-white' };
    }
    const cat = (r.expenseCategory || '').toLowerCase();
    if (cat.includes('बीज') || cat.includes('seed')) {
      return { icon: Wheat, bg: 'bg-rose-500', text: 'text-white' };
    }
    if (cat.includes('खाद') || cat.includes('fertilizer')) {
      return { icon: Sparkles, bg: 'bg-amber-500', text: 'text-white' };
    }
    if (cat.includes('डीजल') || cat.includes('diesel')) {
      return { icon: Fuel, bg: 'bg-red-600', text: 'text-white' };
    }
    if (cat.includes('मजदूर') || cat.includes('labor')) {
      return { icon: Users, bg: 'bg-purple-600', text: 'text-white' };
    }
    if (cat.includes('सिंचाई') || cat.includes('water')) {
      return { icon: Droplets, bg: 'bg-blue-500', text: 'text-white' };
    }
    return { icon: ArrowDownRight, bg: 'bg-rose-500', text: 'text-white' };
  };

  const handlePrevMonth = () => {
    setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextMonth = () => {
    setSelectedMonthIndex((prev) => (prev < monthNames.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="max-w-[720px] mx-auto px-3 sm:px-4 pb-24">
      {/* Top Header bar matching Screen 7 */}
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
            {isHi ? 'आमदनी-खर्च' : 'Income & Expense'}
          </h1>
        </div>

        {onAddNew && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onAddNew('Expense')}
              className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              + {isHi ? 'खर्च' : 'Expense'}
            </button>
            <button
              onClick={() => onAddNew('Sale')}
              className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
            >
              + {isHi ? 'आमदनी' : 'Income'}
            </button>
          </div>
        )}
      </div>

      {/* 3 Pill Tabs matching Screen 7: [सारांश] [लेन-देन] [केटेगरी] */}
      <div className="flex bg-slate-100 dark:bg-[#0c1a13] p-1 rounded-2xl mb-3 border border-slate-200 dark:border-[#1e3c2c]">
        <button
          onClick={() => setViewTab('summary')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            viewTab === 'summary'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'सारांश' : 'Summary'}
        </button>
        <button
          onClick={() => setViewTab('transactions')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            viewTab === 'transactions'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'लेन-देन' : 'Transactions'}
        </button>
        <button
          onClick={() => setViewTab('category')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            viewTab === 'category'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isHi ? 'केटेगरी' : 'Categories'}
        </button>
      </div>

      {/* Month Navigator matching Screen 7: < अक्टूबर 2026 > */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] mb-3 shadow-xs">
        <button
          onClick={handlePrevMonth}
          disabled={selectedMonthIndex === 0}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {monthNames[selectedMonthIndex]}
          </span>
        </div>
        <button
          onClick={handleNextMonth}
          disabled={selectedMonthIndex === monthNames.length - 1}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* VIEW: SUMMARY (SCREEN 7 DEFAULT) */}
      {viewTab === 'summary' && (
        <div className="space-y-3">
          {/* 2 KPI Summary Cards: कुल आमदनी | कुल खर्च */}
          <div className="grid grid-cols-2 gap-3">
            {/* कुल आमदनी */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isHi ? 'कुल आमदनी' : 'Total Income'}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {money(totalIncome)}
              </p>
            </div>

            {/* कुल खर्च */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isHi ? 'कुल खर्च' : 'Total Expense'}
              </p>
              <p className="text-xl font-black text-rose-500 dark:text-rose-400 font-mono mt-1">
                {money(totalExpense)}
              </p>
            </div>
          </div>

          {/* Wide Soft Blue Card: शुद्ध बचत ₹ 52,480 */}
          <div className="p-4 rounded-2xl bg-[#ebf3fe] dark:bg-[#0d213a] border border-blue-200 dark:border-blue-900 shadow-xs">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
              {isHi ? 'शुद्ध बचत' : 'Net Savings'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-200 font-mono mt-1">
              {money(netSavings)}
            </p>
          </div>

          {/* Monthly Comparison Dual Bar Chart matching Screen 7 */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isHi ? 'माहवार तुलना (आमदनी vs खर्च)' : 'Monthly Comparison'}
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400">{isHi ? 'आमदनी' : 'Income'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400">{isHi ? 'खर्च' : 'Expense'}</span>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100 dark:border-slate-800">
              {monthlyChartData.map((d, idx) => {
                const max = 90000;
                const incHeight = Math.round((d.inc / max) * 100);
                const expHeight = Math.round((d.exp / max) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Income Bar (Green) */}
                      <div
                        style={{ height: `${incHeight}%` }}
                        className="w-3.5 sm:w-5 bg-emerald-500 rounded-t-md transition-all duration-500"
                        title={`आमदनी: ${money(d.inc)}`}
                      />
                      {/* Expense Bar (Red) */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-3.5 sm:w-5 bg-rose-500 rounded-t-md transition-all duration-500"
                        title={`खर्च: ${money(d.exp)}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-2">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TRANSACTIONS */}
      {viewTab === 'transactions' && (
        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-[#0c1a13] rounded-2xl border border-dashed border-slate-200 dark:border-[#1e3c2c] p-6">
              <p className="text-slate-500 text-sm">{isHi ? 'कोई रिकॉर्ड नहीं मिला' : 'No records found'}</p>
            </div>
          ) : (
            records.map((r) => {
              const { icon: TransIcon, bg: iconBg } = getTransactionIcon(r);
              const amt = getRecordAmount(r);
              const isSale = r.type === 'Sale';
              const cropTitle = cropLabel(lang, r.crop || 'Wheat');
              const title = isSale
                ? `${cropTitle} ${isHi ? 'बिक्री' : 'Sale'}`
                : r.expenseCategory
                ? `${r.expenseCategory}`
                : `${cropTitle} ${isHi ? 'खर्च' : 'Expense'}`;

              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRecord && onSelectRecord(r)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] hover:border-emerald-500/40 shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} text-white shadow-xs`}
                    >
                      <TransIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {r.field ? `${r.field} • ` : ''}
                        {r.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono font-bold text-xs sm:text-sm ${
                        isSale ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {isSale ? '+' : '-'} {money(amt)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {isSale ? (isHi ? 'आय' : 'Income') : (isHi ? 'लागत' : 'Expense')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: CATEGORY */}
      {viewTab === 'category' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {isHi ? 'श्रेणीवार खर्च विवरण' : 'Category Breakdown'}
          </h3>
          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {isHi
                ? 'कोई खर्च प्रविष्टि उपलब्ध नहीं है।'
                : 'No expense records available yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {cat.label} ({cat.pct}%)
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {money(cat.amt)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(2, cat.pct))}%` }}
                      className={`h-full ${cat.color} rounded-full transition-all`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
