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
  const { customer, isLoading } = useCustomer();
  const router = useRouter();

  // Enforce login redirect
  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/login?redirect=/checkout');
    }
  }, [customer, isLoading, router]);

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
      clearCart();
      
      const order = response?.order || response;
      if (paymentMethod === 'razorpay') {
        router.push(`/checkout/payment/${order.id}`);
      } else {
        localStorage.setItem('last_order_id', order.id);
        localStorage.setItem('last_order_number', order.order_number);
        router.push('/order-success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={cssVariables} className="checkout-empty-wrapper">
        <div className="payment-shimmer-circle" style={{ margin: '0 auto 20px' }}></div>
        <h1 className="checkout-empty-title">Securing Checkout...</h1>
        <p className="checkout-empty-desc">Verifying your customer credentials.</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
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

        /* Empty state wrapper */
        .checkout-empty-wrapper {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          background: var(--sf-bg, #FAF7F2);
        }
        .checkout-empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 16px;
        }
        .checkout-empty-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 10px;
        }
        .checkout-empty-desc {
          font-size: 0.9rem;
          color: #6B7280;
          max-width: 380px;
          margin: 0 auto 28px;
          line-height: 1.5;
        }
        .checkout-empty-action {
          display: inline-block;
          padding: 12px 32px;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          font-size: 0.88rem;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          transition: all 0.2s;
        }
        .checkout-empty-action:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        /* Checkout workspace */
        .checkout-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          box-sizing: border-box;
        }
        .checkout-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 800;
          color: #111827;
          text-align: left;
          margin: 0 0 36px;
          letter-spacing: -0.02em;
        }

        .checkout-form-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 48px;
          align-items: start;
        }

        /* Card panels */
        .checkout-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.02);
          text-align: left;
        }
        .checkout-card-header {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
          padding-bottom: 12px;
        }

        /* Fields formatting */
        .checkout-fields-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .checkout-fields-three {
          display: grid;
          grid-template-columns: 1.2fr 1.2fr 1fr;
          gap: 16px;
        }
        .checkout-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .checkout-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #4B5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .checkout-input {
          padding: 12px 16px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-size: 0.92rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-input:focus {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.08);
        }
        .checkout-textarea {
          padding: 12px 16px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          font-size: 0.92rem;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
        }
        .checkout-textarea:focus {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.08);
        }

        /* Payment selection */
        .payment-options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .payment-option-label {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          border: 1.5px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .payment-option-label:hover {
          background: rgba(0, 0, 0, 0.01);
          border-color: rgba(0,0,0,0.12);
        }
        .payment-radio-input {
          margin-top: 4px;
          accent-color: var(--sf-accent, #15803D);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .payment-option-text {
          display: flex;
          flex-direction: column;
        }
        .payment-option-title {
          font-size: 0.92rem;
          font-weight: 800;
          color: #111827;
        }
        .payment-option-subtitle {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
          margin-top: 4px;
        }

        /* Right Column Summary */
        .checkout-summary-column {
          position: sticky;
          top: 110px;
        }
        .checkout-summary-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.02);
          text-align: left;
        }

        .checkout-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 28px;
          padding-right: 6px;
        }
        .checkout-item-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .checkout-item-image-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          background: #F9FAFB;
          border: 1px solid rgba(0, 0, 0, 0.04);
          flex-shrink: 0;
        }
        .checkout-item-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .checkout-item-info {
          flex: 1;
        }
        .checkout-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .checkout-item-variant {
          font-size: 0.75rem;
          color: #9CA3AF;
          font-weight: 600;
        }
        .checkout-item-total-price {
          font-size: 0.85rem;
          font-weight: 800;
          color: #111827;
        }

        .checkout-calculations {
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6B7280;
        }
        .calc-value {
          color: #111827;
          font-weight: 700;
        }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(0, 0, 0, 0.04);
          padding-top: 18px;
          margin-top: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 800;
          color: #111827;
        }
        .grand-total-price {
          font-size: 1.5rem;
          font-weight: 900;
          color: #111827;
        }

        .checkout-error-banner {
          margin-top: 20px;
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkout-place-order-btn {
          width: 100%;
          margin-top: 24px;
          height: 50px;
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.25);
          transition: all 0.2s;
        }
        .checkout-place-order-btn:hover:not(:disabled) {
          filter: brightness(1.05);
          transform: translateY(-1px);
          box-shadow: 0 12px 25px -4px rgba(21, 128, 61, 0.35);
        }
        .checkout-place-order-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .checkout-form-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .checkout-summary-column {
            position: static;
          }
          .checkout-container {
            padding: 32px 16px 60px;
          }
          .checkout-title {
            font-size: 1.85rem;
            margin-bottom: 24px;
          }
        }
        @media (max-width: 640px) {
          .checkout-fields-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .checkout-fields-three {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .checkout-card {
            padding: 20px;
          }
          .checkout-summary-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

