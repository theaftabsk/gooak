import { Suspense } from 'react';
import { MyAccount } from '@/components/Account';

export default function AccountPage() {
  return <Suspense><MyAccount /></Suspense>;
}
