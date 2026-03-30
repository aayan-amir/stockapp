# Stock Management System

A full-stack inventory, purchases, and sales management web app built with **Next.js 14**, **Prisma**, **SQLite**, and **Tailwind CSS**. Converted from a Microsoft Access VBA module.

## Features

- **Dashboard** — live KPIs: stock value, sales/purchases this month, low-stock alerts
- **Stock Browser** — search, filter, add, and edit product master records
- **Purchases** — full purchase invoice with auto-generated PO numbers, multi-currency, tax, freight
- **Sales** — sales invoices with live stock validation, customer assignment, auto invoice numbers
- **Ledger** — filterable transaction log (Sales + Purchases) with running PKR totals
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
# 1. Install dependencies
npm install

# 2. Push schema to SQLite and seed reference data
npm run setup

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default PIN: **1234** (change in `.env.local`).

## Environment Variables

Create a `.env.local` file in the root:

```env
# Login PIN (default: 1234)
ACCESS_PIN=1234

# Next Auth secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=change-me
```

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
npm run setup        # Install + db push + seed (first run)
npm run db:reset     # Drop and recreate the database
```
