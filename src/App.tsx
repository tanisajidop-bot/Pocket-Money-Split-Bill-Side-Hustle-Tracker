import { useEffect, useState } from 'react';
import {
  AppState,
  CurrencyCode,
  ExpenseItem,
  Friend,
  HustleItem,
  HustleStatus,
  NavTab,
  SplitBill,
} from './types';
import { createEmptyAppState, createSampleAppState } from './data/sampleData';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { SplitBillView } from './components/SplitBillView';
import { HustlesView } from './components/HustlesView';
import { InsightsView } from './components/InsightsView';
import { QuickAddModal, QuickAddMode } from './components/QuickAddModal';

const STORAGE_KEY = 'hustlesplit_state_v1';

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSampleAppState();
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !parsed.budget || !Array.isArray(parsed.expenses)) {
      return createSampleAppState();
    }
    const fallback = createSampleAppState();
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      currency: parsed.currency === 'USD' ? 'USD' : 'PKR',
      budget: parsed.budget,
      expenses: parsed.expenses,
      friends: Array.isArray(parsed.friends) && parsed.friends.length > 0
        ? parsed.friends
        : fallback.friends,
      bills: Array.isArray(parsed.bills) ? parsed.bills : [],
      hustles: Array.isArray(parsed.hustles) ? parsed.hustles : [],
      checklist: Array.isArray(parsed.checklist)
        ? parsed.checklist
        : fallback.checklist,
    };
  } catch {
    return createSampleAppState();
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export default function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>('expense');

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [state]);

  // Apply dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const handleOpenQuickAdd = (mode: QuickAddMode = 'expense') => {
    setQuickAddMode(mode);
    setQuickAddOpen(true);
  };

  const handleToggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleToggleCurrency = () => {
    setState((prev) => ({
      ...prev,
      currency: prev.currency === 'PKR' ? 'USD' : 'PKR',
    }));
  };

  const handleSetCurrency = (currency: CurrencyCode) => {
    setState((prev) => ({ ...prev, currency }));
  };

  const handleAddExpense = (expense: Omit<ExpenseItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      expenses: [{ ...expense, id: makeId('exp') }, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleAddFriend = (name: string): Friend => {
    const existing = state.friends.find(
      (f) => f.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) return existing;

    const newFriend: Friend = {
      id: makeId('fr'),
      name: name.trim(),
    };
    setState((prev) => ({
      ...prev,
      friends: [...prev.friends, newFriend],
    }));
    return newFriend;
  };

  const handleAddBill = (bill: Omit<SplitBill, 'id'>) => {
    setState((prev) => ({
      ...prev,
      bills: [{ ...bill, id: makeId('bill') }, ...prev.bills],
    }));
  };

  const handleDeleteBill = (id: string) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== id),
    }));
  };

  const handleToggleShareSettled = (billId: string, friendId: string) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((bill) => {
        if (bill.id !== billId) return bill;
        return {
          ...bill,
          shares: bill.shares.map((s) =>
            s.friendId === friendId ? { ...s, settled: !s.settled } : s
          ),
        };
      }),
    }));
  };

  const handleSettleEntireBill = (billId: string) => {
    setState((prev) => ({
      ...prev,
      bills: prev.bills.map((bill) => {
        if (bill.id !== billId) return bill;
        return {
          ...bill,
          shares: bill.shares.map((s) => ({ ...s, settled: true })),
        };
      }),
    }));
  };

  const handleAddHustle = (hustle: Omit<HustleItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      hustles: [{ ...hustle, id: makeId('hus') }, ...prev.hustles],
    }));
  };

  const handleUpdateHustleStatus = (id: string, status: HustleStatus) => {
    setState((prev) => ({
      ...prev,
      hustles: prev.hustles.map((h) =>
        h.id === id ? { ...h, status } : h
      ),
    }));
  };

  const handleDeleteHustle = (id: string) => {
    setState((prev) => ({
      ...prev,
      hustles: prev.hustles.filter((h) => h.id !== id),
    }));
  };

  const handleToggleChecklist = (id: string) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleAddChecklistItem = (title: string) => {
    setState((prev) => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        {
          id: makeId('chk'),
          title,
          description: '',
          completed: false,
        },
      ],
    }));
  };

  const handleUpdateBudget = (
    monthlyAllowancePkr: number,
    dailyLimitPkr: number | null
  ) => {
    setState((prev) => ({
      ...prev,
      budget: {
        monthlyAllowancePkr,
        dailyLimitPkr,
      },
    }));
  };

  const handleResetSampleData = () => {
    setState((prev) => {
      const sample = createSampleAppState();
      return {
        ...sample,
        theme: prev.theme,
        currency: prev.currency,
      };
    });
  };

  const handleClearAllData = () => {
    setState((prev) => createEmptyAppState(prev.theme, prev.currency));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={state.theme}
        onToggleTheme={handleToggleTheme}
        currency={state.currency}
        onToggleCurrency={handleToggleCurrency}
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
      />

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-24 lg:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              state={state}
              onOpenQuickAdd={handleOpenQuickAdd}
              onNavigate={setActiveTab}
              onDeleteExpense={handleDeleteExpense}
              onDeleteBill={handleDeleteBill}
              onDeleteHustle={handleDeleteHustle}
            />
          )}

          {activeTab === 'split' && (
            <SplitBillView
              state={state}
              onAddBill={handleAddBill}
              onToggleShareSettled={handleToggleShareSettled}
              onSettleEntireBill={handleSettleEntireBill}
              onDeleteBill={handleDeleteBill}
              onAddFriend={handleAddFriend}
            />
          )}

          {activeTab === 'hustles' && (
            <HustlesView
              state={state}
              onAddHustle={handleAddHustle}
              onUpdateHustleStatus={handleUpdateHustleStatus}
              onDeleteHustle={handleDeleteHustle}
              onToggleChecklist={handleToggleChecklist}
              onAddChecklistItem={handleAddChecklistItem}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView
              state={state}
              onUpdateBudget={handleUpdateBudget}
              onSetCurrency={handleSetCurrency}
              onResetSampleData={handleResetSampleData}
              onClearAllData={handleClearAllData}
            />
          )}
        </div>
      </main>

      <QuickAddModal
        isOpen={quickAddOpen}
        initialMode={quickAddMode}
        currency={state.currency}
        friends={state.friends}
        onClose={() => setQuickAddOpen(false)}
        onAddExpense={handleAddExpense}
        onAddBill={handleAddBill}
        onAddHustle={handleAddHustle}
        onAddFriend={handleAddFriend}
        onOpenFullSplitTab={() => setActiveTab('split')}
      />
    </div>
  );
}
