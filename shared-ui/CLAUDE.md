# shared-ui

Shared React UI component library used by merchant-dashboard and other apps.

## What Lives Here

Pure, stateless UI components — no API calls, no business logic, no app-specific state.

- `src/components/` — individual components
- `src/index.ts` — barrel export

## Usage

```typescript
import { Button, Input, Modal } from 'shared-ui';
```

## Rules

- Components must be completely agnostic of which app they're used in
- No direct API calls or `fetch` — pass data as props
- No `localStorage` or `window` access
- Styling: keep consistent with the existing component style in the package
- Peer dependencies: React 19 and React-DOM 19
