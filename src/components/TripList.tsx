import { useState } from "react";
import type { Group, CurrencyCode } from "../types";
import { CURRENCY_MAP } from "../types";
import ThemeToggle from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { XIcon, GlobeIcon } from "./Icons";

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--surface)" }}>
      <div className="glass-card p-8 w-full max-w-lg animate-scaleIn">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Travel Split</h1>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Manage your trips and split expenses</p>

        <div className="space-y-3 mb-8">
          <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>New Trip</label>
          <input
            className="w-full rounded-lg px-4 py-3 text-base transition-shadow min-h-[48px]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. Japan 2026"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="flex-1 min-w-0 rounded-lg px-4 py-3 text-base min-h-[48px]"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.label}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              className="gradient-accent text-white px-6 py-3 rounded-lg text-base font-semibold hover:opacity-90 transition-opacity btn-press min-h-[48px] shrink-0"
            >
              Create
            </button>
          </div>
        </div>

        {trips.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
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
                    className="glass-card flex items-center justify-between p-4 transition-all group cursor-pointer row-enter"
                    style={{ animationDelay: `${idx * 50}ms`, borderRadius: "12px" }}
                    onClick={() => onSelect(trip.id)}
                  >
                    <div className="min-w-0">
                      <div className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{trip.name}</div>
                      <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
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
                      className="hover:text-red-500 transition-colors px-3 py-2 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trips.length === 0 && (
          <div className="text-center py-10">
            <div className="flex justify-center mb-3" style={{ color: "var(--text-muted)" }}>
              <GlobeIcon className="w-12 h-12" />
            </div>
            <div className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>No trips yet</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Create your first trip above to start splitting expenses!</div>
          </div>
        )}
      </div>
    </div>
  );
}
