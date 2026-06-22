// ─── Types ───────────────────────────────────────────────────────────────────
export type SuperPage = 'dashboard' | 'stores' | 'store-detail' | 'requests' | 'onboard';

// ─── Utilities ────────────────────────────────────────────────────────────────
export function copyText(text: string, label = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => {
    const el = document.createElement('div');
    el.className = 'copy-toast';
    el.textContent = label;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  });
}

export function genPassword(slug: string) {
  return `${slug}@OakSol${new Date().getFullYear()}`;
}

// ─── Platform URL helpers (reads NEXT_PUBLIC_PLATFORM_DOMAIN) ─────────────────
const _platformDomain = () =>
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PLATFORM_DOMAIN) || 'posix.digital';

export function storeUrl(slug: string): string {
  return `http://${slug.toLowerCase()}.localhost:3001`;
}

export function storeAdminUrl(slug: string): string {
  return `http://${slug.toLowerCase()}.localhost:3000/dashboard`;
}

export function storeDomainLabel(slug: string): string {
  return `${slug.toLowerCase()}.localhost:3001`;
}
