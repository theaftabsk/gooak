'use client';
import React, { useEffect, useState } from 'react';
import { storefrontApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section =
  | { type: 'hero'; data: { title: string; subtitle?: string; bg_image?: string; bg_color?: string; button_label?: string; button_url?: string } }
  | { type: 'rich_text'; data: { title?: string; html: string } }
  | { type: 'image_text'; data: { title?: string; text: string; image_url: string; image_side?: 'left' | 'right' } }
  | { type: 'cards'; data: { title?: string; items: { icon?: string; title: string; text: string }[] } }
  | { type: 'cta'; data: { title: string; subtitle?: string; button_label: string; button_url: string; bg_color?: string } }
  | { type: 'contact_form'; data: { title?: string; subtitle?: string } };

// ── Section renderers ─────────────────────────────────────────────────────────

function SectionHero({ data }: { data: Extract<Section, { type: 'hero' }>['data'] }) {
  return (
    <div
      className="cp-hero"
      style={data.bg_image ? { backgroundImage: `url(${data.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <div className="cp-hero-inner">
        <h1 className="cp-hero-title">{data.title}</h1>
        {data.subtitle && <p className="cp-hero-sub">{data.subtitle}</p>}
        {data.button_label && (
          <a href={data.button_url || '#'} className="cp-btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
            {data.button_label}
          </a>
        )}
      </div>
    </div>
  );
}

function SectionRichText({ data }: { data: Extract<Section, { type: 'rich_text' }>['data'] }) {
  return (
    <div className="cp-section">
      <div className="cp-container">
        {data.title && <h2 className="cp-section-title">{data.title}</h2>}
        <div className="cp-rich-text" dangerouslySetInnerHTML={{ __html: data.html }} />
      </div>
    </div>
  );
}

function SectionImageText({ data }: { data: Extract<Section, { type: 'image_text' }>['data'] }) {
  const reversed = data.image_side === 'left';
  return (
    <div className="cp-section">
      <div className="cp-container">
        <div className="cp-image-text" style={{ flexDirection: reversed ? 'row-reverse' : 'row' }}>
          <div className="cp-image-text-img">
            <img src={data.image_url} alt={data.title || ''} />
          </div>
          <div className="cp-image-text-body">
            {data.title && <h2 className="cp-section-title">{data.title}</h2>}
            <p className="cp-text">{data.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCards({ data }: { data: Extract<Section, { type: 'cards' }>['data'] }) {
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

function SectionCta({ data }: { data: Extract<Section, { type: 'cta' }>['data'] }) {
  return (
    <div className="cp-cta" style={data.bg_color ? { background: data.bg_color } : undefined}>
      <div className="cp-container" style={{ textAlign: 'center' }}>
        <h2 className="cp-cta-title">{data.title}</h2>
        {data.subtitle && <p className="cp-cta-sub">{data.subtitle}</p>}
        <a href={data.button_url} className="cp-btn-primary">{data.button_label}</a>
      </div>
    </div>
  );
}

function SectionContactForm({ data, shopId }: { data: Extract<Section, { type: 'contact_form' }>['data']; shopId?: string }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
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
          <div className="cp-success-msg">
            <span style={{ fontSize: '2rem' }}>✅</span>
            <p>Your message has been sent! We will get back to you within 24 hours.</p>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .cp-page { min-height: 100vh; background: var(--sf-bg, #FAF7F2); font-family: 'Inter', sans-serif; color: #374151; }

  /* Hero */
  .cp-hero { padding: 90px 5% 100px; text-align: center; background: radial-gradient(circle at top, rgba(21,128,61,0.05) 0%, transparent 70%); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .cp-hero-inner { max-width: 680px; margin: 0 auto; }
  .cp-hero-title { font-family: 'Outfit', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; color: #111827; margin: 0 0 16px; letter-spacing: -0.02em; line-height: 1.1; }
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

  /* CTA */
  .cp-cta { padding: 70px 5%; background: #f0fdf4; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); }
  .cp-cta-title { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 800; color: #111827; margin: 0 0 12px; }
  .cp-cta-sub { color: #6B7280; margin: 0 0 24px; font-size: 1rem; }

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
  .cp-success-msg { text-align: center; padding: 40px 20px; color: #374151; }
  .cp-success-msg p { font-size: 1rem; margin-top: 12px; }
`;

// ── Main component ────────────────────────────────────────────────────────────

export const CustomPage: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
  const { cssVariables } = usePageTheme('page');
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!pageSlug) return;
    setLoading(true);
    setNotFound(false);
    storefrontApi.getPage(pageSlug)
      .then(data => setPage(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="cp-page" style={cssVariables}>
        <div style={{ padding: '120px 5%', textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        <style>{STYLES}</style>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="cp-page" style={cssVariables}>
        <div style={{ padding: '120px 5%', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>Page Not Found</h2>
          <p style={{ color: '#6B7280' }}>This page does not exist or has been removed.</p>
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  const sections: Section[] = Array.isArray(page.sections) ? page.sections : [];

  return (
    <div className="cp-page" style={cssVariables}>
      {sections.map((section, i) => {
        switch (section.type) {
          case 'hero':         return <SectionHero key={i} data={section.data} />;
          case 'rich_text':    return <SectionRichText key={i} data={section.data} />;
          case 'image_text':   return <SectionImageText key={i} data={section.data} />;
          case 'cards':        return <SectionCards key={i} data={section.data} />;
          case 'cta':          return <SectionCta key={i} data={section.data} />;
          case 'contact_form': return <SectionContactForm key={i} data={section.data} />;
          default:             return null;
        }
      })}
      {sections.length === 0 && (
        <div style={{ padding: '80px 5%', textAlign: 'center', color: '#9CA3AF' }}>No content yet.</div>
      )}
      <style>{STYLES}</style>
    </div>
  );
};

export default CustomPage;
