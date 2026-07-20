# MAESTRO FuelDesk

A multi-portal fuel delivery management system built with React 18, Vite, and TypeScript. It serves three distinct user roles — **OMC operators**, **Customers**, and **Drivers** — each with their own isolated portal and route tree.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript 5.9 |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Icons | Lucide React |
| Linting | ESLint 9 (flat config) + `@typescript-eslint` |
| Formatting | Prettier 3 |

---

## Portals & Route Map

### OMC Portal — `/omc`
For Oil Marketing Company operators managing the entire fuel distribution network.

| Route | Page |
|---|---|
| `/omc` | Dashboard |
| `/omc/customers` | Customer management |
| `/omc/pending` | Pending orders |
| `/omc/orders` | All orders |
| `/omc/financials` | Financial overview |
| `/omc/tank-levels` | Tank level monitoring |
| `/omc/stations` | Station management |
| `/omc/attendants` | Attendant management |
| `/omc/transactions` | Transaction ledger |
| `/omc/fuel-prices` | Current fuel prices |
| `/omc/set-fuel-prices` | Update fuel prices |
| `/omc/price-scheduler` | Schedule price changes |
| `/omc/accounting` | Accounting |
| `/omc/settings` | OMC account settings |

### Customer Portal — `/dashboard`
For fuel customers placing and tracking orders.

| Route | Page |
|---|---|
| `/dashboard` | Customer dashboard |
| `/dashboard/new-order` | Place a new order |
| `/dashboard/orders` | Order history |
| `/dashboard/drivers` | Assigned drivers |
| `/dashboard/vehicles` | Registered vehicles |
| `/dashboard/balance` | Account balance |
| `/dashboard/settings` | Customer settings |

### Driver Portal — `/driver`
For delivery drivers managing their active jobs.

| Route | Page |
|---|---|
| `/driver` | Driver home |
| `/driver/history` | Order history |
| `/driver/settings` | Driver settings |

### Public Routes
- `/login` — Unified login (dispatches by role)
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset confirmation

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and set your API URL
cp .env.example .env

# 3. Start the development server (opens at http://localhost:5173)
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | *(required — see `.env.example`)* |

---

## Available Scripts

```bash
npm run dev             # Start Vite dev server with HMR
npm run build           # Type-check then build for production
npm run preview         # Serve the production build locally

npm run lint            # ESLint — report problems (warnings allowed)
npm run lint:strict     # ESLint — fail on any warning
npm run lint:fix        # ESLint — auto-fix fixable issues
npm run format          # Prettier — format all src files
npm run format:check    # Prettier — check formatting without writing
```

---

## Project Structure

```
src/
├── components/       # Shared UI components (Layout, Modal, StatCard, etc.)
├── context/          # React context providers (Auth, Toast, etc.)
├── hooks/            # Custom React hooks
├── pages/            # Route-level page components (lazy-loaded)
├── services/         # API client (api.ts)
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── lib/              # Shared utilities (queryClient, format helpers)
├── App.tsx           # Root router with per-portal ErrorBoundary
└── main.tsx          # Entry point
```

---

## Architecture Notes

- **Code splitting** — every page is `lazy()`-loaded; each portal only loads its own chunk.
- **Error isolation** — a top-level `<ErrorBoundary>` catches global failures; each portal has its own nested boundary so one portal crashing doesn't affect others.
- **Auth guard** — `<ProtectedRoute allowedRole="...">` redirects unauthenticated or wrong-role users to `/login`.
- **Dev tooling** — `<ReactQueryDevtools>` is injected only in development builds (`import.meta.env.DEV`).

---

## License

Private — all rights reserved.
