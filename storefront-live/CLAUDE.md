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

## Tenant Context

Tenant is resolved entirely from the window hostname. No `localStorage` slug lookup needed — the hostname IS the shop identifier.

On localhost port 3001, the backend falls back to the first active shop.

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
