'use client';
import React from 'react';
import { HeroData } from '../types';
import { hf } from '../shared';

export function SectionHero({ data }: { data: HeroData }) {
  const hasBg = !!(data.bg_image);
  return (
    <div
      className="cp-hero"
      style={hasBg
        ? { backgroundImage: `url(${data.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: data.bg_color || 'var(--sf-bg,#fff)' }}
    >
      {hasBg && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />}
      <div className="cp-hero-inner" style={{ position: 'relative', zIndex: 1 }}>
        <h1
          className="cp-hero-title"
          style={{ fontFamily: hf(data.title_font), color: hasBg ? '#fff' : 'var(--sf-text-main,#111)' }}
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="cp-hero-sub" style={{ color: hasBg ? 'rgba(255,255,255,0.8)' : 'var(--sf-text-muted,#555)' }}>
            {data.subtitle}
          </p>
        )}
        {data.button_label && (
          <a
            href={data.button_url || '#'}
            style={{
              marginTop: 28,
              display: 'inline-block',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '13px 32px', cursor: 'pointer',
              background: hasBg ? '#fff' : 'var(--sf-text-main,#111)',
              color: hasBg ? '#111' : 'var(--sf-bg,#fff)',
              transition: 'opacity 0.15s',
            }}
          >
            {data.button_label}
          </a>
        )}
      </div>
    </div>
  );
}
