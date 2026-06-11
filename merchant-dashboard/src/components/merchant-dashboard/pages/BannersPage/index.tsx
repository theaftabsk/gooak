import React, { useState } from 'react';
import { Icons } from '../../icons';
import { LoadingSpinner, EmptyState } from '../../shared';

interface BannersPageProps {
  banners: any[];
  loading: boolean;
  onCreateBanner: (data: any) => Promise<void>;
  onDeleteBanner: (id: string) => Promise<void>;
  creating: boolean;
  deleting: boolean;
}

export const BannersPage: React.FC<BannersPageProps> = ({
  banners, loading, onCreateBanner, onDeleteBanner, creating, deleting
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    await onCreateBanner({
      title: title || null,
      image_url: imageUrl,
      link_url: linkUrl || null,
      sort_order: parseInt(sortOrder) || 0,
      is_active: true
    });

    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setSortOrder('0');
    setShowAddForm(false);
  };

  const handleDelete = async (b: any) => {
    if (confirm(`Delete this banner? it will immediately stop displaying on your storefront.`)) {
      await onDeleteBanner(b.id);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Homepage Banners</h2>
          <p className="header-sub">Manage slider promotions and banner cards</p>
        </div>
        {!showAddForm && (
          <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <Icons.Plus /> Add Banner
          </button>
        )}
      </header>

      {showAddForm && (
        <div className="card" style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Add Store Banner</h3>
            <button className="btn-ghost-sm" onClick={() => setShowAddForm(false)}><Icons.X /> Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Banner Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summer Essentials Campaign" />
              </div>
              <div className="field-group">
                <label>Sort Order</label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="field-group" style={{ flex: 2 }}>
                <label>Banner Image URL *</label>
                <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="e.g. https://images.unsplash.com/photo-..." />
              </div>
              <div className="field-group">
                <label>Destination Link URL</label>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="e.g. /products/lavender-face-wash" />
              </div>
            </div>
            {imageUrl && (
              <div className="field-group">
                <label>Preview Image</label>
                <img
                  src={imageUrl}
                  alt="Banner preview"
                  onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&w=400&q=80'; }}
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--m-border)' }}
                />
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={creating}>
              {creating ? 'Publishing…' : 'Publish Banner'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Active Banners</h3>
        {loading ? <LoadingSpinner message="Fetching banners..." /> : banners.length === 0 ? (
          <EmptyState message="No promo banners uploaded yet. Add one to make your storefront homepage visually engaging." />
        ) : (
          <div className="db-table-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Preview</th>
                  <th>Campaign Title</th>
                  <th>Link Route</th>
                  <th>Order</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id}>
                    <td>
                      <img
                        src={b.image_url}
                        alt="banner"
                        style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--m-border)' }}
                      />
                    </td>
                    <td><strong>{b.title || 'Untitled Banner Campaign'}</strong></td>
                    <td><code>{b.link_url || '—'}</code></td>
                    <td>{b.sort_order}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-danger-sm" onClick={() => handleDelete(b)} disabled={deleting}>
                        <Icons.Trash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

