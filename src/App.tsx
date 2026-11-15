/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
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
} from './lib/profileAndSecurity';
import { AppLogo } from './components/common/AppLogo';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { SyncStatusBadge } from './components/common/SyncStatusBadge';
import { initStorageEngine } from './services/khatadbService';
import { db } from './db/khatadb';
import { auth, signOut } from './lib/firebase';

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

  // Initialize IndexedDB Storage Engine and run non-destructive migration if needed
  useEffect(() => {
    initStorageEngine().catch((err) => {
      console.warn('Storage engine init error:', err);
    });
  }, []);

  // Dual Storage Sync (IndexedDB + LocalStorage Mirror)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
      db.records.clear().then(() => {
        if (records.length > 0) return db.records.bulkPut(records);
      }).catch((e) => console.warn('Dexie records sync:', e));
    }
  }, [records]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
      db.partners.clear().then(() => {
        if (partners.length > 0) return db.partners.bulkPut(partners);
      }).catch((e) => console.warn('Dexie partners sync:', e));
    }
  }, [partners]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTNER_CASH_STORAGE_KEY, JSON.stringify(partnerCash));
      db.partnerCash.clear().then(() => {
        if (partnerCash.length > 0) return db.partnerCash.bulkPut(partnerCash);
      }).catch((e) => console.warn('Dexie partnerCash sync:', e));
    }
  }, [partnerCash]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(rentRecords));
      db.rentRecords.clear().then(() => {
        if (rentRecords.length > 0) return db.rentRecords.bulkPut(rentRecords);
      }).catch((e) => console.warn('Dexie rentRecords sync:', e));
    }
  }, [rentRecords]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(homeExpenses));
      db.homeExpenses.clear().then(() => {
        if (homeExpenses.length > 0) return db.homeExpenses.bulkPut(homeExpenses);
      }).catch((e) => console.warn('Dexie homeExpenses sync:', e));
    }
  }, [homeExpenses]);

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

  // Purge any legacy cached demo entries from localStorage on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const DEMO_IDS = new Set([
      'rec-1', 'rec-2', 'rec-3', 'rec-4', 'rec-5',
      'rent-1', 'rent-2',
      'home-1', 'home-2', 'home-3',
      'khet-1', 'khet-2',
      'p-1', 'p-2',
      'pc-1', 'pc-2',
      'task-1', 'task-2', 'task-3',
    ]);

    setRecords((prev) => {
      const filtered = prev.filter((r) => !DEMO_IDS.has(r.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setRentRecords((prev) => {
      const filtered = prev.filter((r) => !DEMO_IDS.has(r.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem(RENT_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setHomeExpenses((prev) => {
      const filtered = prev.filter((h) => !DEMO_IDS.has(h.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setPartners((prev) => {
      const filtered = prev.filter((p) => !DEMO_IDS.has(p.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setPartnerCash((prev) => {
      const filtered = prev.filter((pc) => !DEMO_IDS.has(pc.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem(PARTNER_CASH_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setTasks((prev) => {
      const filtered = prev.filter((t) => !DEMO_IDS.has(t.id));
      if (filtered.length !== prev.length) {
        localStorage.setItem('sk-farm-tasks', JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });
  }, []);

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
        <div className="max-w-[1200px] mx-auto px-3 sm:px-5 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="app-header-brand min-w-0 flex-1 flex items-center gap-2.5 sm:gap-3">
            <AppLogo size="md" appName={displayAppName} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={`min-w-0 truncate font-extrabold text-base sm:text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {displayAppName}
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  {isHi ? 'pro' : 'pro'}
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] -mt-0.5 hidden sm:block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHi ? 'खेत, बटाईदार, मकान किराया व घर खर्च' : 'Farm, Batai, Rental & Home Expenses'}
              </p>
            </div>
          </div>

            {/* Right Header Controls */}
          <div className="app-header-controls flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="app-header-sync hidden sm:block shrink-0">
              <SyncStatusBadge lang={lang} />
            </div>
            <PWAInstallButton lang={lang} variant="header" className="app-header-install hidden sm:flex" />

            <button
              type="button"
              onClick={toggleTheme}
              className={`h-9 w-9 rounded-xl border transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm ${theme === 'dark'
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
              className={`h-9 w-9 md:w-auto md:px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center md:justify-start gap-1.5 active:scale-95 shadow-sm ${theme === 'dark'
                ? 'border-[#1e3c2c] bg-[#0c1a13] hover:bg-[#12271c] text-emerald-300'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-emerald-700'
                }`}
              title="भाषा बदलें"
            >
              <Languages size={15} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
              <span className="hidden md:inline">{lang === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUnifiedAddModal(true)}
              className="h-9 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
              title={isHi ? 'नया रिकॉर्ड जोड़ें' : 'Add Record'}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden md:inline">{isHi ? 'नया रिकॉर्ड' : 'Add Record'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWelcomeModal(true)}
              className={`h-9 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm ${theme === 'dark'
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
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors cursor-pointer ${
              activeNav === 'dashboard'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home size={22} strokeWidth={activeNav === 'dashboard' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'होम' : 'Home'}</span>
          </button>

          {/* 2. खेती */}
          <button
            type="button"
            onClick={() => setActiveNav('farm')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors cursor-pointer ${
              activeNav === 'farm'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Wheat size={22} strokeWidth={activeNav === 'farm' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'खेती' : 'Farm'}</span>
          </button>

          {/* 3. किराया */}
          {enabledModules.rental && (
          <button
            type="button"
            onClick={() => setActiveNav('rent')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors cursor-pointer ${
              activeNav === 'rent'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Building2 size={22} strokeWidth={activeNav === 'rent' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'किराया' : 'Rent'}</span>
          </button>

          )}

          {/* 4. खर्च */}
          {enabledModules.expense && (
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors cursor-pointer ${
              activeNav === 'home'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingBag size={22} strokeWidth={activeNav === 'home' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'खर्च' : 'Expense'}</span>
          </button>

          )}

          {/* 5. मेनू */}
          <button
            type="button"
            onClick={() => setActiveNav('settings')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors cursor-pointer ${
              activeNav === 'settings'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Settings size={22} strokeWidth={activeNav === 'settings' ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold leading-tight">{isHi ? 'मेनू' : 'Menu'}</span>
          </button>
        </nav>
      </div>

      {/* Main Content Render */}
      <main className="flex-1 py-3 sm:py-6 pb-4 sm:pb-8">
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
      <footer className={`border-t py-4 text-center text-xs transition-colors ${theme === 'dark'
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
