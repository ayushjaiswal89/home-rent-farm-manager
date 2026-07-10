"use client";

import { useState, useEffect } from "react";
import { Download, Upload } from "lucide-react";
import { FarmRecord, HomeExpense, Lang, RentRecord } from "../../lib/types";
import { STRINGS } from "../../lib/i18n";
import { FormCard, InputGroup, SectionHeader, btnPrimary, btnSecondary, inputCls } from "../common/UI";


interface BackupSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;

  setHome: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
  setRent: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  setFarm: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
}

export function BackupSection({
  home,
  rent,
  farm,
  lang,

  setHome,
  setRent,
  setFarm,
}: BackupSectionProps)  {
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

  const restoreBackup = (json: string) => {
  try {
    const data = JSON.parse(json);

    // Validation
   if (
  typeof data !== "object" ||
  data === null ||
  !Array.isArray(data.home) ||
  !Array.isArray(data.rent) ||
  !Array.isArray(data.farm)
) {
  alert("❌ Invalid Backup File");
  return;
}

    // Restore React State
    setHome(data.home);
    setRent(data.rent);
    setFarm(data.farm);

    // LocalStorage भी Update
   localStorage.setItem("sk_home", JSON.stringify(data.home));
localStorage.setItem("sk_rent", JSON.stringify(data.rent));
localStorage.setItem("sk_farm", JSON.stringify(data.farm));

localStorage.setItem(
  "sk_auto_backup",
  JSON.stringify(data)
);

setText(json);

alert("✅ Backup Restored Successfully");
    setText(json);

    alert("✅ Backup Restored Successfully");
  } catch (err) {
    console.error(err);
    alert("❌ Invalid JSON File");
  }
};

useEffect(() => {
  const backup = {
    home,
    rent,
    farm,
    exportedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    "sk_auto_backup",
    JSON.stringify(backup)
  );
}, [home, rent, farm]);

  return (
  <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 overflow-hidden">
      <SectionHeader title={t.backupTitle} sub={t.backupSub} />
      <FormCard>
        <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <button type="button" className={`${btnPrimary} w-full h-11 justify-center`} onClick={exportData}><Download size={18} />{t.exportBtn}</button>
          <label
className={`${btnSecondary} w-full h-11 justify-center cursor-pointer flex items-center`}
>
            <Upload size={18} />{t.importBtn}
            <input
              type="file"
              accept="application/json"
              className="hidden "
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                const json = event.target?.result as string;
                restoreBackup(json);
              };
                reader.readAsText(file);
              }}
            />
          </label>
          <button
    type="button"
    className={`${btnSecondary} w-full h-11 justify-center`}
    onClick={() => {
      const backup = localStorage.getItem("sk_auto_backup");

      if (!backup) {
        alert("No Auto Backup Found");
        return;
      }

      restoreBackup(backup);
    }}
  >
    Restore Auto Backup
  </button>

        </div>
        <InputGroup label={t.backupPlaceholder}>
        <div className="overflow-x-auto">
          <textarea
className={`${inputCls}
h-52
sm:h-64
lg:h-72
resize-none
font-mono
text-[11px]
sm:text-xs
w-full`}
            placeholder={t.backupPlaceholder}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

<button
type="button"
className={`${btnPrimary} w-full h-11 justify-center`}
onClick={() => restoreBackup(text)}
>
Restore Backup
</button>

<button
type="button"
className={`${btnSecondary} w-full h-11 justify-center`}
onClick={() => {

if (!confirm("Delete all data?")) return;

setHome([]);
setRent([]);
setFarm([]);

localStorage.removeItem("sk_home");
localStorage.removeItem("sk_rent");
localStorage.removeItem("sk_farm");
localStorage.removeItem("sk_auto_backup");

setText("");

alert("✅ All Data Reset");

}}
>
Reset Data
</button>

</div>

        </InputGroup>
        <p className="text-[10px] sm:text-xs text-[var(--sk-faint)] mt-4 leading-5 break-words">{t.backupWarning}</p>
        </div>
      </FormCard>
    </div>
  );
}
