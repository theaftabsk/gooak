'use client';
import { OverviewPage } from '@/pages/OverviewPage';
import { useDashboardData } from '@/context/DashboardData';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { shopInfo, products, orders } = useDashboardData();
  const router = useRouter();
  return <OverviewPage shopInfo={shopInfo} products={products} orders={orders} onNavigate={(tab) => router.push(`/${tab}`)} />;
}
