"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { AppSettings, Lang } from "../../lib/types";
import { DEFAULT_SETTINGS, persistSettings } from "../../lib/settings";
import { STRINGS } from "../../lib/i18n";
import { FormCard, InputGroup, SectionHeader, Toggle, btnPrimary, btnSecondary, inputCls, selectCls } from "../common/UI";

interface SettingsSectionProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export function SettingsSection({ settings, setSettings }: SettingsSectionProps) {
  const [saved, setSaved] = useState(false);
  const t = STRINGS[settings.lang];
  const isHi = settings.lang === "hi";

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(current => {
      const next = { ...current, [key]: value };
      persistSettings(next);
      return next;
    });
  };

  const save = () => {
    persistSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    persistSettings(DEFAULT_SETTINGS);
  };

  const toggleRows = [
    { key: "darkMode" as const, label: isHi ? "डार्क मोड 🌙" : "Dark Mode 🌙", sub: isHi ? "रात में आरामदायक" : "Comfortable night view" },
    { key: "notifs" as const, label: isHi ? "नोटिफिकेशन 🔔" : "Notifications 🔔", sub: isHi ? "किराया और खर्च अलर्ट" : "Rent and expense alerts" },
    { key: "backupReminder" as const, label: isHi ? "बैकअप रिमाइंडर ☁️" : "Backup Reminder ☁️", sub: isHi ? "साप्ताहिक बैकअप अलर्ट" : "Weekly backup alert" },
    { key: "exportCsv" as const, label: isHi ? "ऑटो CSV एक्सपोर्ट 📤" : "Auto CSV Export 📤", sub: isHi ? "मासिक एक्सपोर्ट तैयार रखें" : "Keep monthly export ready" },
  ];

  

  return (
  <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
      <SectionHeader title={t.settingsTitle} sub={t.settingsSub} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="overflow-hidden">
        <FormCard>
          <div className="text-[11px] sm:text-xs leading-5 font-semibold text-green-400 mb-4">{t.goalsTitle}</div>
           <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 ">
            <InputGroup label={isHi ? "महीने का खर्च लक्ष्य (₹)" : "Monthly Expense Goal (₹)"}>
              <input type="number" className={inputCls} value={settings.goalExpense} onChange={e => update("goalExpense", e.target.value)} />
            </InputGroup>
            </div>
            <div className="sm:col-span-2 ">
            <InputGroup label={isHi ? "किराया लक्ष्य (₹)" : "Rent Goal (₹)"}>
              <input type="number" className={inputCls} value={settings.goalRent} onChange={e => update("goalRent", e.target.value)} />
            </InputGroup>
            </div>
             <div className="sm:col-span-2">
            <InputGroup label={t.language}>
              <select className={selectCls} value={settings.lang} onChange={e => update("lang", e.target.value as Lang)}>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </InputGroup>
            </div>
             <div className="sm:col-span-2">
            <InputGroup label={t.currency}>
              <select className={selectCls} value={settings.currency} onChange={e => update("currency", e.target.value as AppSettings["currency"])}>
               <option value="INR">₹ INR</option>
               <option value="USD">$ USD</option>
               <option value="EUR">€ EUR</option>
              </select>
            </InputGroup>
            </div>
             <div className="sm:col-span-2">
            <InputGroup label={isHi ? "दिनांक प्रारूप" : "Date Format"}>
  <select
    className={selectCls}
    value={settings.dateFormat}
    onChange={(e) =>
      update(
        "dateFormat",
        e.target.value as AppSettings["dateFormat"]
      )
    }
  >
    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
  </select>
</InputGroup>
</div>

          </div>
          </div>
        </FormCard>
        </div>

        <div className="overflow-hidden">
        <FormCard>
          <div className="text-[11px] sm:text-xs leading-5 font-semibold text-green-400 mb-5">{t.settingsTitle}</div>
          <div className="space-y-5">
            {toggleRows.map(row => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--sk-text2)] text-sm sm:text-base font-semibold">{row.label}</div>
                  <div className="text-[var(--sk-faint)] text-[11px] sm:text-xs leading-5 mt-0.5">{row.sub}</div>
                </div>
                <Toggle checked={settings[row.key]} onChange={() => update(row.key, !settings[row.key] as AppSettings[typeof row.key])} />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--sk-border)] space-y-2">
            {[
              { label: t.theme, value: settings.darkMode ? (isHi ? "डार्क 🌙" : "Dark 🌙") : (isHi ? "लाइट ☀️" : "Light ☀️") },
              { label: t.language, value: settings.lang === "hi" ? "हिन्दी" : "English" },
              { label: t.currency, value: settings.currency },
              { label: t.notifications, value: settings.notifs ? t.on : t.off },
              {label: isHi ? "दिनांक प्रारूप" : "Date Format",value: settings.dateFormat,},
            ].map(item => (
              <div key={item.label} className="flex justify-between text-[11px] sm:text-xs leading-5">
                <span className="text-[var(--sk-faint)]">{item.label}</span>
                <span className="text-[var(--sk-text2)] font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </FormCard>
        </div>
      </div>
     <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button type="button" className={`${btnPrimary} w-full h-11 justify-center`} onClick={save}><CheckCircle size={14} />{t.saveSettings}</button>
        <button type="button" className={`${btnSecondary} w-full h-11 justify-center`} onClick={reset}>{t.resetSettings}</button>
        {saved && (
          <div
className="w-full lg:w-auto flex justify-center lg:justify-start"
>

          <span
className="text-green-400 text-sm flex items-center justify-center gap-2 bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20 w-full lg:w-auto"
>
            <CheckCircle size={14} />{isHi ? "✅ सेटिंग सेव हो गई!" : "✅ Settings saved!"}
          </span>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
     <FormCard>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">


    <div className="space-y-6">

      <div className="font-semibold text-[var(--sk-text2)]">
        Smart Khaata
      </div>

      <div className="text-[11px] sm: text-[11px] sm:text-xs leading-5 leading-5 text-[var(--sk-faint)]">
        Professional Finance Manager
      </div>

    </div>

    <div className="text-left sm:text-right">

      <div className="text-green-400 font-bold">
        v1.0.0
      </div>

      <div className="text-xs text-[var(--sk-faint)]">
        Build 2026
      </div>

    </div>

  </div>

  <div className="border-t border-[var(--sk-border)] mt-4 pt-4 text-[11px] sm:text-xs leading-6 break-words text-[var(--sk-faint)]s text-[var(--sk-faint)]">

    © 2026 Smart Khaata

    <br />

    {isHi
      ? "सारा डेटा केवल आपके डिवाइस में सुरक्षित रहता है।"
      : "All data is stored securely on your device."}

  </div>

</FormCard>
</div>
    </div>
  );
}
