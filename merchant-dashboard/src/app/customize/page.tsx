'use client';
import { Suspense } from 'react';
import { CustomizePage } from '@/pages/CustomizePage';

export default function Page() {
  return <Suspense><CustomizePage /></Suspense>;
}
