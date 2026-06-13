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
    { label: "Total Spent", value: `${baseSymbol}${totalSpent.toFixed(2)}`, color: "text-slate-800 dark:text-slate-100" },
    { label: "Per Person", value: `${baseSymbol}${avgPerPerson.toFixed(2)}`, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Expenses", value: String(expenses.length), color: "text-slate-800 dark:text-slate-100" },
    { label: "Members", value: String(members.length), color: "text-slate-800 dark:text-slate-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-3 animate-fadeIn"
        >
          <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{card.label}</div>
          <div className={`text-lg sm:text-2xl font-bold tabular-nums mt-1 ${card.color} truncate`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
