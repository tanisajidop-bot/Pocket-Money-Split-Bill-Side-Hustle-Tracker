export type CurrencyCode = 'PKR' | 'USD';
export type ThemeMode = 'light' | 'dark';
export type NavTab = 'dashboard' | 'split' | 'hustles' | 'insights';

export type ExpenseCategory =
  | 'Food/Cafe'
  | 'Transport/Ride'
  | 'Data/Subscriptions'
  | 'Shopping'
  | 'Study/Printing'
  | 'Entertainment';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food/Cafe',
  'Transport/Ride',
  'Data/Subscriptions',
  'Shopping',
  'Study/Printing',
  'Entertainment',
];

export type HustleStream =
  | 'Freelance Gigs'
  | 'Video Editing'
  | 'Graphic Design'
  | 'Content Creation'
  | 'Tutoring'
  | 'Reselling';

export const HUSTLE_STREAMS: HustleStream[] = [
  'Freelance Gigs',
  'Video Editing',
  'Graphic Design',
  'Content Creation',
  'Tutoring',
  'Reselling',
];

export type HustleStatus = 'Pending' | 'In Progress' | 'Paid';
export type SplitMode = 'equal' | 'exact' | 'percentage';

export interface Friend {
  id: string;
  name: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amountPkr: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
}

export interface BillShare {
  friendId: string;
  amountPkr: number;
  percentage?: number;
  settled: boolean;
}

export interface SplitBill {
  id: string;
  title: string;
  totalAmountPkr: number;
  tipOrTaxPkr: number;
  payerId: string;
  splitMode: SplitMode;
  shares: BillShare[];
  date: string; // YYYY-MM-DD
}

export interface HustleItem {
  id: string;
  title: string;
  client: string;
  stream: HustleStream;
  status: HustleStatus;
  amountPkr: number;
  date: string; // YYYY-MM-DD
}

export interface ChecklistMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface BudgetConfig {
  monthlyAllowancePkr: number;
  dailyLimitPkr: number | null;
}

export interface AppState {
  theme: ThemeMode;
  currency: CurrencyCode;
  budget: BudgetConfig;
  expenses: ExpenseItem[];
  friends: Friend[];
  bills: SplitBill[];
  hustles: HustleItem[];
  checklist: ChecklistMilestone[];
}
