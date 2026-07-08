'use client';
import React from 'react';
import CollectionDetailPage from '@/pages/CollectionsPage/CollectionDetail';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return <CollectionDetailPage id={id} />;
}
