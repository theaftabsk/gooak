import React from 'react';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLiveSettings } from '../../hooks/useLiveSettings';
import { STATIC_PAGE_STYLES } from '../About/index';

export const Refund: React.FC = () => {
  const { cssVariables } = usePageTheme('refund');
  const { shop, content: c } = useLiveSettings();

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div className="sp-hero about-hero">
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title">Refund &amp; Return Policy</h1>
          <p className="sp-hero-sub">
            {c.refund_updated ? `Last updated: ${c.refund_updated}` : 'Our commitment to your satisfaction'}
          </p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container">
          <section className="sp-section" style={{ textAlign: 'left' }}>
            {c.refund_content ? (
              <div 
                className="sp-rich-text" 
                dangerouslySetInnerHTML={{ __html: c.refund_content.replace(/\n/g, '<br/>') }} 
              />
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Returns &amp; Exchanges
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  We want you to love your purchase. If you are not completely satisfied, you may return unopened and unused items in their original packaging within 30 days of purchase for a full refund or exchange.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Damaged or Defective Items
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  If you receive a product that is damaged or defective, please contact our support team immediately at {c.contact_email || 'support@' + (shop?.slug || 'store') + '.com'} with photos of the issue. We will ship a replacement free of charge.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Processing Your Refund
                </h3>
                <p className="sp-text">
                  Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed to your original method of payment within 5-10 business days.
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
