import React from 'react';
import {
  LayoutGrid,
  Users,
  Briefcase,
  PieChart,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { CurrencyCode, NavTab, ThemeMode } from '../types';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currency: CurrencyCode;
  onToggleCurrency: () => void;
  onOpenQuickAdd: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'split', label: 'Split Bill', icon: Users },
  { id: 'hustles', label: 'Hustles', icon: Briefcase },
  { id: 'insights', label: 'Insights', icon: PieChart },
];

export function Navigation({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  currency,
  onToggleCurrency,
  onOpenQuickAdd,
}: NavigationProps) {
  return (
    <>
      {/* Mobile Compact Sticky Top Bar (48px height) */}
      <header className="lg:hidden sticky top-0 z-30 h-12 px-4 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 min-h-[44px] flex items-center"
        >
          HustleSplit
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleCurrency}
            aria-label={`Switch currency from ${currency}`}
            className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center rounded-lg text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {currency}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="px-6 pt-6 pb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 text-left"
          >
            HustleSplit
          </button>
        </div>

        <div className="px-4 mb-4">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Quick Log</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Currency
            </span>
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => currency !== 'PKR' && onToggleCurrency()}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                  currency === 'PKR'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                PKR
              </button>
              <button
                type="button"
                onClick={() => currency !== 'USD' && onToggleCurrency()}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar (58px height) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-4 h-[58px] items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
