'use client';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { useDashboardData } from '@/context/DashboardData';
import { useRouter } from 'next/navigation';
import { use } from 'react';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products, categories, brands } = useDashboardData();
  const router = useRouter();
  return <ProductDetailPage productId={id} products={products} categories={categories} brands={brands} onBack={() => router.push('/products')} />;
}
