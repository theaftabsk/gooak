import React, { useEffect, useState } from 'react';
import { catalogApi } from '../../../lib/api-client';
import { VisualBuilder } from './VisualBuilder/index';

export default function VisualBuilderPage() {
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const params = new URLSearchParams(window.location.search);

    // Priority: 1) URL ?shop= param  2) Subdomain  3) localStorage  4) default
    let slug =
      params.get('shop') ||
      params.get('tenant') ||
      (!['localhost', '127.0.0.1'].includes(parts[0]) && parts.length >= 2 ? parts[0] : null) ||
      localStorage.getItem('oaksol_active_shop_slug') ||
      'testShop';

    // Check login
    const isLoggedIn = localStorage.getItem(`oaksol_merchant_logged_in_${slug}`) === 'true';
    if (!isLoggedIn) {
      window.location.href = `/admin`;
      return;
    }

    // Fetch shop info and always force storefront_url = http://slug.localhost:3001
    catalogApi.getHomepage()
      .then(data => {
        const shop = data.shop || { slug };
        const resolvedSlug = shop.slug || slug;
        shop.storefront_url = `http://${resolvedSlug}.localhost:3001`;
        setShopInfo(shop);
      })
      .catch(() => setShopInfo({ slug, storefront_url: `http://${slug}.localhost:3001` }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0F172A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 12
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #334155', borderTopColor: '#38BDF8',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Loading builder…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <VisualBuilder
      shopInfo={shopInfo}
      onExit={() => window.close()}
    />
  );
}
