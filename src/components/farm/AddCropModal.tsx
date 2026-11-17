'use client';

import React, { useState } from 'react';
import { X, Sprout, Plus, Check } from 'lucide-react';
import { Khet, KhetCrop, Lang } from '../../lib/types';
import { cropLabel } from '../../lib/farmI18n';
import { getCropSeasonForDate } from '../../lib/cropCycles';
import { getLocalDateString } from '../../lib/utils';
import { POPULAR_CROPS } from './FarmForm';

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  khet: Khet;
  lang: Lang;
  onSaveCrop: (newCrop: KhetCrop) => void;
}

export function AddCropModal({
  isOpen,
  onClose,
  khet,
  lang,
  onSaveCrop,
}: AddCropModalProps) {
  const isHi = lang === 'hi';

  const [cropName, setCropName] = useState(() => khet.crop || 'Wheat');
  const [customCrop, setCustomCrop] = useState('');
  const [allocatedArea, setAllocatedArea] = useState(() => {
    const currentCrops = khet.crops || [];
    const usedArea = currentCrops.reduce((acc, c) => acc + (Number(c.allocatedArea) || 0), 0);
    const remaining = Math.max(0, (khet.totalArea || khet.area || 0) - usedArea);
    return String(remaining);
  });
  const [sowingDate, setSowingDate] = useState(() => getLocalDateString());
  const [season, setSeason] = useState(() => getCropSeasonForDate(getLocalDateString()).shortHi);
  const [harvestDate, setHarvestDate] = useState('');
  const [status, setStatus] = useState<KhetCrop['status']>('growing');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSowingDateChange = (val: string) => {
    setSowingDate(val);
    if (val) {
      setSeason(getCropSeasonForDate(val).shortHi);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalName = cropName === 'Other' ? customCrop.trim() : cropName;
    if (!finalName) {
      setError(isHi ? 'कृपया फसल का नाम दर्ज करें।' : 'Crop name is required.');
      return;
    }

    const areaNum = parseFloat(allocatedArea);
    if (isNaN(areaNum) || areaNum <= 0) {
      setError(isHi ? 'कृपया वैध रकबा दर्ज करें।' : 'Please enter a valid allocated area.');
      return;
    }

    const maxKhetArea = Number(khet.totalArea || khet.area || 0);
    const usedArea = (khet.crops || []).reduce((total, crop) => total + (Number(crop.allocatedArea) || 0), 0);
    const remainingArea = Math.max(0, maxKhetArea - usedArea);
    if (maxKhetArea > 0 && areaNum > remainingArea) {
      setError(
        isHi
          ? `आवंटित रकबा (${areaNum}) उपलब्ध रकबे (${remainingArea} ${khet.areaUnit || 'बीघा'}) से अधिक नहीं हो सकता।`
          : `Allocated area (${areaNum}) cannot exceed remaining area (${remainingArea} ${khet.areaUnit || 'Bigha'}).`
      );
      return;
    }

    const createdCrop: KhetCrop = {
      id: `crop-${khet.id}-${Date.now()}`,
      khetId: khet.id,
      cropName: finalName,
      cropNameHi: cropLabel(lang, finalName),
      season,
      sowingDate,
      harvestDate: harvestDate || undefined,
      allocatedArea: areaNum,
      areaUnit: khet.areaUnit || 'बीघा',
      status,
      notes: notes.trim() || undefined,
    };

    onSaveCrop(createdCrop);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:pb-0">
        <div className="w-12 h-1 bg-[var(--sk-border)] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[var(--sk-border)] flex items-center justify-between bg-[var(--sk-card2)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sprout size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                <span>{isHi ? '+ खेत में नई फसल जोड़ें' : '+ Add Crop to Field'}</span>
              </h2>
              <p className="text-xs text-[var(--sk-muted)]">
                {khet.name} ({khet.totalArea || khet.area} {khet.areaUnit})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* 1. Crop Selection */}
          <div>
            <label className="block font-bold text-[var(--sk-text)] mb-1.5">
              {isHi ? 'फसल चुनें (Crop):' : 'Select Crop:'} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POPULAR_CROPS.map((c) => {
                const isSelected = cropName === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCropName(c)}
                    className={`p-2 rounded-xl border text-center transition font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-[var(--sk-card2)] border-[var(--sk-border)] text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {cropLabel(lang, c)}
                  </button>
                );
              })}
            </div>
            {cropName === 'Other' && (
              <input
                type="text"
                placeholder={isHi ? 'अन्य फसल का नाम लिखें...' : 'Enter custom crop name...'}
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                className="w-full mt-2 h-10 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-text)] outline-none focus:border-emerald-500"
                required
              />
            )}
          </div>

          {/* 2. Allocated Area & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[var(--sk-text)] mb-1">
                {isHi ? `फसल का रकबा (${khet.areaUnit}):` : `Allocated Area (${khet.areaUnit}):`} *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={allocatedArea}
                onChange={(e) => setAllocatedArea(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-cyan-600 dark:text-cyan-400 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                placeholder="उदा. 2.5"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[var(--sk-text)]">
                  {isHi ? 'सीजन (Season):' : 'Season:'} *
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {season}
                </span>
              </div>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-text)] outline-none focus:border-emerald-500"
                placeholder="उदा. रबी 2026 / खरीफ 2026"
              />
            </div>
          </div>

          {/* 3. Sowing & Harvest Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[var(--sk-text)] mb-1">
                {isHi ? 'बुवाई की तारीख:' : 'Sowing Date:'} *
              </label>
              <input
                type="date"
                required
                value={sowingDate}
                onChange={(e) => handleSowingDateChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--sk-text)] mb-1">
                {isHi ? 'फसल की स्थिति (Status):' : 'Crop Status:'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="sown">{isHi ? '🌱 बोई गई (Sown)' : 'Sown'}</option>
                <option value="growing">{isHi ? '🌾 तैयार हो रही है (Growing)' : 'Growing'}</option>
                <option value="harvested">{isHi ? '✅ कटाई हो चुकी (Harvested)' : 'Harvested'}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[var(--sk-border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition font-bold"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Check size={16} />
              <span>{isHi ? 'फसल जोड़ें' : 'Save Crop'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
