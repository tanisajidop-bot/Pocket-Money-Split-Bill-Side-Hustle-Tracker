import React, { useMemo, useState } from 'react';
import {
  Check,
  UserPlus,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  AppState,
  BillShare,
  Friend,
  SplitBill,
  SplitMode,
} from '../types';
import {
  formatMoney,
  formatShortDate,
  fromInputToPkr,
  getTodayIso,
  toDisplayAmount,
} from '../utils/currency';
import {
  calculateEqualShares,
  calculateExactSharesWithTip,
  calculatePercentageShares,
  computeSplitNetSummary,
} from '../utils/splitMath';

interface SplitBillViewProps {
  state: AppState;
  onAddBill: (bill: Omit<SplitBill, 'id'>) => void;
  onToggleShareSettled: (billId: string, friendId: string) => void;
  onSettleEntireBill: (billId: string) => void;
  onDeleteBill: (billId: string) => void;
  onAddFriend: (name: string) => Friend;
}

export function SplitBillView({
  state,
  onAddBill,
  onToggleShareSettled,
  onSettleEntireBill,
  onDeleteBill,
  onAddFriend,
}: SplitBillViewProps) {
  const { currency, friends, bills } = state;
  const friendMap = useMemo(
    () => new Map(friends.map((f) => [f.id, f.name])),
    [friends]
  );

  // Calculator form state
  const [title, setTitle] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [tipInput, setTipInput] = useState('');
  const [payerId, setPayerId] = useState('you');
  const [participantIds, setParticipantIds] = useState<string[]>(() =>
    friends.slice(0, Math.min(3, friends.length)).map((f) => f.id)
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [exactInputs, setExactInputs] = useState<Record<string, string>>({});
  const [pctInputs, setPctInputs] = useState<Record<string, string>>({});
  const [newFriendName, setNewFriendName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const summary = useMemo(
    () => computeSplitNetSummary(bills, friends, 'you'),
    [bills, friends]
  );

  const totalPkr = fromInputToPkr(parseFloat(totalInput) || 0, currency);
  const tipPkr = fromInputToPkr(parseFloat(tipInput) || 0, currency);
  const combinedPkr = totalPkr + tipPkr;

  const activeParticipants = useMemo(() => {
    return participantIds.filter((id) => friends.some((f) => f.id === id));
  }, [participantIds, friends]);

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddFriend = () => {
    const trimmed = newFriendName.trim();
    if (!trimmed) return;
    const created = onAddFriend(trimmed);
    setParticipantIds((prev) => [...prev, created.id]);
    setNewFriendName('');
  };

  // Live preview shares & validation
  const exactSumDisplay = activeParticipants.reduce(
    (sum, id) => sum + (parseFloat(exactInputs[id] || '0') || 0),
    0
  );
  const totalInputNumeric = parseFloat(totalInput) || 0;
  const exactRemainingDisplay = totalInputNumeric - exactSumDisplay;

  const pctSum = activeParticipants.reduce(
    (sum, id) => sum + (parseFloat(pctInputs[id] || '0') || 0),
    0
  );

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (totalInputNumeric <= 0) {
      setFormError('Enter a total bill amount greater than 0.');
      return;
    }

    const participantsWithPayer = activeParticipants.includes(payerId)
      ? activeParticipants
      : [payerId, ...activeParticipants];

    if (participantsWithPayer.length < 2) {
      setFormError('Select at least 2 participants to split this bill.');
      return;
    }

    let shares: BillShare[] = [];

    if (splitMode === 'equal') {
      shares = calculateEqualShares(combinedPkr, participantsWithPayer, payerId);
    } else if (splitMode === 'exact') {
      if (Math.abs(exactRemainingDisplay) > 0.05) {
        setFormError(
          `Exact amounts must add up to ${formatMoney(
            totalPkr,
            currency
          )} (tip/tax is split proportionally).`
        );
        return;
      }
      const exactPkrMap: Record<string, number> = {};
      for (const id of participantsWithPayer) {
        exactPkrMap[id] = fromInputToPkr(parseFloat(exactInputs[id] || '0') || 0, currency);
      }
      shares = calculateExactSharesWithTip(
        exactPkrMap,
        tipPkr,
        participantsWithPayer,
        payerId
      );
    } else {
      if (Math.abs(pctSum - 100) > 0.1) {
        setFormError('Percentages must add up to 100%.');
        return;
      }
      const pctMap: Record<string, number> = {};
      for (const id of participantsWithPayer) {
        pctMap[id] = parseFloat(pctInputs[id] || '0') || 0;
      }
      shares = calculatePercentageShares(
        combinedPkr,
        pctMap,
        participantsWithPayer,
        payerId
      );
    }

    onAddBill({
      title: title.trim() || 'Group Split',
      totalAmountPkr: totalPkr,
      tipOrTaxPkr: tipPkr,
      payerId,
      splitMode,
      shares,
      date: getTodayIso(),
    });

    setTitle('');
    setTotalInput('');
    setTipInput('');
    setExactInputs({});
    setPctInputs({});
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Group Expenses & Settlements
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Fast Split Bill
        </h1>
      </div>

      {/* Desktop 2-Column Split: Calculator Left, Who Owes Whom + Ledger Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Split Bill Calculator */}
        <section className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Create a Split
          </h2>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateBill} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Bill Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lunch, InDrive Cab, Snacks"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Bill Amount ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  placeholder={currency === 'PKR' ? '2400' : '24.00'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Tip / Tax ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  inputMode="decimal"
                  value={tipInput}
                  onChange={(e) => setTipInput(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Who Paid?
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Friends in This Split
              </label>
              <div className="flex flex-wrap gap-2 mb-2.5">
                {friends.map((friend) => {
                  const selected = activeParticipants.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => toggleParticipant(friend.id)}
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFriend();
                    }
                  }}
                  placeholder="Add friend name..."
                  className="flex-1 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Split Mode Segmented Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Split Method
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(
                  [
                    { id: 'equal', label: 'Equal' },
                    { id: 'exact', label: 'Exact' },
                    { id: 'percentage', label: 'Percent %' },
                  ] as { id: SplitMode; label: string }[]
                ).map((modeTab) => (
                  <button
                    key={modeTab.id}
                    type="button"
                    onClick={() => setSplitMode(modeTab.id)}
                    className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      splitMode === modeTab.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {modeTab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode-Specific Breakdown Inputs */}
            {splitMode === 'equal' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Each person ({Math.max(1, activeParticipants.length)})
                </span>
                <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatMoney(
                    Math.round(
                      combinedPkr / Math.max(1, activeParticipants.length)
                    ),
                    currency
                  )}
                </span>
              </div>
            )}

            {splitMode === 'exact' && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Exact shares ({currency})
                  </span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      Math.abs(exactRemainingDisplay) <= 0.05
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {Math.abs(exactRemainingDisplay) <= 0.05
                      ? 'Balanced'
                      : `${
                          exactRemainingDisplay > 0 ? 'Left' : 'Over'
                        }: ${toDisplayAmount(
                          fromInputToPkr(Math.abs(exactRemainingDisplay), currency),
                          currency
                        )}`}
                  </span>
                </div>
                {activeParticipants.map((id) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {friendMap.get(id) ?? id}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      inputMode="decimal"
                      value={exactInputs[id] ?? ''}
                      onChange={(e) =>
                        setExactInputs((prev) => ({
                          ...prev,
                          [id]: e.target.value,
                        }))
                      }
                      placeholder="0"
                      className="w-28 h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs tabular-nums text-right text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {splitMode === 'percentage' && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Percentage shares
                  </span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      Math.abs(pctSum - 100) <= 0.1
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {Math.round(pctSum * 10) / 10}% / 100%
                  </span>
                </div>
                {activeParticipants.map((id) => (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {friendMap.get(id) ?? id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        value={pctInputs[id] ?? ''}
                        onChange={(e) =>
                          setPctInputs((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-20 h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs tabular-nums text-right text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Split Bill</span>
            </button>
          </form>
        </section>

        {/* Right: Who Owes Whom + Group Bills Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Who Owes Whom Summary */}
          <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Who Owes Whom
              </h2>
              <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Owed to you:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatMoney(summary.owedToYouPkr, currency)}
                </strong>{' '}
                · You owe:{' '}
                <strong className="text-rose-600 dark:text-rose-400">
                  {formatMoney(summary.youOwePkr, currency)}
                </strong>
              </div>
            </div>

            {summary.debtLines.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center gap-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Everyone is completely settled up.</span>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.debtLines.map((line) => (
                  <li
                    key={`${line.fromId}-${line.toId}`}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 min-w-0">
                      <span className="font-semibold truncate">
                        {line.fromName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        owes
                      </span>
                      <span className="font-semibold truncate">
                        {line.toName}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                        line.toId === 'you'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : line.fromId === 'you'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatMoney(line.amountPkr, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Group Bills List */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Group Bills ({bills.length})
            </h2>

            {bills.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                No split bills logged yet. Create your first group bill on the left.
              </div>
            ) : (
              bills.map((bill) => {
                const payerName = friendMap.get(bill.payerId) ?? 'Friend';
                const combinedBillPkr = bill.totalAmountPkr + bill.tipOrTaxPkr;
                const nonPayerShares = bill.shares.filter(
                  (s) => s.friendId !== bill.payerId
                );
                const allSettled = nonPayerShares.every((s) => s.settled);

                return (
                  <article
                    key={bill.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                          {bill.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paid by {payerName} · {bill.splitMode} split ·{' '}
                          {formatShortDate(bill.date)}
                          {bill.tipOrTaxPkr > 0
                            ? ` · Includes ${formatMoney(
                                bill.tipOrTaxPkr,
                                currency
                              )} tip/tax`
                            : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatMoney(combinedBillPkr, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteBill(bill.id)}
                          aria-label={`Delete bill ${bill.title}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border-t border-slate-100 dark:border-slate-800 pt-1">
                      {bill.shares.map((share) => {
                        const name = friendMap.get(share.friendId) ?? 'Friend';
                        const isPayer = share.friendId === bill.payerId;
                        return (
                          <div
                            key={share.friendId}
                            className="py-2 flex items-center justify-between gap-3"
                          >
                            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {name}
                              </span>{' '}
                              <span className="text-slate-500 dark:text-slate-400">
                                {isPayer
                                  ? 'paid the bill'
                                  : share.settled
                                  ? `settled with ${payerName}`
                                  : `owes ${payerName}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                                {formatMoney(share.amountPkr, currency)}
                              </span>

                              {!isPayer && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onToggleShareSettled(bill.id, share.friendId)
                                  }
                                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                                    share.settled
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {share.settled ? 'Paid' : 'Mark Paid'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!allSettled && nonPayerShares.length > 1 && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onSettleEntireBill(bill.id)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        >
                          Settle All Shares
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
