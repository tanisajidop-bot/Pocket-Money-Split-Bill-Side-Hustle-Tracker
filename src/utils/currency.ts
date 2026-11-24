import { BudgetConfig, CurrencyCode, ExpenseItem } from '../types';

export const PKR_PER_USD = 278;

export function toDisplayAmount(amountPkr: number, currency: CurrencyCode): number {
  if (currency === 'PKR') {
    return Math.round(amountPkr);
  }
  return Math.round((amountPkr / PKR_PER_USD) * 100) / 100;
}

export function fromInputToPkr(inputAmount: number, currency: CurrencyCode): number {
  if (currency === 'PKR') {
    return Math.round(inputAmount);
  }
  return Math.round(inputAmount * PKR_PER_USD);
}

export function formatMoney(
  amountPkr: number,
  currency: CurrencyCode,
  options?: { compact?: boolean; showSign?: boolean }
): string {
  const display = toDisplayAmount(Math.abs(amountPkr), currency);
  const sign = options?.showSign
    ? amountPkr > 0
      ? '+'
      : amountPkr < 0
      ? '-'
      : ''
    : amountPkr < 0
    ? '-'
    : '';

  if (currency === 'PKR') {
    if (options?.compact && display >= 1000) {
      const k = (display / 1000).toFixed(display >= 10000 ? 0 : 1);
      return `${sign}PKR ${k.replace(/\.0$/, '')}k`;
    }
    return `${sign}PKR ${display.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })}`;
  }

  if (options?.compact && display >= 1000) {
    return `${sign}$${(display / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return `${sign}$${display.toLocaleString('en-US', {
    minimumFractionDigits: display % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysAgoIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatShortDate(isoDate: string): string {
  const today = getTodayIso();
  if (isoDate === today) return 'Today';
  if (isoDate === getDaysAgoIso(1)) return 'Yesterday';

  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export interface MonthlyBudgetStats {
  monthLabel: string;
  monthlyAllowancePkr: number;
  monthlySpentPkr: number;
  remainingPkr: number;
  percentUsed: number;
  todaySpentPkr: number;
  daysLeftInMonth: number;
  safePerDayPkr: number;
  isNear80: boolean;
  isOverMonthly: boolean;
  isOverDailyLimit: boolean;
}

export function getCurrentMonthStats(
  expenses: ExpenseItem[],
  budget: BudgetConfig
): MonthlyBudgetStats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayIso = getTodayIso();

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeftInMonth = Math.max(1, totalDaysInMonth - currentDay + 1);

  let monthlySpentPkr = 0;
  let todaySpentPkr = 0;

  for (const exp of expenses) {
    if (exp.date.startsWith(monthPrefix)) {
      monthlySpentPkr += exp.amountPkr;
    }
    if (exp.date === todayIso) {
      todaySpentPkr += exp.amountPkr;
    }
  }

  const remainingPkr = budget.monthlyAllowancePkr - monthlySpentPkr;
  const percentUsed =
    budget.monthlyAllowancePkr > 0
      ? (monthlySpentPkr / budget.monthlyAllowancePkr) * 100
      : monthlySpentPkr > 0
      ? 100
      : 0;

  const safePerDayPkr = Math.max(0, Math.round(remainingPkr / daysLeftInMonth));
  const isOverMonthly = budget.monthlyAllowancePkr > 0 && monthlySpentPkr > budget.monthlyAllowancePkr;
  const isNear80 = !isOverMonthly && percentUsed >= 80;
  const isOverDailyLimit =
    budget.dailyLimitPkr !== null &&
    budget.dailyLimitPkr > 0 &&
    todaySpentPkr > budget.dailyLimitPkr;

  const monthLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return {
    monthLabel,
    monthlyAllowancePkr: budget.monthlyAllowancePkr,
    monthlySpentPkr,
    remainingPkr,
    percentUsed,
    todaySpentPkr,
    daysLeftInMonth,
    safePerDayPkr,
    isNear80,
    isOverMonthly,
    isOverDailyLimit,
  };
}
