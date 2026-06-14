import type { Expense, Member, Settlement } from "./types";
import { EXPENSE_CATEGORIES } from "./types";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(expenses: Expense[], members: Member[], settlements: Settlement[], baseSymbol: string, tripName: string) {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const expenseRows = expenses
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((e) => {
      const payer = memberMap.get(e.payerId);
      const baseAmt = (e.totalAmount * e.exchangeRate).toFixed(2);
      const cat = e.category ? EXPENSE_CATEGORIES[e.category]?.label : "";
      return [
        e.date,
        e.title,
        cat,
        payer?.name ?? "?",
        baseAmt,
        e.totalAmount.toFixed(2),
        e.currency,
        e.exchangeRate.toFixed(4),
        e.shares.map((s) => `${memberMap.get(s.memberId)?.name ?? "?"}:${s.amount.toFixed(2)}`).join("; "),
        e.notes ?? "",
        e.recurring?.enabled ? e.recurring.frequency : "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

  const header = "Date,Title,Category,Payer,Base Amount,Original Amount,Currency,Rate,Shares,Notes,Recurring";
  const expenseCsv = [header, ...expenseRows].join("\n");

  const settleRows = settlements.map((s) => {
    const from = memberMap.get(s.from);
    const to = memberMap.get(s.to);
    return `"${from?.name ?? "?"}","${to?.name ?? "?"}","${s.amount.toFixed(2)}"`;
  });
  const settleCsv = ["From,To,Amount", ...settleRows].join("\n");

  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);
  const summary = [
    "",
    `"Trip Summary"`,
    `"Trip","${tripName}"`,
    `"Total Spent","${baseSymbol}${totalSpent.toFixed(2)}"`,
    `"Expenses","${expenses.length}"`,
    `"Members","${members.length}"`,
    `"Currency","${baseSymbol}"`,
  ].join("\n");

  const csv = `${expenseCsv}\n\n${summary}\n\nSettlements\n${settleCsv}`;
  downloadFile(csv, `${tripName.replace(/[^a-z0-9]/gi, "_")}_export.csv`, "text/csv;charset=utf-8;");
}

export function exportPDF(expenses: Expense[], members: Member[], settlements: Settlement[], baseSymbol: string, tripName: string) {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const totalSpent = expenses.reduce((s, e) => s + e.totalAmount * e.exchangeRate, 0);

  const lines: string[] = [];
  lines.push(`${tripName}`);
  lines.push(`${"=".repeat(40)}`);
  lines.push(`Total Spent: ${baseSymbol}${totalSpent.toFixed(2)}`);
  lines.push(`Expenses: ${expenses.length} | Members: ${members.length}`);
  lines.push("");

  lines.push("EXPENSES");
  lines.push("-".repeat(40));

  const sorted = [...expenses].sort((a, b) => b.createdAt - a.createdAt);
  for (const e of sorted) {
    const payer = memberMap.get(e.payerId);
    const baseAmt = (e.totalAmount * e.exchangeRate).toFixed(2);
    const cat = e.category ? `[${EXPENSE_CATEGORIES[e.category]?.label}] ` : "";
    lines.push(`${e.date}  ${cat}${e.title}  ${baseSymbol}${baseAmt}  (${payer?.name ?? "?"} paid)`);
    if (e.notes) lines.push(`  Notes: ${e.notes}`);
  }

  lines.push("");
  lines.push("SETTLEMENTS");
  lines.push("-".repeat(40));
  for (const s of settlements) {
    const from = memberMap.get(s.from);
    const to = memberMap.get(s.to);
    lines.push(`${from?.name ?? "?"} -> ${to?.name ?? "?"}: ${baseSymbol}${s.amount.toFixed(2)}`);
  }

  const balances = new Map<string, number>();
  for (const m of members) balances.set(m.id, 0);
  for (const e of expenses) {
    const rate = e.exchangeRate;
    const current = balances.get(e.payerId) ?? 0;
    balances.set(e.payerId, current + e.totalAmount * rate);
    for (const sh of e.shares) {
      const cur = balances.get(sh.memberId) ?? 0;
      balances.set(sh.memberId, cur - sh.amount * rate);
    }
  }

  lines.push("");
  lines.push("BALANCES");
  lines.push("-".repeat(40));
  for (const [id, net] of balances) {
    const name = memberMap.get(id)?.name ?? "?";
    const sign = net >= 0 ? "+" : "";
    lines.push(`${name}: ${sign}${baseSymbol}${net.toFixed(2)}`);
  }

  const text = lines.join("\n");
  downloadFile(text, `${tripName.replace(/[^a-z0-9]/gi, "_")}_export.txt`, "text/plain;charset=utf-8;");
}
