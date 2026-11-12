'use client';

import React, { useState } from 'react';
import {
  User,
  Wheat,
  Sprout,
  TrendingUp,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  Languages,
  LogOut,
  ChevronRight,
  Pencil,
  Shield,
  KeyRound,
  Download,
  Upload,
  Compass,
  Moon,
  Sun,
  RefreshCw,
  Check,
  Database,
} from 'lucide-react';
import { migrateLocalStorageToIndexedDB } from '../../services/migrationService';
import type { Lang, FarmRecord, RentRecord, HomeExpense } from '../../lib/types';
import {
  getFarmerProfile,
  saveFarmerProfile,
  getSecuritySettings,
  saveSecuritySettings,
  getLastBackupTimestamp,
  recordBackupTimestamp,
  FarmerProfile,
  SecuritySettings,
  hashPin,
} from '../../lib/profileAndSecurity';
import { downloadPhysicalBackup } from '../../lib/storageMigration';
import { EditProfileModal } from './EditProfileModal';
import { ChangePinModal } from './ChangePinModal';
import { ResetDataModal } from './ResetDataModal';
import { LandSettingsModal } from '../farm/LandSettingsModal';
import { FarmerAvatar } from '../common/FarmerAvatar';

interface SettingsSectionProps {
  lang: Lang;
  toggleLang: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  appName?: string;
  setAppName?: (name: string) => void;
  farmRecords: FarmRecord[];
  setFarmRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  rentRecords: RentRecord[];
  setRentRecords: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  homeExpenses: HomeExpense[];
  setHomeExpenses: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
  enabledModules: { rental: boolean; expense: boolean };
  onEnabledModulesChange: (modules: { rental: boolean; expense: boolean }) => void;
  onNavigateToKhets?: () => void;
  onNavigateToCrops?: () => void;
  onNavigateToIncomeExpense?: () => void;
  onNavigateToStock?: () => void;
  onNavigateToBatai?: () => void;
  onNavigateToReports?: () => void;
  onLogout?: () => void;
  onProfileChange?: (profile: FarmerProfile) => void;
}

export function SettingsSection({
  lang,
  toggleLang,
  theme,
  toggleTheme,
  appName = 'स्मार्ट खाता',
  setAppName,
  farmRecords,
  setFarmRecords,
  rentRecords,
  setRentRecords,
  homeExpenses,
  setHomeExpenses,
  enabledModules,
  onEnabledModulesChange,
  onNavigateToKhets,
  onNavigateToCrops,
  onNavigateToIncomeExpense,
  onNavigateToStock,
  onNavigateToBatai,
  onNavigateToReports,
  onLogout,
  onProfileChange,
}: SettingsSectionProps) {
  const isHi = lang === 'hi';

  const [profile, setProfile] = useState<FarmerProfile>(() => getFarmerProfile());
  const [security, setSecurity] = useState<SecuritySettings>(() => getSecuritySettings());
  const [lastBackup, setLastBackup] = useState<number | null>(() => getLastBackupTimestamp());

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showResetData, setShowResetData] = useState(false);
  const [showLandModal, setShowLandModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = (updated: FarmerProfile) => {
    setProfile(updated);
    saveFarmerProfile(updated);
    if (onProfileChange) {
      onProfileChange(updated);
    }
    showToast(isHi ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!' : 'Profile updated successfully!');
  };

  const handleSavePin = (newPin: string) => {
    const updated: SecuritySettings = {
      ...security,
      pinHash: hashPin(newPin),
      isLockEnabled: true,
    };
    setSecurity(updated);
    saveSecuritySettings(updated);
    showToast(isHi ? 'सुरक्षा पिन सफलतापूर्वक सेट हो गया!' : 'Security PIN updated successfully!');
  };

  const handleTogglePinLock = () => {
    const updated: SecuritySettings = {
      ...security,
      isLockEnabled: !security.isLockEnabled,
    };
    setSecurity(updated);
    saveSecuritySettings(updated);
    showToast(
      updated.isLockEnabled
        ? isHi
          ? 'पिन सुरक्षा चालू कर दी गई है'
          : 'PIN protection enabled'
        : isHi
        ? 'पिन सुरक्षा बंद कर दी गई है'
        : 'PIN protection disabled'
    );
  };

  const handleBackupDownload = () => {
    downloadPhysicalBackup();
    recordBackupTimestamp();
    setLastBackup(Date.now());
    showToast(isHi ? 'बैकअप फ़ाइल डाउनलोड हो गई!' : 'Backup file downloaded successfully!');
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: unknown = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Backup must be a JSON object');
        }
        const backup = parsed as Record<string, unknown>;
        const hasSupportedData = [
          'records', 'farmRecords', 'khets', 'crops', 'partners', 'partnerCash',
          'rentRecords', 'homeExpenses', 'stocks', 'landSettings', 'farmerProfile', 'profile',
        ].some((key) => key in backup);
        if (!hasSupportedData) throw new Error('No supported backup data found');

        const confirmed = window.confirm(
          isHi
            ? 'बैकअप से मौजूद डेटा बदला जा सकता है। पहले वर्तमान डेटा का बैकअप रखें। क्या आप जारी रखना चाहते हैं?'
            : 'Restoring this backup may replace current data. Make a backup first. Continue?'
        );
        if (!confirmed) return;

        // Supports both the current physical backup format and older backup exports.
        const farm = Array.isArray(backup.records) ? backup.records : backup.farmRecords;
        if (Array.isArray(farm)) {
          setFarmRecords(farm as FarmRecord[]);
          localStorage.setItem('kisan-sathi-records', JSON.stringify(farm));
        }
        if (Array.isArray(backup.khets)) localStorage.setItem('kisan-sathi-khets', JSON.stringify(backup.khets));
        if (Array.isArray(backup.crops)) localStorage.setItem('kisan-sathi-khet-crops', JSON.stringify(backup.crops));
        if (Array.isArray(backup.partners)) localStorage.setItem('sk-partners', JSON.stringify(backup.partners));
        if (Array.isArray(backup.partnerCash)) localStorage.setItem('sk-partner-cash', JSON.stringify(backup.partnerCash));

        if (Array.isArray(backup.rentRecords)) {
          setRentRecords(backup.rentRecords as RentRecord[]);
          localStorage.setItem('sk-rent-records', JSON.stringify(backup.rentRecords));
        }
        if (Array.isArray(backup.homeExpenses)) {
          setHomeExpenses(backup.homeExpenses as HomeExpense[]);
          localStorage.setItem('sk-home-expenses', JSON.stringify(backup.homeExpenses));
        }
        if (Array.isArray(backup.stocks)) localStorage.setItem('kisan-sathi-stocks', JSON.stringify(backup.stocks));
        if ('landSettings' in backup && backup.landSettings !== undefined) {
          localStorage.setItem('sk-land-settings', JSON.stringify(backup.landSettings));
        }

        const restoredProfile = backup.farmerProfile ?? backup.profile;
        if (restoredProfile && typeof restoredProfile === 'object' && !Array.isArray(restoredProfile)) {
          setProfile(restoredProfile as FarmerProfile);
          saveFarmerProfile(restoredProfile as FarmerProfile);
          onProfileChange?.(restoredProfile as FarmerProfile);
        }
        if (typeof backup.appName === 'string' && backup.appName.trim()) {
          localStorage.setItem('sk-app-name', backup.appName.trim());
          setAppName?.(backup.appName.trim());
        }

        recordBackupTimestamp();
        setLastBackup(Date.now());
        showToast(isHi ? 'बैकअप सफलतापूर्वक रिस्टोर हो गया!' : 'Backup restored successfully!');
      } catch (err) {
        console.error('Backup restore failed:', err);
        showToast(isHi ? 'बैकअप फ़ाइल सही नहीं है या पढ़ी नहीं जा सकी' : 'Invalid or unreadable backup file');
      }
    };
    reader.onerror = () => showToast(isHi ? 'फ़ाइल पढ़ने में समस्या हुई' : 'Could not read backup file');
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-[720px] mx-auto px-3 sm:px-4 pb-20 space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* 1. Farmer Profile Card matching Screen 9 */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <FarmerAvatar size="lg" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {profile.name || (isHi ? 'किसान प्रोफ़ाइल' : 'Farmer Profile')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile.email || (profile.phone ? `📱 ${profile.phone}` : (isHi ? 'विवरण दर्ज नहीं' : 'No details added'))}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              📍 {profile.village || profile.district ? `${profile.village ? profile.village : ''}${profile.village && profile.district ? ', ' : ''}${profile.district ? profile.district : ''}` : (isHi ? 'गाँव व जिला जोड़ें' : 'Add village & district')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEditProfile(true)}
          className="p-2.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-[#12271c] transition-colors"
          title={isHi ? 'प्रोफ़ाइल बदलें' : 'Edit Profile'}
        >
          <Pencil size={18} />
        </button>
      </div>

      {/* 2. Menu List matching Screen 9 */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-[#1a3525]">
        {/* मेरी जानकारी */}
        <button
          onClick={() => setShowEditProfile(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'मेरी जानकारी' : 'My Profile'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* खेत प्रबंधन */}
        <button
          onClick={onNavigateToKhets}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 flex items-center justify-center">
              <Wheat size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'खेत प्रबंधन' : 'Field Management'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* फसल प्रबंधन */}
        <button
          onClick={onNavigateToCrops}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sprout size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'फसल प्रबंधन' : 'Crop Management'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* खर्च और आमदनी */}
        <button
          onClick={onNavigateToIncomeExpense}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'खर्च और आमदनी' : 'Income & Expenses'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* स्टॉक प्रबंधन */}
        <button
          onClick={onNavigateToStock}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Warehouse size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'स्टॉक प्रबंधन' : 'Stock Management'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* मजदूर और उधार / बटाईदार */}
        <button
          onClick={onNavigateToBatai}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'मजदूर और उधार (बटाईदार)' : 'Labor & Credit / Batai'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* रिपोर्ट्स */}
        <button
          onClick={onNavigateToReports}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'रिपोर्ट्स' : 'Reports & Analytics'}
            </span>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </button>

        {/* ऐप सेटिंग्स */}
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Settings size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isHi ? 'ऐप सेटिंग्स' : 'App Settings'}
            </span>
          </div>
          <ChevronRight
            size={18}
            className={`text-slate-400 group-hover:text-emerald-600 transition-transform ${
              showAdvancedSettings ? 'rotate-90' : ''
            }`}
          />
        </button>

        {/* भाषा (हिंदी) */}
        <button
          onClick={toggleLang}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#07130e] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Languages size={16} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                {isHi ? 'भाषा (हिंदी)' : 'Language (English)'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isHi ? 'English में बदलने के लिए टैप करें' : 'Tap to switch to Hindi'}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50">
            {isHi ? 'हिंदी' : 'EN'}
          </span>
        </button>

        {/* लॉग आउट */}
        <button
          onClick={onLogout}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400">
              {isHi ? 'लॉग आउट' : 'Log Out'}
            </span>
          </div>
          <ChevronRight size={18} className="text-rose-400" />
        </button>
      </div>

      {/* 3. Advanced App Settings Expansion */}
      {showAdvancedSettings && (
        <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-[#07130e] border border-slate-200 dark:border-[#1e3c2c] animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            {isHi ? 'सुरक्षा एवं माप प्राथमिकताएं' : 'Security & Measurement Preferences'}
          </h3>

          {/* Optional modules: hide navigation without deleting saved records */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{isHi ? 'अपने ऐप के मॉड्यूल चुनें' : 'Choose Your App Modules'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{isHi ? 'बंद करने पर मॉड्यूल छिपेगा; पुराने रिकॉर्ड डिलीट नहीं होंगे।' : 'Turning a module off hides it; saved records are not deleted.'}</p>
            </div>
            {[
              { key: 'rental' as const, title: isHi ? 'किराया (Rental)' : 'Rental', detail: isHi ? 'मकान और दुकान का किराया' : 'House and shop rent' },
              { key: 'expense' as const, title: isHi ? 'घरेलू खर्च (Expense)' : 'Household Expense', detail: isHi ? 'घर के खर्च का रिकॉर्ड' : 'Household expense records' },
            ].map((module) => (
              <div key={module.key} className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{module.title}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">{module.detail}</p></div>
                <button type="button" role="switch" aria-checked={enabledModules[module.key]} onClick={() => onEnabledModulesChange({ ...enabledModules, [module.key]: !enabledModules[module.key] })} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${enabledModules[module.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`} aria-label={module.title}>
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            ))}
          </div>

          {/* Theme Toggle */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Moon size={18} className="text-emerald-400" /> : <Sun size={18} className="text-amber-500" />}
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'थीम मोड' : 'Theme Mode'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {theme === 'dark' ? (isHi ? 'डार्क मोड सक्रिय है' : 'Dark Mode') : (isHi ? 'लाइट मोड सक्रिय है' : 'Light Mode')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-[#1e3c2c] bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200"
            >
              {theme === 'dark' ? (isHi ? 'लाइट करें ☀️' : 'Light ☀️') : (isHi ? 'डार्क करें 🌙' : 'Dark 🌙')}
            </button>
          </div>

          {/* Land Units Modal Trigger */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass size={18} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'ज़मीन माप की इकाई (बीघा/एकड़)' : 'Land Measurement Units'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isHi ? 'अपने राज्य व क्षेत्र अनुसार बीघा व बिस्वा सेट करें' : 'Set Bigha size per your region'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLandModal(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isHi ? 'बदलें' : 'Change'}
            </button>
          </div>

          {/* PIN Lock Toggle */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'ऐप पिन सुरक्षा (PIN Lock)' : 'App PIN Lock'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {security.isLockEnabled ? (isHi ? 'पिन लॉक सक्रिय है' : 'Lock Enabled') : (isHi ? 'पिन लॉक बंद है' : 'Disabled')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {security.isLockEnabled && (
                <button
                  onClick={() => setShowChangePin(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#12271c]"
                >
                  {isHi ? 'पिन बदलें' : 'Change PIN'}
                </button>
              )}
              <button
                onClick={handleTogglePinLock}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  security.isLockEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Backup Download */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Download size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'ऑफलाइन बैकअप डाउनलोड' : 'Download Backup'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isHi ? 'पूरा डेटा सुरक्षित JSON फ़ाइल में सहेजें' : 'Save full data offline'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {lastBackup
                    ? `${isHi ? 'आखिरी बैकअप' : 'Last backup'}: ${new Date(lastBackup).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}`
                    : (isHi ? 'अभी तक बैकअप दर्ज नहीं है' : 'No backup recorded yet')}
                </p>
              </div>
            </div>
            <button
              onClick={handleBackupDownload}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3c2c]"
            >
              {isHi ? 'डाउनलोड' : 'Download'}
            </button>
          </div>

          {/* IndexedDB Database Status & Safe Migration */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database size={18} className="text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'स्मार्ट डेटाबेस (IndexedDB Pro)' : 'Smart Database (IndexedDB)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isHi ? 'ऑफलाइन उच्च-क्षमता डेटाबेस सक्रिय है' : 'High-capacity offline database active'}
                </p>
                <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {farmRecords.length} {isHi ? 'खेती' : 'Farm'}, {rentRecords.length} {isHi ? 'किराया' : 'Rent'}, {homeExpenses.length} {isHi ? 'खर्च' : 'Expense'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await migrateLocalStorageToIndexedDB();
                if (res.success) {
                  showToast(isHi ? 'IndexedDB में डेटा सुरक्षित सिंक हो गया!' : 'IndexedDB synchronized successfully!');
                } else {
                  showToast(isHi ? 'माइग्रेशन पूरा नहीं हो सका' : 'Migration failed');
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer"
            >
              {isHi ? 'जाँचें/सिंक' : 'Verify'}
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Upload size={18} className="text-indigo-600" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'बैकअप फ़ाइल लोड करें' : 'Restore Data'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isHi ? 'पुरानी बैकअप फ़ाइल से डेटा पुनर्स्थापित करें' : 'Restore from backup file'}
                </p>
              </div>
            </div>
            <label className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3c2c] cursor-pointer">
              <span>{isHi ? 'फ़ाइल चुनें' : 'Choose'}</span>
              <input type="file" accept=".json" onChange={handleRestoreBackupFile} className="hidden" />
            </label>
          </div>

          {/* Reset Data */}
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-300">
                {isHi ? 'खाता रीसेट करें' : 'Reset All Data'}
              </p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                {isHi ? 'सावधानी: सभी खेत, फसल व खर्च मिट जाएंगे' : 'Warning: deletes all local records'}
              </p>
            </div>
            <button
              onClick={() => setShowResetData(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isHi ? 'रीसेट' : 'Reset'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditProfile && (
        <EditProfileModal
          isOpen={showEditProfile}
          profile={profile}
          lang={lang}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showChangePin && (
        <ChangePinModal
          isOpen={showChangePin}
          currentPin={security.pin}
          currentPinHash={security.pinHash}
          lang={lang}
          onClose={() => setShowChangePin(false)}
          onSavePin={handleSavePin}
        />
      )}

      {showResetData && (
        <ResetDataModal
          isOpen={showResetData}
          lang={lang}
          onClose={() => setShowResetData(false)}
          onConfirmReset={() => {
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}

      {showLandModal && (
        <LandSettingsModal
          isOpen={showLandModal}
          onClose={() => setShowLandModal(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
