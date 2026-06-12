import React from 'react';

export const Success: React.FC = () => {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>Order Success!</h2>
      <p style={{ color: '#6B7280' }}>Your order has been placed successfully.</p>
    </div>
  );
};
