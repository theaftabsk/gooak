import React, { useEffect, useState } from 'react';
import { customerApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { STATIC_PAGE_STYLES } from '../About/index';

export const Terms: React.FC = () => {
  const [data, setData] = useState<{ shop: any; content: Record<string, string> } | null>(null);
  const { cssVariables } = usePageTheme('terms');

  useEffect(() => {
    customerApi.getPages().then(setData).catch(() => {});
  }, []);

  const shop = data?.shop;
  const c = data?.content || {};

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div className="sp-hero about-hero">
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title">Terms &amp; Conditions</h1>
          <p className="sp-hero-sub">
            {c.terms_updated ? `Last updated: ${c.terms_updated}` : 'Rules and guidelines for using our store'}
          </p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container">
          <section className="sp-section" style={{ textAlign: 'left' }}>
            {c.terms_content ? (
              <div 
                className="sp-rich-text" 
                dangerouslySetInnerHTML={{ __html: c.terms_content.replace(/\n/g, '<br/>') }} 
              />
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Terms of Service Agreement
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  Welcome to our store. By accessing our site or purchasing goods from us, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Product Descriptions &amp; Pricing
                </h3>
                <p className="sp-text" style={{ marginBottom: '24px' }}>
                  We strive to ensure product catalog information and pricing coordinates are accurate. However, we reserve the right to correct any errors, inaccuracies, or omissions, and to change or update information at any time without prior notice.
                </p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--sf-text-main)', marginBottom: '12px' }}>
                  Intellectual Property
                </h3>
                <p className="sp-text">
                  All digital assets, layouts, designs, typography, brand names, product photographs, and text content featured on this site are protected by copyright, trademarks, and intellectual property legislation.
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
