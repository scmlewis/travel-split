import { useMemo } from "react";
import type { Member, Settlement, SettlementPayment } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";
import { DollarIcon, CheckIcon, CalendarIcon } from "./Icons";

interface SettlementBoardProps {
  members: Member[];
  settlements: Settlement[];
  baseSymbol: string;
  paidSettlements: Record<string, boolean | SettlementPayment>;
  onTogglePaid: (from: string, to: string, note?: string) => void;
}

export default function SettlementBoard({
  members,
  settlements,
  baseSymbol,
  paidSettlements,
  onTogglePaid,
}: SettlementBoardProps) {
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const { addToast } = useToast();

  const isPaidEntry = (val: boolean | SettlementPayment): val is SettlementPayment => typeof val === "object" && val !== null;

  const { unpaid, paid, unpaidTotal, maxAmount } = useMemo(() => {
    const u = settlements.filter((s) => {
      const entry = paidSettlements[`${s.from}|${s.to}`];
      return !entry || (isPaidEntry(entry) ? !entry.paid : !entry);
    });
    const p = settlements.filter((s) => {
      const entry = paidSettlements[`${s.from}|${s.to}`];
      return entry && (isPaidEntry(entry) ? entry.paid : entry);
    });
    return {
      unpaid: u,
      paid: p,
      unpaidTotal: u.reduce((sum, s) => sum + s.amount, 0),
      maxAmount: Math.max(...settlements.map((s) => s.amount), 1),
    };
  }, [settlements, paidSettlements]);

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--md-sys-color-primary)" }} />
        Settlement Board
      </h2>

      {settlements.length === 0 ? (
        <div className="card-elevated text-center py-12 px-4 animate-fadeIn">
          <div className="flex justify-center mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            <DollarIcon className="w-12 h-12" />
          </div>
          <div className="text-lg font-medium mb-1" style={{ color: "var(--md-sys-color-on-surface)" }}>All settled up</div>
          <div className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>Add expenses to see who owes whom</div>
        </div>
      ) : (
        <>
          {unpaid.length > 0 && (
            <div className="card-elevated p-4 mb-4 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                    {unpaid.length} payment{unpaid.length !== 1 ? "s" : ""} needed to settle all
                  </div>
                  <div className="text-xl font-bold tabular-nums font-mono" style={{ color: "var(--md-sys-color-primary)" }}>
                    {baseSymbol}{unpaidTotal.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                  <div>{paid.length > 0 ? `${paid.length} already settled` : "minimum transactions"}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card-elevated p-5 mb-4">
            <div className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
              Balance Overview
            </div>
            <div className="space-y-3">
              {members.map((m) => {
                const settlementTo = unpaid.find((s) => s.to === m.id);
                const settlementFrom = unpaid.find((s) => s.from === m.id);
                const net = settlementTo ? settlementTo.amount : settlementFrom ? -settlementFrom.amount : 0;
                const pct = maxAmount > 0 ? (Math.abs(net) / maxAmount) * 100 : 0;
                return (
                  <div key={m.id}>
                    <div className="hidden sm:flex items-center gap-3 text-sm">
                      <Avatar name={m.name} size="md" />
                      <span className="w-16 truncate font-medium" style={{ color: "var(--md-sys-color-on-surface)" }}>{m.name}</span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--md-sys-color-surface-container-highest)" }}>
                        {net > 0 && (
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--md-sys-color-primary)" }} />
                        )}
                        {net < 0 && (
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--md-sys-color-error)" }} />
                        )}
                      </div>
                      <span className={`w-28 text-right tabular-nums font-mono font-semibold text-sm ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                      </span>
                    </div>
                    <div className="sm:hidden">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <Avatar name={m.name} size="sm" />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--md-sys-color-on-surface)" }}>{m.name}</span>
                        <span className={`ml-auto text-sm tabular-nums font-mono font-semibold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden ml-8" style={{ background: "var(--md-sys-color-surface-container-highest)" }}>
                        {net > 0 && (
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--md-sys-color-primary)" }} />
                        )}
                        {net < 0 && (
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--md-sys-color-error)" }} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-elevated overflow-hidden">
            {unpaid.length > 0 && (
              <div style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
                {unpaid.map((s, idx) => {
                  const from = memberMap.get(s.from);
                  const to = memberMap.get(s.to);
                  const pct = (s.amount / maxAmount) * 100;
                  return (
                    <div
                      key={`unpaid-${idx}`}
                      className="px-4 py-3 transition-row row-enter"
                      style={{ animationDelay: `${Math.min(idx, 10) * 30}ms`, borderBottom: idx < unpaid.length - 1 ? "1px solid var(--md-sys-color-outline-variant)" : undefined }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {from && <Avatar name={from.name} size="sm" />}
                          <span className="text-red-600 dark:text-red-400 font-semibold text-sm truncate">{from?.name ?? "?"}</span>
                          <span className="text-base shrink-0" style={{ color: "var(--text-muted)" }}>→</span>
                          {to && <Avatar name={to.name} size="sm" />}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm truncate">{to?.name ?? "?"}</span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-base shrink-0" style={{ color: "var(--md-sys-color-on-surface)" }}>
                          {baseSymbol}{s.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--md-sys-color-surface-container-highest)" }}>
                          <div
                            className="h-full rounded-full balance-bar opacity-50"
                            style={{ width: `${pct}%`, background: "var(--md-sys-color-outline)" }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            onTogglePaid(s.from, s.to, new Date().toISOString().split("T")[0]);
                            addToast("Settlement marked as paid");
                          }}
                          className="text-sm px-4 py-2 rounded-lg font-semibold btn-press min-h-[40px] shrink-0 gradient-accent"
                          aria-label={`Mark settlement from ${from?.name} to ${to?.name} as paid`}
                        >
                          Mark Paid
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {paid.length > 0 && (
              <div style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
                <div className="px-4 py-2.5 text-sm font-semibold uppercase tracking-wider" style={{ background: "var(--md-sys-color-surface-container)", color: "var(--md-sys-color-on-surface-variant)" }}>
                  Settled ({paid.length})
                </div>
                <div>
                  {paid.map((s, idx) => {
                    const from = memberMap.get(s.from);
                    const to = memberMap.get(s.to);
                    const entry = paidSettlements[`${s.from}|${s.to}`];
                    const paidDate = isPaidEntry(entry) ? entry.paidDate : undefined;
                    return (
                      <div key={`paid-${idx}`} className="px-4 py-2.5 opacity-50" style={{ borderBottom: idx < paid.length - 1 ? "1px solid var(--md-sys-color-outline-variant)" : undefined }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {from && <Avatar name={from.name} size="sm" />}
                            <span className="line-through text-sm truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{from?.name ?? "?"}</span>
                            <span className="shrink-0" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>→</span>
                            {to && <Avatar name={to.name} size="sm" />}
                            <span className="line-through text-sm truncate" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>{to?.name ?? "?"}</span>
                            <CheckIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {paidDate && (
                              <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                                <CalendarIcon className="w-3 h-3" />
                                {paidDate}
                              </span>
                            )}
                            <span className="font-mono tabular-nums line-through text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                              {baseSymbol}{s.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                onTogglePaid(s.from, s.to);
                                addToast("Settlement unmarked", "info");
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg hover:text-red-400 transition-opacity btn-press min-h-[36px]"
                              style={{ background: "var(--md-sys-color-surface-container-high)", color: "var(--md-sys-color-on-surface-variant)" }}
                              aria-label={`Unmark settlement from ${from?.name} to ${to?.name}`}
                            >
                              Undo
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
