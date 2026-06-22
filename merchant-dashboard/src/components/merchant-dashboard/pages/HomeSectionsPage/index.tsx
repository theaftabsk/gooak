import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../../../../lib/api-client';

interface HomeSectionItem {
  id?: string;
  section_key: string;
  enabled: boolean;
  sort_order: number;
  settings_json: Record<string, any>;
}

// 11 Fixed sections definition
const FIXED_SECTIONS = [
  { key: 'hero_banner', name: 'Hero Banner', defaultOrder: 1, defaultSettings: { title: 'Welcome to Our Store', subtitle: 'Premium scientific organic formulations', layout: 'full_width' } },
  { key: 'featured_categories', name: 'Featured Categories', defaultOrder: 2, defaultSettings: { limit: 4, layout_style: 'carousel' } },
  { key: 'featured_products', name: 'Featured Products', defaultOrder: 3, defaultSettings: { title: 'Featured Products', limit: 8 } },
  { key: 'best_sellers', name: 'Best Sellers', defaultOrder: 4, defaultSettings: { title: 'Best Sellers', limit: 4 } },
  { key: 'new_arrivals', name: 'New Arrivals', defaultOrder: 5, defaultSettings: { title: 'New Arrivals', limit: 4 } },
  { key: 'flash_sale', name: 'Flash Sale', defaultOrder: 6, defaultSettings: { title: 'Flash Sale', discount_tag: '20% OFF', ends_at: '' } },
  { key: 'deal_of_the_day', name: 'Deal Of The Day', defaultOrder: 7, defaultSettings: { title: 'Deal Of The Day', deal_product_id: '', banner_image: '' } },
  { key: 'brand_showcase', name: 'Brand Showcase', defaultOrder: 8, defaultSettings: { title: 'Official Brands', style: 'logos_slider' } },
  { key: 'testimonials', name: 'Testimonials', defaultOrder: 9, defaultSettings: { title: 'What Our Customers Say', limit: 3 } },
  { key: 'newsletter', name: 'Newsletter', defaultOrder: 10, defaultSettings: { title: 'Subscribe to our newsletter', subtitle: 'Get 10% off your next purchase', button_text: 'Subscribe' } },
  { key: 'footer', name: 'Footer', defaultOrder: 11, defaultSettings: { copyright_text: '© 2026 Oak Solutions. All rights reserved.', support_email: 'support@oaksol.in', support_phone: '1234567890' } }
];

export const HomeSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<HomeSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customize states
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<HomeSectionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.getAdminHomeSections();
      
      // Map database items and fill missing ones with defaults
      const mergedList = FIXED_SECTIONS.map(fixed => {
        const dbItem = data?.find(x => x.section_key === fixed.key);
        return {
          id: dbItem?.id,
          section_key: fixed.key,
          enabled: dbItem ? dbItem.enabled : true,
          sort_order: dbItem ? dbItem.sort_order : fixed.defaultOrder,
          settings_json: dbItem ? dbItem.settings_json : { ...fixed.defaultSettings }
        };
      });

      // Sort by sort_order
      mergedList.sort((a, b) => a.sort_order - b.sort_order);
      setSections(mergedList);
    } catch (err: any) {
      setError(err.message || 'Failed to load home sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleToggleEnable = async (key: string, currentVal: boolean) => {
    const item = sections.find(x => x.section_key === key);
    if (!item) return;

    const payload = {
      section_key: key,
      enabled: !currentVal,
      sort_order: item.sort_order,
      settings_json: item.settings_json
    };

    try {
      await catalogApi.updateAdminHomeSection(payload);
      fetchSections();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle section status.');
    }
  };

  const handleSortOrderChange = async (key: string, newOrder: number) => {
    const item = sections.find(x => x.section_key === key);
    if (!item) return;

    const payload = {
      section_key: key,
      enabled: item.enabled,
      sort_order: newOrder,
      settings_json: item.settings_json
    };

    try {
      await catalogApi.updateAdminHomeSection(payload);
      fetchSections();
    } catch (err: any) {
      alert(err.message || 'Failed to update section priority.');
    }
  };

  const handleCustomize = (key: string) => {
    const item = sections.find(x => x.section_key === key);
    if (!item) return;
    setEditingSectionKey(key);
    setEditFormData(JSON.parse(JSON.stringify(item))); // deep copy
  };

  const handleSettingsFieldChange = (field: string, val: any) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      settings_json: {
        ...editFormData.settings_json,
        [field]: val
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await catalogApi.uploadFile(file);
      if (res && res.url) {
        handleSettingsFieldChange('banner_image', res.url);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      await catalogApi.updateAdminHomeSection({
        section_key: editFormData.section_key,
        enabled: editFormData.enabled,
        sort_order: parseInt(String(editFormData.sort_order)) || 0,
        settings_json: editFormData.settings_json
      });
      setSaveSuccess(true);
      fetchSections();
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingSectionKey(null);
        setEditFormData(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save section settings.');
    } finally {
      setSaving(false);
    }
  };

  const getSectionName = (key: string) => {
    return FIXED_SECTIONS.find(x => x.key === key)?.name || key;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <h2>Home Layout Customizer</h2>
          <p className="header-sub">Manage sections, change display orders, and configure section layouts</p>
        </div>
      </header>

      {error && (
        <div style={{ padding: '12px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {editingSectionKey && editFormData ? (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--m-border)', paddingBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Customize: {getSectionName(editingSectionKey)}
            </h3>
            <button className="btn-ghost-sm" onClick={() => { setEditingSectionKey(null); setEditFormData(null); }}>
              Back to List
            </button>
          </div>

          <form onSubmit={handleSave} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Section Display Order</label>
                <input
                  type="number"
                  required
                  value={editFormData.sort_order}
                  onChange={e => setEditFormData({ ...editFormData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="field-group">
                <label>Display Status</label>
                <select
                  value={editFormData.enabled ? 'enabled' : 'disabled'}
                  onChange={e => setEditFormData({ ...editFormData, enabled: e.target.value === 'enabled' })}
                >
                  <option value="enabled">Enabled (Visible)</option>
                  <option value="disabled">Disabled (Hidden)</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '8px', border: '1px solid var(--m-border)', margin: '10px 0' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--m-text-muted)' }}>
                Settings Parameters
              </h4>

              {editingSectionKey === 'hero_banner' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Main Title Heading</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Subheading Text</label>
                    <input
                      value={editFormData.settings_json.subtitle || ''}
                      onChange={e => handleSettingsFieldChange('subtitle', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Layout Style</label>
                    <select
                      value={editFormData.settings_json.layout || 'full_width'}
                      onChange={e => handleSettingsFieldChange('layout', e.target.value)}
                    >
                      <option value="full_width">Full Screen Width Slider</option>
                      <option value="boxed">Boxed Container Slider</option>
                    </select>
                  </div>
                </div>
              )}

              {editingSectionKey === 'featured_categories' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Display Limit (Categories)</label>
                    <input
                      type="number"
                      value={editFormData.settings_json.limit || 4}
                      onChange={e => handleSettingsFieldChange('limit', parseInt(e.target.value) || 4)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Layout Style</label>
                    <select
                      value={editFormData.settings_json.layout_style || 'carousel'}
                      onChange={e => handleSettingsFieldChange('layout_style', e.target.value)}
                    >
                      <option value="grid">Static Grid</option>
                      <option value="carousel">Horizontal Scroll Carousel</option>
                    </select>
                  </div>
                </div>
              )}

              {['featured_products', 'best_sellers', 'new_arrivals'].includes(editingSectionKey) && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Section Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Product Card Limit</label>
                    <input
                      type="number"
                      value={editFormData.settings_json.limit || 4}
                      onChange={e => handleSettingsFieldChange('limit', parseInt(e.target.value) || 4)}
                    />
                  </div>
                </div>
              )}

              {editingSectionKey === 'flash_sale' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Promotion Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Discount Info Tag</label>
                    <input
                      value={editFormData.settings_json.discount_tag || ''}
                      onChange={e => handleSettingsFieldChange('discount_tag', e.target.value)}
                      placeholder="e.g. UP TO 50% OFF"
                    />
                  </div>
                  <div className="field-group">
                    <label>Countdown Target Ends Date/Time</label>
                    <input
                      type="datetime-local"
                      value={editFormData.settings_json.ends_at ? editFormData.settings_json.ends_at.substring(0, 16) : ''}
                      onChange={e => handleSettingsFieldChange('ends_at', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {editingSectionKey === 'deal_of_the_day' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Section Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Featured Product Target ID</label>
                    <input
                      value={editFormData.settings_json.deal_product_id || ''}
                      onChange={e => handleSettingsFieldChange('deal_product_id', e.target.value)}
                      placeholder="Paste product ID or slug..."
                    />
                  </div>
                  <div className="field-group">
                    <label>Deal Background Image URL</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        style={{ flex: 1 }}
                        value={editFormData.settings_json.banner_image || ''}
                        onChange={e => handleSettingsFieldChange('banner_image', e.target.value)}
                        placeholder="https://example.com/deal-bg.jpg"
                      />
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button type="button" className="btn-ghost-sm" disabled={uploadingImage} style={{ height: '100%' }}>
                          {uploadingImage ? 'Uploading...' : 'Upload'}
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingSectionKey === 'brand_showcase' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Section Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Showcase Layout Mode</label>
                    <select
                      value={editFormData.settings_json.style || 'logos_slider'}
                      onChange={e => handleSettingsFieldChange('style', e.target.value)}
                    >
                      <option value="logos_slider">Infinite Scrolling Slider</option>
                      <option value="grid">Static Flex Grid</option>
                    </select>
                  </div>
                </div>
              )}

              {editingSectionKey === 'testimonials' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Section Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Max Testimonials Count Limit</label>
                    <input
                      type="number"
                      value={editFormData.settings_json.limit || 3}
                      onChange={e => handleSettingsFieldChange('limit', parseInt(e.target.value) || 3)}
                    />
                  </div>
                </div>
              )}

              {editingSectionKey === 'newsletter' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Heading Title</label>
                    <input
                      value={editFormData.settings_json.title || ''}
                      onChange={e => handleSettingsFieldChange('title', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Subheading Text</label>
                    <input
                      value={editFormData.settings_json.subtitle || ''}
                      onChange={e => handleSettingsFieldChange('subtitle', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Button Submit Text</label>
                    <input
                      value={editFormData.settings_json.button_text || ''}
                      onChange={e => handleSettingsFieldChange('button_text', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {editingSectionKey === 'footer' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label>Copyright Brand Label</label>
                    <input
                      value={editFormData.settings_json.copyright_text || ''}
                      onChange={e => handleSettingsFieldChange('copyright_text', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Support Contact Email</label>
                    <input
                      value={editFormData.settings_json.support_email || ''}
                      onChange={e => handleSettingsFieldChange('support_email', e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label>Support Contact Phone</label>
                    <input
                      value={editFormData.settings_json.support_phone || ''}
                      onChange={e => handleSettingsFieldChange('support_phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving layout…' : saveSuccess ? '✓ Layout Saved' : 'Save Section settings'}
              </button>
              <button type="button" className="btn-ghost-sm" onClick={() => { setEditingSectionKey(null); setEditFormData(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>Loading layout configuration...</div>
      ) : (
        <div className="card" style={{ background: '#FFFFFF', border: '1px solid var(--m-border)', borderRadius: '12px', padding: '0', overflow: 'hidden' }}>
          <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Section Name</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Display Priority</th>
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <tr key={section.section_key} style={{ borderBottom: '1px solid var(--m-border)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                    {getSectionName(section.section_key)}
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--m-text-muted)', fontWeight: 400 }}>
                      Key: <code>{section.section_key}</code>
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        value={section.sort_order}
                        onChange={e => handleSortOrderChange(section.section_key, parseInt(e.target.value) || 0)}
                        style={{ width: '60px', padding: '4px 6px', border: '1px solid var(--m-border)', borderRadius: '4px', textAlign: 'center' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleEnable(section.section_key, section.enabled)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: section.enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                        color: section.enabled ? '#10B981' : '#64748B'
                      }}
                    >
                      {section.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleCustomize(section.section_key)}>
                      Configure
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
