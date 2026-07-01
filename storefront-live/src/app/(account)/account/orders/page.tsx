import { Suspense } from 'react';
import { MyOrders } from '@/components/Account/orders';

export default function OrdersPage() {
  return <Suspense><MyOrders /></Suspense>;
}
