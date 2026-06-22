# Oak Commerce Backend Architecture

Single NestJS API serving all tenants on port **5001**. One Postgres database, all data isolated by `shop_id`.

---

## Directory Layout

| Path | Purpose |
| :--- | :--- |
| `prisma/` | Three schema files: `central.prisma`, `tenant.prisma`, `schema.prisma` (dev/studio) |
| `src/main.ts` | Entry point — CORS, global filters, port binding |
| `src/app.module.ts` | Root module wiring all feature modules and middleware |
| `src/common/middleware/tenant.middleware.ts` | Resolves `shopId` from hostname on every request |
| `src/common/utils/permissions.ts` | Platform admin permission checks |
| `src/database/` | Prisma services and tenant AsyncLocalStorage context |
| `src/modules/platform/` | `/api/v1/platform/*` — super-admin operations |
| `src/modules/merchant/` | `/api/v1/merchant/*` — shop owner operations |
| `src/modules/storefront/` | `/api/v1/storefront/*` — public customer-facing routes |
| `src/modules/customer/` | `/api/v1/customer/*` — customer auth and account |
| `src/modules/payment/` | `/api/v1/payments/*` — Razorpay integration |
| `test/` | E2E test suites |

---

## API Route Namespaces

| Prefix | Caller | Auth |
| :--- | :--- | :--- |
| `/api/v1/platform/*` | super-admin dashboard | super_admin JWT |
| `/api/v1/merchant/*` | merchant dashboard | merchant JWT |
| `/api/v1/storefront/*` | storefront (public) | none |
| `/api/v1/customer/*` | storefront (authenticated) | customer JWT |
| `/api/v1/payments/*` | storefront + merchant dashboard | varies |

---

## Request Lifecycle

Every incoming request passes through `TenantMiddleware` before reaching any controller.

```mermaid
sequenceDiagram
    participant C as Client
    participant M as TenantMiddleware
    participant DB as Central DB (Postgres)
    participant ALS as AsyncLocalStorage
    participant S as Service Layer
    participant TDB as Tenant Tables (same DB)

    C->>M: HTTP Request (Host: nature-glow.localhost)

    Note over M: 1. Bypass check
    alt platform / admin / api hostname
        M-->>C: next() immediately (no tenant needed)
    end

    M->>DB: lookup shop by custom domain
    alt no match
        M->>DB: lookup shop by subdomain slug
        alt no match and localhost
            M->>DB: find testShop or first active shop
        end
    end

    M->>DB: shopSubscription.findUnique(shop_id)
    alt cancelled or expired
        M-->>C: 402 Payment Required
    end

    M->>ALS: tenantLocalStorage.run({ shopId, client })
    M-->>S: next()

    S->>TDB: query with shop_id isolation
    TDB-->>C: response
```

---

## Database Architecture

One Postgres database (`oak_commerce`). All tenant data lives in the same schema, isolated by `shop_id` column. There is no per-shop database or schema switching.

### Mermaid Diagram

```mermaid
flowchart LR
    REQ([HTTP Request]) --> MW[TenantMiddleware]

    MW -->|resolves shopId| ALS[AsyncLocalStorage\nshopId + client]

    ALS -->|platform/admin routes\nno shopId needed| PS
    ALS -->|tenant routes\nshopId injected| TP

    subgraph Clients["Prisma Clients"]
        PS[PrismaService\ncentral.prisma]
        TP[TenantPrismaService\ntenant.prisma]
    end

    subgraph DB["PostgreSQL · oak_commerce"]
        subgraph Central["Central — platform-wide"]
            SH[shops] --> SD[shop_domains]
            SH --> SS[shop_subscriptions]
            SS -->|belongs to| SP[subscription_plans]
            SS -->|optional| PC[promo_codes]
            SS --> SPAY[subscription_payments]
            SS --> SSA[shop_subscription_addons]
            SSA -->|junction| SA[subscription_addons]
            SP --> PA2[plan_addons]
            PA2 -->|junction| SA
            SH -.-> PA[platform_admins]
            SH -.-> TR[tenant_requests]
        end

        subgraph Tenant["Tenant — per-shop · all rows carry shop_id"]
            PR[products] --> PV[product_variants]
            PR --> CA[categories]
            PR --> RE[reviews]
            OR[orders] --> OI[order_items]
            CU[customers] --> OR
            BA[banners]
            PG[payment_gateways]
            BL[blog_posts]
            ME[media_library]
        end
    end

    PS -->|reads & writes| Central
    TP -->|reads & writes\nWHERE shop_id = ?| Tenant
```

### ASCII Diagram

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    TenantMiddleware                     │
│                                                         │
│  hostname ──► custom domain lookup ──► shops table      │
│                      │                                  │
│                      ▼                                  │
│             subdomain slug lookup                       │
│                      │                                  │
│                      ▼                                  │
│          localhost fallback (dev only)                  │
│                      │                                  │
│                      ▼                                  │
│           subscription status check ──► 402 if expired  │
│                      │                                  │
│                      ▼                                  │
│         AsyncLocalStorage.run({ shopId })               │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
 /platform/* routes        /merchant/* /storefront/*
 /api no shopId            /customer/* routes
          │                         │
          ▼                         ▼
  ┌──────────────┐         ┌──────────────────┐
  │ PrismaService│         │TenantPrismaService│
  │ central.prisma│        │ tenant.prisma     │
  └──────┬───────┘         └────────┬─────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐   ┌──────────────────────────────┐
│   CENTRAL TABLES   │   │       TENANT TABLES          │
│                    │   │   (all filtered by shop_id)  │
│  shops             │   │                              │
│  shop_domains      │   │  products                    │
│  platform_admins   │   │  product_variants            │
│  tenant_requests   │   │  categories                  │
│                    │   │  orders ──► order_items       │
│  subscription_plans│   │  customers                   │
│      │             │   │  reviews                     │
│      ▼             │   │  banners                     │
│  shop_subscriptions│   │  payment_gateways            │
│      │    │    │   │   │  blog_posts                  │
│      │    │    │   │   │  media_library               │
│      ▼    ▼    ▼   │   └──────────────────────────────┘
│  payments addons   │
│  promo_codes       │
│  plan_addons       │
└────────────────────┘
         │                          │
         └────────────┬─────────────┘
                      ▼
            PostgreSQL · oak_commerce
              (single database)
```

---

## Tenant Isolation

`TenantPrismaService` is a Proxy that reads the current `shopId` from `AsyncLocalStorage` on every method call. Services never pass `shopId` manually — it flows automatically from the middleware context.

```mermaid
flowchart LR
    MW[TenantMiddleware\nsets shopId in ALS]
    ALS[AsyncLocalStorage\ntenantLocalStorage]
    TPS[TenantPrismaService\nProxy]
    PC2[Singleton PrismaClient\ntenant.prisma + PrismaPg adapter]
    DB[(Postgres\noak_commerce)]

    MW -->|.run shopId| ALS
    TPS -->|getStore| ALS
    TPS -->|delegates all calls| PC2
    PC2 -->|WHERE shop_id = shopId| DB
```

---

## Subscription System

Merchants pay the platform for access. This is entirely separate from customer-to-merchant payments (Razorpay).

```mermaid
flowchart TD
    PL[SubscriptionPlan\nlevel 0=free → 3=enterprise]
    PC3[PromoCode\ndiscount_type + discount_value]
    SS2[ShopSubscription\nstatus, payment_status, trial, dates]
    SA2[SubscriptionAddon\nslug + price]
    SSA2[ShopSubscriptionAddon\nquantity]
    SPAY2[SubscriptionPayment\nhistory per payment attempt]

    PL -->|assigned to| SS2
    PC3 -->|applied to| SS2
    SS2 -->|has many| SSA2
    SA2 -->|has many| SSA2
    SS2 -->|has many| SPAY2

    subgraph Status["ShopSubscription.status values"]
        S1[active]
        S2[past_due]
        S3[cancelled]
        S4[trialing]
    end

    subgraph PayStatus["ShopSubscription.payment_status values"]
        P1[not_required — free plan]
        P2[paid]
        P3[unpaid]
        P4[failed]
        P5[refunded]
    end
```

---

## Prisma Schema Files

| File | Generated client path | Used by |
| :--- | :--- | :--- |
| `prisma/central.prisma` | `src/generated/central` | `PrismaService` — shops, admins, subscriptions |
| `prisma/tenant.prisma` | `src/generated/tenant` | `TenantPrismaService` — products, orders, customers |
| `prisma/schema.prisma` | — | Prisma Studio / dev inspection only |

Regenerate clients after schema changes:
```bash
npx prisma generate --schema=prisma/central.prisma
npx prisma generate --schema=prisma/tenant.prisma

# Apply schema changes to the database:
npx prisma db push --schema=prisma/central.prisma
npx prisma db push --schema=prisma/tenant.prisma
```

---

## Development Guidelines

- Never call `new PrismaClient()` in domain code — always inject `PrismaService` or `TenantPrismaService`.
- Central queries (shops, subscriptions, admins): inject `PrismaService`.
- Tenant queries (products, orders, customers): inject `TenantPrismaService`.
- Keep controllers thin — one method per route, all logic in the service.
- Platform routes bypass `TenantMiddleware` (hostname `admin.*` or `api.*`) — they have no `shopId`.
