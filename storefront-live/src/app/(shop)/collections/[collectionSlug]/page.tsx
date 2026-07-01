import { Suspense } from 'react';
import { Collection } from '@/components/Collection';

export default async function CollectionPage({ params }: { params: Promise<{ collectionSlug: string }> }) {
  const { collectionSlug } = await params;
  return <Suspense><Collection collectionSlug={collectionSlug} /></Suspense>;
}
