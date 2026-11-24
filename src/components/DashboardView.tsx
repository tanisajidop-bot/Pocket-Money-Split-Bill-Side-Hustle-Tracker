import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Trash2,
  Receipt,
  Wallet,
} from 'lucide-react';
import {
  AppState,
  NavTab,
} from '../types';
import {
  formatMoney,
  formatShortDate,
  getCurrentMonthStats,
} from '../utils/currency';
import { computeSplitNetSummary } from '../utils/splitMath';
import { QuickAddMode } from './QuickAddModal';

type ActivityFilter = 'all' | 'pocket' | 'split' | 'hustle';

interface ActivityEntry {
  id: string;
  rawId: string;
  kind: 'pocket' | 'split' | 'hustle';
  title: string;
  meta: string;
  date: string;
  amountPkr: number;
  isPositive: boolean;
  statusLabel?: string;
}

interface DashboardViewProps {
  state: AppState;
  onOpenQuickAdd: (mode: QuickAddMode) => void;
  onNavigate: (tab: NavTab) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteBill: (id: string) => void;
  onDeleteHustle: (id: string) => void;
}

export function DashboardView({
  state,
  onOpenQuickAdd,
  onNavigate,
  onDeleteExpense,
  onDeleteBill,
  onDeleteHustle,
}: DashboardViewProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const { currency, budget, expenses, bills, friends, hustles } = state;

  const budgetStats = useMemo(
    () => getCurrentMonthStats(expenses, budget),
    [expenses, budget]
  );

  const splitSummary = useMemo(
    () => computeSplitNetSummary(bills, friends, 'you'),
    [bills, friends]
  );

  const hustleStats = useMemo(() => {
    let paidPkr = 0;
    let pipelinePkr = 0;
    let activeCount = 0;
    for (const h of hustles) {
      if (h.status === 'Paid') {
        paidPkr += h.amountPkr;
      } else {
        pipelinePkr += h.amountPkr;
        activeCount += 1;
      }
    }
    return { paidPkr, pipelinePkr, activeCount };
  }, [hustles]);

  const activities = useMemo<ActivityEntry[]>(() => {
    const friendMap = new Map(friends.map((f) => [f.id, f.name]));
    const list: ActivityEntry[] = [];

    for (const exp of expenses) {
      list.push({
        id: `exp-${exp.id}`,
        rawId: exp.id,
        kind: 'pocket',
        title: exp.title,
        meta: `${exp.category} · ${formatShortDate(exp.date)}`,
        date: exp.date,
        amountPkr: exp.amountPkr,
        isPositive: false,
      });
    }

    for (const bill of bills) {
      const payerName = friendMap.get(bill.payerId) ?? 'Friend';
      const totalWithTip = bill.totalAmountPkr + bill.tipOrTaxPkr;
      const unsettledCount = bill.shares.filter(
        (s) => !s.settled && s.friendId !== bill.payerId
      ).length;
      list.push({
        id: `bill-${bill.id}`,
        rawId: bill.id,
        kind: 'split',
        title: bill.title,
        meta: `Paid by ${payerName} · ${bill.shares.length} people · ${formatShortDate(
          bill.date
        )}`,
        date: bill.date,
        amountPkr: totalWithTip,
        isPositive: false,
        statusLabel:
          unsettledCount === 0
            ? 'Settled'
            : `${unsettledCount} unpaid`,
      });
    }

    for (const h of hustles) {
      list.push({
        id: `hus-${h.id}`,
        rawId: h.id,
        kind: 'hustle',
        title: h.title,
        meta: `${h.stream} · ${h.client} · ${formatShortDate(h.date)}`,
        date: h.date,
        amountPkr: h.amountPkr,
        isPositive: true,
        statusLabel: h.status,
      });
    }

    list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return list;
  }, [expenses, bills, friends, hustles]);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    return activities.filter((item) => item.kind === filter);
  }, [activities, filter]);

  const clampedProgress = Math.min(100, Math.max(0, budgetStats.percentUsed));
  const showAlertBanner =
    budgetStats.isOverMonthly ||
    budgetStats.isNear80 ||
    budgetStats.isOverDailyLimit;

  const progressBarTone = budgetStats.isOverMonthly
    ? 'bg-rose-600 dark:bg-rose-500'
    : budgetStats.isNear80
    ? 'bg-amber-500 dark:bg-amber-400'
    : 'bg-emerald-600 dark:bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Page Intro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {budgetStats.monthLabel}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Money & Hustle Overview
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('insights')}
          className="self-start sm:self-auto min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Adjust Budget</span>
        </button>
      </div>

      {/* Smart Budget Alert Banner */}
      {showAlertBanner && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            budgetStats.isOverMonthly
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-100'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-100'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              budgetStats.isOverMonthly
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <div className="text-sm space-y-0.5">
            <p className="font-semibold">
              {budgetStats.isOverMonthly
                ? 'Monthly Budget Exceeded'
                : budgetStats.isOverDailyLimit
                ? 'Daily Spending Limit Exceeded'
                : `Budget Guard: ${Math.round(budgetStats.percentUsed)}% of Monthly Allowance Used`}
            </p>
            <p className="text-xs opacity-90">
              {budgetStats.isOverMonthly
                ? `You are ${formatMoney(
                    Math.abs(budgetStats.remainingPkr),
                    currency
                  )} over your monthly pocket money limit. Pause non-essential spends or cover the gap with side-hustle earnings.`
                : budgetStats.isOverDailyLimit && budget.dailyLimitPkr
                ? `Today's spend (${formatMoney(
                    budgetStats.todaySpentPkr,
                    currency
                  )}) crossed your ${formatMoney(
                    budget.dailyLimitPkr,
                    currency
                  )} daily cap. Keep tomorrow light at ${formatMoney(
                    budgetStats.safePerDayPkr,
                    currency
                  )}/day.`
                : `You have ${formatMoney(
                    budgetStats.remainingPkr,
                    currency
                  )} left for the next ${budgetStats.daysLeftInMonth} days (${formatMoney(
                    budgetStats.safePerDayPkr,
                    currency
                  )}/day safe pace).`}
            </p>
          </div>
        </div>
      )}

      {/* Hero Pocket Money Budget Card + 3 Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Budget Progress Card */}
        <section className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Pocket Money
              </span>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatMoney(budgetStats.monthlySpentPkr, currency)}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  of {formatMoney(budgetStats.monthlyAllowancePkr, currency)} spent
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`font-mono text-sm font-bold tabular-nums ${
                  budgetStats.isOverMonthly
                    ? 'text-rose-600 dark:text-rose-400'
                    : budgetStats.isNear80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {Math.round(budgetStats.percentUsed)}%
              </span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                used
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div
              className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(clampedProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressBarTone}`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                Safe pace:{' '}
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {formatMoney(budgetStats.safePerDayPkr, currency)}/day
                </strong>
              </span>
              <span>
                {budgetStats.daysLeftInMonth}{' '}
                {budgetStats.daysLeftInMonth === 1 ? 'day' : 'days'} left
              </span>
            </div>
          </div>
        </section>

        {/* 3 Summary Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {/* Card 1: Remaining Pocket Money */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Remaining</span>
              <Wallet className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div
                className={`font-mono text-xl font-bold tabular-nums ${
                  budgetStats.remainingPkr < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatMoney(budgetStats.remainingPkr, currency)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Today: {formatMoney(budgetStats.todaySpentPkr, currency)}
              </p>
            </div>
          </div>

          {/* Card 2: Split Bill Balance */}
          <button
            type="button"
            onClick={() => onNavigate('split')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 w-full">
              <span className="text-xs font-semibold">Split Balance</span>
              <Users className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div
                className={`font-mono text-xl font-bold tabular-nums ${
                  splitSummary.netBalancePkr > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : splitSummary.netBalancePkr < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {splitSummary.netBalancePkr === 0
                  ? formatMoney(0, currency)
                  : formatMoney(splitSummary.netBalancePkr, currency, {
                      showSign: true,
                    })}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {splitSummary.netBalancePkr > 0
                  ? `Friends owe ${formatMoney(splitSummary.owedToYouPkr, currency)}`
                  : splitSummary.netBalancePkr < 0
                  ? `You owe ${formatMoney(splitSummary.youOwePkr, currency)}`
                  : 'All settled up'}
              </p>
            </div>
          </button>

          {/* Card 3: Side-Hustle Earnings */}
          <button
            type="button"
            onClick={() => onNavigate('hustles')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 w-full">
              <span className="text-xs font-semibold">Hustle Paid</span>
              <Briefcase className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(hustleStats.paidPkr, currency)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {hustleStats.activeCount > 0
                  ? `${formatMoney(hustleStats.pipelinePkr, currency)} pending`
                  : 'No pending gigs'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Add Action Bar (Under 10-second logging) */}
      <section aria-label="Quick actions" className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onOpenQuickAdd('expense')}
          className="min-h-[48px] px-3 sm:px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Log Expense</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenQuickAdd('split')}
          className="min-h-[48px] px-3 sm:px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Users className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Split Bill</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenQuickAdd('hustle')}
          className="min-h-[48px] px-3 sm:px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>Add Hustle</span>
        </button>
      </section>

      {/* Recent Activity Feed */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Recent Activity
          </h2>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pocket', label: 'Pocket Money' },
                { id: 'split', label: 'Split Bills' },
                { id: 'hustle', label: 'Side-Hustle' },
              ] as { id: ActivityFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No activity in this filter yet.
            </p>
            <button
              type="button"
              onClick={() =>
                onOpenQuickAdd(
                  filter === 'split'
                    ? 'split'
                    : filter === 'hustle'
                    ? 'hustle'
                    : 'expense'
                )
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Log First Entry
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredActivities.slice(0, 15).map((item) => (
              <li
                key={item.id}
                className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.kind === 'hustle'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : item.kind === 'split'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.kind === 'hustle' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : item.kind === 'split' ? (
                      <Receipt className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.meta}
                      {item.statusLabel ? ` · ${item.statusLabel}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      item.isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.isPositive ? '+' : '-'}
                    {formatMoney(item.amountPkr, currency)}
                  </span>

                  <button
                    type="button"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => {
                      if (item.kind === 'pocket') onDeleteExpense(item.rawId);
                      else if (item.kind === 'split') onDeleteBill(item.rawId);
                      else onDeleteHustle(item.rawId);
                    }}
                    className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
