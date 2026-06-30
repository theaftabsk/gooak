'use client';

import dynamic from 'next/dynamic';

const StorefrontApp = dynamic(
  () => import('@/components/layout/StorefrontShell'),
  { ssr: false }
);

export default function Page() {
  return <StorefrontApp />;
}
