import React from 'react';
import { usePageTheme } from '@/hooks/usePageTheme';
import { useLiveSettings } from '@/hooks/useLiveSettings';
import { STATIC_PAGE_STYLES } from '../About/index';

export const Privacy: React.FC = () => {
  const { cssVariables } = usePageTheme('privacy');
  const { shop, content: c } = useLiveSettings();

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div className="sp-hero about-hero">
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title">Privacy Policy</h1>
          <p className="sp-hero-sub">
            {c.privacy_updated ? `Last updated: ${c.privacy_updated}` : 'How we safeguard your information'}
          </p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container">
          <section className="sp-section" style={{ textAlign: 'left' }}>
            {c.privacy_content ? (
              <div 
                className="sp-rich-text" 
                dangerouslySetInnerHTML={{ __html: c.privacy_content.replace(/\n/g, '<br/>') }} 
              />
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Information Collection
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  We collect personal information that you provide to us when you register, make a purchase, or contact us. This includes your name, email, shipping address, and payment information.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  How We Use Your Data
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  We use your personal details to process orders, verify payments, manage shipping logistics, and send promotional newsletters or important updates about our services if opted in.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Cookies &amp; Analytics
                </h3>
                <p className="sp-text">
                  We use browser cookies to optimize checkout sessions, retain shopping cart selections, and analyze site traffic patterns. You can choose to disable cookies in your browser settings if preferred.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <style>{STATIC_PAGE_STYLES}</style>
    </div>
  );
};
