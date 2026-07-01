'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerApi } from '@/lib/api-client';

export const Footer: React.FC = () => {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [ftBg, setFtBg] = useState('#111827');
  const [email, setEmail] = useState('');

  const applyContent = (c: Record<string, string>) => {
    setContent(prev => ({ ...prev, ...c }));
    if (c.logo_url !== undefined) setCustomLogoUrl(c.logo_url || null);
    if (c.color_footer_bg) setFtBg(c.color_footer_bg);
    else if (c.color_primary) setFtBg(c.color_primary);
  };

  useEffect(() => {
    customerApi.getPages()
      .then(d => {
        setShop(d.shop);
        applyContent(d.content || {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const isPreview = window.location.search.includes('preview=true');
    if (!isPreview) return;
    const handle = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (!payload) return;
      if (type === 'SETTINGS_UPDATE') applyContent(payload);
      if (type === 'THEME_UPDATE') {
        if (payload.color_footer_bg) setFtBg(payload.color_footer_bg);
        else if (payload.color_primary) setFtBg(payload.color_primary);
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  const go = (url: string) => {
    if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
    else router.push(url);
  };

  const year = new Date().getFullYear();

  // Luminance check for auto text colors
  const isDark = (() => {
    const hex = ftBg.replace('#', '');
    if (hex.length < 6) return true;
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  })();

  const socials = [
    { key: 'social_instagram', label: 'Instagram', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg> },
    { key: 'social_facebook', label: 'Facebook', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { key: 'social_twitter', label: 'Twitter/X', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: 'social_youtube', label: 'YouTube', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> },
    { key: 'social_linkedin', label: 'LinkedIn', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
    { key: 'social_pinterest', label: 'Pinterest', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.266.64 1.266 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.132-1.867 3.132-4.562 0-2.387-1.715-4.054-4.163-4.054-2.836 0-4.498 2.126-4.498 4.324 0 .856.33 1.773.741 2.274a.3.3 0 01.07.286c-.076.315-.245.995-.278 1.134-.044.183-.145.222-.334.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg> },
  ];

  const showNewsletter = content.footer_newsletter !== 'false';
  const copyrightText = content.footer_copyright || `© ${year} ${shop?.name || 'Our Store'}. All rights reserved.`;
  const tagline = content.footer_tagline || shop?.description || 'Quality products, delivered with care.';

  const parseLinks = (json: string | undefined, fallback: { title: string; url: string }[]) => {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch { return fallback; }
  };

  const col1Title = content.footer_col1_title || 'Shop';
  const col1Links = parseLinks(content.footer_col1_links, [
    { title: 'Home', url: '/' }, { title: 'All Products', url: '/products' },
    { title: 'Categories', url: '/categories' }, { title: 'Collections', url: '/collections' }, { title: 'Search', url: '/search' },
  ]);
  const col2Title = content.footer_col2_title || 'Account';
  const col2Links = parseLinks(content.footer_col2_links, [
    { title: 'Sign In', url: '/login' }, { title: 'Create Account', url: '/register' },
    { title: 'My Orders', url: '/account/orders' }, { title: 'Wishlist', url: '/wishlist' }, { title: 'Track Order', url: '/track-order' },
  ]);
  const col3Title = content.footer_col3_title || 'Information';
  const col3Links = parseLinks(content.footer_menu, [
    { title: 'About Us', url: '/about' }, { title: 'Contact Us', url: '/contact' },
    { title: 'Privacy Policy', url: '/privacy' }, { title: 'Terms & Conditions', url: '/terms' }, { title: 'Refund Policy', url: '/refund' },
  ]);
  const bottomLinks = parseLinks(content.footer_bottom_links, [
    { title: 'Privacy', url: '/privacy' }, { title: 'Terms', url: '/terms' }, { title: 'Sitemap', url: '/sitemap' },
  ]);

  const css = `
    .ft {
      font-family: var(--sf-font-body, var(--font-sans, sans-serif));
      margin-top: auto;
    }
    /* Newsletter strip */
    .ft-nl {
      border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
      padding: 36px 32px;
    }
    .ft-nl-inner {
      max-width: 1320px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap;
    }
    .ft-nl-heading {
      font-size: 1rem; font-weight: 700;
      color: ${isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.8)'};
      margin: 0;
    }
    .ft-nl-sub {
      font-size: 0.8rem; margin: 4px 0 0;
      color: ${isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.4)'};
    }
    .ft-nl-form { display: flex; gap: 8px; flex: 1; max-width: 380px; min-width: 220px; }
    .ft-nl-input {
      flex: 1; padding: 10px 14px; border-radius: 6px; outline: none;
      font-size: 0.82rem;
      background: ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'};
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
      color: ${isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)'};
    }
    .ft-nl-input::placeholder { color: ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'}; }
    .ft-nl-btn {
      padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer;
      background: var(--sf-accent, #15803d); color: #fff;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
      transition: opacity 0.15s;
    }
    .ft-nl-btn:hover { opacity: 0.85; }

    /* Main grid */
    .ft-inner {
      max-width: 1320px; margin: 0 auto;
      padding: 56px 32px 48px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.6fr;
      gap: 48px;
    }
    @media (max-width: 1024px) {
      .ft-inner { grid-template-columns: 1fr 1fr; }
      .ft-brand { grid-column: 1 / -1; }
      .ft-nl { padding: 28px 20px; }
    }
    @media (max-width: 560px) {
      .ft-inner { grid-template-columns: 1fr 1fr; padding: 36px 20px 32px; gap: 28px; }
      .ft-brand { grid-column: 1 / -1; }
      .ft-nl-inner { flex-direction: column; align-items: flex-start; gap: 16px; }
      .ft-nl-form { max-width: 100%; width: 100%; }
    }

    /* Brand */
    .ft-logo { height: 36px; width: auto; object-fit: contain; display: block; margin-bottom: 14px; border-radius: 6px; }
    .ft-name {
      font-family: var(--sf-font-heading, var(--font-serif, Georgia, serif));
      font-size: 1.1rem; font-weight: 700; margin-bottom: 10px;
      color: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'};
    }
    .ft-desc {
      font-size: .82rem; line-height: 1.75; margin: 0 0 16px; max-width: 230px;
      color: ${isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.4)'};
    }
    .ft-socials { display: flex; gap: 7px; flex-wrap: wrap; }
    .ft-soc {
      width: 32px; height: 32px; border-radius: 8px;
      background: ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'};
      color: ${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'};
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
      transition: background .15s, color .15s, border-color .15s;
    }
    .ft-soc:hover { background: var(--sf-accent,#15803d); color: #fff; border-color: transparent; }

    /* Column */
    .ft-h {
      font-size: .68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .12em; margin: 0 0 12px;
      color: ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)'};
    }
    .ft-nav { display: flex; flex-direction: column; gap: 8px; }
    .ft-link {
      font-size: .82rem; cursor: pointer; transition: color .13s; width: fit-content;
      color: ${isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.5)'};
    }
    .ft-link:hover { color: ${isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'}; }

    /* Contact */
    .ft-contact { display: flex; flex-direction: column; gap: 8px; }
    .ft-contact-row {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: .8rem; text-decoration: none; transition: color .13s; line-height: 1.5;
      color: ${isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.5)'};
    }
    .ft-contact-row svg { flex-shrink: 0; margin-top: 2px; }
    .ft-contact-row:hover { color: ${isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.8)'}; }

    /* Bottom bar */
    .ft-bar {
      border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
      padding: 14px 32px;
    }
    .ft-bar-inner {
      max-width: 1320px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    }
    .ft-copy {
      font-size: .75rem;
      color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.28)'};
    }
    .ft-bar-links { display: flex; align-items: center; gap: 10px; }
    .ft-bar-dot { font-size: .75rem; color: ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)'}; }
    .ft-bar-link {
      font-size: .75rem; cursor: pointer; transition: color .13s;
      color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.28)'};
    }
    .ft-bar-link:hover { color: ${isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)'}; }

    @media (max-width: 560px) {
      .ft-bar { padding: 12px 20px; }
      .ft-bar-inner { flex-direction: column; align-items: flex-start; gap: 6px; }
    }
  `;

  return (
    <footer style={{ background: ftBg }}>
      <style>{css}</style>

      {/* Newsletter strip */}
      {showNewsletter && (
        <div className="ft-nl">
          <div className="ft-nl-inner">
            <div>
              <p className="ft-nl-heading">{content.footer_newsletter_heading || 'Stay in the loop'}</p>
              <p className="ft-nl-sub">Get exclusive offers, new arrivals and more — straight to your inbox.</p>
            </div>
            <form className="ft-nl-form" onSubmit={e => { e.preventDefault(); setEmail(''); }}>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="ft-nl-input"
                placeholder={content.footer_newsletter_placeholder || 'Enter your email'}
              />
              <button type="submit" className="ft-nl-btn">Subscribe</button>
            </form>
          </div>
        </div>
      )}

      {/* Main columns */}
      <div className="ft-inner">

        {/* Brand */}
        <div className="ft-brand">
          {(customLogoUrl || shop?.logo_url)
            ? <img src={customLogoUrl || shop.logo_url} alt={shop?.name || 'Store'} className="ft-logo" />
            : <div className="ft-name">{shop?.name || 'Our Store'}</div>}
          <p className="ft-desc">{tagline}</p>
          <div className="ft-socials">
            {socials.filter(s => content[s.key]).map(s => (
              <a key={s.key} href={content[s.key]} target="_blank" rel="noreferrer" className="ft-soc" title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Column 1 */}
        <div className="ft-col">
          <h4 className="ft-h">{col1Title}</h4>
          <nav className="ft-nav">
            {col1Links.map((item: any, i: number) => (
              <span key={i} className="ft-link" onClick={() => go(item.url)}>{item.title}</span>
            ))}
          </nav>
        </div>

        {/* Column 2 */}
        <div className="ft-col">
          <h4 className="ft-h">{col2Title}</h4>
          <nav className="ft-nav">
            {col2Links.map((item: any, i: number) => (
              <span key={i} className="ft-link" onClick={() => go(item.url)}>{item.title}</span>
            ))}
          </nav>
        </div>

        {/* Column 3 + Contact */}
        <div className="ft-col">
          <h4 className="ft-h">{col3Title}</h4>
          <nav className="ft-nav">
            {col3Links.map((item: any, i: number) => (
              <span key={i} className="ft-link" onClick={() => go(item.url)}>{item.title}</span>
            ))}
          </nav>

          {(content.contact_email || content.contact_phone || content.contact_address) && (
            <>
              <h4 className="ft-h" style={{ marginTop: 24 }}>Contact</h4>
              <div className="ft-contact">
                {content.contact_email && (
                  <a href={`mailto:${content.contact_email}`} className="ft-contact-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {content.contact_email}
                  </a>
                )}
                {content.contact_phone && (
                  <a href={`tel:${content.contact_phone}`} className="ft-contact-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 010 1.99 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    {content.contact_phone}
                  </a>
                )}
                {content.contact_address && (
                  <span className="ft-contact-row">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {content.contact_address}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="ft-bar">
        <div className="ft-bar-inner">
          <span className="ft-copy">{copyrightText}</span>
          <div className="ft-bar-links">
            {bottomLinks.map((item: any, i: number) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="ft-bar-dot">·</span>}
                <span className="ft-bar-link" onClick={() => go(item.url)}>{item.title}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
