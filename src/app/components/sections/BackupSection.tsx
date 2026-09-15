"use client";

import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";

import {
  FarmRecord,
  HomeExpense,
  Lang,
  RentRecord,
} from "../../lib/types";

import { STRINGS } from "../../lib/i18n";

import {
  FormCard,
  InputGroup,
  SectionHeader,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "../common/UI";

interface BackupSectionProps {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  lang: Lang;

  setHome: React.Dispatch<React.SetStateAction<HomeExpense[]>>;
  setRent: React.Dispatch<React.SetStateAction<RentRecord[]>>;
  setFarm: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
}

interface BackupPayload {
  home: HomeExpense[];
  rent: RentRecord[];
  farm: FarmRecord[];
  exportedAt?: string;
}

export function BackupSection({
  home,
  rent,
  farm,
  lang,
  setHome,
  setRent,
  setFarm,
}: BackupSectionProps) {
  const t = STRINGS[lang];

  const [text, setText] = useState("");

  /* ---------------------------------------------------------
     Create Backup
  --------------------------------------------------------- */

  const createBackup = (): BackupPayload => ({
    home,
    rent,
    farm,
    exportedAt: new Date().toISOString(),
  });

  /* ---------------------------------------------------------
     Export Backup
  --------------------------------------------------------- */

  const exportData = () => {
    const payload = createBackup();

    const json = JSON.stringify(payload, null, 2);

    setText(json);

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `smart-khaata-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------
     Validate Backup
  --------------------------------------------------------- */

  const isValidBackup = (
    data: unknown
  ): data is BackupPayload => {
    if (
      typeof data !== "object" ||
      data === null
    ) {
      return false;
    }

    const backup = data as Partial<BackupPayload>;

    return (
      Array.isArray(backup.home) &&
      Array.isArray(backup.rent) &&
      Array.isArray(backup.farm)
    );
  };

  /* ---------------------------------------------------------
     Restore Backup
  --------------------------------------------------------- */

  const restoreBackup = (json: string) => {
    if (!json.trim()) {
      alert(t.invalidBackup || "Invalid backup.");
      return;
    }

    try {
      const data: unknown = JSON.parse(json);

      if (!isValidBackup(data)) {
        alert(
          t.invalidBackup ||
            "Invalid Backup File"
        );
        return;
      }

      /* React State */
      setHome(data.home);
      setRent(data.rent);
      setFarm(data.farm);

      /* LocalStorage */
      localStorage.setItem(
        "sk_home",
        JSON.stringify(data.home)
      );

      localStorage.setItem(
        "sk_rent",
        JSON.stringify(data.rent)
      );

      localStorage.setItem(
        "sk_farm",
        JSON.stringify(data.farm)
      );

      localStorage.setItem(
        "sk_auto_backup",
        JSON.stringify(data)
      );

      setText(json);

      alert(
        t.backupRestored ||
          "Backup Restored Successfully"
      );
    } catch (error) {
      console.error(
        "Backup restore error:",
        error
      );

      alert(
        t.invalidJson ||
          "Invalid JSON File"
      );
    }
  };

  /* ---------------------------------------------------------
     Automatic Backup
  --------------------------------------------------------- */

  useEffect(() => {
    const backup = createBackup();

    localStorage.setItem(
      "sk_auto_backup",
      JSON.stringify(backup)
    );
  }, [home, rent, farm]);

  /* ---------------------------------------------------------
     Restore Auto Backup
  --------------------------------------------------------- */

  const restoreAutoBackup = () => {
    const backup =
      localStorage.getItem(
        "sk_auto_backup"
      );

    if (!backup) {
      alert(
        t.noAutoBackup ||
          "No Auto Backup Found"
      );
      return;
    }

    restoreBackup(backup);
  };

  /* ---------------------------------------------------------
     Reset All Data
  --------------------------------------------------------- */

  const resetData = () => {
    const confirmed = window.confirm(
      t.confirmReset ||
        "Delete all data?"
    );

    if (!confirmed) return;

    setHome([]);
    setRent([]);
    setFarm([]);

    localStorage.removeItem("sk_home");
    localStorage.removeItem("sk_rent");
    localStorage.removeItem("sk_farm");
    localStorage.removeItem("sk_auto_backup");

    setText("");

    alert(
      t.allDataReset ||
        "All Data Reset"
    );
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 overflow-hidden">

      <SectionHeader
        title={t.backupTitle}
        sub={t.backupSub}
      />

      <FormCard>
        <div className="space-y-5">

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            <button
              type="button"
              className={`${btnPrimary} w-full h-11 justify-center`}
              onClick={exportData}
            >
              <Download size={18} />
              {t.exportBtn}
            </button>

            <label
              className={`${btnSecondary} w-full h-11 justify-center cursor-pointer flex items-center`}
            >
              <Upload size={18} />

              {t.importBtn}

              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];

                  if (!file) return;

                  const reader =
                    new FileReader();

                  reader.onload = (event) => {
                    const json =
                      event.target?.result;

                    if (
                      typeof json !== "string"
                    ) {
                      return;
                    }

                    restoreBackup(json);
                  };

                  reader.onerror = () => {
                    alert(
                      t.invalidJson ||
                        "Unable to read backup file."
                    );
                  };

                  reader.readAsText(file);

                  // Same file ko dobara select karne ke liye
                  e.target.value = "";
                }}
              />
            </label>

            <button
              type="button"
              className={`${btnSecondary} w-full h-11 justify-center`}
              onClick={restoreAutoBackup}
            >
              {t.restoreAutoBackup ||
                "Restore Auto Backup"}
            </button>

          </div>

          {/* JSON Backup */}
          <InputGroup
            label={t.backupPlaceholder}
          >
            <textarea
              className={`${inputCls}
                h-52
                sm:h-64
                lg:h-72
                resize-none
                font-mono
                text-[11px]
                sm:text-xs
                w-full
              `}
              placeholder={
                t.backupPlaceholder
              }
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              spellCheck={false}
            />

            {/* Restore / Reset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

              <button
                type="button"
                className={`${btnPrimary} w-full h-11 justify-center`}
                onClick={() =>
                  restoreBackup(text)
                }
              >
                {t.restoreBackup ||
                  "Restore Backup"}
              </button>

              <button
                type="button"
                className={`${btnSecondary} w-full h-11 justify-center`}
                onClick={resetData}
              >
                {t.resetData ||
                  "Reset Data"}
              </button>

            </div>
          </InputGroup>

          {/* Warning */}
          <p className="text-[10px] sm:text-xs text-[var(--sk-faint)] mt-4 leading-5 break-words">
            {t.backupWarning}
          </p>

        </div>
      </FormCard>
    </div>
  );
}