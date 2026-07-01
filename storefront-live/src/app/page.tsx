import { Suspense } from 'react';
import { CustomPage } from '@/components/CustomPage';

export default function HomePage() {
  return <Suspense><CustomPage pageSlug="home" /></Suspense>;
}
