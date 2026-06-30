@AGENTS.md

# Merchant Dashboard

Next.js app for shop owners. Port **3000** in development.

## What This App Is

The admin panel for individual shop owners (merchants). A merchant can only see and manage their own shop's data. Completely separate from the super-admin panel.

## API Client

`src/lib/api-client.ts` — all backend calls go through here.

Named exports to use:
- `merchantApi` — all shop-scoped operations (products, orders, settings, CMS, etc.)
- `storefrontApi` — read-only public shop data
- `platformApi` — super-admin operations (only used for the platform login flow in this app)
- `paymentApi` — payment gateway management

The deprecated `catalogApi` export is a compatibility shim — it delegates to the named exports above. Migrate page components to use the named exports directly.

## Tenant Context

On localhost, the active shop is resolved from `localStorage.oaksol_active_shop_slug` (defaults to `testShop`). The API client builds the tenant domain as `{slug}.localhost` and sends it as the `X-Tenant-Domain` header.

In production, the shop is resolved from the window hostname (subdomain or custom domain).

## Auth

- Merchant auth token stored in `localStorage` as `oaksol_admin_token`
- Platform admin token also stored as `oaksol_admin_token` (same key — merchants are currently authenticated via the platform admin login flow)

## Route Structure

All pages live at the root via the catch-all `src/app/[[...path]]/page.tsx`. No `/dashboard` prefix — routes are `/{tab}` (e.g. `/products`, `/orders`, `/settings`).

## Key API Routes Used

All calls target `/api/v1/merchant/*` on the backend. See `backend/CLAUDE.md` for the full route map.
