import React, { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '@oaksol/api-client';

/* ─── tiny inline icons ─────────────────────────────────────────── */
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCOD = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
  </svg>
);
const IconRazorpay = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
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

/* ─── styles (injected once) ────────────────────────────────────── */
const PaymentStyles = () => (
  <style>{`
    .pay-page { max-width: 960px; }
    .pay-header { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
    .pay-header-icon { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 4px 14px rgba(99,102,241,.35); }
    .pay-header h2 { margin:0; font-size:1.45rem; font-weight:800; }
    .pay-header p  { margin:4px 0 0; font-size:0.85rem; color:var(--m-text-muted); }

    .pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media(max-width:820px){ .pay-grid{ grid-template-columns:1fr; } }

    .pay-card {
      background: var(--m-card);
      border: 1px solid var(--m-border);
      border-radius: 16px;
      padding: 26px;
      transition: box-shadow .2s;
    }
    .pay-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.12); }

    .pay-card-head { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
    .pay-card-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pay-card-icon.cod  { background:linear-gradient(135deg,#10b981,#059669); color:#fff; }
    .pay-card-icon.rzp  { background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; }
    .pay-card-name { font-size:1.05rem; font-weight:700; }
    .pay-card-slug { font-size:0.75rem; color:var(--m-text-muted); margin-top:2px; }

    .pay-badge {
      display:inline-flex; align-items:center; gap:5px;
      padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700; letter-spacing:.03em;
    }
    .pay-badge.active { background:#dcfce7; color:#15803d; }
    .pay-badge.inactive { background:#f3f4f6; color:#6b7280; }

    .pay-toggle-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }

    .pay-toggle-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:8px 18px; border-radius:8px; font-size:0.82rem; font-weight:700;
      border:none; cursor:pointer; transition:all .15s;
    }
    .pay-toggle-btn.on  { background:#dcfce7; color:#15803d; }
    .pay-toggle-btn.on:hover  { background:#bbf7d0; }
    .pay-toggle-btn.off { background:#fee2e2; color:#dc2626; }
    .pay-toggle-btn.off:hover { background:#fecaca; }

    .pay-divider { height:1px; background:var(--m-border); margin:18px 0; }

    .pay-field { margin-bottom:16px; }
    .pay-field label { display:block; font-size:0.78rem; font-weight:600; color:var(--m-text-muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
    .pay-field .inp-wrap { position:relative; }
    .pay-field input {
      width:100%; padding:10px 38px 10px 12px; box-sizing:border-box;
      border:1.5px solid var(--m-border); border-radius:8px;
      background:var(--m-input-bg,rgba(255,255,255,.04)); color:var(--m-text-main);
      font-size:0.88rem; transition:border-color .15s;
    }
    .pay-field input:focus { outline:none; border-color:var(--m-primary); }
    .pay-eye-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--m-text-muted); padding:2px; display:flex; }

    .pay-save-btn {
      width:100%; padding:11px; border:none; border-radius:9px; cursor:pointer;
      font-size:0.9rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff;
      box-shadow:0 3px 12px rgba(99,102,241,.35); transition:opacity .15s, transform .1s;
    }
    .pay-save-btn:hover:not(:disabled) { opacity:.92; transform:translateY(-1px); }
    .pay-save-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }

    .pay-tip { font-size:0.78rem; color:var(--m-text-muted); margin-top:10px; line-height:1.5; }
    .pay-tip a { color:var(--m-primary); }

    .pay-success-flash {
      display:flex; align-items:center; gap:8px; padding:10px 14px;
      background:#dcfce7; border:1px solid #86efac; border-radius:8px; color:#15803d;
      font-size:0.82rem; font-weight:600; margin-bottom:16px; animation:fadeIn .3s;
    }
    @keyframes fadeIn{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

    .pay-info-card {
      background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.06));
      border:1px solid rgba(99,102,241,.2); border-radius:14px; padding:22px;
    }
    .pay-info-card h4 { margin:0 0 14px; font-size:0.92rem; font-weight:700; display:flex; align-items:center; gap:8px; }
    .pay-info-card ul { margin:0; padding-left:18px; }
    .pay-info-card li { font-size:0.82rem; color:var(--m-text-muted); margin-bottom:7px; line-height:1.5; }
    .pay-info-card li strong { color:var(--m-text-main); }
  `}</style>
);

/* ─── Component ─────────────────────────────────────────────────── */
export const PaymentPage: React.FC = () => {
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Razorpay form
  const [rzpKeyId, setRzpKeyId]         = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [showSecret, setShowSecret]     = useState(false);
  const [savingRzp, setSavingRzp]       = useState(false);
  const [rzpSaved, setRzpSaved]         = useState(false);

  // Gateway toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAdminPaymentGateways();
      const list: any[] = Array.isArray(data) ? data : [];
      setGateways(list);
      // Pre-fill Razorpay keys if saved
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

  /* Toggle active/inactive */
  const handleToggle = async (gateway: any) => {
    setTogglingId(gateway.id);
    try {
      await paymentApi.updateAdminPaymentGateway(gateway.id, { is_active: !gateway.is_active });
      setGateways(prev => prev.map(g => g.id === gateway.id ? { ...g, is_active: !gateway.is_active } : g));
    } catch (err: any) {
      alert(err.message || 'Failed to update gateway');
    } finally {
      setTogglingId(null);
    }
  };

  /* Save Razorpay API keys */
  const handleSaveRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    const rzp = getGateway('razorpay');
    if (!rzp) return;
    if (!rzpKeyId.trim() || !rzpKeySecret.trim()) { alert('Both Key ID and Key Secret are required.'); return; }
    setSavingRzp(true);
    try {
      await paymentApi.updateAdminPaymentGateway(rzp.id, { config: { key_id: rzpKeyId.trim(), key_secret: rzpKeySecret.trim() } });
      setRzpSaved(true);
      setTimeout(() => setRzpSaved(false), 3500);
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
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--m-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>💳</div>
          Loading payment gateways…
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      <PaymentStyles />

      {/* Header */}
      <div className="pay-header">
        <div className="pay-header-icon"><IconShield /></div>
        <div>
          <h2>Payment Methods</h2>
          <p>Manage and configure your storefront payment options</p>
        </div>
      </div>

      <div className="pay-grid">
        {/* ── COD Card ─────────────────────────────────── */}
        {cod && (
          <div className="pay-card">
            <div className="pay-card-head">
              <div className="pay-card-icon cod"><IconCOD /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="pay-card-name">{cod.name}</span>
                  <span className={`pay-badge ${cod.is_active ? 'active' : 'inactive'}`}>
                    {cod.is_active ? <><IconCheck /> ACTIVE</> : 'DISABLED'}
                  </span>
                </div>
                <div className="pay-card-slug">Slug: <code>{cod.slug}</code></div>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--m-text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
              Allow customers to pay at the time of delivery. No API credentials required — just toggle it on.
            </p>

            <button
              className={`pay-toggle-btn ${cod.is_active ? 'off' : 'on'}`}
              onClick={() => handleToggle(cod)}
              disabled={togglingId === cod.id}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {togglingId === cod.id
                ? 'Updating…'
                : cod.is_active
                  ? '✕  Disable Cash on Delivery'
                  : '✓  Enable Cash on Delivery'}
            </button>
          </div>
        )}

        {/* ── Razorpay Card ─────────────────────────────── */}
        {rzp && (
          <div className="pay-card">
            <div className="pay-card-head">
              <div className="pay-card-icon rzp"><IconRazorpay /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="pay-card-name">{rzp.name}</span>
                  <span className={`pay-badge ${rzp.is_active ? 'active' : 'inactive'}`}>
                    {rzp.is_active ? <><IconCheck /> ACTIVE</> : 'DISABLED'}
                  </span>
                </div>
                <div className="pay-card-slug">Slug: <code>{rzp.slug}</code></div>
              </div>
            </div>

            {/* Toggle */}
            <div className="pay-toggle-row">
              <span style={{ fontSize: '0.84rem', color: 'var(--m-text-muted)' }}>Gateway Status</span>
              <button
                className={`pay-toggle-btn ${rzp.is_active ? 'off' : 'on'}`}
                onClick={() => handleToggle(rzp)}
                disabled={togglingId === rzp.id}
              >
                {togglingId === rzp.id ? 'Updating…' : rzp.is_active ? '✕ Disable' : '✓ Enable'}
              </button>
            </div>

            <div className="pay-divider" />

            {/* API Keys form */}
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

              <button type="submit" className="pay-save-btn" disabled={savingRzp}>
                {savingRzp ? 'Saving credentials…' : <><IconShield /> Save Razorpay Credentials</>}
              </button>

              <p className="pay-tip">
                Get your API keys from{' '}
                <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer">
                  Razorpay Dashboard → Settings → API Keys
                </a>.
                Use <code>rzp_test_</code> keys for testing and <code>rzp_live_</code> for production.
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="pay-info-card" style={{ marginTop: 28 }}>
        <h4><IconShield /> How Payment Configuration Works</h4>
        <ul>
          <li><strong>Cash on Delivery (COD)</strong> — No setup required. Toggle on to let customers pay at doorstep.</li>
          <li><strong>Razorpay</strong> — Enter your Key ID and Key Secret from the Razorpay dashboard. Once saved, the checkout page will automatically use Razorpay for online payments.</li>
          <li><strong>Live vs Test mode</strong> — Use <code>rzp_test_</code> prefix keys for sandbox testing, switch to <code>rzp_live_</code> before going live.</li>
          <li><strong>Security</strong> — API credentials are stored encrypted and are never exposed to the storefront frontend.</li>
        </ul>
      </div>
    </div>
  );
};
