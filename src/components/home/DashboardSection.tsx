import React, { useMemo, useState } from 'react';
import {
  Bell,
  Sun,
  Calendar,
  ChevronRight,
  TrendingUp,
  Sprout,
  Wheat,
  Plus,
  Users,
  Building2,
  ShoppingBag,
  Droplets,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  Circle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Eye,
  EyeOff,
  BarChart3,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import type { FarmRecord, HomeExpense, Lang, RentRecord, Partner, PartnerCashEntry, FarmTask, FarmerProfile } from '../../lib/types';
import { getRecordAmount, normalizeToQuintals } from '../../lib/farmAccounting';
import { cropLabel } from '../../lib/farmI18n';
import { calculateBataiSettlement } from '../../lib/bataiLogic';
import { getFarmerProfile, getFarmTasks, saveFarmTasks } from '../../lib/profileAndSecurity';
import { FarmerAvatar } from '../common/FarmerAvatar';
import { AppLogo } from '../common/AppLogo';
import { getTaskCategoryIcon, getRelativeTimeBadge } from '../schedule/ScheduleSection';
import {
  getCropSeasonForDate,
  getRecentCropSeasons,
  calculateCropSeasonAccounting,
} from '../../lib/cropCycles';

interface DashboardSectionProps {
  records: FarmRecord[];
  rentRecords: RentRecord[];
  homeExpenses: HomeExpense[];
  partners?: Partner[];
  partnerCash?: PartnerCashEntry[];
  lang: Lang;
  profile?: FarmerProfile;
  enabledModules?: { rental: boolean; expense: boolean };
  onNavigate: (section: 'dashboard' | 'farm' | 'rent' | 'home' | 'settings' | 'schedule' | 'income_expense' | 'reports') => void;
  onQuickAddFarm?: (type: 'Expense' | 'Sale' | 'Yield') => void;
  onOpenBatai?: () => void;
  onOpenKhets?: () => void;
  onOpenSchedule?: () => void;
  onOpenReports?: () => void;
  onOpenIncomeExpense?: () => void;
}

const money = (value: number) => `₹ ${Math.round(value || 0).toLocaleString('en-IN')}`;

export function DashboardSection({
  records,
  rentRecords = [],
  homeExpenses = [],
  partners = [],
  partnerCash = [],
  lang,
  profile: propProfile,
  enabledModules = { rental: true, expense: true },
  onNavigate,
  onQuickAddFarm,
  onOpenBatai,
  onOpenKhets,
  onOpenSchedule,
  onOpenReports,
  onOpenIncomeExpense,
}: DashboardSectionProps) {
  const isHi = lang === 'hi';
  const profile = propProfile || getFarmerProfile();
  const [tasks, setTasks] = useState<FarmTask[]>(() => getFarmTasks());
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Today formatted date
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [isHi]);

  // Current Month String (YYYY-MM)
  const currentMonthPrefix = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // 6-Month Season Logic (2 crops per year: Kharif & Rabi)
  const recentSeasons = useMemo(() => getRecentCropSeasons(), []);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() => getCropSeasonForDate().id);

  const activeCropSeason = useMemo(() => {
    return recentSeasons.find((s) => s.id === selectedSeasonId) || getCropSeasonForDate();
  }, [recentSeasons, selectedSeasonId]);

  const cropSeasonStats = useMemo(() => {
    return calculateCropSeasonAccounting(records, activeCropSeason, lang);
  }, [records, activeCropSeason, lang]);

  // Compute Aggregates matching Screen 3
  const stats = useMemo(() => {
    let farmExpense = 0;
    let farmIncome = 0;
    let farmPending = 0;
    records.forEach((r) => {
      const amt = getRecordAmount(r);
      if (r.type === 'Expense') {
        farmExpense += amt;
      } else if (r.type === 'Sale') {
        farmIncome += (r.paidAmount !== undefined ? Number(r.paidAmount) : amt);
        farmPending += (r.remainingAmount !== undefined ? Number(r.remainingAmount) : 0);
      }
    });

    let rentReceived = 0;
    let rentPending = 0;
    rentRecords.forEach((r) => {
      rentReceived += Number(r.paidAmount || 0);
      rentPending += Number(r.remainingAmount || 0);
    });

    let homeExp = 0;
    homeExpenses.forEach((r) => {
      homeExp += Number(r.amount || 0);
    });

    const totalIncomeCalc = farmIncome + rentReceived;
    const totalExpenseCalc = farmExpense + homeExp;
    const totalPendingCalc = farmPending + rentPending;
    const netBalanceCalc = totalIncomeCalc - totalExpenseCalc;

    // Real figures strictly computed from user entries
    const income = totalIncomeCalc;
    const expense = totalExpenseCalc;
    const balance = netBalanceCalc;
    const savings = balance > 0 ? balance : 0;
    const pending = totalPendingCalc;

    return {
      income,
      expense,
      balance,
      savings,
      pending,
      farmExpense,
      farmIncome,
      homeExp,
      rentReceived,
    };
  }, [records, rentRecords, homeExpenses]);

  // Toggle Task Completion
  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' } : t
    );
    setTasks(updated);
    saveFarmTasks(updated);
  };

  // Recent transactions list
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount: number;
      isIncome: boolean;
      date: string;
      category: string;
    }> = [];

    // Add latest farm records
    records.slice(0, 3).forEach((r) => {
      const isInc = r.type === 'Sale';
      list.push({
        id: r.id,
        title: isInc ? (r.crop ? `${cropLabel(lang, r.crop)} बिक्री` : 'फसल बिक्री') : (r.expenseCategory || 'खेती खर्च'),
        subtitle: r.field ? `खेत: ${r.field}` : (r.date || ''),
        amount: getRecordAmount(r),
        isIncome: isInc,
        date: r.date || '',
        category: 'farm',
      });
    });

    // Add latest rent record
    if (rentRecords.length > 0) {
      const r = rentRecords[0];
      list.push({
        id: r.id,
        title: `${r.tenant} - किराया`,
        subtitle: r.month || 'मकान/दुकान किराया',
        amount: r.total,
        isIncome: true,
        date: r.date || '',
        category: 'rent',
      });
    }

    // Add latest home expense
    if (homeExpenses.length > 0) {
      const h = homeExpenses[0];
      list.push({
        id: h.id,
        title: h.note || 'घरेलू खर्च',
        subtitle: h.category,
        amount: h.amount,
        isIncome: false,
        date: h.date || '',
        category: 'home',
      });
    }

    return list.slice(0, 4);
  }, [records, rentRecords, homeExpenses, lang]);

  return (
    <div className="max-w-[720px] mx-auto px-3 sm:px-4 space-y-4">
      {/* 1. Header Bar: Leaf Logo + Title + Subtitle + Avatar (Screen 3) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('settings')}
            className="transition-transform active:scale-95 cursor-pointer"
            title="प्रोफ़ाइल देखें"
          >
            <FarmerAvatar size="md" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                <span>Smart Khata</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  किसान
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isHi ? `नमस्ते, ${profile.name || 'किसान भाई'}` : `Namaste, ${profile.name || 'Kisan Bhai'}`}
            </p>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowNotificationModal(!showNotificationModal)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs hover:border-emerald-500 transition-colors cursor-pointer"
            title="सूचनाएं"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#0c1a13]" />
          </button>
        </div>
      </div>

      {/* 2. Hero Balance Card (Dark Green) matching Screen 3 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c5932] via-[#0d6b3c] to-[#073c21] p-5 sm:p-6 text-white shadow-lg shadow-emerald-950/20 border border-emerald-600/40">
        {/* Subtle decorative leaf pattern background */}
        <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-300 via-emerald-200 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-200/90 text-xs font-semibold tracking-wide">
              <span>{isHi ? 'कुल शेष (शुद्ध बचत)' : 'Total Net Balance'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={showBalance ? 'बैलेंस छुपाएं' : 'बैलेंस दिखाएं'}
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
              {showBalance ? money(stats.balance) : '₹ ••••••••'}
            </div>
            <p className="text-xs text-emerald-100/80 mt-1 font-medium">
              {isHi ? 'खेती, किराया व घरेलू खर्च का संकलित बहीखाता' : 'Combined farm, rental and home finances'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100/90">
            <span>{todayDateStr}</span>
            <button
              onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
              className="font-bold underline hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>{isHi ? 'विस्तार देखें' : 'View Ledger'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Grid (2x2) matching Screen 3 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. आमदनी (Income) */}
        <div
          onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
          className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs cursor-pointer hover:border-emerald-500 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isHi ? 'आमदनी' : 'Income'}
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            {money(stats.income)}
          </div>
          <p className="text-[10px] text-emerald-600/80 font-medium">
            {isHi ? 'फसल बिक्री व किराया' : 'Sales & Rent'}
          </p>
        </div>

        {/* 2. खर्च (Expense) */}
        <div
          onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
          className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs cursor-pointer hover:border-rose-500 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isHi ? 'खर्च' : 'Expense'}
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-rose-600 dark:text-rose-400">
            {money(stats.expense)}
          </div>
          <p className="text-[10px] text-rose-500/80 font-medium">
            {isHi ? 'खाद, बीज व घर खर्च' : 'Inputs & Household'}
          </p>
        </div>

        {/* 3. बचत (Savings) */}
        <div
          onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
          className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs cursor-pointer hover:border-blue-500 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isHi ? 'बचत' : 'Savings'}
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">
            {money(stats.savings)}
          </div>
          <p className="text-[10px] text-blue-500/80 font-medium">
            {isHi ? 'सुरक्षित शुद्ध बचत' : 'Retained Savings'}
          </p>
        </div>

        {/* 4. बाकी (Pending Dues) */}
        <div
          onClick={() => enabledModules.rental ? onNavigate('rent') : (onOpenReports ? onOpenReports() : onNavigate('reports'))}
          className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs cursor-pointer hover:border-amber-500 transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isHi ? 'बाकी' : 'Pending'}
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {money(stats.pending)}
          </div>
          <p className="text-[10px] text-amber-500/80 font-medium">
            {isHi ? 'किराया व मंडी बकाया' : 'Receivables & Dues'}
          </p>
        </div>
      </div>

      {/* 6-Month Crop Cycle Ledger Card (साल में 2 फसलें - 6 माह हिसाब) */}
      <div className="dashboard-surface p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-[#1a3525]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sprout size={17} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{isHi ? '6-माह फसल चक्र बहीखाता' : '6-Month Crop Ledger'}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isHi ? 'साल में 2 फसलें' : '2 Crops / Year'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isHi
                  ? activeCropSeason.type === 'Kharif'
                    ? 'खरीफ सत्र (मानसून फसल: जून से नवंबर)'
                    : 'रबी सत्र (सर्दियों की फसल: दिसंबर से मई)'
                  : activeCropSeason.type === 'Kharif'
                  ? 'Kharif Season (Jun - Nov)'
                  : 'Rabi Season (Dec - May)'}
              </p>
            </div>
          </div>

          {/* Season Selector Dropdown */}
          <select
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3c2c] bg-slate-50 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {recentSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {isHi ? s.labelHi : s.labelEn} {s.isCurrent ? (isHi ? '★ (सक्रिय)' : '★ (Active)') : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3 Metrics for this 6-Month Crop */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-100 dark:border-[#1a3525]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
              {isHi ? 'फसल लागत (खर्च)' : 'Crop Cost'}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
              {money(cropSeasonStats.totalExpense)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-100 dark:border-[#1a3525]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
              {isHi ? 'मंडी बिक्री (आमदनी)' : 'Crop Sales'}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {money(cropSeasonStats.totalIncome)}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            cropSeasonStats.netProfit >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
          }`}>
            <span className="text-[10px] font-bold block opacity-80">
              {isHi ? 'शुद्ध फसल लाभ' : 'Net Crop Profit'}
            </span>
            <span className="text-sm sm:text-base font-black font-mono mt-0.5 block">
              {cropSeasonStats.netProfit >= 0 ? '+' : ''}{money(cropSeasonStats.netProfit)}
            </span>
          </div>
        </div>

        {/* Crop-wise breakdown pills if available */}
        {Object.keys(cropSeasonStats.cropWiseBreakdown).length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isHi ? 'इस 6-माह सत्र में दर्ज मुख्य फसलें:' : 'Crop wise breakdown:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(cropSeasonStats.cropWiseBreakdown).map(([cropName, data]) => (
                <div
                  key={cropName}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#07130e] border border-slate-200 dark:border-[#1a3525] text-[11px] flex items-center gap-2"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cropName}:</span>
                  <span className="text-rose-600 font-mono text-[10px]">लागत {money(data.expense)}</span>
                  <span className="text-emerald-600 font-mono text-[10px]">बिक्री {money(data.income)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-dashed border-slate-200 dark:border-[#1e3c2c]">
            <p className="text-[11px] text-slate-400">
              {isHi
                ? `इस 6-महीने के सत्र (${activeCropSeason.shortHi}) में अभी कोई रिकॉर्ड दर्ज नहीं है।`
                : `No entries yet for ${activeCropSeason.shortEn}.`}
            </p>
          </div>
        )}

        {/* Quick button to add farm record for this season */}
        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            {cropSeasonStats.recordsCount} {isHi ? 'प्रविष्टियां दर्ज हैं' : 'entries recorded'}
          </span>
          <button
            type="button"
            onClick={() => onQuickAddFarm ? onQuickAddFarm('Expense') : onNavigate('farm')}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>{isHi ? '+ इस फसल में खर्च/बिक्री जोड़ें' : '+ Add record for this crop'}</span>
          </button>
        </div>
      </div>

      {/* 4. 4 Quick Action Round Buttons matching Screen 3 */}
      <div className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 px-1">
          {isHi ? 'त्वरित सुविधाएं' : 'Quick Features'}
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* खेती */}
          <button
            type="button"
            onClick={() => onNavigate('farm')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition active:scale-95 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 transition-transform">
              <Wheat size={22} />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {isHi ? 'खेती' : 'Farm'}
            </span>
          </button>

          {/* किराया or बटाईदार */}
          {enabledModules.rental ? (
            <button
              type="button"
              onClick={() => onNavigate('rent')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 group-hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-900/20 transition-transform">
                <Building2 size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {isHi ? 'किराया' : 'Rent'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenBatai ? onOpenBatai() : onNavigate('farm')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-600 group-hover:bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-900/20 transition-transform">
                <Users size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {isHi ? 'बटाईदार' : 'Batai'}
              </span>
            </button>
          )}

          {/* घरेलू खर्च or आय-व्यय */}
          {enabledModules.expense ? (
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/40 transition active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-amber-600 group-hover:bg-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-900/20 transition-transform">
                <ShoppingBag size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {isHi ? 'घरेलू खर्च' : 'Home'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-700 group-hover:bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 transition-transform">
                <TrendingUp size={22} />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {isHi ? 'आय-व्यय' : 'Ledger'}
              </span>
            </button>
          )}

          {/* रिपोर्ट */}
          <button
            type="button"
            onClick={() => onOpenReports ? onOpenReports() : onNavigate('reports')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition active:scale-95 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600 group-hover:bg-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-900/20 transition-transform">
              <BarChart3 size={22} />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {isHi ? 'रिपोर्ट' : 'Reports'}
            </span>
          </button>
        </div>
      </div>

      {/* 5. Recent Activity / Transactions */}
      <div className="dashboard-surface p-4 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {isHi ? 'हालिया लेन-देन' : 'Recent Transactions'}
          </h3>
          <button
            onClick={() => onOpenIncomeExpense ? onOpenIncomeExpense() : onNavigate('income_expense')}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isHi ? 'सभी देखें' : 'View All'}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      item.isIncome ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}
                  >
                    {item.isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.subtitle} • {item.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-mono font-bold text-xs sm:text-sm ${
                      item.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.isIncome ? '+' : '-'}{money(item.amount)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {item.isIncome ? (isHi ? 'प्राप्त' : 'Received') : (isHi ? 'भुगतान' : 'Paid')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center">
            {isHi ? 'कोई हालिया प्रविष्टि नहीं है।' : 'No recent transactions.'}
          </p>
        )}
      </div>

      {/* 6. Notification Modal if open */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isHi ? 'सूचनाएं' : 'Notifications'}
              </h4>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {stats.pending > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200">
                  ⏳ {isHi ? `कुल ₹ ${stats.pending.toLocaleString('en-IN')} का भुगतान बकाया है।` : `Total ₹ ${stats.pending.toLocaleString('en-IN')} payment pending.`}
                </div>
              ) : (
                <div className="p-3 text-center text-slate-500">
                  🌾 {isHi ? 'कोई नई सूचना या बकाया नहीं है।' : 'No new notifications.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
