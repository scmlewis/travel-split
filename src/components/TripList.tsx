import { useState } from "react";
import type { Group, CurrencyCode } from "../types";
import { CURRENCY_MAP } from "../types";
import ThemeToggle from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";

interface TripListProps {
  trips: Group[];
  onSelect: (id: string) => void;
  onCreate: (name: string, baseCurrency: CurrencyCode) => void;
  onDelete: (id: string) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

export default function TripList({ trips, onSelect, onCreate, onDelete, theme, onThemeChange }: TripListProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("HKD");
  const { addToast } = useToast();

  const handleCreate = () => {
    const n = name.trim();
    if (!n) return;
    onCreate(n, currency);
    setName("");
    addToast(`Trip "${n}" created`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 w-full max-w-lg animate-scaleIn">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">🧳 Travel Split</h1>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Manage your trips and split expenses</p>

        <div className="space-y-3 mb-8">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">New Trip</label>
          <input
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-shadow min-h-[48px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Japan 2026"
          />
          <div className="flex gap-2">
            <select
              className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 min-h-[48px]"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors btn-press min-h-[48px]"
            >
              Create
            </button>
          </div>
        </div>

        {trips.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Your Trips ({trips.length})
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {trips.map((trip, idx) => {
                const totalSpent = trip.expenses.reduce(
                  (sum, e) => sum + e.totalAmount * e.exchangeRate, 0,
                );
                const sym = CURRENCY_MAP[trip.baseCurrency]?.symbol ?? trip.baseCurrency;
                return (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group cursor-pointer row-enter"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => onSelect(trip.id)}
                  >
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{trip.name}</div>
                      <div className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{trip.members.length} members</span>
                        <span>·</span>
                        <span>{trip.expenses.length} expenses</span>
                        <span>·</span>
                        <span>{sym}{totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete trip "${trip.name}"?`)) {
                          onDelete(trip.id);
                          addToast(`Trip "${trip.name}" deleted`);
                        }
                      }}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors text-sm px-3 py-2 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trips.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">🌍</div>
            <div className="text-base font-medium text-slate-600 dark:text-slate-300 mb-1">No trips yet</div>
            <div className="text-sm text-slate-400 dark:text-slate-500">Create your first trip above to start splitting expenses!</div>
          </div>
        )}
      </div>
    </div>
  );
}
