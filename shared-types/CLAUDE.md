# shared-types (`@oak-commerce/types`)

Shared TypeScript type definitions used across all apps in the monorepo.

## What Lives Here

- `src/Product.ts` — product and variant types
- `src/Order.ts` — order and order item types
- `src/Shop.ts` — shop and domain types
- `src/PageBuilder.ts` — page builder / CMS types
- `src/index.ts` — barrel export

## Usage

```typescript
import type { Product, Variant } from '@oak-commerce/types';
```

## Rules

- Types only — no runtime code, no imports from other workspace packages
- Keep types in sync with `backend/prisma/central.prisma` and `backend/prisma/tenant.prisma`
- When adding a new backend model field, update the corresponding type here
