import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Database, Cloud, AlertCircle } from 'lucide-react';
import { db } from '../../db/khatadb';
import { syncEngine, type SyncState } from '../../services/syncService';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import type { Lang } from '../../lib/types';

interface SyncStatusBadgeProps {
  lang: Lang;
}

export function SyncStatusBadge({ lang }: SyncStatusBadgeProps) {
  const isHi = lang === 'hi';
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncEngine.syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track Firebase Auth user
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email || null);
      if (user) {
        syncEngine.syncNow();
      }
    });

    // Subscribe to syncEngine
    const unsubSync = syncEngine.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });

    // Periodic count check
    const checkCount = async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingCount(count);
      } catch (error) {
        console.warn('Could not read pending sync count:', error);
      }
    };
    checkCount();
    const timer = setInterval(checkCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubAuth();
      unsubSync();
      clearInterval(timer);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    await syncEngine.syncNow();
  };

  const isSyncing = syncState === 'syncing';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDetail((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer shadow-xs ${
          !isOnline
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
            : isSyncing
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
            : syncState === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700'
            : pendingCount > 0
            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-700'
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
        }`}
        title={isHi ? 'डेटाबेस व सिंक स्थिति' : 'Database & Sync Status'}
      >
        {!isOnline ? (
          <>
            <WifiOff size={13} className="text-amber-600 dark:text-amber-400 animate-pulse" />
            <span>{isHi ? 'ऑफलाइन' : 'Offline'}</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={13} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span>{isHi ? 'सिंक हो रहा...' : 'Syncing...'}</span>
          </>
        ) : syncState === 'error' ? (
          <>
            <AlertCircle size={13} className="text-rose-600 dark:text-rose-400" />
            <span>{isHi ? 'सिंक रुका' : 'Sync Error'}</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud size={13} className="text-sky-600 dark:text-sky-400" />
            <span>{pendingCount} {isHi ? 'लंबित' : 'Pending'}</span>
          </>
        ) : (
          <>
            {currentUserEmail ? (
              <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Database size={13} className="text-emerald-600 dark:text-emerald-400" />
            )}
            <span>
              {currentUserEmail
                ? (isHi ? 'क्लाउड सुरक्षित' : 'Synced')
                : (isHi ? 'डिवाइस में सुरक्षित' : 'On device')}
            </span>
          </>
        )}
      </button>

      {/* Detail Popover */}
      {showDetail && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDetail(false)} />
          <div className="absolute right-0 top-9 w-64 p-3 bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] rounded-2xl shadow-xl z-50 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-[#1a3525]">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Database size={14} className="text-emerald-600" />
                {currentUserEmail
                  ? (isHi ? 'क्लाउड सिंक स्थिति' : 'Cloud Sync Status')
                  : (isHi ? 'स्थानीय डेटा स्थिति' : 'Local Data Status')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {currentUserEmail ? 'Firebase Firestore' : (isHi ? 'स्थानीय डिवाइस' : 'Local device')}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>{isHi ? 'इंटरनेट स्थिति' : 'Network'}:</span>
                <span className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isOnline ? (isHi ? 'ऑनलाइन 🟢' : 'Online 🟢') : (isHi ? 'ऑफलाइन 🟠' : 'Offline 🟠')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{isHi ? 'क्लाउड खाता' : 'Cloud Account'}:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={currentUserEmail || undefined}>
                  {currentUserEmail ? currentUserEmail.split('@')[0] : (isHi ? 'लॉगिन नहीं' : 'Not signed in')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{isHi ? 'लंबित रिकॉर्ड' : 'Pending'}:</span>
                <span className="font-mono font-bold">
                  {!currentUserEmail
                    ? (isHi ? 'क्लाउड सिंक बंद' : 'Cloud sync off')
                    : pendingCount === 0
                    ? (isHi ? 'सभी सिंक हैं ✅' : 'All synced ✅')
                    : `${pendingCount} ${isHi ? 'रिकॉर्ड बाकी' : 'queued'}`}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed border-t border-slate-100 dark:border-[#1a3525]">
              {!isOnline
                ? currentUserEmail
                  ? (isHi
                      ? 'इंटरनेट बंद है। डेटा IndexedDB में सुरक्षित है और ऑनलाइन होने पर Firebase Cloud से सिंक होगा।'
                      : 'Offline. Data is stored in IndexedDB and will sync with Firebase Cloud when online.')
                  : (isHi
                      ? 'इंटरनेट बंद है। डेटा केवल इस डिवाइस के IndexedDB में है; क्लाउड बैकअप के लिए ईमेल से लॉगिन करें।'
                      : 'Offline. Data is only in this device’s IndexedDB; sign in with email to enable cloud backup.')
                : currentUserEmail
                ? (isHi
                    ? 'आपका डेटा Firebase Firestore Cloud में पूरी तरह सुरक्षित है।'
                    : 'All records are securely synchronized with Firebase Firestore.')
                : (isHi
                    ? 'क्लाउड बैकअप के लिए कृपया लॉगिन या साइन अप करें।'
                    : 'Please log in or sign up to activate Cloud Sync.')}
            </p>

            {isOnline && currentUserEmail && (
              <button
                type="button"
                onClick={async () => {
                  setShowDetail(false);
                  await handleManualSync();
                }}
                disabled={isSyncing}
                className="w-full mt-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? (isHi ? 'सिंक हो रहा है...' : 'Syncing...') : (isHi ? 'अभी सिंक करें' : 'Sync Now')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
