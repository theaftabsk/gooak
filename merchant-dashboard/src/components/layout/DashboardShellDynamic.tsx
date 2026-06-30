'use client';

import dynamic from 'next/dynamic';
import { FullScreenSpinner } from '@/components/ui/Shared';

const Shell = dynamic(
  () => import('./DashboardShell').then(m => ({ default: m.DashboardShellWrapper })),
  { ssr: false, loading: () => <FullScreenSpinner /> }
);

export function DashboardShellDynamic({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
