import { Suspense } from 'react';
import { Product } from '@/components/Product';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense><Product slug={slug} /></Suspense>;
}
