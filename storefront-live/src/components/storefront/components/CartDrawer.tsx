import React from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '@oaksol/shared-ui';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { cartItems, cartTotal, isCartOpen, setCartOpen, updateQty, removeFromCart } = useCart();
  const navigate = useNavigate();

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
                    <span className="item-price">₹{(item.price * item.qty).toFixed(2)}</span>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.variantId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="cart-footer">
            <div className="subtotal-row">
              <span>Subtotal:</span>
              <span className="total-amount">₹{cartTotal.toFixed(2)}</span>
            </div>
            <p className="shipping-note">Free Shipping for orders above ₹500</p>
            <Button
              variant="storefront"
              style={{ width: '100%', marginTop: '15px' }}
              onClick={() => {
                setCartOpen(false);
                navigate('/checkout');
              }}
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
