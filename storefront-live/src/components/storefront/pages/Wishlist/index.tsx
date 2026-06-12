import React from 'react';

export const Wishlist: React.FC = () => {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2937', marginBottom: '8px' }}>Wishlist</h2>
      <p style={{ color: '#6B7280' }}>This is a placeholder for custom saved product list.</p>
    </div>
  );
};

export const getWishlistCount = (): number => {
  return 0;
};
