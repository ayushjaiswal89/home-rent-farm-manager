'use client';

import React, { useState } from 'react';
import { X, User, Phone, MapPin, Calendar, ArrowLeft, Check } from 'lucide-react';
import type { Lang } from '../../lib/types';
import type { FarmerProfile } from '../../lib/profileAndSecurity';
import { FarmerAvatar } from '../common/FarmerAvatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  profile: FarmerProfile;
  onSave: (updated: FarmerProfile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  lang,
  profile,
  onSave,
}: EditProfileModalProps) {
  if (!isOpen) return null;

  const isHi = lang === 'hi';
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FarmerProfile>({ ...profile });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert(isHi ? 'कृपया किसान का नाम दर्ज करें' : 'Please enter farmer name');
      return;
    }
    onSave(form);
    setIsEditing(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-[#1e3c2c] bg-white dark:bg-[#0c1a13] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Screen 11: Back arrow + "प्रोफ़ाइल" */}
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
              {isHi ? 'प्रोफ़ाइल' : 'Profile'}
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

        {/* Profile Content matching Screen 11 */}
        <div className="p-6 space-y-6">
          {/* Avatar + Name + Email */}
          <div className="flex flex-col items-center text-center">
            <div className="p-1 rounded-full border-2 border-emerald-500 mb-2">
              <FarmerAvatar size="lg" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {form.name || (isHi ? 'किसान भाई' : 'Kisan Bhai')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {form.email || 'kisan@gmail.com'}
            </p>
          </div>

          {!isEditing ? (
            /* Read-only view matching Screen 11 */
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#07130e] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <User size={16} />
                  <span>{isHi ? 'नाम' : 'Name'}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {form.name || (isHi ? 'किसान भाई' : 'Kisan Bhai')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#07130e] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone size={16} />
                  <span>{isHi ? 'मोबाइल' : 'Mobile'}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  +91 {form.phone || '9876543210'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#07130e] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin size={16} />
                  <span>{isHi ? 'स्थान' : 'Location'}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {form.state || (isHi ? 'मध्य प्रदेश' : 'Madhya Pradesh')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#07130e] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Calendar size={16} />
                  <span>{isHi ? 'जॉइनिंग डेट' : 'Joining Date'}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  01-01-2024
                </span>
              </div>

              {/* Big Green Action Button matching Screen 11: "जानकारी अपडेट करें" */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition cursor-pointer mt-4"
              >
                {isHi ? 'जानकारी अपडेट करें' : 'Update Profile'}
              </button>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'नाम' : 'Name'}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'मोबाइल नंबर' : 'Phone'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'स्थान / राज्य' : 'Location / State'}
                </label>
                <input
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#07130e] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-full border border-slate-300 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  {isHi ? 'सहेजें' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
