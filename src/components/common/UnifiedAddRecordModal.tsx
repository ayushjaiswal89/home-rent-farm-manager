'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Wheat,
  Building2,
  ShoppingBag,
  Calendar,
  Save,
  Check,
} from 'lucide-react';
import type { Lang, FarmRecord, RentRecord, HomeExpense, Khet } from '../../lib/types';
import { getCropSeasonForDate } from '../../lib/cropCycles';
import { cropLabel, normalizeCropKey } from '../../lib/farmI18n';
import { loadAndMigrateKhets } from '../../lib/storageMigration';
import { getLocalDateString } from '../../lib/utils';

interface UnifiedAddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  enableRental?: boolean;
  enableExpense?: boolean;
  onAddFarmRecord: (record: FarmRecord) => void;
  onAddRentRecord?: (record: RentRecord) => void;
  onAddHomeExpense?: (record: HomeExpense) => void;
}

export function UnifiedAddRecordModal({
  isOpen,
  onClose,
  lang,
  enableRental = true,
  enableExpense = true,
  onAddFarmRecord,
  onAddRentRecord,
  onAddHomeExpense,
}: UnifiedAddRecordModalProps) {
  const isHi = lang === 'hi';
  const [activeTab, setActiveTab] = useState<'farm' | 'rent' | 'home'>('farm');
  React.useEffect(() => {
    if (activeTab === 'rent' && !enableRental) setActiveTab('farm');
    if (activeTab === 'home' && !enableExpense) setActiveTab('farm');
  }, [activeTab, enableRental, enableExpense]);

  // Load saved khets from storage
  const [khets] = useState<Khet[]>(() => {
    if (typeof window !== 'undefined') {
      return loadAndMigrateKhets().khets;
    }
    return [];
  });

  // Farm fields matching Screen 10
  const [selectedKhet, setSelectedKhet] = useState(() => khets[0]?.name || '');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [cost, setCost] = useState('');
  const [sale, setSale] = useState('');
  const [date, setDate] = useState(() => getLocalDateString());
  const [note, setNote] = useState('');

  // Rent fields
  const [tenantName, setTenantName] = useState('');
  const [roomNote, setRoomNote] = useState('');
  const [rentAmount, setRentAmount] = useState('');

  // Home expense fields
  const [homeCategory, setHomeCategory] = useState('राशन व किराना');
  const [homeAmount, setHomeAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (activeTab === 'farm') {
      const expenseAmt = parseFloat(cost) || 0;
      const saleAmt = parseFloat(sale) || 0;
      if (expenseAmt <= 0 && saleAmt <= 0) {
        setValidationError(isHi ? 'कृपया लागत या बिक्री राशि दर्ज करें।' : 'Enter a cost or sale amount.');
        return;
      }
      const detectedSeason = getCropSeasonForDate(date).shortHi;
      const matchedKhet = khets.find((k) => k.name.trim().toLowerCase() === selectedKhet.trim().toLowerCase());
      const defaultFieldCrop = matchedKhet?.crop ? cropLabel(lang, matchedKhet.crop) : (isHi ? 'गेहूं' : 'Wheat');
      const finalCrop = selectedCrop ? cropLabel(lang, selectedCrop) : defaultFieldCrop;

      // Add expense record if cost entered
      if (expenseAmt > 0) {
        onAddFarmRecord({
          id: `farm-exp-${Date.now()}`,
          date,
          type: 'Expense',
          field: selectedKhet,
          khetId: matchedKhet?.id,
          crop: finalCrop,
          season: detectedSeason,
          expenseCategory: 'लागत',
          amount: expenseAmt,
          note: note.trim() || (isHi ? 'फसल लागत' : 'Crop Expense'),
        });
      }

      // Add sale record if sale entered
      if (saleAmt > 0) {
        onAddFarmRecord({
          id: `farm-sale-${Date.now()}`,
          date,
          type: 'Sale',
          field: selectedKhet,
          khetId: matchedKhet?.id,
          crop: finalCrop,
          season: detectedSeason,
          amount: saleAmt,
          paidAmount: saleAmt,
          remainingAmount: 0,
          note: note.trim() || (isHi ? 'फसल बिक्री' : 'Crop Sale'),
        });
      }
    } else if (activeTab === 'rent' && onAddRentRecord) {
      const amt = parseFloat(rentAmount) || 0;
      if (!tenantName.trim() || amt <= 0) {
        setValidationError(isHi ? 'किरायेदार का नाम और सही किराया राशि दर्ज करें।' : 'Enter a tenant name and a valid rent amount.');
        return;
      }
      const rentDate = new Date(`${date}T00:00:00`);
      const month = Number.isNaN(rentDate.getTime())
        ? ''
        : rentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      onAddRentRecord({
        id: `rent-${Date.now()}`,
        date,
        tenant: tenantName.trim(),
        month,
        whatsapp: '',
        amount: amt,
        prevReading: 0,
        currentReading: 0,
        ratePerUnit: 0,
        units: 0,
        lightBill: 0,
        total: amt,
        paidAmount: 0,
        remainingAmount: amt,
        status: 'Pending',
        note: [roomNote.trim(), note.trim()].filter(Boolean).join(' - '),
      });
    } else if (activeTab === 'home' && onAddHomeExpense) {
      const amt = parseFloat(homeAmount) || 0;
      if (amt <= 0) {
        setValidationError(isHi ? 'कृपया सही खर्च राशि दर्ज करें।' : 'Enter a valid expense amount.');
        return;
      }
      const categoryMap: Record<string, string> = {
        'राशन व किराना': 'grocery',
        'बिजली बिल': 'bills',
        'दवाई': 'medical',
        'शिक्षा': 'education',
        'अन्य': 'other',
      };
      onAddHomeExpense({
        id: `home-${Date.now()}`,
        date,
        category: categoryMap[homeCategory] || 'other',
        note: note.trim() || homeCategory,
        amount: amt,
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-[#1e3c2c] bg-white dark:bg-[#0c1a13] shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Screen 10: Back arrow + "नया रिकॉर्ड जोड़ें" */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isHi ? 'नया रिकॉर्ड जोड़ें' : 'Add New Record'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Tabs matching Screen 10: [खेती] [किराया] [खर्च] */}
        <div className="p-3 bg-slate-50 dark:bg-[#07130e] border-b border-slate-100 dark:border-slate-800">
          <div className="flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('farm')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'farm'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isHi ? 'खेती' : 'Farm'}
            </button>
            {enableRental && <button
              type="button"
              onClick={() => setActiveTab('rent')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'rent'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isHi ? 'किराया' : 'Rent'}
            </button>}
            {enableExpense && <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {isHi ? 'खर्च' : 'Expense'}
            </button>}
          </div>
        </div>

        {/* Form Content matching Screen 10 */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
          {activeTab === 'farm' && (
            <>
              {/* खेत चुनें */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'खेत चुनें' : 'Select Field'}
                </label>
                <select
                  value={selectedKhet}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSelectedKhet(chosen);
                    if (chosen) {
                      const matched = khets.find((k) => k.name.trim().toLowerCase() === chosen.trim().toLowerCase());
                      if (matched && matched.crop && !selectedCrop) {
                        setSelectedCrop(cropLabel(lang, matched.crop));
                      }
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
                >
                  <option value="">{isHi ? '-- खेत चुनें --' : '-- Select Field --'}</option>
                  {khets.length > 0 ? (
                    khets.map((k) => (
                      <option key={k.id} value={k.name}>
                        {k.name} ({k.totalArea || k.area} {k.areaUnit || 'बीघा'})
                      </option>
                    ))
                  ) : (
                    null
                  )}
                </select>
              </div>

              {/* फसल */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    {isHi ? 'फसल' : 'Crop'}
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    {getCropSeasonForDate(date).shortHi} (6 माह)
                  </span>
                </div>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-600 shadow-xs"
                >
                  <option value="">{isHi ? '-- फसल चुनें --' : '-- Select Crop --'}</option>
                  <option value="गेहूँ">गेहूँ (Wheat)</option>
                  <option value="धान">धान (Paddy)</option>
                  <option value="सरसों">सरसों (Mustard)</option>
                  <option value="मक्का">मक्का (Maize)</option>
                  <option value="चना">चना (Gram)</option>
                  <option value="सोयाबीन">सोयाबीन (Soybean)</option>
                  <option value="लहसुन">लहसुन (Garlic)</option>
                  <option value="आलू">आलू (Potato)</option>
                  <option value="कपास">कपास (Cotton)</option>
                  <option value="मूंगफली">मूंगफली (Groundnut)</option>
                </select>
                {/* 1-tap seasonal crop suggestions */}
                <div className="mt-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {(getCropSeasonForDate(date).type === 'Kharif'
                    ? ['सोयाबीन', 'मक्का', 'धान', 'कपास', 'मूंगफली']
                    : ['गेहूँ', 'चना', 'सरसों', 'लहसुन', 'आलू']
                  ).map((crp) => (
                    <button
                      key={crp}
                      type="button"
                      onClick={() => setSelectedCrop(crp)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition whitespace-nowrap cursor-pointer ${
                        selectedCrop === crp
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      {crp}
                    </button>
                  ))}
                </div>
              </div>

              {/* लागत (₹) | बिक्री (₹) matching Screen 10 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'लागत (₹)' : 'Cost (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder={isHi ? "जैसे: 2500" : "e.g. 2500"}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'बिक्री (₹)' : 'Sale (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sale}
                    onChange={(e) => setSale(e.target.value)}
                    placeholder={isHi ? "जैसे: 15000" : "e.g. 15000"}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-600 shadow-xs"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'rent' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'किरायेदार का नाम' : 'Tenant Name'}
                </label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder={isHi ? "किरायेदार का नाम दर्ज करें" : "Enter tenant name"}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium shadow-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'कमरा / दुकान विवरण' : 'Room / Shop'}
                </label>
                <input
                  type="text"
                  value={roomNote}
                  onChange={(e) => setRoomNote(e.target.value)}
                  placeholder={isHi ? "जैसे: कमरा नं. 1 या दुकान" : "e.g. Room 1 or Shop"}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium shadow-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'किराया राशि (₹)' : 'Rent Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder={isHi ? "जैसे: 5000" : "e.g. 5000"}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-mono shadow-xs"
                />
              </div>
            </>
          )}

          {activeTab === 'home' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'खर्च श्रेणी' : 'Category'}
                </label>
                <select
                  value={homeCategory}
                  onChange={(e) => setHomeCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium shadow-xs"
                >
                  <option value="राशन व किराना">राशन व किराना</option>
                  <option value="बिजली बिल">बिजली बिल</option>
                  <option value="दवाई">दवाई व चिकित्सा</option>
                  <option value="शिक्षा">शिक्षा व स्कूल</option>
                  <option value="अन्य">अन्य घरेलू खर्च</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'खर्च राशि (₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={homeAmount}
                  onChange={(e) => setHomeAmount(e.target.value)}
                  placeholder={isHi ? "जैसे: 1500" : "e.g. 1500"}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-mono shadow-xs"
                />
              </div>
            </>
          )}

          {/* तारीख matching Screen 10 */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isHi ? 'तारीख' : 'Date'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium shadow-xs"
            />
          </div>

          {/* नोट matching Screen 10 */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isHi ? 'नोट' : 'Note'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isHi ? 'नोट लिखें...' : 'Enter note...'}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#07130e] text-slate-900 dark:text-white font-medium shadow-xs"
            />
          </div>

          {validationError && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
              {validationError}
            </p>
          )}

          {/* Big Green Action Button: "सहेजें" matching Screen 10 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md active:scale-95 transition cursor-pointer"
            >
              {isHi ? 'सहेजें' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
