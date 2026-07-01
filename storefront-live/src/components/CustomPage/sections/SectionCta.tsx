'use client';
import React from 'react';
import { CtaData } from '../types';
import { hf } from '../shared';

export function SectionCta({ data }: { data: CtaData }) {
  /* Use the accent color as CTA bg by default — always readable with white text.
     If a merchant sets bg_color, respect it and auto-pick white or dark text
     using a simple midpoint check on the hex value. */
  const bg = data.bg_color || 'var(--sf-accent,#15803d)';
  const useWhiteText = !data.bg_color || isPerceivedDark(data.bg_color);

  return (
    <section style={{ background: bg, padding: '96px 40px', textAlign: 'center' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: hf(data.title_font),
          fontSize: 'clamp(1.8rem,4vw,3rem)',
          fontWeight: 700,
          color: useWhiteText ? '#fff' : '#111',
          margin: '0 0 14px',
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
        }}>
          {data.title}
        </h2>
        {data.subtitle && (
          <p style={{
            color: useWhiteText ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)',
            margin: '0 0 36px',
            lineHeight: 1.7,
            fontSize: '0.92rem',
          }}>
            {data.subtitle}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={data.button_url}
            style={{
              display: 'inline-block',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '13px 32px',
              background: useWhiteText ? '#fff' : '#111',
              color: useWhiteText ? '#111' : '#fff',
              transition: 'opacity 0.15s',
            }}
          >
            {data.button_label}
          </a>
          {data.button2_label && (
            <a
              href={data.button2_url || '#'}
              style={{
                display: 'inline-block',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                textDecoration: 'none', padding: '12px 30px',
                border: `1.5px solid ${useWhiteText ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.25)'}`,
                color: useWhiteText ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                transition: 'opacity 0.15s',
              }}
            >
              {data.button2_label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function isPerceivedDark(hex: string): boolean {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.map(x => parseInt(x, 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}
