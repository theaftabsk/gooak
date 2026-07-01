'use client';
import React, { useEffect, useRef, useState } from 'react';
import { CategoriesCarouselData } from '../types';
import { SectionHead } from '../shared';
import { storefrontApi } from '@/lib/api-client';

// Deterministic fallback images based on category index so each card looks different
const FALLBACKS = [
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600',
];

export function SectionCategoriesCarousel({ data }: { data: CategoriesCarouselData }) {
  const [categories, setCategories] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storefrontApi.getCategories()
      .then(r => setCategories(Array.isArray(r) ? r : []))
      .catch(() => {});
  }, []);

  if (!categories.length) return null;

  const scroll = (dir: 'left' | 'right') =>
    ref.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });

  const arrowBtn: React.CSSProperties = {
    width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
    border: '1px solid var(--sf-border,rgba(0,0,0,0.1))',
    background: 'var(--sf-card-bg,#fff)',
    color: 'var(--sf-text-main,#111)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s',
  };

  return (
    <section className="cp-sec">
      <div className="cp-con">
        <SectionHead
          label={data.badge || 'Browse'}
          title={data.title || 'Categories'}
          viewAllUrl="/categories"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => scroll('left')} style={{ ...arrowBtn, flexShrink: 0 }} className="cat-carousel-arrow" aria-label="Scroll left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div
            ref={ref}
            style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', flex: 1, minWidth: 0 }}
          >
            {categories.map((cat: any, idx: number) => (
              <a
                key={cat.id}
                href={`/categories/${cat.slug}`}
                style={{ flex: '0 0 160px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--sf-card-bg,#eee)' }}>
                  <img
                    src={cat.image_url || FALLBACKS[idx % FALLBACKS.length]}
                    alt={cat.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s ease', display: 'block' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                  />
                </div>
                <span style={{
                  fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--sf-text-main,#111)',
                  paddingTop: 2,
                }}>
                  {cat.name}
                </span>
              </a>
            ))}
          </div>

          <button onClick={() => scroll('right')} style={{ ...arrowBtn, flexShrink: 0 }} className="cat-carousel-arrow" aria-label="Scroll right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
