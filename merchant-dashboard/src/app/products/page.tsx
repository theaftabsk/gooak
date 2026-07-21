'use client';
import { ProductsPage } from '@/pages/ProductsPage';
import { useDashboardData } from '@/context/DashboardData';
export default function Page() {
  const { shopInfo, products, categories, loading, createProduct, deleteProduct, creatingProduct, deletingProduct } = useDashboardData();
  return <ProductsPage shopInfo={shopInfo} products={products} categories={categories} loading={loading} onCreateProduct={createProduct} onDeleteProduct={deleteProduct} creating={creatingProduct} deleting={deletingProduct} />;
}
