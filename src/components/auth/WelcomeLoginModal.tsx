import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Sprout, Leaf, UserCheck, ShieldCheck } from 'lucide-react';
import type { Lang } from '../../lib/types';
import { FarmerAvatar } from '../common/FarmerAvatar';

interface WelcomeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onLoginSuccess: (name?: string) => void;
}

export function WelcomeLoginModal({
  isOpen,
  onClose,
  lang,
  onLoginSuccess,
}: WelcomeLoginModalProps) {
  const isHi = lang === 'hi';
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [name, setName] = useState('रामलाल यादव');
  const [phone, setPhone] = useState('9826011223');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-b from-[#e8f5e9] via-white to-[#f0fdf4] text-slate-900 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95">
        {mode === 'welcome' && (
          <div className="p-6 flex flex-col items-center text-center">
            {/* Green Leaf Logo matching Screen 1 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-lg shadow-emerald-700/20 mb-3">
              <Leaf size={34} className="fill-white" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Khaata</h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 mt-0.5">
              खेती का हिसाब, अब मोबाइल पर
            </p>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mt-2">
              <span>अपने खेत</span>
              <span>•</span>
              <span>अपनी फसल</span>
              <span>•</span>
              <span>अपना हिसाब</span>
            </div>

            {/* Farmer Hero Visual with Smartphone */}
            <div className="w-full my-5 py-4 px-3 rounded-2xl bg-gradient-to-b from-emerald-100/70 to-emerald-50 border border-emerald-200/80 flex flex-col items-center relative overflow-hidden">
              <div className="w-24 h-24 mb-2">
                <FarmerAvatar size="xl" className="border-4 border-white shadow-md mx-auto" />
              </div>
              <p className="font-extrabold text-sm text-emerald-950">डिजिटल किसान मुनीम</p>
              <p className="text-[11px] text-emerald-800/80 max-w-[200px]">
                लागत, उपज, बिक्री व बटाईदार का 100% सटीक बहीखाता
              </p>
            </div>

            {/* Action Buttons matching Screen 1 */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-3.5 px-5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <span>लॉगिन करें</span>
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => setMode('signup')}
                className="w-full py-3.5 px-5 rounded-full bg-white hover:bg-slate-50 text-emerald-800 border-2 border-emerald-700 font-bold text-sm sm:text-base flex items-center justify-center transition-all active:scale-[0.99]"
              >
                <span>नया खाता बनाएं</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoginSuccess('रामलाल यादव');
                  onClose();
                }}
                className="pt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <span>बिना खाता (Guest Mode)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setMode('welcome')}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === 'login' ? 'किसान लॉगिन' : 'नया खाता बनाएं'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  किसान का नाम
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा: रामलाल यादव"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मोबाइल नंबर
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md mt-4 transition-all"
              >
                {mode === 'login' ? 'प्रवेश करें' : 'खाता तैयार करें'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
