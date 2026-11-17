'use client';

import React, { useState, useEffect } from 'react';
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
  Cloud,
  CloudOff,
  AlertTriangle,
  X,
  FileSpreadsheet,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import { migrateLocalStorageToIndexedDB, STOCKS_STORAGE_KEY } from '../../services/migrationService';
import { clearAllLocalDatabases, persistKhetsToDB, persistStocksToDB } from '../../services/khatadbService';
import { syncEngine, type SyncState } from '../../services/syncService';
import {
  subscribeGoogleSheets,
  connectGoogleSheetsAccount,
  syncAllDataToGoogleSheet,
  getSheetsDataSummary,
  setGoogleSheetsAutoSync,
  disconnectGoogleSheet,
  type SheetsSyncStatus,
  type GoogleSheetMeta,
  type SheetsDataSummary,
} from '../../services/googleSheetsService';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import type { Lang, FarmRecord, RentRecord, HomeExpense, Khet, KhetCrop, StockItem } from '../../lib/types';
import {
  getFarmerProfile,
  saveFarmerProfile,
  getSecuritySettings,
  saveSecuritySettings,
  getLastBackupTimestamp,
  recordBackupTimestamp,
  TASKS_STORAGE_KEY,
  FarmerProfile,
  SecuritySettings,
  hashPin,
} from '../../lib/profileAndSecurity';
import {
  downloadPhysicalBackup,
  RECORDS_STORAGE_KEY,
  KHETS_STORAGE_KEY,
  CROPS_STORAGE_KEY,
  PARTNERS_STORAGE_KEY,
  PARTNER_CASH_STORAGE_KEY,
} from '../../lib/storageMigration';
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
  const [pendingBackup, setPendingBackup] = useState<{
    fileName: string;
    data: Record<string, unknown>;
    summaryCount: number;
  } | null>(null);

  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(() => auth?.currentUser?.email || null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Google Sheets integration state
  const [sheetsStatus, setSheetsStatus] = useState<SheetsSyncStatus>('idle');
  const [sheetsMeta, setSheetsMeta] = useState<GoogleSheetMeta | null>(null);
  const [hasSheetsToken, setHasSheetsToken] = useState<boolean>(false);
  const [pendingSheetsAction, setPendingSheetsAction] = useState<{
    mode: 'sync' | 'create_new' | 'enable_auto';
    summary: SheetsDataSummary;
  } | null>(null);

  useEffect(() => {
    const unsubSync = syncEngine.subscribe((state, pending) => {
      setSyncState(state);
      setPendingSyncCount(pending);
    });
    const unsubSheets = subscribeGoogleSheets((status, meta, hasToken) => {
      setSheetsStatus(status);
      setSheetsMeta(meta);
      setHasSheetsToken(hasToken);
    });
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCloudUserEmail(user?.email || null);
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      unsubSync();
      unsubSheets();
      unsubAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenSheetsConfirm = async (mode: 'sync' | 'create_new' | 'enable_auto') => {
    try {
      if (!hasSheetsToken) {
        await connectGoogleSheetsAccount({ forceConsent: !sheetsMeta });
      }
      const summary = await getSheetsDataSummary();
      setPendingSheetsAction({ mode, summary });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const code = typeof err?.code === 'string' ? err.code : '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        showToast(isHi ? 'Google साइन-इन रद्द कर दिया गया' : 'Google sign-in cancelled');
      } else if (code === 'auth/unauthorized-domain') {
        showToast(isHi ? 'इस वेबसाइट को Firebase में Authorized Domain के रूप में जोड़ें' : 'Add this website to Firebase Authorized domains');
      } else if (code === 'auth/operation-not-allowed') {
        showToast(isHi ? 'Firebase Console में Google Sign-in चालू करें' : 'Enable Google sign-in in the Firebase Console');
      } else {
        showToast(
          `${isHi ? 'Google से जुड़ने में समस्या हुई' : 'Could not connect Google account'}: ${(code || msg).slice(0, 120)}`
        );
      }
    }
  };

  const handleConfirmSheetsAction = async () => {
    if (!pendingSheetsAction) return;
    const { mode } = pendingSheetsAction;
    setPendingSheetsAction(null);

    if (mode === 'enable_auto' && sheetsMeta) {
      setGoogleSheetsAutoSync(true);
    }

    const res = await syncAllDataToGoogleSheet({
      lang,
      createNewSheet: mode === 'create_new',
      appName,
    });

    if (res.success) {
      if (mode === 'enable_auto') {
        setGoogleSheetsAutoSync(true);
      }
      showToast(
        isHi
          ? 'Google Sheet सफलतापूर्वक तैयार व अपडेट हो गई!'
          : 'Google Sheet created and synced successfully!'
      );
    } else {
      showToast(
        res.error || (isHi ? 'Google Sheet अपडेट नहीं हो सकी' : 'Failed to sync Google Sheet')
      );
    }
  };

  const handleManualCloudSync = async () => {
    if (!cloudUserEmail) {
      showToast(
        isHi
          ? 'क्लाउड सिंक के लिए कृपया ऊपर "लॉगिन" से ईमेल अकाउंट जोड़ें।'
          : 'Sign in with Cloud Sync email from header Login to sync.'
      );
      return;
    }
    const res = await syncEngine.syncNow();
    if (res.success) {
      showToast(
        isHi
          ? `क्लाउड सिंक पूर्ण (${res.pushed} अपलोड, ${res.pulled} डाउनलोड)`
          : `Cloud synced (${res.pushed} pushed, ${res.pulled} pulled)`
      );
    } else {
      showToast(
        res.error || (isHi ? 'सिंक पूरा नहीं हो सका, कृपया इंटरनेट जाँचें।' : 'Sync could not complete.')
      );
    }
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

  const applyPendingBackupRestore = async () => {
    if (!pendingBackup) return;
    const backup = pendingBackup.data;
    setPendingBackup(null);

    try {
      const farm = Array.isArray(backup.records) ? backup.records : backup.farmRecords;
      if (Array.isArray(farm)) {
        setFarmRecords(farm as FarmRecord[]);
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(farm));
      }
      if (Array.isArray(backup.khets)) {
        localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(backup.khets));
      }
      if (Array.isArray(backup.crops)) {
        localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(backup.crops));
      }
      if (Array.isArray(backup.khets) || Array.isArray(backup.crops)) {
        const nextKhets = (Array.isArray(backup.khets) ? backup.khets : []) as Khet[];
        const nextCrops = (Array.isArray(backup.crops) ? backup.crops : []) as KhetCrop[];
        await persistKhetsToDB(nextKhets, nextCrops);
      }
      if (Array.isArray(backup.partners)) {
        localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(backup.partners));
      }
      if (Array.isArray(backup.partnerCash)) {
        localStorage.setItem(PARTNER_CASH_STORAGE_KEY, JSON.stringify(backup.partnerCash));
      }
      if (Array.isArray(backup.rentRecords)) {
        setRentRecords(backup.rentRecords as RentRecord[]);
        localStorage.setItem('sk-rent-records', JSON.stringify(backup.rentRecords));
      }
      if (Array.isArray(backup.homeExpenses)) {
        setHomeExpenses(backup.homeExpenses as HomeExpense[]);
        localStorage.setItem('sk-home-expenses', JSON.stringify(backup.homeExpenses));
      }
      if (Array.isArray(backup.stocks)) {
        localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(backup.stocks));
        await persistStocksToDB(backup.stocks as StockItem[]);
      }
      if (Array.isArray(backup.tasks)) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(backup.tasks));
      }
      if ('landSettings' in backup && backup.landSettings !== undefined && backup.landSettings !== null) {
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

      await migrateLocalStorageToIndexedDB();
      window.dispatchEvent(new CustomEvent('sk-data-restored'));
      recordBackupTimestamp();
      setLastBackup(Date.now());
      showToast(isHi ? 'पूरा डेटा और सभी खाते सफलतापूर्वक रिस्टोर हो गए!' : 'Full backup restored successfully!');
    } catch (err) {
      console.error('Error applying backup:', err);
      showToast(isHi ? 'बैकअप रिस्टोर करने में त्रुटि आई' : 'Error restoring backup');
    }
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
        const supportedKeys = [
          'records', 'farmRecords', 'khets', 'crops', 'partners', 'partnerCash',
          'rentRecords', 'homeExpenses', 'stocks', 'tasks', 'landSettings', 'farmerProfile', 'profile',
        ];
        const hasSupportedData = supportedKeys.some((key) => key in backup);
        if (!hasSupportedData) throw new Error('No supported backup data found');

        const summaryCount = [
          backup.records,
          backup.farmRecords,
          backup.khets,
          backup.crops,
          backup.partners,
          backup.partnerCash,
          backup.rentRecords,
          backup.homeExpenses,
          backup.stocks,
          backup.tasks,
        ].reduce<number>((sum, val) => sum + (Array.isArray(val) ? val.length : 0), 0);

        setPendingBackup({
          fileName: file.name,
          data: backup,
          summaryCount,
        });
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
    <div className="w-full max-w-[1050px] mx-auto px-3 sm:px-5 lg:px-6 pb-8 space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 max-w-[90vw] text-center">
          {toastMessage}
        </div>
      )}

      {/* 1. Farmer Profile Card matching Screen 9 */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0">
            <FarmerAvatar size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
              {profile.name || (isHi ? 'किसान प्रोफ़ाइल' : 'Farmer Profile')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {profile.email || (profile.phone ? `📱 ${profile.phone}` : (isHi ? 'विवरण दर्ज नहीं' : 'No details added'))}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
              📍 {profile.village || profile.district ? `${profile.village ? profile.village : ''}${profile.village && profile.district ? ', ' : ''}${profile.district ? profile.district : ''}` : (isHi ? 'गाँव व जिला जोड़ें' : 'Add village & district')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEditProfile(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-[#12271c] transition-colors shrink-0 cursor-pointer"
          title={isHi ? 'प्रोफ़ाइल बदलें' : 'Edit Profile'}
        >
          <Pencil size={18} />
        </button>
      </div>

      {/* 1B. Cloud Sync & Account Card */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            cloudUserEmail && isOnline
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-[#12271c] text-slate-500 dark:text-slate-400'
          }`}>
            {isOnline && cloudUserEmail ? <Cloud size={20} /> : <CloudOff size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {isHi ? 'क्लाउड सिंक व ऑनलाइन बैकअप' : 'Cloud Sync & Backup'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                !isOnline
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : syncState === 'syncing'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  : syncState === 'error'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  : cloudUserEmail
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {!isOnline
                  ? (isHi ? 'ऑफ़लाइन मोड' : 'Offline')
                  : syncState === 'syncing'
                  ? (isHi ? 'सिंक हो रहा है...' : 'Syncing...')
                  : syncState === 'error'
                  ? (isHi ? 'पुनः प्रयास करें' : 'Retry needed')
                  : cloudUserEmail
                  ? (isHi ? 'क्लाउड सक्रिय' : 'Connected')
                  : (isHi ? 'लोकल डिवाइस' : 'Local Only')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {cloudUserEmail
                ? `${cloudUserEmail}${pendingSyncCount > 0 ? ` • ${pendingSyncCount} ${isHi ? 'लंबित बदलाव' : 'pending'}` : isHi ? ' • सभी डेटा सुरक्षित' : ' • Up to date'}`
                : isHi
                ? 'क्लाउड बैकअप के लिए ऊपर "लॉगिन" → "क्लाउड सिंक" से ईमेल जोड़ें'
                : 'Sign in with Cloud Sync email via Login to back up online'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualCloudSync}
          disabled={syncState === 'syncing'}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
        >
          <RefreshCw size={14} className={syncState === 'syncing' ? 'animate-spin' : ''} />
          <span>{syncState === 'syncing' ? (isHi ? 'सिंक हो रहा...' : 'Syncing...') : (isHi ? 'अभी सिंक करें' : 'Sync Now')}</span>
        </button>
      </div>

      {/* 1C. Google Sheets Live Auto-Sync Card */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              sheetsMeta && hasSheetsToken
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-green-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
            }`}>
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {isHi ? 'Google Sheet लाइव हिसाब' : 'Google Sheet Live Sync'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sheetsStatus === 'syncing' || sheetsStatus === 'connecting'
                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : sheetsMeta && hasSheetsToken
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : sheetsMeta
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {sheetsStatus === 'connecting'
                    ? (isHi ? 'जुड़ रहा है...' : 'Connecting...')
                    : sheetsStatus === 'syncing'
                    ? (isHi ? 'शीट अपडेट हो रही...' : 'Updating Sheet...')
                    : sheetsMeta && hasSheetsToken
                    ? (isHi ? 'लाइव जुड़ा है' : 'Active')
                    : sheetsMeta
                    ? (isHi ? 'री-कनेक्ट ज़रूरी' : 'Reconnect Needed')
                    : (isHi ? 'कनेक्ट नहीं' : 'Not Connected')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {sheetsMeta
                  ? `${sheetsMeta.spreadsheetTitle}${sheetsMeta.lastSyncedAt ? ` • ${new Date(sheetsMeta.lastSyncedAt).toLocaleString(isHi ? 'hi-IN' : 'en-IN')}` : ''}`
                  : isHi
                  ? 'आपके Google Drive में पूरा हिसाब (7 टैब में) अपने आप अपडेट रहेगा'
                  : 'Keep a live multi-tab spreadsheet copy of your entire ledger in Google Drive'}
              </p>
            </div>
          </div>

          {!hasSheetsToken ? (
            <button
              type="button"
              onClick={() => handleOpenSheetsConfirm(sheetsMeta ? 'sync' : 'create_new')}
              disabled={sheetsStatus === 'connecting' || sheetsStatus === 'syncing'}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] hover:bg-slate-50 dark:hover:bg-[#12271c] text-slate-800 dark:text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shrink-0 disabled:opacity-60"
            >
              <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>
                {sheetsMeta
                  ? (isHi ? 'Sign in with Google (पुनः जोड़ें)' : 'Sign in with Google to Sync')
                  : (isHi ? 'Sign in with Google' : 'Sign in with Google')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenSheetsConfirm('sync')}
              disabled={sheetsStatus === 'syncing'}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
            >
              <RefreshCw size={14} className={sheetsStatus === 'syncing' ? 'animate-spin' : ''} />
              <span>{sheetsStatus === 'syncing' ? (isHi ? 'अपडेट हो रहा...' : 'Updating...') : (isHi ? 'अभी शीट अपडेट करें' : 'Update Sheet Now')}</span>
            </button>
          )}
        </div>

        {sheetsMeta && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-[#1a3525] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={sheetsMeta.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
              >
                <ExternalLink size={13} />
                <span>{isHi ? 'Google Sheet खोलें' : 'Open Google Sheet'}</span>
              </a>

              <button
                type="button"
                onClick={() => handleOpenSheetsConfirm('create_new')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3c2c] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#12271c] font-semibold cursor-pointer"
              >
                {isHi ? 'नई शीट बनाएँ' : 'Create New Sheet'}
              </button>

              <button
                type="button"
                onClick={() => {
                  disconnectGoogleSheet();
                  showToast(isHi ? 'Google Sheet लिंक हटा दिया गया' : 'Google Sheet unlinked');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold cursor-pointer"
              >
                <Unlink size={12} />
                <span>{isHi ? 'हटाएँ' : 'Unlink'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {isHi ? 'ऑटो-अपडेट:' : 'Auto-Update:'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={sheetsMeta.autoSyncEnabled}
                onClick={() => {
                  if (sheetsMeta.autoSyncEnabled) {
                    setGoogleSheetsAutoSync(false);
                    showToast(isHi ? 'Google Sheet ऑटो-अपडेट बंद किया गया' : 'Google Sheet auto-update paused');
                  } else {
                    handleOpenSheetsConfirm('enable_auto');
                  }
                }}
                className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  sheetsMeta.autoSyncEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
                aria-label={isHi ? 'Google Sheet ऑटो-अपडेट' : 'Google Sheet Auto-Update'}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        )}
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
        <div className="space-y-3 p-3.5 sm:p-4 rounded-3xl bg-slate-50 dark:bg-[#07130e] border border-slate-200 dark:border-[#1e3c2c] animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            {isHi ? 'सुरक्षा एवं माप प्राथमिकताएं' : 'Security & Measurement Preferences'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Optional modules: hide navigation without deleting saved records */}
          <div className="md:col-span-2 p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{isHi ? 'अपने ऐप के मॉड्यूल चुनें' : 'Choose Your App Modules'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{isHi ? 'बंद करने पर मॉड्यूल छिपेगा; पुराने रिकॉर्ड डिलीट नहीं होंगे।' : 'Turning a module off hides it; saved records are not deleted.'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'rental' as const, title: isHi ? 'किराया (Rental)' : 'Rental', detail: isHi ? 'मकान और दुकान का किराया' : 'House and shop rent' },
              { key: 'expense' as const, title: isHi ? 'घरेलू खर्च (Expense)' : 'Household Expense', detail: isHi ? 'घर के खर्च का रिकॉर्ड' : 'Household expense records' },
            ].map((module) => (
              <div key={module.key} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-100 dark:border-[#1a3525]">
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{module.title}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">{module.detail}</p></div>
                <button type="button" role="switch" aria-checked={enabledModules[module.key]} onClick={() => onEnabledModulesChange({ ...enabledModules, [module.key]: !enabledModules[module.key] })} className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 transition-colors cursor-pointer ${enabledModules[module.key] ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`} aria-label={module.title}>
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {theme === 'dark' ? <Moon size={18} className="text-emerald-400 shrink-0" /> : <Sun size={18} className="text-amber-500 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                  {isHi ? 'थीम मोड' : 'Theme Mode'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {theme === 'dark' ? (isHi ? 'डार्क मोड सक्रिय है' : 'Dark Mode') : (isHi ? 'लाइट मोड सक्रिय है' : 'Light Mode')}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold border border-slate-300 dark:border-[#1e3c2c] bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (isHi ? 'लाइट करें ☀️' : 'Light ☀️') : (isHi ? 'डार्क करें 🌙' : 'Dark 🌙')}
            </button>
          </div>

          {/* Land Units Modal Trigger */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Compass size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
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
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHi ? 'बदलें' : 'Change'}
            </button>
          </div>

          {/* PIN Lock Toggle */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Shield size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'ऐप पिन सुरक्षा (PIN Lock)' : 'App PIN Lock'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {security.isLockEnabled ? (isHi ? 'पिन लॉक सक्रिय है' : 'Lock Enabled') : (isHi ? 'पिन लॉक बंद है' : 'Disabled')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {security.isLockEnabled && (
                <button
                  onClick={() => setShowChangePin(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#12271c] whitespace-nowrap cursor-pointer"
                >
                  {isHi ? 'पिन बदलें' : 'Change PIN'}
                </button>
              )}
              <button
                onClick={handleTogglePinLock}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  security.isLockEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Backup Download */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Download size={18} className="text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
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
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3c2c] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHi ? 'डाउनलोड' : 'Download'}
            </button>
          </div>

          {/* IndexedDB Database Status & Safe Migration */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Database size={18} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="min-w-0 flex-1">
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
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              {isHi ? 'जाँचें/सिंक' : 'Verify'}
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1a3525] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Upload size={18} className="text-indigo-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isHi ? 'बैकअप फ़ाइल लोड करें' : 'Restore Data'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isHi ? 'पुरानी बैकअप फ़ाइल से डेटा पुनर्स्थापित करें' : 'Restore from backup file'}
                </p>
              </div>
            </div>
            <label className="min-h-[36px] inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#12271c] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e3c2c] cursor-pointer whitespace-nowrap shrink-0">
              <span>{isHi ? 'फ़ाइल चुनें' : 'Choose'}</span>
              <input type="file" accept=".json" onChange={handleRestoreBackupFile} className="hidden" />
            </label>
          </div>

          {/* Reset Data */}
          <div className="md:col-span-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-rose-800 dark:text-rose-300">
                {isHi ? 'खाता रीसेट करें' : 'Reset All Data'}
              </p>
              <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
                {isHi ? 'सावधानी: सभी खेत, फसल व खर्च मिट जाएंगे' : 'Warning: deletes all local records'}
              </p>
            </div>
            <button
              onClick={() => setShowResetData(true)}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isHi ? 'रीसेट' : 'Reset'}
            </button>
          </div>
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
          onConfirmReset={async (mode) => {
            await clearAllLocalDatabases({
              keepProfileAndSettings: mode === 'sample',
            });
            window.location.reload();
          }}
        />
      )}

      {/* Restore Backup Confirmation Modal */}
      {pendingBackup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingBackup(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--sk-text)] truncate">
                    {isHi ? 'बैकअप डेटा रिस्टोर करें?' : 'Restore Backup File?'}
                  </h3>
                  <p className="text-[11px] text-[var(--sk-muted)] truncate">{pendingBackup.fileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {isHi
                ? `इस बैकअप फ़ाइल में ${pendingBackup.summaryCount} रिकॉर्ड मिले हैं। रिस्टोर करने पर फ़ाइल के खाते और सेटिंग्स ऐप में लोड हो जाएंगे।`
                : `Found ${pendingBackup.summaryCount} records in this backup file. Restoring will replace matching local records with the backup contents.`}
            </div>

            <div className="flex flex-col-reverse xs:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="flex-1 min-h-[40px] px-4 py-2 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-[var(--sk-text)] cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={applyPendingBackupRestore}
                className="flex-1 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                {isHi ? 'हाँ, रिस्टोर करें' : 'Yes, Restore Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Explicit Write/Update Confirmation Modal */}
      {pendingSheetsAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingSheetsAction(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] shadow-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--sk-text)] truncate">
                    {pendingSheetsAction.mode === 'create_new' || !sheetsMeta
                      ? (isHi ? 'नई Google Sheet बनाएँ और डेटा भेजें?' : 'Create & Sync New Google Sheet?')
                      : pendingSheetsAction.mode === 'enable_auto'
                      ? (isHi ? 'Google Sheet ऑटो-अपडेट चालू करें?' : 'Enable Automatic Sheet Updates?')
                      : (isHi ? 'Google Sheet का डेटा अपडेट करें?' : 'Update Google Sheet Data?')}
                  </h3>
                  <p className="text-[11px] text-[var(--sk-muted)] truncate">
                    {sheetsMeta && pendingSheetsAction.mode !== 'create_new'
                      ? sheetsMeta.spreadsheetTitle
                      : `${appName} - ${isHi ? 'मेरा पूरा हिसाब' : 'Complete Ledger'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingSheetsAction(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-[var(--sk-text)] space-y-2">
              <p className="font-semibold">
                {isHi
                  ? `आपकी Google Sheet के 7 टैब (${pendingSheetsAction.summary.totalRows} कुल प्रविष्टियाँ) अपडेट किए जाएँगे:`
                  : `The following 7 spreadsheet tabs (${pendingSheetsAction.summary.totalRows} total records) will be updated:`}
              </p>
              <ul className="text-[11px] text-[var(--sk-muted)] grid grid-cols-2 gap-1 font-mono">
                <li>• Summary (सारांश)</li>
                <li>• Farm_Ledger ({pendingSheetsAction.summary.farmRecordsCount})</li>
                <li>• Fields_Crops ({pendingSheetsAction.summary.khetsCount + pendingSheetsAction.summary.cropsCount})</li>
                <li>• Batai_Ledger ({pendingSheetsAction.summary.partnersCount + pendingSheetsAction.summary.partnerCashCount})</li>
                <li>• Rent_Ledger ({pendingSheetsAction.summary.rentRecordsCount})</li>
                <li>• Home_Expenses ({pendingSheetsAction.summary.homeExpensesCount})</li>
                <li className="col-span-2">• Stock_And_Tasks ({pendingSheetsAction.summary.stocksCount + pendingSheetsAction.summary.tasksCount})</li>
              </ul>
              {pendingSheetsAction.mode === 'enable_auto' && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-1">
                  {isHi
                    ? 'ऑटो-अपडेट चालू करने पर जब भी आप इस सत्र में ऐप में रिकॉर्ड बदलेंगे, आपकी यह Google Sheet अपने आप अपडेट होती रहेगी।'
                    : 'While auto-update is on during an active Google session, new or edited records will automatically update this spreadsheet.'}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse xs:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingSheetsAction(null)}
                className="flex-1 min-h-[40px] px-4 py-2 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-[var(--sk-text)] cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSheetsAction}
                className="flex-1 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                {isHi ? 'हाँ, शीट अपडेट करें' : 'Confirm & Sync Sheet'}
              </button>
            </div>
          </div>
        </div>
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
