import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Download,
  Check,
  Sparkles,
  X,
  Share2,
  PlusSquare,
  Info,
  ExternalLink,
  Copy,
  RotateCw,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Lang } from '../../lib/types';

interface PWAInstallButtonProps {
  lang: Lang;
  variant?: 'banner' | 'button' | 'header' | 'mobile-banner';
  className?: string;
}

export function PWAInstallButton({
  lang,
  variant = 'button',
  className = '',
}: PWAInstallButtonProps) {
  const isHi = lang === 'hi';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    if (typeof window !== 'undefined' && (window as any).deferredPWAInstallPrompt) {
      return (window as any).deferredPWAInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.location.search.includes('source=pwa') ||
      window.location.search.includes('mode=standalone');
    let saved = false;
    try {
      saved = localStorage.getItem('sk_pwa_installed') === 'true';
    } catch (e) {}
    return Boolean(isStandalone || saved);
  });
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.location.search.includes('source=pwa') ||
      window.location.search.includes('mode=standalone');
    
    let savedInstalled = false;
    try {
      savedInstalled = localStorage.getItem('sk_pwa_installed') === 'true';
    } catch (e) {}

    if (isStandalone || savedInstalled) {
      setIsInstalled(true);
    }

    // Detect if running inside an iframe (like AI Studio preview)
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // Pick up early prompt if already captured in window
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    const handleCustomPromptEvent = () => {
      if ((window as any).deferredPWAInstallPrompt) {
        setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-available', handleCustomPromptEvent);

    const installedHandler = () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('sk_pwa_installed', 'true');
      } catch (e) {}
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).deferredPWAInstallPrompt = null;
      }
      setInstallSuccess(true);
    };
    window.addEventListener('appinstalled', installedHandler);
    window.addEventListener('pwa-installed', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-available', handleCustomPromptEvent);
      window.removeEventListener('appinstalled', installedHandler);
      window.removeEventListener('pwa-installed', installedHandler);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    const promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPWAInstallPrompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          try {
            localStorage.setItem('sk_pwa_installed', 'true');
          } catch (e) {}
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).deferredPWAInstallPrompt = null;
          }
          setInstallSuccess(true);
          setShowGuideModal(false);
          return;
        } else {
          // User clicked cancel on native dialog
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') {
            (window as any).deferredPWAInstallPrompt = null;
          }
        }
      } catch (err) {
        console.warn('Install prompt failed, showing guide modal:', err);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).deferredPWAInstallPrompt = null;
        }
      }
    }

    // If native prompt is not available (e.g. inside iframe, iOS Safari, or waiting for browser)
    setShowGuideModal(true);
  }, [deferredPrompt]);

  const copyAppUrl = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {});
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // If already running in standalone mode or installed, DO NOT show install buttons
  if (isInstalled) {
    if (variant === 'header' || variant === 'mobile-banner' || variant === 'button') {
      return null;
    }
    // Only in settings banner show a small verified badge with no install action
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-2">
          <Check size={16} className="text-emerald-500 stroke-[3]" />
          <span>{isHi ? 'ऐप आपके फोन / डिवाइस में सफलतापूर्वक इंस्टॉल है' : 'App is installed on your device'}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. HEADER VARIANT */}
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0 animate-pulse hover:animate-none ${className}`}
          title={isHi ? 'स्मार्ट खाता ऐप फोन में इंस्टॉल करें' : 'Install Smart Khata App on Phone'}
        >
          <Download size={15} className="stroke-[2.5]" />
          <span className="font-extrabold">{isHi ? 'ऐप इंस्टॉल' : 'Install App'}</span>
        </button>
      )}

      {/* 2. MOBILE TOP BANNER VARIANT */}
      {variant === 'mobile-banner' && !bannerDismissed && (
        <div className="sm:hidden px-3 pt-2">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#071710] via-[#0d2217] to-[#081a11] border border-emerald-500/40 shadow-lg flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Smartphone size={20} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-white truncate">
                    {isHi ? 'स्मार्ट खाता ऐप इंस्टॉल करें' : 'Install Smart Khata'}
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                    {isHi ? 'ऑफ़लाइन' : 'Offline'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80 truncate">
                  {isHi ? 'फोन में डाउनलोड करें, बिना इंटरनेट 1-टैप में चलेगा' : 'Download to home screen, works offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="h-8 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Download size={13} className="stroke-[2.5]" />
                <span>{isHi ? 'इंस्टॉल' : 'Install'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="w-7 h-7 rounded-lg text-emerald-300/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                aria-label="Close install banner"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BANNER VARIANT (FOR SETTINGS) */}
      {variant === 'banner' && (
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[var(--sk-card)] to-emerald-900/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${className}`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[var(--sk-text)] flex items-center gap-1.5">
                <span>{isHi ? 'स्मार्ट खाता को मोबाइल ऐप की तरह चलाएं' : 'Install Smart Khata App'}</span>
                <Sparkles size={13} className="text-amber-500 shrink-0" />
              </h4>
              <p className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                {isHi
                  ? 'बिना इंटरनेट ऑफलाइन चलेगा, सीधे होम स्क्रीन से 1-क्लिक में खुलेगा।'
                  : 'Works offline without internet, opens with 1-click from your home screen.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Download size={15} />
            <span>{isHi ? 'फोन में इंस्टॉल करें' : 'Install App'}</span>
          </button>
        </div>
      )}

      {/* 4. BUTTON VARIANT */}
      {variant === 'button' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95 ${className}`}
        >
          <Download size={15} />
          <span>{isHi ? 'फोन में इंस्टॉल करें (PWA App)' : 'Install App on Phone'}</span>
        </button>
      )}

      {/* INSTALL MODAL (NATIVE TRIGGER + PREVIEW IFRAME / CHROME / IOS INSTRUCTIONS) */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowGuideModal(false);
          }}
        >
          <div className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--sk-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                  <Smartphone size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--sk-text)] leading-tight">
                    {isHi ? 'स्मार्ट खाता ऐप इंस्टॉल करें' : 'Install Smart Khata App'}
                  </h3>
                  <p className="text-[11px] text-[var(--sk-muted)] mt-0.5">
                    {isHi ? 'फोन की होम स्क्रीन पर जोड़ें (100% ऑफ़लाइन)' : 'Add to home screen for offline access'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* If direct native prompt is currently ready */}
            {deferredPrompt && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>{isHi ? 'डायरेक्ट 1-क्लिक इंस्टॉल उपलब्ध है:' : 'Direct 1-Click Install Ready:'}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (deferredPrompt) {
                      try {
                        await deferredPrompt.prompt();
                        const choice = await deferredPrompt.userChoice;
                        if (choice?.outcome === 'accepted') {
                          setIsInstalled(true);
                          setShowGuideModal(false);
                          setInstallSuccess(true);
                        }
                        setDeferredPrompt(null);
                        if (typeof window !== 'undefined') {
                          (window as any).deferredPWAInstallPrompt = null;
                        }
                      } catch (e) {
                        console.warn(e);
                      }
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer animate-pulse"
                >
                  <Download size={17} className="stroke-[2.5]" />
                  <span>{isHi ? '📲 अभी फोन में इंस्टॉल करें' : '📲 Install App Now'}</span>
                </button>
              </div>
            )}

            {/* Special Detection: If user is inside an iframe (like AI Studio preview), browser security prevents iframe PWA prompt */}
            {isInIframe && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Info size={16} className="text-amber-500 shrink-0" />
                  <span>{isHi ? 'प्रीव्यू विंडो से असली Chrome में खोलें' : 'Open in Chrome to Install'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--sk-muted)]">
                  {isHi
                    ? 'आप अभी प्रीव्यू विंडो (iframe) में देख रहे हैं। असली फोन में ऐप इंस्टॉल करने के लिए नीचे दिए हरे बटन को दबाकर इसे सीधे Chrome ब्राउज़र में खोलें, वहाँ 1-क्लिक में Install डायलॉग आ जाएगा।'
                    : 'You are viewing inside a preview container. To install the real PWA on your phone, open directly in Chrome/Safari using the button below.'}
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 text-center"
                >
                  <ArrowUpRight size={15} />
                  <span>{isHi ? '🚀 Chrome ब्राउज़र में खोलें और इंस्टॉल करें' : 'Open in Chrome & Install'}</span>
                </a>
              </div>
            )}

            {/* Platform Guides */}
            {isIOS ? (
              <div className="space-y-3 text-xs text-[var(--sk-text)]">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Smartphone size={15} />
                  <span>{isHi ? 'iPhone / iPad (Safari) में इंस्टॉल करने के 2 आसान कदम:' : 'For iPhone / iPad (Safari):'}</span>
                </p>
                <ol className="space-y-2 text-[var(--sk-muted)]">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-[var(--sk-text)]">
                        {isHi ? 'शेयर (Share) बटन दबाएं:' : 'Tap Share:'}
                      </span>{' '}
                      {isHi
                        ? 'सफारी के नीचे बीच में दिए नीले शेयर [⎋] आइकॉन पर टैप करें।'
                        : 'Tap the Share icon at the bottom of Safari.'}
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-[var(--sk-text)]">
                        {isHi ? 'होम स्क्रीन में जोड़ें:' : 'Add to Home Screen:'}
                      </span>{' '}
                      {isHi
                        ? 'मेनू में थोड़ा नीचे जाएं और "Add to Home Screen" (+) चुनें, फिर ऊपर "Add" दबाएं।'
                        : 'Select "Add to Home Screen", then tap Add.'}
                    </div>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[var(--sk-text)]">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Smartphone size={15} />
                  <span>{isHi ? 'Android / Chrome / Samsung Internet विधि:' : 'For Android / Chrome / Mobile Browsers:'}</span>
                </p>
                <div className="space-y-2 text-[var(--sk-muted)]">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <span className="font-bold text-[var(--sk-text)]">
                        {isHi ? 'Chrome में ऊपर 3 बिंदु (⋮) दबाएं:' : 'Tap 3 dots menu (⋮):'}
                      </span>{' '}
                      {isHi
                        ? 'ब्राउज़र के ऊपर दाएँ कोने में दिए 3 डॉट्स (⋮) पर टैप करें।'
                        : 'Tap the three vertical dots (⋮) in the top-right corner of Chrome.'}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <span className="font-bold text-[var(--sk-text)]">
                        {isHi ? '"App इंस्टॉल करें" या "Add to Home screen" चुनें:' : 'Select Install app / Add to Home screen:'}
                      </span>{' '}
                      {isHi
                        ? 'मेनू में "Install app" (ऐप इंस्टॉल करें) विकल्प पर क्लिक करें।'
                        : 'Select "Install app" or "Add to Home screen" from the menu.'}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)]">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      3
                    </div>
                    <div>
                      <span className="font-bold text-[var(--sk-text)]">
                        {isHi ? 'पुष्टि करें (Install दबाएं):' : 'Confirm Install:'}
                      </span>{' '}
                      {isHi
                        ? 'डायलॉग में "Install" दबाएं। स्मार्ट खाता का आइकॉन आपके फोन में ऐप की तरह आ जाएगा!'
                        : 'Tap "Install". The Smart Khata app will appear directly on your phone home screen.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Share / Copy URL for external browser launch */}
            <div className="p-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Copy size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] text-[var(--sk-muted)] truncate">
                  {isHi ? 'सीधे Chrome में खोलने के लिए लिंक कॉपी करें:' : 'Copy link to open in Chrome:'}
                </span>
              </div>
              <button
                type="button"
                onClick={copyAppUrl}
                className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer shadow-sm"
              >
                {copied ? <Check size={12} className="stroke-[3]" /> : <Copy size={12} />}
                <span>{copied ? (isHi ? 'कॉपी हुआ!' : 'Copied!') : (isHi ? 'कॉपी करें' : 'Copy')}</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--sk-border)]">
              <button
                type="button"
                onClick={() => {
                  // Try triggering again or reload to catch prompt
                  if ((window as any).deferredPWAInstallPrompt) {
                    setDeferredPrompt((window as any).deferredPWAInstallPrompt);
                  }
                  setShowGuideModal(false);
                }}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check size={15} className="stroke-[3]" />
                <span>{isHi ? 'समझ गया, इंस्टॉल कर रहा हूँ' : 'Got it, Installing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
