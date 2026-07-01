'use client';
import React from 'react';
import { AnnouncementBarData } from '../types';

export function SectionAnnouncementBar({ data }: { data: AnnouncementBarData }) {
  if (data.active === false) return null;
  return (
    <div style={{ background: 'var(--sf-text-main,#111)', padding: '9px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sf-bg,#fff)' }}>
        {data.text}
      </span>
    </div>
  );
}
