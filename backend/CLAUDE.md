# Backend — NestJS API

Single NestJS application serving all tenants. Port **5005** in development.

## Module Structure

```
src/
├── modules/
│   ├── catalog/
│   │   ├── catalog.controller.ts       ← /api/v1/storefront/* (public storefront)
│   │   ├── merchant.controller.ts      ← /api/v1/merchant/* (merchant admin)
│   │   ├── platform-admin.controller.ts← /api/v1/platform/* (super-admin)
│   │   ├── catalog.service.ts          ← shared service (storefront + merchant)
│   │   └── catalog.module.ts
│   ├── customer/                       ← /api/v1/customer/* (customer auth/account)
│   ├── inventory/                      ← /api/v1/merchant/* (stock management)
│   ├── payment/                        ← /api/v1/payments/* (Razorpay)
│   └── reviews/                        ← /api/v1/merchant/* (product reviews)
├── common/
│   ├── middleware/tenant.middleware.ts  ← resolves shopId from hostname
│   ├── utils/permissions.ts            ← platform admin permission checks
│   └── filters/http-exception.filter.ts
└── database/
    ├── prisma.service.ts               ← central DB client
    ├── tenant-context.ts               ← AsyncLocalStorage for tenant DB
    └── tenant-connection-pool.service.ts
```

## API Route Map

### `/api/v1/platform/*` — Super-admin (no tenant context)
| Method | Route | Permission |
|---|---|---|
| POST | `/platform/auth/login` | public |
| GET | `/platform/stats` | VIEW_STATS |
| GET/POST | `/platform/shops` | VIEW_SHOPS / ONBOARD_SHOP |
| GET/PATCH/DELETE | `/platform/shops/:id` | VIEW_SHOPS / ONBOARD_SHOP / DELETE_SHOP |
| GET | `/platform/requests` | VIEW_REQUESTS |
| POST | `/platform/requests/:id/approve` | MANAGE_REQUESTS |
| POST | `/platform/requests/:id/reject` | MANAGE_REQUESTS |
| DELETE | `/platform/requests/:id` | MANAGE_REQUESTS |
| GET/POST | `/platform/team` | MANAGE_TEAM |
| GET/PATCH/DELETE | `/platform/team/:id` | MANAGE_TEAM |

### `/api/v1/merchant/*` — Merchant (requires shopId from tenant context)
Products, variants, categories, collections, orders, banners, sections, home-sections, pages, blog, media, faqs, testimonials, users, domains, configs, backup, stats, upload, reviews, inventory.

### `/api/v1/storefront/*` — Public (requires shopId, no auth)
homepage, products, products/:slug, categories, brands, settings, orders (POST/GET), page-content (GET), contact, requests (tenant signup)

### `/api/v1/customer/*` — Customer auth (requires shopId + customer JWT)
register, login, me (GET/PATCH), orders

### `/api/v1/payments/*` — Payments (requires shopId)
gateways (public), merchant/gateways (merchant admin), razorpay/* (order/verify/webhook/simulate)

## Tenant Resolution

Every request goes through `TenantMiddleware` which:
1. Bypasses: `POST /merchant/auth/login`, hostnames `admin.*` / `api.*`, platform domain
2. Resolves shop by custom domain → subdomain slug → localhost fallback
3. Sets `req.shopId` and initialises the tenant Prisma client in AsyncLocalStorage

## Database

Two Prisma schemas:
- `prisma/central.prisma` — shops, platform_admins, orders, shop_domains, tenant_requests
- `prisma/tenant.prisma` — customers, products, categories, variants, product_images, banners, reviews, inventory_log, payment_gateways, blog_posts, faqs, testimonials, media

## Auth

- **Platform admins**: JWT with `role: 'super_admin'`, verified manually in `PlatformAdminController.verifyAdmin()`
- **Customers**: JWT with `customerId`, verified in `CustomerService.verifyCustomerToken()`
- **Merchant**: login via `/merchant/auth/login` (not yet fully implemented — tracked as TODO)

## Running

```bash
pnpm dev        # from repo root, or:
npm run start:dev
```

Static file uploads served from `./uploads/` at the `/uploads/` URL path.
