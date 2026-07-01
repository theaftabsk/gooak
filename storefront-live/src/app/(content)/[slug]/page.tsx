import { Suspense } from 'react';
import { CustomPage } from '@/components/CustomPage';

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Suspense><CustomPage pageSlug={slug} /></Suspense>;
}
