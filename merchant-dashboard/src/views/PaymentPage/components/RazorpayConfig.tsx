import React, { useState, useEffect } from 'react';
import { PaymentGateway } from '../types';
import { LogoRazorpay } from './Logos';
import { validateRazorpay } from '../utils/validation';

interface RazorpayConfigProps {
  gateway: PaymentGateway;
  onBack: () => void;
  onSaveConfig: (id: string, config: Record<string, any>) => Promise<boolean>;
  onToggleStatus: (g: PaymentGateway) => void;
  togglingId: string | null;
}

export const RazorpayConfig: React.FC<RazorpayConfigProps> = ({
  gateway,
  onBack,
  onSaveConfig,
  onToggleStatus,
  togglingId,
}) => {
  const [keyId, setKeyId] = useState(gateway.config?.key_id || '');
  const [keySecret, setKeySecret] = useState(gateway.config?.key_secret || '');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  const isConfigured = (): boolean => {
    return !!keyId && !!keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateRazorpay(keyId, keySecret);
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    setSaving(true);
    const success = await onSaveConfig(gateway.id, {
      key_id: keyId.trim(),
      key_secret: keySecret.trim(),
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
            <div style={{ padding: 10, background: '#EFF6FF', borderRadius: 12 }}>
              <LogoRazorpay />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Razorpay Online Payments</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>Configure Razorpay API Keys to accept instant payments from customers.</p>
            </div>
          </div>

          {successFlash && (
            <div className="pay-success-flash">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Razorpay configuration saved successfully!
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pay-field">
              <label>Key ID</label>
              <input
                type="text"
                value={keyId}
                onChange={e => setKeyId(e.target.value)}
                placeholder="rzp_test_..."
              />
            </div>

            <div className="pay-field">
              <label>Key Secret</label>
              <div className="inp-wrap">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={keySecret}
                  onChange={e => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="pay-eye-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
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
              {isToggling ? 'Updating Status...' : !isConfigured() ? 'Locked (Configure Keys First)' : gateway.is_active ? 'Disable Razorpay' : 'Enable Razorpay'}
            </button>
          </div>
        </div>

        <div className="pay-info-card">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Setup Guide &amp; Docs
          </h4>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>Log in to your <strong>Razorpay Dashboard</strong>.</li>
            <li>Navigate to <strong>Account &amp; Settings</strong> &rarr; <strong>API Keys</strong> &rarr; <strong>Generate Key</strong>.</li>
            <li>Copy the <strong>Key ID</strong> and <strong>Key Secret</strong> generated, paste them here and save.</li>
            <li>Once credentials are configured, click <strong>Enable Razorpay</strong> to start accepting customer orders online.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
