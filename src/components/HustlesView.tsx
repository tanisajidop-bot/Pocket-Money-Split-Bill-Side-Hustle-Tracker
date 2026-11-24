import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Briefcase,
} from 'lucide-react';
import {
  AppState,
  HUSTLE_STREAMS,
  HustleItem,
  HustleStatus,
  HustleStream,
} from '../types';
import {
  formatMoney,
  formatShortDate,
  fromInputToPkr,
  getTodayIso,
} from '../utils/currency';

interface HustlesViewProps {
  state: AppState;
  onAddHustle: (hustle: Omit<HustleItem, 'id'>) => void;
  onUpdateHustleStatus: (id: string, status: HustleStatus) => void;
  onDeleteHustle: (id: string) => void;
  onToggleChecklist: (id: string) => void;
  onAddChecklistItem: (title: string) => void;
}

const STATUS_OPTIONS: HustleStatus[] = ['Pending', 'In Progress', 'Paid'];

export function HustlesView({
  state,
  onAddHustle,
  onUpdateHustleStatus,
  onDeleteHustle,
  onToggleChecklist,
  onAddChecklistItem,
}: HustlesViewProps) {
  const { currency, hustles, checklist } = state;
  const [statusFilter, setStatusFilter] = useState<'All' | HustleStatus>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add hustle form state
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [stream, setStream] = useState<HustleStream>('Video Editing');
  const [status, setStatus] = useState<HustleStatus>('In Progress');
  const [amountInput, setAmountInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // New checklist milestone
  const [newMilestone, setNewMilestone] = useState('');

  const totals = useMemo(() => {
    let paidPkr = 0;
    let inProgressPkr = 0;
    let pendingPkr = 0;
    for (const h of hustles) {
      if (h.status === 'Paid') paidPkr += h.amountPkr;
      else if (h.status === 'In Progress') inProgressPkr += h.amountPkr;
      else pendingPkr += h.amountPkr;
    }
    return {
      paidPkr,
      inProgressPkr,
      pendingPkr,
      totalPipelinePkr: inProgressPkr + pendingPkr,
    };
  }, [hustles]);

  const filteredHustles = useMemo(() => {
    const list =
      statusFilter === 'All'
        ? hustles
        : hustles.filter((h) => h.status === statusFilter);
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [hustles, statusFilter]);

  const completedCount = checklist.filter((c) => c.completed).length;
  const checklistPct =
    checklist.length > 0
      ? Math.round((completedCount / checklist.length) * 100)
      : 0;

  const handleAddHustleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const val = parseFloat(amountInput);
    if (!val || val <= 0) {
      setFormError('Enter an earned or project amount greater than 0.');
      return;
    }

    onAddHustle({
      title: title.trim() || stream,
      client: client.trim() || 'Direct Client',
      stream,
      status,
      amountPkr: fromInputToPkr(val, currency),
      date: getTodayIso(),
    });

    setTitle('');
    setClient('');
    setAmountInput('');
    setShowAddForm(false);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMilestone.trim();
    if (!trimmed) return;
    onAddChecklistItem(trimmed);
    setNewMilestone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Income Streams & Growth
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Side-Hustle & Skills
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="self-start sm:self-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'New Hustle Gig'}</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Paid Earnings
          </span>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(totals.paidPkr, currency)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            In Progress / Pending
          </span>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatMoney(totals.totalPipelinePkr, currency)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Skill Checklist Progress
          </span>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {completedCount}/{checklist.length}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({checklistPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Inline Add Hustle Form */}
      {showAddForm && (
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Log Side-Hustle Project
          </h2>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddHustleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Project / Gig Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Thumbnail Pack"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Client / Buyer
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g., Studio X"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={currency === 'PKR' ? '5000' : '40.00'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Skill Stream
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value as HustleStream)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                >
                  {HUSTLE_STREAMS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStatus(opt)}
                      className={`min-h-[44px] px-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        status === opt
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Save Hustle
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Main 2-Column Area: Hustle Gigs Left, Skill & First-Client Checklist Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Gigs & Streams */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Income Streams
            </h2>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              {(['All', ...STATUS_OPTIONS] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredHustles.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Briefcase className="w-7 h-7 mx-auto text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No gigs matching "{statusFilter}".
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Add First Side-Hustle
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHustles.map((hustle) => (
                <li
                  key={hustle.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {hustle.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {hustle.stream} · {hustle.client} ·{' '}
                      {formatShortDate(hustle.date)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatMoney(hustle.amountPkr, currency)}
                    </span>

                    <select
                      aria-label={`Status for ${hustle.title}`}
                      value={hustle.status}
                      onChange={(e) =>
                        onUpdateHustleStatus(
                          hustle.id,
                          e.target.value as HustleStatus
                        )
                      }
                      className={`h-9 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none ${
                        hustle.status === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : hustle.status === 'In Progress'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => onDeleteHustle(hustle.id)}
                      aria-label={`Delete ${hustle.title}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right: Starter Skill & First-Client Checklist */}
        <section className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Skill & First-Client Checklist
              </h2>
              <span className="font-mono text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {checklistPct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {checklist.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onToggleChecklist(item.id)}
                  className="w-full py-3 flex items-start gap-3 text-left group cursor-pointer"
                >
                  <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold transition-colors ${
                        item.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddMilestone} className="pt-2 flex gap-2">
            <input
              type="text"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              placeholder="Add custom milestone..."
              className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="min-h-[40px] px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Add Step
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
