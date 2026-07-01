"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { FarmRecord, HomeExpense, Lang, RentRecord } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { FormCard, InputGroup, SectionHeader, btnPrimary, btnSecondary, inputCls } from "../common/UI";

interface BackupSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;
}

export function BackupSection({ home, rent, farm, lang }: BackupSectionProps) {
  const t = STRINGS[lang];
  const [text, setText] = useState("");

  const exportData = () => {
    const payload = JSON.stringify({ home, rent, farm, exportedAt: new Date().toISOString() }, null, 2);
    setText(payload);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-khaata-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionHeader title={t.backupTitle} sub={t.backupSub} />
      <FormCard>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button type="button" className={btnPrimary} onClick={exportData}><Download size={14} />{t.exportBtn}</button>
          <label className={btnSecondary + " cursor-pointer"}>
            <Upload size={14} />{t.importBtn}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = event => setText(event.target?.result as string);
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
        <InputGroup label={t.backupPlaceholder}>
          <textarea
            className={inputCls + " h-48 resize-none font-mono text-xs"}
            placeholder={t.backupPlaceholder}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </InputGroup>
        <p className="text-[var(--sk-faint)] text-xs mt-2">{t.backupWarning}</p>
      </FormCard>
    </div>
  );
}
