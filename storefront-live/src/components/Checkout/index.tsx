'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { catalogApi, paymentApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { getCurrencySymbol } from '@/lib/utils';

export const Checkout: React.FC = () => {
  const { theme, cssVariables } = usePageTheme('checkout');
  const { cartItems, cartTotal, clearCart } = useCart();
  const { customer } = useCustomer();
  const router = useRouter();

  // Contact Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping Address
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');
  
  // Active payment gateways (fetched from backend)
  const [activeGateways, setActiveGateways] = useState<any[]>([]);
  const [gatewaysLoaded, setGatewaysLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill profile fields if logged in
  useEffect(() => {
    if (customer) {
      setName(prev => prev || customer.name || '');
      setEmail(prev => prev || customer.email || '');
      setPhone(prev => prev || customer.phone || '');
    }
  }, [customer]);

  // Fetch active payment gateways from backend
  useEffect(() => {
    paymentApi.getPaymentGateways()
      .then((gateways: any[]) => {
        const active = (gateways || []).filter((g: any) => g.is_active);
        setActiveGateways(active);
        if (active.length > 0) setPaymentMethod(active[0].slug);
      })
      .catch(() => {
        // Fallback to COD if fetch fails
        setActiveGateways([{ slug: 'cod', name: 'Cash on Delivery', is_active: true }]);
        setPaymentMethod('cod');
      })
      .finally(() => setGatewaysLoaded(true));
  }, []);

  // Calculate pricing values
  const shippingCharge = cartTotal > 500 ? 0 : 50;
  const taxAmount = Math.round(cartTotal * 0.05); // 5% flat GST
  const grandTotal = cartTotal + shippingCharge + taxAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) { setErrorMsg('Your shopping cart is empty!'); return; }
    if (!paymentMethod) { setErrorMsg('Please select a payment method.'); return; }

    setLoading(true);
    setErrorMsg('');

    const orderPayload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: {
        full_name: name,
        phone,
        email,
        address_line1: addressLine,
        city,
        state,
        postal_code: zip,
        country: 'IN'
      },
      payment_method: paymentMethod,
      notes,
      items: cartItems.map(item => ({
        variant_id: item.variantId,
        qty: item.qty
      }))
    };

    try {
      const response = await catalogApi.placeOrder(orderPayload);
      const order = response?.order || response;
      if (paymentMethod === 'razorpay') {
        clearCart();
        router.push(`/checkout/payment/${order.id}`);
      } else {
        localStorage.setItem('last_order_id', order.id);
        localStorage.setItem('last_order_number', order.order_number);
        router.push('/order-success');
        clearCart();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div style={cssVariables} className="checkout-empty-wrapper">
        <span className="checkout-empty-icon">🛒</span>
        <h1 className="checkout-empty-title">Your Cart is Empty</h1>
        <p className="checkout-empty-desc">Please add some skincare products to your cart before proceeding to checkout.</p>
        <a href="/products" className="checkout-empty-action" style={{ background: theme.primaryColor || '#111827' }}>
          Shop Products
        </a>
      </div>
    );
  }

  return (
    <div style={cssVariables} className="checkout-wrapper">
      <div className="checkout-container">
        <h1 className="checkout-title">Secure Checkout</h1>
        
        <form onSubmit={handleSubmitOrder} className="checkout-form-grid">
          
          {/* Left Column: Input Forms */}
          <div className="checkout-form-column">
            
            {/* 1. Contact Info Card */}
            <div className="checkout-card">
              <h3 className="checkout-card-header">Contact Information</h3>
              <div className="checkout-fields-row">
                <div className="checkout-field">
                  <label className="checkout-label">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    placeholder="Enter your name" 
                    className="checkout-input" 
                  />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    placeholder="name@example.com" 
                    className="checkout-input" 
                  />
                </div>
              </div>
              <div className="checkout-field mt-4">
                <label className="checkout-label">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  placeholder="+91 98765 43210" 
                  className="checkout-input" 
                />
              </div>
            </div>

            {/* 2. Shipping Address Card */}
            <div className="checkout-card">
              <h3 className="checkout-card-header">Shipping Address</h3>
              <div className="checkout-field">
                <label className="checkout-label">Street Address</label>
                <input 
                  type="text" 
                  value={addressLine} 
                  onChange={e => setAddressLine(e.target.value)} 
                  required 
                  placeholder="House number, apartment, street name" 
                  className="checkout-input" 
                />
              </div>
              <div className="checkout-fields-three mt-4">
                <div className="checkout-field">
                  <label className="checkout-label">City</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    required 
                    placeholder="City" 
                    className="checkout-input" 
                  />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">State</label>
                  <input 
                    type="text" 
                    value={state} 
                    onChange={e => setState(e.target.value)} 
                    required 
                    placeholder="State" 
                    className="checkout-input" 
                  />
                </div>
                <div className="checkout-field">
                  <label className="checkout-label">PIN Code</label>
                  <input 
                    type="text" 
                    value={zip} 
                    onChange={e => setZip(e.target.value)} 
                    required 
                    placeholder="110001" 
                    className="checkout-input" 
                  />
                </div>
              </div>
              <div className="checkout-field mt-4">
                <label className="checkout-label">Order Notes (Optional)</label>
                <textarea 
                  rows={3} 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="Special instructions for delivery, e.g. deliver next to gate..." 
                  className="checkout-textarea" 
                />
              </div>
            </div>

            {/* 3. Payment Method Card */}
            <div className="checkout-card">
              <h3 className="checkout-card-header">Payment Option</h3>
              {!gatewaysLoaded ? (
                <div style={{ color: '#6B7280', fontSize: '0.85rem', padding: '12px 0' }}>Loading payment options…</div>
              ) : activeGateways.length === 0 ? (
                <div style={{ color: '#DC2626', fontSize: '0.85rem', padding: '12px 0', fontWeight: 600 }}>
                  ⚠️ No payment methods available. Please contact the store.
                </div>
              ) : (
                <div className="payment-options-list">
                  {activeGateways.map(gw => {
                    const isCod = gw.slug === 'cod';
                    const isRzp = gw.slug === 'razorpay';
                    return (
                      <label
                        key={gw.slug}
                        className={`payment-option-label ${paymentMethod === gw.slug ? 'active' : ''}`}
                        style={paymentMethod === gw.slug ? {
                          borderColor: theme.primaryColor || '#15803D',
                          background: `${theme.primaryColor || '#15803D'}05`
                        } : {}}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={gw.slug}
                          checked={paymentMethod === gw.slug}
                          onChange={() => setPaymentMethod(gw.slug)}
                          className="payment-radio-input"
                        />
                        <div className="payment-option-text">
                          <span className="payment-option-title">
                            {isCod ? '💵 Cash on Delivery (COD)' : isRzp ? '💳 Pay Online Securely' : `💰 ${gw.name}`}
                          </span>
                          <span className="payment-option-subtitle">
                            {isCod
                              ? 'Pay with cash upon delivery of your products'
                              : isRzp
                              ? 'UPI, Netbanking, Credit & Debit Cards (Razorpay)'
                              : gw.name}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>


          </div>

          {/* Right Column: Sticky Order Summary */}
          <div className="checkout-summary-column">
            <div className="checkout-summary-card">
              <h3 className="checkout-card-header">Order Summary</h3>
              
              {/* Product items scrolling list */}
              <div className="checkout-items-list">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="checkout-item-row">
                    <div className="checkout-item-image-wrapper">
                      <img src={item.imageUrl || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=200'} alt={item.name} className="checkout-item-image" />
                    </div>
                    <div className="checkout-item-info">
                      <h4 className="checkout-item-name">{item.name}</h4>
                      <span className="checkout-item-variant">{item.variantLabel || 'Standard'} x {item.qty}</span>
                    </div>
                    <span className="checkout-item-total-price">{getCurrencySymbol()}{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="checkout-calculations">
                <div className="calc-row">
                  <span>Cart Subtotal</span>
                  <span className="calc-value">{getCurrencySymbol()}{cartTotal}</span>
                </div>
                <div className="calc-row">
                  <span>Shipping & Handling</span>
                  <span className="calc-value">{shippingCharge === 0 ? 'FREE' : `${getCurrencySymbol()}${shippingCharge}`}</span>
                </div>
                <div className="calc-row">
                  <span>Flat tax (5% GST)</span>
                  <span className="calc-value">{getCurrencySymbol()}{taxAmount}</span>
                </div>
                <div className="grand-total-row">
                  <span>Order Total</span>
                  <span className="grand-total-price">{getCurrencySymbol()}{grandTotal}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="checkout-error-banner">
                  <span>⚠️</span> {errorMsg}
                </div>
              )}

              {/* Form submit CTA */}
              <button 
                type="submit" 
                disabled={loading}
                className="checkout-place-order-btn"
                style={{ background: theme.primaryColor || '#15803D' }}
              >
                {loading ? 'Processing Order...' : 'Place Order'}
              </button>
            </div>
          </div>

        </form>
      </div>

      <style>{`
        .checkout-wrapper {
          background: var(--sf-bg, #FAF7F2);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: #1F2937;
        }

        /* Empty state */
        .checkout-empty-wrapper {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          background: var(--sf-bg, #FAF7F2);
        }
        .checkout-empty-icon { font-size: 2.4rem; display: block; margin-bottom: 12px; }
        .checkout-empty-title { font-size: 1.2rem; font-weight: 700; color: #111827; margin: 0 0 8px; }
        .checkout-empty-desc { font-size: 0.85rem; color: #6B7280; max-width: 320px; margin: 0 auto 20px; line-height: 1.5; }
        .checkout-empty-action {
          display: inline-block;
          padding: 10px 24px;
          color: #fff;
          border-radius: 9px;
          font-weight: 700;
          text-decoration: none;
          font-size: 0.85rem;
          transition: filter 0.15s;
        }
        .checkout-empty-action:hover { filter: brightness(1.08); }

        /* Checkout workspace */
        .checkout-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 28px 20px 56px;
          box-sizing: border-box;
        }
        .checkout-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 20px;
          letter-spacing: -0.01em;
        }

        .checkout-form-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Card panels */
        .checkout-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 12px;
          text-align: left;
        }
        .checkout-card-header {
          font-size: 0.68rem;
          font-weight: 700;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 0 0 14px;
          border-bottom: 1px solid #F3F4F6;
          padding-bottom: 10px;
        }

        /* Fields */
        .checkout-fields-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .checkout-fields-three {
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 1fr;
          gap: 10px;
        }
        .checkout-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .checkout-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .checkout-input {
          padding: 8px 11px;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-input:focus {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 3px rgba(21,128,61,0.08);
        }
        .checkout-textarea {
          padding: 8px 11px;
          border: 1.5px solid #E5E7EB;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
        }
        .checkout-textarea:focus {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 3px rgba(21,128,61,0.08);
        }

        /* Payment */
        .payment-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .payment-option-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border: 1.5px solid #E5E7EB;
          border-radius: 9px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .payment-option-label:hover {
          border-color: #D1D5DB;
          background: #F9FAFB;
        }
        .payment-radio-input {
          accent-color: var(--sf-accent, #15803D);
          width: 15px;
          height: 15px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .payment-option-text { display: flex; flex-direction: column; }
        .payment-option-title {
          font-size: 0.83rem;
          font-weight: 700;
          color: #111827;
        }
        .payment-option-subtitle {
          font-size: 0.72rem;
          color: #9CA3AF;
          font-weight: 500;
          margin-top: 2px;
        }

        /* Summary column */
        .checkout-summary-column {
          position: sticky;
          top: 80px;
        }
        .checkout-summary-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 18px 20px;
          text-align: left;
        }

        .checkout-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
          padding-right: 4px;
        }
        .checkout-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .checkout-item-image-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          overflow: hidden;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          flex-shrink: 0;
        }
        .checkout-item-image { width: 100%; height: 100%; object-fit: cover; }
        .checkout-item-info { flex: 1; min-width: 0; }
        .checkout-item-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .checkout-item-variant {
          font-size: 0.7rem;
          color: #9CA3AF;
          font-weight: 500;
        }
        .checkout-item-total-price {
          font-size: 0.82rem;
          font-weight: 700;
          color: #111827;
          flex-shrink: 0;
        }

        .checkout-calculations {
          border-top: 1px solid #F3F4F6;
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 500;
          color: #6B7280;
        }
        .calc-value { color: #374151; font-weight: 600; }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #E5E7EB;
          padding-top: 12px;
          margin-top: 4px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #111827;
        }
        .grand-total-price {
          font-size: 1.15rem;
          font-weight: 800;
          color: #111827;
        }

        .checkout-error-banner {
          margin-top: 12px;
          padding: 9px 12px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .checkout-place-order-btn {
          width: 100%;
          margin-top: 14px;
          height: 42px;
          border: none;
          border-radius: 9px;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: filter 0.15s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .checkout-place-order-btn:hover:not(:disabled) {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
        .checkout-place-order-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .checkout-form-grid { grid-template-columns: 1fr; gap: 16px; }
          .checkout-summary-column { position: static; }
          .checkout-container { padding: 20px 16px 48px; }
        }
        @media (max-width: 600px) {
          .checkout-fields-row { grid-template-columns: 1fr; gap: 10px; }
          .checkout-fields-three { grid-template-columns: 1fr 1fr; gap: 10px; }
          .checkout-card { padding: 14px 16px; }
          .checkout-summary-card { padding: 14px 16px; }
        }
        .mt-4 { margin-top: 14px; }
      `}</style>
    </div>
  );
};

