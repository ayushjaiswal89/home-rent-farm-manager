"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Home, BarChart2, Building2, Wheat, TrendingUp, HardDrive,
  Settings, Menu, X, Plus, Wifi, WifiOff, Moon, Sun
} from "lucide-react";
import { AppSettings, Tab, FarmRecord, HomeExpense, RentRecord } from "./lib/types";
import { DEFAULT_SETTINGS } from "./lib/settings";
import { STRINGS } from "./lib/i18n";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { HomeSection, DashboardSection, RentSection, FarmSection, ReportsSection, BackupSection, SettingsSection } from "./components/sections";
import { fmt } from "./lib/utils";
import { useRegisterSW } from "virtual:pwa-register/react";




// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: Tab;
  icon: React.ReactNode;
  label: string;
  emoji: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const INIT_HOME: HomeExpense[] = [
  { id: "h1", date: "2024-06-20", category: "🥦 Grocery", note: "सब्जी और दूध", amount: 1200 },
  { id: "h2", date: "2024-06-18", category: "⚡ Bills", note: "बिजली बिल जून", amount: 2800 },
  { id: "h3", date: "2024-06-15", category: "💊 Medical", note: "दवाई", amount: 650 },
  { id: "h4", date: "2024-06-12", category: "🚗 Transport", note: "पेट्रोल", amount: 900 },
  { id: "h5", date: "2024-06-08", category: "🥦 Grocery", note: "राशन", amount: 3500 },
];

const INIT_RENT: RentRecord[] = [
  {
    id: "r1",
    date: "2024-06-01",
    tenant: "रामेश्वर सिंह",
    month: "Jun",
    whatsapp: "9876543210",
    amount: 8000,
    prevReading: 520,
    currentReading: 573,
    ratePerUnit: 8,
    units: 53,
    lightBill: 424,
    total: 8424,
    paidAmount: 8424,
    remainingAmount: 0,
    status: "Received",
    note: "",
  },

  {
    id: "r2",
    date: "2024-06-01",
    tenant: "मोहन लाल",
    month: "Jun",
    whatsapp: "9765432109",
    amount: 6500,
    prevReading: 310,
    currentReading: 348,
    ratePerUnit: 8,
    units: 38,
    lightBill: 304,
    total: 6804,
    paidAmount: 0,
    remainingAmount: 6804,
    status: "Pending",
    note: "देरी से आयेगा",
  },

  {
    id: "r3",
    date: "2024-06-01",
    tenant: "सुरेश पाल",
    month: "Jun",
    whatsapp: "9654321098",
    amount: 5000,
    prevReading: 180,
    currentReading: 214,
    ratePerUnit: 8,
    units: 34,
    lightBill: 272,
    total: 5272,
    paidAmount: 2636,
    remainingAmount: 2636,
    status: "Partial",
    note: "आधा दिया",
  },
];

const INIT_FARM: FarmRecord[] = [
  { id: "f1", date: "2024-06-18", type: "Expense", crop: "Wheat", expenseCategory: "खाद", amount: 3200, quantity: 0, unit: "Kg", price: 0, note: "DAP खाद 2 बोरी" },
  { id: "f2", date: "2024-06-17", type: "Expense", crop: "Rice", expenseCategory: "डीजल", amount: 1800, quantity: 0, unit: "Kg", price: 0, note: "ट्रैक्टर डीजल 20L" },
  { id: "f3", date: "2024-06-15", type: "Sale", crop: "Wheat", expenseCategory: "", amount: 45000, quantity: 30, unit: "Quintal", price: 1500, note: "रामपुर मंडी" },
  { id: "f4", date: "2024-06-13", type: "Expense", crop: "Rice", expenseCategory: "मजदूरी", amount: 5500, quantity: 0, unit: "Kg", price: 0, note: "कटाई मजदूरी" },
  { id: "f5", date: "2024-06-10", type: "Yield", crop: "Mustard", expenseCategory: "", amount: 0, quantity: 6.3, unit: "Quintal", price: 0, note: "सरसों कटाई" },
];

const MONTHLY_TREND = [
  { month: "Jan", rent: 19500, farm: 13000, home: 8200 },
  { month: "Feb", rent: 19500, farm: 17000, home: 9100 },
  { month: "Mar", rent: 20000, farm: 40000, home: 7800 },
  { month: "Apr", rent: 20000, farm: 26000, home: 8900 },
  { month: "May", rent: 20500, farm: 17000, home: 9500 },
  { month: "Jun", rent: 20500, farm: 34500, home: 9050 },
];

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<AppSettings>("sk_settings", DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [homeRecords, setHomeRecords] = useLocalStorage<HomeExpense[]>("sk_home", INIT_HOME);
  const [rentRecords, setRentRecords] = useLocalStorage<RentRecord[]>("sk_rent", INIT_RENT);
  const [farmRecords, setFarmRecords] = useLocalStorage<FarmRecord[]>("sk_farm", INIT_FARM);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const darkMode = settings.darkMode;
  const pendingRentCount = useMemo(() => {
  return rentRecords.filter(
    r => r.status === "Pending" || r.status === "Partial"
  ).length;
}, [rentRecords]);
const requestNotifications = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();

  return permission === "granted";
};

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    if (settings.appLock && settings.pin?.length === 4) {
      const unlocked =
        sessionStorage.getItem("smart-khaata-unlocked");

      if (unlocked !== "true") {
        setIsLocked(true);
      }
    } else {
      setIsLocked(false);
    }
  }, [settings.appLock, settings.pin]);

  useEffect(() => {
    const backup = {
      home: homeRecords,
      rent: rentRecords,
      farm: farmRecords,
      exportedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "smart-khaata-auto-backup",
      JSON.stringify(backup)
    );
  }, [homeRecords, rentRecords, farmRecords]);

  useEffect(() => {
    const installed = () => {
      // Install banner hide कर दो
      setDeferredPrompt(null);

      // Optional: console message
      console.log("Smart Khaata installed successfully");
    };

    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  useEffect(() => {
  if (!settings.notifs) return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (pendingRentCount === 0) return;

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const notificationKey =
    `rent-notification-${today}`;

  if (localStorage.getItem(notificationKey)) {
    return;
  }

  new Notification("Smart Khaata", {
    body:
      settings.lang === "hi"
        ? `${pendingRentCount} किराये का भुगतान बाकी है।`
        : `${pendingRentCount} rent payment(s) are pending.`,

    icon:
      `${import.meta.env.BASE_URL}icons/icon-192.png`,
  });

  localStorage.setItem(
    notificationKey,
    "true"
  );
}, [
  settings.notifs,
  pendingRentCount,
  settings.lang,
]);

  const unlockApp = () => {
    if (pinInput === settings.pin) {
      sessionStorage.setItem(
        "smart-khaata-unlocked",
        "true"
      );
      const requestNotifications = async () => {
        if (!("Notification" in window)) {
          return false;
        }


        if (Notification.permission === "granted") {
          return true;
        }

        if (Notification.permission === "denied") {
          return false;
        }

        const permission =
          await Notification.requestPermission();

        return permission === "granted";
      };

      const pendingRentCount = useMemo(() => {
        return rentRecords.filter(
          r =>
            r.status === "Pending" ||
            r.status === "Partial"
        ).length;
      }, [rentRecords]);

      setIsLocked(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError(
        settings.lang === "hi"
          ? "गलत PIN है।"
          : "Incorrect PIN."
      );

      setPinInput("");
    }
  };



  const navItems = useMemo<NavItem[]>(() => {
    const nav = STRINGS[settings.lang].nav;
    return [
      { id: "home", icon: <Home size={16} />, label: nav.home, emoji: "🏠" },
      { id: "dashboard", icon: <BarChart2 size={16} />, label: nav.dashboard, emoji: "📊" },
      { id: "rent", icon: <Building2 size={16} />, label: nav.rent, emoji: "🏢" },
      { id: "farm", icon: <Wheat size={16} />, label: nav.farm, emoji: "🌾" },
      { id: "reports", icon: <TrendingUp size={16} />, label: nav.reports, emoji: "📈" },
      { id: "backup", icon: <HardDrive size={16} />, label: nav.backup, emoji: "🗄️" },
      { id: "settings", icon: <Settings size={16} />, label: nav.settings, emoji: "⚙️" },
    ];
  }, [settings.lang]);

  const goTo = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    setFabOpen(false);
  }, []);

  const renderSection = () => {
    switch (activeTab) {
      case "home":
        return <HomeSection records={homeRecords} setRecords={setHomeRecords} lang={settings.lang} />;
      case "dashboard":
        return <DashboardSection home={homeRecords} rent={rentRecords} farm={farmRecords} lang={settings.lang} />;
      case "rent":
        return <RentSection records={rentRecords} setRecords={setRentRecords} lang={settings.lang} />;
      case "farm":
        return <FarmSection records={farmRecords} setRecords={setFarmRecords} lang={settings.lang} />;
      case "reports":
        return <ReportsSection home={homeRecords} rent={rentRecords} farm={farmRecords} lang={settings.lang} />;
      case "backup":
        return (
          <BackupSection
            home={homeRecords}
            rent={rentRecords}
            farm={farmRecords}
            lang={settings.lang}

            setHome={setHomeRecords}
            setRent={setRentRecords}
            setFarm={setFarmRecords}
          />
        );
      case "settings":
        return <SettingsSection settings={settings} setSettings={setSettings}   requestNotifications={requestNotifications} />;
      default:
        return null;
    }
  };

  if (isLocked) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 text-gray-900 dark:text-white flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6">

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 dark:bg-green-500/15 flex items-center justify-center text-3xl mb-4">
            🔐
          </div>

          <h1 className="text-xl font-bold">
            Smart Khaata
          </h1>

          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
            {settings.lang === "hi"
              ? "ऐप अनलॉक करने के लिए PIN डालें"
              : "Enter your PIN to unlock"}
          </p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pinInput}
          onChange={(e) => {
            const value = e.target.value
              .replace(/\D/g, "")
              .slice(0, 4);

            setPinInput(value);
            setPinError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pinInput.length === 4) {
              unlockApp();
            }
          }}
          className="w-full h-12 rounded-xl border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-center text-xl tracking-[0.5em] outline-none focus:border-green-500"
          placeholder="••••"
        />

        {pinError && (
          <p className="text-red-500 text-xs text-center mt-3">
            {pinError}
          </p>
        )}

        <button
          type="button"
          onClick={unlockApp}
          disabled={pinInput.length !== 4}
          className="w-full mt-5 h-11 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {settings.lang === "hi" ? "अनलॉक करें" : "Unlock"}
        </button>

      </div>
    </div>
  );
}
  return (

    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={import.meta.env.BASE_URL + "icons/icon-192.png"}
              alt="Smart Khaata"
              width={40}
              height={40}
            />

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                Smart Khaata
              </h1>

              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Home • Rent • Farm
              </p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === n.id ? "bg-green-500/20 text-green-400 border border-green-400/30" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                {n.emoji} {n.label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${isOnline ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <button onClick={() => setSettings(current => ({ ...current, darkMode: !current.darkMode }))} className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

      </header>

      <div className="bg-green-500/10 border-b border-green-400/15 px-2 sm:px-4 py-2">
        <p className="text-xs text-green-400/80 text-center max-w-7xl mx-auto">
          {STRINGS[settings.lang].banner}
        </p>
      </div>

      {/* Install App Banner */}
      {deferredPrompt && (
        <div className="bg-green-600/10 border-b border-green-500/20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-green-500">
                📲 Smart Khaata Install करें
              </h3>
              <p className="text-xs text-muted-foreground">
                App को Install करें और Offline भी इस्तेमाल करें।
              </p>
            </div>

            <button
              onClick={async () => {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                setDeferredPrompt(null);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      )}


      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed left-0 top-0 z-[60] h-full w-[75vw] max-w-[300px] bg-card border-r border-border shadow-xl">
            <div className="p-5 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-foreground font-bold">Smart Khaata</div>
                  <div className="text-muted-foreground text-xs">Home • Rent • Farm</div>
                  <div className="text-muted-foreground text-xs mt-0.5">Local data on device</div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 border border-border bg-card rounded-lg flex items-center justify-center text-muted-foreground"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "💰 Net Balance", val: fmt(rentRecords.reduce((s, r) => s + r.total, 0) - homeRecords.reduce((s, r) => s + r.amount, 0)) },
                  { label: "🏢 Tenants", val: String(rentRecords.length) },
                  { label: "🌾 Crops", val: String(new Set(farmRecords.map(r => r.crop)).size) },
                ].map(s => (
                  <div key={s.label} className="bg-card rounded-lg border border-border p-2 text-center">
                    <div className="text-muted-foreground text-xs">{s.label}</div>
                    <div className="text-foreground font-bold text-sm font-mono">{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.slice(0, 5).map(n => (
                <button key={n.id} onClick={() => goTo(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === n.id ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  {n.emoji} {n.label}
                </button>
              ))}
              <div className="border-t border-border my-2" />
              {navItems.slice(5).map(n => (
                <button key={n.id} onClick={() => goTo(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeTab === n.id ? "bg-green-500/20 text-green-400" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  {n.emoji} {n.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <div className="text-muted-foreground text-xs text-center">Smart Khaata v1.0 · Made with ❤️</div>
            </div>
          </aside>
        </>
      )}

      <main
        key={activeTab}
        className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-28 md:pb-8 animate-fade"
      >
        {renderSection()}
      </main>



      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-40 right-4 z-50 bg-white dark:bg-zinc-900 border rounded-xl shadow-lg p-4 max-w-xs">
          {offlineReady && (
            <p className="text-sm mb-3">
              ✅ App is ready for offline use.
            </p>
          )}

          {needRefresh && (
            <>
              <p className="text-sm mb-3">
                New version available.
              </p>

              <button
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Update
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom Nav (mobile) */}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">

        <div className="flex">
          {navItems.slice(0, 5).map(n => (
            <button key={n.id} onClick={() => goTo(n.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${activeTab === n.id ? "text-green-400" : "text-muted-foreground hover:text-foreground"}`}>
              <span className="text-lg leading-none">{n.emoji}</span>
              <span className="text-[11px] font-semibold">{n.label}</span>
              {activeTab === n.id && <div className="w-1 h-1 rounded-full bg-green-400" />}
            </button>
          ))}
        </div>

      </nav>

      {/* FAB */}
      <div className="md:hidden fixed bottom-28 md:bottom-6 right-3 sm:right-4 z-40">
        {fabOpen && (
          <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end">
            {[
              { label: "🏠 Home Expense", tab: "home" as Tab },
              { label: "🏢 Rent Entry", tab: "rent" as Tab },
              { label: "🌾 Farm Record", tab: "farm" as Tab },
              { label: "📤 Export", tab: "backup" as Tab },
            ].map(a => (
              <button key={a.label} onClick={() => { goTo(a.tab); setFabOpen(false); }}
                className="bg-card border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-xl shadow-lg whitespace-nowrap">
                {a.label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-black text-2xl font-bold shadow-xl shadow-green-500/30 active:scale-95 transition-transform">
          {fabOpen ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {/* Footer */}
      <footer className="hidden md:block text-center py-4 text-muted-foreground text-xs border-t border-border">
        Smart Khaata • खर्च, किराया, खेती — सब एक जगह
      </footer>
    </div>

  );
}



