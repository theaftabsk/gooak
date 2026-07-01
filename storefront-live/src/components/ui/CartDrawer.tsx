'use client';
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@oaksol/shared-ui';
import { useRouter } from 'next/navigation';
import { getCurrencySymbol } from '@/lib/utils';
import { storefrontApi } from '@/lib/api-client';

export const CartDrawer: React.FC = () => {
  const { cartItems, cartTotal, appliedCoupon, discountAmount, isCartOpen, setCartOpen, updateQty, removeFromCart, setAppliedCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await storefrontApi.validateCoupon(couponInput.trim(), cartTotal);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Invalid coupon');
      }
    } catch {
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-overlay" onClick={() => setCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={() => setCartOpen(false)}>&times;</button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your shopping bag is empty.</p>
              <Button variant="storefront" style={{ marginTop: '20px' }} onClick={() => setCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div className="cart-item-row" key={item.variantId}>
                  {item.imageUrl ? (
                    <img className="cart-item-img" src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="cart-item-placeholder">No Image</div>
                  )}
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-variant">{item.variantLabel}</span>
                    <div className="qty-controls">
                      <button onClick={() => updateQty(item.variantId, item.qty - 1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.variantId, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-price-col">
                    <span className="item-price">{getCurrencySymbol()}{(item.price * item.qty).toFixed(2)}</span>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.variantId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="cart-footer">
            {/* Coupon input */}
            {appliedCoupon ? (
              <div className="coupon-applied-row">
                <span className="coupon-applied-tag">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  {appliedCoupon.code}
                  {appliedCoupon.type === 'percentage' ? ` (${appliedCoupon.value}% off)` : appliedCoupon.type === 'fixed' ? ` (₹${appliedCoupon.value} off)` : ' (Free shipping)'}
                </span>
                <button className="coupon-remove-btn" onClick={handleRemoveCoupon}>✕</button>
              </div>
            ) : (
              <div className="coupon-input-row">
                <input
                  className="coupon-input"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                />
                <button className="coupon-apply-btn" onClick={handleApplyCoupon} disabled={couponLoading}>
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="coupon-error">{couponError}</p>}

            <div className="subtotal-row">
              <span>Subtotal:</span>
              <span>{getCurrencySymbol()}{cartTotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="subtotal-row discount-row">
                <span>Discount:</span>
                <span className="discount-val">−{getCurrencySymbol()}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {appliedCoupon?.free_shipping && (
              <div className="subtotal-row discount-row">
                <span>Shipping:</span>
                <span className="discount-val">FREE</span>
              </div>
            )}
            <div className="subtotal-row total-row">
              <span>Total:</span>
              <span className="total-amount">{getCurrencySymbol()}{Math.max(0, cartTotal - discountAmount).toFixed(2)}</span>
            </div>
            {!appliedCoupon?.free_shipping && <p className="shipping-note">Free Shipping for orders above {getCurrencySymbol()}500</p>}
            <Button
              variant="storefront"
              style={{ width: '100%', marginTop: '15px' }}
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
            >
              Checkout Now
            </Button>
          </div>
        ) : null}
      </div>

      <style>{`
        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease;
        }

        .cart-drawer {
          width: 100%;
          max-width: 420px;
          height: 100%;
          background: var(--sf-card-bg);
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cart-header {
          padding: 24px;
          border-bottom: 1px solid var(--sf-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cart-header h2 {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: var(--sf-text-main);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--sf-text-muted);
          transition: color var(--transition-fast);
        }

        .close-btn:hover {
          color: var(--sf-text-main);
        }

        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .empty-cart {
          text-align: center;
          padding: 60px 0;
          color: var(--sf-text-muted);
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cart-item-row {
          display: flex;
          gap: 15px;
          border-bottom: 1px solid var(--sf-border);
          padding-bottom: 15px;
        }

        .cart-item-img {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          background: #f9f9f9;
        }

        .cart-item-placeholder {
          width: 70px;
          height: 70px;
          border: 1px dashed var(--sf-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: var(--sf-text-muted);
          border-radius: var(--radius-sm);
        }

        .cart-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .cart-item-info h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--sf-text-main);
        }

        .cart-item-variant {
          font-size: 0.8rem;
          color: var(--sf-text-muted);
          margin-top: 2px;
        }

        .qty-controls {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--sf-border);
          border-radius: var(--radius-sm);
          width: fit-content;
          margin-top: 8px;
        }

        .qty-controls button {
          background: none;
          border: none;
          width: 28px;
          height: 24px;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--sf-text-main);
        }

        .qty-controls span {
          padding: 0 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .cart-item-price-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
        }

        .item-price {
          font-weight: 600;
          color: var(--sf-text-main);
          font-size: 0.95rem;
        }

        .remove-item-btn {
          background: none;
          border: none;
          color: #EF4444;
          font-size: 0.8rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .cart-footer {
          padding: 24px;
          border-top: 1px solid var(--sf-border);
          background: #FAF9F6;
        }

        .subtotal-row {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--sf-text-main);
          margin-bottom: 8px;
        }

        .shipping-note {
          font-size: 0.8rem;
          color: var(--sf-accent);
          font-weight: 500;
        }

        .coupon-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .coupon-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--sf-border, rgba(0,0,0,0.12));
          background: var(--sf-bg);
          color: var(--sf-text-main);
          font-size: 0.82rem;
          font-family: monospace;
          letter-spacing: 0.05em;
          outline: none;
        }
        .coupon-input:focus { border-color: var(--sf-accent); }
        .coupon-apply-btn {
          padding: 8px 16px;
          background: var(--sf-text-main);
          color: var(--sf-bg);
          border: none;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .coupon-apply-btn:hover { opacity: 0.8; }
        .coupon-apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .coupon-applied-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.2);
          padding: 7px 10px;
          margin-bottom: 12px;
        }
        .coupon-applied-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.03em;
        }
        .coupon-remove-btn {
          background: none;
          border: none;
          color: #9CA3AF;
          cursor: pointer;
          font-size: 0.85rem;
          line-height: 1;
        }
        .coupon-remove-btn:hover { color: #EF4444; }
        .coupon-error {
          font-size: 0.76rem;
          color: #EF4444;
          margin: -8px 0 10px;
        }
        .discount-row { color: #059669; }
        .discount-val { font-weight: 700; color: #059669; }
        .total-row {
          font-weight: 700;
          font-size: 1rem;
          border-top: 1px solid var(--sf-border, rgba(0,0,0,0.08));
          padding-top: 10px;
          margin-top: 6px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
