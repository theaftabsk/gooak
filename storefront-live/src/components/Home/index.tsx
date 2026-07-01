'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { catalogApi, customerApi } from '@/lib/api-client';
import { getCurrencySymbol } from '@/lib/utils';

interface PageSettings { [key: string]: any; }

const CAT_FALLBACKS = [
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=600',
];

const DEFAULT_THEME = {
  primaryColor: '#15803D',
  secondaryColor: '#059669',
  backgroundColor: '#ffffff',
};

const fallbackBanners = [{
  id: 'fallback',
  title: 'New Collection',
  subtitle: 'Discover what\'s new this season',
  image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1600',
  link_url: '/products',
  button_label: 'Shop Now',
}];

// ─── Banner Slider ─────────────────────────────────────────────────────────────

const BannerSlider: React.FC<{ banners: any[] }> = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => go((current + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length, current]);

  const go = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 600);
  };

  if (!banners.length) return null;

  const slide = banners[current];
  const pos = slide.text_position || 'mid-center';
  const alignH = pos.includes('left') ? 'flex-start' : pos.includes('right') ? 'flex-end' : 'center';
  const alignV = pos.includes('top') ? 'flex-start' : pos.includes('bot') ? 'flex-end' : 'center';
  const textAlign: 'left' | 'center' | 'right' = pos.includes('left') ? 'left' : pos.includes('right') ? 'right' : 'center';
  const padH = pos.includes('left') ? '7% 50% 7% 7%' : pos.includes('right') ? '7% 7% 7% 50%' : '7%';

  return (
    <div className="bnr">
      {banners.map((b, i) => (
        <div key={i} className={`bnr-slide${i === current ? ' bnr-slide--on' : ''}${animating && i === current ? ' bnr-slide--in' : ''}`}
          style={{ backgroundImage: `url(${b.image_url})` }}>
          <div className="bnr-overlay" />
          <div className="bnr-content" style={{ alignItems: alignH, justifyContent: alignV, padding: padH, textAlign }}>
            {b.subtitle && <p className="bnr-sub">{b.subtitle}</p>}
            {b.title && <h1 className="bnr-title" style={{ fontFamily: b.title_font ? `'${b.title_font}', serif` : undefined }}>{b.title}</h1>}
            {(b.button_label || b.link_url) && (
              <a href={b.link_url || '/products'} className="bnr-cta">
                {b.button_label || 'Shop Now'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
            )}
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button className="bnr-arrow bnr-arrow--l" onClick={() => go((current - 1 + banners.length) % banners.length)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="bnr-arrow bnr-arrow--r" onClick={() => go((current + 1) % banners.length)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="bnr-dots">
            {banners.map((_, i) => (
              <button key={i} className={`bnr-dot${i === current ? ' bnr-dot--on' : ''}`} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section Label ─────────────────────────────────────────────────────────────

const SectionHead: React.FC<{ label?: string; title: string; sub?: string; center?: boolean; viewAllUrl?: string; viewAllLabel?: string }> = ({
  label, title, sub, center, viewAllUrl, viewAllLabel,
}) => (
  <div className={`sh${center ? ' sh--c' : ''}`}>
    <div className="sh-left">
      {label && <p className="sh-label">{label}</p>}
      <h2 className="sh-title">{title}</h2>
      {sub && <p className="sh-sub">{sub}</p>}
    </div>
    {viewAllUrl && (
      <a href={viewAllUrl} className="sh-all">{viewAllLabel || 'View All'} →</a>
    )}
  </div>
);

// ─── Product Card ──────────────────────────────────────────────────────────────

const ProductCard: React.FC<{ p: any; primary: string; ratio?: string }> = ({ p, primary, ratio = '3/4' }) => {
  const cover = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || '';
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  const curr = getCurrencySymbol();

  const badge = (() => {
    if (p.label) return p.label;
    if (p.flash_sale) return 'Sale';
    if (p.deal_of_the_day) return 'Deal';
    if (p.best_seller) return 'Best Seller';
    if (p.recently_added) return 'New';
    if (isOnSale) return 'Sale';
    if (p.trending) return 'Trending';
    return null;
  })();

  return (
    <a href={`/products/${p.slug}`} className="pc">
      <div className="pc-img-wrap" style={{ aspectRatio: ratio }}>
        {cover
          ? <img src={cover} alt={p.name} className="pc-img" loading="lazy" />
          : <div className="pc-img-ph" />}
        {badge && <span className="pc-badge">{badge}</span>}
      </div>
      <div className="pc-info">
        {p.category?.name && <span className="pc-cat">{p.category.name}</span>}
        <h3 className="pc-name">{p.name}</h3>
        <div className="pc-price-row">
          <span className="pc-price" style={{ color: primary }}>{curr}{Number(p.price).toFixed(2)}</span>
          {isOnSale && <span className="pc-compare">{curr}{Number(p.compare_price).toFixed(2)}</span>}
        </div>
      </div>
    </a>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [pageSettings, setPageSettings] = useState<PageSettings>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const catRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, homeData] = await Promise.allSettled([
        customerApi.getPages().catch(() => ({ content: {} })),
        catalogApi.getHomepage().catch(() => ({ banners: [] })),
      ]);
      if (settings.status === 'fulfilled' && settings.value?.content) setPageSettings(settings.value.content);
      if (homeData.status === 'fulfilled') setBanners(homeData.value?.banners || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPage(); }, [loadPage]);

  useEffect(() => {
    Promise.allSettled([
      catalogApi.getCategories(),
      catalogApi.getProducts({ limit: 8 }),
    ]).then(([cats, prods]) => {
      setCategories(cats.status === 'fulfilled' ? (cats.value || []) : []);
      setProducts(prods.status === 'fulfilled' ? (prods.value?.products || []) : []);
    });
  }, []);

  useEffect(() => {
    if (pageSettings.color_accent) {
      setTheme({
        primaryColor: pageSettings.color_accent || DEFAULT_THEME.primaryColor,
        secondaryColor: pageSettings.color_accent_hover || DEFAULT_THEME.secondaryColor,
        backgroundColor: pageSettings.color_bg || DEFAULT_THEME.backgroundColor,
      });
    }
  }, [pageSettings.color_accent, pageSettings.color_bg, pageSettings.color_accent_hover]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'THEME_UPDATE' && e.data?.payload) {
        const p = e.data.payload;
        setTheme({
          primaryColor: p.color_accent || DEFAULT_THEME.primaryColor,
          secondaryColor: p.color_accent_hover || DEFAULT_THEME.secondaryColor,
          backgroundColor: p.color_bg || DEFAULT_THEME.backgroundColor,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const primary = theme.primaryColor;
  const showAnnouncement = pageSettings.announcement_bar_active !== 'false';
  const announcementText = (pageSettings.announcement_bar || 'FREE SHIPPING ON ORDERS ABOVE ₹500').replace('₹', getCurrencySymbol());
  const actualBanners = banners.length > 0 ? banners : fallbackBanners;
  const menuCats = categories.filter((c: any) => c.show_in_menu !== false);

  const scrollCat = (dir: 'left' | 'right') => {
    catRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' });
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--sf-bg, #fff)' }}>
      <style>{css}</style>
      <div className="sk-hero" />
    </div>
  );

  return (
    <div style={{ background: 'var(--sf-bg, #fff)', color: 'var(--sf-text-main, #111)', minHeight: '100vh', fontFamily: 'var(--font-sans, sans-serif)', overflowX: 'hidden' }}>
      <style>{css}</style>

      {/* Announcement */}
      {showAnnouncement && (
        <div className="ann" style={{ background: 'var(--sf-text-main, #111)', color: 'var(--sf-bg, #fff)' }}>
          <span>{announcementText}</span>
        </div>
      )}

      {/* Hero */}
      <BannerSlider banners={actualBanners} />

      {/* Categories */}
      {menuCats.length > 0 && (
        <section className="sec">
          <div className="con">
            <SectionHead label="Browse" title="Categories" viewAllUrl="/categories" />
            <div className="cat-wrap">
              <button className="cat-arr cat-arr--l" onClick={() => scrollCat('left')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="cat-scroll" ref={catRef}>
                {menuCats.map((cat: any, idx: number) => (
                  <a key={cat.id} href={`/categories/${cat.slug}`} className="cat-card">
                    <div className="cat-img-wrap">
                      <img
                        src={cat.image_url || CAT_FALLBACKS[idx % CAT_FALLBACKS.length]}
                        alt={cat.name}
                        className="cat-img"
                        loading="lazy"
                      />
                    </div>
                    <span className="cat-name">{cat.name}</span>
                  </a>
                ))}
              </div>
              <button className="cat-arr cat-arr--r" onClick={() => scrollCat('right')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Products grid */}
      {products.length > 0 && (
        <section className="sec sec--alt">
          <div className="con">
            <SectionHead label="New Arrivals" title="The Collection" viewAllUrl="/products" />
            <div className="pg">
              {products.map(p => <ProductCard key={p.id} p={p} primary={primary} />)}
            </div>
          </div>
        </section>
      )}

      {/* Features strip */}
      <section className="sec sec--strip">
        <div className="con">
          <div className="strip">
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, title: 'Free Shipping', desc: 'On all orders above ₹500' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>, title: 'Easy Returns', desc: '7-day hassle-free returns' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Secure Payment', desc: '100% protected checkout' },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, title: 'Customer Support', desc: 'Mon–Fri, 10am–7pm' },
            ].map((f, i) => (
              <div key={i} className="strip-item">
                <div className="strip-icon" style={{ color: primary }}>{f.icon}</div>
                <div>
                  <div className="strip-title">{f.title}</div>
                  <div className="strip-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      {(pageSettings.about_title || pageSettings.about_content) && (
        <section className="sec">
          <div className="con">
            <div className="about">
              <div className="about-left">
                <p className="sh-label">Our Story</p>
                <h2 className="about-title">{pageSettings.about_title || 'About Us'}</h2>
                <p className="about-body">{pageSettings.about_content || ''}</p>
                {pageSettings.about_tagline && (
                  <p className="about-tagline" style={{ color: primary }}>{pageSettings.about_tagline}</p>
                )}
                <a href="/about" className="about-cta" style={{ borderColor: 'var(--sf-text-main, #111)', color: 'var(--sf-text-main, #111)' }}>Learn More</a>
              </div>
              <div className="about-right">
                {[
                  { label: '100% Natural', desc: pageSettings.value_quality || 'All ingredients certified organic.' },
                  { label: 'Chemical Free', desc: pageSettings.value_care || 'No harmful additives — ever.' },
                  { label: 'Ethically Made', desc: pageSettings.value_empowerment || 'Supporting fair-trade communities.' },
                  { label: 'Fast Delivery', desc: pageSettings.value_delivery || 'Prompt shipping across India.' },
                ].map((v, i) => (
                  <div key={i} className="about-val">
                    <span className="about-val-num" style={{ color: primary }}>0{i + 1}</span>
                    <div>
                      <div className="about-val-label">{v.label}</div>
                      <div className="about-val-desc">{v.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-sec" style={{ background: 'var(--sf-text-main, #111)' }}>
        <div className="con cta-inner">
          <h2 className="cta-title" style={{ color: 'var(--sf-bg, #fff)' }}>
            {pageSettings.cta_title || 'Start Your Journey'}
          </h2>
          <p className="cta-sub" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {pageSettings.cta_subtitle || 'Premium quality, delivered to your door.'}
          </p>
          <div className="cta-btns">
            <a href={pageSettings.cta_btn1_link || '/products'} className="cta-btn cta-btn--light">
              {pageSettings.cta_btn1_text || 'Shop All'}
            </a>
            <a href={pageSettings.cta_btn2_link || '/about'} className="cta-btn cta-btn--ghost">
              {pageSettings.cta_btn2_text || 'Our Story'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── CSS ───────────────────────────────────────────────────────────────────────

const css = `
  /* ── Skeleton ── */
  .sk-hero { height: 92vh; background: #f0f0f0; animation: sk 1.6s ease infinite; background-size: 400% 100%; background-image: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%); }
  @keyframes sk { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

  /* ── Announcement ── */
  .ann {
    text-align: center; padding: 9px 20px;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  /* ── Banner ── */
  .bnr {
    position: relative; width: 100%; height: 92vh; min-height: 500px; overflow: hidden;
    background: #111;
  }
  .bnr-slide {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    opacity: 0; transition: opacity 0.7s ease;
    display: flex;
  }
  .bnr-slide--on { opacity: 1; z-index: 1; }
  .bnr-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%);
  }
  .bnr-content {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; gap: 20px;
    width: 100%; max-width: 1280px; margin: 0 auto; padding: 7%;
    box-sizing: border-box;
  }
  .bnr-sub {
    font-size: 0.78rem; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: rgba(255,255,255,0.75); margin: 0;
  }
  .bnr-title {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: clamp(2.4rem, 6vw, 5.5rem); font-weight: 700;
    color: #fff; margin: 0; line-height: 1.04; letter-spacing: -0.02em;
    max-width: 14ch;
  }
  .bnr-cta {
    display: inline-flex; align-items: center; gap: 10px;
    color: #fff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; text-decoration: none;
    border-bottom: 1.5px solid rgba(255,255,255,0.6); padding-bottom: 4px;
    transition: border-color 0.2s; width: fit-content;
  }
  .bnr-cta:hover { border-color: #fff; }
  .bnr-arrow {
    position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
    width: 44px; height: 44px; background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25); border-radius: 50%;
    color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s; backdrop-filter: blur(4px);
  }
  .bnr-arrow:hover { background: rgba(255,255,255,0.25); }
  .bnr-arrow--l { left: 24px; }
  .bnr-arrow--r { right: 24px; }
  .bnr-dots {
    position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
    z-index: 3; display: flex; gap: 6px;
  }
  .bnr-dot {
    width: 24px; height: 2px; background: rgba(255,255,255,0.4);
    border: none; cursor: pointer; transition: all 0.3s; border-radius: 1px; padding: 0;
  }
  .bnr-dot--on { width: 40px; background: #fff; }

  /* ── Layout ── */
  .sec { padding: 80px 0; }
  .sec--alt { background: var(--sf-card-bg, #fafafa); }
  .sec--strip { padding: 48px 0; border-top: 1px solid var(--sf-border, #e5e7eb); border-bottom: 1px solid var(--sf-border, #e5e7eb); }
  .con { max-width: 1280px; margin: 0 auto; padding: 0 40px; box-sizing: border-box; }

  /* ── Section header ── */
  .sh { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 40px; gap: 16px; flex-wrap: wrap; }
  .sh--c { flex-direction: column; align-items: center; text-align: center; }
  .sh-label {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--sf-text-muted, #6b7280);
    margin: 0 0 8px;
  }
  .sh-title {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 700;
    color: var(--sf-text-main, #111); margin: 0; letter-spacing: -0.02em; line-height: 1.1;
  }
  .sh-sub { font-size: 0.88rem; color: var(--sf-text-muted, #6b7280); margin: 6px 0 0; }
  .sh-all {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--sf-text-main, #111); text-decoration: none;
    border-bottom: 1.5px solid var(--sf-text-main, #111); padding-bottom: 2px;
    white-space: nowrap; transition: opacity 0.2s;
  }
  .sh-all:hover { opacity: 0.55; }

  /* ── Categories ── */
  .cat-wrap { position: relative; display: flex; align-items: center; gap: 12px; }
  .cat-scroll {
    display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth;
    scrollbar-width: none; flex: 1; min-width: 0;
  }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-arr {
    width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%;
    border: 1px solid var(--sf-border, #e5e7eb); background: var(--sf-bg, #fff);
    color: var(--sf-text-main, #111); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s; z-index: 2;
  }
  .cat-arr:hover { background: var(--sf-text-main, #111); color: var(--sf-bg, #fff); }
  .cat-card {
    flex: 0 0 180px; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 12px;
  }
  .cat-img-wrap {
    width: 100%; aspect-ratio: 3/4; overflow: hidden; background: var(--sf-card-bg, #f5f5f5);
  }
  .cat-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .cat-card:hover .cat-img { transform: scale(1.04); }
  .cat-img-ph { width: 100%; height: 100%; background: #e5e7eb; }
  .cat-name {
    font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em;
    color: var(--sf-text-main, #111); text-transform: uppercase;
  }

  /* ── Products Grid ── */
  .pg {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px 20px;
  }
  .pc { text-decoration: none; color: inherit; display: flex; flex-direction: column; }
  .pc-img-wrap { width: 100%; overflow: hidden; background: var(--sf-card-bg, #f5f5f5); position: relative; }
  .pc-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; display: block; }
  .pc:hover .pc-img { transform: scale(1.04); }
  .pc-img-ph { width: 100%; height: 100%; background: #e5e7eb; }
  .pc-badge {
    position: absolute; top: 12px; left: 12px;
    background: var(--sf-text-main, #111); color: var(--sf-bg, #fff);
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 4px 9px;
  }
  .pc-info { padding: 14px 2px 0; display: flex; flex-direction: column; gap: 4px; }
  .pc-cat {
    font-size: 0.62rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--sf-text-muted, #9ca3af);
  }
  .pc-name {
    font-size: 0.88rem; font-weight: 500; color: var(--sf-text-main, #111);
    margin: 0; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .pc-price-row { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
  .pc-price { font-size: 0.88rem; font-weight: 700; }
  .pc-compare {
    font-size: 0.78rem; color: var(--sf-text-muted, #9ca3af); text-decoration: line-through;
  }

  /* ── Features Strip ── */
  .strip {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; border: 1px solid var(--sf-border, #e5e7eb);
  }
  .strip-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 28px 24px; border-right: 1px solid var(--sf-border, #e5e7eb);
  }
  .strip-item:last-child { border-right: none; }
  .strip-icon { flex-shrink: 0; margin-top: 2px; }
  .strip-title { font-size: 0.82rem; font-weight: 700; color: var(--sf-text-main, #111); margin-bottom: 3px; }
  .strip-desc { font-size: 0.73rem; color: var(--sf-text-muted, #6b7280); line-height: 1.5; }

  /* ── About ── */
  .about {
    display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start;
  }
  .about-left { display: flex; flex-direction: column; gap: 0; }
  .about-title {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: clamp(2rem, 4vw, 3rem); font-weight: 700;
    color: var(--sf-text-main, #111); margin: 8px 0 20px; letter-spacing: -0.02em; line-height: 1.1;
  }
  .about-body {
    font-size: 0.92rem; color: var(--sf-text-muted, #4b5563);
    line-height: 1.8; margin: 0 0 18px;
  }
  .about-tagline {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: 1.1rem; font-style: italic; margin: 0 0 28px; font-weight: 600;
  }
  .about-cta {
    display: inline-block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; text-decoration: none;
    border: 1.5px solid; padding: 12px 28px; transition: all 0.2s;
    align-self: flex-start;
  }
  .about-cta:hover { background: var(--sf-text-main, #111); color: var(--sf-bg, #fff) !important; border-color: var(--sf-text-main, #111) !important; }
  .about-right { display: flex; flex-direction: column; gap: 0; }
  .about-val {
    display: flex; align-items: flex-start; gap: 20px;
    padding: 24px 0; border-bottom: 1px solid var(--sf-border, #e5e7eb);
  }
  .about-val:first-child { border-top: 1px solid var(--sf-border, #e5e7eb); }
  .about-val-num {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: 1.4rem; font-weight: 700; flex-shrink: 0; line-height: 1; padding-top: 2px;
  }
  .about-val-label { font-size: 0.85rem; font-weight: 700; color: var(--sf-text-main, #111); margin-bottom: 4px; }
  .about-val-desc { font-size: 0.78rem; color: var(--sf-text-muted, #6b7280); line-height: 1.55; }

  /* ── CTA ── */
  .cta-sec { padding: 100px 0; }
  .cta-inner { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px; }
  .cta-title {
    font-family: var(--sf-font-heading, var(--font-serif, serif));
    font-size: clamp(2rem, 5vw, 4rem); font-weight: 700;
    margin: 0; letter-spacing: -0.02em; line-height: 1.08; max-width: 16ch;
  }
  .cta-sub { font-size: 0.92rem; margin: 0; line-height: 1.7; max-width: 44ch; }
  .cta-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
  .cta-btn {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    text-decoration: none; padding: 14px 36px; transition: all 0.2s;
  }
  .cta-btn--light { background: #fff; color: #111; }
  .cta-btn--light:hover { background: #f0f0f0; }
  .cta-btn--ghost { border: 1.5px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
  .cta-btn--ghost:hover { border-color: rgba(255,255,255,0.7); color: #fff; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .pg { grid-template-columns: repeat(3, 1fr); }
    .strip { grid-template-columns: repeat(2, 1fr); }
    .strip-item:nth-child(2) { border-right: none; }
    .strip-item:nth-child(3) { border-top: 1px solid var(--sf-border, #e5e7eb); }
  }
  @media (max-width: 768px) {
    .bnr { height: 70vh; }
    .sec { padding: 56px 0; }
    .con { padding: 0 20px; }
    .about { grid-template-columns: 1fr; gap: 48px; }
    .pg { grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
    .cat-card { flex: 0 0 130px; }
    .cat-arr { display: none; }
    .cta-sec { padding: 64px 0; }
  }
  @media (max-width: 480px) {
    .bnr { height: 60vh; min-height: 400px; }
    .bnr-title { font-size: clamp(1.8rem, 8vw, 2.8rem); }
    .strip { grid-template-columns: 1fr 1fr; }
    .strip-item { padding: 18px 14px; gap: 10px; }
  }
`;
