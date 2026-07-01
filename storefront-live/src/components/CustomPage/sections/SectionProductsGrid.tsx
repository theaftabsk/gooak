'use client';
import React, { useEffect, useState } from 'react';
import { ProductsGridData } from '../types';
import { SectionHead } from '../shared';
import { storefrontApi } from '@/lib/api-client';
import { getCurrencySymbol } from '@/lib/utils';

function ProductCard({ p }: { p: any }) {
  const cover = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || '';
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  const curr = getCurrencySymbol();

  return (
    <a href={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--sf-card-bg,#f5f5f5)', position: 'relative' }}>
        <img
          src={cover || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600'}
          alt={p.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
        />
      </div>
      <div style={{ padding: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {p.category?.name && (
          <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sf-text-muted,#999)' }}>
            {p.category.name}
          </span>
        )}
        <h3 style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--sf-text-main,#111)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
          {p.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--sf-accent,#15803d)' }}>
            {curr}{Number(p.price).toFixed(2)}
          </span>
          {isOnSale && (
            <span style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted,#999)', textDecoration: 'line-through' }}>
              {curr}{Number(p.compare_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function SectionProductsGrid({ data }: { data: ProductsGridData }) {
  const [products, setProducts] = useState<any[]>([]);
  const limit = data.limit || 8;
  const cols = data.columns || 4;

  useEffect(() => {
    storefrontApi.getProducts({ limit })
      .then(r => setProducts(r?.products || []))
      .catch(() => {});
  }, [limit]);

  if (!products.length) return null;

  return (
    <section className="cp-sec cp-sec-alt">
      <div className="cp-con">
        <SectionHead
          label={data.badge}
          title={data.title || 'Products'}
          subtitle={data.subtitle}
          viewAllUrl={data.view_all_url || '/products'}
          viewAllLabel={data.view_all_label}
        />
        <div className={`cp-products-grid cp-products-grid-${cols}`}>
          {products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}
