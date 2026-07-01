'use client';
import React from 'react';

export function hf(override?: string) {
  return override
    ? `'${override}', serif`
    : 'var(--sf-font-heading, var(--font-serif, serif))';
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 8px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--sf-text-muted, #9ca3af)' }}>
      {children}
    </p>
  );
}

export function SectionHead({
  label, title, subtitle, viewAllUrl, viewAllLabel, titleFont, center,
}: {
  label?: string; title: string; subtitle?: string;
  viewAllUrl?: string; viewAllLabel?: string; titleFont?: string; center?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: center ? 'center' : 'space-between', marginBottom: 40, gap: 16, flexWrap: 'wrap', flexDirection: center ? 'column' : undefined, textAlign: center ? 'center' : undefined }}>
      <div>
        {label && <SectionLabel>{label}</SectionLabel>}
        <h2 style={{ fontFamily: hf(titleFont), fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--sf-text-main,#111)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.88rem', color: 'var(--sf-text-muted,#6b7280)', margin: '6px 0 0', lineHeight: 1.6 }}>
            {subtitle}
          </p>
        )}
      </div>
      {viewAllUrl && (
        <a href={viewAllUrl} style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: 'var(--sf-text-main,#111)', borderBottom: '1.5px solid var(--sf-text-main,#111)', paddingBottom: 2, whiteSpace: 'nowrap' }}>
          {viewAllLabel || 'View All'} →
        </a>
      )}
    </div>
  );
}
