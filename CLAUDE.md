# Oak Commerce — Monorepo Root

Multi-tenant SaaS e-commerce platform. One backend serves all shops; each shop's data is fully isolated.

## Workspace Structure

| App / Package | Port | Purpose |
|---|---|---|
| `backend/` | 5001 | NestJS REST API — single backend for all tenants |
| `super-admin/` | 3002 | Platform admin dashboard (highest permission) |
| `merchant-dashboard/` | 3000 | Shop owner dashboard (per-tenant) |
| `storefront-live/` | 3001 | Customer-facing storefront (per-tenant, public) |
| `shared-types/` | — | Shared TypeScript types (`@oak-commerce/types`) |
| `shared-ui/` | — | Shared UI component library (`shared-ui`) |

Package manager: **pnpm** with workspaces. Build orchestration: **Turborepo**.

## Permission Hierarchy

```
super-admin  (platform owner — controls everything, no tenant scope)
    └── merchant  (shop owner — controls their own shop only)
            └── customer  (end user — scoped to one shop)
```

Shops are completely isolated from each other. A customer of Shop A cannot access Shop B's data. A merchant of Shop A cannot see Shop B.

## API Route Namespacing

All API routes follow this convention — never mix namespaces across apps:

| Prefix | Who calls it | Controller |
|---|---|---|
| `/api/v1/platform/*` | super-admin only | `platform-admin.controller.ts` |
| `/api/v1/merchant/*` | merchant-dashboard only | `merchant.controller.ts` + inventory/reviews controllers |
| `/api/v1/storefront/*` | storefront-live (public) | `catalog.controller.ts` |
| `/api/v1/customer/*` | storefront-live (authenticated customer) | `customer.controller.ts` |
| `/api/v1/payments/*` | storefront-live + merchant-dashboard | `payment.controller.ts` |

## Multi-Tenant Architecture

- **Central DB** (Postgres): shops, platform admins, orders, domains, signup requests
- **Tenant DB** (per-shop, isolated): customers, products, categories, variants, banners, reviews
- Tenant is resolved from the request hostname via `TenantMiddleware`
- Shop context is injected into every request as `req.shopId`
- For local dev, `testShop.localhost` is the default tenant

## Running Locally

```bash
pnpm dev          # starts all apps in parallel
```

Or see `RUN.md` for individual app startup.

## Key Files

- `backend/src/common/middleware/tenant.middleware.ts` — tenant resolution logic
- `backend/src/database/tenant-context.ts` — AsyncLocalStorage for per-request DB
- `backend/prisma/central.prisma` — platform-wide schema
- `backend/prisma/tenant.prisma` — per-shop schema
