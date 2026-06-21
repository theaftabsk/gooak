# 🚀 OakSol Commerce - Run & Operational Commands Guide

This file documents the recommended commands to install, bootstrap, seed, and run the entire monorepo development stack.

---

## 📦 1. Installation & Initial Setup

To clean any existing cached node modules, install all monorepo workspace dependencies, and prepare the prisma client libraries:

```bash
# Easy Setup (Cleans, Installs, Bootstraps database, and starts dev)
pnpm run dev:clean
```

Or step-by-step:

```bash
# Step 1: Clean lockfiles and node_modules
pnpm run clean

# Step 2: Install dependencies
pnpm install

# Step 3: Run project bootstrap script (prisma client generation & directories preparation)
pnpm run init:easy
```

---

## 🖥️ 2. Development Servers Startup

### Recommended Command (Runs all servers simultaneously):
```bash
# Option A: Run using Turbo (Default)
pnpm run dev:all

# Option B: Run using native pnpm (Recommended if Turbo crashes on Windows with exit code 3221225781)
pnpm run dev:pnpm
```

### Run Specific Services Independently:
If you want to run only a particular service to save local CPU/RAM overhead:

```bash
# Run NestJS Backend only
pnpm run dev:backend

# Run Storefront Live (http://[slug].localhost:3001) only
pnpm run dev:storefront

# Run Merchant Console Dashboard (http://[slug].localhost:3000/dashboard) only
pnpm run dev:dashboard

# Run Super Admin Platform Panel (http://localhost:3002) only
pnpm run dev:admin
```

---

## 🗄️ 3. Database Operations & Management

All database schemas use **Prisma ORM**. The platform manages both a **Central Control Database** and dynamically routed **Tenant Databases**.

```bash
# Sync / Push schema changes to PostgreSQL database
pnpm run db:sync

# Seed initial store products, tenant configuration presets, and admin users
pnpm run db:seed

# Full Database Rebuild (Resets tables, applies schema, seeds default data)
pnpm run db:rebuild

# Export / Backup PostgreSQL database status to SQL file
pnpm run db:export
```

### Visual Database Explorer (Prisma Studio):
Run these to browse and edit database rows visually in a clean web browser window:

```bash
# Open database viewer for Central Control Schema (Shops, Banners, Staff)
pnpm run db:studio

# Open database viewer for Tenant Schema (Products, Orders, Categories)
pnpm run db:studio:tenant
```

---

## 🏗️ 4. Build & Production Verification

Verify TypeScript compliance and bundle production-ready packages:

```bash
# Compiles all packages using Turbo Repo cache pipeline
pnpm run build

# Runs lint checking across all packages
pnpm run lint
```
