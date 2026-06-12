import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useCart } from '../../context/CartContext';

export const Checkout: React.FC = () => {
  const { theme, cssVariables } = usePageTheme('checkout');
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

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
  
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate pricing values
  const shippingCharge = cartTotal > 500 ? 0 : 50;
  const taxAmount = Math.round(cartTotal * 0.05); // 5% flat GST
  const grandTotal = cartTotal + shippingCharge + taxAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMsg('Your shopping cart is empty!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const orderPayload = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: {
        full_name: name,
        phone,
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
      const order = await catalogApi.placeOrder(orderPayload);
      clearCart();
      
      if (paymentMethod === 'razorpay') {
        // Redirect to payment processor page
        navigate(`/checkout/payment/${order.id}`);
      } else {
        // COD / bank-transfer direct success
        navigate('/order-success', { state: { orderId: order.id, orderNumber: order.order_number } });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={cssVariables} className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-slate-50">
        <span className="text-4xl mb-4">🛒</span>
        <h1 className="text-xl font-bold text-slate-800">Your Cart is Empty</h1>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Please add some skincare products to your cart before proceeding to checkout.</p>
        <Link to="/products" className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm">Shop Products</Link>
      </div>
    );
  }

  return (
    <div style={cssVariables} className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight text-left mb-8">Checkout</h1>
        
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start text-left text-sm">
          
          {/* Left Side: Forms */}
          <div className="flex flex-col gap-6">
            
            {/* 1. Customer Details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b border-slate-50">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-600 text-xs">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-600 text-xs">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="font-semibold text-slate-600 text-xs">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b border-slate-50">Shipping Address</h3>
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-600 text-xs">Street Address</label>
                <input type="text" value={addressLine} onChange={e => setAddressLine(e.target.value)} required placeholder="House number, apartment, street name" className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-600 text-xs">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-600 text-xs">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-600 text-xs">PIN Code</label>
                  <input type="text" value={zip} onChange={e => setZip(e.target.value)} required className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="font-semibold text-slate-600 text-xs">Order Notes (Optional)</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions for delivery..." className="p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b border-slate-50">Payment Method</h3>
              <div className="flex flex-col gap-3 font-semibold text-slate-700">
                <label className="flex items-center gap-3 p-3.5 border border-slate-100 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div>
                    <span>💵 Cash on Delivery (COD)</span>
                    <span className="block text-xxs text-slate-400 font-medium mt-0.5">Pay in cash when products are delivered</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3.5 border border-slate-100 hover:bg-slate-50 rounded-xl cursor-pointer transition">
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <div>
                    <span>💳 Pay Online (Razorpay)</span>
                    <span className="block text-xxs text-slate-400 font-medium mt-0.5">Secure credit card, UPI, netbanking payments</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Side: Order Summary */}
          <div className="flex flex-col gap-6 sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 pb-2 border-b border-slate-50">Order Summary</h3>
              
              {/* Items List */}
              <div className="flex flex-col gap-4 max-h-[200px] overflow-y-auto mb-6 pr-2">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="flex gap-3 items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100 bg-slate-50" />
                    <div className="flex-1 text-xs">
                      <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                      <span className="text-slate-400 font-semibold">{item.variantLabel || 'Standard'} x {item.qty}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="flex flex-col gap-2.5 border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-slate-800">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5% Flat GST)</span>
                  <span className="text-slate-800">₹{taxAmount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-50 pt-4 text-sm font-black text-slate-800">
                  <span>Total Amount</span>
                  <span className="text-slate-900 text-lg">₹{grandTotal}</span>
                </div>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 font-bold text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {loading ? 'Processing Order...' : 'Place Order'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

// Helper Link fallback import
import { Link } from 'react-router-dom';
