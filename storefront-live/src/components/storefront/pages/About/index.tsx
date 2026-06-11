import React, { useEffect, useState } from 'react';
import { customerApi } from '../../../../lib/api-client';

export const About: React.FC = () => {
  const [data, setData] = useState<{ shop: any; content: Record<string, string> } | null>(null);

  useEffect(() => {
    customerApi.getPages().then(setData).catch(() => {});
  }, []);

  const shop = data?.shop;
  const c = data?.content || {};

  return (
    <div className="sp-page">
      {/* Hero */}
      <div className="sp-hero about-hero">
        <div className="sp-hero-inner">
          {shop?.logo_url && <img src={shop.logo_url} alt={shop?.name} className="sp-logo" />}
          <h1 className="sp-hero-title">{c.about_title || `About ${shop?.name || 'Us'}`}</h1>
          <p className="sp-hero-sub">{c.about_tagline || 'Our story, our mission, our values'}</p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container">
          {/* Mission */}
          <section className="sp-section">
            <div className="sp-section-icon">✦</div>
            <h2 className="sp-section-title">Our Story</h2>
            {c.about_content ? (
              <div className="sp-rich-text" dangerouslySetInnerHTML={{ __html: c.about_content.replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="sp-text">
                {shop?.description || `Welcome to ${shop?.name || 'our store'}. We are passionate about bringing you the finest products with exceptional service. Every item in our catalog is carefully curated to ensure quality, authenticity, and value.`}
              </p>
            )}
          </section>

          {/* Values Grid */}
          <section className="sp-values">
            {[
              { icon: '🌿', title: 'Quality First', desc: c.value_quality || 'We source only the finest products, rigorously tested for quality and durability.' },
              { icon: '💚', title: 'Customer Care', desc: c.value_care || 'Your satisfaction is our priority. We stand behind every product we sell.' },
              { icon: '🚀', title: 'Fast Delivery', desc: c.value_delivery || 'Quick and reliable shipping to your doorstep, because your time matters.' },
              { icon: '🔒', title: 'Secure Shopping', desc: c.value_security || 'Shop with confidence — your data and payments are always protected.' },
            ].map(v => (
              <div key={v.title} className="sp-value-card">
                <span className="sp-value-icon">{v.icon}</span>
                <h3 className="sp-value-title">{v.title}</h3>
                <p className="sp-value-desc">{v.desc}</p>
              </div>
            ))}
          </section>

          {/* Contact CTA */}
          <section className="sp-cta">
            <h3>Have questions? We'd love to hear from you.</h3>
            <a href="/contact" className="sp-cta-btn">Contact Us</a>
          </section>
        </div>
      </div>

      <style>{STATIC_PAGE_STYLES}</style>
    </div>
  );
};

const STATIC_PAGE_STYLES = `
  .sp-page { min-height: 100vh; background: var(--sf-bg); font-family: var(--font-sans); }
  .sp-hero { padding: 70px 5%; text-align: center; }
  .about-hero { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%); border-bottom: 1px solid #d1fae5; }
  .sp-hero-inner { max-width: 640px; margin: 0 auto; }
  .sp-logo { height: 60px; width: auto; border-radius: 12px; margin-bottom: 20px; object-fit: contain; }
  .sp-hero-title { font-family: var(--font-serif); font-size: 2.5rem; color: var(--sf-text-main); margin: 0 0 12px; }
  .sp-hero-sub { font-size: 1rem; color: var(--sf-text-muted); margin: 0; }
  .sp-body { padding: 60px 5% 80px; }
  .sp-container { max-width: 860px; margin: 0 auto; }
  .sp-section { margin-bottom: 60px; text-align: center; }
  .sp-section-icon { font-size: 1.2rem; color: var(--sf-accent); margin-bottom: 10px; }
  .sp-section-title { font-family: var(--font-serif); font-size: 1.8rem; color: var(--sf-text-main); margin: 0 0 20px; }
  .sp-text { font-size: 1rem; color: var(--sf-text-muted); line-height: 1.8; margin: 0; }
  .sp-rich-text { font-size: 1rem; color: var(--sf-text-muted); line-height: 1.8; }
  .sp-values { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px; margin-bottom: 60px; }
  .sp-value-card { background: #fff; border: 1px solid var(--sf-border); border-radius: 18px; padding: 28px 22px; text-align: center; transition: transform 0.25s, box-shadow 0.25s; }
  .sp-value-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.07); }
  .sp-value-icon { font-size: 2rem; display: block; margin-bottom: 12px; }
  .sp-value-title { font-family: var(--font-serif); font-size: 1.05rem; color: var(--sf-text-main); margin: 0 0 8px; }
  .sp-value-desc { font-size: 0.84rem; color: var(--sf-text-muted); line-height: 1.6; margin: 0; }
  .sp-cta { text-align: center; background: var(--sf-accent-light); border-radius: 20px; padding: 40px 30px; }
  .sp-cta h3 { font-family: var(--font-serif); font-size: 1.4rem; color: var(--sf-text-main); margin: 0 0 20px; }
  .sp-cta-btn { display: inline-block; padding: 12px 32px; background: var(--sf-accent); color: #fff; border-radius: 50px; font-weight: 700; font-size: 0.95rem; text-decoration: none; transition: background 0.2s; }
  .sp-cta-btn:hover { background: var(--sf-accent-dark, #166534); }
`;

export { STATIC_PAGE_STYLES };
