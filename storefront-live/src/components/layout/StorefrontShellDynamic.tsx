'use client';

import dynamic from 'next/dynamic';

const StorefrontShell = dynamic(() => import('./StorefrontShell'), { ssr: false });

export default function StorefrontShellDynamic({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
