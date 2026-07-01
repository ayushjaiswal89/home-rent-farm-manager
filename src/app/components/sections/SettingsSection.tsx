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
    <div>
      <SectionHeader title={t.settingsTitle} sub={t.settingsSub} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormCard>
          <div className="text-xs font-semibold text-green-400 mb-4">{t.goalsTitle}</div>
          <div className="space-y-4">
            <InputGroup label={isHi ? "महीने का खर्च लक्ष्य (₹)" : "Monthly Expense Goal (₹)"}>
              <input type="number" className={inputCls} value={settings.goalExpense} onChange={e => update("goalExpense", e.target.value)} />
            </InputGroup>
            <InputGroup label={isHi ? "किराया लक्ष्य (₹)" : "Rent Goal (₹)"}>
              <input type="number" className={inputCls} value={settings.goalRent} onChange={e => update("goalRent", e.target.value)} />
            </InputGroup>
            <InputGroup label={t.language}>
              <select className={selectCls} value={settings.lang} onChange={e => update("lang", e.target.value as Lang)}>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </InputGroup>
            <InputGroup label={t.currency}>
              <select className={selectCls} value={settings.currency} onChange={e => update("currency", e.target.value as AppSettings["currency"])}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </InputGroup>
          </div>
        </FormCard>

        <FormCard>
          <div className="text-xs font-semibold text-green-400 mb-5">{t.settingsTitle}</div>
          <div className="space-y-5">
            {toggleRows.map(row => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[var(--sk-text2)] text-sm font-semibold">{row.label}</div>
                  <div className="text-[var(--sk-faint)] text-xs mt-0.5">{row.sub}</div>
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
            ].map(item => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-[var(--sk-faint)]">{item.label}</span>
                <span className="text-[var(--sk-text2)] font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </FormCard>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={save}><CheckCircle size={14} />{t.saveSettings}</button>
        <button type="button" className={btnSecondary} onClick={reset}>{t.resetSettings}</button>
        {saved && (
          <span className="text-green-400 text-sm flex items-center gap-1.5 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
            <CheckCircle size={14} />{isHi ? "✅ सेटिंग सेव हो गई!" : "✅ Settings saved!"}
          </span>
        )}
      </div>
      <p className="text-[var(--sk-dim)] text-xs mt-3">Smart Khaata v1.0 • {isHi ? "डेटा स्थानीय रूप से सुरक्षित है" : "Data stored locally."}</p>
    </div>
  );
}
