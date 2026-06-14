import type { Member, Settlement } from "../types";
import Avatar from "./Avatar";
import { useToast } from "../hooks/useToast";
import { DollarIcon, CheckIcon } from "./Icons";

interface SettlementBoardProps {
  members: Member[];
  settlements: Settlement[];
  baseSymbol: string;
  paidSettlements: Record<string, boolean>;
  onTogglePaid: (from: string, to: string) => void;
}

export default function SettlementBoard({
  members,
  settlements,
  baseSymbol,
  paidSettlements,
  onTogglePaid,
}: SettlementBoardProps) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const { addToast } = useToast();

  const unpaid = settlements.filter((s) => !paidSettlements[`${s.from}|${s.to}`]);
  const paid = settlements.filter((s) => paidSettlements[`${s.from}|${s.to}`]);

  const maxAmount = Math.max(...settlements.map((s) => s.amount), 1);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span className="w-1.5 h-5 rounded-full" style={{ background: "var(--accent)" }} />
        Settlement Board
      </h2>

      {settlements.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <div className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
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
                    <span className="w-16 truncate font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ background: "var(--border)" }}>
                      {net > 0 && (
                        <div
                          className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, left: "50%" }}
                        />
                      )}
                      {net < 0 && (
                        <div
                          className="absolute top-0 h-full bg-red-400 dark:bg-red-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, right: "50%" }}
                        />
                      )}
                      <div className="absolute left-1/2 top-0 w-px h-full" style={{ background: "var(--text-muted)" }} />
                    </div>
                    <span className={`w-28 text-right tabular-nums font-mono font-semibold text-sm ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                    </span>
                  </div>
                  <div className="sm:hidden">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Avatar name={m.name} size="sm" />
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                      <span className={`ml-auto text-sm tabular-nums font-mono font-semibold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {net >= 0 ? "+" : ""}{baseSymbol}{Math.abs(net).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden relative ml-8" style={{ background: "var(--border)" }}>
                      {net > 0 && (
                        <div
                          className="absolute top-0 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, left: "50%" }}
                        />
                      )}
                      {net < 0 && (
                        <div
                          className="absolute top-0 h-full bg-red-400 dark:bg-red-500 rounded-full balance-bar opacity-60"
                          style={{ width: `${pct / 2}%`, right: "50%" }}
                        />
                      )}
                      <div className="absolute left-1/2 top-0 w-px h-full" style={{ background: "var(--text-muted)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {settlements.length === 0 ? (
          <div className="text-center py-12 px-4 animate-fadeIn">
            <div className="flex justify-center mb-3" style={{ color: "var(--text-muted)" }}>
              <DollarIcon className="w-12 h-12" />
            </div>
            <div className="text-lg font-medium mb-1" style={{ color: "var(--text-secondary)" }}>All settled up</div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Add expenses to see who owes whom</div>
          </div>
        ) : (
          <>
            {unpaid.length > 0 && (
              <div style={{ borderColor: "var(--border)" }}>
                {unpaid.map((s, idx) => {
                  const from = memberMap.get(s.from);
                  const to = memberMap.get(s.to);
                  const pct = (s.amount / maxAmount) * 100;
                  return (
                    <div
                      key={`unpaid-${idx}`}
                      className="px-4 py-3 transition-row row-enter"
                      style={{ animationDelay: `${idx * 40}ms`, borderBottom: idx < unpaid.length - 1 ? "1px solid var(--border)" : undefined }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {from && <Avatar name={from.name} size="sm" />}
                          <span className="text-red-600 dark:text-red-400 font-semibold text-sm truncate">{from?.name ?? "?"}</span>
                          <span className="text-base shrink-0" style={{ color: "var(--text-muted)" }}>→</span>
                          {to && <Avatar name={to.name} size="sm" />}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm truncate">{to?.name ?? "?"}</span>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-base shrink-0" style={{ color: "var(--text-primary)" }}>
                          {baseSymbol}{s.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div
                            className="h-full rounded-full balance-bar opacity-50"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ef4444, #10b981)" }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            onTogglePaid(s.from, s.to);
                            addToast("Settlement marked as paid");
                          }}
                          className="text-sm px-4 py-2 rounded-lg transition-opacity font-semibold btn-press min-h-[40px] shrink-0"
                          style={{ background: "var(--border)", color: "var(--accent)" }}
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
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <div className="px-4 py-2.5 text-sm font-semibold uppercase tracking-wider" style={{ background: "var(--surface-elevated)", color: "var(--text-muted)" }}>
                  Settled ({paid.length})
                </div>
                <div>
                  {paid.map((s, idx) => {
                    const from = memberMap.get(s.from);
                    const to = memberMap.get(s.to);
                    return (
                      <div key={`paid-${idx}`} className="px-4 py-2.5 opacity-50" style={{ borderBottom: idx < paid.length - 1 ? "1px solid var(--border)" : undefined }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {from && <Avatar name={from.name} size="sm" />}
                            <span className="line-through text-sm truncate" style={{ color: "var(--text-muted)" }}>{from?.name ?? "?"}</span>
                            <span className="shrink-0" style={{ color: "var(--text-muted)" }}>→</span>
                            {to && <Avatar name={to.name} size="sm" />}
                            <span className="line-through text-sm truncate" style={{ color: "var(--text-muted)" }}>{to?.name ?? "?"}</span>
                            <CheckIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums line-through text-sm" style={{ color: "var(--text-muted)" }}>
                              {baseSymbol}{s.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                onTogglePaid(s.from, s.to);
                                addToast("Settlement unmarked", "info");
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg hover:text-red-400 transition-opacity btn-press min-h-[36px]"
                              style={{ background: "var(--border)", color: "var(--text-muted)" }}
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
          </>
        )}
      </div>
    </section>
  );
}
