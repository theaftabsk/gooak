import React, { useState, useEffect } from 'react';
import { Icons } from '../../icons';

interface SettingsPageProps {
  shopInfo: any;
  onSaveSettings: (data: any) => Promise<void>;
  saving: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ shopInfo, onSaveSettings, saving }) => {
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [logoUrl, setLogoUrl]   = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  useEffect(() => {
    if (shopInfo) {
      setName(shopInfo.name || '');
      setDesc(shopInfo.description || '');
      setLogoUrl(shopInfo.logo_url || '');
      setCurrency(shopInfo.currency || 'INR');
      setTimezone(shopInfo.timezone || 'Asia/Kolkata');
    }
  }, [shopInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await onSaveSettings({
      name,
      description: desc || null,
      logo_url: logoUrl || null,
      currency,
      timezone,
    });
  };

  return (
    <>
      <header className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h2>Store Settings</h2>
          <p className="header-sub">Configure your store identity, brand metadata, and display preferences</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Main Settings Form */}
        <div className="card">
          <h3 className="card-title">Brand Identity &amp; Metadata</h3>
          <form onSubmit={handleSubmit} className="form-grid">

            <div className="field-group">
              <label>Store Display Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Nature Glow Herbals"
              />
            </div>

            <div className="field-group">
              <label>Store Description / Bio</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={4}
                placeholder="e.g. Clean beauty formulations crafted with organic herbs..."
              />
            </div>

            <div className="field-group">
              <label>Brand Logo URL</label>
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="e.g. https://domain.com/logo.png"
              />
            </div>

            <div className="form-row">
              <div className="field-group">
                <label>Currency Code</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹) — Indian Rupee</option>
                  <option value="BDT">BDT (৳) — Bangladeshi Taka</option>
                  <option value="USD">USD ($) — US Dollar</option>
                </select>
              </div>
              <div className="field-group">
                <label>Timezone Context</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6:00)</option>
                  <option value="UTC">UTC (GMT+0:00)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: 10 }}
              disabled={saving}
            >
              <Icons.ShieldCheck /> {saving ? 'Saving Settings…' : 'Save Configurations'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Sandbox Storefront Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Subdomain domain mapping:</span>
                <code style={{ fontSize: '0.8rem', color: 'var(--m-primary)' }}>{shopInfo?.slug}.localhost:3001</code>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Shop Registry ID:</span>
                <code style={{ fontSize: '0.75rem' }}>{shopInfo?.id}</code>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Plan Subscriptions status:</span>
                <span style={{ fontWeight: 600 }}>Active Starter Plan</span>
              </div>
            </div>
          </div>

          {logoUrl && (
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 className="card-title" style={{ textAlign: 'left' }}>Logo Preview</h3>
              <img
                src={logoUrl}
                alt="Brand logo"
                style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain', margin: '10px 0' }}
                onError={(e) => { (e.target as any).style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
