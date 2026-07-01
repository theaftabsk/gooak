'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { merchantApi } from '@/lib/api-client';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
}

const SYSTEM_SLUGS = ['home', 'about', 'contact', 'privacy', 'terms', 'refund', 'index'];

export const PagesPage: React.FC = () => {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await merchantApi.getPages();
      setPages(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  const handleDelete = async (id: string, slug: string) => {
    if (SYSTEM_SLUGS.includes(slug)) return;
    if (!confirm('Delete this page permanently?')) return;
    try {
      await merchantApi.deletePage(id);
      loadPages();
    } catch (e: any) {
      alert(e.message || 'Failed to delete page.');
    }
  };

  const handleCreate = async () => {
    const title = prompt('Page title?');
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const newPage = await merchantApi.createPage({ title, slug, status: 'draft', sections: [] });
      await loadPages();
      router.push(`/customize?page=${newPage.slug}`);
    } catch (e: any) {
      alert(e.message || 'Failed to create page.');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Store Pages</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.85rem' }}>Create and manage content pages</p>
        </div>
        <button onClick={handleCreate}
          style={{ padding: '9px 18px', borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
          + New Page
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--m-border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '13px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Title</th>
                <th style={{ padding: '13px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>URL</th>
                <th style={{ padding: '13px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Status</th>
                <th style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '13px 18px', fontWeight: 600, fontSize: '0.9rem' }}>{p.title}</td>
                  <td style={{ padding: '13px 18px', color: '#6B7280', fontSize: '0.85rem' }}>
                    <code>/{p.slug === 'home' || p.slug === 'index' ? '' : p.slug}</code>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
                      background: p.status === 'published' ? 'rgba(16,185,129,0.1)' : 'rgba(217,119,6,0.1)',
                      color: p.status === 'published' ? '#059669' : '#D97706' }}>
                      {p.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => router.push(`/customize?page=${p.slug}`)}
                      style={{ padding: '6px 14px', borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id, p.slug)} disabled={SYSTEM_SLUGS.includes(p.slug)}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'none', color: '#EF4444', border: '1px solid #EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', opacity: SYSTEM_SLUGS.includes(p.slug) ? 0.3 : 1 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
