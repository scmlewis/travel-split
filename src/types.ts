export interface Member {
  id: string;
  name: string;
  paymentHandle?: string;
  paymentApp?: "venmo" | "paypal" | "cashapp";
}

export type BuiltInCategory = "food" | "transport" | "accommodation" | "activities" | "shopping" | "utilities" | "other";

export const BUILT_IN_CATEGORIES: Record<BuiltInCategory, { label: string }> = {
  food: { label: "Food & Drinks" },
  transport: { label: "Transport" },
  accommodation: { label: "Accommodation" },
  activities: { label: "Activities" },
  shopping: { label: "Shopping" },
  utilities: { label: "Utilities" },
  other: { label: "Other" },
};

export const DEFAULT_CATEGORY_LIST = Object.keys(BUILT_IN_CATEGORIES) as string[];

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export interface ExpenseShare {
  memberId: string;
  amount: number;
  splitType?: SplitType;
  splitValue?: number;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  assignedTo: string[];
}

export interface ExpensePayer {
  memberId: string;
  amount: number;
}

export interface RecurringConfig {
  enabled: boolean;
  frequency: "weekly" | "monthly" | "yearly";
  nextDate?: string;
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
  categories?: string[];
  items?: ExpenseItem[];
  payers?: ExpensePayer[];
  recurring?: RecurringConfig;
  notes?: string;
}

export interface SettlementPayment {
  paid: boolean;
  paidDate?: string;
  paidAmount?: number;
  history: PaymentEntry[];
}

export interface PaymentEntry {
  date: string;
  amount: number;
  note?: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  title: string;
  totalAmount: number;
  currency: CurrencyCode;
  categories?: string[];
  splitType: SplitType;
  notes?: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  baseCurrency: CurrencyCode;
  paidSettlements: Record<string, boolean | SettlementPayment>;
  customCategories?: string[];
  budget?: number;
}

export interface AppState {
  trips: Group[];
  currentTripId: string | null;
  templates?: ExpenseTemplate[];
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

export type CurrencyCode =
  | "USD" | "EUR" | "GBP" | "JPY" | "CNY" | "KRW" | "TWD" | "HKD"
  | "SGD" | "AUD" | "NZD" | "CAD" | "CHF"
  | "THB" | "MYR" | "IDR" | "PHP" | "VND"
  | "INR" | "AED" | "SAR" | "ZAR" | "MXN" | "BRL";

export const CURRENCY_MAP: Record<CurrencyCode, { symbol: string; label: string }> = {
  USD: { symbol: "$", label: "US Dollar" },
  EUR: { symbol: "€", label: "Euro" },
  GBP: { symbol: "£", label: "British Pound" },
  JPY: { symbol: "¥", label: "Japanese Yen" },
  CNY: { symbol: "¥", label: "Chinese Yuan" },
  KRW: { symbol: "₩", label: "Korean Won" },
  TWD: { symbol: "NT$", label: "Taiwan Dollar" },
  HKD: { symbol: "HK$", label: "Hong Kong Dollar" },
  SGD: { symbol: "S$", label: "Singapore Dollar" },
  AUD: { symbol: "A$", label: "Australian Dollar" },
  NZD: { symbol: "NZ$", label: "New Zealand Dollar" },
  CAD: { symbol: "C$", label: "Canadian Dollar" },
  CHF: { symbol: "Fr", label: "Swiss Franc" },
  THB: { symbol: "฿", label: "Thai Baht" },
  MYR: { symbol: "RM", label: "Malaysian Ringgit" },
  IDR: { symbol: "Rp", label: "Indonesian Rupiah" },
  PHP: { symbol: "₱", label: "Philippine Peso" },
  VND: { symbol: "₫", label: "Vietnamese Dong" },
  INR: { symbol: "₹", label: "Indian Rupee" },
  AED: { symbol: "د.إ", label: "UAE Dirham" },
  SAR: { symbol: "﷼", label: "Saudi Riyal" },
  ZAR: { symbol: "R", label: "South African Rand" },
  MXN: { symbol: "Mex$", label: "Mexican Peso" },
  BRL: { symbol: "R$", label: "Brazilian Real" },
};

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 7.8,
  EUR: 8.5,
  GBP: 9.9,
  JPY: 0.052,
  CNY: 1.08,
  KRW: 0.0057,
  TWD: 0.24,
  HKD: 1,
  SGD: 5.8,
  AUD: 5.1,
  NZD: 4.7,
  CAD: 5.7,
  CHF: 8.8,
  THB: 0.22,
  MYR: 1.7,
  IDR: 0.00048,
  PHP: 0.14,
  VND: 0.00031,
  INR: 0.093,
  AED: 2.12,
  SAR: 2.08,
  ZAR: 0.43,
  MXN: 0.46,
  BRL: 1.4,
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

export function getCategoryLabel(cat: string): string {
  if (cat in BUILT_IN_CATEGORIES) return BUILT_IN_CATEGORIES[cat as BuiltInCategory].label;
  return cat;
}
