@AGENTS.md

# Super Admin

Next.js app for the platform owner. Port **3002** in development.

## What This App Is

The highest-privilege dashboard. The super-admin can create/delete shops, approve merchant signup requests, view platform-wide stats, and manage other platform admins. It has NO shop-specific context — it operates across all tenants.

## API Client

`src/lib/api-client.ts` — all backend calls go through here.

Named exports to use:
- `platformAuthApi` — login
- `platformStatsApi` — platform dashboard stats
- `platformShopsApi` — create / view / update / delete shops
- `platformRequestsApi` — approve / reject merchant signup requests
- `platformTeamApi` — manage platform admin accounts

The deprecated `catalogApi` export is a compatibility shim. Migrate page components to use the named exports directly.

## Auth

- Super-admin JWT stored in `localStorage` as `oaksol_admin_token`
- The JWT payload has `role: 'super_admin'` and a `permissions` array
- All platform API calls include this token in the `Authorization: Bearer` header
- Backend verifies the token and checks permissions on every request

## Permission Model

| Permission | What it unlocks |
|---|---|
| `VIEW_SHOPS` | List and view shop details |
| `ONBOARD_SHOP` | Create and update shops |
| `DELETE_SHOP` | Delete shops |
| `VIEW_STATS` | Platform statistics dashboard |
| `VIEW_REQUESTS` | See merchant signup requests |
| `MANAGE_REQUESTS` | Approve / reject / delete requests |
| `MANAGE_TEAM` | Create / update / delete other platform admins |

The root admin (email from `ADMIN_EMAIL` env) always has all permissions.

## Route Structure

Pages are under `src/app/[[...path]]/page.tsx` catch-all. Main pages: login, dashboard, stores, store detail, onboard, requests, team.

## Key API Routes Used

All calls target `/api/v1/platform/*` on the backend. No tenant header is sent — platform routes bypass `TenantMiddleware`.
