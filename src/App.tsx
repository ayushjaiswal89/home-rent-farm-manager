/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wheat,
  Building2,
  ShoppingBag,
  Settings,
  Languages,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
  Home,
  Sprout,
  Warehouse,
  Plus,
  User,
} from 'lucide-react';
import { FarmRecord, Lang, Partner, PartnerCashEntry, RentRecord, HomeExpense, FarmTask, FarmerProfile } from './lib/types';
import { FarmSection } from './components/farm/FarmSection';
import { RentSection } from './components/rent/RentSection';
import { HomeSection } from './components/home/HomeSection';
import { DashboardSection } from './components/home/DashboardSection';
import { SettingsSection } from './components/settings/SettingsSection';
import { ScheduleSection } from './components/schedule/ScheduleSection';
import { IncomeExpenseSection } from './components/income_expense/IncomeExpenseSection';
import { ReportsSection } from './components/reports/ReportsSection';
import { AuthScreen } from './components/auth/AuthScreen';
import { PinLockScreen } from './components/security/PinLockScreen';
import { UnifiedAddRecordModal } from './components/common/UnifiedAddRecordModal';
import {
  DEFAULT_RECORDS,
  RECORDS_STORAGE_KEY,
  KHETS_STORAGE_KEY,
  CROPS_STORAGE_KEY,
  PARTNERS_STORAGE_KEY,
  PARTNER_CASH_STORAGE_KEY,
} from './lib/storageMigration';
import {
  getSecuritySettings,
  getFarmTasks,
  getFarmerProfile,
  saveFarmerProfile,
  logoutUser,
  PROFILE_STORAGE_KEY,
  TASKS_STORAGE_KEY,
} from './lib/profileAndSecurity';
import { AppLogo } from './components/common/AppLogo';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { SyncStatusBadge } from './components/common/SyncStatusBadge';
import { initStorageEngine, registerAutoSyncCallback, syncCollectionToDb } from './services/khatadbService';
import { CLOUD_SYNCED_EVENT, syncEngine } from './services/syncService';
import { STOCKS_STORAGE_KEY } from './services/migrationService';
import './services/googleSheetsService';
import { db } from './db/khatadb';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';

const RENT_STORAGE_KEY = 'sk-rent-records';
const HOME_STORAGE_KEY = 'sk-home-expenses';
const APP_NAME_STORAGE_KEY = 'sk-app-name';

const DEFAULT_RENT_RECORDS: RentRecord[] = [];

const DEFAULT_HOME_EXPENSES: HomeExpense[] = [];

export default function App() {
  const [lang, setLang] = useState<Lang>('hi');
  const isHi = lang === 'hi';
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'farm' | 'rent' | 'home' | 'settings' | 'schedule' | 'income_expense' | 'reports'
  >('dashboard');
  const [enabledModules, setEnabledModules] = useState<{ rental: boolean; expense: boolean }>(() => {
    if (typeof window === 'undefined') return { rental: true, expense: true };
    try {
      const saved = JSON.parse(localStorage.getItem('sk-enabled-modules') || '{}');
      return { rental: saved.rental !== false, expense: saved.expense !== false };
    } catch { return { rental: true, expense: true }; }
  });

  useEffect(() => {
    localStorage.setItem('sk-enabled-modules', JSON.stringify(enabledModules));
    if (activeNav === 'rent' && !enabledModules.rental) setActiveNav('dashboard');
    if (activeNav === 'home' && !enabledModules.expense) setActiveNav('dashboard');
  }, [enabledModules, activeNav]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showUnifiedAddModal, setShowUnifiedAddModal] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sk-is-logged-in');
      if (saved === 'true') return true;
      if (saved === 'false') return false;
      // For first-time visitors (saved === null): check if user already has an active named profile
      const prof = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (prof) {
        try {
          const parsed = JSON.parse(prof);
          if (parsed && typeof parsed.name === 'string' && parsed.name.trim() !== '') {
            return true;
          }
        } catch {}
      }
      return false; // New users see AuthScreen
    }
    return false;
  });
  const [profile, setProfile] = useState<FarmerProfile>(() => getFarmerProfile());
  const [tasks, setTasks] = useState<FarmTask[]>(() => getFarmTasks());
  const [appName, setAppName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(APP_NAME_STORAGE_KEY) || (isHi ? 'स्मार्ट खाता' : 'Smart Khata');
    }
    return (isHi ? 'स्मार्ट खाता' : 'Smart Khata');
  });

  const displayAppName = React.useMemo(() => {
    const trimmed = (appName || '').trim();
    if (!isHi) {
      if (trimmed === 'स्मार्ट खाता' || trimmed === 'स्मार्ट खाता ' || trimmed === 'स्मार्ट खात' || !trimmed) {
        return 'Smart Khata';
      }
      if (trimmed === 'कृषि मुनीम') return 'Krishi Muneem';
      if (trimmed === 'खेत खाता') return 'Khet Khata';
      if (trimmed === 'बटाई साथी') return 'Batai Sathi';
      if (trimmed === 'धन-धान्य बहीखाता') return 'Dhan Dhanya';
      if (trimmed === 'किसान खतौनी') return 'Kisan Khatauni';
    } else {
      if (trimmed === 'Smart Khata' || trimmed === 'Smart Khaata' || !trimmed) {
        return 'स्मार्ट खाता';
      }
      if (trimmed === 'Krishi Muneem') return 'कृषि मुनीम';
      if (trimmed === 'Khet Khata') return 'खेत खाता';
      if (trimmed === 'Batai Sathi') return 'बटाई साथी';
      if (trimmed === 'Dhan Dhanya') return 'धन-धान्य बहीखाता';
      if (trimmed === 'Kisan Khatauni') return 'किसान खतौनी';
    }
    return appName;
  }, [appName, isHi]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_NAME_STORAGE_KEY, appName);
    }
  }, [appName]);

  // Security Lock
  const [security, setSecurity] = useState(() => getSecuritySettings());
  const [isUnlocked, setIsUnlocked] = useState(() => !getSecuritySettings().isLockEnabled);

  // Farm Records
  const [records, setRecords] = useState<FarmRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  // Partners
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PARTNERS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return [];
  });

  // Partner cash entries
  const [partnerCash, setPartnerCash] = useState<PartnerCashEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PARTNER_CASH_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return [];
  });

  // Rent Records
  const [rentRecords, setRentRecords] = useState<RentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RENT_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  // Home Expenses
  const [homeExpenses, setHomeExpenses] = useState<HomeExpense[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HOME_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch { }
      }
    }
    return [];
  });

  const skipNextCloudSyncRef = useRef<{
    records: boolean;
    partners: boolean;
    partnerCash: boolean;
    rentRecords: boolean;
    homeExpenses: boolean;
    tasks: boolean;
  }>({
    records: false,
    partners: false,
    partnerCash: false,
    rentRecords: false,
    homeExpenses: false,
    tasks: false,
  });

  // Hydrate from IndexedDB before allowing the localStorage mirror to write.
  useEffect(() => {
    let cancelled = false;

    const hydrateStorage = async () => {
      await initStorageEngine();
      const [
        storedRecords,
        storedKhets,
        storedCrops,
        storedPartners,
        storedPartnerCash,
        storedRentRecords,
        storedHomeExpenses,
        storedStocks,
        storedTasks,
      ] = await Promise.all([
        db.records.toArray(),
        db.khets.toArray(),
        db.crops.toArray(),
        db.partners.toArray(),
        db.partnerCash.toArray(),
        db.rentRecords.toArray(),
        db.homeExpenses.toArray(),
        db.stocks.toArray(),
        db.tasks.toArray(),
      ]);

      if (cancelled) return;

      const restoreCollection = <T,>(
        key: string,
        rows: T[],
        setRows: React.Dispatch<React.SetStateAction<T[]>>
      ) => {
        if (rows.length === 0) return;
        localStorage.setItem(key, JSON.stringify(rows));
        setRows(rows);
      };

      restoreCollection(RECORDS_STORAGE_KEY, storedRecords, setRecords);
      if (storedKhets.length > 0) localStorage.setItem(KHETS_STORAGE_KEY, JSON.stringify(storedKhets));
      if (storedCrops.length > 0) localStorage.setItem(CROPS_STORAGE_KEY, JSON.stringify(storedCrops));
      restoreCollection(PARTNERS_STORAGE_KEY, storedPartners, setPartners);
      restoreCollection(PARTNER_CASH_STORAGE_KEY, storedPartnerCash, setPartnerCash);
      restoreCollection(RENT_STORAGE_KEY, storedRentRecords, setRentRecords);
      restoreCollection(HOME_STORAGE_KEY, storedHomeExpenses, setHomeExpenses);
      if (storedStocks.length > 0) localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(storedStocks));
      restoreCollection(TASKS_STORAGE_KEY, storedTasks, setTasks);
      setStorageReady(true);
    };

    hydrateStorage().catch((err) => {
      console.error('Storage hydration failed:', err);
      if (!cancelled) {
        setStorageError(err instanceof Error ? err.message : String(err));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncCloud = () => {
      if (!storageReady || !isLoggedIn) return;
      syncEngine.syncNow().catch((err) => {
        console.warn('Automatic cloud sync error:', err);
      });
    };

    registerAutoSyncCallback(syncCloud);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isLoggedIn && storageReady) syncCloud();
    });

    return () => {
      registerAutoSyncCallback(null);
      unsubscribe();
    };
  }, [isLoggedIn, storageReady]);

  // Hydrate React state when cloud pull or backup restore updates local storage
  useEffect(() => {
    const reloadFromStorage = (fromCloudPull: boolean) => {
      try {
        const readArr = <T,>(key: string): T[] | null => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? (parsed as T[]) : null;
        };

        const nextRecords = readArr<FarmRecord>(RECORDS_STORAGE_KEY);
        if (nextRecords) {
          if (fromCloudPull) skipNextCloudSyncRef.current.records = true;
          setRecords(nextRecords);
        }

        const nextPartners = readArr<Partner>(PARTNERS_STORAGE_KEY);
        if (nextPartners) {
          if (fromCloudPull) skipNextCloudSyncRef.current.partners = true;
          setPartners(nextPartners);
        }

        const nextPartnerCash = readArr<PartnerCashEntry>(PARTNER_CASH_STORAGE_KEY);
        if (nextPartnerCash) {
          if (fromCloudPull) skipNextCloudSyncRef.current.partnerCash = true;
          setPartnerCash(nextPartnerCash);
        }

        const nextRent = readArr<RentRecord>(RENT_STORAGE_KEY);
        if (nextRent) {
          if (fromCloudPull) skipNextCloudSyncRef.current.rentRecords = true;
          setRentRecords(nextRent);
        }

        const nextHome = readArr<HomeExpense>(HOME_STORAGE_KEY);
        if (nextHome) {
          if (fromCloudPull) skipNextCloudSyncRef.current.homeExpenses = true;
          setHomeExpenses(nextHome);
        }

        const nextTasks = readArr<FarmTask>(TASKS_STORAGE_KEY);
        if (nextTasks) {
          if (fromCloudPull) skipNextCloudSyncRef.current.tasks = true;
          setTasks(nextTasks);
        }

        setProfile(getFarmerProfile());
        const savedAppName = localStorage.getItem(APP_NAME_STORAGE_KEY);
        if (savedAppName) setAppName(savedAppName);
      } catch (err) {
        console.warn('Error reloading synced data:', err);
      }
    };

    const handleCloudSynced = () => reloadFromStorage(true);
    const handleDataRestored = () => reloadFromStorage(false);

    window.addEventListener(CLOUD_SYNCED_EVENT, handleCloudSynced);
    window.addEventListener('sk-data-restored', handleDataRestored);
    return () => {
      window.removeEventListener(CLOUD_SYNCED_EVENT, handleCloudSynced);
      window.removeEventListener('sk-data-restored', handleDataRestored);
    };
  }, []);

  // Dual Storage Diff-Sync (IndexedDB + LocalStorage Mirror + Cloud Sync Queue)
  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
      const skipQueue = skipNextCloudSyncRef.current.records;
      skipNextCloudSyncRef.current.records = false;
      syncCollectionToDb('records', db.records, records, { skipQueue }).catch((e) =>
        console.warn('Dexie records sync:', e)
      );
    }
  }, [records, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
      const skipQueue = skipNextCloudSyncRef.current.partners;
      skipNextCloudSyncRef.current.partners = false;
      syncCollectionToDb('partners', db.partners, partners, { skipQueue }).catch((e) =>
        console.warn('Dexie partners sync:', e)
      );
    }
  }, [partners, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNER_CASH_STORAGE_KEY, JSON.stringify(partnerCash));
      const skipQueue = skipNextCloudSyncRef.current.partnerCash;
      skipNextCloudSyncRef.current.partnerCash = false;
      syncCollectionToDb('partnerCash', db.partnerCash, partnerCash, { skipQueue }).catch((e) =>
        console.warn('Dexie partnerCash sync:', e)
      );
    }
  }, [partnerCash, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(rentRecords));
      const skipQueue = skipNextCloudSyncRef.current.rentRecords;
      skipNextCloudSyncRef.current.rentRecords = false;
      syncCollectionToDb('rentRecords', db.rentRecords, rentRecords, { skipQueue }).catch((e) =>
        console.warn('Dexie rentRecords sync:', e)
      );
    }
  }, [rentRecords, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(homeExpenses));
      const skipQueue = skipNextCloudSyncRef.current.homeExpenses;
      skipNextCloudSyncRef.current.homeExpenses = false;
      syncCollectionToDb('homeExpenses', db.homeExpenses, homeExpenses, { skipQueue }).catch((e) =>
        console.warn('Dexie homeExpenses sync:', e)
      );
    }
  }, [homeExpenses, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      const skipQueue = skipNextCloudSyncRef.current.tasks;
      skipNextCloudSyncRef.current.tasks = false;
      syncCollectionToDb('tasks', db.tasks, tasks, { skipQueue }).catch((e) =>
        console.warn('Dexie tasks sync:', e)
      );
    }
  }, [tasks, storageReady]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sk-theme', theme);
      // Keep Tailwind's dark: variants in sync with the selected app theme.
      // Without removing the `dark` class, light mode can still render dark cards and menus.
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light-theme', theme === 'light');
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'hi' ? 'en' : 'hi';
      setAppName((curr) => {
        const trimmed = (curr || '').trim();
        if (next === 'en' && (trimmed === 'स्मार्ट खाता' || trimmed === 'स्मार्ट खाता ' || trimmed === 'स्मार्ट खात' || !trimmed)) {
          return 'Smart Khata';
        }
        if (next === 'hi' && (trimmed === 'Smart Khata' || trimmed === 'Smart Khaata' || !trimmed)) {
          return 'स्मार्ट खाता';
        }
        return curr;
      });
      return next;
    });
  };

  // Quick Action & Deep Link state for Farm Section
  const [farmAutoOpenAdd, setFarmAutoOpenAdd] = useState(false);
  const [farmInitialAddType, setFarmInitialAddType] = useState<'Expense' | 'Sale' | 'Yield'>('Expense');
  const [farmInitialTab, setFarmInitialTab] = useState<'khets' | 'records' | 'summary' | 'partners' | 'stock'>('records');

  const handleQuickAddFarm = (type: 'Expense' | 'Sale' | 'Yield') => {
    setFarmInitialAddType(type);
    setFarmAutoOpenAdd(true);
    setFarmInitialTab('records');
    setActiveNav('farm');
  };

  const handleOpenBatai = () => {
    setFarmInitialTab('partners');
    setActiveNav('farm');
  };

  const handleOpenKhets = () => {
    setFarmInitialTab('khets');
    setActiveNav('farm');
  };

  const handleOpenSchedule = () => {
    setActiveNav('schedule');
  };

  const handleOpenReports = () => {
    setActiveNav('reports');
  };

  const handleOpenIncomeExpense = () => {
    setActiveNav('income_expense');
  };

  const handleOpenStock = () => {
    setFarmInitialTab('stock');
    setActiveNav('farm');
  };

  const handleOpenCrops = () => {
    setFarmInitialTab('khets');
    setActiveNav('farm');
  };

  const handleLoginSuccess = (newName?: string) => {
    setIsLoggedIn(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sk-is-logged-in', 'true');
    }
    const freshProfile = getFarmerProfile();
    if (newName && newName.trim() && freshProfile.name !== newName.trim()) {
      freshProfile.name = newName.trim();
      saveFarmerProfile(freshProfile);
    }
    setProfile(freshProfile);
    setShowWelcomeModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    logoutUser();
    signOut(auth).catch((err) => console.warn('Firebase signOut error:', err));
    setIsUnlocked(false);
  };

  if (!isLoggedIn) {
    return (
      <AuthScreen
        lang={lang}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (storageError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center text-slate-800">
        <p role="alert" className="font-semibold">
          {isHi ? 'आपका डेटा लोड नहीं हो सका।' : 'Your data could not be loaded.'}
        </p>
        <p className="max-w-md text-sm text-slate-600">{storageError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          {isHi ? 'फिर से कोशिश करें' : 'Try again'}
        </button>
      </div>
    );
  }

  if (!storageReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600" role="status">
        {isHi ? 'डेटा लोड हो रहा है...' : 'Loading your data...'}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#060e0a] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-emerald-500/30 transition-colors duration-150`}>
      {/* PIN LOCK SCREEN OVERLAY IF ENABLED */}
      {!isUnlocked && security.isLockEnabled && (
        <PinLockScreen
          correctPinHash={security.pinHash}
          correctPin={security.pin}
          lang={lang}
          onUnlocked={() => setIsUnlocked(true)}
        />
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${theme === 'dark'
        ? 'bg-[#08140e]/95 border-[#1a3525]'
        : 'bg-white/95 border-slate-200 shadow-xs'
        }`}>
        <div className="max-w-[1200px] mx-auto px-2.5 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="app-header-brand flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <AppLogo size="md" appName={displayAppName} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`font-extrabold text-sm sm:text-lg tracking-tight truncate max-w-[125px] xs:max-w-[180px] sm:max-w-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {displayAppName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                  {isHi ? 'pro' : 'pro'}
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] -mt-0.5 hidden md:block truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHi ? 'खेत, बटाईदार, मकान किराया व घर खर्च' : 'Farm, Batai, Rental & Home Expenses'}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="app-header-controls flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="app-header-sync hidden sm:block shrink-0">
              <SyncStatusBadge lang={lang} />
            </div>
            <PWAInstallButton lang={lang} variant="header" className="app-header-install hidden md:inline-flex" />

            <button
              type="button"
              onClick={toggleTheme}
              className={`h-9 w-9 rounded-xl border transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm shrink-0 ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                }`}
              title={theme === 'dark' ? 'लाइट थीम चालू करें (Light Theme)' : 'डार्क थीम चालू करें (Dark Theme)'}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-700" />}
            </button>

            <button
              type="button"
              onClick={toggleLang}
              className={`h-9 px-2 sm:px-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm shrink-0 whitespace-nowrap ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-emerald-300'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-emerald-700'
                }`}
              title="भाषा बदलें"
            >
              <Languages size={14} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
              <span>{lang === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUnifiedAddModal(true)}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0 whitespace-nowrap"
              title={isHi ? 'नया रिकॉर्ड जोड़ें' : 'Add Record'}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{isHi ? 'नया रिकॉर्ड' : 'Add Record'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWelcomeModal(true)}
              className={`h-9 px-2 sm:px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0 whitespace-nowrap ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                }`}
              title={isHi ? 'लॉगिन / नया खाता' : 'Login / Sign Up'}
            >
              <User size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">{isHi ? 'लॉगिन' : 'Login'}</span>
            </button>
          </div>
        </div>



        {/* 4 MAIN MODULE TABS NAVIGATION */}
        <div
          className={`hidden sm:block border-t transition-colors ${theme === 'dark'
            ? 'border-[#1a3525] bg-[#07130e]'
            : 'border-slate-200 bg-slate-100/90'
            }`}
        >
          <div className="max-w-[1200px] mx-auto px-2 sm:px-5 lg:px-6 flex items-center justify-around sm:justify-start overflow-x-auto no-scrollbar gap-1.5 py-2 sm:py-1">
            <button
              type="button"
              onClick={() => setActiveNav('dashboard')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <LayoutDashboard size={18} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'होम' : 'Home'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('farm')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'farm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Wheat size={18} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'खेती' : 'Farm'}</span>
            </button>

            {enabledModules.rental && (
            <button
              type="button"
              onClick={() => setActiveNav('rent')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'rent'
                ? 'bg-blue-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Building2 size={18} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'किराया' : 'Rental'}</span>
              <span className="text-[10px] opacity-75">({rentRecords.length})</span>
            </button>

            )}

            {enabledModules.expense && (
            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'home'
                ? 'bg-amber-600 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <ShoppingBag size={18} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'खर्च' : 'Expense'}</span>
              <span className="text-[10px] opacity-75">({homeExpenses.length})</span>
            </button>

            )}

            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${activeNav === 'settings'
                ? 'bg-slate-700 text-white shadow-sm'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-[#0c1a13]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
            >
              <Settings size={18} className="sm:w-[15px] sm:h-[15px]" />
              <span>{isHi ? 'मेनू' : 'Menu'}</span>
            </button>

          </div>
        </div>


      </header>


      
      {/* MOBILE NAVIGATION matching Reference Design */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
          theme === 'dark'
            ? 'bg-[#07130e]/98 backdrop-blur-lg border-[#1a3525] text-white'
            : 'bg-white/98 backdrop-blur-lg border-slate-200 text-slate-900 shadow-xl'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2px)' }}
      >
        <nav
          aria-label={isHi ? 'मुख्य नेविगेशन' : 'Main navigation'}
          className={`grid items-center px-1 pt-1 pb-1 ${enabledModules.rental && enabledModules.expense ? 'grid-cols-5' : enabledModules.rental || enabledModules.expense ? 'grid-cols-4' : 'grid-cols-3'}`}
        >
          {/* 1. होम */}
          <button
            type="button"
            onClick={() => setActiveNav('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] transition-colors cursor-pointer ${
              activeNav === 'dashboard'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home size={20} strokeWidth={activeNav === 'dashboard' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'होम' : 'Home'}</span>
          </button>

          {/* 2. खेती */}
          <button
            type="button"
            onClick={() => setActiveNav('farm')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] transition-colors cursor-pointer ${
              activeNav === 'farm'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wheat size={20} strokeWidth={activeNav === 'farm' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'खेती' : 'Farm'}</span>
          </button>

          {/* 3. किराया */}
          {enabledModules.rental && (
          <button
            type="button"
            onClick={() => setActiveNav('rent')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] transition-colors cursor-pointer ${
              activeNav === 'rent'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Building2 size={20} strokeWidth={activeNav === 'rent' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'किराया' : 'Rent'}</span>
          </button>

          )}

          {/* 4. खर्च */}
          {enabledModules.expense && (
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] transition-colors cursor-pointer ${
              activeNav === 'home'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingBag size={20} strokeWidth={activeNav === 'home' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'खर्च' : 'Expense'}</span>
          </button>

          )}

          {/* 5. मेनू */}
          <button
            type="button"
            onClick={() => setActiveNav('settings')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] transition-colors cursor-pointer ${
              activeNav === 'settings'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings size={20} strokeWidth={activeNav === 'settings' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'मेनू' : 'Menu'}</span>
          </button>
        </nav>
      </div>

      {/* Main Content Render */}
      <main className="flex-1 py-3 sm:py-5 pb-20 sm:pb-8">
        {/* Mobile PWA Install Smart Banner */}
        <PWAInstallButton lang={lang} variant="mobile-banner" />

        {activeNav === 'dashboard' && (
          <DashboardSection
            records={records}
            rentRecords={enabledModules.rental ? rentRecords : []}
            homeExpenses={enabledModules.expense ? homeExpenses : []}
            partners={partners}
            partnerCash={partnerCash}
            lang={lang}
            profile={profile}
            onNavigate={setActiveNav}
            onQuickAddFarm={handleQuickAddFarm}
            onOpenBatai={handleOpenBatai}
            onOpenKhets={handleOpenKhets}
            onOpenSchedule={handleOpenSchedule}
            onOpenReports={handleOpenReports}
            onOpenIncomeExpense={handleOpenIncomeExpense}
          />
        )}

        {activeNav === 'farm' && (
          <FarmSection
            records={records}
            setRecords={setRecords}
            lang={lang}
            autoOpenAdd={farmAutoOpenAdd}
            initialAddType={farmInitialAddType}
            onClearAutoOpenAdd={() => setFarmAutoOpenAdd(false)}
            initialTab={farmInitialTab}
            partners={partners}
            setPartners={setPartners}
            partnerCash={partnerCash}
            setPartnerCash={setPartnerCash}
          />
        )}

        {activeNav === 'schedule' && (
          <ScheduleSection
            tasks={tasks}
            setTasks={setTasks}
            lang={lang}
            onBack={() => setActiveNav('dashboard')}
          />
        )}

        {activeNav === 'income_expense' && (
          <IncomeExpenseSection
            records={records}
            lang={lang}
            onBack={() => setActiveNav('dashboard')}
            onAddNew={handleQuickAddFarm}
          />
        )}

        {activeNav === 'reports' && (
          <ReportsSection
            records={records}
            rentRecords={enabledModules.rental ? rentRecords : []}
            homeExpenses={enabledModules.expense ? homeExpenses : []}
            lang={lang}
            onBack={() => setActiveNav('dashboard')}
          />
        )}

        {activeNav === 'rent' && enabledModules.rental && (
          <RentSection
            records={rentRecords}
            setRecords={setRentRecords}
            lang={lang}
          />
        )}

        {activeNav === 'home' && enabledModules.expense && (
          <HomeSection
            records={homeExpenses}
            setRecords={setHomeExpenses}
            lang={lang}
          />
        )}

        {activeNav === 'settings' && (
          <SettingsSection
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
            appName={displayAppName}
            setAppName={setAppName}
            farmRecords={records}
            setFarmRecords={setRecords}
            rentRecords={rentRecords}
            setRentRecords={setRentRecords}
            homeExpenses={homeExpenses}
            setHomeExpenses={setHomeExpenses}
            enabledModules={enabledModules}
            onEnabledModulesChange={setEnabledModules}
            onNavigateToKhets={handleOpenKhets}
            onNavigateToCrops={handleOpenCrops}
            onNavigateToIncomeExpense={handleOpenIncomeExpense}
            onNavigateToStock={handleOpenStock}
            onNavigateToBatai={handleOpenBatai}
            onNavigateToReports={handleOpenReports}
            onLogout={handleLogout}
            onProfileChange={(updated) => setProfile(updated)}
          />
        )}

        {/* Screen 10 Unified Add Record Modal */}
        {showUnifiedAddModal && (
          <UnifiedAddRecordModal
            isOpen={showUnifiedAddModal}
            onClose={() => setShowUnifiedAddModal(false)}
            lang={lang}
            enableRental={enabledModules.rental}
            enableExpense={enabledModules.expense}
            onAddFarmRecord={(rec) => {
              setRecords((prev) => [rec, ...prev]);
            }}
            onAddRentRecord={(rent) => {
              setRentRecords((prev) => [rent, ...prev]);
            }}
            onAddHomeExpense={(exp) => {
              setHomeExpenses((prev) => [exp, ...prev]);
            }}
          />
        )}

        {/* Screen 1 Welcome / Login Modal */}
        {showWelcomeModal && (
          <AuthScreen
            lang={lang}
            isModal={true}
            onCancel={() => setShowWelcomeModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t pt-4 pb-20 sm:pb-4 text-center text-xs transition-colors ${theme === 'dark'
        ? 'border-[#1a3525] bg-[#07130e] text-slate-400'
        : 'border-slate-200 bg-white text-slate-600'
        }`}>
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🌾 स्मार्ट खाता - भारतीय किसानों के लिए डिजिटल कृषि, बटाई, किराया व घरेलू बहीखाता</span>
          <span className="font-mono text-[11px] opacity-80">100% सुरक्षित • ऑफलाइन डेटा • प्रमाणित हिसाब</span>
        </div>
      </footer>
    </div>
  );
}
