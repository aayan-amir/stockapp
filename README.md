# Stock Management System

A full-stack inventory, purchases, and sales management web app built with **Next.js 14**, **Prisma**, **SQLite**, and **Tailwind CSS**. Converted from a Microsoft Access VBA module.

## Features

- **Dashboard** — live KPIs: stock counts, sales/purchases this month, low-stock alerts
- **Stock Browser** — search, filter, add, and edit product master records
- **Purchases** — purchase entries with auto-generated PO numbers and stock movement
- **Sales** — sales invoices with live stock validation, customer assignment, auto invoice numbers
- **Ledger** — filterable transaction log (Sales + Purchases)
- **Customers** — manage customer records with filer status
- **Settings** — manage currencies, tax rates, and product categories
- **Auth** — simple PIN-based login screen (configurable via env)

## Tech Stack

| Layer      | Choice                        |
|------------|-------------------------------|
| Framework  | Next.js 14 (App Router)       |
| ORM        | Prisma                        |
| Database   | SQLite (file: `prisma/stock.db`) |
| Styling    | Tailwind CSS                  |
| Fonts      | DM Sans + DM Mono (Google Fonts) |

## Quick Start

```bash
# 1. Run one-time setup (creates .env if missing, installs deps, prepares DB)
npm run setup

# 2. Start dev server (no need to re-run setup each time)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default PIN: **1234** (change in `.env`).

## Environment Variables

`npm run setup` (or any script using `env:ensure`) automatically copies `.env.example` to `.env` on first run. You can edit `.env` to customise values:

```env
# Login PIN (default: 1234)
ACCESS_PIN=1234

# Next Auth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=replace-with-a-long-random-string

# Database (SQLite — path relative to prisma/)
DATABASE_URL="file:./stock.db"
```

> **Note:** Prisma requires `DATABASE_URL` to be present in `.env` (not `.env.local`). If you ever delete `.env`, copy `.env.example` back to `.env` before running Prisma commands.
>
> **Render deploy note:** do not set a custom `NODE_ENV` value (for example `staging`). Leave it as standard `production` for builds and runtime.
>
> **Render SQLite note:** if `DATABASE_URL="file:/var/data/stock.db"`, Render build containers may be read-only. Keep build command as `npm run build`. In Render's single **Start Command** field, run DB initialization where `/var/data` is writable (for example: `npm run db:init && npm run start`).

## Project Structure

```
stockapp/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Reference data seeder
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes
│   │   ├── stock/         # Stock pages
│   │   ├── purchases/     # Purchase pages
│   │   ├── sales/         # Sales pages
│   │   ├── ledger/        # Ledger page
│   │   ├── customers/     # Customer pages
│   │   └── settings/      # Settings (currencies, tax, categories)
│   ├── components/        # Shared UI components
│   └── lib/               # Prisma client, utils, auth
└── package.json
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run setup        # One-time install + db init
npm run db:init      # Push schema + seed data (skips push/seed on read-only SQLite parent dirs)
```
