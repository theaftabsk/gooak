import React from 'react';

export const LogoCOD: React.FC = () => (
  <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#059669' }}>
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
    <path d="M7 8h4v4H7z" fill="currentColor" opacity="0.15" />
    <path d="M11 6a3 3 0 0 0-3 3M7 8a3 3 0 0 1 3-3" />
  </svg>
);

export const LogoRazorpay: React.FC = () => (
  <img 
    src="https://cdn.prod.website-files.com/6584d3c7e9c648618ca2ec43/65c519f3e5d4c8f86f3b712f_razorpay.webp" 
    alt="Razorpay" 
    style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
  />
);

export const LogoPhonePe: React.FC = () => (
  <img 
    src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png" 
    alt="PhonePe" 
    style={{ width: '56px', height: '56px', objectFit: 'contain' }} 
  />
);
