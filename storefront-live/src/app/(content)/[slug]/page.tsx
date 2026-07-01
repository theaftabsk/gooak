import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CustomPage } from '@/components/CustomPage';

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // /home is the canonical homepage — always serve it at /
  if (slug === 'home') redirect('/');
  return <Suspense><CustomPage pageSlug={slug} /></Suspense>;
}
