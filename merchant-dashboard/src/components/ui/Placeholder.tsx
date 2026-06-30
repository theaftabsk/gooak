import React from 'react';

interface PlaceholderPageProps {
  tabName: string;
  parentName?: string;
  description: string;
}

export function PlaceholderPage({ tabName, parentName, description }: PlaceholderPageProps) {
  return (
    <>
      <header className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--m-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {parentName && <><span>{parentName}</span><span style={{ fontSize: '0.7rem', color: 'var(--m-border)', margin: '0 2px' }}>/</span></>}
            <span style={{ color: 'var(--m-primary)', fontWeight: 600 }}>{tabName}</span>
          </div>
          <h2>{tabName}</h2>
          <p className="header-sub">Manage and monitor {tabName.toLowerCase()} settings for your storefront</p>
        </div>
      </header>

      <div className="card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px', textAlign: 'center', background: '#FFFFFF',
        border: '1px solid var(--m-border)', borderRadius: '12px', boxShadow: 'var(--m-shadow)',
        maxWidth: '800px', margin: '0 auto',
      }}>
        <div style={{ color: 'var(--m-primary)', background: 'var(--m-primary-light)', padding: '24px', borderRadius: '50%', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--m-text-main)', marginBottom: '8px' }}>{tabName} Module</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--m-text-muted)', maxWidth: '500px', lineHeight: '1.6', marginBottom: '24px' }}>{description}</p>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--m-primary)', background: 'var(--m-primary-light)', padding: '6px 16px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Integration Scheduled
        </span>
      </div>
    </>
  );
}
