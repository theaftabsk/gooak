'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const StorefrontApp = dynamic(
  () => import('../../components/storefront/App'),
  { ssr: false }
);

export default function Page() {
  return <StorefrontApp />;
}
