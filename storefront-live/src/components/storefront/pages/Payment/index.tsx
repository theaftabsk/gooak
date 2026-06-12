import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi, paymentApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';

// Function to compute HMAC-SHA256 signature locally for sandbox testing
async function generateMockSignature(orderId: string, paymentId: string): Promise<string> {
  const secret = 'placeholder_secret';
  const text = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(secret);
  const messageBuffer = encoder.encode(text);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageBuffer
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const Payment: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { theme, cssVariables } = usePageTheme('payment');
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);

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
      // Initialize Razorpay payment via backend
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
            navigate('/order-success', { state: { orderId, orderNumber: order.order_number } });
          } catch (verifyErr: any) {
            setErrorMsg(verifyErr.message || 'Payment signature verification failed.');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: order.shipping_address?.full_name || '',
          email: order.customer_email || '',
          contact: order.shipping_address?.phone || ''
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
      // 1. Initialize payment data to retrieve the razorpay_order_id
      const details = await paymentApi.initializeRazorpayPayment(orderId);
      const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 12)}`;
      
      // 2. Generate a valid signature client-side using the default placeholder secret
      const mockSignature = await generateMockSignature(details.razorpay_order_id, mockPaymentId);

      // 3. Verify payment on backend
      await paymentApi.verifyPayment({
        orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_order_id: details.razorpay_order_id,
        razorpay_signature: mockSignature
      });

      // 4. Redirect on success
      navigate('/order-success', { state: { orderId, orderNumber: order.order_number } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Sandbox verification failed. Ensure backend uses standard test credentials.');
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
          <span className="error-icon">❌</span>
          <h2 className="error-title">Order Processing Error</h2>
          <p className="error-message">{errorMsg}</p>
          <button onClick={() => navigate('/products')} className="error-action-btn" style={{ background: theme.primaryColor || '#111827' }}>
            Browse Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={cssVariables} className="payment-wrapper">
      <div className="payment-container">
        
        {/* Header Summary */}
        <div className="payment-header-card">
          <div className="payment-secure-badge">
            <span className="lock-icon">🔒</span> SECURE CHECKOUT GATEWAY
          </div>
          <h1 className="payment-amount">₹{order.total}</h1>
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
            <div className="details-info-row">
              <span className="info-label">Shipping Address:</span>
              <span className="info-value">
                {order.shipping_address?.address_line1}, {order.shipping_address?.city},{' '}
                {order.shipping_address?.state} - {order.shipping_address?.postal_code}
              </span>
            </div>

            <h3 className="section-title mt-6">Order Summary</h3>
            <div className="payment-items-summary">
              {order.items?.map((item: any) => (
                <div key={item.id} className="payment-summary-item-row">
                  <span className="item-name">{item.product_snap?.name || 'Skincare Product'} x {item.qty}</span>
                  <span className="item-price">₹{item.line_total}</span>
                </div>
              ))}
              <div className="payment-total-divider"></div>
              <div className="payment-total-summary-row">
                <span>Grand Total:</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </div>

          {/* Gateways Action Column */}
          <div className="payment-actions-card">
            <h3 className="section-title">Online Payment Options</h3>
            <p className="gateway-desc">Secure payment processing via Razorpay. Choose to proceed with the live checkout or test in the mock sandbox simulator.</p>
            
            {errorMsg && (
              <div className="payment-inline-error">
                <span>⚠️</span> {errorMsg}
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
              <div className="sandbox-badge">🛠️ TEST SANDBOX SIMULATOR</div>
              <p className="sandbox-desc">Perform instant integration test ordering without loading third-party credentials. Uses local HMAC-SHA256 signature verification matching backend defaults.</p>
              
              <div className="sandbox-actions">
                <button
                  onClick={handleSimulateSuccess}
                  disabled={paying}
                  className="sandbox-btn-success"
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
          background: var(--sf-bg, #FAF7F2);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: #1F2937;
          padding: 48px 24px 80px;
          box-sizing: border-box;
        }
        .payment-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Loading shimmer */
        .payment-loading-wrapper {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--sf-bg, #FAF7F2);
        }
        .payment-shimmer-circle {
          width: 60px;
          height: 60px;
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
          background: var(--sf-bg, #FAF7F2);
        }
        .error-card {
          background: #ffffff;
          padding: 40px;
          border-radius: 24px;
          max-width: 440px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid rgba(0,0,0,0.02);
        }
        .error-icon {
          font-size: 2.8rem;
          display: block;
          margin-bottom: 18px;
        }
        .error-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 10px;
        }
        .error-message {
          font-size: 0.9rem;
          color: #6B7280;
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
          box-shadow: 0 10px 35px -10px rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .payment-secure-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #4B5563;
          letter-spacing: 0.08em;
          background: #F3F4F6;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .payment-amount {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          margin: 0 0 8px;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .payment-order-meta {
          font-size: 0.88rem;
          color: #6B7280;
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
          box-shadow: 0 10px 35px -10px rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.03);
          text-align: left;
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
        .mt-6 { margin-top: 28px; }

        /* Information list */
        .details-info-row {
          display: flex;
          margin-bottom: 12px;
          font-size: 0.88rem;
          line-height: 1.5;
        }
        .info-label {
          width: 120px;
          color: #6B7280;
          font-weight: 600;
          flex-shrink: 0;
        }
        .info-value {
          color: #111827;
          font-weight: 700;
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
          color: #4B5563;
          font-weight: 600;
        }
        .item-price {
          color: #111827;
          font-weight: 700;
        }
        .payment-total-divider {
          height: 1px;
          background: rgba(0,0,0,0.04);
          margin: 4px 0;
        }
        .payment-total-summary-row {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
        }

        /* Action Panel */
        .gateway-desc {
          font-size: 0.85rem;
          color: #6B7280;
          line-height: 1.6;
          margin: 0 0 24px;
        }
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
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.25);
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
          background: #FAF7F2;
          border: 1.5px dashed rgba(21, 128, 61, 0.2);
          border-radius: 16px;
          padding: 24px;
        }
        .sandbox-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: #16A34A;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .sandbox-desc {
          font-size: 0.78rem;
          color: #6B7280;
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .sandbox-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .sandbox-btn-success {
          background: #15803D;
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
          background: #166534;
        }
        .sandbox-btn-fail {
          background: #F3F4F6;
          border: 1px solid rgba(0,0,0,0.08);
          color: #4B5563;
          height: 40px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sandbox-btn-fail:hover:not(:disabled) {
          background: #E5E7EB;
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
