import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../../../../lib/api-client';

interface TestimonialItem {
  id: string;
  customer_name: string;
  photo: string | null;
  rating: number;
  review: string;
  status: string;
  created_at: string;
}

export const TestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminTestimonials();
      setTestimonials(data || []);

      // Auto seed defaults if empty
      if (!data || data.length === 0) {
        const defaults = [
          {
            customer_name: 'Anjali Sharma',
            rating: 5,
            review: 'Absolutely love the organic facial wash! My acne breakouts reduced within just 2 weeks of standard daily use.',
            status: 'active',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'
          },
          {
            customer_name: 'Rahul Verma',
            rating: 4,
            review: 'Great products and prompt delivery. The packaging was eco-friendly and premium too.',
            status: 'active',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'
          }
        ];
        for (const item of defaults) {
          await catalogApi.createAdminTestimonial(item);
        }
        const updated = await catalogApi.getAdminTestimonials();
        setTestimonials(updated || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleEdit = (item: TestimonialItem) => {
    setEditingTestimonial(item);
  };

  const handleCreateNew = () => {
    setEditingTestimonial({
      customer_name: '',
      photo: '',
      rating: 5,
      review: '',
      status: 'active'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial permanently?')) return;
    try {
      await catalogApi.deleteAdminTestimonial(id);
      fetchTestimonials();
    } catch (err: any) {
      alert(err.message || 'Failed to delete testimonial.');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await catalogApi.uploadFile(file);
      if (res && res.url) {
        setEditingTestimonial(prev => ({ ...prev, photo: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial?.customer_name || !editingTestimonial?.review) {
      alert('Customer Name and Review are required fields.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      ...editingTestimonial,
      rating: editingTestimonial.rating !== undefined ? parseInt(String(editingTestimonial.rating)) : 5
    };

    try {
      if (editingTestimonial.id) {
        await catalogApi.updateAdminTestimonial(editingTestimonial.id, payload);
      } else {
        await catalogApi.createAdminTestimonial(payload);
      }
      setSaveSuccess(true);
      fetchTestimonials();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingTestimonial(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to render Star SVGs safely
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i <= rating ? '#F59E0B' : 'none'}
          stroke={i <= rating ? '#F59E0B' : '#CBD5E1'}
          strokeWidth="2.5"
          style={{ marginRight: '2px' }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    }
    return <div style={{ display: 'inline-flex', alignItems: 'center' }}>{stars}</div>;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Testimonials Registry</h2>
          <p className="header-sub">Moderate, edit, and feature customer recommendations on storefront layouts</p>
        </div>
        {!editingTestimonial && (
          <button className="btn-primary" onClick={handleCreateNew}>
            + Add Testimonial
          </button>
        )}
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingTestimonial ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {editingTestimonial.id ? 'Edit Testimonial Details' : 'Create Customer Testimonial'}
            </h3>
            <button className="btn-ghost-sm" onClick={() => setEditingTestimonial(null)}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Customer Name *</label>
                <input
                  required
                  value={editingTestimonial.customer_name || ''}
                  onChange={e => setEditingTestimonial({ ...editingTestimonial, customer_name: e.target.value })}
                  placeholder="e.g. Priyanjali Sen"
                />
              </div>
              <div className="field-group">
                <label>Customer Rating (Stars)</label>
                <select
                  value={editingTestimonial.rating || 5}
                  onChange={e => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) || 5 })}
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Customer Photo URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ flex: 1 }}
                    value={editingTestimonial.photo || ''}
                    onChange={e => setEditingTestimonial({ ...editingTestimonial, photo: e.target.value })}
                    placeholder="https://example.com/customer.png"
                  />
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button type="button" className="btn-ghost-sm" disabled={uploadingPhoto} style={{ height: '100%' }}>
                      {uploadingPhoto ? 'Uploading...' : 'Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
              <div className="field-group">
                <label>Moderation Status</label>
                <select
                  value={editingTestimonial.status || 'active'}
                  onChange={e => setEditingTestimonial({ ...editingTestimonial, status: e.target.value })}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>Review Body *</label>
              <textarea
                required
                value={editingTestimonial.review || ''}
                onChange={e => setEditingTestimonial({ ...editingTestimonial, review: e.target.value })}
                rows={6}
                placeholder="Write the customer review message here..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving testimonial…' : saveSuccess ? '✓ Testimonial Saved' : 'Save Testimonial'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => setEditingTestimonial(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading testimonials...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Review</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Rating</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.customer_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--m-border)' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--m-text-muted)', fontSize: '0.8rem' }}>
                        {item.customer_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: 600 }}>{item.customer_name}</span>
                  </td>
                  <td style={{ padding: '14px 18px', maxWidth: '350px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }} title={item.review}>
                      {item.review}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {renderStars(item.rating)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-warn'}`} style={{
                      display: 'inline-flex', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700,
                      background: item.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: item.status === 'active' ? '#10B981' : '#EF4444'
                    }}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-ghost-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button className="btn-danger-sm" onClick={() => handleDelete(item.id)}>
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
