'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const VisualBuilderPage = dynamic(
  () => import('../../../components/merchant-dashboard/pages/VisualBuilderPage'),
  { ssr: false }
);

export default function BuilderPage() {
  return <VisualBuilderPage />;
}
