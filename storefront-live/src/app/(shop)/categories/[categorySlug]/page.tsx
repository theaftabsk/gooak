import { Suspense } from 'react';
import { Categories } from '@/components/Categories';

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  return <Suspense><Categories categorySlug={categorySlug} /></Suspense>;
}
