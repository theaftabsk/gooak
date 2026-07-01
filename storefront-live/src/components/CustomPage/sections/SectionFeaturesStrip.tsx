'use client';
import React from 'react';
import type { FeatureItem } from '../types';
import { hf } from '../shared';

const ICONS = [
  <svg key="truck" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  <svg key="dollar" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  <svg key="refresh" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  <svg key="chat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  <svg key="shield" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
];

const DEFAULT_ITEMS: FeatureItem[] = [
  { emoji: '', title: 'Free Shipping',    desc: 'On orders above ₹500' },
  { emoji: '', title: 'Easy Returns',     desc: '7-day hassle-free policy' },
  { emoji: '', title: 'Free COD',         desc: 'No minimum order value' },
  { emoji: '', title: 'Customer Support', desc: 'Mon–Fri, 10am–7pm' },
  { emoji: '', title: 'Secure Payments',  desc: '100% protected checkout' },
];

export function SectionFeaturesStrip({ data }: { data: { items?: FeatureItem[] } }) {
  const items = data.items?.length ? data.items : DEFAULT_ITEMS;
  const count = Math.min(items.length, 5);

  return (
    <section style={{
      borderTop: '1px solid var(--sf-border,rgba(0,0,0,0.08))',
      borderBottom: '1px solid var(--sf-border,rgba(0,0,0,0.08))',
      background: 'var(--sf-bg,#fff)',
    }}>
      <div className="cp-con">
        <div className="cp-features-grid" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${count},1fr)`,
        }}>
          {items.map((f, i) => (
            <div
              key={i}
              className="cp-features-item"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '28px 20px',
              }}
            >
              <div style={{ color: 'var(--sf-accent,#15803d)', flexShrink: 0, marginTop: 2 }}>
                {ICONS[i % ICONS.length]}
              </div>
              <div>
                <div style={{ fontFamily: hf(f.title_font), fontSize: '0.82rem', fontWeight: 700, color: 'var(--sf-text-main,#111)', marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--sf-text-muted,#777)', lineHeight: 1.55 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
