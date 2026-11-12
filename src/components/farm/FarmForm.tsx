'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import {
  Wheat,
  X,
  AlertCircle,
  Sparkles,
  Check,
  User,
  Store,
  Droplets,
  Fuel,
  Users,
  Zap,
  Truck,
  HelpCircle,
  IndianRupee,
  Mic,
  MicOff,
  Volume2,
  FlaskConical,
} from 'lucide-react';
import type { FarmRecord, Lang, Khet, KhetCrop, Partner } from '../../lib/types';
import { cropLabel, isSameCrop } from '../../lib/farmI18n';
import { formatDualArea, getLandSettings } from '../../lib/landMeasurement';
import { parseVoiceInput } from '../../lib/voiceParser';
import {
  getCropSeasonForDate,
  getRecentCropSeasons,
  KHARIF_CROPS,
  RABI_CROPS,
} from '../../lib/cropCycles';

interface FarmFormProps {
  lang: Lang;
  farmT?: any;
  editingRecord: FarmRecord | null;
  initialType?: TransactionType;
  fixedKhet?: Khet | null;
  fixedCrop?: KhetCrop | null;
  fixedPartner?: Partner | null;
  khets?: Khet[];
  khetCrops?: KhetCrop[];
  partners?: Partner[];
  onSave: (record: FarmRecord) => void;
  onCancel: () => void;
}

type TransactionType = FarmRecord['type'];

export const POPULAR_CROPS = [
  'Wheat',
  'Soybean',
  'Gram',
  'Mustard',
  'Rice',
  'Cotton',
  'Maize',
  'Garlic',
  'Groundnut',
  'Onion',
  'Potato',
  'Tomato',
  'Sugarcane',
  'Bajra',
  'Jowar',
  'Peas',
  'Other',
] as const;

export const UNIT_OPTIONS = [
  'Quintal',
  'Kg',
  'Ton',
  'बोरी (Bags)',
  'लीटर (Liters)',
  'घंटे (Hours)',
  'दिन (Days)',
] as const;

export const quantityToQuintals = (quantity: number, unit: string): number => {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q < 0) return 0;
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'kg' || normalized === 'किलो') return q / 100;
  if (normalized === 'ton' || normalized === 'टन') return q * 10;
  if (normalized.includes('बोरी') || normalized.includes('bag')) return q * 0.5;
  return q;
};

export const calculateSaleTotal = (
  quantity: number,
  unit: string,
  ratePerQuintal: number
): number => {
  const q = quantityToQuintals(quantity, unit);
  const rate = Number(ratePerQuintal);
  if (!Number.isFinite(rate) || rate < 0) return 0;
  return Math.round(q * rate * 100) / 100;
};

export const EXPENSE_CATEGORIES = [
  { value: 'बीज', hi: 'बीज (Seeds)', en: 'Seeds', icon: Wheat, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'खाद', hi: 'खाद (Fertilizer)', en: 'Fertilizer', icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { value: 'कीटनाशक', hi: 'कीटनाशक (Pesticide)', en: 'Pesticide', icon: Droplets, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { value: 'डीजल/ट्रैक्टर', hi: 'डीजल / ट्रैक्टर', en: 'Diesel / Tractor', icon: Fuel, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'मजदूरी', hi: 'मजदूरी (Labor)', en: 'Labor', icon: Users, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { value: 'सिंचाई', hi: 'सिंचाई (Irrigation)', en: 'Irrigation', icon: Droplets, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'बिजली', hi: 'बिजली (Electricity)', en: 'Electricity', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { value: 'ढुलाई', hi: 'ढुलाई (Transport)', en: 'Transport', icon: Truck, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { value: 'अन्य', hi: 'अन्य (Other)', en: 'Other', icon: HelpCircle, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

export function FarmForm({
  lang,
  editingRecord,
  initialType,
  onSave,
  onCancel,
  fixedKhet,
  fixedCrop,
  fixedPartner,
  khets = [],
  khetCrops = [],
  partners = [],
}: FarmFormProps) {
  const isHindi = lang === 'hi';
  const landSettings = getLandSettings();

  // Form State
  const [form, setForm] = useState(() => {
    const defaultType: TransactionType = (editingRecord?.type || initialType || 'Expense') as TransactionType;
    if (editingRecord) {
      const q = editingRecord.quantity ? String(editingRecord.quantity) : '';
      const p = editingRecord.price ? String(editingRecord.price) : '';
      const amt = editingRecord.amount ? String(editingRecord.amount) : '';
      const pd = editingRecord.paidAmount !== undefined ? String(editingRecord.paidAmount) : amt;
      const rem =
        editingRecord.remainingAmount !== undefined
          ? String(editingRecord.remainingAmount)
          : String(Math.max(0, (parseFloat(amt) || 0) - (parseFloat(pd) || 0)));
      const rDate = editingRecord.date || new Date().toISOString().slice(0, 10);
      return {
        date: rDate,
        khetId: editingRecord.khetId || '',
        cropId: editingRecord.cropId || '',
        crop: editingRecord.crop || 'Wheat',
        customCrop: '',
        season: editingRecord.season || getCropSeasonForDate(rDate).shortHi,
        field: editingRecord.field || '',
        customField: '',
        isCustomField: false,
        area: editingRecord.area !== undefined ? String(editingRecord.area) : '',
        areaUnit: editingRecord.areaUnit || 'बीघा',
        type: defaultType,
        expenseCategory: editingRecord.expenseCategory || 'खाद',
        quantity: q,
        unit: editingRecord.unit || 'Quintal',
        price: p,
        worker: editingRecord.worker || '',
        machine: editingRecord.machine || '',
        note: editingRecord.note || '',
        amount: amt,
        paidAmount: pd,
        remainingAmount: rem,
        buyerName: editingRecord.buyerName || '',
        saleReceivedBy: editingRecord.saleReceivedBy || 'me',
        paymentStatus: editingRecord.paymentStatus || 'Received',
        partnerId: editingRecord.partnerId || '',
        paidBy: (editingRecord.paidBy || 'me') as 'me' | 'partner' | 'shared',
        partnerSharePercent:
          editingRecord.partnerSharePercent !== undefined
            ? String(editingRecord.partnerSharePercent)
            : '50',
      };
    }

    const defaultPartnerObj = fixedPartner || null;
    const defaultKhetId = fixedKhet?.id || fixedCrop?.khetId || defaultPartnerObj?.khetId || (khets[0]?.id || '');
    const defaultKhetObj = fixedKhet || khets.find((k) => k.id === defaultKhetId || (defaultPartnerObj?.khetName && k.name.trim().toLowerCase() === defaultPartnerObj.khetName.trim().toLowerCase())) || null;
    const defaultCropObj = fixedCrop || khetCrops.find((c) => c.khetId === defaultKhetId) || null;
    const defaultCropName = (defaultPartnerObj?.crop && defaultPartnerObj.crop !== 'All')
      ? defaultPartnerObj.crop
      : (defaultCropObj?.cropName || defaultKhetObj?.crop || 'Wheat');
    const defaultField = defaultPartnerObj?.khetName || defaultKhetObj?.name || '';
    const defaultPartnerId = defaultPartnerObj?.id || '';
    const defaultShare = defaultPartnerObj?.sharePercent !== undefined ? String(defaultPartnerObj.sharePercent) : '50';
    const initDate = new Date().toISOString().slice(0, 10);
    const autoSeason = getCropSeasonForDate(initDate).shortHi;

    return {
      date: initDate,
      khetId: defaultKhetObj?.id || defaultKhetId,
      cropId: defaultCropObj?.id || '',
      crop: defaultCropName,
      customCrop: '',
      season: defaultCropObj?.season || defaultKhetObj?.season || autoSeason,
      field: defaultField,
      customField: '',
      isCustomField: false,
      area: defaultCropObj ? String(defaultCropObj.allocatedArea) : (defaultKhetObj?.area !== undefined ? String(defaultKhetObj.area) : ''),
      areaUnit: defaultCropObj?.areaUnit || defaultKhetObj?.areaUnit || 'बीघा',
      type: defaultType,
      expenseCategory: 'खाद',
      quantity: '',
      unit: 'Quintal',
      price: '',
      worker: '',
      machine: '',
      note: '',
      amount: '',
      paidAmount: '',
      remainingAmount: '',
      buyerName: '',
      saleReceivedBy: 'me' as 'me' | 'partner' | 'shared',
      paymentStatus: 'Received' as 'Received' | 'Pending' | 'Partial',
      partnerId: defaultPartnerId,
      paidBy: 'me' as 'me' | 'partner' | 'shared',
      partnerSharePercent: defaultShare,
    };
  });

  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const toggleVoiceRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedback(
        isHindi
          ? 'आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है।'
          : 'Voice recognition not available in this browser.'
      );
      setTimeout(() => setVoiceFeedback(null), 3500);
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback(isHindi ? 'सुन रहा हूँ... बोलिए (उदा. "डीजल 1200" या "सोयाबीन 20 क्विंटल 4600 भाव")' : 'Listening... Speak now');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setVoiceFeedback(`पहचाना: "${transcript}"`);
        const parsed = parseVoiceInput(transcript);
        setForm((prev) => {
          const next = { ...prev };
          if (parsed.type) next.type = parsed.type;
          if (parsed.crop) {
            next.crop = parsed.crop;
            const matchedCrop = khetCrops.find(
              (c) => c.khetId === next.khetId && isSameCrop(c.cropName, parsed.crop!)
            );
            if (matchedCrop) {
              next.cropId = matchedCrop.id;
              next.area = String(matchedCrop.allocatedArea);
              next.areaUnit = matchedCrop.areaUnit || prev.areaUnit;
              next.season = matchedCrop.season || prev.season;
            }
          }
          if (parsed.expenseCategory) next.expenseCategory = parsed.expenseCategory;
          if (parsed.amount) {
            next.amount = String(parsed.amount);
            if (next.type === 'Sale') {
              next.paidAmount = String(parsed.amount);
              next.remainingAmount = '0';
            }
          }
          if (parsed.quantity) next.quantity = String(parsed.quantity);
          if (parsed.unit) next.unit = parsed.unit;
          if (parsed.note) next.note = parsed.note;
          return next;
        });
        setTimeout(() => setVoiceFeedback(null), 4000);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFeedback(isHindi ? 'आवाज़ साफ़ सुनाई नहीं दी, कृपया दोबारा बोलें।' : 'Could not recognize audio. Try again.');
        setTimeout(() => setVoiceFeedback(null), 3000);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleQuantityOrPriceChange = (field: 'quantity' | 'price', val: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      const q = Number.parseFloat(next.quantity || '0') || 0;
      const p = Number.parseFloat(next.price || '0') || 0;

      if (q >= 0 && p >= 0 && (next.quantity !== '' || next.price !== '')) {
        const total = next.type === 'Sale'
          ? calculateSaleTotal(q, next.unit, p)
          : Math.round(q * p * 100) / 100;
        next.amount = String(total);

        if (next.type === 'Sale') {
          const previousAmount = Number.parseFloat(prev.amount || '0') || 0;
          const previousPaid = Number.parseFloat(prev.paidAmount || '0') || 0;
          const shouldAutoUpdatePaid = prev.paidAmount === '' || Math.abs(previousPaid - previousAmount) < 0.001;
          const paid = shouldAutoUpdatePaid ? total : Math.min(Math.max(0, previousPaid), total);
          const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
          next.paidAmount = String(paid);
          next.remainingAmount = String(remaining);
          next.paymentStatus = remaining === 0 ? 'Received' : paid > 0 ? 'Partial' : 'Pending';
        }
      }
      return next;
    });
  };

  const handleUnitChange = (unit: string) => {
    setForm((prev) => {
      const next = { ...prev, unit };
      const q = Number.parseFloat(next.quantity || '0') || 0;
      const p = Number.parseFloat(next.price || '0') || 0;

      if (next.quantity !== '' && next.price !== '') {
        const total = next.type === 'Sale'
          ? calculateSaleTotal(q, unit, p)
          : Math.round(q * p * 100) / 100;
        const previousAmount = Number.parseFloat(prev.amount || '0') || 0;
        const previousPaid = Number.parseFloat(prev.paidAmount || '0') || 0;
        next.amount = String(total);
        if (next.type === 'Sale') {
          const shouldAutoUpdatePaid = prev.paidAmount === '' || Math.abs(previousPaid - previousAmount) < 0.001;
          const paid = shouldAutoUpdatePaid ? total : Math.min(Math.max(0, previousPaid), total);
          const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
          next.paidAmount = String(paid);
          next.remainingAmount = String(remaining);
          next.paymentStatus = remaining === 0 ? 'Received' : paid > 0 ? 'Partial' : 'Pending';
        }
      }
      return next;
    });
  };

  const handleAmountChange = (amtVal: string) => {
    setForm((prev) => {
      const total = parseFloat(amtVal) || 0;
      let paid = parseFloat(prev.paidAmount) || 0;
      if (prev.type === 'Sale') {
        if (!prev.paidAmount || prev.paidAmount === prev.amount) {
          paid = total;
        }
        const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
        return {
          ...prev,
          amount: amtVal,
          paidAmount: String(paid),
          remainingAmount: String(remaining),
          paymentStatus: remaining === 0 ? 'Received' : paid > 0 ? 'Partial' : 'Pending',
        };
      }
      return { ...prev, amount: amtVal };
    });
  };

  const handlePaidAmountChange = (paidVal: string) => {
    setForm((prev) => {
      const total = parseFloat(prev.amount) || 0;
      const enteredPaid = parseFloat(paidVal) || 0;
      const paid = Math.min(Math.max(0, enteredPaid), total);
      const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
      let status: 'Received' | 'Pending' | 'Partial' = 'Received';
      if (paid <= 0 && total > 0) status = 'Pending';
      else if (remaining > 0) status = 'Partial';
      return {
        ...prev,
        paidAmount: paidVal,
        remainingAmount: String(remaining),
        paymentStatus: status,
      };
    });
  };

  const setQuickPayment = (status: 'Full' | 'Half' | 'Pending') => {
    const total = parseFloat(form.amount) || 0;
    if (status === 'Full') {
      setForm((prev) => ({
        ...prev,
        paidAmount: String(total),
        remainingAmount: '0',
        paymentStatus: 'Received',
      }));
    } else if (status === 'Half') {
      const half = Math.round((total / 2) * 100) / 100;
      setForm((prev) => ({
        ...prev,
        paidAmount: String(half),
        remainingAmount: String(total - half),
        paymentStatus: 'Partial',
      }));
    } else if (status === 'Pending') {
      setForm((prev) => ({
        ...prev,
        paidAmount: '0',
        remainingAmount: String(total),
        paymentStatus: 'Pending',
      }));
    }
  };

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePartnerSelect = (partnerId: string) => {
    if (!partnerId) {
      setForm((prev) => ({ ...prev, partnerId: '', paidBy: 'me', saleReceivedBy: 'me' }));
      return;
    }
    const p = partners.find((item) => item.id === partnerId);
    if (!p) {
      setForm((prev) => ({ ...prev, partnerId }));
      return;
    }
    setForm((prev) => {
      const next = {
        ...prev,
        partnerId: p.id,
        partnerSharePercent: String(p.sharePercent || 50),
      };
      if (!next.field && p.khetName) {
        next.field = p.khetName;
        const matched = khets.find((k) => k.name === p.khetName || (p.khetId && k.id === p.khetId));
        if (matched) next.khetId = matched.id;
      }
      if ((next.crop === 'Wheat' || !next.crop) && p.crop && p.crop !== 'All') {
        next.crop = p.crop;
      }
      return next;
    });
  };

  const handleCropSelect = (newCrop: string) => {
    setForm((prev) => {
      const matched = khetCrops.find(
        (c) => c.khetId === prev.khetId && isSameCrop(c.cropName, newCrop)
      );
      return {
        ...prev,
        crop: newCrop,
        cropId: matched?.id || '',
        area: matched ? String(matched.allocatedArea) : prev.area,
        areaUnit: matched?.areaUnit || prev.areaUnit,
        season: matched?.season || prev.season,
      };
    });
  };

  const handleKhetSelect = (selectedName: string) => {
    if (selectedName === '__custom__') {
      setForm((prev) => ({
        ...prev,
        isCustomField: true,
        field: prev.customField,
        khetId: '',
        cropId: '',
      }));
      return;
    }
    if (!selectedName) {
      setForm((prev) => ({
        ...prev,
        isCustomField: false,
        field: '',
        khetId: '',
        cropId: '',
        area: '',
      }));
      return;
    }
    const matched = khets.find((k) => k.name === selectedName);
    const khetCropsForKhet = matched ? khetCrops.filter((c) => c.khetId === matched.id) : [];
    const matchedCurrentCrop = khetCropsForKhet.find((c) => isSameCrop(c.cropName, form.crop));
    const defaultCrop = matchedCurrentCrop || khetCropsForKhet[0];
    const matchedPartner = partners.find(
      (p) =>
        (matched && p.khetId === matched.id) ||
        (p.khetName && p.khetName.trim().toLowerCase() === selectedName.trim().toLowerCase())
    );

    setForm((prev) => ({
      ...prev,
      isCustomField: false,
      khetId: matched?.id || '',
      field: selectedName,
      cropId: defaultCrop?.id || '',
      crop: defaultCrop?.cropName || matched?.crop || prev.crop,
      season: defaultCrop?.season || matched?.season || prev.season,
      area: defaultCrop ? String(defaultCrop.allocatedArea) : (matched?.totalArea || matched?.area !== undefined ? String(matched.totalArea || matched.area) : prev.area),
      areaUnit: defaultCrop?.areaUnit || matched?.areaUnit || prev.areaUnit,
      partnerId: prev.partnerId || matchedPartner?.id || '',
      partnerSharePercent: matchedPartner ? String(matchedPartner.sharePercent) : prev.partnerSharePercent,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const quantity = parseFloat(form.quantity || '0') || 0;
    const price = parseFloat(form.price || '0') || 0;
    let amount = parseFloat(form.amount || '0') || 0;

    if (form.type === 'Sale' && quantity > 0 && price > 0) {
      amount = calculateSaleTotal(quantity, form.unit, price);
    } else if (amount <= 0 && quantity > 0 && price > 0) {
      amount = Math.round(quantity * price * 100) / 100;
    }

    if (form.type !== 'Yield' && amount <= 0) {
      setError(
        isHindi
          ? 'कृपया कुल राशि (रकम ₹) दर्ज करें या मात्रा व भाव भरें।'
          : 'Please enter total amount (₹) or fill quantity and rate.'
      );
      return;
    }
    if (form.type === 'Yield' && quantity <= 0) {
      setError(
        isHindi
          ? 'कृपया कुल पैदावार / उपज मात्रा दर्ज करें।'
          : 'Please enter total yield quantity.'
      );
      return;
    }

    const finalCrop =
      form.crop === 'Other' && form.customCrop.trim()
        ? form.customCrop.trim()
        : form.crop;

    let finalField = form.field;
    if (form.isCustomField && form.customField.trim()) {
      finalField = form.customField.trim();
    }

    let finalArea = form.area ? parseFloat(form.area) : undefined;
    if (isNaN(finalArea as number)) finalArea = undefined;

    let paidAmount = amount;
    let remainingAmount = 0;
    let paymentStatus: 'Received' | 'Pending' | 'Partial' = 'Received';
    if (form.type === 'Sale') {
      paidAmount = form.paidAmount !== '' ? parseFloat(form.paidAmount) || 0 : amount;
      paidAmount = Math.min(Math.max(0, paidAmount), amount);
      remainingAmount = Math.max(0, Math.round((amount - paidAmount) * 100) / 100);
      if (paidAmount <= 0 && amount > 0) paymentStatus = 'Pending';
      else if (remainingAmount > 0) paymentStatus = 'Partial';
      else paymentStatus = 'Received';
    }

    let finalCropId = form.cropId;
    if (!finalCropId && form.khetId) {
      const matchedKhetCrop = khetCrops.find(
        (c) => c.khetId === form.khetId && isSameCrop(c.cropName, finalCrop)
      );
      if (matchedKhetCrop) finalCropId = matchedKhetCrop.id;
    }

    const record: FarmRecord = {
      id: editingRecord?.id || `farm-${Date.now()}`,
      date: form.date,
      type: form.type,
      crop: finalCrop,
      khetId: form.khetId || undefined,
      cropId: finalCropId || undefined,
      expenseCategory: form.type === 'Expense' ? form.expenseCategory : '',
      amount,
      quantity,
      unit: form.unit,
      price: price > 0 ? price : 0,
      note: form.note.trim(),
      field: finalField.trim(),
      area: finalArea,
      areaUnit: form.areaUnit,
      worker: form.worker.trim(),
      machine: form.machine.trim(),
      season: form.season.trim(),
      paidAmount,
      remainingAmount,
      paymentStatus,
      buyerName: form.buyerName.trim(),
      saleReceivedBy: form.saleReceivedBy,
      partnerId: form.partnerId || undefined,
      paidBy: form.paidBy,
      partnerSharePercent: parseFloat(form.partnerSharePercent) || 50,
      ratePerQuintal: form.unit === 'Quintal' ? price : undefined,
    };

    onSave(record);
  };

  const areaNum = parseFloat(form.area || '0');
  const dualArea = areaNum > 0 ? formatDualArea(areaNum, form.areaUnit, landSettings, lang) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--sk-card)] border border-[var(--sk-border)] rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:pb-0">
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1 bg-[var(--sk-border)] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header matching Screen 3 & 4 */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[var(--sk-border)] flex items-center justify-between gap-2 bg-[var(--sk-card2)]">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[var(--sk-text)] truncate">
                {isHindi ? 'Farm Record (खेती का रिकॉर्ड)' : 'Farm Record'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--sk-muted)] truncate">
                {isHindi
                  ? 'फसल, बिक्री, खर्च और उत्पादन का विवरण दर्ज करें'
                  : 'Enter details of crop sales, expenses, and yield'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
              title={isListening ? 'सुन रहा हूँ...' : 'बोलकर लिखें'}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-white" />
                  <span className="text-[11px]">सुन रहा हूँ...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] hidden xs:inline">{isHindi ? 'बोलें' : 'Voice'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {voiceFeedback && (
          <div className="px-3.5 sm:px-5 py-2 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs truncate">{voiceFeedback}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Segmented Control: [बिक्री] [खर्च] [उपज] matching Screens 3 & 4 */}
          <div className="flex bg-slate-100 dark:bg-[#0c1a13] p-1 rounded-2xl border border-slate-200 dark:border-[#1e3c2c]">
            <button
              type="button"
              onClick={() => {
                updateField('type', 'Sale');
                if (form.amount && !form.paidAmount) {
                  updateField('paidAmount', form.amount);
                }
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                form.type === 'Sale'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'बिक्री' : 'Sale'}
            </button>

            <button
              type="button"
              onClick={() => updateField('type', 'Expense')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                form.type === 'Expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'खर्च' : 'Expense'}
            </button>

            <button
              type="button"
              onClick={() => updateField('type', 'Yield')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                form.type === 'Yield'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isHindi ? 'उपज' : 'Yield'}
            </button>
          </div>

          {/* EXPENSE CATEGORIES: "खर्च का प्रकार" Grid matching Screen 4 */}
          {form.type === 'Expense' && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {isHindi ? 'खर्च का प्रकार' : 'Expense Type'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { value: 'बीज', label: isHindi ? 'बीज' : 'Seed', icon: Wheat },
                  { value: 'खाद', label: isHindi ? 'खाद' : 'Fertilizer', icon: Sparkles },
                  { value: 'मजदूरी', label: isHindi ? 'मजदूर' : 'Labor', icon: Users },
                  { value: 'डीजल/ट्रैक्टर', label: isHindi ? 'डीजल' : 'Diesel', icon: Fuel },
                  { value: 'सिंचाई', label: isHindi ? 'सिंचाई' : 'Irrigation', icon: Droplets },
                  { value: 'कीटनाशक', label: isHindi ? 'दवा' : 'Pesticide', icon: FlaskConical },
                  { value: 'अन्य', label: isHindi ? 'अन्य' : 'Other', icon: HelpCircle },
                ].map((item) => {
                  const isSelected = form.expenseCategory === item.value || (item.value === 'कीटनाशक' && form.expenseCategory === 'दवा');
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateField('expenseCategory', item.value)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition border ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                          : 'bg-white dark:bg-[#07130e] border-slate-200 dark:border-[#1e3c2c] text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-[#12271c] text-slate-600 dark:text-slate-300'}`}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[11px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Field and Crop Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {isHindi ? 'खेत (Field):' : 'Select Field:'}
              </label>
              {fixedKhet ? (
                <div className="px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{fixedKhet.name}</span>
                  <span className="text-[11px] text-[var(--sk-muted)] font-normal">
                    {fixedKhet.area} {fixedKhet.areaUnit}
                  </span>
                </div>
              ) : (
                <select
                  value={form.isCustomField ? '__custom__' : form.field}
                  onChange={(e) => handleKhetSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">{isHindi ? '-- खेत चुनें --' : '-- Select Field --'}</option>
                  {khets.map((k) => (
                    <option key={k.id} value={k.name}>
                      {k.name} ({k.area} {k.areaUnit}{k.crop ? ` - ${cropLabel(lang, k.crop)}` : ''})
                    </option>
                  ))}
                  <option value="__custom__">{isHindi ? '+ नया / अन्य खेत...' : '+ Other / Custom field...'}</option>
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--sk-text)]">
                  {isHindi ? 'फसल (Crop):' : 'Crop:'}
                </label>
                {/* 6-Month Season Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {getCropSeasonForDate(form.date).shortHi} (6-माह चक्र)
                </span>
              </div>
              <select
                value={form.crop}
                onChange={(e) => handleCropSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {POPULAR_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {cropLabel(lang, c)} ({c})
                  </option>
                ))}
              </select>

              {/* Quick seasonal crop suggestions */}
              <div className="mt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-[var(--sk-muted)] whitespace-nowrap shrink-0">
                  {getCropSeasonForDate(form.date).type === 'Kharif'
                    ? (isHindi ? 'खरीफ फसलें:' : 'Kharif Crops:')
                    : (isHindi ? 'रबी फसलें:' : 'Rabi Crops:')}
                </span>
                {(getCropSeasonForDate(form.date).type === 'Kharif'
                  ? [
                      { val: 'Soybean', label: isHindi ? 'सोयाबीन' : 'Soybean' },
                      { val: 'Rice', label: isHindi ? 'धान' : 'Paddy' },
                      { val: 'Maize', label: isHindi ? 'मक्का' : 'Maize' },
                      { val: 'Cotton', label: isHindi ? 'कपास' : 'Cotton' },
                      { val: 'Groundnut', label: isHindi ? 'मूंगफली' : 'Groundnut' },
                    ]
                  : [
                      { val: 'Wheat', label: isHindi ? 'गेहूं' : 'Wheat' },
                      { val: 'Gram', label: isHindi ? 'चना' : 'Gram' },
                      { val: 'Mustard', label: isHindi ? 'सरसों' : 'Mustard' },
                      { val: 'Garlic', label: isHindi ? 'लहसुन' : 'Garlic' },
                      { val: 'Potato', label: isHindi ? 'आलू' : 'Potato' },
                      { val: 'Onion', label: isHindi ? 'प्याज' : 'Onion' },
                      { val: 'Peas', label: isHindi ? 'मटर' : 'Peas' },
                    ]
                ).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleCropSelect(item.val)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                      form.crop === item.val
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-[var(--sk-card)] text-[var(--sk-text)] border-[var(--sk-border)] hover:bg-emerald-500/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date, Season (6-Month Cycle), and Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {isHindi ? 'तारीख (Date):' : 'Date:'}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const auto = getCropSeasonForDate(newDate);
                  setForm((prev) => ({
                    ...prev,
                    date: newDate,
                    season: auto.shortHi,
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {isHindi ? '6-माह फसल चक्र (Season):' : '6-Month Crop Season:'}
              </label>
              <select
                value={form.season}
                onChange={(e) => updateField('season', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {getRecentCropSeasons(6).map((s) => (
                  <option key={s.id} value={s.shortHi}>
                    {s.labelHi}
                  </option>
                ))}
                {/* Keep existing custom value if not matching presets */}
                {form.season && !getRecentCropSeasons(6).some((s) => s.shortHi === form.season) && (
                  <option value={form.season}>{form.season}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {isHindi ? 'क्षेत्रफल (Area):' : 'Area:'}
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="3"
                  value={form.area}
                  onChange={(e) => updateField('area', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] font-mono focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={form.areaUnit}
                  onChange={(e) => updateField('areaUnit', e.target.value)}
                  className="px-2 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:outline-none cursor-pointer"
                >
                  <option value="बीघा">बीघा</option>
                  <option value="एकड़">एकड़</option>
                  <option value="हेक्टेयर">हेक्टेयर</option>
                </select>
              </div>
            </div>
          </div>

          {/* QUANTITY, UNIT, RATE, AMOUNT */}
          <div className="p-4 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--sk-text)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {form.type === 'Sale'
                  ? isHindi ? 'बिक्री मात्रा व भाव विवरण:' : 'Sales & Rate Details:'
                  : form.type === 'Yield'
                  ? isHindi ? 'पैदावार मात्रा विवरण:' : 'Harvest Quantity:'
                  : isHindi ? 'मात्रा व दर विवरण:' : 'Quantity & Cost:'}
              </span>

              {form.quantity !== '' && form.price !== '' && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {(() => {
                    const quantity = Number.parseFloat(form.quantity) || 0;
                    const price = Number.parseFloat(form.price) || 0;
                    if (form.type === 'Sale') {
                      const quintals = quantityToQuintals(quantity, form.unit);
                      const total = calculateSaleTotal(quantity, form.unit, price);
                      return `${quintals} Qtl × ₹${price} = ₹${total.toLocaleString('en-IN')}`;
                    }
                    const total = quantity * price;
                    return `${quantity} × ₹${price} = ₹${Math.round(total).toLocaleString('en-IN')}`;
                  })()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--sk-muted)] mb-1 font-semibold">
                  {form.type === 'Sale'
                    ? isHindi ? 'बिक्री मात्रा:' : 'Quantity Sold:'
                    : form.type === 'Yield'
                    ? isHindi ? 'उपज मात्रा:' : 'Yield Quantity:'
                    : isHindi ? 'मात्रा:' : 'Quantity:'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="उदा. 20"
                  value={form.quantity}
                  onChange={(e) => handleQuantityOrPriceChange('quantity', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-xs font-mono font-bold text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--sk-muted)] mb-1 font-semibold">
                  {isHindi ? 'इकाई (Unit):' : 'Unit:'}
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--sk-muted)] mb-1 font-semibold">
                  {form.type === 'Sale'
                    ? isHindi ? 'भाव (₹/क्विंटल दर):' : 'Rate per Quintal (₹):'
                    : isHindi ? 'प्रति इकाई दर (₹):' : 'Rate per unit (₹):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-[var(--sk-muted)] font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="उदा. 2400"
                    value={form.price}
                    onChange={(e) => handleQuantityOrPriceChange('price', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-xs font-mono font-bold text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {form.type !== 'Yield' && (
              <div>
                <label className="block text-[11px] text-[var(--sk-muted)] mb-1 font-semibold">
                  {form.type === 'Sale'
                    ? isHindi ? 'कुल बिक्री मूल्य (रकम ₹):' : 'Gross Sale Value (₹):'
                    : isHindi ? 'कुल खर्च राशि (रकम ₹):' : 'Total Cost Amount (₹):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-[var(--sk-muted)] font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SALE SPECIFIC PAYMENT STATUS & WHO COLLECTED */}
          {form.type === 'Sale' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {isHindi ? 'भुगतान व खरीदार निपटान:' : 'Payment & Buyer Settlement:'}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickPayment('Full')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 cursor-pointer"
                  >
                    {isHindi ? 'पूरा नकद प्राप्त' : 'Full Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPayment('Half')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                  >
                    {isHindi ? 'आधा प्राप्त' : 'Half Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPayment('Pending')}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 hover:bg-red-500/30 cursor-pointer"
                  >
                    {isHindi ? 'पूरा बाकी' : 'Full Pending'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                    {isHindi ? 'प्राप्त राशि (नकद मिला ₹):' : 'Payment Received (₹):'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-emerald-500/40 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-700 dark:text-amber-300 font-semibold mb-1">
                    {isHindi ? 'बकाया राशि (लेनी बाकी ₹):' : 'Pending Balance (₹):'}
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={form.remainingAmount}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-amber-500/30 text-xs font-mono font-bold text-amber-600 dark:text-amber-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--sk-muted)] mb-1 font-semibold">
                    {isHindi ? 'खरीदार / आढ़तिया / मंडी:' : 'Buyer / Mandi Trader:'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHindi ? 'उदा. शुभम ट्रेडर्स' : 'Mandi Trader Name'}
                    value={form.buyerName}
                    onChange={(e) => updateField('buyerName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:outline-none"
                  />
                </div>
              </div>

              {/* WHO RECEIVED SALE PROCEEDS (Essential for Batai Settlement!) */}
              <div>
                <label className="block text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  {isHindi ? 'मंडी से यह बिक्री रकम किसके हाथ में आई?' : 'Who collected this sale money?'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'me')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'me'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'मुझे मिली (मालिक)' : 'Received by Me'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'partner')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'partner'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'साझीदार को मिली' : 'Partner Collected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'shared')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'shared'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'आधा-आधा बांट ली' : 'Split on spot'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Worker/Supplier & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {form.type === 'Expense'
                  ? isHindi ? 'श्रमिक / दुकानदार / ऑपरेटर:' : 'Worker / Supplier / Operator:'
                  : isHindi ? 'श्रमिक / व्यक्ति:' : 'Worker / Person:'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. रामलाल' : 'Worker Name'}
                value={form.worker}
                onChange={(e) => updateField('worker', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--sk-text)] mb-1">
                {isHindi ? 'विवरण / टिप्पणी (Note):' : 'Note / Remarks:'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. डीएपी 2 बोरी व जुताई' : 'Remarks'}
                value={form.note}
                onChange={(e) => updateField('note', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PARTNERSHIP & WHO PAID (CRITICAL FOR DISPUTE-FREE BATAI SETTLEMENT) */}
          <div className="p-3.5 rounded-xl bg-[var(--sk-card2)] border border-[var(--sk-border)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[var(--sk-text)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isHindi ? 'साझेदारी / बटाईदार खाता (Batai Partner):' : 'Batai Partner Account:'}</span>
              </label>
              {form.partnerId && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/30">
                  {form.partnerSharePercent}% {isHindi ? 'हिस्सा' : 'Share'}
                </span>
              )}
            </div>

            <div>
              <select
                value={form.partnerId}
                onChange={(e) => handlePartnerSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--sk-card)] border border-[var(--sk-border)] text-xs text-[var(--sk-text)] focus:border-emerald-500 focus:outline-none cursor-pointer font-medium"
              >
                <option value="">{isHindi ? '-- व्यक्तिगत खाता (कोई साझीदार नहीं) --' : '-- Personal / No Partner --'}</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name} ({p.sharePercent}% {isHindi ? 'हिस्सा' : 'share'} {p.khetName ? `- ${p.khetName}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {form.partnerId && form.type === 'Expense' && (
              <div className="space-y-2 pt-2 border-t border-[var(--sk-border)]">
                <span className="block text-xs font-semibold text-[var(--sk-text)]">
                  {isHindi ? 'यह खर्च किसने चुकाया? (Paid By):' : 'Who paid for this expense?'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('paidBy', 'me')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.paidBy === 'me'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {isHindi ? 'मैंने चुकाया' : 'Paid by Me'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('paidBy', 'partner')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.paidBy === 'partner'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {isHindi ? 'साझीदार ने दिया' : 'Partner Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('paidBy', 'shared')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.paidBy === 'shared'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500 shadow-sm'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card3)]'
                    }`}
                  >
                    {isHindi ? 'आधा-आधा साझा' : 'Shared 50-50'}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--sk-muted)]">
                  {form.paidBy === 'me'
                    ? isHindi
                      ? `आपने अपनी जेब से खर्च दिया - साझीदार का ${form.partnerSharePercent}% हिस्सा साझीदार से लेना बाकी रहेगा।`
                      : 'You paid; partner owes their share to you.'
                    : form.paidBy === 'partner'
                    ? isHindi
                      ? `साझीदार ने अपनी जेब से खर्च दिया - आपका ${100 - (parseFloat(form.partnerSharePercent) || 50)}% हिस्सा साझीदार को देना होगा।`
                      : 'Partner paid; you owe your share to partner.'
                    : isHindi
                    ? 'खर्च मौके पर ही दोनों ने बराबर साझा कर लिया।'
                    : 'Split equally on the spot.'}
                </p>
              </div>
            )}

            {form.partnerId && form.type === 'Sale' && (
              <div className="space-y-2 pt-2 border-t border-[var(--sk-border)]">
                <span className="block text-xs font-semibold text-[var(--sk-text)]">
                  {isHindi ? 'मंडी से यह बिक्री रकम किसके हाथ में आई?' : 'Who collected this sale money?'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'me')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'me'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'मुझे मिली (मालिक)' : 'Received by Me'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'partner')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'partner'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'साझीदार को मिली' : 'Partner Collected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('saleReceivedBy', 'shared')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      form.saleReceivedBy === 'shared'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500'
                        : 'bg-[var(--sk-card)] border-[var(--sk-border)] text-[var(--sk-muted)] hover:text-[var(--sk-text)]'
                    }`}
                  >
                    {isHindi ? 'आधा-आधा बांट ली' : 'Split on spot'}
                  </button>
                </div>
              </div>
            )}

            {form.partnerId && form.type === 'Yield' && (
              <div className="pt-2 border-t border-[var(--sk-border)] text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                {isHindi
                  ? `🌾 इस पैदावार का ${form.partnerSharePercent}% हिस्सा साझीदार के उपज बंटवारे में स्वतः जोड़ा जाएगा।`
                  : `Partner entitled to ${form.partnerSharePercent}% of this harvest.`}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 pb-2 border-t border-[var(--sk-border)] flex flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-[var(--sk-muted)] hover:text-[var(--sk-text)] hover:bg-[var(--sk-card2)] transition cursor-pointer"
            >
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="w-full py-3.5 px-6 min-h-[48px] rounded-full text-sm sm:text-base font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <span>💾</span>
              <span>
                {editingRecord
                  ? isHindi ? 'रिकॉर्ड अपडेट करें' : 'Update Record'
                  : isHindi ? 'रिकॉर्ड सेव करें' : 'Save Record'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
