# Travel Split

A lightweight, high-density PWA for splitting travel expenses among groups. Built with React, TypeScript, and Tailwind CSS.

**[Live Demo](https://scmlewis.github.io/travel-split/)**

## Features

- **Multi-trip management** — Create and switch between multiple trips
- **Expense tracking** — Add, edit, and delete expenses with per-day grouping
- **Smart settlement** — Greedy debt simplification algorithm using integer arithmetic (no floating-point errors)
- **Live FX rates** — Automatic currency conversion via Open Exchange Rates API
- **Export/Import** — Backup and restore all data as JSON
- **Dark mode** — Light, dark, and system theme support
- **PWA** — Installable on mobile and desktop, works offline
- **Responsive** — Optimized for mobile with a high-density information layout

## Tech Stack

- [React 19](https://react.dev/) with TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
- [Vite](https://vite.dev/) with PWA plugin
- [open.er-api.com](https://open.er-api.com/) for live exchange rates

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Project Structure

```
src/
  components/       # UI components
    Avatar.tsx
    EditExpenseModal.tsx
    ExpenseForm.tsx
    ExpenseLedger.tsx
    MemberPanel.tsx
    SettlementBoard.tsx
    SummaryCards.tsx
    ThemeToggle.tsx
    TripList.tsx
  hooks/            # Custom React hooks
    useExchangeRates.ts
    useLocalStorage.ts
    useTheme.ts
    useToast.tsx
  styles/
    design-tokens.css
  App.tsx           # Main application
  debtSolver.ts     # Debt simplification algorithm
  index.css         # Global styles + animations
  main.tsx          # Entry point
  types.ts          # TypeScript interfaces
```

## Data Storage

All data is stored in the browser's `localStorage`. No server required. Use the Export/Import feature to back up your data.

## License

MIT
