'use client';
import { ReviewsPage } from '@/pages/ReviewsPage';
import { useDashboardData } from '@/context/DashboardData';

export default function Page() {
  const { shopInfo } = useDashboardData();
  return <ReviewsPage shopInfo={shopInfo} />;
}
