'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MerchantDashboard = dynamic(
  () => import('../../../components/merchant-dashboard/App'),
  { ssr: false }
);

export default function Page() {
  return <MerchantDashboard />;
}
