import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { customerApi } from '../../../../lib/api-client';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fffbeb' },
  confirmed: { label: 'Confirmed', color: '#1d4ed8', bg: '#eff6ff' },
  processing:{ label: 'Processing',color: '#6d28d9', bg: '#f5f3ff' },
  shipped:   { label: 'Shipped',   color: '#0e7490', bg: '#ecfeff' },
  delivered: { label: 'Delivered', color: '#15803D', bg: '#f0fdf4' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fef2f2' },
  refunded:  { label: 'Refunded',  color: '#6b7280', bg: '#f9fafb' },
};

export const MyOrders: React.FC = () => {
  const { customer, token, isLoading } = useCustomer();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !customer) { navigate('/login'); return; }
  }, [customer, isLoading, navigate]);

  useEffect(() => {
    if (!token) return;
    customerApi.getMyOrders(token)
      .then(data => setOrders(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const fmt = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const date = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading || isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ord-spinner" />
    </div>
  );

  return (
    <div className="ord-page">
      <div className="ord-inner">
        <div className="ord-header">
          <Link to="/account" className="ord-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            My Account
          </Link>
          <h1 className="ord-title">My Orders</h1>
          <p className="ord-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>

        {error && <div className="ord-error">{error}</div>}

        {!error && orders.length === 0 ? (
          <div className="ord-empty">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--sf-border)" strokeWidth="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <h3>No orders yet</h3>
            <p>Start shopping and your orders will appear here.</p>
            <Link to="/products" className="ord-shop-btn">Browse Products</Link>
          </div>
        ) : (
          <div className="ord-list">
            {orders.map(order => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="ord-card">
                  <div className="ord-card-header" onClick={() => setExpanded(isOpen ? null : order.id)}>
                    <div className="ord-info">
                      <span className="ord-num">#{order.order_number}</span>
                      <span className="ord-date">{date(order.created_at)}</span>
                    </div>
                    <div className="ord-meta">
                      <span className="ord-status-badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      <span className="ord-total">{fmt(order.total)}</span>
                      <svg className={`ord-chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="ord-items">
                      {(order.items || []).map((item: any, i: number) => {
                        const snap = (item.product_snap as any) || {};
                        return (
                          <div className="ord-item-row" key={i}>
                            <div className="ord-item-thumb">
                              {snap.image_url
                                ? <img src={snap.image_url} alt={snap.name} />
                                : <div className="ord-item-placeholder">📦</div>
                              }
                            </div>
                            <div className="ord-item-details">
                              <span className="ord-item-name">{snap.name || 'Product'}</span>
                              {snap.label && <span className="ord-item-variant">{snap.label}</span>}
                              <span className="ord-item-qty">Qty: {item.qty}</span>
                            </div>
                            <span className="ord-item-price">{fmt(item.line_total)}</span>
                          </div>
                        );
                      })}
                      <div className="ord-total-row">
                        <span>Order Total</span>
                        <span className="ord-final">{fmt(order.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .ord-page { min-height: 100vh; background: var(--sf-bg); font-family: var(--font-sans); padding: 40px 5% 80px; }
        .ord-inner { max-width: 800px; margin: 0 auto; }
        .ord-header { margin-bottom: 32px; }
        .ord-back { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--sf-text-muted); text-decoration: none; margin-bottom: 16px; transition: color 0.2s; }
        .ord-back:hover { color: var(--sf-accent); }
        .ord-title { font-family: var(--font-serif); font-size: 1.8rem; color: var(--sf-text-main); margin: 0 0 4px; }
        .ord-subtitle { font-size: 0.88rem; color: var(--sf-text-muted); margin: 0; }
        .ord-error { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 14px; color: #dc2626; font-size: 0.9rem; margin-bottom: 20px; }
        .ord-list { display: flex; flex-direction: column; gap: 12px; }
        .ord-card { background: #fff; border: 1px solid var(--sf-border); border-radius: 16px; overflow: hidden; }
        .ord-card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; cursor: pointer; transition: background 0.15s; gap: 12px; }
        .ord-card-header:hover { background: var(--sf-bg); }
        .ord-info { display: flex; flex-direction: column; gap: 2px; }
        .ord-num { font-weight: 700; color: var(--sf-text-main); font-size: 0.95rem; }
        .ord-date { font-size: 0.8rem; color: var(--sf-text-muted); }
        .ord-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ord-status-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.03em; }
        .ord-total { font-weight: 700; color: var(--sf-text-main); font-family: var(--font-serif); }
        .ord-chevron { transition: transform 0.25s; color: var(--sf-text-muted); flex-shrink: 0; }
        .ord-chevron.open { transform: rotate(180deg); }
        .ord-items { border-top: 1px solid var(--sf-border); padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .ord-item-row { display: flex; align-items: center; gap: 14px; }
        .ord-item-thumb { width: 52px; height: 52px; border-radius: 10px; overflow: hidden; border: 1px solid var(--sf-border); flex-shrink: 0; background: var(--sf-bg); display: flex; align-items: center; justify-content: center; }
        .ord-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ord-item-placeholder { font-size: 1.4rem; }
        .ord-item-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .ord-item-name { font-size: 0.9rem; font-weight: 600; color: var(--sf-text-main); }
        .ord-item-variant { font-size: 0.78rem; color: var(--sf-text-muted); }
        .ord-item-qty { font-size: 0.78rem; color: var(--sf-accent); font-weight: 600; }
        .ord-item-price { font-weight: 700; color: var(--sf-text-main); font-size: 0.92rem; white-space: nowrap; }
        .ord-total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px dashed var(--sf-border); font-size: 0.9rem; color: var(--sf-text-muted); }
        .ord-final { font-size: 1.05rem; font-weight: 800; color: var(--sf-text-main); font-family: var(--font-serif); }
        .ord-empty { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .ord-empty h3 { font-family: var(--font-serif); font-size: 1.5rem; color: var(--sf-text-main); margin: 0; }
        .ord-empty p { font-size: 0.9rem; color: var(--sf-text-muted); margin: 0; }
        .ord-shop-btn { padding: 12px 28px; background: var(--sf-accent); color: #fff; border-radius: 50px; font-weight: 700; text-decoration: none; font-size: 0.9rem; transition: background 0.2s; }
        .ord-shop-btn:hover { background: var(--sf-accent-dark, #166534); }
        .ord-spinner { width: 48px; height: 48px; border-radius: 50%; border: 3px solid var(--sf-border); border-top-color: var(--sf-accent); animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
