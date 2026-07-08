<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Oak Commerce - Backend API SETUP ⚙️

This is the core API engine for **Oak Commerce**, a multi-tenant e-commerce platform. The application is built using the **NestJS** framework, powered by **Prisma v7** as the ORM, and uses **PostgreSQL** for data persistence.

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine before starting setup:
* **Node.js** (v20 or higher)
* **pnpm** (v10 or higher)
* **Docker Desktop** (Required for the local PostgreSQL instance)

---

## Prisma Schema Layout

This backend uses **three Prisma schema files** in `backend/prisma/`:

| File | Purpose | Generated client location |
| :--- | :--- | :--- |
| `schema.prisma` | Canonical source of truth — used for `db push` and Prisma Studio | `@prisma/client` (default) |
| `central.prisma` | Platform-wide tables (shops, orders, products, inventory) | `src/generated/central` — used by `PrismaService` at runtime |
| `tenant.prisma` | Per-shop tenant tables (customers, reviews, etc.) | `src/generated/tenant` |

> `schema.prisma` and `central.prisma` are pushed to the local DB. `tenant.prisma` is **type-generation only** for local dev — never push it against the shared database (it would drop all central tables). `pnpm run db:setup` handles this correctly.

---

## 🚀 Local Setup & Installation

Follow these steps to configure your local database and get the backend running.

### 1. Environment Configuration

Create a `.env` file in `backend/`:
```env
DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"
```

> If another PostgreSQL is already on port `5432`, this project uses `5433` via Docker to avoid conflicts.

---

### 2. Start the Database

Make sure Docker Desktop is running, then:
```bash
docker compose up -d
```

> If you see Prisma error `P1010`, stop your local Postgres first: `brew services stop postgresql`

---

### 3. Push Schemas to the Database

Sync schemas to your local PostgreSQL and regenerate the Prisma clients:
```bash
pnpm run db:setup
```

This runs the following steps internally:
```
db:push:all  →  push schema.prisma    (canonical — all tables)
             →  push central.prisma   (the one PrismaService reads at runtime)
db:generate  →  regenerate src/generated/central
             →  regenerate src/generated/tenant
```

If you only need to push one schema at a time:
```bash
pnpm run db:push           # schema.prisma only
pnpm run db:push:central   # central.prisma only
```

> ⚠️ **Never run `db:push:tenant` against the local `oak_commerce` database.** `tenant.prisma` only defines per-shop tables (customers, reviews) and is designed for provisioning isolated shop databases in production. Pushing it against the shared DB will prompt you to **drop all central tables** (shops, products, orders, etc.). The `db:push:tenant` script exists for production use only.

---

### 4. Seed Developer Data

Creates a default platform admin and a demo shop:
```bash
pnpm run db:seed
```

For a full wipe + schema push + seed in one step:
```bash
pnpm run db:rebuild
```

---

### 5. Start the Backend

```bash
# From repo root
pnpm dev:backend

# Or from inside /backend
pnpm run start:dev
```

The API listens on `http://localhost:5001`.

---

### 6. Create a Shop

Open Super Admin at `http://localhost:3002` and create a shop. This sets up the domain mapping needed by the merchant dashboard and storefront.

---

### 7. Run Frontend Apps

```bash
# Frontend apps only (merchant dashboard, storefront, super admin)
pnpm dev

# Backend + all frontends together
pnpm dev:all
```

Apps run at:
- Merchant Dashboard → `http://localhost:3000`
- Storefront → `http://localhost:3001`
- Super Admin → `http://localhost:3002`

---

## 🗄️ Database Workflow Reference

### Daily development (schema change)

When you edit a `.prisma` file, run:
```bash
pnpm run db:push:all    # sync schema.prisma + central.prisma to DB
pnpm run db:generate    # regenerate TypeScript types
```

Or just:
```bash
pnpm run db:setup       # does both in one command
```

---

### Writing a migration (for tracked changes / production)

The project currently uses `db:push` for local development. When you need a tracked migration (e.g., before a production deploy):

**Step 1 — Create the migration from your schema diff:**
```bash
# For central schema (most changes live here)
pnpm run db:migrate:central
# i.e.: prisma migrate dev --schema=prisma/schema.prisma

# For tenant schema
pnpm run db:migrate:tenant
# i.e.: prisma migrate dev --schema=prisma/tenant.prisma
```

Prisma will ask for a migration name, then auto-generate the SQL diff and apply it. The file is saved to `prisma/migrations/`.

**Step 2 — Apply in production:**
```bash
prisma migrate deploy --schema=prisma/schema.prisma
prisma migrate deploy --schema=prisma/tenant.prisma
```

> Note: `prisma migrate dev` and `prisma db push` are separate workflows. If you have existing manual SQL files in `prisma/migrations/`, you must apply them directly with `psql`:
> ```bash
> psql $DATABASE_URL -f prisma/migrations/<folder>/migration.sql
> ```

---

### Visual database explorer

```bash
pnpm run db:studio         # browse central schema (shops, products, orders)
pnpm run db:studio:tenant  # browse tenant schema (customers, reviews)
```

---

## 🛠 Full Script Reference

| Script | What it does |
| :--- | :--- |
| `pnpm run start:dev` | Start backend in watch mode |
| `pnpm run start:prod` | Start compiled production build |
| `pnpm run db:push` | Push `schema.prisma` to DB |
| `pnpm run db:push:central` | Push `central.prisma` to DB |
| `pnpm run db:push:tenant` | Push `tenant.prisma` — **production only**, never run against local DB |
| `pnpm run db:push:all` | Push `schema.prisma` + `central.prisma` (safe for local dev) |
| `pnpm run db:generate` | Regenerate central + tenant Prisma clients |
| `pnpm run db:setup` | `db:push:all` + `db:generate` (use after any schema change) |
| `pnpm run db:sync` | Force-push `schema.prisma` (accepts data loss) |
| `pnpm run db:sync:central` | Force-push `central.prisma` (accepts data loss) |
| `pnpm run db:seed` | Seed admin user + demo shop |
| `pnpm run db:rebuild` | `db:setup` + `db:seed` (full local reset) |
| `pnpm run db:migrate:central` | Create + apply a tracked migration for central schema |
| `pnpm run db:migrate:tenant` | Create + apply a tracked migration for tenant schema |
| `pnpm run db:studio` | Open Prisma Studio for central schema |
| `pnpm run db:studio:tenant` | Open Prisma Studio for tenant schema |
| `docker compose up -d` | Start PostgreSQL container |
| `docker compose down` | Stop PostgreSQL container |

---

## 🏗 Architecture Rules

### Module structure
Each NestJS module owns its own controller, service, and DTOs. Never share controllers across modules.

- `src/modules/` — one folder per API namespace (`platform/`, `merchant/`, `storefront/`, `customer/`, `payment/`)
- `src/common/` — only truly global things (guards, middleware, decorators)

### Database access
Never import `PrismaClient` directly. Always inject via constructor:
```typescript
constructor(private readonly prisma: PrismaService) {}
```
