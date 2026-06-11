import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../icons';
import { paymentApi } from '@oaksol/api-client';

interface SettingsPageProps {
  shopInfo: any;
  onSaveSettings: (data: any) => Promise<void>;
  saving: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ shopInfo, onSaveSettings, saving }) => {
  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'payments'>('identity');

  // Brand Identity states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Payment Gateways states
  const [gateways, setGateways] = useState<any[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);

  // Gateway config form states (Razorpay)
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [savingGateway, setSavingGateway] = useState(false);

  useEffect(() => {
    if (shopInfo) {
      setName(shopInfo.name || '');
      setDesc(shopInfo.description || '');
      setLogoUrl(shopInfo.logo_url || '');
      setCurrency(shopInfo.currency || 'INR');
      setTimezone(shopInfo.timezone || 'Asia/Kolkata');
    }
  }, [shopInfo]);

  const loadGateways = useCallback(async () => {
    try {
      setLoadingGateways(true);
      const data = await paymentApi.getAdminPaymentGateways();
      setGateways(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load payment gateways:', err);
    } finally {
      setLoadingGateways(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === 'payments') {
      loadGateways();
    }
  }, [activeSubTab, loadGateways]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await onSaveSettings({
      name,
      description: desc || null,
      logo_url: logoUrl || null,
      currency,
      timezone
    });
  };

  const handleToggleGateway = async (gatewayId: string, currentStatus: boolean) => {
    try {
      await paymentApi.updateAdminPaymentGateway(gatewayId, {
        is_active: !currentStatus
      });
      // Refresh list
      const updated = gateways.map(g => g.id === gatewayId ? { ...g, is_active: !currentStatus } : g);
      setGateways(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update gateway status');
    }
  };

  const startEditGateway = (gateway: any) => {
    setEditingGatewayId(gateway.id);
    if (gateway.slug === 'razorpay') {
      const config = gateway.config || {};
      setRzpKeyId(config.key_id || '');
      setRzpKeySecret(config.key_secret || '');
    }
  };

  const handleSaveGatewayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGatewayId) return;

    setSavingGateway(true);
    try {
      const gateway = gateways.find(g => g.id === editingGatewayId);
      if (gateway?.slug === 'razorpay') {
        await paymentApi.updateAdminPaymentGateway(editingGatewayId, {
          config: {
            key_id: rzpKeyId,
            key_secret: rzpKeySecret
          }
        });
      }
      setEditingGatewayId(null);
      await loadGateways();
      alert('Gateway configuration saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update gateway configuration');
    } finally {
      setSavingGateway(false);
    }
  };

  return (
    <>
      <header className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2>Store Settings</h2>
          <p className="header-sub">Configure metadata settings, customization options, and payment gateway configs</p>
        </div>
      </header>

      {/* Settings Subnavigation tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--m-border)', marginBottom: 28 }}>
        <button
          onClick={() => { setActiveSubTab('identity'); setEditingGatewayId(null); }}
          style={{
            padding: '12px 20px', background: 'none', border: 'none',
            borderBottom: activeSubTab === 'identity' ? '3px solid var(--m-primary)' : '3px solid transparent',
            color: activeSubTab === 'identity' ? 'var(--m-primary)' : 'var(--m-text-muted)',
            fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          🏷️ Brand Identity & Metadata
        </button>
        <button
          onClick={() => { setActiveSubTab('payments'); setEditingGatewayId(null); }}
          style={{
            padding: '12px 20px', background: 'none', border: 'none',
            borderBottom: activeSubTab === 'payments' ? '3px solid var(--m-primary)' : '3px solid transparent',
            color: activeSubTab === 'payments' ? 'var(--m-primary)' : 'var(--m-text-muted)',
            fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          💳 Payment Gateways
        </button>
      </div>

      {activeSubTab === 'identity' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Main Settings Form */}
          <div className="card">
            <h3 className="card-title">Brand Identity Configurations</h3>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field-group">
                <label>Store Display Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nature Glow Herbals" />
              </div>
              
              <div className="field-group">
                <label>Store Description / Bio</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="e.g. Clean beauty formulations crafted with organic herbs..." />
              </div>

              <div className="field-group">
                <label>Brand Logo URL</label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="e.g. https://domain.com/logo.png" />
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

              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} disabled={saving}>
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
                  <code style={{ fontSize: '0.8rem', color: 'var(--m-primary)' }}>{shopInfo?.slug}.localhost:3000</code>
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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: editingGatewayId ? '1fr 1fr' : '1fr', gap: '30px', alignItems: 'start' }}>
          {/* Gateways List */}
          <div className="card">
            <h3 className="card-title">Available Gateways</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)', marginBottom: 20 }}>
              Enable or disable payment options for your storefront and configure API credentials.
            </p>

            {loadingGateways ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>
                Loading gateways...
              </div>
            ) : gateways.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--m-text-muted)' }}>
                No payment gateways configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {gateways.map(g => (
                  <div
                    key={g.id}
                    style={{
                      border: '1px solid var(--m-border)',
                      borderRadius: 12,
                      padding: '18px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: editingGatewayId === g.id ? 'var(--m-primary-light)' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--m-text-main)' }}>{g.name}</strong>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: g.is_active ? '#E0F2FE' : '#F3F4F6',
                            color: g.is_active ? '#0369A1' : '#6B7280'
                          }}
                        >
                          {g.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--m-text-muted)', margin: '4px 0 0' }}>
                        Slug identifier: <code style={{ fontSize: '0.75rem' }}>{g.slug}</code>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => handleToggleGateway(g.id, g.is_active)}
                        className={g.is_active ? 'btn-ghost-sm' : 'btn-primary'}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {g.is_active ? '✕ Turn Off' : '✓ Turn On'}
                      </button>

                      {g.slug !== 'cod' && (
                        <button
                          onClick={() => startEditGateway(g)}
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          ⚙ Configure
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Config editor panel */}
          {editingGatewayId && (
            <div className="card">
              <h3 className="card-title">
                Configure {gateways.find(g => g.id === editingGatewayId)?.name}
              </h3>
              <form onSubmit={handleSaveGatewayConfig} className="form-grid">
                {gateways.find(g => g.id === editingGatewayId)?.slug === 'razorpay' && (
                  <>
                    <div className="field-group">
                      <label>Razorpay Key ID *</label>
                      <input
                        required
                        value={rzpKeyId}
                        onChange={e => setRzpKeyId(e.target.value)}
                        placeholder="rzp_test_..."
                      />
                    </div>
                    <div className="field-group">
                      <label>Razorpay Key Secret *</label>
                      <input
                        required
                        type="password"
                        value={rzpKeySecret}
                        onChange={e => setRzpKeySecret(e.target.value)}
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button type="submit" className="btn-primary" style={{ padding: '9px 20px' }} disabled={savingGateway}>
                    {savingGateway ? 'Saving…' : '✓ Save Config'}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost-sm"
                    onClick={() => setEditingGatewayId(null)}
                    style={{ padding: '9px 16px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

