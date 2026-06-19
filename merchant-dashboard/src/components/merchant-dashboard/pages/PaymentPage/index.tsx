import React, { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '@oaksol/api-client';
import { Icons } from '../../icons';
import { LoadingSpinner } from '../../shared';

/* ─── High Fidelity Custom SVGs ─────────────────────────────────── */
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LogoCOD = () => (
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#059669' }}>
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
    <path d="M7 8h4v4H7z" fill="currentColor" opacity="0.15" />
    <path d="M11 6a3 3 0 0 0-3 3M7 8a3 3 0 0 1 3-3" />
  </svg>
);

const LogoRazorpay = () => (
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" fill="#0C2540" />
    <path d="M10.5 17h5.5l2.5-9h-5.5l-2.5 9z" fill="#3399FF" />
    <path d="M7.5 17h2.5l2.5-9H10l-2.5 9z" fill="#33CCFF" />
  </svg>
);

const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Styles ────────────────────────────────────────────────────── */
const PaymentStyles = () => (
  <style>{`
    .pay-page { max-width: 960px; }
    .pay-header { display: flex; align-items: center; gap: 14px; margin-bottom: 30px; }
    .pay-header-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--m-primary-light); display:flex; align-items:center; justify-content:center; color:var(--m-primary); }
    .pay-header h2 { margin:0; font-size:1.4rem; font-weight:800; }
    .pay-header p  { margin:4px 0 0; font-size:0.82rem; color:var(--m-text-muted); }

    /* Grid layout for list */
    .pay-box-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    @media(max-width: 720px){ .pay-box-grid { grid-template-columns: 1fr; } }

    /* Interactive click-boxes (cards) */
    .pay-method-box {
      background: var(--m-card);
      border: 1px solid var(--m-border);
      border-radius: 16px;
      padding: 30px 24px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s ease-in-out;
      position: relative;
    }
    .pay-method-box:hover {
      transform: translateY(-2px);
      border-color: var(--m-primary);
      box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    }
    .pay-method-logo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      border: 1px solid var(--m-border);
    }
    .pay-method-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--m-text-main);
      margin: 0 0 8px 0;
    }
    .pay-method-desc {
      font-size: 0.82rem;
      color: var(--m-text-muted);
      margin: 0 0 20px 0;
      line-height: 1.5;
      max-width: 280px;
    }

    .pay-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: .02em;
    }
    .pay-badge.active { background: #DCFCE7; color: #15803D; }
    .pay-badge.inactive { background: #F1F5F9; color: #64748B; }

    .pay-action-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--m-primary);
      margin-top: auto;
    }

    /* Subpage layouts */
    .pay-sub-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 25px; }
    @media(max-width: 820px){ .pay-sub-grid { grid-template-columns: 1fr; } }

    .pay-field { margin-bottom:16px; }
    .pay-field label { display:block; font-size:0.78rem; font-weight:600; color:var(--m-text-muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
    .pay-field .inp-wrap { position:relative; }
    .pay-field input {
      width:100%; padding:10px 38px 10px 12px; box-sizing:border-box;
      border:1.5px solid var(--m-border); border-radius:8px;
      background:rgba(255,255,255,.02); color:var(--m-text-main);
      font-size:0.88rem; transition:border-color .15s;
    }
    .pay-field input:focus { outline:none; border-color:var(--m-primary); }
    .pay-eye-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--m-text-muted); padding:2px; display:flex; }

    .pay-save-btn {
      width:100%; padding:11px; border:none; border-radius:9px; cursor:pointer;
      font-size:0.9rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;
      background: var(--m-primary); color:#fff;
      transition:opacity .15s, transform .1s;
    }
    .pay-save-btn:hover:not(:disabled) { opacity:.92; }
    .pay-save-btn:disabled { opacity:.55; cursor:not-allowed; }

    .pay-toggle-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:10px 20px; border-radius:8px; font-size:0.85rem; font-weight:700;
      border:none; cursor:pointer; transition:all .15s;
      width: 100%; justify-content: center;
    }
    .pay-toggle-btn.on  { background:#DCFCE7; color:#15803D; }
    .pay-toggle-btn.on:hover  { background:#BBF7D0; }
    .pay-toggle-btn.off { background:#FEE2E2; color:#DC2626; }
    .pay-toggle-btn.off:hover { background:#FECACA; }

    .pay-info-card {
      background: rgba(99, 102, 241, 0.04);
      border: 1px solid var(--m-border); border-radius:14px; padding:22px;
    }
    .pay-info-card h4 { margin:0 0 14px; font-size:0.92rem; font-weight:700; display:flex; align-items:center; gap:8px; }
    .pay-info-card ul { margin:0; padding-left:18px; }
    .pay-info-card li { font-size:0.82rem; color:var(--m-text-muted); margin-bottom:8px; line-height:1.5; }
    .pay-info-card li strong { color:var(--m-text-main); }

    .pay-success-flash {
      display:flex; align-items:center; gap:8px; padding:10px 14px;
      background:#DCFCE7; border:1px solid #86EFAC; border-radius:8px; color:#15803D;
      font-size:0.82rem; font-weight:600; margin-bottom:16px;
    }
  `}</style>
);

export const PaymentPage: React.FC = () => {
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view routing: 'list' | 'cod' | 'razorpay'
  const [activeView, setActiveView] = useState<'list' | 'cod' | 'razorpay'>('list');

  // Razorpay form state
  const [rzpKeyId, setRzpKeyId]         = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [showSecret, setShowSecret]     = useState(false);
  const [savingRzp, setSavingRzp]       = useState(false);
  const [rzpSaved, setRzpSaved]         = useState(false);

  // Gateway toggle indicator
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAdminPaymentGateways();
      const list: any[] = Array.isArray(data) ? data : [];
      setGateways(list);
      
      const rzp = list.find((g: any) => g.slug === 'razorpay');
      if (rzp?.config?.key_id) setRzpKeyId(rzp.config.key_id);
      if (rzp?.config?.key_secret) setRzpKeySecret(rzp.config.key_secret);
    } catch (err) {
      console.error('Failed to load payment gateways:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGateways(); }, [loadGateways]);

  const getGateway = (slug: string) => gateways.find(g => g.slug === slug);

  const handleToggle = async (gateway: any) => {
    setTogglingId(gateway.id);
    try {
      await paymentApi.updateAdminPaymentGateway(gateway.id, { is_active: !gateway.is_active });
      setGateways(prev => prev.map(g => g.id === gateway.id ? { ...g, is_active: !gateway.is_active } : g));
    } catch (err: any) {
      alert(err.message || 'Failed to update gateway status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    const rzp = getGateway('razorpay');
    if (!rzp) return;
    if (!rzpKeyId.trim() || !rzpKeySecret.trim()) { alert('Both Key ID and Key Secret are required.'); return; }
    setSavingRzp(true);
    try {
      await paymentApi.updateAdminPaymentGateway(rzp.id, { config: { key_id: rzpKeyId.trim(), key_secret: rzpKeySecret.trim() } });
      setRzpSaved(true);
      setTimeout(() => setRzpSaved(false), 3000);
      await loadGateways();
    } catch (err: any) {
      alert(err.message || 'Failed to save Razorpay configuration');
    } finally {
      setSavingRzp(false);
    }
  };

  const cod = getGateway('cod');
  const rzp = getGateway('razorpay');

  if (loading) {
    return (
      <div className="pay-page">
        <PaymentStyles />
        <LoadingSpinner message="Fetching payment configurations..." />
      </div>
    );
  }

  return (
    <div className="pay-page">
      <PaymentStyles />

      {/* ── View 1: Main Gateway Selection Boxes ── */}
      {activeView === 'list' && (
        <>
          <header className="page-header" style={{ marginBottom: 25 }}>
            <div>
              <h2>Payment Configuration</h2>
              <p className="header-sub">Configure and activate customer payment choices for checkouts</p>
            </div>
          </header>

          <div className="pay-box-grid">
            {/* Cash on Delivery Box */}
            {cod && (
              <div className="pay-method-box" onClick={() => setActiveView('cod')}>
                <div className="pay-method-logo">
                  <LogoCOD />
                </div>
                <h3 className="pay-method-title">{cod.name}</h3>
                <p className="pay-method-desc">Allow shoppers to pay at their doorstep upon receiving package deliveries.</p>
                <div style={{ marginBottom: 20 }}>
                  <span className={`pay-badge ${cod.is_active ? 'active' : 'inactive'}`}>
                    {cod.is_active ? <><IconCheck /> ACTIVE</> : 'DISABLED'}
                  </span>
                </div>
                <span className="pay-action-link">Configure Settings →</span>
              </div>
            )}

            {/* Razorpay Payments Box */}
            {rzp && (
              <div className="pay-method-box" onClick={() => setActiveView('razorpay')}>
                <div className="pay-method-logo">
                  <LogoRazorpay />
                </div>
                <h3 className="pay-method-title">{rzp.name}</h3>
                <p className="pay-method-desc">Accept instant, secure payments via Cards, UPI, Netbanking, or mobile wallets.</p>
                <div style={{ marginBottom: 20 }}>
                  <span className={`pay-badge ${rzp.is_active ? 'active' : 'inactive'}`}>
                    {rzp.is_active ? <><IconCheck /> ACTIVE</> : 'DISABLED'}
                  </span>
                </div>
                <span className="pay-action-link">Configure Settings →</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── View 2: COD Details Page ── */}
      {activeView === 'cod' && cod && (
        <>
          <header className="page-header" style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <button className="btn-ghost-sm" onClick={() => setActiveView('list')} style={{ padding: '8px 12px' }}>
                <IconBack /> Back
              </button>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {cod.name} Settings
                  <span className={`pay-badge ${cod.is_active ? 'active' : 'inactive'}`}>
                    {cod.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </h2>
                <p className="header-sub">Configure door-to-door payment terms</p>
              </div>
            </div>
          </header>

          <div className="pay-sub-grid">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 15 }}>Activation Controls</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Cash on Delivery requires no special integration keys. Enabling it will immediately offer it as a payment option to buyers on the checkout storefront.
              </p>
              <button
                className={`pay-toggle-btn ${cod.is_active ? 'off' : 'on'}`}
                onClick={() => handleToggle(cod)}
                disabled={togglingId === cod.id}
              >
                {togglingId === cod.id
                  ? 'Updating Status…'
                  : cod.is_active
                    ? '✕ Disable Cash on Delivery'
                    : '✓ Enable Cash on Delivery'}
              </button>
            </div>

            <div className="pay-info-card">
              <h4><IconShield /> COD Details</h4>
              <ul>
                <li><strong>Zero Credentials</strong> — Works out-of-the-box with no API configs.</li>
                <li><strong>Local Preference</strong> — Widely preferred by local customers.</li>
                <li><strong>Refund Policy</strong> — Require manual handling of return refunds.</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ── View 3: Razorpay Details Page ── */}
      {activeView === 'razorpay' && rzp && (
        <>
          <header className="page-header" style={{ marginBottom: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <button className="btn-ghost-sm" onClick={() => setActiveView('list')} style={{ padding: '8px 12px' }}>
                <IconBack /> Back
              </button>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {rzp.name} Settings
                  <span className={`pay-badge ${rzp.is_active ? 'active' : 'inactive'}`}>
                    {rzp.is_active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </h2>
                <p className="header-sub">Configure online payment gateways</p>
              </div>
            </div>
          </header>

          <div className="pay-sub-grid">
            {/* Credentials form */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 15 }}>API Configurations</h3>
              
              <form onSubmit={handleSaveRazorpay}>
                {rzpSaved && (
                  <div className="pay-success-flash">
                    <IconCheck /> Razorpay credentials saved successfully!
                  </div>
                )}

                <div className="pay-field">
                  <label><IconKey /> Razorpay Key ID</label>
                  <div className="inp-wrap">
                    <input
                      required
                      value={rzpKeyId}
                      onChange={e => setRzpKeyId(e.target.value)}
                      placeholder="rzp_live_xxxxxxxxxxxx"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="pay-field">
                  <label><IconKey /> Razorpay Key Secret</label>
                  <div className="inp-wrap">
                    <input
                      required
                      type={showSecret ? 'text' : 'password'}
                      value={rzpKeySecret}
                      onChange={e => setRzpKeySecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pay-eye-btn"
                      onClick={() => setShowSecret(s => !s)}
                    >
                      {showSecret ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="pay-save-btn" disabled={savingRzp} style={{ marginBottom: 15 }}>
                  {savingRzp ? 'Saving API Credentials…' : <><IconShield /> Save API Keys</>}
                </button>
              </form>

              <p className="pay-tip" style={{ marginTop: 10 }}>
                Access credentials on the{' '}
                <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--m-primary)', fontWeight: 600 }}>
                  Razorpay Dashboard → Settings → API Keys
                </a>.
              </p>
            </div>

            {/* Status Activation panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 15 }}>Activation Controls</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--m-text-muted)', lineHeight: 1.5, marginBottom: 15 }}>
                  Toggle checkout visibility for online payment processing once API keys are successfully configured.
                </p>
                <button
                  className={`pay-toggle-btn ${rzp.is_active ? 'off' : 'on'}`}
                  onClick={() => handleToggle(rzp)}
                  disabled={togglingId === rzp.id}
                >
                  {togglingId === rzp.id
                    ? 'Updating Status…'
                    : rzp.is_active
                      ? '✕ Disable Online Gateway'
                      : '✓ Enable Online Gateway'}
                </button>
              </div>

              <div className="pay-info-card">
                <h4><IconShield /> Razorpay Instructions</h4>
                <ul>
                  <li><strong>Sandbox mode</strong> — Use <code>rzp_test_</code> keys to perform mock transactions.</li>
                  <li><strong>Live mode</strong> — Swap with <code>rzp_live_</code> credentials to accept actual payments.</li>
                  <li><strong>Safety</strong> — API keys are safely decrypted backend-side.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
