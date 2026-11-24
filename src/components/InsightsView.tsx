import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  AppState,
  CurrencyCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from '../types';
import {
  formatMoney,
  fromInputToPkr,
  getCurrentMonthStats,
  toDisplayAmount,
} from '../utils/currency';

interface InsightsViewProps {
  state: AppState;
  onUpdateBudget: (monthlyAllowancePkr: number, dailyLimitPkr: number | null) => void;
  onSetCurrency: (currency: CurrencyCode) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Food/Cafe': '#10b981', // emerald-500
  'Transport/Ride': '#0ea5e9', // sky-500
  'Data/Subscriptions': '#6366f1', // indigo-500
  Shopping: '#f59e0b', // amber-500
  'Study/Printing': '#14b8a6', // teal-500
  Entertainment: '#f43f5e', // rose-500
};

export function InsightsView({
  state,
  onUpdateBudget,
  onSetCurrency,
  onResetSampleData,
  onClearAllData,
}: InsightsViewProps) {
  const { currency, budget, expenses, hustles } = state;

  const budgetStats = useMemo(
    () => getCurrentMonthStats(expenses, budget),
    [expenses, budget]
  );

  const [allowanceInput, setAllowanceInput] = useState(
    String(toDisplayAmount(budget.monthlyAllowancePkr, currency))
  );
  const [dailyInput, setDailyInput] = useState(
    budget.dailyLimitPkr
      ? String(toDisplayAmount(budget.dailyLimitPkr, currency))
      : ''
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setAllowanceInput(
      String(toDisplayAmount(budget.monthlyAllowancePkr, currency))
    );
    setDailyInput(
      budget.dailyLimitPkr
        ? String(toDisplayAmount(budget.dailyLimitPkr, currency))
        : ''
    );
  }, [budget, currency]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyVal = parseFloat(allowanceInput);
    if (isNaN(monthlyVal) || monthlyVal < 0) return;

    const dailyVal = parseFloat(dailyInput);
    const monthlyPkr = fromInputToPkr(monthlyVal, currency);
    const dailyPkr =
      dailyInput.trim() !== '' && !isNaN(dailyVal) && dailyVal > 0
        ? fromInputToPkr(dailyVal, currency)
        : null;

    onUpdateBudget(monthlyPkr, dailyPkr);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Monthly Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    const sums = new Map<ExpenseCategory, number>();
    for (const cat of EXPENSE_CATEGORIES) {
      sums.set(cat, 0);
    }

    let totalMonthPkr = 0;
    for (const exp of expenses) {
      if (exp.date.startsWith(monthPrefix)) {
        sums.set(exp.category, (sums.get(exp.category) ?? 0) + exp.amountPkr);
        totalMonthPkr += exp.amountPkr;
      }
    }

    const rows = EXPENSE_CATEGORIES.map((category) => {
      const amountPkr = sums.get(category) ?? 0;
      const share = totalMonthPkr > 0 ? (amountPkr / totalMonthPkr) * 100 : 0;
      return {
        category,
        amountPkr,
        share,
        color: CATEGORY_COLORS[category],
      };
    }).sort((a, b) => b.amountPkr - a.amountPkr);

    return { rows, totalMonthPkr };
  }, [expenses]);

  const paidHustlePkr = useMemo(
    () =>
      hustles
        .filter((h) => h.status === 'Paid')
        .reduce((sum, h) => sum + h.amountPkr, 0),
    [hustles]
  );

  // SVG Donut ring geometry
  const donutSegments = useMemo(() => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return categoryBreakdown.rows
      .filter((r) => r.amountPkr > 0)
      .map((r) => {
        const length = (r.share / 100) * circumference;
        const seg = {
          ...r,
          circumference,
          dashArray: `${length} ${circumference - length}`,
          dashOffset: -offset,
        };
        offset += length;
        return seg;
      });
  }, [categoryBreakdown]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Budget Guard & Category Analytics
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Insights & Budget Guard
        </h1>
      </div>

      {/* Top Row: Budget Guard Config + Runway Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Pocket Money Guard
          </h2>

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Monthly Allowance ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={allowanceInput}
                onChange={(e) => setAllowanceInput(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Optional Daily Spending Limit ({currency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                placeholder="Leave blank for no daily cap"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-base tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Limits Saved</span>
                </>
              ) : (
                <span>Update Budget Guard</span>
              )}
            </button>
          </form>

          {/* Daily Limit Meter */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Today's Spend vs. Daily Cap
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                {formatMoney(budgetStats.todaySpentPkr, currency)}
                {budget.dailyLimitPkr
                  ? ` / ${formatMoney(budget.dailyLimitPkr, currency)}`
                  : ''}
              </span>
            </div>

            {budgetStats.isOverDailyLimit && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>You crossed today's daily limit.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Safe Daily Pace
                </span>
                <div className="font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatMoney(budgetStats.safePerDayPkr, currency)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hustle Cushion
                </span>
                <div className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
                  +{formatMoney(paidHustlePkr, currency)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Monthly Breakdown Chart by Category */}
        <section className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Monthly Breakdown by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {budgetStats.monthLabel} · Total spent{' '}
                <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                  {formatMoney(categoryBreakdown.totalMonthPkr, currency)}
                </span>
              </p>
            </div>
          </div>

          {categoryBreakdown.totalMonthPkr === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No pocket money expenses logged this month yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* SVG Donut Chart */}
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative w-40 h-40">
                  <svg
                    viewBox="0 0 140 140"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label="Monthly expense breakdown donut chart"
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="18"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.category}
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                        strokeLinecap="butt"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Spent
                    </span>
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatMoney(categoryBreakdown.totalMonthPkr, currency, {
                        compact: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Bars */}
              <div className="sm:col-span-7 space-y-3">
                {categoryBreakdown.rows.map((row) => (
                  <div key={row.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {row.category}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-700 dark:text-slate-300 shrink-0">
                        <span className="font-semibold">
                          {formatMoney(row.amountPkr, currency)}
                        </span>{' '}
                        <span className="text-slate-400">
                          ({Math.round(row.share)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(row.amountPkr > 0 ? 4 : 0, row.share)}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Preferences & Sample Data Controls */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Currency & Local Data
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All entries save automatically in your browser. Switch display currency or reset sample data anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(['PKR', 'USD'] as CurrencyCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onSetCurrency(code)}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  currency === code
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onResetSampleData();
              setConfirmClear(false);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/70 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setConfirmClear(false);
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Confirm Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
