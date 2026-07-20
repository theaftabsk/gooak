'use client';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { useDashboardData } from '@/context/DashboardData';

export default function Page() {
  const { products, orders } = useDashboardData();
  return <AnalyticsPage products={products} orders={orders} />;
}
