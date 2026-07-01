'use client';
import React from 'react';
import { AboutSectionData } from '../types';
import { SectionLabel, hf } from '../shared';

const DEFAULT_VALUES = [
  { icon: '', label: '100% Natural',   desc: 'All ingredients certified organic and cruelty-free.' },
  { icon: '', label: 'Chemical Free',  desc: 'No harmful additives — ever. Safe for skin and hair.' },
  { icon: '', label: 'Ethically Made', desc: 'Supporting fair-trade and local communities.' },
  { icon: '', label: 'Fast Delivery',  desc: 'Reliable shipping across India.' },
];

export function SectionAboutSection({ data }: { data: AboutSectionData }) {
  const values = data.values?.length ? data.values : DEFAULT_VALUES;

  return (
    <section className="cp-sec">
      <div className="cp-con">
        <div className="cp-about">
          {/* Left column — editorial copy */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionLabel>Our Story</SectionLabel>
            <h2 style={{
              fontFamily: hf(data.title_font),
              fontSize: 'clamp(1.8rem,3.5vw,2.8rem)',
              fontWeight: 700,
              color: 'var(--sf-text-main,#111)',
              margin: '8px 0 20px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              {data.title || 'About Us'}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--sf-text-muted,#555)', lineHeight: 1.8, margin: '0 0 18px' }}>
              {data.content || 'We are committed to bringing you the best products.'}
            </p>
            {data.tagline && (
              <p style={{
                fontFamily: hf(data.title_font),
                fontSize: '1.05rem',
                fontStyle: 'italic',
                color: 'var(--sf-accent,#15803d)',
                margin: '0 0 32px',
                fontWeight: 600,
              }}>
                {data.tagline}
              </p>
            )}
            <a href={data.button_url || '/about'} className="cp-btn" style={{ alignSelf: 'flex-start' }}>
              {data.button_label || 'Learn More'}
            </a>
          </div>

          {/* Right column — numbered values */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {values.map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 20,
                  padding: '22px 0',
                  borderBottom: '1px solid var(--sf-border,rgba(0,0,0,0.1))',
                  borderTop: i === 0 ? '1px solid var(--sf-border,rgba(0,0,0,0.1))' : 'none',
                }}
              >
                <span style={{
                  fontFamily: hf(),
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--sf-accent,#15803d)',
                  flexShrink: 0,
                  lineHeight: 1,
                  paddingTop: 2,
                }}>
                  0{i + 1}
                </span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sf-text-main,#111)', marginBottom: 4 }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted,#555)', lineHeight: 1.55 }}>
                    {v.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
