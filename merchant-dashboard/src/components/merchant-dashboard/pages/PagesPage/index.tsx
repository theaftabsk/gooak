import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../../../../lib/api-client';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  banner_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  content: string | null;
  status: string;
}

export const PagesPage: React.FC = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editor modal/view state
  const [editingPage, setEditingPage] = useState<Partial<PageItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminPages();
      setPages(data || []);
      
      // Auto seed default pages if empty
      if (!data || data.length === 0) {
        const defaults = [
          { title: 'About Us', slug: 'about', content: 'Welcome to our store. We provide high-quality formulations.', status: 'published' },
          { title: 'Contact Us', slug: 'contact', content: 'Get in touch with us at contact@gooak.shop', status: 'published' },
          { title: 'Privacy Policy', slug: 'privacy', content: 'Your data safety is our highest priority.', status: 'published' },
          { title: 'Terms & Conditions', slug: 'terms', content: 'Standard terms of service apply to all users.', status: 'published' }
        ];
        for (const item of defaults) {
          await catalogApi.createAdminPage(item);
        }
        const updatedData = await catalogApi.getAdminPages();
        setPages(updatedData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load store pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleEdit = (page: PageItem) => {
    setEditingPage(page);
  };

  const handleCreateNew = () => {
    setEditingPage({
      title: '',
      slug: '',
      banner_image: '',
      seo_title: '',
      seo_description: '',
      content: '',
      status: 'draft'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page permanently?')) return;
    try {
      await catalogApi.deleteAdminPage(id);
      fetchPages();
    } catch (err: any) {
      alert(err.message || 'Failed to delete page.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage?.title) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      if (editingPage.id) {
        await catalogApi.updateAdminPage(editingPage.id, editingPage);
      } else {
        await catalogApi.createAdminPage(editingPage);
      }
      setSaveSuccess(true);
      fetchPages();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingPage(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Store Pages</h2>
          <p className="header-sub">Create and edit brand policy pages and custom content</p>
        </div>
        {!editingPage && (
          <button className="btn-primary" onClick={handleCreateNew}>
            + Add New Page
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingPage ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {editingPage.id ? 'Edit Page Details' : 'Create Custom Page'}
            </h3>
            <button className="btn-ghost-sm" onClick={() => setEditingPage(null)}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Page Title *</label>
                <input
                  required
                  value={editingPage.title || ''}
                  onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                  placeholder="e.g. Terms of Service"
                />
              </div>
              <div className="field-group">
                <label>Slug / Route Path</label>
                <input
                  value={editingPage.slug || ''}
                  onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                  placeholder="e.g. terms"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Banner Image URL</label>
                <input
                  value={editingPage.banner_image || ''}
                  onChange={e => setEditingPage({ ...editingPage, banner_image: e.target.value })}
                  placeholder="e.g. https://domain.com/banner.png"
                />
              </div>
              <div className="field-group">
                <label>Publishing Status</label>
                <select
                  value={editingPage.status || 'draft'}
                  onChange={e => setEditingPage({ ...editingPage, status: e.target.value })}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>Page Content Editor</label>
              <textarea
                value={editingPage.content || ''}
                onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                rows={8}
                placeholder="Write page content in HTML or plain text..."
              />
            </div>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--m-border)', marginTop: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--m-text-main)', marginBottom: '12px' }}>Search Engine Optimization (SEO) Settings</h4>
              <div className="form-grid">
                <div className="field-group">
                  <label>SEO Meta Title</label>
                  <input
                    value={editingPage.seo_title || ''}
                    onChange={e => setEditingPage({ ...editingPage, seo_title: e.target.value })}
                    placeholder="e.g. Natural Skincare Store | Terms of Service"
                  />
                </div>
                <div className="field-group">
                  <label>SEO Meta Description</label>
                  <textarea
                    value={editingPage.seo_description || ''}
                    onChange={e => setEditingPage({ ...editingPage, seo_description: e.target.value })}
                    rows={3}
                    placeholder="Short summary displayed on search engines..."
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving changes…' : saveSuccess ? '✓ Page Saved' : 'Save Page'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => setEditingPage(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading pages registry...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Page Name</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Slug Path</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>{page.title}</td>
                  <td style={{ padding: '14px 18px' }}><code>/{page.slug}</code></td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge ${page.status === 'published' ? 'badge-success' : 'badge-warn'}`} style={{
                      display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: page.status === 'published' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                      color: page.status === 'published' ? '#10B981' : '#D97706'
                    }}>
                      {page.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-ghost-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(page)}>
                      Edit Content
                    </button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(page.id)} disabled={['about', 'contact', 'privacy', 'terms'].includes(page.slug)}>
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
