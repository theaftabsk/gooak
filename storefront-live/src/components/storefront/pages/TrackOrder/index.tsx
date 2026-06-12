import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { catalogApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { STATIC_PAGE_STYLES } from '../About/index';

export const TrackOrder: React.FC = () => {
  const { cssVariables } = usePageTheme('track-order');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Auto-search if query parameters are present on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderNum = searchParams.get('order_number') || (location.state as any)?.orderNumber || '';
    if (orderNum) {
      setQuery(orderNum);
      
      const triggerAutoTrack = async () => {
        setLoading(true);
        setError(null);
        setOrder(null);
        try {
          const data = await catalogApi.getPublicOrder(orderNum);
          if (data) {
            setOrder(data);
          } else {
            setError('Order not found. Please verify the code.');
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Order not found. Please check the order number and try again.');
        } finally {
          setLoading(false);
        }
      };
      
      triggerAutoTrack();
    }
  }, [location]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const data = await catalogApi.getPublicOrder(query.trim());
      if (data) {
        setOrder(data);
      } else {
        setError('Order not found. Please verify the code.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Order not found. Please check the order number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
      case 'confirmed': return { bg: '#DBEAFE', text: '#2563EB', label: 'Confirmed' };
      case 'processing': return { bg: '#E0F2FE', text: '#0284C7', label: 'Processing' };
      case 'shipped': return { bg: '#F5F3FF', text: '#7C3AED', label: 'Shipped' };
      case 'delivered': return { bg: '#D1FAE5', text: '#059669', label: 'Delivered' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled' };
      default: return { bg: '#F3F4F6', text: '#4B5563', label: status };
    }
  };

  const formatAddress = (addr: any) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.postal_code,
      addr.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div className="sp-hero track-hero">
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title">Track Your Order</h1>
          <p className="sp-hero-sub">Enter your Order ID or reference number below to trace its delivery status.</p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container" style={{ maxWidth: '680px' }}>
          {/* Tracking Form */}
          <div className="track-card select-card">
            <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Enter Order ID (e.g. ORD-100234)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  borderRadius: '30px',
                  border: '1px solid var(--sf-border, #E2E8F0)',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
                disabled={loading}
                required
              />
              <button
                type="submit"
                style={{
                  background: 'var(--sf-primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '30px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap'
                }}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '16px',
              padding: '16px 20px',
              color: '#B91C1C',
              fontSize: '0.9rem',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tracking Details Results */}
          {order && (
            <div className="track-results-container">
              {/* Order Status Header */}
              <div className="track-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--sf-text-main)' }}>
                    Order {order.order_number}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                    Placed on: {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                <div>
                  {(() => {
                    const sc = getStatusColor(order.status);
                    return (
                      <span style={{
                        background: sc.bg,
                        color: sc.text,
                        padding: '6px 14px',
                        borderRadius: '99px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {sc.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="track-card" style={{ padding: '30px 24px' }}>
                <h4 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700, color: 'var(--sf-text-main)' }}>
                  Delivery Progress
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px' }}>
                  {/* Vertical bar */}
                  <div style={{
                    position: 'absolute',
                    left: '6px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'var(--sf-border, #E2E8F0)'
                  }} />

                  {/* Step 1: Placed */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '3px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'var(--sf-primary)',
                      border: '3px solid #fff',
                      boxShadow: '0 0 0 2px var(--sf-primary)'
                    }} />
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>Order Placed</strong>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>We have received your order details.</span>
                  </div>

                  {/* Step 2: Confirmed/Processing */}
                  {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status.toLowerCase()) && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '3px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--sf-primary)',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 2px var(--sf-primary)'
                      }} />
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>Confirmed</strong>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>The shop is preparing your shipment.</span>
                    </div>
                  )}

                  {/* Step 3: Shipped */}
                  {['shipped', 'delivered'].includes(order.status.toLowerCase()) && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '3px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--sf-primary)',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 2px var(--sf-primary)'
                      }} />
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>Shipped</strong>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Your package is in transit with our logistics partner.</span>
                    </div>
                  )}

                  {/* Step 4: Delivered */}
                  {order.status.toLowerCase() === 'delivered' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '3px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 2px #10B981'
                      }} />
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#10B981' }}>Delivered</strong>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Your order has been successfully delivered. Thank you!</span>
                    </div>
                  )}

                  {/* Cancelled state */}
                  {order.status.toLowerCase() === 'cancelled' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '3px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#DC2626',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 2px #DC2626'
                      }} />
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: '#DC2626' }}>Order Cancelled</strong>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>This order has been cancelled. Please contact support.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="track-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--sf-text-main)' }}>
                  Delivery Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>
                      {typeof order.shipping_address === 'object' ? order.shipping_address?.name || 'Customer' : 'Customer'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Address</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--sf-text-main)', lineHeight: '1.4' }}>
                      {formatAddress(order.shipping_address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items & Totals */}
              <div className="track-card" style={{ padding: '24px 0' }}>
                <h4 style={{ margin: '0 24px 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--sf-text-main)' }}>
                  Order Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {order.items?.map((item: any, i: number) => {
                    const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap || {};
                    return (
                      <div key={item.id || i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 24px',
                        borderBottom: i === order.items.length - 1 ? 'none' : '1px solid var(--sf-border, #E2E8F0)'
                      }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {snap.image_url && (
                            <img src={snap.image_url} alt={snap.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                          )}
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>
                              {snap.name || 'Product'}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                              Qty: {item.qty} × {Number(item.unit_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--sf-text-main)' }}>
                          {(Number(item.qty) * Number(item.unit_price)).toFixed(2)}
                        </strong>
                      </div>
                    );
                  })}

                  {/* Totals Summary */}
                  <div style={{
                    marginTop: '12px',
                    padding: '16px 24px 0',
                    borderTop: '1px dashed var(--sf-border, #E2E8F0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'right'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                      <span>Subtotal:</span>
                      <strong style={{ color: 'var(--sf-text-main)', width: '100px' }}>{Number(order.subtotal).toFixed(2)}</strong>
                    </div>
                    {Number(order.shipping_amount) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                        <span>Shipping:</span>
                        <strong style={{ color: 'var(--sf-text-main)', width: '100px' }}>+{Number(order.shipping_amount).toFixed(2)}</strong>
                      </div>
                    )}
                    {Number(order.discount_amount) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                        <span>Discount:</span>
                        <strong style={{ color: '#059669', width: '100px' }}>-{Number(order.discount_amount).toFixed(2)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', fontSize: '1.05rem', color: 'var(--sf-text-main)', marginTop: '4px' }}>
                      <span>Total:</span>
                      <strong style={{ color: 'var(--sf-primary)', width: '100px' }}>{Number(order.total).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        ${STATIC_PAGE_STYLES}
        .track-hero {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
          border-bottom: 1px solid #bfdbfe;
        }
        .track-card {
          background: #fff;
          border: 1px solid var(--sf-border, #E2E8F0);
          border-radius: 18px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
        }
        .track-results-container {
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;
