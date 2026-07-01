'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { catalogApi, customerApi } from '@/lib/api-client';
import { getCurrencySymbol } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageSettings {
  announcement_bar?: string;
  announcement_bar_active?: string;
  about_title?: string;
  about_content?: string;
  about_tagline?: string;
  logo_url?: string;
  [key: string]: any;
}

const DEFAULT_THEME = {
  primaryColor: '#15803D',
  secondaryColor: '#059669',
  backgroundColor: '#FAF7F2',
};

const fallbackBanners = [
  {
    id: 'default-hero-1',
    title: 'Discover Natural Beauty & Health',
    image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200',
    link_url: '/products'
  }
];

// ─── Banner Slider Component ───────────────────────────────────────────────────
const BannerSlider: React.FC<{ banners: any[]; theme: any }> = ({ banners, theme }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const primary = theme.primaryColor || '#15803D';

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div style={{ width: '100%', padding: '24px 24px 0', boxSizing: 'border-box', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '24px',
          boxShadow: '0 20px 48px -12px rgba(0,0,0,0.15)',
        }}
      >
        {banners.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id || index}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                background: `url(${slide.image_url}) center/cover no-repeat`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              } as any}
            >
              {/* Dark semi-transparent overlay to ensure text readability */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  zIndex: 1,
                }}
              />
              
              {/* Slide Content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  padding: '60px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  maxWidth: '720px',
                  margin: '0 auto',
                  textAlign: 'center',
                  alignItems: 'center',
                }}
              >
                {slide.title && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '30px 40px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                    }}
                  >
                    <h1
                      style={{
                        fontSize: 'clamp(1.8rem, 4vw, 3.2rem)',
                        fontWeight: 900,
                        color: '#ffffff',
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                        fontFamily: "'Outfit', sans-serif",
                        textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      {slide.title}
                    </h1>
                    {slide.link_url && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={slide.link_url}
                          style={{
                            display: 'inline-block',
                            background: primary,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            padding: '12px 32px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            boxShadow: `0 6px 20px ${primary}55`,
                            transition: 'transform 0.2s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                        >
                          SHOP NOW
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Navigation arrows (only if multiple slides) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
            >
              ›
            </button>

            {/* Dots indicators */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                gap: '8px',
              }}
            >
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  style={{
                    width: index === currentSlide ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === currentSlide ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [pageSettings, setPageSettings] = useState<PageSettings>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Data states
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);

  // Carousel state
  const catCarouselRef = useRef<HTMLDivElement>(null);

  // ── Load page config ─────────────────────────────────────────────────────
  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, homeData] = await Promise.allSettled([
        customerApi.getPages().catch(() => ({ content: {} })),
        catalogApi.getHomepage().catch(() => ({ banners: [] })),
      ]);
      if (settings.status === 'fulfilled' && settings.value?.content) {
        setPageSettings(settings.value.content);
      }
      if (homeData.status === 'fulfilled' && homeData.value?.banners) {
        setBanners(homeData.value.banners || []);
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, []);

  // ── Load products & categories ───────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      catalogApi.getCategories(),
      catalogApi.getProducts({ limit: 8 }),
      catalogApi.getProducts({ limit: 4 }),
    ]).then(([cats, prods, best]) => {
      const categoriesVal = cats.status === 'fulfilled' ? cats.value : [];
      const productsVal = prods.status === 'fulfilled' ? prods.value?.products : [];
      const bestSellersVal = best.status === 'fulfilled' ? best.value?.products : null;

      setCategories(categoriesVal || []);
      setProducts(productsVal || []);
      setBestSellers(bestSellersVal && bestSellersVal.length > 0 ? bestSellersVal : (productsVal?.slice(0, 4) || []));
    });
  }, []);

  useEffect(() => { loadPage(); }, [loadPage]);

  // ── Sync theme from page content settings ───────────────────────────────
  useEffect(() => {
    if (pageSettings.color_accent || pageSettings.color_bg) {
      setTheme({
        primaryColor: pageSettings.color_accent || DEFAULT_THEME.primaryColor,
        secondaryColor: pageSettings.color_accent_hover || DEFAULT_THEME.secondaryColor,
        backgroundColor: pageSettings.color_bg || DEFAULT_THEME.backgroundColor,
      });
    }
  }, [pageSettings.color_accent, pageSettings.color_bg, pageSettings.color_accent_hover]);

  // ── Preview: respond to THEME_UPDATE from editor iframe parent ──────────
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
  const bg = theme.backgroundColor;

  // ── Category carousel helpers ────────────────────────────────────────────
  const scrollCat = (dir: 'left' | 'right') => {
    const el = catCarouselRef.current;
    if (!el) return;
    const amount = dir === 'right' ? 280 : -280;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: bg, minHeight: '100vh' }}>
        <style>{baseCss}</style>
        <div style={{ height: 40, background: primary, opacity: 0.15 }} />
        <div style={{ height: 480, background: '#f0f0f0', margin: 24, borderRadius: 24, animation: 'shimmer 1.5s infinite' }} />
      </div>
    );
  }

  const aboutTitle = pageSettings.about_title || 'About Us';
  const aboutContent = pageSettings.about_content || 'We are a natural beauty and health company. Our products are chemical-free, handcrafted following traditional methods and formulations.';
  const announcementText = (pageSettings.announcement_bar || '🌿 FREE SHIPPING FOR ORDERS ABOVE ₹500 — 100% Natural Products').replace('₹', getCurrencySymbol());
  const showAnnouncement = pageSettings.announcement_bar_active !== 'false';
  const actualBanners = banners.length > 0 ? banners : fallbackBanners;

  return (
    <div style={{ background: bg, fontFamily: 'var(--sf-font-body, var(--font-sans))', color: 'var(--sf-text-main, #1F2937)', minHeight: '100vh' }}>
      <style>{baseCss}</style>

      {/* ── 1. Announcement Bar ── */}
      {showAnnouncement && (
        <div className="home-announcement" style={{ background: primary }}>
          <div className="home-announcement-inner">
            <span>{announcementText}</span>
          </div>
        </div>
      )}

      {/* ── 2. Hero Banner Slider ── */}
      <BannerSlider banners={actualBanners} theme={theme} />

      {/* ── 3. Categories Carousel ── */}
      {categories.length > 0 && (
        <section className="home-section" style={{ background: '#fff', paddingTop: 56, paddingBottom: 56 }}>
          <div className="home-container">
            <div className="home-section-header">
              <div>
                <span className="home-badge" style={{ color: primary, background: `${primary}14` }}>Collections</span>
                <h2 className="home-section-title">Product Categories</h2>
              </div>
              <a href="/categories" className="home-view-all" style={{ color: primary, borderColor: primary }}>VIEW ALL →</a>
            </div>

            <div className="home-carousel-wrap">
              <button className="home-carousel-btn left" onClick={() => scrollCat('left')} style={{ background: primary }}>‹</button>
              <div className="home-carousel" ref={catCarouselRef}>
                {categories.map((cat, i) => {
                  const cover = cat.image_url || `https://images.unsplash.com/photo-155622857${8 + (i % 5)}?q=80&w=400`;
                  return (
                    <a key={cat.id} href={`/categories/${cat.slug}`} className="home-cat-card">
                      <div className="home-cat-img-wrap">
                        <img src={cover} alt={cat.name} className="home-cat-img" loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=400'; }}
                        />
                      </div>
                      <div className="home-cat-label">{cat.name}</div>
                      <span className="home-cat-shop" style={{ color: primary }}>Shop Now</span>
                    </a>
                  );
                })}
              </div>
              <button className="home-carousel-btn right" onClick={() => scrollCat('right')} style={{ background: primary }}>›</button>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Care Solutions Grid ── */}
      {categories.length > 0 && (
        <section className="home-section" style={{ background: bg, paddingTop: 56, paddingBottom: 56 }}>
          <div className="home-container">
            <div className="home-section-header">
              <div>
                <span className="home-badge" style={{ color: primary, background: `${primary}14` }}>Solutions</span>
                <h2 className="home-section-title">Complete Solution</h2>
              </div>
            </div>
            <div className="home-care-grid">
              {categories.slice(0, 4).map((c, index) => {
                const emojis = ['💆', '🛁', '✨', '🌿'];
                return (
                  <a key={c.id} href={`/categories/${c.slug}`} className="home-care-card" style={{ borderColor: `${primary}22` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = primary; (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = primary; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#1F2937'; (e.currentTarget as HTMLElement).style.borderColor = `${primary}22`; }}
                  >
                    <span className="home-care-emoji">{emojis[index % emojis.length]}</span>
                    <span className="home-care-label">{c.name.toUpperCase()}</span>
                    <span className="home-care-btn">SHOP NOW</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Best Sellers ── */}
      {bestSellers.length > 0 && (
        <section className="home-section" style={{ background: '#fff', paddingTop: 56, paddingBottom: 56 }}>
          <div className="home-container">
            <div className="home-section-header">
              <div>
                <span className="home-badge" style={{ color: primary, background: `${primary}14` }}>Trending</span>
                <h2 className="home-section-title">Best Sellers</h2>
                <p className="home-section-sub">Deals You Can't Miss</p>
              </div>
              <a href="/products" className="home-view-all" style={{ color: primary, borderColor: primary }}>VIEW ALL →</a>
            </div>
            <div className="home-products-grid">
              {bestSellers.map((p) => <ProductCard key={p.id} p={p} primary={primary} size="large" />)}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Featured Collection ── */}
      {products.length > 0 && (
        <section className="home-section" style={{ background: bg, paddingTop: 56, paddingBottom: 56 }}>
          <div className="home-container">
            <div className="home-section-header">
              <div>
                <span className="home-badge" style={{ color: primary, background: `${primary}14` }}>New Arrivals</span>
                <h2 className="home-section-title">Featured Collection</h2>
              </div>
              <a href="/products" className="home-view-all" style={{ color: primary, borderColor: primary }}>VIEW ALL →</a>
            </div>
            <div className="home-products-grid cols-4">
              {products.map((p) => <ProductCard key={p.id} p={p} primary={primary} size="small" />)}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Features Strip ── */}
      <section className="home-section" style={{ background: bg, paddingTop: 40, paddingBottom: 40 }}>
        <div className="home-container">
          <div className="home-features-grid">
            {[
              { emoji: '🚚', title: 'Free & Fast Shipping', desc: 'Ships all over India at no additional costs.' },
              { emoji: '💵', title: 'Free COD Available', desc: 'Cash on Delivery available without any minimum order.' },
              { emoji: '↩️', title: 'Free & Easy Return', desc: 'Easy 7-day return policy for hassle-free experience.' },
              { emoji: '🎧', title: 'Expert Help & Support', desc: 'Monday – Friday (10:00 AM – 07:00 PM)' },
              { emoji: '🔒', title: '100% Payment Protection', desc: 'Secure checkout with easy return policy.' },
            ].map((f) => (
              <div key={f.title} className="home-feature-card"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${primary}22`; (e.currentTarget as HTMLElement).style.borderColor = `${primary}33`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)'; }}
              >
                <span className="home-feature-emoji">{f.emoji}</span>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. About Section ── */}
      <section className="home-section" style={{ background: '#fff', paddingTop: 56, paddingBottom: 56 }}>
        <div className="home-container">
          <div className="home-about-wrap">
            <div className="home-about-content">
              <span className="home-badge" style={{ color: primary, background: `${primary}14` }}>Our Story</span>
              <h2 className="home-section-title" style={{ marginTop: 12 }}>{aboutTitle}</h2>
              <p className="home-about-text">{aboutContent}</p>
              <p className="home-about-tagline" style={{ color: primary }}>
                {pageSettings.about_tagline || '"Live Healthy. Stay Beautiful."'}
              </p>
              <a href="/about" className="home-about-btn" style={{ background: primary }}>Learn More About Us</a>
            </div>
            <div className="home-about-values">
              {[
                { icon: '🌱', label: '100% Natural', desc: pageSettings.value_quality || 'All ingredients certified organic and cruelty-free.' },
                { icon: '🧪', label: 'Chemical Free', desc: pageSettings.value_care || 'No nasties — ever. Safe for skin & hair.' },
                { icon: '🤝', label: 'Women Empowerment', desc: pageSettings.value_empowerment || pageSettings.value_security || 'Supporting women employees to be financially independent.' },
                { icon: '🚀', label: 'Fast Delivery', desc: pageSettings.value_delivery || 'Prompt and reliable shipping across India.' },
              ].map((v) => (
                <div key={v.label} className="home-value-card">
                  <span className="home-value-icon">{v.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>{v.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5 }}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CTA Banner ── */}
      <section style={{
        background: `linear-gradient(135deg, ${primary}, #059669)`,
        padding: '72px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            {pageSettings.cta_title || 'Start your wellness journey today'}
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 0 36px' }}>
            {pageSettings.cta_subtitle || 'Join thousands of happy customers who have transformed their routine with our premium organic products.'}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={pageSettings.cta_btn1_link || '/products'}
              style={{ background: '#fff', color: '#111827', fontWeight: 800, fontSize: '0.92rem', padding: '14px 36px', borderRadius: 12, textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
            >
              {pageSettings.cta_btn1_text || 'Shop All Products'}
            </a>
            <a href={pageSettings.cta_btn2_link || '/about'}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.92rem', padding: '14px 36px', borderRadius: 12, textDecoration: 'none' }}
            >
              {pageSettings.cta_btn2_text || 'Our Story'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper to render dynamic product badges
const renderProductBadge = (p: any, primaryColor?: string) => {
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  
  let labelText = '';
  let badgeColor = primaryColor || '#3B82F6';

  if (p.label) {
    labelText = p.label;
    const lower = p.label.toLowerCase();
    if (lower.includes('hot') || lower.includes('limited')) badgeColor = '#EF4444';
    else if (lower.includes('new') || lower.includes('fresh')) badgeColor = '#10B981';
    else if (lower.includes('deal') || lower.includes('sale')) badgeColor = '#F59E0B';
    else badgeColor = primaryColor || '#4F46E5';
  } else if (p.flash_sale) {
    labelText = 'Flash Sale';
    badgeColor = '#EF4444';
  } else if (p.deal_of_the_day) {
    labelText = 'Deal Of The Day';
    badgeColor = '#F59E0B';
  } else if (p.recommended) {
    labelText = 'Recommended';
    badgeColor = '#8B5CF6';
  } else if (p.recently_added) {
    labelText = 'Recently Added';
    badgeColor = '#10B981';
  } else if (isOnSale) {
    labelText = 'Sale';
    badgeColor = '#EF4444';
  } else if (p.best_seller) {
    labelText = 'Best Seller';
    badgeColor = '#10B981';
  } else if (p.trending) {
    labelText = 'Trending';
    badgeColor = '#EC4899';
  }

  if (!labelText) return null;

  return (
    <span style={{
      position: 'absolute',
      top: 12,
      left: 12,
      background: badgeColor,
      color: '#fff',
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      zIndex: 1
    }}>
      {labelText}
    </span>
  );
};

// ─── Product Card Sub-component ───────────────────────────────────────────────
const ProductCard: React.FC<{ p: any; primary: string; size?: 'large' | 'small' }> = ({ p, primary, size = 'small' }) => {
  const cover = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url ||
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);

  return (
    <a href={`/products/${p.slug}`}
      style={{
        background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden', textDecoration: 'none', color: 'inherit',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.25s, box-shadow 0.25s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'relative', aspectRatio: size === 'large' ? '4/3' : '1', overflow: 'hidden', background: '#F9FAFB' }}>
        <img src={cover} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
        />
        {renderProductBadge(p, primary)}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.95)', color: primary, fontWeight: 800, fontSize: '0.75rem', padding: '7px 20px', borderRadius: 8, letterSpacing: '0.04em' }}>SHOP NOW</span>
        </div>
      </div>
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{p.category?.name || 'Skincare'}</span>
        <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{p.name}</h3>
        <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>100% Natural</p>
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontWeight: 800, color: primary, fontSize: '1rem' }}>{getCurrencySymbol()}{p.price}</span>
            {isOnSale && <span style={{ fontSize: '0.75rem', color: '#9CA3AF', textDecoration: 'line-through' }}>{getCurrencySymbol()}{p.compare_price}</span>}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: primary }}>View →</span>
        </div>
      </div>
    </a>
  );
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const baseCss = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Announcement ── */
  .home-announcement {
    padding: 10px 16px;
    text-align: center;
  }
  .home-announcement-inner {
    max-width: 1200px;
    margin: 0 auto;
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.04em;
  }

  /* ── Layout ── */
  .home-section { width: 100%; box-sizing: border-box; }
  .home-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }

  /* ── Section Header ── */
  .home-section-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 36px; flex-wrap: wrap; gap: 16px;
  }
  .home-section-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 800; color: #111827; margin: 8px 0 0;
    letter-spacing: -0.02em; line-height: 1.2;
  }
  .home-section-sub { font-size: 0.88rem; color: #6B7280; margin: 4px 0 0; }
  .home-badge {
    display: inline-block; font-size: 0.68rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    padding: 4px 14px; border-radius: 99px;
  }
  .home-view-all {
    font-size: 0.82rem; font-weight: 700; text-decoration: none;
    border: 1.5px solid; padding: 8px 20px; border-radius: 10px;
    transition: opacity 0.2s; white-space: nowrap;
  }
  .home-view-all:hover { opacity: 0.7; }

  /* ── Category Carousel ── */
  .home-carousel-wrap {
    position: relative; display: flex; align-items: center; gap: 12px;
  }
  .home-carousel {
    display: flex; gap: 20px; overflow-x: auto; scroll-behavior: smooth;
    scrollbar-width: none; flex: 1;
    padding-bottom: 8px;
  }
  .home-carousel::-webkit-scrollbar { display: none; }
  .home-carousel-btn {
    width: 42px; height: 42px; border-radius: 50%; border: none; color: #fff;
    font-size: 1.4rem; cursor: pointer; flex-shrink: 0; display: flex;
    align-items: center; justify-content: center; transition: opacity 0.2s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2;
  }
  .home-carousel-btn:hover { opacity: 0.85; }
  .home-cat-card {
    flex: 0 0 160px; display: flex; flex-direction: column; align-items: center;
    gap: 10px; text-decoration: none; color: inherit;
    transition: transform 0.25s;
  }
  .home-cat-card:hover { transform: translateY(-4px); }
  .home-cat-img-wrap {
    width: 140px; height: 140px; border-radius: 50%; overflow: hidden;
    border: 3px solid rgba(0,0,0,0.06); background: #F9FAFB;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  .home-cat-img { width: 100%; height: 100%; object-fit: cover; }
  .home-cat-label { font-weight: 700; font-size: 0.88rem; color: #111827; text-align: center; }
  .home-cat-shop { font-size: 0.75rem; font-weight: 700; }

  /* ── Care Grid ── */
  .home-care-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;
  }
  .home-care-card {
    border: 2px solid; border-radius: 20px; padding: 32px 20px;
    text-align: center; text-decoration: none; color: #1F2937;
    background: #fff; display: flex; flex-direction: column;
    align-items: center; gap: 12px;
    transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
  }
  .home-care-card:hover { transform: translateY(-4px); }
  .home-care-emoji { font-size: 2.2rem; }
  .home-care-label { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 0.9rem; letter-spacing: 0.04em; }
  .home-care-btn {
    font-size: 0.72rem; font-weight: 700; border: 1.5px solid currentColor;
    padding: 6px 16px; border-radius: 8px; margin-top: 4px;
    transition: all 0.2s;
  }

  /* ── Products Grid ── */
  .home-products-grid {
    display: grid; gap: 24px;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  .home-products-grid.cols-4 {
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  }

  /* ── Testimonials ── */
  .home-testimonials-grid {
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  .home-testimonial-card {
    background: #FAF7F2; border: 1px solid rgba(0,0,0,0.06); border-radius: 18px;
    padding: 24px; display: flex; flex-direction: column; gap: 10px;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .home-testimonial-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
  .home-testimonial-avatar {
    width: 40px; height: 40px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; color: #fff;
    font-weight: 800; font-size: 1rem;
  }
  .home-testimonial-text {
    font-size: 0.85rem; color: #4B5563; line-height: 1.65; margin: 0;
    font-style: italic;
  }

  /* ── Features Grid ── */
  .home-features-grid {
    display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  .home-feature-card {
    background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 18px;
    padding: 28px 20px; text-align: center;
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .home-feature-card:hover { transform: translateY(-4px); }
  .home-feature-emoji { font-size: 2rem; display: block; margin-bottom: 12px; }
  .home-feature-title { font-family: 'Outfit', sans-serif; font-size: 0.92rem; font-weight: 700; color: #111827; margin: 0 0 8px; }
  .home-feature-desc { font-size: 0.78rem; color: #6B7280; line-height: 1.5; margin: 0; }

  /* ── About Section ── */
  .home-about-wrap {
    display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start;
  }
  .home-about-content { display: flex; flex-direction: column; gap: 0; }
  .home-about-text {
    font-size: 0.92rem; color: #4B5563; line-height: 1.75; margin: 16px 0;
  }
  .home-about-tagline {
    font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700;
    font-style: italic; margin: 0 0 24px;
  }
  .home-about-btn {
    display: inline-block; color: #fff; font-weight: 700; font-size: 0.88rem;
    padding: 13px 30px; border-radius: 12px; text-decoration: none;
    transition: opacity 0.2s, transform 0.2s; align-self: flex-start;
  }
  .home-about-btn:hover { opacity: 0.85; transform: translateY(-2px); }
  .home-about-values { display: flex; flex-direction: column; gap: 16px; }
  .home-value-card {
    display: flex; align-items: flex-start; gap: 16px;
    background: #FAF7F2; border: 1px solid rgba(0,0,0,0.06);
    border-radius: 14px; padding: 18px 20px;
    transition: transform 0.2s;
  }
  .home-value-card:hover { transform: translateX(4px); }
  .home-value-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .home-about-wrap { grid-template-columns: 1fr; gap: 36px; }
  }
  @media (max-width: 640px) {
    .home-care-grid { grid-template-columns: 1fr 1fr; }
    .home-products-grid { grid-template-columns: 1fr 1fr; }
    .home-testimonials-grid { grid-template-columns: 1fr; }
    .home-features-grid { grid-template-columns: 1fr 1fr; }
    .home-cat-img-wrap { width: 110px; height: 110px; }
    .home-cat-card { flex: 0 0 130px; }
  }
  @media (max-width: 400px) {
    .home-care-grid { grid-template-columns: 1fr; }
    .home-products-grid { grid-template-columns: 1fr; }
    .home-features-grid { grid-template-columns: 1fr; }
  }
`;
