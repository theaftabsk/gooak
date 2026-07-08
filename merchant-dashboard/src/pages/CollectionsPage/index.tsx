'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { merchantApi } from '@/lib/api-client';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  _count?: { products: number };
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCollections(await merchantApi.getCollections()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: '', slug: '', description: '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setCreating(true);
    setFormError('');
    try {
      const created = await merchantApi.createCollection({
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name.trim()),
        description: form.description.trim() || null,
      });
      setModalOpen(false);
      router.push(`/collections/${created.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    await merchantApi.updateCollection(col.id, { is_active: !col.is_active });
    setCollections(cs => cs.map(c => c.id === col.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${col.name}"?`)) return;
    setDeleteId(col.id);
    try {
      await merchantApi.deleteCollection(col.id);
      setCollections(cs => cs.filter(c => c.id !== col.id));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Collections</h2>
          <p className="header-sub">{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create collection
        </button>
      </header>

      {loading ? (
        <div className="cl-loading">Loading…</div>
      ) : collections.length === 0 ? (
        <div className="cl-empty">
          <div className="cl-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2"><path d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
          </div>
          <p className="cl-empty-title">No collections yet</p>
          <p className="cl-empty-sub">Group your products into collections to feature them on your storefront.</p>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={openCreate}>Create collection</button>
        </div>
      ) : (
        <div className="cl-table-wrap">
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Title</th>
                <th>Products</th>
                <th>Slug</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {collections.map(col => (
                <tr key={col.id} className="cl-row" onClick={() => router.push(`/collections/${col.id}`)}>
                  <td>
                    <div className="cl-thumb">
                      {col.image_url
                        ? <img src={col.image_url} alt={col.name} />
                        : <div className="cl-thumb-ph"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="cl-row-name">{col.name}</div>
                    {col.description && <div className="cl-row-desc">{col.description}</div>}
                  </td>
                  <td className="cl-row-count">{col._count?.products ?? 0}</td>
                  <td><code className="cl-slug">/{col.slug}</code></td>
                  <td>
                    <button
                      className={`cl-badge ${col.is_active ? 'cl-badge--on' : 'cl-badge--off'}`}
                      onClick={e => toggleActive(col, e)}
                    >
                      <span className="cl-badge-dot" />{col.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="cl-row-actions">
                      <button
                        className="cl-edit-btn"
                        onClick={e => { e.stopPropagation(); router.push(`/collections/${col.id}`); }}
                        title="Edit"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                      <button
                        className="cl-del-btn"
                        disabled={deleteId === col.id}
                        onClick={e => handleDelete(col, e)}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="cl-overlay" onClick={() => setModalOpen(false)}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-hd">
              <h3>Create collection</h3>
              <button className="cl-modal-close" onClick={() => setModalOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="cl-modal-body">
              <div className="cl-field">
                <label>Title <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="e.g. Summer Sale"
                  autoFocus
                />
              </div>
              <div className="cl-field">
                <label>Slug</label>
                <div className="cl-slug-row">
                  <span>/collections/</span>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="summer-sale"
                  />
                </div>
              </div>
              <div className="cl-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional short description"
                />
              </div>
              {formError && <p className="cl-form-error">{formError}</p>}
              <div className="cl-modal-ft">
                <button type="button" className="btn-ghost-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create & edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .cl-loading { padding: 48px; text-align: center; color: #9CA3AF; font-size: 0.85rem; }
        .cl-empty { text-align: center; padding: 80px 20px; }
        .cl-empty-icon { display: flex; justify-content: center; margin-bottom: 14px; }
        .cl-empty-title { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0 0 5px; }
        .cl-empty-sub { font-size: 0.8rem; color: #6B7280; margin: 0; }

        .cl-table-wrap { border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
        .cl-table { width: 100%; border-collapse: collapse; }
        .cl-table thead { background: #F9FAFB; }
        .cl-table th {
          padding: 9px 14px; text-align: left;
          font-size: 0.68rem; font-weight: 700; color: #6B7280;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid #E5E7EB;
        }
        .cl-table td { padding: 11px 14px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
        .cl-row { cursor: pointer; transition: background 0.1s; }
        .cl-row:hover td { background: #F9FAFB; }
        .cl-row:last-child td { border-bottom: none; }

        .cl-thumb { width: 36px; height: 36px; border-radius: 6px; overflow: hidden; border: 1px solid #E5E7EB; }
        .cl-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cl-thumb-ph { width: 100%; height: 100%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; }

        .cl-row-name { font-size: 0.84rem; font-weight: 600; color: #111827; }
        .cl-row-desc { font-size: 0.73rem; color: #9CA3AF; margin-top: 1px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-row-count { font-size: 0.78rem; color: #6B7280; text-align: center; }
        .cl-slug { font-size: 0.72rem; background: #F3F4F6; padding: 2px 6px; border-radius: 4px; color: #6B7280; font-family: monospace; }

        .cl-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 20px; border: none; cursor: pointer;
          font-size: 0.7rem; font-weight: 700; white-space: nowrap;
        }
        .cl-badge--on { background: #D1FAE5; color: #065F46; }
        .cl-badge--off { background: #F3F4F6; color: #6B7280; }
        .cl-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .cl-row-actions { display: flex; align-items: center; gap: 6px; }
        .cl-edit-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border: 1px solid #E5E7EB; border-radius: 6px;
          background: #fff; color: #374151; font-size: 0.73rem; font-weight: 600;
          cursor: pointer; transition: background 0.1s, border-color 0.1s; white-space: nowrap;
        }
        .cl-edit-btn:hover { background: #F3F4F6; border-color: #D1D5DB; }
        .cl-del-btn {
          background: none; border: none; padding: 6px; color: #9CA3AF;
          cursor: pointer; border-radius: 6px; display: flex; align-items: center;
        }
        .cl-del-btn:hover { color: #EF4444; background: #FEF2F2; }
        .cl-del-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Modal */
        .cl-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(2px);
        }
        .cl-modal {
          background: #fff; border-radius: 12px; width: 100%; max-width: 460px;
          margin: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .cl-modal-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #E5E7EB;
        }
        .cl-modal-hd h3 { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0; }
        .cl-modal-close {
          background: none; border: none; cursor: pointer; color: #9CA3AF;
          border-radius: 6px; padding: 4px; display: flex; align-items: center;
        }
        .cl-modal-close:hover { background: #F3F4F6; color: #374151; }
        .cl-modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .cl-modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

        .cl-field { display: flex; flex-direction: column; gap: 5px; }
        .cl-field label { font-size: 0.72rem; font-weight: 600; color: #374151; }
        .cl-field input, .cl-field textarea {
          padding: 8px 10px; border: 1.5px solid #E5E7EB; border-radius: 7px;
          font-size: 0.83rem; color: #111827; font-family: inherit; outline: none; resize: vertical;
        }
        .cl-field input:focus, .cl-field textarea:focus { border-color: #6366F1; }
        .cl-slug-row {
          display: flex; align-items: center; border: 1.5px solid #E5E7EB;
          border-radius: 7px; overflow: hidden;
        }
        .cl-slug-row:focus-within { border-color: #6366F1; }
        .cl-slug-row span {
          padding: 8px 8px 8px 10px; font-size: 0.75rem; color: #9CA3AF;
          background: #F9FAFB; border-right: 1px solid #E5E7EB; white-space: nowrap;
        }
        .cl-slug-row input { border: none !important; border-radius: 0 !important; flex: 1; padding: 8px 10px; }
        .cl-form-error { font-size: 0.73rem; color: #DC2626; font-weight: 500; margin: 0; }
      `}</style>
    </>
  );
}
