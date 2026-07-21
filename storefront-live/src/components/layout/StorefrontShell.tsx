'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { CartDrawer } from '@/components/ui/CartDrawer';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { Icons } from '@/components/ui/Icons';

const NO_CHROME_PREFIXES = ['/checkout', '/account', '/login', '/register'];

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('OakSol App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const isMissingTenant = err && (
        err.status === 404 ||
        (err.message && (err.message.includes('Store domain mapping') || err.message.includes('Tenant-Domain')))
      );

      if (isMissingTenant && typeof window !== 'undefined') {
        const host = window.location.host;
        const protocol = window.location.protocol;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
          window.location.href = `${protocol}//localhost${port}`;
        } else {
          const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'posix.digital';
          if (host === platformDomain || host === `www.${platformDomain}`) {
            window.location.href = `${protocol}//app.${platformDomain}`;
          } else {
            window.location.href = `${protocol}//${platformDomain}`;
          }
        }
        return <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#6B7280' }}>Redirecting...</div>;
      }

      return (
        <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '40px 20px', textAlign: 'center' }}>
          <Icons.Warning />
          <h2 style={{ fontSize: '1.75rem', marginBottom: 10, color: '#1F2937' }}>Something went wrong</h2>
          <p style={{ color: '#6B7280', marginBottom: 6, maxWidth: 480 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: 24 }}>Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()} style={{ background: '#15803D', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const hideChrome = NO_CHROME_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <ErrorBoundary>
      <ThemeApplier />
      <CustomerProvider>
        <CartProvider>
          <div className="storefront-app-shell" style={{ background: 'var(--sf-bg, #FAF7F2)', minHeight: '100vh', paddingTop: hideChrome ? 0 : '70px', display: 'flex', flexDirection: 'column' }}>
            {!hideChrome && <Header />}
            <main className="storefront-main-content" style={{ flex: 1 }}>
              {children}
            </main>
            {!hideChrome && <Footer />}
            <CartDrawer />
          </div>
        </CartProvider>
      </CustomerProvider>
    </ErrorBoundary>
  );
}
