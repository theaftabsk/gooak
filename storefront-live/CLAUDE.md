@AGENTS.md

# Storefront Live

Next.js app for end customers. Port **3001** in development.

## What This App Is

The public-facing e-commerce store. Customers browse products, place orders, and manage their accounts here. Each shop has its own storefront — tenant is resolved by the subdomain or custom domain of the request.

## API Client

`src/lib/api-client.ts` — all backend calls go through here.

Named exports to use:
- `storefrontApi` — public shop data (homepage, products, categories, orders)
- `customerApi` — customer auth and account (requires customer JWT)
- `paymentApi` — Razorpay payment processing

Do NOT call `merchantApi` or `platformApi` from this app — those routes require merchant/admin auth.

The deprecated `catalogApi` export is a compatibility shim. Migrate to the named exports.

## URL Structure

| Environment | URL pattern | Example |
|---|---|---|
| Dev (localhost) | `localhost:3001/{shop}/{page}` | `localhost:3001/amir/products` |
| Prod subdomain | `{shop}.posix.digital/{page}` | `amir.posix.digital/products` |
| Prod custom domain | `www.mystore.com/{page}` | `www.mystore.com/products` |

## Tenant Resolution

- **localhost**: shop slug is the first URL path segment (`/amir/...`). `src/middleware.ts` does nothing; `api-client.ts` reads the slug from `pathname` and sends `X-Tenant-Domain: amir.localhost` to the backend.
- **subdomain** (`amir.posix.digital` or `amir.localhost`): `src/middleware.ts` rewrites the request internally to `/amir/{path}` so the React Router basename stays consistent.
- **custom domain** (`www.mystore.com`): no rewrite, api-client sends the full hostname as `X-Tenant-Domain` and backend resolves it via the `shop_domains` table.

## Auth

- Customer JWT stored in `localStorage` as `oaksol_customer_token`
- This token is a different secret from the merchant/admin token

## Route Structure

All pages are served via the catch-all `src/app/[[...path]]/page.tsx`.

## Key API Routes Used

| API export | Backend prefix |
|---|---|
| `storefrontApi` | `/api/v1/storefront/*` |
| `customerApi` | `/api/v1/customer/*` |
| `paymentApi` | `/api/v1/payments/*` |
