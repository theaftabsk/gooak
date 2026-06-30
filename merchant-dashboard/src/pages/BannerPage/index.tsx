import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@/lib/api-client';

interface BannerItem {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  mobile_image: string | null;
  button_text: string | null;
  button_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export const BannerPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Create State
  const [editingBanner, setEditingBanner] = useState<Partial<BannerItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobileImage, setUploadingMobileImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminBanners();
      setBanners(data || []);

      // Auto seed defaults if empty
      if (!data || data.length === 0) {
        const defaults = [
          {
            type: 'hero',
            title: 'Welcome to Our Store',
            subtitle: 'Explore our latest collection of scientifically backed formulations.',
            image_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=80',
            button_text: 'Shop Now',
            button_url: '/products',
            sort_order: 1,
            is_active: true,
          },
          {
            type: 'offer',
            title: 'Summer Flash Sale',
            subtitle: 'Get 20% off on all products. Code: SUMMER20',
            image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
            button_text: 'View Deals',
            button_url: '/categories',
            sort_order: 2,
            is_active: true,
          }
        ];
        for (const item of defaults) {
          await catalogApi.createAdminBanner(item);
        }
        const updated = await catalogApi.getAdminBanners();
        setBanners(updated || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleEdit = (banner: BannerItem) => {
    setEditingBanner({
      ...banner,
      start_date: banner.start_date ? banner.start_date.substring(0, 16) : '',
      end_date: banner.end_date ? banner.end_date.substring(0, 16) : ''
    });
  };

  const handleCreateNew = () => {
    setEditingBanner({
      type: 'hero',
      title: '',
      subtitle: '',
      image_url: '',
      mobile_image: '',
      button_text: '',
      button_url: '',
      link_url: '',
      sort_order: 1,
      is_active: true,
      start_date: '',
      end_date: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner permanently?')) return;
    try {
      await catalogApi.deleteAdminBanner(id);
      fetchBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'mobile_image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'image_url') {
      setUploadingImage(true);
    } else {
      setUploadingMobileImage(true);
    }

    try {
      const res = await catalogApi.uploadFile(file);
      if (res && res.url) {
        setEditingBanner(prev => ({
          ...prev,
          [field]: res.url
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image.');
    } finally {
      if (field === 'image_url') {
        setUploadingImage(false);
      } else {
        setUploadingMobileImage(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.image_url) {
      alert('Desktop Image URL is required.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      ...editingBanner,
      // sync link_url with button_url for backwards compatibility
      link_url: editingBanner.button_url || editingBanner.link_url,
      start_date: editingBanner.start_date ? new Date(editingBanner.start_date).toISOString() : null,
      end_date: editingBanner.end_date ? new Date(editingBanner.end_date).toISOString() : null,
      sort_order: editingBanner.sort_order !== undefined ? parseInt(String(editingBanner.sort_order)) : 0
    };

    try {
      if (editingBanner.id) {
        await catalogApi.updateAdminBanner(editingBanner.id, payload);
      } else {
        await catalogApi.createAdminBanner(payload);
      }
      setSaveSuccess(true);
      fetchBanners();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingBanner(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Banners Management</h2>
          <p className="header-sub">Configure home sliders, popups, promotions, and announcements</p>
        </div>
        {!editingBanner && (
          <button className="btn-primary" onClick={handleCreateNew}>
            + Add New Banner
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingBanner ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {editingBanner.id ? 'Edit Banner Settings' : 'Create New Banner'}
            </h3>
            <button className="btn-ghost-sm" onClick={() => setEditingBanner(null)}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Banner Type</label>
                <select
                  value={editingBanner.type || 'hero'}
                  onChange={e => setEditingBanner({ ...editingBanner, type: e.target.value })}
                >
                  <option value="hero">Hero Slider (Homepage top)</option>
                  <option value="offer">Offer Banner (Promotional grid)</option>
                  <option value="category">Category Banner (Navigation helper)</option>
                  <option value="popup">Popup Banner (On-screen alert)</option>
                  <option value="announcement">Announcement Bar (Top notification)</option>
                </select>
              </div>
              <div className="field-group">
                <label>Priority (Sort Order)</label>
                <input
                  type="number"
                  required
                  value={editingBanner.sort_order !== undefined ? editingBanner.sort_order : 0}
                  onChange={e => setEditingBanner({ ...editingBanner, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="Lower numbers display first"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Title</label>
                <input
                  value={editingBanner.title || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="Banner heading text..."
                />
              </div>
              <div className="field-group">
                <label>Subtitle / Description</label>
                <input
                  value={editingBanner.subtitle || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="Subheading details..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Desktop Image URL *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    required
                    style={{ flex: 1 }}
                    value={editingBanner.image_url || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button type="button" className="btn-ghost-sm" disabled={uploadingImage} style={{ height: '100%' }}>
                      {uploadingImage ? 'Uploading...' : 'Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'image_url')}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              <div className="field-group">
                <label>Mobile Image URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1 }}
                    value={editingBanner.mobile_image || ''}
                    onChange={e => setEditingBanner({ ...editingBanner, mobile_image: e.target.value })}
                    placeholder="Optional mobile image override..."
                  />
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button type="button" className="btn-ghost-sm" disabled={uploadingMobileImage} style={{ height: '100%' }}>
                      {uploadingMobileImage ? 'Uploading...' : 'Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'mobile_image')}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Button / Action Text</label>
                <input
                  value={editingBanner.button_text || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, button_text: e.target.value })}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div className="field-group">
                <label>Button Action URL</label>
                <input
                  value={editingBanner.button_url || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, button_url: e.target.value })}
                  placeholder="e.g. /products/neem-wash"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Schedule Start Date</label>
                <input
                  type="datetime-local"
                  value={editingBanner.start_date || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label>Schedule End Date</label>
                <input
                  type="datetime-local"
                  value={editingBanner.end_date || ''}
                  onChange={e => setEditingBanner({ ...editingBanner, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Status</label>
                <select
                  value={editingBanner.is_active ? 'active' : 'inactive'}
                  onChange={e => setEditingBanner({ ...editingBanner, is_active: e.target.value === 'active' })}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
              <div className="field-group" />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving banner…' : saveSuccess ? '✓ Banner Saved' : 'Save Banner'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => setEditingBanner(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading banners...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Image</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Title / Type</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Priority</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(banner => (
                <tr key={banner.id} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', width: '100px' }}>
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'banner'}
                        style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--m-border)' }}
                      />
                    ) : (
                      <div style={{ width: '80px', height: '45px', background: '#E2E8F0', borderRadius: '4px' }} />
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{banner.title || '(No Title)'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', textTransform: 'uppercase' }}>Type: {banner.type}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <code>#{banner.sort_order}</code>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge ${banner.is_active ? 'badge-success' : 'badge-warn'}`} style={{
                      display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: banner.is_active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: banner.is_active ? '#10B981' : '#EF4444'
                    }}>
                      {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-ghost-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(banner)}>
                      Edit
                    </button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(banner.id)}>
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
