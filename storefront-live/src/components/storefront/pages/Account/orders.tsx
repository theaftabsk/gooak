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
        .ord-page { 
          min-height: 100vh; 
          background: var(--sf-bg, #FAF7F2); 
          font-family: 'Inter', sans-serif; 
          padding: 60px 5% 100px; 
          color: #374151;
        }
        .ord-inner { 
          max-width: 860px; 
          margin: 0 auto; 
        }
        .ord-header { 
          margin-bottom: 36px; 
          text-align: left;
        }
        .ord-back { 
          display: inline-flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 0.88rem; 
          color: #6B7280; 
          text-decoration: none; 
          margin-bottom: 20px; 
          font-weight: 600;
          transition: color 0.2s ease; 
        }
        .ord-back:hover { 
          color: var(--sf-accent, #15803D); 
        }
        .ord-title { 
          font-family: 'Outfit', sans-serif; 
          font-size: 2.5rem; 
          font-weight: 800;
          color: #111827; 
          margin: 0 0 6px; 
          letter-spacing: -0.02em;
        }
        .ord-subtitle { 
          font-size: 0.95rem; 
          color: #6B7280; 
          margin: 0; 
          font-weight: 500;
        }
        .ord-error { 
          background: #fef2f2; 
          border: 1px solid #fca5a5; 
          border-radius: 12px; 
          padding: 16px 20px; 
          color: #dc2626; 
          font-size: 0.9rem; 
          font-weight: 600;
          margin-bottom: 24px; 
        }
        .ord-list { 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
        }
        .ord-card { 
          background: #ffffff; 
          border: 1px solid rgba(0,0,0,0.04); 
          border-radius: 20px; 
          overflow: hidden; 
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.02), 0 4px 10px rgba(0, 0, 0, 0.01);
          transition: box-shadow 0.25s ease;
        }
        .ord-card:hover {
          box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.04);
        }
        .ord-card-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 24px 28px; 
          cursor: pointer; 
          transition: background 0.2s ease; 
          gap: 20px; 
          user-select: none;
        }
        @media(max-width: 600px) {
          .ord-card-header { 
            flex-direction: column; 
            align-items: flex-start; 
            padding: 20px 24px;
            gap: 12px;
          }
          .ord-meta {
            width: 100%;
            justify-content: space-between;
          }
        }
        .ord-card-header:hover { 
          background: rgba(0,0,0,0.01); 
        }
        .ord-info { 
          display: flex; 
          flex-direction: column; 
          gap: 4px; 
          flex: 1;
        }
        .ord-num { 
          font-family: 'Outfit', sans-serif;
          font-weight: 800; 
          color: #111827; 
          font-size: 1.1rem; 
        }
        .ord-date { 
          font-size: 0.82rem; 
          color: #6B7280; 
          font-weight: 500;
        }
        .ord-meta { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
        }
        .ord-status-badge { 
          font-size: 0.72rem; 
          font-weight: 800; 
          padding: 6px 14px; 
          border-radius: 50px; 
          letter-spacing: 0.04em; 
          text-transform: uppercase;
          box-shadow: inset 0 -1px 0 rgba(0,0,0,0.04);
        }
        .ord-total { 
          font-family: 'Outfit', sans-serif;
          font-weight: 800; 
          color: #111827; 
          font-size: 1.1rem;
        }
        .ord-chevron { 
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          color: #9CA3AF; 
          flex-shrink: 0; 
        }
        .ord-chevron.open { 
          transform: rotate(180deg); 
          color: var(--sf-accent, #15803D);
        }
        .ord-items { 
          border-top: 1px solid rgba(0,0,0,0.04); 
          padding: 24px 28px; 
          display: flex; 
          flex-direction: column; 
          gap: 16px; 
          background: rgba(0,0,0,0.005);
        }
        .ord-item-row { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
        }
        .ord-item-thumb { 
          width: 56px; 
          height: 56px; 
          border-radius: 12px; 
          overflow: hidden; 
          border: 1px solid rgba(0,0,0,0.06); 
          flex-shrink: 0; 
          background: #ffffff; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }
        .ord-item-thumb img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
        }
        .ord-item-placeholder { 
          font-size: 1.4rem; 
        }
        .ord-item-details { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          gap: 2px; 
          text-align: left;
        }
        .ord-item-name { 
          font-size: 0.92rem; 
          font-weight: 700; 
          color: #111827; 
        }
        .ord-item-variant { 
          font-size: 0.78rem; 
          color: #6B7280; 
          font-weight: 500;
        }
        .ord-item-qty { 
          font-size: 0.78rem; 
          color: var(--sf-accent, #15803D); 
          font-weight: 700; 
        }
        .ord-item-price { 
          font-family: 'Outfit', sans-serif;
          font-weight: 700; 
          color: #111827; 
          font-size: 0.95rem; 
          white-space: nowrap; 
        }
        .ord-total-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding-top: 16px; 
          border-top: 1px dashed rgba(0,0,0,0.06); 
          font-size: 0.9rem; 
          color: #6B7280; 
          font-weight: 600;
        }
        .ord-final { 
          font-size: 1.25rem; 
          font-weight: 900; 
          color: #111827; 
          font-family: 'Outfit', sans-serif; 
        }
        .ord-empty { 
          text-align: center; 
          padding: 80px 40px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 16px; 
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.04);
          border-radius: 24px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.03);
        }
        .ord-empty h3 { 
          font-family: 'Outfit', sans-serif; 
          font-size: 1.6rem; 
          font-weight: 800;
          color: #111827; 
          margin: 0; 
        }
        .ord-empty p { 
          font-size: 0.95rem; 
          color: #6B7280; 
          margin: 0; 
          font-weight: 500;
        }
        .ord-shop-btn { 
          padding: 14px 36px; 
          background: var(--sf-accent, #15803D); 
          color: #fff; 
          border-radius: 50px; 
          font-weight: 700; 
          text-decoration: none; 
          font-size: 0.92rem; 
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 10px 20px -5px rgba(21, 128, 61, 0.3);
          transition: all 0.2s ease; 
        }
        .ord-shop-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(21, 128, 61, 0.4);
          filter: brightness(1.05);
        }
        .ord-spinner { 
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          border: 3.5px solid rgba(0,0,0,0.06); 
          border-top-color: var(--sf-accent, #15803D); 
          animation: spin 0.9s linear infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
