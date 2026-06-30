import React from 'react';
import { usePageTheme } from '@/hooks/usePageTheme';
import { useLiveSettings } from '@/hooks/useLiveSettings';

export const About: React.FC = () => {
  const { cssVariables } = usePageTheme('about');
  const { shop, content: c } = useLiveSettings();

  return (
    <div className="sp-page" style={cssVariables}>
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
  .sp-page { 
    min-height: 100vh; 
    background: var(--sf-bg, #FAF7F2); 
    font-family: 'Inter', sans-serif;
    color: #374151;
  }
  .sp-hero { 
    padding: 80px 5% 100px; 
    text-align: center;
    background: radial-gradient(circle at top, rgba(21, 128, 61, 0.04) 0%, rgba(255, 255, 255, 0) 70%);
    position: relative;
  }
  .sp-hero::after {
    content: '';
    position: absolute;
    bottom: 0; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05) 50%, transparent);
  }
  .sp-hero-inner { max-width: 680px; margin: 0 auto; }
  .sp-logo { height: 64px; width: auto; border-radius: 14px; margin-bottom: 24px; object-fit: contain; }
  .sp-hero-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 3rem; 
    font-weight: 800;
    color: #111827; 
    margin: 0 0 16px; 
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .sp-hero-sub { 
    font-size: 1.1rem; 
    color: #6B7280; 
    margin: 0; 
    line-height: 1.5;
    font-weight: 500;
  }
  .sp-body { 
    padding: 60px 5% 100px; 
  }
  .sp-container { 
    max-width: 860px; 
    margin: 0 auto; 
  }
  .sp-section { 
    margin-bottom: 60px; 
    text-align: left;
    background: #ffffff;
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.03);
  }
  .sp-section-icon { 
    font-size: 1.3rem; 
    color: var(--sf-accent, #15803D); 
    margin-bottom: 12px; 
    display: inline-block;
  }
  .sp-section-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 2rem; 
    font-weight: 700;
    color: #111827; 
    margin: 0 0 24px; 
    letter-spacing: -0.01em;
  }
  .sp-text { 
    font-size: 0.95rem; 
    color: #4B5563; 
    line-height: 1.8; 
    margin: 0; 
  }
  .sp-rich-text { 
    font-size: 0.95rem; 
    color: #4B5563; 
    line-height: 1.8; 
  }
  .sp-rich-text p {
    margin-bottom: 16px;
  }
  .sp-rich-text h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #111827;
    margin: 28px 0 12px;
  }
  .sp-values { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 24px; 
    margin-bottom: 60px; 
  }
  .sp-value-card { 
    background: #fff; 
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 20px; 
    padding: 36px 24px; 
    text-align: center; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.02);
  }
  .sp-value-card:hover { 
    transform: translateY(-5px); 
    box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.08); 
    border-color: var(--sf-accent, #15803D);
  }
  .sp-value-icon { 
    font-size: 2.2rem; 
    display: block; 
    margin-bottom: 16px; 
  }
  .sp-value-title { 
    font-family: 'Outfit', sans-serif; 
    font-size: 1.15rem; 
    font-weight: 700;
    color: #111827; 
    margin: 0 0 10px; 
  }
  .sp-value-desc { 
    font-size: 0.88rem; 
    color: #6B7280; 
    line-height: 1.6; 
    margin: 0; 
  }
  .sp-cta { 
    text-align: center; 
    background: radial-gradient(circle at bottom, rgba(21, 128, 61, 0.05) 0%, rgba(255, 255, 255, 0.5) 100%);
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 24px; 
    padding: 50px 40px; 
    box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.02);
  }
  .sp-cta h3 { 
    font-family: 'Outfit', sans-serif; 
    font-size: 1.6rem; 
    font-weight: 800;
    color: #111827; 
    margin: 0 0 24px; 
    letter-spacing: -0.01em;
  }
  .sp-cta-btn { 
    display: inline-block; 
    padding: 14px 36px; 
    background: var(--sf-accent, #15803D); 
    color: #fff; 
    border-radius: 50px; 
    font-weight: 700; 
    font-size: 0.95rem; 
    text-decoration: none; 
    box-shadow: 0 10px 20px -5px rgba(21, 128, 61, 0.3);
    transition: all 0.2s ease; 
  }
  .sp-cta-btn:hover { 
    transform: translateY(-2px);
    box-shadow: 0 15px 25px -5px rgba(21, 128, 61, 0.4);
    filter: brightness(1.05);
  }
`;

export { STATIC_PAGE_STYLES };
