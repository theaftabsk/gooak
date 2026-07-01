'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogApi, paymentApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import { getCurrencySymbol } from '@/lib/utils';

export const Payment: React.FC<{ orderId: string }> = ({ orderId }) => {

  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const { theme, cssVariables } = usePageTheme('payment');
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbank' | 'wallet'>('upi');

  // Load Order details on mount
  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const orderData = await catalogApi.getPublicOrder(orderId);
        setOrder(orderData);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load order information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId]);

  // Load Razorpay Script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Razorpay) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => console.warn('Razorpay SDK failed to load. Simulation fallback active.');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle Real Razorpay Payment Modal
  const handleRealPayment = async () => {
    if (!orderId || !order) return;
    setPaying(true);
    setErrorMsg('');

    try {
      const details = await paymentApi.initializeRazorpayPayment(orderId);
      
      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK is not loaded. Please use Sandbox simulation.');
      }

      const options = {
        key: details.razorpay_key_id,
        amount: Math.round(Number(details.total) * 100),
        currency: details.currency || 'INR',
        name: 'OakSol Storefront',
        description: `Payment for Order ${details.order_number}`,
        order_id: details.razorpay_order_id,
        handler: async function (response: any) {
          try {
            setPaying(true);
            await paymentApi.verifyPayment({
              orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            localStorage.setItem('last_order_id', orderId); localStorage.setItem('last_order_number', order.order_number); navigate('/order-success');
          } catch (verifyErr: any) {
            setErrorMsg(verifyErr.message || 'Payment signature verification failed.');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: order.shipping_address?.full_name || '',
          email: order.customer_email || '',
          contact: order.shipping_address?.phone || '',
          method: selectedMethod
        },
        theme: {
          color: theme.primaryColor || '#15803D'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize payment.');
      setPaying(false);
    }
  };

  // Handle Sandbox Simulated Payment Success
  const handleSimulateSuccess = async () => {
    if (!orderId || !order) return;
    setPaying(true);
    setErrorMsg('');

    try {
      const result = await paymentApi.simulatePayment(orderId);
      localStorage.setItem('last_order_id', orderId); localStorage.setItem('last_order_number', order.order_number); navigate('/order-success');
      console.log('Sandbox simulation success:', result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sandbox simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={cssVariables} className="payment-loading-wrapper">
        <div className="payment-shimmer-circle"></div>
        <div className="payment-shimmer-line short"></div>
        <div className="payment-shimmer-line"></div>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div style={cssVariables} className="payment-error-page">
        <div className="error-card">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h2 className="error-title">Order Processing Error</h2>
          <p className="error-message">{errorMsg}</p>
          <button onClick={() => navigate('/products')} className="error-action-btn" style={{ background: theme.primaryColor || '#111827' }}>
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(order.currency);

  return (
    <div style={cssVariables} className="payment-wrapper">
      <div className="payment-container">
        
        {/* Header Summary */}
        <div className="payment-header-card">
          <div className="payment-secure-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            SECURE CHECKOUT GATEWAY
          </div>
          <h1 className="payment-amount">{currencySymbol}{parseFloat(order.total).toFixed(2)}</h1>
          <p className="payment-order-meta">
            Order Number: <strong>{order.order_number}</strong> • Status: <span className="status-badge pending">Pending Payment</span>
          </p>
        </div>

        {/* Content Columns */}
        <div className="payment-content-grid">
          
          {/* Details Column */}
          <div className="payment-details-card">
            <h3 className="section-title">Delivery Details</h3>
            <div className="details-info-row">
              <span className="info-label">Recipient:</span>
              <span className="info-value">{order.shipping_address?.full_name}</span>
            </div>
            <div className="details-info-row">
              <span className="info-label">Contact:</span>
              <span className="info-value">{order.shipping_address?.phone}</span>
            </div>
            <div className="details-info-row" style={{ borderBottom: 'none' }}>
              <span className="info-label">Shipping Address:</span>
              <span className="info-value" style={{ textAlign: 'right', maxWidth: '240px' }}>
                {order.shipping_address?.address_line1}, {order.shipping_address?.city},{' '}
                {order.shipping_address?.state} - {order.shipping_address?.postal_code}
              </span>
            </div>

            <h3 className="section-title mt-6">Order Summary</h3>
            <div className="payment-items-summary">
              {order.items?.map((item: any) => (
                <div key={item.id} className="payment-summary-item-row">
                  <span className="item-name">{item.product_snap?.name || 'Skincare Product'} x {item.qty}</span>
                  <span className="item-price">{currencySymbol}{parseFloat(item.line_total).toFixed(2)}</span>
                </div>
              ))}
              <div className="payment-total-divider"></div>
              <div className="payment-total-summary-row">
                <span>Grand Total:</span>
                <span style={{ color: theme.primaryColor || '#15803D' }}>{currencySymbol}{parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Gateways Action Column */}
          <div className="payment-actions-card">
            <h3 className="section-title">Select Payment Method</h3>
            
            {/* Custom Payment Methods Selector List */}
            <div className="payment-methods-grid">
              <div 
                className={`pm-option-box ${selectedMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('upi')}
              >
                <div className="pm-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <div className="pm-option-text">
                  <div className="pm-title">UPI / PhonePe / GPay</div>
                  <div className="pm-sub">Pay via PhonePe, Google Pay, Paytm UPI</div>
                </div>
                <div className="pm-checkbox" />
              </div>

              <div 
                className={`pm-option-box ${selectedMethod === 'card' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('card')}
              >
                <div className="pm-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </div>
                <div className="pm-option-text">
                  <div className="pm-title">Credit & Debit Cards</div>
                  <div className="pm-sub">Visa, Mastercard, RuPay, Maestro</div>
                </div>
                <div className="pm-checkbox" />
              </div>

              <div 
                className={`pm-option-box ${selectedMethod === 'netbank' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('netbank')}
              >
                <div className="pm-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 22v-4h18v4H3zM6 18V9h3v9H6zm5 0V9h3v9h-3zm5 0V9h3v9h-3zM3 9l9-7 9 7H3z"/>
                  </svg>
                </div>
                <div className="pm-option-text">
                  <div className="pm-title">Net Banking</div>
                  <div className="pm-sub">All major Indian banks supported</div>
                </div>
                <div className="pm-checkbox" />
              </div>

              <div 
                className={`pm-option-box ${selectedMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setSelectedMethod('wallet')}
              >
                <div className="pm-option-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h14v4M4 6v12a2 2 0 0 0 2 2h14v-4M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
                  </svg>
                </div>
                <div className="pm-option-text">
                  <div className="pm-title">Wallets</div>
                  <div className="pm-sub">Mobikwik, Freecharge, etc.</div>
                </div>
                <div className="pm-checkbox" />
              </div>
            </div>
            
            {errorMsg && (
              <div className="payment-inline-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {errorMsg}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handleRealPayment}
              disabled={paying}
              className="gateway-btn-primary"
              style={{ background: theme.primaryColor || '#15803D' }}
            >
              {paying ? 'Processing Gateway...' : sdkLoaded ? 'Pay Online (Razorpay UI)' : 'Gateway Loading...'}
            </button>

            {/* Sandbox Simulation container */}
            <div className="sandbox-panel">
              <div className="sandbox-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12M12 3v12M9 12h6M5 21h14M19 12a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V3h14v9z"/>
                </svg>
                TEST SANDBOX SIMULATOR
              </div>
              <p className="sandbox-desc">Perform instant integration test ordering without loading third-party credentials. Uses local HMAC-SHA256 signature verification matching backend defaults.</p>
              
              <div className="sandbox-actions">
                <button
                  onClick={handleSimulateSuccess}
                  disabled={paying}
                  className="sandbox-btn-success"
                  style={{ background: theme.primaryColor || '#15803D' }}
                >
                  {paying ? 'Verifying Sandbox...' : 'Simulate Payment Success'}
                </button>
                <button
                  onClick={() => setErrorMsg('Payment was declined by the simulated card issuer.')}
                  disabled={paying}
                  className="sandbox-btn-fail"
                >
                  Simulate Payment Decline
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .payment-wrapper {
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: #1E293B;
          padding: 48px 24px 80px;
          box-sizing: border-box;
        }
        .payment-container {
          max-width: 960px;
          margin: 0 auto;
        }

        /* Loading shimmer */
        .payment-loading-wrapper {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
        }
        .payment-shimmer-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 4px solid rgba(0,0,0,0.05);
          border-top-color: var(--sf-accent, #15803D);
          animation: spin 0.8s infinite linear;
        }
        .payment-shimmer-line {
          height: 12px;
          width: 200px;
          background: rgba(0,0,0,0.04);
          border-radius: 6px;
          margin-top: 24px;
        }
        .payment-shimmer-line.short {
          width: 120px;
          margin-top: 16px;
        }

        /* Error view */
        .payment-error-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
        }
        .error-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 24px;
          max-width: 440px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .error-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 10px;
        }
        .error-message {
          font-size: 0.9rem;
          color: #64748B;
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .error-action-btn {
          display: inline-block;
          border: none;
          padding: 12px 32px;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .error-action-btn:hover {
          filter: brightness(1.08);
        }

        /* Header Card */
        .payment-header-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          margin-bottom: 32px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .payment-secure-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.08em;
          background: #F1F5F9;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .payment-secure-badge svg {
          color: #10B981;
        }
        .payment-amount {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          margin: 0 0 8px;
          color: #0F172A;
          letter-spacing: -0.02em;
        }
        .payment-order-meta {
          font-size: 0.88rem;
          color: #64748B;
          margin: 0;
        }
        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 8px;
        }
        .status-badge.pending {
          background: #FEF3C7;
          color: #D97706;
        }

        /* Grid Layout */
        .payment-content-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .payment-details-card, .payment-actions-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.03);
          border: 1px solid rgba(0,0,0,0.03);
          text-align: left;
        }
        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 20px;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          padding-bottom: 10px;
        }
        .mt-6 { margin-top: 28px; }

        /* Information list */
        .details-info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .info-label {
          color: #64748B;
          font-weight: 500;
        }
        .info-value {
          color: #1E293B;
          font-weight: 600;
          text-align: right;
        }

        /* Items summary */
        .payment-items-summary {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-summary-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }
        .item-name {
          color: #475569;
          font-weight: 600;
        }
        .item-price {
          color: #0F172A;
          font-weight: 700;
        }
        .payment-total-divider {
          height: 1px;
          background: rgba(0,0,0,0.03);
          margin: 4px 0;
        }
        .payment-total-summary-row {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
        }

        /* Payment Method Options Grid */
        .payment-methods-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .pm-option-box {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .pm-option-box:hover {
          border-color: var(--sf-accent, #15803D);
          background: #F8FAFC;
        }
        .pm-option-box.active {
          border-color: var(--sf-accent, #15803D);
          background: rgba(21, 128, 61, 0.02);
          box-shadow: 0 4px 12px rgba(21, 128, 61, 0.03);
        }
        .pm-option-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .pm-option-box.active .pm-option-icon {
          background: var(--sf-accent, #15803D);
          color: #FFFFFF;
        }
        .pm-option-text {
          flex: 1;
          text-align: left;
        }
        .pm-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
        }
        .pm-sub {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 2px;
        }
        .pm-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .pm-option-box.active .pm-checkbox {
          border-color: var(--sf-accent, #15803D);
          background: var(--sf-accent, #15803D);
        }
        .pm-option-box.active .pm-checkbox::after {
          content: "";
          width: 6px;
          height: 6px;
          background: #FFFFFF;
          border-radius: 50%;
        }

        /* Action Panel */
        .payment-inline-error {
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gateway-btn-primary {
          width: 100%;
          border: none;
          height: 52px;
          color: #ffffff;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.2);
          margin-bottom: 28px;
        }
        .gateway-btn-primary:hover:not(:disabled) {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .gateway-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Sandbox Box */
        .sandbox-panel {
          background: #F8FAFC;
          border: 1.5px dashed rgba(21, 128, 61, 0.15);
          border-radius: 16px;
          padding: 24px;
        }
        .sandbox-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: #16A34A;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sandbox-desc {
          font-size: 0.78rem;
          color: #64748B;
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .sandbox-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .sandbox-btn-success {
          border: none;
          color: #ffffff;
          height: 40px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sandbox-btn-success:hover:not(:disabled) {
          filter: brightness(1.08);
        }
        .sandbox-btn-fail {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          height: 40px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sandbox-btn-fail:hover:not(:disabled) {
          background: #E2E8F0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .payment-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .payment-wrapper {
            padding: 32px 16px 60px;
          }
          .payment-amount {
            font-size: 2.4rem;
          }
        }
      `}</style>
    </div>
  );
};
