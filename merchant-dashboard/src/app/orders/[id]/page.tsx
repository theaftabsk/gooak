'use client';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { useDashboardData } from '@/context/DashboardData';
import { useRouter } from 'next/navigation';
import { use } from 'react';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, updateOrderStatus, updatingOrderStatus } = useDashboardData();
  const router = useRouter();
  return <OrderDetailPage orderId={id} orders={orders} onUpdateOrderStatus={updateOrderStatus} updating={updatingOrderStatus} onBack={() => router.push('/orders')} />;
}
