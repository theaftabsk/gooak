'use client';
import React, { useEffect, useState } from 'react';
import { merchantApi } from '@/lib/api-client';

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  applies_to: string;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  free_shipping: boolean;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY: Omit<Coupon, 'id' | 'used_count' | 'created_at'> = {
  code: '',
  type: 'percentage',
  value: 10,
  min_order: 0,
  applies_to: 'all',
  usage_limit: null,
  per_customer_limit: null,
  free_shipping: false,
  starts_at: null,
  ends_at: null,
  is_active: true,
};

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(c: Coupon) {
  const now = new Date();
  if (!c.is_active) return <span className="badge badge-danger">Inactive</span>;
  if (c.ends_at && new Date(c.ends_at) < now) return <span className="badge badge-warn">Expired</span>;
  if (c.starts_at && new Date(c.starts_at) > now) return <span className="badge badge-info">Scheduled</span>;
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return <span className="badge badge-warn">Exhausted</span>;
  return <span className="badge badge-success">Active</span>;
}

function discountLabel(c: Coupon) {
  if (c.type === 'percentage') return `${c.value}% off`;
  if (c.type === 'fixed') return `₹${c.value} off`;
  if (c.type === 'free_shipping') return 'Free shipping';
  return c.type;
}

export default function PromosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [usageModal, setUsageModal] = useState<{ coupon: Coupon; rows: any[] } | null>(null);

  const load = () => {
    setLoading(true);
    merchantApi.getCoupons()
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY });
    setError('');
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditTarget(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_order: c.min_order,
      applies_to: c.applies_to,
      usage_limit: c.usage_limit,
      per_customer_limit: c.per_customer_limit,
      free_shipping: c.free_shipping,
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : null,
      ends_at: c.ends_at ? c.ends_at.slice(0, 10) : null,
      is_active: c.is_active,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setError('Code is required'); return; }
    if (form.type !== 'free_shipping' && (!form.value || form.value <= 0)) {
      setError('Discount value must be > 0'); return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        value: Number(form.value),
        min_order: Number(form.min_order) || 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_customer_limit: form.per_customer_limit ? Number(form.per_customer_limit) : null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editTarget) {
        await merchantApi.updateCoupon(editTarget.id, payload);
      } else {
        await merchantApi.createCoupon(payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await merchantApi.deleteCoupon(deleteId);
      setDeleteId(null);
      load();
    } catch {}
  };

  const handleToggleActive = async (c: Coupon) => {
    await merchantApi.updateCoupon(c.id, { is_active: !c.is_active });
    load();
  };

  const openUsage = async (c: Coupon) => {
    const rows = await merchantApi.getCouponUsage(c.id).catch(() => []);
    setUsageModal({ coupon: c, rows });
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const activeCoupons = coupons.filter(c => c.is_active);
  const totalSaved = coupons.reduce((s, c) => s + c.used_count, 0);

  return (
    <div>
      <style>{`
        .promo-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
        .promo-stat { background: #fff; border: 1px solid #EAECF0; border-radius: 10px; padding: 20px 22px; }
        .promo-stat-val { font-size: 1.7rem; font-weight: 700; color: #0F172A; }
        .promo-stat-label { font-size: 0.78rem; color: #64748B; margin-top: 4px; }
        .promo-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .promo-table-wrap { background: #fff; border: 1px solid #EAECF0; border-radius: 10px; overflow: hidden; }
        .promo-code { font-family: monospace; font-size: 0.82rem; font-weight: 700; background: #F1F5F9; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.05em; }
        .copy-btn { background: none; border: none; cursor: pointer; color: #94A3B8; padding: 2px 4px; font-size: 0.75rem; transition: color 0.15s; }
        .copy-btn:hover { color: #10B981; }
        .usage-bar-wrap { display: flex; align-items: center; gap: 8px; }
        .usage-bar { flex: 1; height: 5px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
        .usage-bar-fill { height: 100%; background: #10B981; border-radius: 3px; transition: width 0.3s; }
        .action-row { display: flex; gap: 6px; }
        .icon-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: 1px solid #EAECF0; background: #fff; cursor: pointer; color: #64748B; transition: all 0.15s; }
        .icon-btn:hover { background: #F8FAFC; color: #111; }
        .icon-btn.danger:hover { background: #FEF2F2; color: #EF4444; border-color: rgba(239,68,68,0.2); }
        .promo-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .promo-form-full { grid-column: 1 / -1; }
        .toggle-wrap { display: flex; align-items: center; gap: 10px; }
        .toggle { position: relative; width: 38px; height: 22px; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: #CBD5E1; border-radius: 11px; cursor: pointer; transition: background 0.2s; }
        .toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .toggle input:checked + .toggle-slider { background: #10B981; }
        .toggle input:checked + .toggle-slider::before { transform: translateX(16px); }
        .type-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .type-pill { padding: 6px 14px; border-radius: 6px; border: 1.5px solid #E2E8F0; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s; color: #64748B; background: #fff; }
        .type-pill.selected { border-color: #10B981; background: #F0FDF9; color: #10B981; }
        .usage-modal-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 0.82rem; }
        @media (max-width: 600px) { .promo-stats { grid-template-columns: 1fr; } .promo-form-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page-header">
        <div>
          <h2>Promos & Coupons</h2>
          <p className="header-sub">Create discount codes and track their usage</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="promo-stats">
        <div className="promo-stat">
          <div className="promo-stat-val">{coupons.length}</div>
          <div className="promo-stat-label">Total Coupons</div>
        </div>
        <div className="promo-stat">
          <div className="promo-stat-val">{activeCoupons.length}</div>
          <div className="promo-stat-label">Active Coupons</div>
        </div>
        <div className="promo-stat">
          <div className="promo-stat-val">{totalSaved}</div>
          <div className="promo-stat-label">Total Redemptions</div>
        </div>
      </div>

      {/* Table */}
      <div className="promo-toolbar">
        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="promo-table-wrap">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M20 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h7"/><polyline points="16 3 21 3 21 8"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            <p>No coupons yet. Create your first discount code.</p>
          </div>
        ) : (
          <table className="db-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => {
                const usagePct = c.usage_limit ? Math.min(100, (c.used_count / c.usage_limit) * 100) : null;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="promo-code">{c.code}</span>
                        <button className="copy-btn" title="Copy code" onClick={() => navigator.clipboard.writeText(c.code)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{discountLabel(c)}{c.free_shipping && c.type !== 'free_shipping' ? ' + free ship' : ''}</td>
                    <td>{c.min_order > 0 ? `₹${c.min_order}` : '—'}</td>
                    <td>
                      <div className="usage-bar-wrap">
                        <span style={{ fontSize: '0.8rem', minWidth: 32 }}>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}</span>
                        {usagePct !== null && (
                          <div className="usage-bar"><div className="usage-bar-fill" style={{ width: `${usagePct}%` }} /></div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      {c.starts_at || c.ends_at ? <>{fmt(c.starts_at)} → {fmt(c.ends_at)}</> : 'No limit'}
                    </td>
                    <td>{statusBadge(c)}</td>
                    <td>
                      <div className="action-row">
                        <button className="icon-btn" title="View usage" onClick={() => openUsage(c)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="icon-btn" title={c.is_active ? 'Deactivate' : 'Activate'} onClick={() => handleToggleActive(c)}>
                          {c.is_active
                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 0 1 5.64 19.36"/><path d="M5.64 5.64A9 9 0 0 1 18.36 18.36"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>
                          }
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="icon-btn danger" title="Delete" onClick={() => setDeleteId(c.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>{editTarget ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}

                {/* Code */}
                <div className="field-group">
                  <label>Coupon Code *</label>
                  <input
                    value={form.code}
                    onChange={e => set('code', e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.05em', fontWeight: 700 }}
                    required
                  />
                </div>

                {/* Type */}
                <div className="field-group">
                  <label>Discount Type *</label>
                  <div className="type-pills">
                    {[['percentage', '% Percentage'], ['fixed', '₹ Fixed Amount'], ['free_shipping', '🚚 Free Shipping']].map(([val, label]) => (
                      <button key={val} type="button" className={`type-pill${form.type === val ? ' selected' : ''}`} onClick={() => set('type', val)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="promo-form-grid">
                  {/* Value */}
                  {form.type !== 'free_shipping' && (
                    <div className="field-group">
                      <label>{form.type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'} *</label>
                      <input
                        type="number"
                        min={0.01}
                        max={form.type === 'percentage' ? 100 : undefined}
                        step={0.01}
                        value={form.value}
                        onChange={e => set('value', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Min order */}
                  <div className="field-group">
                    <label>Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.min_order}
                      onChange={e => set('min_order', e.target.value)}
                      placeholder="0 = no minimum"
                    />
                  </div>

                  {/* Usage limit */}
                  <div className="field-group">
                    <label>Total Usage Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={form.usage_limit ?? ''}
                      onChange={e => set('usage_limit', e.target.value || null)}
                      placeholder="Unlimited"
                    />
                  </div>

                  {/* Per customer limit */}
                  <div className="field-group">
                    <label>Per Customer Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={form.per_customer_limit ?? ''}
                      onChange={e => set('per_customer_limit', e.target.value || null)}
                      placeholder="Unlimited"
                    />
                  </div>

                  {/* Start date */}
                  <div className="field-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={form.starts_at ?? ''}
                      onChange={e => set('starts_at', e.target.value || null)}
                    />
                  </div>

                  {/* End date */}
                  <div className="field-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={form.ends_at ?? ''}
                      onChange={e => set('ends_at', e.target.value || null)}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div className="toggle-wrap">
                    <label className="toggle">
                      <input type="checkbox" checked={form.free_shipping} onChange={e => set('free_shipping', e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                    <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>Also include free shipping</span>
                  </div>
                  <div className="toggle-wrap">
                    <label className="toggle">
                      <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                    <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>Active</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>Delete Coupon</h3><button className="modal-close" onClick={() => setDeleteId(null)}>✕</button></div>
            <div className="modal-body"><p style={{ color: '#64748B', fontSize: '0.9rem' }}>This will permanently delete the coupon. Orders that used it will keep their discount snapshot.</p></div>
            <div className="modal-footer">
              <button className="btn-ghost-sm" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger-sm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Usage modal */}
      {usageModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUsageModal(null)}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3>Usage — <span className="promo-code">{usageModal.coupon.code}</span></h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>{usageModal.rows.length} redemptions</p>
              </div>
              <button className="modal-close" onClick={() => setUsageModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {usageModal.rows.length === 0 ? (
                <p style={{ color: '#64748B', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>No redemptions yet</p>
              ) : (
                usageModal.rows.map((row, i) => (
                  <div key={i} className="usage-modal-row">
                    <span>{row.guest_email || row.customer_id || 'Guest'}</span>
                    <span style={{ color: '#94A3B8' }}>{fmt(row.used_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
