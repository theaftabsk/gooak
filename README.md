# Oak Commerce 🌳

Oak Commerce is a modern, multi-tenant e-commerce platform built with Turborepo, Next.js, NestJS, and Prisma. 

This repository is structured as a strict `pnpm` workspace monorepo. It contains our backend API, multiple distinct frontend applications, and shared internal packages.

## 🏗 Architecture & Services

| App/Service | Type | Port | Description |
| :--- | :--- | :--- | :--- |
| **`backend`** | NestJS | `:5001` | add `PORT=5001` on backedn env | The core API, handling database connections and business logic. |
| **`merchant-dashboard`**| Next.js | `:3000` | The portal where merchants manage inventory and store settings. |
| **`storefront-live`** | Next.js | `:3001` | The consumer-facing storefront where customers buy products. |
| **`super-admin`** | Next.js | `:3002` | Our internal admin panel for managing the entire platform. |
| **`@oak-commerce/types`**| Package | N/A | Shared TypeScript interfaces used across both frontends and backend. |

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v20 or higher)
* [pnpm](https://pnpm.io/installation) (v10+)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for local PostgreSQL)

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install
Clone the repository and install all dependencies from the root. `pnpm` will automatically link local packages and install everything required for all apps.
```bash
git clone <your-repo-url>
cd oak-commerce
pnpm install
```

Your local online store can be accessed at:
* `http://<shop_urlcode>.localhost:3001/`

### 2. Backend Setup
The backend runs in `backend/` and depends on PostgreSQL for both the central schema and tenant databases.

1. Start Docker and the local database:
```bash
docker compose up -d
```

2. Initialize the backend database and Prisma clients:
```bash
pnpm db:setup
```

3. Seed example data if needed:
```bash
pnpm db:seed
```

4. Start the backend API:
```bash
pnpm dev:backend
```

If you prefer to run the backend directly from the backend package:
```bash
cd backend
pnpm run start:dev
```

5. Create a shop in Super Admin
Once the backend is running, open the Super Admin app at `http://localhost:3002` and create a new shop. This ensures the shop has the required domain mapping before you use the merchant dashboard or storefront.

### 3. Frontend development
From the repo root, start all frontend apps with one command:
```bash
pnpm dev
```

This starts:
* `merchant-dashboard` on `http://localhost:3000`
* `storefront-live` on `http://localhost:3001`
* `super-admin` on `http://localhost:3002`

If you want backend plus all frontends together, run:
```bash
pnpm dev:all
```

If you need only one frontend app, use:
```bash
pnpm dev:dashboard
pnpm dev:storefront
pnpm dev:admin
```

### 4. Backend Prisma schema details
This repository uses three Prisma schema files in `backend/prisma`:
* `schema.prisma` — the canonical backend schema used for `db push` and central migrations
* `central.prisma` — the central database schema used to generate the central Prisma client
* `tenant.prisma` — the tenant database schema used to generate the tenant Prisma client

### 5. Useful backend helpers
```bash
pnpm db:bootstrap      # full db setup + seed
pnpm db:studio          # inspect the central schema
pnpm db:studio:tenant   # inspect the tenant schema
```
