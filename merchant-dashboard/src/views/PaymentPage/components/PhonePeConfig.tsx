import React, { useState } from 'react';
import { PaymentGateway } from '../types';
import { LogoPhonePe } from './Logos';
import { validatePhonePe } from '../utils/validation';

interface PhonePeConfigProps {
  gateway: PaymentGateway;
  onBack: () => void;
  onSaveConfig: (id: string, config: Record<string, any>) => Promise<boolean>;
  onToggleStatus: (g: PaymentGateway) => void;
  togglingId: string | null;
}

export const PhonePeConfig: React.FC<PhonePeConfigProps> = ({
  gateway,
  onBack,
  onSaveConfig,
  onToggleStatus,
  togglingId,
}) => {
  const [merchantId, setMerchantId] = useState(gateway.config?.merchant_id || '');
  const [saltKey, setSaltKey] = useState(gateway.config?.salt_key || '');
  const [saltIndex, setSaltIndex] = useState(gateway.config?.salt_index || '1');
  const [environment, setEnvironment] = useState(gateway.config?.environment || 'PRODUCTION');
  
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  const isConfigured = (): boolean => {
    if (!merchantId || !saltKey || !saltIndex) return false;
    const numIndex = Number(saltIndex);
    return !isNaN(numIndex) && Number.isInteger(numIndex) && numIndex > 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validatePhonePe(merchantId, saltKey, saltIndex);
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    setSaving(true);
    const success = await onSaveConfig(gateway.id, {
      merchant_id: merchantId.trim(),
      salt_key: saltKey.trim(),
      salt_index: saltIndex.trim(),
      environment,
    });
    setSaving(false);

    if (success) {
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 3000);
    }
  };

  const isToggling = togglingId === gateway.id;

  return (
    <div>
      <div className="pay-header">
        <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--m-text-normal)' }}>
          &larr; Back to Gateways
        </button>
      </div>

      <div className="pay-sub-grid">
        <div className="card" style={{ padding: '30px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ padding: '6px 10px', background: '#F5F3FF', borderRadius: 12 }}>
              <LogoPhonePe />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>PhonePe Online Payments</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>Configure PhonePe Payment Gateway credentials to receive UPI and wallet payments.</p>
            </div>
          </div>

          {successFlash && (
            <div className="pay-success-flash">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              PhonePe configuration saved successfully!
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pay-field">
              <label>Merchant ID</label>
              <input
                type="text"
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                placeholder="PGMERCHANTID"
              />
            </div>

            <div className="pay-field">
              <label>Salt Key</label>
              <div className="inp-wrap">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={saltKey}
                  onChange={e => setSaltKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="pay-eye-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="pay-field">
                <label>Salt Index</label>
                <input
                  type="number"
                  min="1"
                  value={saltIndex}
                  onChange={e => setSaltIndex(e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="pay-field">
                <label>Gateway Environment</label>
                <select
                  value={environment}
                  onChange={e => setEnvironment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    border: '1.5px solid var(--m-border)',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: 'var(--m-text-main)',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="PRODUCTION">Production</option>
                  <option value="SANDBOX">Sandbox / UAT</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={saving} className="pay-save-btn">
              {saving ? 'Saving Config...' : 'Save Configuration'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 20, marginTop: 25 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 600 }}>Activation State</h4>
            <button
              onClick={() => onToggleStatus(gateway)}
              disabled={isToggling || !isConfigured()}
              className={`pay-toggle-btn ${!isConfigured() ? 'locked' : gateway.is_active ? 'on' : 'off'}`}
            >
              {isToggling ? 'Updating Status...' : !isConfigured() ? 'Locked (Configure Credentials First)' : gateway.is_active ? 'Disable PhonePe' : 'Enable PhonePe'}
            </button>
          </div>
        </div>

        <div className="pay-info-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--m-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Quick Setup Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <a href="https://business.phonepe.com/payment-gateway" target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.8rem', padding: '10px 14px', borderRadius: 8, background: '#FFFFFF', border: '1px solid var(--m-border)', fontWeight: 600, color: 'var(--m-text-main)' }}>
                PhonePe Business Dashboard &rarr;
              </a>
              <a href="https://developer.phonepe.com" target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.8rem', padding: '10px 14px', borderRadius: 8, background: '#FFFFFF', border: '1px solid var(--m-border)', fontWeight: 600, color: 'var(--m-text-main)' }}>
                Developer Docs Portal &rarr;
              </a>
              <a href="https://developer.phonepe.com/v1/reference/pay-api-1" target="_blank" rel="noreferrer" className="btn-secondary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: '0.8rem', padding: '10px 14px', borderRadius: 8, background: '#FFFFFF', border: '1px solid var(--m-border)', fontWeight: 600, color: 'var(--m-text-main)' }}>
                Pay API Reference Specifications &rarr;
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: 15 }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--m-text-main)' }}>Instructions</h5>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: 'var(--m-text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Copy your <strong>Merchant ID</strong> from the merchant business profile section.</li>
              <li>Under Integration details, copy the active <strong>Salt Key</strong> and note its <strong>Salt Index</strong> (typically 1 or 2).</li>
              <li>Use <strong>Sandbox</strong> environment for testing integrations before going live on <strong>Production</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
