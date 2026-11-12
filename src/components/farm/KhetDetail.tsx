'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Plus,
  Sprout,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Wheat,
  Sparkles,
  Droplets,
  Fuel,
  Users,
  Zap,
  Truck,
  HelpCircle,
  Store,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Printer,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, KhetCrop, Partner } from '../../lib/types';
import { cropLabel, unitLabel, isSameCrop, normalizeCropKey } from '../../lib/farmI18n';
import { getRecordAmount, normalizeToQuintals } from '../../lib/farmAccounting';
import { FarmForm, POPULAR_CROPS } from './FarmForm';
import { PrintReportModal } from './PrintReportModal';
import { exportToExcel } from '../../lib/excelExport';
import {
  getLandSettings,
  formatDualArea,
  calculatePerLandMetrics,
} from '../../lib/landMeasurement';
import { LandSettingsModal } from './LandSettingsModal';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface KhetDetailProps {
  lang: Lang;
  khet: Khet;
  records: FarmRecord[];
  setRecords: React.Dispatch<React.SetStateAction<FarmRecord[]>>;
  onBack: () => void;
  onDeleteKhet: () => void;
  onUpdateKhet?: (updatedKhet: Khet) => void;
  initialCropFilter?: string;
  khetCrops?: KhetCrop[];
  partners?: Partner[];
}

const AREA_UNITS = ['बीघा', 'एकड़', 'हेक्टेयर'];

export function KhetDetail({
  lang,
  khet,
  records,
  setRecords,
  onBack,
  onDeleteKhet,
  onUpdateKhet,
  initialCropFilter,
  khetCrops = [],
  partners = [],
}: KhetDetailProps) {
  const isHi = lang === 'hi';
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FarmRecord | null>(null);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>(initialCropFilter || 'all');
  const [showLandModal, setShowLandModal] = useState(false);
  const [landSettings, setLandSettings] = useState(() => getLandSettings());
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [showEditKhet, setShowEditKhet] = useState(false);
  const [editKhetData, setEditKhetData] = useState(() => {
    const isKnown = (POPULAR_CROPS as readonly string[]).includes(khet.crop as any);
    return {
      name: khet.name,
      crop: isKnown ? khet.crop : 'Other',
      customCrop: isKnown ? '' : khet.crop,
      area: String(khet.area),
      areaUnit: khet.areaUnit,
      sowingDate: khet.sowingDate || '',
    };
  });
  const [editKhetError, setEditKhetError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FarmRecord | null>(null);

  const allFieldRecords = useMemo(() => {
    return records.filter(
      (record) =>
        record.khetId === khet.id ||
        (record.field || '').trim().toLowerCase() === khet.name.trim().toLowerCase()
    );
  }, [records, khet.id, khet.name]);

  const fieldCrops = useMemo(() => {
    const canonicalSet = new Set<string>();
    const result: string[] = [];
    const add = (cropName?: string) => {
      if (!cropName) return;
      const key = normalizeCropKey(cropName);
      if (!canonicalSet.has(key)) {
        canonicalSet.add(key);
        result.push(key);
      }
    };
    if (khet.crop) add(khet.crop);
    if (khet.crops) khet.crops.forEach((c) => add(c.cropName));
    khetCrops.filter((c) => c.khetId === khet.id).forEach((c) => add(c.cropName));
    allFieldRecords.forEach((r) => {
      if (r.crop) add(r.crop);
    });
    return result;
  }, [allFieldRecords, khet, khetCrops]);

  const khetRecords = useMemo(() => {
    if (selectedCropFilter === 'all') return allFieldRecords;
    return allFieldRecords.filter((r) => isSameCrop(r.crop, selectedCropFilter));
  }, [allFieldRecords, selectedCropFilter]);

  const financials = useMemo(() => {
    let totalExpense = 0;
    let totalSales = 0;
    let paymentReceived = 0;
    let pendingPayment = 0;
    let totalYieldKg = 0;
    let totalYieldQuintal = 0;

    khetRecords.forEach((record) => {
      const qty = Number(record.quantity || 0);
      const amt = getRecordAmount(record);

      if (record.type === 'Expense') {
        totalExpense += amt;
      } else if (record.type === 'Sale') {
        totalSales += amt;
        const paid = record.paidAmount !== undefined && record.paidAmount !== null ? Number(record.paidAmount) : amt;
        paymentReceived += paid;
        const pending = record.remainingAmount !== undefined && record.remainingAmount !== null
          ? Number(record.remainingAmount)
          : Math.max(0, amt - paid);
        pendingPayment += pending;
      } else if (record.type === 'Yield') {
        const qtl = normalizeToQuintals(qty, record.unit);
        totalYieldQuintal += qtl;
        totalYieldKg += qtl * 100;
      }
    });

    const netProfit = totalSales - totalExpense;
    const realizedNetProfit = paymentReceived - totalExpense;
    return {
      totalExpense,
      totalSales,
      paymentReceived,
      pendingPayment,
      netProfit,
      realizedNetProfit,
      totalYieldKg,
      totalYieldQuintal: Math.round(totalYieldQuintal * 100) / 100,
    };
  }, [khetRecords]);

  const dualLand = useMemo(() => {
    return formatDualArea(khet.area, khet.areaUnit, landSettings, lang);
  }, [khet.area, khet.areaUnit, landSettings, lang]);

  const handleDelete = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  const handleEdit = (record: FarmRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleSave = (record: FarmRecord) => {
    const fixedRecord: FarmRecord = {
      ...record,
      khetId: khet.id,
      field: khet.name,
      crop: record.crop || (selectedCropFilter !== 'all' ? selectedCropFilter : (khet.crop || 'Wheat')),
      area: record.area !== undefined ? record.area : khet.area,
      areaUnit: record.areaUnit || khet.areaUnit,
    };
    setRecords((current) => {
      const exists = current.some((item) => item.id === fixedRecord.id);
      if (exists) {
        return current.map((item) => (item.id === fixedRecord.id ? fixedRecord : item));
      }
      return [fixedRecord, ...current];
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  const handleExportKhetExcel = () => {
    exportToExcel({
      lang,
      records: allFieldRecords,
      khets: [khet],
      filename: `${khet.name}-khata-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  };

  const handleSaveEditKhet = (e: FormEvent) => {
    e.preventDefault();
    setEditKhetError(null);
    const newName = editKhetData.name.trim();
    if (!newName) {
      setEditKhetError(isHi ? 'कृपया खेत का नाम दर्ज करें।' : 'Field name is required.');
      return;
    }
    const areaNum = parseFloat(editKhetData.area);
    if (isNaN(areaNum) || areaNum <= 0) {
      setEditKhetError(isHi ? 'वैध रकबा दर्ज करें (> 0)।' : 'Please enter a valid area (> 0).');
      return;
    }
    const finalCrop =
      editKhetData.crop === 'Other' && editKhetData.customCrop.trim()
        ? editKhetData.customCrop.trim()
        : editKhetData.crop;

    const oldName = khet.name;
    const updatedKhet: Khet = {
      ...khet,
      name: newName,
      crop: finalCrop,
      totalArea: areaNum,
      area: areaNum,
      areaUnit: editKhetData.areaUnit,
      sowingDate: editKhetData.sowingDate || khet.sowingDate,
    };

    if (newName !== oldName) {
      setRecords((curr) =>
        curr.map((r) =>
          r.khetId === khet.id || (r.field && r.field.trim().toLowerCase() === oldName.trim().toLowerCase())
            ? { ...r, field: newName, khetId: khet.id }
            : r
        )
      );
    }

    if (onUpdateKhet) {
      onUpdateKhet(updatedKhet);
    }
    setShowEditKhet(false);
  };

  return (
    <div className="w-full max-w-[1050px] mx-auto px-3 sm:px-5 lg:px-6 pb-16 space-y-4">
      {/* TOP NAV & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sk-text)] hover:text-emerald-400 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-base sm:text-lg">{khet.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
            {cropLabel(lang, khet.crop || 'Wheat')}
          </span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowLandModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
          >
            <Compass size={14} className="text-amber-400" />
            <span className="hidden sm:inline">1 एकड़ = {landSettings.bighaPerAcre} बीघा</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const isKnown = (POPULAR_CROPS as readonly string[]).includes(khet.crop as any);
              setEditKhetData({
                name: khet.name,
                crop: isKnown ? khet.crop : 'Other',
                customCrop: isKnown ? '' : khet.crop,
                area: String(khet.totalArea || khet.area || ''),
                areaUnit: khet.areaUnit || 'बीघा',
                sowingDate: khet.sowingDate || '',
              });
              setEditKhetError(null);
              setShowEditKhet(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
            title={isHi ? 'खेत का नाम व रकबा सुधारें' : 'Edit Field Details'}
          >
            <Pencil size={14} className="text-emerald-400" />
            <span>{isHi ? 'खेत सुधारें' : 'Edit Field'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportKhetExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
            title="Excel (.xlsx) डाउनलोड करें"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] px-2.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
            title="PDF प्रिंट व डाउनलोड"
          >
            <Printer size={14} className="text-emerald-400" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 px-3.5 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            {isHi ? '+ खर्च/उपज/बिक्री' : '+ Add Entry'}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-2 text-xs font-bold text-red-500 transition active:scale-95 cursor-pointer shadow-sm"
            title={isHi ? 'यह खेत और इसका खाता हटाएं' : 'Delete Field Ledger'}
          >
            <Trash2 size={14} />
            <span>{isHi ? 'खेत हटाएं' : 'Delete Field'}</span>
          </button>
        </div>
      </div>

      {/* FIELD SUMMARY BANNER */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Sprout size={24} />
            </div>
            <div>
              <div className="text-base font-bold text-[var(--sk-text)] flex items-center gap-2">
                <span>{khet.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                  {cropLabel(lang, khet.crop || 'Wheat')}
                </span>
              </div>
              <div className="text-xs text-[var(--sk-muted)] mt-1 flex flex-wrap items-center gap-2">
                <span>
                  क्षेत्रफल: <b className="text-emerald-400 font-mono font-bold">{dualLand.label}</b>
                </span>
                {khet.sowingDate && (
                  <span>बुवाई: <b className="text-[var(--sk-text)]">{khet.sowingDate}</b></span>
                )}
              </div>
            </div>
          </div>

          {fieldCrops.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[var(--sk-card2)] p-1 rounded-xl border border-[var(--sk-border)] text-xs">
              <button
                type="button"
                onClick={() => setSelectedCropFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  selectedCropFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                }`}
              >
                {isHi ? 'सभी फसलें' : 'All'}
              </button>
              {fieldCrops.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCropFilter(c)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    selectedCropFilter === c
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                  }`}
                >
                  {cropLabel(lang, c)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CORE FINANCIALS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'कुल लागत (खर्च)' : 'Cost'}</span>
          <span className="text-base font-bold font-mono text-red-500 mt-0.5 block">
            ₹{financials.totalExpense.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'कुल बिक्री' : 'Sales'}</span>
          <span className="text-base font-bold font-mono text-[var(--sk-text)] mt-0.5 block">
            ₹{financials.totalSales.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block">{isHi ? 'प्राप्त नकद' : 'Received'}</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            ₹{financials.paymentReceived.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] shadow-sm">
          <span className="text-[var(--sk-muted)] block font-semibold">{isHi ? 'शुद्ध नकद मुनाफा' : 'Net Profit'}</span>
          <span
            className={`text-base font-bold font-mono mt-0.5 block ${
              financials.realizedNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {financials.realizedNetProfit >= 0 ? '+' : ''}₹{financials.realizedNetProfit.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--sk-border)] px-4 py-3 bg-[var(--sk-card2)]">
          <div className="font-bold text-sm text-[var(--sk-text)] flex items-center gap-2">
            <span>{isHi ? 'खेत का सम्पूर्ण लेनदेन (Transactions)' : 'Field Transactions'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--sk-card)] border border-[var(--sk-border)] text-[var(--sk-muted)] font-mono">
              {khetRecords.length}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[var(--sk-border)]">
          {khetRecords.map((record) => {
            const qty = Number(record.quantity || 0);
            const price = Number(record.price || 0);
            const calc = qty * price;
            const amt = calc > 0 ? calc : Number(record.amount || 0);
            const isSale = record.type === 'Sale';
            return (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.02] transition"
              >
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      {record.type}
                    </span>
                    <span>{cropLabel(lang, record.crop)}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{record.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {record.expenseCategory || record.note || `${qty} ${record.unit || ''}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono font-bold text-sm">
                    {record.type === 'Yield' ? `${qty} Qtl` : `${isSale ? '+' : '-'} ₹${amt.toLocaleString('en-IN')}`}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(record)}
                      className="p-1 rounded text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title={isHi ? 'प्रविष्टि हटाएं' : 'Delete Entry'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALS */}
      {showForm && (
        <FarmForm
          lang={lang}
          editingRecord={editingRecord}
          fixedKhet={khet}
          khets={[khet]}
          khetCrops={khetCrops}
          partners={partners}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      <LandSettingsModal
        isOpen={showLandModal}
        onClose={() => setShowLandModal(false)}
        lang={lang}
        onSettingsSaved={(newSettings) => setLandSettings(newSettings)}
      />

      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        lang={lang}
        records={allFieldRecords}
        khets={[khet]}
        khetCrops={khetCrops.filter((c) => c.khetId === khet.id)}
        selectedKhetId={khet.id}
      />

      {/* CONFIRM DELETE KHET MODAL */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteKhet();
        }}
        title={isHi ? `खेत "${khet.name}" हटाएं?` : `Delete Field "${khet.name}"?`}
        message={
          isHi
            ? `क्या आप वाकई "${khet.name}" और इसका पूरा खाता हटाना चाहते हैं? यह खेत और इससे जुड़े सभी खर्च, उपज और बिक्री के रिकॉर्ड हटा दिए जाएंगे।`
            : `Are you sure you want to delete "${khet.name}" and all associated farm records?`
        }
        confirmText={isHi ? 'हाँ, खेत हटाएं' : 'Delete Field'}
        cancelText={isHi ? 'रद्द करें' : 'Cancel'}
      />

      {/* CONFIRM DELETE RECORD MODAL */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={() => {
          if (recordToDelete) {
            handleDelete(recordToDelete.id);
            setRecordToDelete(null);
          }
        }}
        title={isHi ? 'प्रविष्टि हटाएं?' : 'Delete Entry?'}
        message={
          isHi
            ? `क्या आप वाकई ${recordToDelete?.date} की यह ${
                recordToDelete?.type === 'Expense' ? 'खर्च' : recordToDelete?.type === 'Sale' ? 'बिक्री' : 'उपज'
              } प्रविष्टि हटाना चाहते हैं?`
            : `Are you sure you want to delete this ${recordToDelete?.type} entry?`
        }
        confirmText={isHi ? 'हाँ, हटाएं' : 'Delete'}
        cancelText={isHi ? 'रद्द करें' : 'Cancel'}
      />

      {/* EDIT KHET MODAL */}
      {showEditKhet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        >
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--sk-border)] bg-[var(--sk-card)] p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--sk-border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--sk-text)]">
                    {isHi ? 'खेत विवरण सुधारें' : 'Edit Field Details'}
                  </h3>
                  <span className="text-[11px] text-[var(--sk-muted)]">
                    {khet.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditKhet(false)}
                className="p-1 rounded-lg text-[var(--sk-muted)] hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editKhetError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{editKhetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditKhet} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? 'खेत का नाम (पहचान)' : 'Field Name'} *
                </label>
                <input
                  type="text"
                  value={editKhetData.name}
                  onChange={(e) => setEditKhetData((c) => ({ ...c, name: e.target.value }))}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? 'मुख्य फसल (Crop)' : 'Crop'} *
                </label>
                <select
                  value={editKhetData.crop}
                  onChange={(e) => setEditKhetData((c) => ({ ...c, crop: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {POPULAR_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {cropLabel(lang, crop)}
                    </option>
                  ))}
                </select>
              </div>

              {editKhetData.crop === 'Other' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? 'अन्य फसल का नाम' : 'Custom Crop Name'} *
                  </label>
                  <input
                    type="text"
                    value={editKhetData.customCrop}
                    onChange={(e) => setEditKhetData((c) => ({ ...c, customCrop: e.target.value }))}
                    placeholder={isHi ? 'उदा. मूंग, उड़द...' : 'e.g. Moong, Urad...'}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? 'क्षेत्रफल (Area)' : 'Area'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={editKhetData.area}
                    onChange={(e) => setEditKhetData((c) => ({ ...c, area: e.target.value }))}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                    {isHi ? 'इकाई' : 'Unit'}
                  </label>
                  <select
                    value={editKhetData.areaUnit}
                    onChange={(e) => setEditKhetData((c) => ({ ...c, areaUnit: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--sk-muted)]">
                  {isHi ? 'बोवनी की तारीख' : 'Sowing Date'}
                </label>
                <input
                  type="date"
                  value={editKhetData.sowingDate}
                  onChange={(e) => setEditKhetData((c) => ({ ...c, sowingDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--sk-border)] bg-[var(--sk-card2)] text-sm text-[var(--sk-text)] outline-none focus:border-emerald-500 font-mono cursor-pointer"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-[var(--sk-border)]">
                <button
                  type="button"
                  onClick={() => setShowEditKhet(false)}
                  className="flex-1 h-10 rounded-xl border border-[var(--sk-border)] text-xs font-semibold text-[var(--sk-muted)] hover:text-white transition cursor-pointer"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md hover:from-emerald-500 hover:to-green-500 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  {isHi ? 'परिवर्तन सुरक्षित करें' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
