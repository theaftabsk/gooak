'use client';
import React, { useEffect, useState } from 'react';
import { merchantApi } from '@/lib/api-client';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '', is_active: true });
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await merchantApi.getCollections();
      setCollections(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', image_url: '', is_active: true });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (col: Collection) => {
    setEditing(col);
    setForm({ name: col.name, slug: col.slug, description: col.description || '', image_url: col.image_url || '', is_active: col.is_active });
    setFormError('');
    setModalOpen(true);
  };

  const handleNameChange = (v: string) => {
    setForm(f => ({ ...f, name: v, ...(!editing && { slug: slugify(v) }) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await merchantApi.updateCollection(editing.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          image_url: form.image_url.trim() || null,
          is_active: form.is_active,
        });
      } else {
        await merchantApi.createCollection({
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name.trim()),
          description: form.description.trim() || null,
          image_url: form.image_url.trim() || null,
        });
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await merchantApi.deleteCollection(id);
      setCollections(c => c.filter(x => x.id !== id));
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (col: Collection) => {
    await merchantApi.updateCollection(col.id, { is_active: !col.is_active });
    setCollections(c => c.map(x => x.id === col.id ? { ...x, is_active: !x.is_active } : x));
  };

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <div>
          <h2>Collections</h2>
          <p className="header-sub">Curated product groups shown on your storefront (e.g. Best Sellers, New Arrivals)</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Collection
        </button>
      </header>

      {/* Info banner — categories vs collections */}
      <div className="cp-info-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span><strong>Categories vs Collections:</strong> Categories are the taxonomy tree your products live in (e.g. Skincare → Serums). Collections are curated marketing groups that can span categories — think Shopify's collections or Amazon's "Trending" lists. Both work together.</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="cp-loading">Loading collections…</div>
      ) : collections.length === 0 ? (
        <div className="cp-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <p>No collections yet. Create one to start curating products.</p>
          <button className="btn-primary" onClick={openCreate}>Create Collection</button>
        </div>
      ) : (
        <div className="cp-table-wrapper">
          <table className="cp-table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map(col => (
                <tr key={col.id}>
                  <td>
                    <div className="cp-col-name">{col.name}</div>
                    {col.description && <div className="cp-col-desc">{col.description}</div>}
                  </td>
                  <td><code className="cp-slug">/{col.slug}</code></td>
                  <td>
                    <button
                      className={`cp-toggle ${col.is_active ? 'cp-toggle--on' : 'cp-toggle--off'}`}
                      onClick={() => toggleActive(col)}
                      title={col.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {col.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="cp-date">{new Date(col.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="cp-actions">
                      <button className="cp-action-btn cp-action-btn--edit" onClick={() => openEdit(col)}>Edit</button>
                      <button
                        className="cp-action-btn cp-action-btn--del"
                        onClick={() => { if (confirm(`Delete "${col.name}"? Products won't be deleted but will lose this collection tag.`)) handleDelete(col.id); }}
                        disabled={deleteId === col.id}
                      >
                        {deleteId === col.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="cp-overlay" onClick={() => setModalOpen(false)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h2>{editing ? 'Edit Collection' : 'New Collection'}</h2>
              <button className="cp-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="cp-modal-body">
              <div className="cp-field">
                <label>Name <span className="cp-req">*</span></label>
                <input
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Best Sellers"
                  autoFocus
                />
              </div>
              {!editing && (
                <div className="cp-field">
                  <label>Slug</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="best-sellers"
                  />
                  <span className="cp-hint">Used in the storefront URL: /collections/<strong>{form.slug || 'slug'}</strong></span>
                </div>
              )}
              <div className="cp-field">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="A short description shown on the collection page"
                />
              </div>
              <div className="cp-field">
                <label>Image URL</label>
                <input
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              {editing && (
                <div className="cp-field cp-field--row">
                  <label>Active</label>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                </div>
              )}
              {formError && <p className="cp-form-error">{formError}</p>}
              <div className="cp-modal-footer">
                <button type="button" className="btn-ghost-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`

        .cp-info-banner {
          display: flex; align-items: flex-start; gap: 10px;
          background: #EFF6FF; border: 1px solid #BFDBFE;
          padding: 10px 14px; border-radius: 8px;
          font-size: 0.78rem; color: #1E40AF; line-height: 1.5;
          margin-bottom: 20px;
        }
        .cp-info-banner svg { flex-shrink: 0; margin-top: 1px; }
        .cp-info-banner strong { font-weight: 700; }

        .cp-loading { padding: 40px; text-align: center; color: #9CA3AF; font-size: 0.85rem; }
        .cp-empty {
          text-align: center; padding: 60px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: #6B7280; font-size: 0.85rem;
          border: 2px dashed #E5E7EB; border-radius: 12px;
        }

        .cp-table-wrapper { border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
        .cp-table { width: 100%; border-collapse: collapse; }
        .cp-table thead { background: #F9FAFB; }
        .cp-table th {
          padding: 9px 14px; text-align: left;
          font-size: 0.68rem; font-weight: 700; color: #6B7280;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid #E5E7EB;
        }
        .cp-table td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
        .cp-table tr:last-child td { border-bottom: none; }
        .cp-table tr:hover td { background: #FAFAFA; }

        .cp-col-name { font-size: 0.84rem; font-weight: 600; color: #111827; }
        .cp-col-desc { font-size: 0.74rem; color: #9CA3AF; margin-top: 2px; }
        .cp-slug { font-size: 0.74rem; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; color: #374151; }
        .cp-date { font-size: 0.75rem; color: #9CA3AF; }

        .cp-toggle {
          display: inline-block; padding: 3px 9px; border-radius: 20px;
          font-size: 0.7rem; font-weight: 700; border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .cp-toggle--on { background: #D1FAE5; color: #065F46; }
        .cp-toggle--off { background: #F3F4F6; color: #6B7280; }

        .cp-actions { display: flex; gap: 6px; }
        .cp-action-btn {
          padding: 4px 10px; border-radius: 6px; font-size: 0.72rem;
          font-weight: 600; border: 1px solid; cursor: pointer; transition: opacity 0.15s;
        }
        .cp-action-btn--edit { border-color: #D1D5DB; color: #374151; background: #fff; }
        .cp-action-btn--edit:hover { background: #F9FAFB; }
        .cp-action-btn--del { border-color: #FCA5A5; color: #DC2626; background: #FEF2F2; }
        .cp-action-btn--del:hover { background: #FEE2E2; }
        .cp-action-btn--del:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Modal */
        .cp-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(2px);
        }
        .cp-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 480px;
          margin: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .cp-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #E5E7EB;
        }
        .cp-modal-header h2 { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0; }
        .cp-modal-close { background: none; border: none; font-size: 1.2rem; color: #9CA3AF; cursor: pointer; line-height: 1; }
        .cp-modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }

        .cp-field { display: flex; flex-direction: column; gap: 5px; }
        .cp-field label { font-size: 0.72rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
        .cp-field input, .cp-field textarea {
          padding: 8px 10px; border: 1.5px solid #E5E7EB; border-radius: 7px;
          font-size: 0.83rem; color: #111827; outline: none;
          font-family: inherit; resize: vertical;
        }
        .cp-field input:focus, .cp-field textarea:focus { border-color: #6366F1; }
        .cp-field--row { flex-direction: row; align-items: center; gap: 10px; }
        .cp-field--row input[type=checkbox] { width: 16px; height: 16px; cursor: pointer; accent-color: #6366F1; }
        .cp-req { color: #EF4444; }
        .cp-hint { font-size: 0.7rem; color: #9CA3AF; }
        .cp-form-error { font-size: 0.76rem; color: #DC2626; font-weight: 500; margin: 0; }
        .cp-modal-footer {
          display: flex; justify-content: flex-end; gap: 8px;
          padding: 14px 20px; border-top: 1px solid #F3F4F6;
        }
      `}</style>
    </div>
  );
}
