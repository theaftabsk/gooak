'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/context/CustomerContext';
import { customerApi } from '@/lib/api-client';
import { getCurrencySymbol } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'Pending',    color: '#92400e', bg: '#fffbeb', dot: '#F59E0B' },
  confirmed:  { label: 'Confirmed',  color: '#1d4ed8', bg: '#eff6ff', dot: '#3B82F6' },
  processing: { label: 'Processing', color: '#6d28d9', bg: '#f5f3ff', dot: '#8B5CF6' },
  shipped:    { label: 'Shipped',    color: '#0e7490', bg: '#ecfeff', dot: '#06B6D4' },
  delivered:  { label: 'Delivered',  color: '#15803D', bg: '#f0fdf4', dot: '#22C55E' },
  cancelled:  { label: 'Cancelled',  color: '#dc2626', bg: '#fef2f2', dot: '#EF4444' },
  refunded:   { label: 'Refunded',   color: '#6b7280', bg: '#f9fafb', dot: '#9CA3AF' },
};

const STEP_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export const MyOrders: React.FC = () => {
  const { customer, token, isLoading } = useCustomer();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !customer) { navigate('/login?redirect=/account/orders'); return; }
  }, [customer, isLoading, navigate]);

  useEffect(() => {
    if (!token) return;
    customerApi.getMyOrders(token)
      .then(data => setOrders(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const fmt = (v: any) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const getStepIndex = (status: string) => STEP_ORDER.indexOf(status);

  const formatAddress = (addr: any): string => {
    if (!addr) return '';
    const parts = [
      addr.address_line1 || addr.line1 || addr.address,
      addr.address_line2 || addr.line2,
      addr.city,
      addr.state,
      addr.postal_code || addr.zip,
      addr.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  if (loading || isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ord-spinner" />
    </div>
  );

  return (
    <div className="ord-page">
      <div className="ord-inner">
        {/* Header */}
        <div className="ord-header">
          <a href="/account" className="ord-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            My Account
          </a>
          <div className="ord-header-row">
            <div>
              <h1 className="ord-title">My Orders</h1>
              <p className="ord-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
            </div>
            <a href="/track-order" className="ord-track-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Track an Order
            </a>
          </div>
        </div>

        {error && <div className="ord-error">⚠ {error}</div>}

        {!error && orders.length === 0 ? (
          <div className="ord-empty">
            <div className="ord-empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <h3>No orders yet</h3>
            <p>Start shopping and your orders will appear here.</p>
            <a href="/products" className="ord-shop-btn">Browse Products</a>
          </div>
        ) : (
          <div className="ord-list">
            {orders.map(order => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isOpen = expanded === order.id;
              const stepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
              const itemCount = (order.items || []).reduce((s: number, i: any) => s + (i.qty || 1), 0);

              return (
                <div key={order.id} className={`ord-card ${isOpen ? 'open' : ''}`}>
                  {/* Card Header — always visible */}
                  <div className="ord-card-header" onClick={() => setExpanded(isOpen ? null : order.id)}>
                    <div className="ord-card-left">
                      <div className="ord-num-wrap">
                        <span className="ord-num">#{order.order_number}</span>
                        <span className="ord-item-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="ord-date">{fmtDate(order.created_at)} at {fmtTime(order.created_at)}</span>
                    </div>
                    <div className="ord-card-right">
                      <span className="ord-status-badge" style={{ color: st.color, background: st.bg }}>
                        <span className="ord-status-dot" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                      <span className="ord-total">{fmt(order.total)}</span>
                      <svg className={`ord-chevron ${isOpen ? 'open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expandable detail */}
                  {isOpen && (
                    <div className="ord-detail">
                      {/* Progress Tracker */}
                      {!isCancelled && stepIdx >= 0 && (
                        <div className="ord-progress-wrap">
                          <div className="ord-progress-track">
                            {STEP_ORDER.map((step, i) => {
                              const done = i <= stepIdx;
                              const active = i === stepIdx;
                              return (
                                <React.Fragment key={step}>
                                  <div className="ord-step">
                                    <div className={`ord-step-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                                      {done && !active && (
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                      )}
                                    </div>
                                    <span className={`ord-step-label ${done ? 'done' : ''}`}>
                                      {STATUS_CONFIG[step]?.label}
                                    </span>
                                  </div>
                                  {i < STEP_ORDER.length - 1 && (
                                    <div className={`ord-step-line ${i < stepIdx ? 'done' : ''}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="ord-cancelled-banner">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          This order has been {order.status}.
                        </div>
                      )}

                      {/* Items */}
                      <div className="ord-section">
                        <h4 className="ord-section-title">Order Items</h4>
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
                                  {snap.label && <span className="ord-item-variant">Variant: {snap.label}</span>}
                                  <span className="ord-item-qty">Qty × {item.qty}</span>
                                </div>
                                <div className="ord-item-pricing">
                                  <span className="ord-item-price">{fmt(item.line_total)}</span>
                                  {item.qty > 1 && (
                                    <span className="ord-item-unit">{fmt(item.unit_price)} each</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Breakdown + Address side by side */}
                      <div className="ord-bottom-grid">
                        {/* Shipping Address */}
                        {order.shipping_address && (
                          <div className="ord-address-box">
                            <h4 className="ord-section-title">Shipping Address</h4>
                            <div className="ord-address-card">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sf-accent,#15803D)" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              <p className="ord-address-text">{formatAddress(order.shipping_address)}</p>
                            </div>
                            {order.notes && (
                              <div className="ord-notes">
                                <span className="ord-notes-label">Note:</span> {order.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price breakdown */}
                        <div className="ord-breakdown-box">
                          <h4 className="ord-section-title">Price Breakdown</h4>
                          <div className="ord-breakdown">
                            <div className="ord-row"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                            {Number(order.shipping_amount) > 0 && (
                              <div className="ord-row"><span>Shipping</span><span>{fmt(order.shipping_amount)}</span></div>
                            )}
                            {Number(order.discount_amount) > 0 && (
                              <div className="ord-row discount"><span>Discount</span><span>−{fmt(order.discount_amount)}</span></div>
                            )}
                            {Number(order.tax_amount) > 0 && (
                              <div className="ord-row"><span>Tax</span><span>{fmt(order.tax_amount)}</span></div>
                            )}
                            <div className="ord-row total">
                              <span>Total</span>
                              <span>{fmt(order.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ord-actions">
                        <a
                          href={`/track-order?order_number=${order.order_number}`}
                          className="ord-action-btn secondary"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          Track Order
                        </a>
                        <a href="/products" className="ord-action-btn primary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                          Buy Again
                        </a>
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        .ord-page {
          min-height: 100vh;
          background: var(--sf-bg, #FAF7F2);
          font-family: 'Inter', sans-serif;
          padding: 60px 5% 100px;
          color: #374151;
        }
        .ord-inner { max-width: 900px; margin: 0 auto; }

        /* Header */
        .ord-header { margin-bottom: 40px; }
        .ord-back {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.84rem; color: #6B7280; text-decoration: none;
          margin-bottom: 20px; font-weight: 600; transition: color 0.2s ease;
        }
        .ord-back:hover { color: var(--sf-accent, #15803D); }
        .ord-header-row {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
        }
        .ord-title {
          font-family: 'Outfit', sans-serif; font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 900; color: #111827; margin: 0 0 4px; letter-spacing: -0.025em;
        }
        .ord-subtitle { font-size: 0.9rem; color: #9CA3AF; margin: 0; font-weight: 500; }
        .ord-track-link {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 50px;
          border: 1.5px solid rgba(0,0,0,0.08); background: #fff;
          color: #374151; text-decoration: none; font-size: 0.83rem; font-weight: 600;
          transition: all 0.2s ease; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ord-track-link:hover { border-color: var(--sf-accent,#15803D); color: var(--sf-accent,#15803D); transform: translateY(-1px); }

        /* Error */
        .ord-error {
          background: #fef2f2; border: 1px solid #fca5a5; border-radius: 14px;
          padding: 16px 20px; color: #dc2626; font-size: 0.9rem; font-weight: 600; margin-bottom: 24px;
        }

        /* List */
        .ord-list { display: flex; flex-direction: column; gap: 18px; }

        /* Card */
        .ord-card {
          background: #ffffff; border: 1px solid rgba(0,0,0,0.05);
          border-radius: 22px; overflow: hidden;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
          transition: box-shadow 0.25s ease;
        }
        .ord-card.open { box-shadow: 0 12px 40px -8px rgba(0,0,0,0.08); }
        .ord-card:hover { box-shadow: 0 8px 30px -6px rgba(0,0,0,0.06); }

        /* Card Header */
        .ord-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; cursor: pointer; user-select: none;
          transition: background 0.15s ease; gap: 16px;
        }
        .ord-card-header:hover { background: rgba(0,0,0,0.008); }
        .ord-card-left { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .ord-num-wrap { display: flex; align-items: center; gap: 10px; }
        .ord-num {
          font-family: 'Outfit', sans-serif; font-weight: 900; color: #111827; font-size: 1.08rem;
        }
        .ord-item-count {
          font-size: 0.72rem; font-weight: 700; color: #9CA3AF;
          background: rgba(0,0,0,0.03); padding: 3px 10px; border-radius: 50px;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ord-date { font-size: 0.8rem; color: #9CA3AF; font-weight: 500; }
        .ord-card-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

        .ord-status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.72rem; font-weight: 800; padding: 6px 14px;
          border-radius: 50px; letter-spacing: 0.04em; text-transform: uppercase;
          box-shadow: inset 0 -1px 0 rgba(0,0,0,0.06);
        }
        .ord-status-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .ord-total {
          font-family: 'Outfit', sans-serif; font-weight: 900; color: #111827; font-size: 1.08rem;
        }
        .ord-chevron { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); color: #D1D5DB; flex-shrink: 0; }
        .ord-chevron.open { transform: rotate(180deg); color: var(--sf-accent, #15803D); }

        /* Detail Panel */
        .ord-detail {
          border-top: 1px solid rgba(0,0,0,0.04);
          animation: slideDown 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        /* Progress */
        .ord-progress-wrap { padding: 28px 28px 20px; background: rgba(0,0,0,0.008); }
        .ord-progress-track {
          display: flex; align-items: flex-start; justify-content: space-between;
          position: relative; gap: 4px;
        }
        .ord-step { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
        .ord-step-dot {
          width: 28px; height: 28px; border-radius: 50%;
          background: #E5E7EB; border: 2.5px solid #E5E7EB;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; transition: all 0.3s ease; flex-shrink: 0;
        }
        .ord-step-dot.done { background: var(--sf-accent, #15803D); border-color: var(--sf-accent, #15803D); }
        .ord-step-dot.active {
          background: #fff; border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 4px rgba(21,128,61,0.12);
        }
        .ord-step-dot.active::after {
          content: ''; position: absolute; width: 10px; height: 10px;
          border-radius: 50%; background: var(--sf-accent, #15803D);
        }
        .ord-step-label {
          font-size: 0.7rem; font-weight: 600; color: #9CA3AF;
          text-align: center; line-height: 1.2;
          transition: color 0.3s ease;
        }
        .ord-step-label.done { color: var(--sf-accent, #15803D); }
        .ord-step-line {
          flex: 1; height: 2px; background: #E5E7EB;
          margin-top: 13px; align-self: flex-start; border-radius: 2px;
          transition: background 0.4s ease;
        }
        .ord-step-line.done { background: var(--sf-accent, #15803D); }

        /* Cancelled Banner */
        .ord-cancelled-banner {
          display: flex; align-items: center; gap: 10px;
          margin: 24px 28px 0; padding: 14px 18px;
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
          color: #dc2626; font-size: 0.88rem; font-weight: 600;
        }

        /* Section */
        .ord-section { padding: 24px 28px; }
        .ord-section-title {
          font-family: 'Outfit', sans-serif; font-size: 0.78rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.07em; color: #9CA3AF;
          margin: 0 0 16px;
        }

        /* Items */
        .ord-items { display: flex; flex-direction: column; gap: 14px; }
        .ord-item-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);
          transition: background 0.15s ease;
        }
        .ord-item-row:hover { background: rgba(0,0,0,0.03); }
        .ord-item-thumb {
          width: 60px; height: 60px; border-radius: 12px;
          overflow: hidden; border: 1px solid rgba(0,0,0,0.06);
          flex-shrink: 0; background: #ffffff;
          display: flex; align-items: center; justify-content: center;
        }
        .ord-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .ord-item-placeholder { font-size: 1.5rem; }
        .ord-item-details { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .ord-item-name { font-size: 0.9rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ord-item-variant { font-size: 0.76rem; color: #6B7280; font-weight: 500; }
        .ord-item-qty { font-size: 0.76rem; color: var(--sf-accent, #15803D); font-weight: 700; }
        .ord-item-pricing { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
        .ord-item-price { font-family: 'Outfit', sans-serif; font-weight: 800; color: #111827; font-size: 0.95rem; }
        .ord-item-unit { font-size: 0.72rem; color: #9CA3AF; font-weight: 500; }

        /* Bottom Grid */
        .ord-bottom-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        @media(max-width: 640px) { .ord-bottom-grid { grid-template-columns: 1fr; } }

        .ord-address-box { padding: 24px 28px; border-right: 1px solid rgba(0,0,0,0.04); }
        @media(max-width: 640px) { .ord-address-box { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.04); } }
        .ord-address-card {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 14px 16px; background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.04); border-radius: 12px;
        }
        .ord-address-text { font-size: 0.85rem; color: #374151; line-height: 1.6; margin: 0; font-weight: 500; }
        .ord-notes { margin-top: 10px; font-size: 0.8rem; color: #6B7280; font-style: italic; }
        .ord-notes-label { font-weight: 700; font-style: normal; color: #374151; }

        .ord-breakdown-box { padding: 24px 28px; }
        .ord-breakdown { display: flex; flex-direction: column; gap: 10px; }
        .ord-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.875rem; color: #6B7280; font-weight: 500;
        }
        .ord-row.discount { color: #15803D; }
        .ord-row.total {
          padding-top: 12px; margin-top: 4px; border-top: 2px dashed rgba(0,0,0,0.06);
          font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.1rem; color: #111827;
        }

        /* Actions */
        .ord-actions {
          display: flex; gap: 12px; padding: 20px 28px 24px;
          border-top: 1px solid rgba(0,0,0,0.04);
        }
        .ord-action-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 22px; border-radius: 50px;
          font-size: 0.84rem; font-weight: 700; text-decoration: none;
          transition: all 0.2s ease; font-family: 'Inter', sans-serif;
        }
        .ord-action-btn.secondary {
          background: #fff; border: 1.5px solid rgba(0,0,0,0.1); color: #374151;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ord-action-btn.secondary:hover { border-color: var(--sf-accent,#15803D); color: var(--sf-accent,#15803D); transform: translateY(-1px); }
        .ord-action-btn.primary {
          background: var(--sf-accent, #15803D); color: #fff; border: none;
          box-shadow: 0 8px 20px -5px rgba(21,128,61,0.3);
        }
        .ord-action-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -5px rgba(21,128,61,0.4); filter: brightness(1.05); }

        /* Empty */
        .ord-empty {
          text-align: center; padding: 80px 40px;
          display: flex; flex-direction: column; align-items: center; gap: 18px;
          background: #ffffff; border: 1px solid rgba(0,0,0,0.04);
          border-radius: 24px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.04);
        }
        .ord-empty-icon {
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center;
          color: #D1D5DB;
        }
        .ord-empty h3 { font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0; }
        .ord-empty p { font-size: 0.95rem; color: #9CA3AF; margin: 0; font-weight: 500; }
        .ord-shop-btn {
          padding: 14px 36px; background: var(--sf-accent, #15803D); color: #fff;
          border-radius: 50px; font-weight: 800; text-decoration: none;
          font-size: 0.92rem; font-family: 'Outfit', sans-serif;
          box-shadow: 0 10px 20px -5px rgba(21,128,61,0.3); transition: all 0.2s ease;
        }
        .ord-shop-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 28px -5px rgba(21,128,61,0.4); filter: brightness(1.05); }

        /* Spinner */
        .ord-spinner {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3.5px solid rgba(0,0,0,0.06); border-top-color: var(--sf-accent, #15803D);
          animation: spin 0.85s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media(max-width: 600px) {
          .ord-page { padding: 40px 4% 80px; }
          .ord-card-header { flex-wrap: wrap; padding: 18px 20px; }
          .ord-card-right { width: 100%; justify-content: space-between; }
          .ord-section { padding: 20px; }
          .ord-address-box, .ord-breakdown-box { padding: 20px; }
          .ord-actions { padding: 16px 20px 20px; flex-wrap: wrap; }
          .ord-action-btn { flex: 1; justify-content: center; }
          .ord-progress-wrap { padding: 20px; }
          .ord-step-label { font-size: 0.62rem; }
        }
      `}</style>
    </div>
  );
};
