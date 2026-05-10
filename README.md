# Kontor

A small web app for time tracking and invoicing in a freelance workflow. It records hours per project and day, aggregates them by calendar week, and turns them into invoices (hourly billing, flat rate, or overtime) exported as PDF, including a timesheet attachment.

## Features

- **Time tracking** — daily entries per project, with desktop and mobile (single-day) views
- **Overview** — hours by calendar week, target/actual comparison, overtime balance per project
- **Projects** — hourly rates, weekly targets, recurring tags
- **Invoices** — three modes (hours, flat rate, overtime), position editor, PDF export with timesheet
- **Settings** — master data, logo, defaults
- **Auth** — Supabase login, per-user persisted state

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router
- **State:** Context + reducer, persisted as a JSON blob in Supabase (`app_state`)
- **Backend:** Supabase (Auth + Postgres)
- **PDF:** `@react-pdf/renderer` (lazy-loaded)
- **Tests:** Vitest + Testing Library + jsdom

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

## Scripts

| Script             | Purpose                            |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Dev server (Vite, HMR)             |
| `npm run build`    | Type check + production build      |
| `npm run preview`  | Serve the production build locally |
| `npm run lint`     | Run ESLint over the project        |
| `npm test`         | Vitest in watch mode               |
| `npm run test:run` | Vitest single run (for CI)         |

## Data model

The full app state is stored as a single JSON blob per user in the Supabase `app_state` table. This is intentionally simple for a 1–2 user setup; splitting it into granular tables (`time_entries`, `invoices`, `invoice_positions`, …) would be cleaner but isn't worth the complexity at the moment.
