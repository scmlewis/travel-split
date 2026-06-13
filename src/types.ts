export interface Member {
  id: string;
  name: string;
}

export interface ExpenseShare {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  payerId: string;
  totalAmount: number;
  currency: CurrencyCode;
  exchangeRate: number;
  shares: ExpenseShare[];
  createdAt: number;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  baseCurrency: CurrencyCode;
  paidSettlements: Record<string, boolean>;
}

export interface AppState {
  trips: Group[];
  currentTripId: string | null;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  net: number;
}

export type CurrencyCode = "HKD" | "JPY" | "EUR" | "TWD";

export const CURRENCY_MAP: Record<CurrencyCode, { symbol: string; label: string }> = {
  HKD: { symbol: "HK$", label: "Hong Kong Dollar" },
  JPY: { symbol: "¥", label: "Japanese Yen" },
  EUR: { symbol: "€", label: "Euro" },
  TWD: { symbol: "NT$", label: "Taiwan Dollar" },
};

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  HKD: 1,
  JPY: 0.052,
  EUR: 8.5,
  TWD: 0.24,
};

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type OmitExpenseId = Omit<Expense, "id">;

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
