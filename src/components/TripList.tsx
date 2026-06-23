import { useState } from "react";
import type { Group, CurrencyCode } from "../types";
import { CURRENCY_MAP } from "../types";
import ThemeToggle from "./ThemeToggle";
import type { Theme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { XIcon, GlobeIcon, SuitcaseIcon } from "./Icons";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "var(--surface)" }}>
      <div className="w-full max-w-lg animate-scaleIn relative z-10">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--md-sys-color-primary-container)" }}>
              <SuitcaseIcon className="w-7 h-7" style={{ color: "var(--md-sys-color-on-primary-container)" }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>Travel Split</h1>
          <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Split expenses with friends</p>
        </div>

        {/* Main card */}
        <div className="card-elevated p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>Start a Trip</h2>
              <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Create a new trip to begin splitting</p>
            </div>
            <ThemeToggle theme={theme} onChange={onThemeChange} />
          </div>

          <div className="space-y-4">
            <input
              className="w-full px-4 py-3.5 text-base transition-shadow min-h-[52px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Where are you going?"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="flex-1 min-w-0 px-4 py-3.5 text-base min-h-[52px]"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                  <option key={code} value={code}>{code} — {info.label}</option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                className="gradient-accent px-8 py-3.5 text-base font-semibold btn-press min-h-[52px] shrink-0"
              >
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Trips list */}
        {trips.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                Recent Trips
              </div>
              <div className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                {trips.length} trip{trips.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {trips.map((trip, idx) => {
                const totalSpent = trip.expenses.reduce(
                  (sum, e) => sum + e.totalAmount * e.exchangeRate, 0,
                );
                const sym = CURRENCY_MAP[trip.baseCurrency]?.symbol ?? trip.baseCurrency;
                return (
                  <div
                    key={trip.id}
                    className="card flex items-center justify-between p-3.5 transition-all group cursor-pointer row-enter hover:scale-[1.01]"
                    style={{ animationDelay: `${idx * 50}ms`, borderRadius: "var(--md-sys-shape-large)" }}
                    onClick={() => onSelect(trip.id)}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--md-sys-color-surface-container-high)" }}>
                        <SuitcaseIcon className="w-4.5 h-4.5" style={{ color: "var(--md-sys-color-primary)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-semibold truncate" style={{ color: "var(--md-sys-color-on-surface)" }}>{trip.name}</div>
                        <div className="text-sm flex items-center gap-2 mt-0.5" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                          <span>{trip.members.length} members</span>
                          <span>·</span>
                          <span>{trip.expenses.length} expenses</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-base font-bold tabular-nums font-mono" style={{ color: "var(--md-sys-color-primary)" }}>{sym}{totalSpent.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete trip "${trip.name}"?`)) {
                          onDelete(trip.id);
                          addToast(`Trip "${trip.name}" deleted`);
                        }
                      }}
                      className="transition-colors px-3 py-2 opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      style={{ color: "var(--md-sys-color-on-surface-variant)" }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {trips.length === 0 && (
          <div className="mt-8 text-center">
            <div className="card-elevated p-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--md-sys-color-surface-container-high)" }}>
                  <GlobeIcon className="w-6 h-6" style={{ color: "var(--md-sys-color-primary)" }} />
                </div>
              </div>
              <div className="text-lg font-semibold mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>Ready to go?</div>
              <div className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Create your first trip to start splitting</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
