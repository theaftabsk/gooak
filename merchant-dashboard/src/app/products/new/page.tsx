'use client';
import { AddProductPage } from '@/pages/AddProductPage';
import { useDashboardData } from '@/context/DashboardData';
import { useRouter } from 'next/navigation';
export default function Page() {
  const { categories, brands, createProduct, creatingProduct } = useDashboardData();
  const router = useRouter();
  return <AddProductPage categories={categories} brands={brands} onCreateProduct={createProduct} creating={creatingProduct} onBack={() => router.push('/products')} />;
}
