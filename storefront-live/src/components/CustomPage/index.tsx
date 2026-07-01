'use client';
import React, { useEffect, useRef, useState } from 'react';
import { storefrontApi } from '@/lib/api-client';
import { getCurrencySymbol } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';

// ── Section type registry ─────────────────────────────────────────────────────

type Section =
  | { type: 'hero';               data: HeroData }
  | { type: 'rich_text';          data: RichTextData }
  | { type: 'image_text';         data: ImageTextData }
  | { type: 'cards';              data: CardsData }
  | { type: 'cta';                data: CtaData }
  | { type: 'contact_form';       data: ContactFormData }
  | { type: 'announcement_bar';   data: AnnouncementBarData }
  | { type: 'banner_slider';      data: BannerSliderData }
  | { type: 'categories_carousel';data: CategoriesCarouselData }
  | { type: 'products_grid';      data: ProductsGridData }
  | { type: 'features_strip';     data: FeaturesStripData }
  | { type: 'about_section';      data: AboutSectionData };

interface HeroData { title: string; subtitle?: string; bg_image?: string; bg_color?: string; button_label?: string; button_url?: string }
interface RichTextData { title?: string; html: string }
interface ImageTextData { title?: string; text: string; image_url: string; image_side?: 'left' | 'right' }
interface CardsData { title?: string; items: { icon?: string; title: string; text: string }[] }
interface CtaData { title: string; subtitle?: string; button_label: string; button_url: string; bg_color?: string; button2_label?: string; button2_url?: string }
interface ContactFormData { title?: string; subtitle?: string }
interface AnnouncementBarData { text: string; active?: boolean }
interface BannerSliderData { banners?: { title?: string; image_url: string; link_url?: string }[] }
interface CategoriesCarouselData { title?: string; badge?: string }
interface ProductsGridData { title?: string; badge?: string; subtitle?: string; limit?: number; view_all_url?: string; view_all_label?: string; columns?: 3 | 4 }
interface FeaturesStripData { items?: { emoji: string; title: string; desc: string }[] }
interface AboutSectionData { title?: string; content?: string; tagline?: string; image_url?: string; values?: { icon: string; label: string; desc: string }[]; button_label?: string; button_url?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT = 'var(--sf-accent, #15803D)';
const ACCENT_LIGHT = 'var(--sf-accent-light, rgba(21,128,61,0.08))';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px', borderRadius: 99, color: ACCENT, background: ACCENT_LIGHT }}>
      {children}
    </span>
  );
}

function SectionHeader({ badge, title, subtitle, viewAllUrl, viewAllLabel }: { badge?: string; title: string; subtitle?: string; viewAllUrl?: string; viewAllLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
      <div>
        {badge && <Badge>{badge}</Badge>}
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: '#111827', margin: badge ? '8px 0 0' : '0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.88rem', color: '#6B7280', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {viewAllUrl && (
        <a href={viewAllUrl} style={{ fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', border: `1.5px solid ${ACCENT}`, color: ACCENT, padding: '8px 20px', borderRadius: 10, whiteSpace: 'nowrap' }}>
          {viewAllLabel || 'VIEW ALL →'}
        </a>
      )}
    </div>
  );
}

// ── Static Section Renderers ──────────────────────────────────────────────────

function SectionHero({ data }: { data: HeroData }) {
  return (
    <div className="cp-hero" style={data.bg_image ? { backgroundImage: `url(${data.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : data.bg_color ? { background: data.bg_color } : undefined}>
      <div className="cp-hero-inner">
        <h1 className="cp-hero-title">{data.title}</h1>
        {data.subtitle && <p className="cp-hero-sub">{data.subtitle}</p>}
        {data.button_label && (
          <a href={data.button_url || '#'} className="cp-btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>{data.button_label}</a>
        )}
      </div>
    </div>
  );
}

function SectionRichText({ data }: { data: RichTextData }) {
  return (
    <div className="cp-section">
      <div className="cp-container">
        {data.title && <h2 className="cp-section-title">{data.title}</h2>}
        <div className="cp-rich-text" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </div>
  );
}

function SectionImageText({ data }: { data: ImageTextData }) {
  return (
    <div className="cp-section">
      <div className="cp-container">
        <div className="cp-image-text" style={{ flexDirection: data.image_side === 'left' ? 'row-reverse' : 'row' }}>
          <div className="cp-image-text-img"><img src={data.image_url} alt={data.title || ''} /></div>
          <div className="cp-image-text-body">
            {data.title && <h2 className="cp-section-title">{data.title}</h2>}
            <p className="cp-text">{data.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCards({ data }: { data: CardsData }) {
  return (
    <div className="cp-section cp-section-alt">
      <div className="cp-container">
        {data.title && <h2 className="cp-section-title" style={{ textAlign: 'center' }}>{data.title}</h2>}
        <div className="cp-cards">
          {data.items.map((item, i) => (
            <div key={i} className="cp-card">
              {item.icon && <div className="cp-card-icon">{item.icon}</div>}
              <h3 className="cp-card-title">{item.title}</h3>
              <p className="cp-card-text" style={{ whiteSpace: 'pre-line' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionCta({ data }: { data: CtaData }) {
  const bg = data.bg_color || `linear-gradient(135deg, ${ACCENT}, #059669)`;
  return (
    <div style={{ background: bg, padding: '70px 5%', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{data.title}</h2>
        {data.subtitle && <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 28px', lineHeight: 1.6 }}>{data.subtitle}</p>}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={data.button_url} style={{ background: '#fff', color: '#111827', fontWeight: 800, fontSize: '0.9rem', padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>{data.button_label}</a>
          {data.button2_label && (
            <a href={data.button2_url || '#'} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.9rem', padding: '13px 32px', borderRadius: 12, textDecoration: 'none' }}>{data.button2_label}</a>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionContactForm({ data }: { data: ContactFormData }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await storefrontApi.submitContact({ name: form.name, email: form.email, subject: form.subject, message: form.message });
      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="cp-section">
      <div className="cp-container" style={{ maxWidth: 640 }}>
        {data.title && <h2 className="cp-section-title">{data.title}</h2>}
        {data.subtitle && <p className="cp-text" style={{ marginBottom: 28 }}>{data.subtitle}</p>}
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <p style={{ marginTop: 12 }}>Your message has been sent! We'll get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-form-row">
              <input className="cp-input" type="text" placeholder="Your name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input className="cp-input" type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <input className="cp-input" type="text" placeholder="Subject (optional)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            <textarea className="cp-input cp-textarea" placeholder="Your message *" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: 8 }}>{errorMsg}</p>}
            <button className="cp-btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Dynamic Section Renderers (fetch their own data) ──────────────────────────

function SectionAnnouncementBar({ data }: { data: AnnouncementBarData }) {
  if (data.active === false) return null;
  return (
    <div style={{ background: ACCENT, padding: '10px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>{data.text}</span>
    </div>
  );
}

function SectionBannerSlider({ data }: { data: BannerSliderData }) {
  const [current, setCurrent] = useState(0);

  const slides = data.banners?.length
    ? data.banners
    : [{ title: 'Welcome to our store', image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200', link_url: '/products' }];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div style={{ padding: '24px 24px 0', maxWidth: 1400, margin: '0 auto', boxSizing: 'border-box' as const }}>
      <div style={{ position: 'relative', minHeight: 420, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 48px -12px rgba(0,0,0,0.15)' }}>
        {slides.map((slide, i) => (
          <div key={slide.id || i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0, transition: 'opacity 0.8s ease-in-out', background: `url(${slide.image_url}) center/cover no-repeat`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)' }} />
            {slide.title && (
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '30px 40px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: "'Outfit',sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>{slide.title}</h1>
                {slide.link_url && (
                  <a href={slide.link_url} style={{ display: 'inline-block', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: '0.92rem', padding: '12px 32px', borderRadius: 12, textDecoration: 'none' }}>SHOP NOW</a>
                )}
              </div>
            )}
          </div>
        ))}
        {slides.length > 1 && (
          <>
            <button onClick={() => setCurrent(p => (p - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={() => setCurrent(p => (p + 1) % slides.length)} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 8 }}>
              {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionCategoriesCarousel({ data }: { data: CategoriesCarouselData }) {
  const [categories, setCategories] = useState<any[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storefrontApi.getCategories().then(res => setCategories(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  if (!categories.length) return null;

  const scroll = (dir: 'left' | 'right') => carouselRef.current?.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });

  return (
    <section style={{ background: '#fff', padding: '56px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' as const }}>
        <SectionHeader badge={data.badge || 'Collections'} title={data.title || 'Product Categories'} viewAllUrl="/categories" viewAllLabel="VIEW ALL →" />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => scroll('left')} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', color: '#fff', background: ACCENT, fontSize: '1.4rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>‹</button>
          <div ref={carouselRef} style={{ display: 'flex', gap: 20, overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', flex: 1 }}>
            {categories.map((cat, i) => {
              const cover = cat.image_url || `https://images.unsplash.com/photo-155622857${8 + (i % 5)}?q=80&w=400`;
              return (
                <a key={cat.id} href={`/categories/${cat.slug}`} style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(0,0,0,0.06)', background: '#F9FAFB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    <img src={cover} alt={cat.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=400'; }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', textAlign: 'center' }}>{cat.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ACCENT }}>Shop Now</span>
                </a>
              );
            })}
          </div>
          <button onClick={() => scroll('right')} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', color: '#fff', background: ACCENT, fontSize: '1.4rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>›</button>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p, primary }: { p: any; primary: string }) {
  const cover = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  return (
    <a href={`/products/${p.slug}`} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s, box-shadow 0.25s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 36px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#F9FAFB' }}>
        <img src={cover} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.95)', color: primary, fontWeight: 800, fontSize: '0.75rem', padding: '7px 20px', borderRadius: 8, letterSpacing: '0.04em' }}>SHOP NOW</span>
        </div>
      </div>
      <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{p.category?.name || ''}</span>
        <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{p.name}</h3>
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
}

function SectionProductsGrid({ data }: { data: ProductsGridData }) {
  const [products, setProducts] = useState<any[]>([]);
  const limit = data.limit || 8;
  const cols = data.columns || 4;

  useEffect(() => {
    storefrontApi.getProducts({ limit }).then(res => setProducts(res?.products || [])).catch(() => {});
  }, [limit, data.badge, data.title]);

  if (!products.length) return null;

  return (
    <section style={{ padding: '56px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' as const }}>
        <SectionHeader badge={data.badge} title={data.title || 'Products'} subtitle={data.subtitle} viewAllUrl={data.view_all_url || '/products'} viewAllLabel={data.view_all_label} />
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: `repeat(auto-fill, minmax(${cols === 4 ? 220 : 260}px, 1fr))` }}>
          {products.map(p => <ProductCard key={p.id} p={p} primary={ACCENT} />)}
        </div>
      </div>
    </section>
  );
}

function SectionFeaturesStrip({ data }: { data: FeaturesStripData }) {
  const defaultItems = [
    { emoji: '🚚', title: 'Free & Fast Shipping', desc: 'Ships all over India at no additional costs.' },
    { emoji: '💵', title: 'Free COD Available', desc: 'Cash on Delivery available without any minimum order.' },
    { emoji: '↩️', title: 'Free & Easy Return', desc: 'Easy 7-day return policy for hassle-free experience.' },
    { emoji: '🎧', title: 'Expert Help & Support', desc: 'Monday – Friday (10:00 AM – 07:00 PM)' },
    { emoji: '🔒', title: '100% Payment Protection', desc: 'Secure checkout with easy return policy.' },
  ];
  const items = data.items?.length ? data.items : defaultItems;

  return (
    <section style={{ padding: '40px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' as const }}>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {items.map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 18, padding: '28px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>{f.emoji}</span>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.92rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionAboutSection({ data }: { data: AboutSectionData }) {
  const defaultValues = [
    { icon: '🌱', label: '100% Natural', desc: 'All ingredients certified organic and cruelty-free.' },
    { icon: '🧪', label: 'Chemical Free', desc: 'No nasties — ever. Safe for skin & hair.' },
    { icon: '🤝', label: 'Women Empowerment', desc: 'Supporting women to be financially independent.' },
    { icon: '🚀', label: 'Fast Delivery', desc: 'Prompt and reliable shipping across India.' },
  ];
  const values = data.values?.length ? data.values : defaultValues;

  return (
    <section style={{ background: '#fff', padding: '56px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' as const }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Badge>Our Story</Badge>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, color: '#111827', margin: '12px 0 0', letterSpacing: '-0.02em' }}>{data.title || 'About Us'}</h2>
            <p style={{ fontSize: '0.92rem', color: '#4B5563', lineHeight: 1.75, margin: '16px 0' }}>{data.content || 'We are committed to bringing you the best products.'}</p>
            {data.tagline && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.2rem', fontWeight: 700, fontStyle: 'italic', color: ACCENT, margin: '0 0 24px' }}>{data.tagline}</p>}
            <a href={data.button_url || '/about'} style={{ display: 'inline-block', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: '0.88rem', padding: '13px 30px', borderRadius: 12, textDecoration: 'none', alignSelf: 'flex-start' }}>{data.button_label || 'Learn More About Us'}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {values.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: 'var(--sf-bg, #FAF7F2)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '18px 20px' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{v.icon}</span>
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
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
  .cp-page { min-height: 100vh; background: var(--sf-bg, #FAF7F2); font-family: 'Inter', sans-serif; color: #374151; }

  /* Hero */
  .cp-hero { padding: 90px 5% 100px; text-align: center; background: radial-gradient(circle at top, rgba(21,128,61,0.05) 0%, transparent 70%); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .cp-hero-inner { max-width: 680px; margin: 0 auto; }
  .cp-hero-title { font-family: 'Outfit', sans-serif; font-size: clamp(2rem,5vw,3.2rem); font-weight: 800; color: #111827; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.1; }
  .cp-hero-sub { font-size: 1.1rem; color: #6B7280; margin: 0; line-height: 1.6; }

  /* Generic section */
  .cp-section { padding: 60px 5%; }
  .cp-section-alt { background: #fff; }
  .cp-container { max-width: 900px; margin: 0 auto; }
  .cp-section-title { font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 700; color: #111827; margin: 0 0 20px; }
  .cp-text { color: #4B5563; line-height: 1.8; font-size: 0.95rem; margin: 0; }

  /* Rich text */
  .cp-rich-text { color: #4B5563; line-height: 1.8; font-size: 0.95rem; }
  .cp-rich-text h3 { font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 700; color: #111827; margin: 28px 0 10px; }
  .cp-rich-text p { margin: 0 0 14px; }
  .cp-rich-text a { color: #15803d; text-decoration: underline; }
  .cp-rich-text strong { color: #111827; }

  /* Image + Text */
  .cp-image-text { display: flex; gap: 48px; align-items: center; flex-wrap: wrap; }
  .cp-image-text-img { flex: 1 1 300px; }
  .cp-image-text-img img { width: 100%; border-radius: 20px; object-fit: cover; max-height: 380px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.12); }
  .cp-image-text-body { flex: 1 1 280px; }

  /* Cards */
  .cp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 32px; }
  .cp-card { background: var(--sf-bg, #FAF7F2); border: 1px solid rgba(0,0,0,0.05); border-radius: 20px; padding: 28px 24px; }
  .cp-card-icon { font-size: 2rem; margin-bottom: 12px; }
  .cp-card-title { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 8px; }
  .cp-card-text { color: #6B7280; font-size: 0.875rem; line-height: 1.6; margin: 0; }

  /* Button */
  .cp-btn-primary { display: inline-block; background: #15803d; color: #fff; font-weight: 600; padding: 12px 28px; border-radius: 50px; border: none; cursor: pointer; font-size: 0.925rem; text-decoration: none; transition: background 0.2s; }
  .cp-btn-primary:hover { background: #166534; }
  .cp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Contact form */
  .cp-form { display: flex; flex-direction: column; gap: 14px; }
  .cp-form-row { display: flex; gap: 14px; flex-wrap: wrap; }
  .cp-form-row .cp-input { flex: 1 1 200px; }
  .cp-input { width: 100%; padding: 12px 16px; border: 1.5px solid #E5E7EB; border-radius: 12px; font-size: 0.9rem; background: #fff; color: #111827; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
  .cp-input:focus { border-color: #15803d; }
  .cp-textarea { resize: vertical; min-height: 120px; }

  /* Carousel scrollbar hide */
  .cp-carousel::-webkit-scrollbar { display: none; }

  /* Responsive */
  @media (max-width: 900px) {
    .cp-about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
  }
  @media (max-width: 640px) {
    .cp-image-text { flex-direction: column !important; }
  }
`;

// ── Main component ────────────────────────────────────────────────────────────

export const CustomPage: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
  const { cssVariables } = usePageTheme('page');
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [previewSections, setPreviewSections] = useState<Section[] | null>(null);

  const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';

  useEffect(() => {
    if (!isPreview) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'page_preview' && Array.isArray(e.data.sections)) {
        setPreviewSections(e.data.sections);
        setLoading(false);
        setNotFound(false);
      }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'preview_ready' }, '*');
    return () => window.removeEventListener('message', handler);
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    if (!pageSlug) return;
    setLoading(true);
    setNotFound(false);
    storefrontApi.getPage(pageSlug)
      .then(data => setPage(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [pageSlug, isPreview]);

  if (loading) {
    return (
      <div className="cp-page" style={cssVariables}>
        <div style={{ padding: '120px 5%', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        <style>{STYLES}</style>
      </div>
    );
  }

  if (notFound || (!page && !previewSections)) {
    return (
      <div className="cp-page" style={cssVariables}>
        <div style={{ padding: '120px 5%', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>Page Not Found</h2>
          <p style={{ color: '#6B7280' }}>This page does not exist or has been removed.</p>
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  const sections: Section[] = previewSections ?? (Array.isArray(page?.sections) ? page.sections : []);

  return (
    <div className="cp-page" style={cssVariables}>
      <style>{STYLES}</style>
      {sections.map((section, i) => {
        switch (section.type) {
          case 'hero':                return <SectionHero key={i} data={section.data} />;
          case 'rich_text':           return <SectionRichText key={i} data={section.data} />;
          case 'image_text':          return <SectionImageText key={i} data={section.data} />;
          case 'cards':               return <SectionCards key={i} data={section.data} />;
          case 'cta':                 return <SectionCta key={i} data={section.data} />;
          case 'contact_form':        return <SectionContactForm key={i} data={section.data} />;
          case 'announcement_bar':    return <SectionAnnouncementBar key={i} data={section.data} />;
          case 'banner_slider':       return <SectionBannerSlider key={i} data={section.data} />;
          case 'categories_carousel': return <SectionCategoriesCarousel key={i} data={section.data} />;
          case 'products_grid':       return <SectionProductsGrid key={i} data={section.data} />;
          case 'features_strip':      return <SectionFeaturesStrip key={i} data={section.data} />;
          case 'about_section':       return <SectionAboutSection key={i} data={section.data} />;
          default:                    return null;
        }
      })}
      {sections.length === 0 && (
        <div style={{ padding: '80px 5%', textAlign: 'center', color: '#9CA3AF' }}>No content yet.</div>
      )}
    </div>
  );
};

export default CustomPage;
