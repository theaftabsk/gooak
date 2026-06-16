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