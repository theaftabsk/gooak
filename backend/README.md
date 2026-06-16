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

This backend uses three Prisma schema files in `backend/prisma`:
* `schema.prisma` — canonical primary schema used for `db push`, central database migrations, and `prisma studio`
* `central.prisma` — central-schema client generator for platform-wide tables and shop metadata
* `tenant.prisma` — tenant-schema client generator for shop-specific tenant databases

## 🚀 Local Setup & Installation

Follow these steps precisely to configure your local database and initialize the Prisma clients.

### 1. Environment Configuration
Create a `.env` file in the root of the `backend/` directory:
```env
DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"
```

> **Port conflict note:** If another local PostgreSQL instance is using port `5432`, this setup uses `5433` so Docker can run consistently across machines.

### 2. Start the Database Engine
Ensure Docker Desktop is open and running, then execute the following command to spin up the PostgreSQL container in the background:
```bash
docker compose up -d
```

> **Port Conflict Note:** If you experience connection access errors (e.g., Prisma Error `P1010`), ensure local system instances of PostgreSQL are stopped (`brew services stop postgresql`) so that Docker can claim port `5432`.

### 3. Initialize Local Database Schema
Apply the central and tenant schema models to your local PostgreSQL instance and generate Prisma clients for both databases.
```bash
pnpm run db:setup
```

If you only need to synchronize schema definitions without generating the clients again, run:
```bash
pnpm run db:sync
```

For a full reset and seeded development database, use:
```bash
pnpm run db:rebuild
```

### 4. Seed Local Developer Data
Create a default platform admin and a sample demo shop for local development:
```bash
pnpm run db:seed
```

### 5. Use Prisma Studio
Inspect the central schema:
```bash
pnpm run db:studio
```

Inspect the tenant schema:
```bash
pnpm run db:studio:tenant
```

### 6. Development Startup
Run the backend by itself from the repository root:
```bash
pnpm dev:backend
```

Or run directly inside the backend package:
```bash
cd backend
pnpm run start:dev
```

### 7. Create a Shop in Super Admin
Once the backend is running, open the Super Admin app at `http://localhost:3002` and create a new shop. This step ensures your shop has the proper domain mapping before you use the merchant dashboard or storefront.

### 8. Frontend Development from Root
If you want to run the frontend apps while the backend is running, use the root workspace commands:
```bash
pnpm dev
```

This starts the frontend apps only:
* `merchant-dashboard` on `http://localhost:3000`
* `storefront-live` on `http://localhost:3001`
* `super-admin` on `http://localhost:3002`

If you want backend and frontends together, use:
```bash
pnpm dev:all
```

### 9. Root Workspace Helpers
The monorepo root also exposes the following backend database helpers:
```bash
pnpm db:setup
pnpm db:seed
pnpm db:rebuild
pnpm db:bootstrap
pnpm db:studio
pnpm db:studio:tenant
```

---

## 🏃‍♂️ Running the Development Server

You can run the backend server in isolation or via the monorepo root workspace helper.

**Option A: Running from the Monorepo Root (Recommended)**
```bash
# Execute from the root directory of the workspace
pnpm dev:backend
```

**Option B: Running directly in the Backend Directory**
```bash
# Execute from inside the /backend directory
pnpm run start:dev
```
Once initialized, the backend will listen on the port configured in `backend/.env` or the default port `5001`.

---

## 🏗 System Architecture Rules

To maintain scalability across the multi-tenant architecture, adhere to the following layout patterns:

### Domain-Driven Design (DDD) Layout
* **`src/modules/`**: Encapsulate distinct domain contexts inside isolated feature modules (e.g., `src/modules/users`, `src/modules/stores`, `src/modules/products`). Each module must strictly govern its own Controllers, Services, and data transfer layers.
* **`src/common/`**: Place only universally shared implementations here (e.g., Global Authorization Guards, Tenant Identification Interceptors, Custom Decorators).

### Database Interaction
* **No Direct Imports:** Never instantiate or import the `PrismaClient` directly inside your domain files.
* **Dependency Injection:** Always utilize constructor injection to access the shared database instance:
```typescript
constructor(private readonly prisma: PrismaService) {}
```

---

## 🛠 Command Reference Manual

| Command | Operational Context |
| :--- | :--- |
| `docker compose up -d` | Spins up the local PostgreSQL container. |
| `docker compose down` | Stops the running database container without deleting volume data. |
| `pnpm exec prisma migrate dev` | Tracks schema alterations, updates raw tables, and builds a migration history file. |
| `pnpm exec prisma generate` | Syncs local node module typings with the database model structure. |
| `pnpm exec prisma studio` | Launches a visual GUI utility to inspect or modify operational rows at `http://localhost:5555`. |
