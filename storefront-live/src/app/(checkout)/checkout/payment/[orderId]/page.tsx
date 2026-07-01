import { Suspense } from 'react';
import { Payment } from '@/components/Payment';

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <Suspense><Payment orderId={orderId} /></Suspense>;
}
