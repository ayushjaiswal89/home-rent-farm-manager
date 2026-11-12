import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Droplets,
  Sparkles,
  FlaskConical,
  Sprout,
  Wheat,
  Users,
  CheckCircle2,
  Circle,
  Calendar,
  X,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { FarmTask, Lang, Khet } from '../../lib/types';
import { saveFarmTasks } from '../../lib/profileAndSecurity';

interface ScheduleSectionProps {
  tasks: FarmTask[];
  setTasks: React.Dispatch<React.SetStateAction<FarmTask[]>>;
  khets?: Khet[];
  lang: Lang;
  onBack?: () => void;
}

export function getTaskCategoryIcon(category: FarmTask['category']) {
  switch (category) {
    case 'irrigation':
      return { icon: Droplets, bg: 'bg-blue-500', text: 'text-white' };
    case 'fertilizer':
      return { icon: Sparkles, bg: 'bg-emerald-600', text: 'text-white' };
    case 'pesticide':
      return { icon: FlaskConical, bg: 'bg-purple-600', text: 'text-white' };
    case 'sowing':
      return { icon: Sprout, bg: 'bg-green-600', text: 'text-white' };
    case 'harvesting':
      return { icon: Wheat, bg: 'bg-amber-500', text: 'text-white' };
    case 'labor':
      return { icon: Users, bg: 'bg-slate-700', text: 'text-white' };
    default:
      return { icon: Clock, bg: 'bg-teal-600', text: 'text-white' };
  }
}

export function getRelativeTimeBadge(dueDateStr: string, isHi: boolean) {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      label: isHi ? 'आज' : 'Today',
      className: 'bg-red-500 text-white font-bold',
    };
  } else if (diffDays === 1) {
    return {
      label: isHi ? 'कल' : 'Tomorrow',
      className: 'bg-orange-500 text-white font-bold',
    };
  } else if (diffDays > 1 && diffDays <= 7) {
    return {
      label: isHi ? `${diffDays} दिन बाद` : `In ${diffDays} days`,
      className: diffDays <= 3 ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white',
    };
  } else if (diffDays > 7 && diffDays <= 30) {
    return {
      label: isHi ? `${diffDays} दिन बाद` : `In ${diffDays} days`,
      className: 'bg-purple-100 text-purple-700 border border-purple-300 font-semibold',
    };
  } else if (diffDays > 30) {
    const months = Math.round(diffDays / 30);
    return {
      label: isHi ? `${months} माह बाद` : `In ${months} mos`,
      className: 'bg-slate-100 text-slate-600 border border-slate-200 font-medium',
    };
  } else {
    return {
      label: isHi ? `${Math.abs(diffDays)} दिन पहले` : `${Math.abs(diffDays)}d ago`,
      className: 'bg-rose-100 text-rose-700 font-medium',
    };
  }
}

export function ScheduleSection({ tasks, setTasks, khets = [], lang, onBack }: ScheduleSectionProps) {
  const isHi = lang === 'hi';
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FarmTask['category']>('irrigation');
  const [khetName, setKhetName] = useState(khets[0]?.name || 'खेत 1');
  const [cropName, setCropName] = useState('गेहूं');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' } : t
    );
    setTasks(updated);
    saveFarmTasks(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: FarmTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      category,
      khetName: khetName.trim() || undefined,
      cropName: cropName.trim() || undefined,
      dueDate,
      status: 'pending',
      notes: notes.trim() || undefined,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveFarmTasks(updated);
    setShowAddModal(false);
    setTitle('');
    setNotes('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-[720px] mx-auto px-3 sm:px-4 pb-20">
      {/* Top Header bar */}
      <div className="flex items-center justify-between py-3 mb-3 border-b border-slate-200 dark:border-[#1a3525]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#12271c] rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isHi ? 'काम का शेड्यूल' : 'Work Schedule'}
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>{isHi ? 'नया काम' : 'New Task'}</span>
        </button>
      </div>

      {/* Filter Tabs matching Screen 6 */}
      <div className="flex bg-slate-100 dark:bg-[#0c1a13] p-1 rounded-xl mb-4 border border-slate-200 dark:border-[#1e3c2c]">
        {(
          [
            { id: 'all', label: isHi ? 'सभी' : 'All' },
            { id: 'pending', label: isHi ? 'बकाया' : 'Pending' },
            { id: 'completed', label: isHi ? 'पूर्ण' : 'Completed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              filter === tab.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0c1a13] rounded-2xl border border-dashed border-slate-300 dark:border-[#1e3c2c] p-6">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
              {isHi ? 'कोई काम नहीं मिला' : 'No tasks found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isHi ? 'खेती के आगामी कार्यों की योजना बनाएं' : 'Plan upcoming farm tasks and schedules'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const { icon: CatIcon, bg: iconBg } = getTaskCategoryIcon(task.category);
            const badge = getRelativeTimeBadge(task.dueDate, isHi);
            const isDone = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0c1a13] border transition-all ${
                  isDone
                    ? 'border-slate-200 dark:border-[#1a3525] opacity-60 bg-slate-50/70 dark:bg-[#07130e]'
                    : 'border-slate-200 dark:border-[#1e3c2c] shadow-xs hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Category circular icon matching image */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} text-white shadow-xs`}
                  >
                    <CatIcon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate ${
                        isDone ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>
                        {new Date(task.dueDate).toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {/* Relative Badge */}
                  {!isDone && badge && (
                    <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#12271c] text-slate-600 dark:text-slate-400 font-semibold">
                      {isHi ? 'पूर्ण' : 'Done'}
                    </span>
                  )}

                  {/* Toggle check button */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDone
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-slate-400 hover:text-emerald-600'
                    }`}
                    title={isDone ? 'अपूर्ण करें' : 'पूर्ण चिह्नित करें'}
                  >
                    {isDone ? <CheckCircle2 size={22} className="fill-emerald-500 text-white" /> : <Circle size={22} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating "+ नया काम जोड़ें" bar button matching Screen 6 */}
      <div className="mt-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
        >
          <Plus size={18} />
          <span>{isHi ? 'नया काम जोड़ें' : 'Add New Task'}</span>
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c1a13] border border-slate-200 dark:border-[#1e3c2c] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1a3525]">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isHi ? 'नया खेती कार्य जोड़ें' : 'Add New Farm Task'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5 mt-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'कार्य का नाम / विवरण' : 'Task Title'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isHi ? 'उदा: सिंचाई - गेहूं (खेत 1)' : 'e.g. Irrigation - Wheat (Field 1)'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FarmTask['category'])}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="irrigation">{isHi ? '💧 सिंचाई (Irrigation)' : 'Irrigation'}</option>
                    <option value="fertilizer">{isHi ? '🌿 खाद (Fertilizer)' : 'Fertilizer'}</option>
                    <option value="pesticide">{isHi ? '🧪 दवा छिड़काव (Pesticide)' : 'Pesticide'}</option>
                    <option value="sowing">{isHi ? '🌱 बुआई (Sowing)' : 'Sowing'}</option>
                    <option value="harvesting">{isHi ? '🌾 कटाई (Harvesting)' : 'Harvesting'}</option>
                    <option value="labor">{isHi ? '👥 मजदूर (Labor)' : 'Labor'}</option>
                    <option value="other">{isHi ? '⚙️ अन्य (Other)' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'तारीख' : 'Due Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'खेत (वैकल्पिक)' : 'Field (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'उदा: खेत 1' : 'Field 1'}
                    value={khetName}
                    onChange={(e) => setKhetName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isHi ? 'फसल (वैकल्पिक)' : 'Crop (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isHi ? 'उदा: गेहूं' : 'Wheat'}
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHi ? 'अतिरिक्त टिप्पणी' : 'Notes'}
                </label>
                <input
                  type="text"
                  placeholder={isHi ? 'उदा: यूरिया 1 बोरी डालना है' : 'Notes...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-[#1e3c2c] bg-white dark:bg-[#07130e] text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-[#1e3c2c] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                >
                  {isHi ? 'सेव करें' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
