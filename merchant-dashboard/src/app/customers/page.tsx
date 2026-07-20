'use client';
import { CustomersPage } from '@/pages/CustomersPage';
import { useDashboardData } from '@/context/DashboardData';

export default function Page() {
  const { shopInfo } = useDashboardData();
  return <CustomersPage shopInfo={shopInfo} />;
}
