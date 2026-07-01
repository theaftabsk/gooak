'use client';
import React, { useEffect, useState } from 'react';
import { BannerSliderData } from '../types';
import { hf } from '../shared';

const P_ALIGN:   Record<string, string>                  = { 'top-left':'flex-start','top-center':'flex-start','top-right':'flex-start','mid-left':'center','mid-center':'center','mid-right':'center','bot-left':'flex-end','bot-center':'flex-end','bot-right':'flex-end' };
const P_JUSTIFY: Record<string, string>                  = { 'top-left':'flex-start','top-center':'center','top-right':'flex-end','mid-left':'flex-start','mid-center':'center','mid-right':'flex-end','bot-left':'flex-start','bot-center':'center','bot-right':'flex-end' };
const P_TEXT:    Record<string, 'left'|'center'|'right'> = { 'top-left':'left','top-center':'center','top-right':'right','mid-left':'left','mid-center':'center','mid-right':'right','bot-left':'left','bot-center':'center','bot-right':'right' };

import type { BannerSlide } from '../types';

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    title: 'Welcome to our store',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600',
    link_url: '/products',
    button_label: 'Shop Now',
    text_position: 'mid-center',
  },
];

export function SectionBannerSlider({ data }: { data: BannerSliderData }) {
  const [current, setCurrent] = useState(0);
  const slides = data.banners?.length ? data.banners : DEFAULT_SLIDES;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (idx: number) => setCurrent(idx);

  const pos = slides[current].text_position || 'mid-center';
  const pad = pos.includes('left') ? '8% 50% 8% 8%' : pos.includes('right') ? '8% 8% 8% 50%' : '8%';

  return (
    <>
    <style>{`
      @media (min-width: 769px) { .banner-root { height: 55vh; min-height: 380px; } }
      @media (max-width: 768px) { .banner-root { height: 56vh; min-height: 320px; } }
      @media (max-width: 480px) { .banner-root { height: 48vh; min-height: 260px; } }
    `}</style>
    <div className="banner-root" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#111' }}>
      {slides.map((s, i) => (
        <div
          key={i}
          style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.7s ease', backgroundImage: `url(${s.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.55))' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 18, alignItems: P_JUSTIFY[pos] || 'center', justifyContent: P_ALIGN[pos] || 'center', width: '100%', maxWidth: 1280, margin: '0 auto', padding: pad, boxSizing: 'border-box', textAlign: P_TEXT[pos] || 'center' }}>
            {s.subtitle && (
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', margin: 0 }}>
                {s.subtitle}
              </p>
            )}
            {s.title && (
              <h1 style={{ fontFamily: hf(s.title_font), fontSize: 'clamp(2rem,5.5vw,5rem)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.04, letterSpacing: '-0.02em', maxWidth: '14ch' }}>
                {s.title}
              </h1>
            )}
            {(s.button_label || s.link_url) && (
              <a href={s.link_url || '/products'} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.55)', paddingBottom: 4, width: 'fit-content' }}>
                {s.button_label || 'Shop Now'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go((current - 1 + slides.length) % slides.length)}
            style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={() => go((current + 1) % slides.length)}
            style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 6 }}>
            {slides.map((_, i) => (
              <button
                key={i} onClick={() => go(i)}
                style={{ width: i === current ? 40 : 24, height: 2, background: i === current ? '#fff' : 'rgba(255,255,255,0.38)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', borderRadius: 1, padding: 0 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </>
  );
}
