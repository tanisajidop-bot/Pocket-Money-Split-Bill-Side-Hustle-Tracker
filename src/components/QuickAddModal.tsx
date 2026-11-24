import React, { useState, useEffect } from 'react';
import { X, Plus, Check, UserPlus } from 'lucide-react';
import {
  CurrencyCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  ExpenseItem,
  Friend,
  HUSTLE_STREAMS,
  HustleItem,
  HustleStatus,
  HustleStream,
  SplitBill,
} from '../types';
import {
  formatMoney,
  fromInputToPkr,
  getTodayIso,
} from '../utils/currency';
import { calculateEqualShares } from '../utils/splitMath';

export type QuickAddMode = 'expense' | 'split' | 'hustle';

interface QuickAddModalProps {
  isOpen: boolean;
  initialMode: QuickAddMode;
  currency: CurrencyCode;
  friends: Friend[];
  onClose: () => void;
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onAddBill: (bill: Omit<SplitBill, 'id'>) => void;
  onAddHustle: (hustle: Omit<HustleItem, 'id'>) => void;
  onAddFriend: (name: string) => Friend;
  onOpenFullSplitTab: () => void;
}

const EXPENSE_PRESETS: { label: string; category: ExpenseCategory }[] = [
  { label: 'Chai & Snacks', category: 'Food/Cafe' },
  { label: 'Ride / Cab', category: 'Transport/Ride' },
  { label: 'Lunch', category: 'Food/Cafe' },
  { label: 'Printing', category: 'Study/Printing' },
  { label: 'Mobile Data', category: 'Data/Subscriptions' },
];

export function QuickAddModal({
  isOpen,
  initialMode,
  currency,
  friends,
  onClose,
  onAddExpense,
  onAddBill,
  onAddHustle,
  onAddFriend,
  onOpenFullSplitTab,
}: QuickAddModalProps) {
  const [mode, setMode] = useState<QuickAddMode>(initialMode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expense fields
  const [expAmount, setExpAmount] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Food/Cafe');
  const [expDate, setExpDate] = useState(getTodayIso());

  // Split Bill fields
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billTip, setBillTip] = useState('');
  const [billPayerId, setBillPayerId] = useState('you');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(['you']);
  const [newFriendName, setNewFriendName] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);

  // Hustle fields
  const [husTitle, setHusTitle] = useState('');
  const [husClient, setHusClient] = useState('');
  const [husStream, setHusStream] = useState<HustleStream>('Video Editing');
  const [husStatus, setHusStatus] = useState<HustleStatus>('Paid');
  const [husAmount, setHusAmount] = useState('');
  const [husDate, setHusDate] = useState(getTodayIso());

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setExpDate(getTodayIso());
      setHusDate(getTodayIso());
      setSelectedParticipantIds(
        friends.slice(0, Math.min(3, friends.length)).map((f) => f.id)
      );
      setBillPayerId('you');
    }
  }, [isOpen, initialMode, friends]);

  if (!isOpen) return null;

  const handleToggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateFriend = () => {
    const trimmed = newFriendName.trim();
    if (!trimmed) return;
    const created = onAddFriend(trimmed);
    setSelectedParticipantIds((prev) => [...prev, created.id]);
    setNewFriendName('');
    setShowAddFriend(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'expense') {
      const val = parseFloat(expAmount);
      if (!val || val <= 0) {
        setErrorMsg('Enter an amount greater than 0.');
        return;
      }
      onAddExpense({
        title: expTitle.trim() || expCategory,
        amountPkr: fromInputToPkr(val, currency),
        category: expCategory,
        date: expDate || getTodayIso(),
      });
      setExpAmount('');
      setExpTitle('');
      onClose();
      return;
    }

    if (mode === 'split') {
      const totalVal = parseFloat(billAmount);
      const tipVal = parseFloat(billTip) || 0;
      if (!totalVal || totalVal <= 0) {
        setErrorMsg('Enter a bill total greater than 0.');
        return;
      }
      if (selectedParticipantIds.length < 2) {
        setErrorMsg('Select at least 2 people to split with.');
        return;
      }
      const totalPkr = fromInputToPkr(totalVal, currency);
      const tipPkr = fromInputToPkr(tipVal, currency);
      const combined = totalPkr + tipPkr;
      const participantsWithPayer = selectedParticipantIds.includes(billPayerId)
        ? selectedParticipantIds
        : [billPayerId, ...selectedParticipantIds];

      onAddBill({
        title: billTitle.trim() || 'Group Split',
        totalAmountPkr: totalPkr,
        tipOrTaxPkr: tipPkr,
        payerId: billPayerId,
        splitMode: 'equal',
        shares: calculateEqualShares(combined, participantsWithPayer, billPayerId),
        date: getTodayIso(),
      });
      setBillTitle('');
      setBillAmount('');
      setBillTip('');
      onClose();
      return;
    }

    if (mode === 'hustle') {
      const val = parseFloat(husAmount);
      if (!val || val <= 0) {
        setErrorMsg('Enter an amount greater than 0.');
        return;
      }
      onAddHustle({
        title: husTitle.trim() || husStream,
        client: husClient.trim() || 'Direct Client',
        stream: husStream,
        status: husStatus,
        amountPkr: fromInputToPkr(val, currency),
        date: husDate || getTodayIso(),
      });
      setHusTitle('');
      setHusClient('');
      setHusAmount('');
      onClose();
    }
  };

  const splitTotalPreviewPkr =
    fromInputToPkr((parseFloat(billAmount) || 0) + (parseFloat(billTip) || 0), currency);
  const splitCount = Math.max(1, selectedParticipantIds.length);
  const perPersonPreviewPkr = Math.round(splitTotalPreviewPkr / splitCount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-heading"
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h2
            id="quick-add-heading"
            className="font-display text-lg font-bold text-slate-900 dark:text-white"
          >
            Quick Log
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick log modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(
              [
                { id: 'expense', label: 'Expense' },
                { id: 'split', label: 'Split Bill' },
                { id: 'hustle', label: 'Side-Hustle' },
              ] as { id: QuickAddMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  mode === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {mode === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  autoFocus
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder={currency === 'PKR' ? '450' : '5.00'}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  1-Tap Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setExpTitle(preset.label);
                        setExpCategory(preset.category);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    What did you spend on?
                  </label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="e.g., Campus Chai"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExpCategory(cat)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium border text-left truncate transition-colors cursor-pointer ${
                        expCategory === cat
                          ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'split' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Bill Title
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    placeholder="e.g., Lunch, Cab, Pizza"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Total ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder={currency === 'PKR' ? '1800' : '24.00'}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Tip / Tax ({currency}, optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    value={billTip}
                    onChange={(e) => setBillTip(e.target.value)}
                    placeholder="0"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-sm tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Who Paid?
                  </label>
                  <select
                    value={billPayerId}
                    onChange={(e) => setBillPayerId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {friends.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Split Equally With
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddFriend((v) => !v)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </button>
                </div>

                {showAddFriend && (
                  <div className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      placeholder="Friend's name"
                      className="flex-1 h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFriend}
                      className="px-3.5 h-10 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {friends.map((friend) => {
                    const selected = selectedParticipantIds.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => handleToggleParticipant(friend.id)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          selected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        <span>{friend.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Equal split ({splitCount} people)
                  </div>
                  <div className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatMoney(perPersonPreviewPkr, currency)} / person
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullSplitTab();
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Exact or % split →
                </button>
              </div>
            </>
          )}

          {mode === 'hustle' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Earned / Gig Amount ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  autoFocus
                  value={husAmount}
                  onChange={(e) => setHusAmount(e.target.value)}
                  placeholder={currency === 'PKR' ? '5000' : '45.00'}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Project / Gig Title
                  </label>
                  <input
                    type="text"
                    value={husTitle}
                    onChange={(e) => setHusTitle(e.target.value)}
                    placeholder="e.g., TikTok Reel Edit"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Client / Buyer
                  </label>
                  <input
                    type="text"
                    value={husClient}
                    onChange={(e) => setHusClient(e.target.value)}
                    placeholder="e.g., Local Cafe"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Skill Stream
                  </label>
                  <select
                    value={husStream}
                    onChange={(e) => setHusStream(e.target.value as HustleStream)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    Date
                  </label>
                  <input
                    type="date"
                    value={husDate}
                    onChange={(e) => setHusDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'In Progress', 'Paid'] as HustleStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setHusStatus(st)}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          husStatus === st
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {mode === 'expense'
                  ? 'Save Expense'
                  : mode === 'split'
                  ? 'Create Split Bill'
                  : 'Save Hustle'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
