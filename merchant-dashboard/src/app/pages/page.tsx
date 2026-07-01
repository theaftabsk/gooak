'use client';
import { Suspense } from 'react';
import { PagesPage } from '@/pages/PagesPage';
export default function Page() {
  return <Suspense><PagesPage /></Suspense>;
}
