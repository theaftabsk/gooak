'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(
  () => import('../../components/admin-dashboard/App'),
  { ssr: false }
);

export default function Page() {
  return <AdminDashboard />;
}
