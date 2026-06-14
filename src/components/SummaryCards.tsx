import type { Expense, Member } from "../types";

interface SummaryCardsProps {
  expenses: Expense[];
  members: Member[];
  baseSymbol: string;
}

export default function SummaryCards({ expenses, members, baseSymbol }: SummaryCardsProps) {
  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
  const avgPerPerson = members.length > 0 ? totalSpent / members.length : 0;

  const cards = [
    { label: "Total Spent", value: `${baseSymbol}${totalSpent.toFixed(2)}` },
    { label: "Per Person", value: `${baseSymbol}${avgPerPerson.toFixed(2)}` },
    { label: "Expenses", value: String(expenses.length) },
    { label: "Members", value: String(members.length) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card px-3 sm:px-4 py-3 animate-fadeIn"
        >
          <div className="text-xs sm:text-sm uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>{card.label}</div>
          <div className="text-lg sm:text-2xl font-bold tabular-nums mt-1 truncate" style={{ color: "var(--text-primary)" }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
