import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi } from '../../../lib/api-client';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    customerApi.getPages()
      .then(d => { setShop(d.shop); setContent(d.content || {}); })
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="sf-footer">
      <div className="sf-footer-inner">
        {/* Brand */}
        <div className="sf-footer-brand">
          {shop?.logo_url && <img src={shop.logo_url} alt={shop?.name} className="sf-footer-logo" />}
          <div className="sf-footer-shop-name">{shop?.name || 'Our Store'}</div>
          <p className="sf-footer-desc">{shop?.description || content.about_tagline || 'Quality products delivered with care.'}</p>
          <div className="sf-footer-socials">
            {content.social_instagram && (
              <a href={content.social_instagram} target="_blank" rel="noreferrer" className="sf-social-btn" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
              </a>
            )}
            {content.social_facebook && (
              <a href={content.social_facebook} target="_blank" rel="noreferrer" className="sf-social-btn" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="sf-footer-col">
          <h4 className="sf-footer-heading">Shop</h4>
          <nav className="sf-footer-nav">
            <Link to="/" className="sf-footer-link">Home</Link>
            <Link to="/products" className="sf-footer-link">All Products</Link>
            <Link to="/categories" className="sf-footer-link">Categories</Link>
            <Link to="/search" className="sf-footer-link">Search</Link>
          </nav>
        </div>

        {/* Account */}
        <div className="sf-footer-col">
          <h4 className="sf-footer-heading">Account</h4>
          <nav className="sf-footer-nav">
            <Link to="/login" className="sf-footer-link">Sign In</Link>
            <Link to="/register" className="sf-footer-link">Create Account</Link>
            <Link to="/account/orders" className="sf-footer-link">My Orders</Link>
            <Link to="/wishlist" className="sf-footer-link">Wishlist</Link>
          </nav>
        </div>

        {/* Info */}
        <div className="sf-footer-col">
          <h4 className="sf-footer-heading">Information</h4>
          <nav className="sf-footer-nav">
            <Link to="/about" className="sf-footer-link">About Us</Link>
            <Link to="/contact" className="sf-footer-link">Contact Us</Link>
            <Link to="/privacy" className="sf-footer-link">Privacy Policy</Link>
            <Link to="/terms" className="sf-footer-link">Terms & Conditions</Link>
          </nav>
        </div>

        {/* Contact Details */}
        <div className="sf-footer-col">
          <h4 className="sf-footer-heading">Contact</h4>
          <div className="sf-footer-contact">
            {content.contact_email && (
              <a href={`mailto:${content.contact_email}`} className="sf-footer-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {content.contact_email}
              </a>
            )}
            {content.contact_phone && (
              <a href={`tel:${content.contact_phone}`} className="sf-footer-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 010 1.99 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                {content.contact_phone}
              </a>
            )}
            {content.contact_hours && (
              <div className="sf-footer-contact-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {content.contact_hours}
              </div>
            )}
            {!content.contact_email && !content.contact_phone && (
              <button className="sf-footer-contact-cta" onClick={() => navigate('/contact')}>Get in Touch →</button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="sf-footer-bottom">
        <div className="sf-footer-bottom-inner">
          <p className="sf-footer-copy">© {year} {shop?.name || 'Our Store'}. All rights reserved.</p>
          <div className="sf-footer-bottom-links">
            <Link to="/privacy" className="sf-footer-bottom-link">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="sf-footer-bottom-link">Terms</Link>
          </div>
        </div>
      </div>

      <style>{`
        .sf-footer {
          background: #1A1A2E;
          color: #9ca3af;
          font-family: var(--font-sans);
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-top: auto;
        }
        .sf-footer-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 60px 5% 48px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          gap: 40px;
        }
        @media(max-width: 1024px) { .sf-footer-inner { grid-template-columns: 1fr 1fr 1fr; } .sf-footer-brand { grid-column: 1 / -1; } }
        @media(max-width: 600px) { .sf-footer-inner { grid-template-columns: 1fr 1fr; } .sf-footer-brand { grid-column: 1 / -1; } }
        @media(max-width: 400px) { .sf-footer-inner { grid-template-columns: 1fr; } }
        .sf-footer-brand { }
        .sf-footer-logo { height: 44px; width: auto; border-radius: 10px; margin-bottom: 12px; object-fit: contain; }
        .sf-footer-shop-name { font-family: var(--font-serif); font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .sf-footer-desc { font-size: 0.84rem; line-height: 1.7; color: #6b7280; margin: 0 0 16px; max-width: 260px; }
        .sf-footer-socials { display: flex; gap: 10px; }
        .sf-social-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.06); color: #9ca3af; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.2s, color 0.2s; border: 1px solid rgba(255,255,255,0.08); }
        .sf-social-btn:hover { background: var(--sf-accent); color: #fff; border-color: transparent; }
        .sf-footer-col { }
        .sf-footer-heading { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; margin: 0 0 16px; }
        .sf-footer-nav { display: flex; flex-direction: column; gap: 10px; }
        .sf-footer-link { font-size: 0.87rem; color: #6b7280; text-decoration: none; transition: color 0.2s; }
        .sf-footer-link:hover { color: var(--sf-accent-light, #bbf7d0); }
        .sf-footer-contact { display: flex; flex-direction: column; gap: 10px; }
        .sf-footer-contact-row { display: flex; align-items: center; gap: 8px; font-size: 0.83rem; color: #6b7280; text-decoration: none; transition: color 0.2s; }
        .sf-footer-contact-row:hover { color: #9ca3af; }
        .sf-footer-contact-cta { background: none; border: 1px solid rgba(255,255,255,0.12); color: #9ca3af; padding: 8px 14px; border-radius: 8px; font-size: 0.84rem; cursor: pointer; font-family: var(--font-sans); transition: all 0.2s; }
        .sf-footer-contact-cta:hover { border-color: var(--sf-accent); color: var(--sf-accent-light, #bbf7d0); }
        .sf-footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding: 18px 5%; }
        .sf-footer-bottom-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .sf-footer-copy { font-size: 0.8rem; color: #4b5563; margin: 0; }
        .sf-footer-bottom-links { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; color: #4b5563; }
        .sf-footer-bottom-link { color: #4b5563; text-decoration: none; transition: color 0.2s; }
        .sf-footer-bottom-link:hover { color: #9ca3af; }
      `}</style>
    </footer>
  );
};
