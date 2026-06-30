import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import { getCurrencySymbol } from '@/lib/utils';

export const Success: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, cssVariables } = usePageTheme('success');
  
  // Extract order ID & number from router state or fall back to localStorage to support page refreshing
  const state = location.state as { orderId?: string; orderNumber?: string } | null;
  
  const [orderId, setOrderId] = useState<string>(() => {
    return state?.orderId || localStorage.getItem('last_order_id') || '';
  });
  
  const [orderNumber, setOrderNumber] = useState<string>(() => {
    return state?.orderNumber || localStorage.getItem('last_order_number') || '';
  });

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    if (state?.orderId) {
      localStorage.setItem('last_order_id', state.orderId);
    }
    if (state?.orderNumber) {
      localStorage.setItem('last_order_number', state.orderNumber);
    }
  }, [state]);

  // Fetch complete invoice data on mount
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrderInvoice = async () => {
      try {
        const data = await catalogApi.getPublicOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order invoice details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderInvoice();
  }, [orderId]);

  if (loading) {
    return (
      <div style={cssVariables} className="success-loading-wrapper">
        <div className="success-shimmer-spinner"></div>
      </div>
    );
  }

  return (
    <div style={cssVariables} className="success-wrapper">
      <div className="success-container">
        
        {/* Animated Confirmation Card */}
        <div className="success-card success-hero-card">
          <div className="success-icon-wrapper">
            <span className="success-checkmark">✓</span>
          </div>
          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-subtitle">Thank you for your purchase. Your order details are confirmed below.</p>
          
          <div className="order-number-banner">
            Order Reference: <strong>{orderNumber || 'N/A'}</strong>
          </div>
        </div>

        {order && (
          <div className="success-details-grid">
            
            {/* Left Column: Purchase Invoice Details */}
            <div className="success-card invoice-details-card">
              <h3 className="section-title">Order Invoice Receipt</h3>
              
              <div className="invoice-items-list">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="invoice-item-row">
                    <div className="invoice-item-info">
                      <h4 className="invoice-item-name">{item.product_snap?.name || 'Skincare Product'}</h4>
                      <span className="invoice-item-qty">Qty: {item.qty} × {getCurrencySymbol(order.currency)}{item.unit_price}</span>
                    </div>
                    <span className="invoice-item-price">{getCurrencySymbol(order.currency)}{item.line_total}</span>
                  </div>
                ))}
              </div>

              <div className="invoice-totals">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{getCurrencySymbol(order.currency)}{order.subtotal}</span>
                </div>
                <div className="totals-row">
                  <span>Shipping Fee</span>
                  <span>{Number(order.shipping_amount) === 0 ? 'FREE' : `${getCurrencySymbol(order.currency)}${order.shipping_amount}`}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="totals-row discount">
                    <span>Discount</span>
                    <span>-{getCurrencySymbol(order.currency)}{order.discount_amount}</span>
                  </div>
                )}
                <div className="totals-divider"></div>
                <div className="totals-grand-row">
                  <span>Paid Total</span>
                  <span>{getCurrencySymbol(order.currency)}{order.total}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Delivery Information */}
            <div className="success-card shipping-info-card">
              <h3 className="section-title">Shipping Details</h3>
              <div className="shipping-info-body">
                <div className="info-field">
                  <span className="info-field-label">Recipient</span>
                  <span className="info-field-val">{order.shipping_address?.full_name || 'N/A'}</span>
                </div>
                <div className="info-field">
                  <span className="info-field-label">Contact Number</span>
                  <span className="info-field-val">{order.shipping_address?.phone || 'N/A'}</span>
                </div>
                <div className="info-field">
                  <span className="info-field-label">Delivery Destination</span>
                  <span className="info-field-val">
                    {order.shipping_address?.address_line1}, {order.shipping_address?.city},<br />
                    {order.shipping_address?.state} - {order.shipping_address?.postal_code}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Action Controls */}
        <div className="success-action-row">
          <Link to={`/track-order?order_number=${orderNumber}`} className="success-btn-track" style={{ background: theme.primaryColor || '#15803D' }}>
            📦 Track My Order
          </Link>
          <Link to="/products" className="success-btn-browse">
            Continue Shopping
          </Link>
        </div>

      </div>

      <style>{`
        .success-wrapper {
          background: var(--sf-bg, #FAF7F2);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: #1F2937;
          padding: 60px 24px 80px;
          box-sizing: border-box;
        }
        .success-container {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }

        /* Loading Spinner */
        .success-loading-wrapper {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sf-bg, #FAF7F2);
        }
        .success-shimmer-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(0,0,0,0.05);
          border-top-color: var(--sf-accent, #15803D);
          border-radius: 50%;
          animation: spin 0.8s infinite linear;
        }

        /* Success Cards */
        .success-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.03);
          margin-bottom: 24px;
          text-align: left;
        }
        .success-hero-card {
          text-align: center;
          padding: 48px 32px;
        }
        .success-icon-wrapper {
          width: 72px;
          height: 72px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .success-checkmark {
          font-size: 2.2rem;
          font-weight: bold;
        }
        .success-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: #111827;
          margin: 0 0 12px;
          letter-spacing: -0.02em;
        }
        .success-subtitle {
          font-size: 0.95rem;
          color: #6B7280;
          max-width: 480px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }
        .order-number-banner {
          display: inline-block;
          background: #F3F4F6;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 0.88rem;
          color: #4B5563;
        }

        /* Details Grid */
        .success-details-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 20px;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          padding-bottom: 10px;
        }

        /* Invoice */
        .invoice-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .invoice-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .invoice-item-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }
        .invoice-item-qty {
          font-size: 0.78rem;
          color: #9CA3AF;
          font-weight: 600;
        }
        .invoice-item-price {
          font-size: 0.88rem;
          font-weight: 800;
          color: #111827;
        }

        .invoice-totals {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #6B7280;
          font-weight: 600;
        }
        .totals-row.discount {
          color: #16A34A;
        }
        .totals-divider {
          height: 1px;
          background: rgba(0,0,0,0.04);
          margin: 6px 0;
        }
        .totals-grand-row {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 850;
          color: #111827;
        }

        /* Shipping Details */
        .shipping-info-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .info-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .info-field-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .info-field-val {
          font-size: 0.88rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.5;
        }

        /* Actions row */
        .success-action-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
        }
        .success-btn-track {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 32px;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
          font-size: 0.9rem;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.25);
          transition: all 0.2s;
        }
        .success-btn-track:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .success-btn-browse {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 32px;
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.08);
          color: #4B5563;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .success-btn-browse:hover {
          background: #F9FAFB;
          border-color: rgba(0,0,0,0.12);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleUp {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .success-details-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .success-action-row {
            flex-direction: column;
            gap: 12px;
            width: 100%;
          }
          .success-btn-track, .success-btn-browse {
            width: 100%;
            box-sizing: border-box;
          }
          .success-wrapper {
            padding: 40px 16px 60px;
          }
        }
      `}</style>
    </div>
  );
};
