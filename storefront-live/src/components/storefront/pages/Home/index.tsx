import React from 'react';

export const Home: React.FC = () => {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: '#1F2937' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(to right, #10B981, #059669)',
        color: 'white',
        borderRadius: '24px',
        padding: '60px 40px',
        textAlign: 'center',
        marginBottom: '40px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>Welcome to nature's finest</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' }}>
          Discover our curated collection of premium organic skincare products designed to restore and rejuvenate your natural glow.
        </p>
        <a 
          href="/products" 
          style={{
            display: 'inline-block',
            background: 'white',
            color: '#059669',
            padding: '12px 32px',
            borderRadius: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
        >
          Explore Collection
        </a>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}>🌱</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>100% Organic</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.5' }}>All ingredients are certified organic, cruelty-free, and ethically sourced.</p>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}>✨</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Radiant Glow</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.5' }}>Specifically formulated to nurture, protect, and enhance your natural skin health.</p>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}>🚀</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Free Shipping</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.5' }}>Complimentary shipping on all orders over ₹499 directly to your doorstep.</p>
        </div>
      </div>
    </div>
  );
};
