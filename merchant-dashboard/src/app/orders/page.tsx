'use client';
import { OrdersPage } from '@/pages/OrdersPage';
import { useDashboardData } from '@/context/DashboardData';
export default function Page() {
  const { orders, loading, updateOrderStatus, updatingOrderStatus } = useDashboardData();
  return <OrdersPage orders={orders} loading={loading} onUpdateOrderStatus={updateOrderStatus} updating={updatingOrderStatus} />;
}
