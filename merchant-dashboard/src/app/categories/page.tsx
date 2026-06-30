'use client';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { useDashboardData } from '@/context/DashboardData';
export default function Page() {
  const { categories, loading, createCategory, deleteCategory, updateCategory, creatingCategory, deletingCategory } = useDashboardData();
  return <CategoriesPage categories={categories} loading={loading} onCreateCategory={createCategory} onDeleteCategory={deleteCategory} onUpdateCategory={updateCategory} creating={creatingCategory} deleting={deletingCategory} />;
}
