import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { customerApi, pageBuilderApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLiveSettings } from '../../hooks/useLiveSettings';
import { useCustomer } from '../../context/CustomerContext';
import { STATIC_PAGE_STYLES } from '../About/index';

export const Contact: React.FC = () => {
  const { cssVariables, theme } = usePageTheme('contact');
  const { shop, content: c } = useLiveSettings();
  const { customer } = useCustomer();

  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await pageBuilderApi.getPageBySlug('contact');
        setPageData(data);
      } catch (err: any) {
        console.error('Failed to load contact page widgets:', err);
      }
    };
    fetchPage();
  }, []);

  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    if (!isPreview) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LAYOUT_UPDATE' && event.data.payload?.slug === 'contact') {
        setPageData(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isPreview]);

  // Contact Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  // Pre-fill profile fields if customer is logged in
  useEffect(() => {
    if (customer) {
      setName(prev => prev || customer.name || '');
      setEmail(prev => prev || customer.email || '');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    
    try {
      const res = await customerApi.submitContact({ name, email, subject, message });
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Thank you! Your message has been sent successfully. We will get back to you shortly.' });
        setName(customer?.name || '');
        setEmail(customer?.email || '');
        setSubject('');
        setMessage('');
      } else {
        setStatusMsg({ type: 'error', text: 'Failed to send message. Please check your inputs and try again.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'An unexpected error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };


  const isTrue = (val: any) => val === undefined || val === true || val === 'true';

  const showEmail = isTrue(c.show_contact_email);
  const emailVal = c.contact_email || `support@${shop?.slug || 'store'}.com`;
  const emailDesc = c.contact_email_desc || "Monitored 24/7. Replies within 12 hours.";

  const showPhone = isTrue(c.show_contact_phone);
  const phoneVal = c.contact_phone || '+91 98765 43210';
  const phoneDesc = c.contact_phone_desc || "Available Mon-Sat, 9:00 AM - 6:00 PM.";

  const showAddress = isTrue(c.show_contact_address);
  const addressVal = c.contact_address || 'New Delhi, India';
  const addressDesc = c.contact_address_desc || "Flagship botanic laboratory storefront.";

  const showHours = isTrue(c.show_contact_hours);
  const showMap = isTrue(c.show_contact_map);
  const mapUrl = c.contact_map_url || '';

  const hasAnyChannel = showEmail || showPhone || showAddress || !!c.social_instagram;

  // Extract hero details from HERO_BANNER widget if present
  const heroWidget = pageData?.widgets?.find((w: any) => w.type === 'HERO_BANNER');
  const heroContent = heroWidget?.content || {};
  const slides = heroContent.slides && heroContent.slides.length > 0 ? heroContent.slides : [
    {
      title: heroContent.title || 'Get in Touch',
      subtitle: heroContent.subtitle || 'Have questions about our botanical skincare? Our support team is here to assist you.',
      backgroundImageUrl: heroContent.backgroundImageUrl || '',
    }
  ];
  const slide = slides[0] || {};
  const hasBg = !!slide.backgroundImageUrl;
  const overlayOpacity = parseInt(heroContent.overlayOpacity || '50');

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div 
        className="sp-hero contact-page-hero"
        style={{
          backgroundImage: hasBg ? `linear-gradient(rgba(0,0,0,${overlayOpacity / 100}), rgba(0,0,0,${overlayOpacity / 100})), url(${slide.backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: hasBg ? '#ffffff' : undefined,
        }}
      >
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title" style={{ color: hasBg ? '#ffffff' : undefined }}>
            {slide.title || 'Get in Touch'}
          </h1>
          <p className="sp-hero-sub" style={{ color: hasBg ? 'rgba(255,255,255,0.85)' : undefined }}>
            {slide.subtitle || 'Have questions about our botanical skincare? Our support team is here to assist you.'}
          </p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container" style={{ maxWidth: '1100px' }}>
          <div className="contact-grid">
            
            {/* Left Column: Contact Details & Info */}
            <div className="contact-info-panel">
              {hasAnyChannel && (
                <>
                  <h3 className="contact-section-title">Support Channels</h3>
                  
                  <div className="contact-cards-stack">
                    {showEmail && (
                      <div className="contact-detail-card">
                        <span className="contact-card-icon">📧</span>
                        <div className="contact-card-content">
                          <strong>Email Support</strong>
                          <p>{emailVal}</p>
                          <span className="contact-card-note">{emailDesc}</span>
                        </div>
                      </div>
                    )}

                    {showPhone && (
                      <div className="contact-detail-card">
                        <span className="contact-card-icon">📞</span>
                        <div className="contact-card-content">
                          <strong>Phone Helpline</strong>
                          <p>{phoneVal}</p>
                          <span className="contact-card-note">{phoneDesc}</span>
                        </div>
                      </div>
                    )}

                    {showAddress && (
                      <div className="contact-detail-card">
                        <span className="contact-card-icon">📍</span>
                        <div className="contact-card-content">
                          <strong>Store Location</strong>
                          <p>{addressVal}</p>
                          <span className="contact-card-note">{addressDesc}</span>
                        </div>
                      </div>
                    )}

                    {c.social_instagram && (
                      <div className="contact-detail-card">
                        <span className="contact-card-icon">📸</span>
                        <div className="contact-card-content">
                          <strong>Instagram Profile</strong>
                          <p>
                            <a href={c.social_instagram} target="_blank" rel="noreferrer" className="contact-insta-link">
                              @{c.social_instagram.split('/').filter(Boolean).pop() || 'instagram_account'} ↗
                            </a>
                          </p>
                          <span className="contact-card-note">Follow us for skincare routines & product releases.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Business Hours */}
              {showHours && (
                <div className="business-hours-box">
                  <h4 className="hours-title">⏰ Customer Care Hours</h4>
                  <div className="hours-row">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM (IST)</span>
                  </div>
                  <div className="hours-row">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM (IST)</span>
                  </div>
                  <div className="hours-row">
                    <span>Sunday</span>
                    <span className="hours-closed">Closed for Botanical Research</span>
                  </div>
                </div>
              )}

              {/* Map rendering */}
              {showMap && (
                mapUrl ? (
                  <div className="map-placeholder-box" style={{ padding: 0, height: '240px' }}>
                    <iframe
                      src={mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0, borderRadius: '18px' }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  /* Stylized Visual Map Grid */
                  <div className="map-placeholder-box">
                    <div className="map-grid-mesh"></div>
                    <div className="map-pin" style={{ background: theme.primaryColor || '#15803D' }}>
                      <span className="map-pin-pulse"></span>
                    </div>
                    <span className="map-label">Nature Glow Lab</span>
                  </div>
                )
              )}
            </div>


            {/* Right Column: Inquiry Message Form */}
            <div className="contact-form-card">
              <div className="form-header-row">
                <div className="form-icon-circle" style={{ background: `${theme.primaryColor || '#15803D'}10`, color: theme.primaryColor || '#15803D' }}>
                  ✉
                </div>
                <div>
                  <h3 className="contact-section-title no-border">Send Us a Message</h3>
                  <p className="form-helper-text">Fill in the fields below to submit an inquiry directly to our support desk.</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="contact-form">
                
                {statusMsg.text && (
                  <div className={`form-status-banner ${statusMsg.type}`}>
                    <span>{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
                    <p>{statusMsg.text}</p>
                  </div>
                )}

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="contact-form-label">Your Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Enter your name"
                      className="contact-form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="contact-form-label">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      placeholder="name@example.com"
                      className="contact-form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="contact-form-label">Subject</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="E.g. Delivery status, variant questions..."
                    className="contact-form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="contact-form-label">Message Content</label>
                  <textarea 
                    rows={6} 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    required 
                    placeholder="Write details of your inquiry here..."
                    className="contact-form-textarea"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="contact-submit-btn"
                  style={{ background: theme.primaryColor || '#15803D' }}
                >
                  {loading ? 'Sending Inquiry...' : 'Submit Message'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        ${STATIC_PAGE_STYLES}
        
        .contact-page-hero {
          background: radial-gradient(circle at top, rgba(21, 128, 61, 0.05) 0%, rgba(255, 255, 255, 0) 75%);
        }
        
        .contact-grid { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 48px; 
          text-align: left; 
          box-sizing: border-box;
        }
        
        @media(min-width: 1024px) {
          .contact-grid { 
            grid-template-columns: 1fr 1.25fr; 
            gap: 64px; 
          }
        }

        .contact-section-title { 
          font-family: 'Outfit', sans-serif; 
          font-size: 1.35rem; 
          font-weight: 800;
          color: #111827; 
          margin: 0 0 24px; 
          border-bottom: 1px solid rgba(0,0,0,0.06); 
          padding-bottom: 12px; 
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }
        .contact-section-title.no-border {
          border: none;
          padding: 0;
          margin: 0 0 4px;
        }

        /* Support info column */
        .contact-info-panel { 
          display: flex; 
          flex-direction: column; 
          gap: 28px; 
        }
        .contact-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .contact-detail-card { 
          display: flex; 
          gap: 18px; 
          align-items: flex-start; 
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.03);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
          transition: all 0.25s ease;
        }
        .contact-detail-card:hover {
          transform: translateX(4px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
          border-color: var(--sf-accent, #15803D);
        }
        .contact-card-icon { 
          font-size: 1.6rem; 
          line-height: 1;
        }
        .contact-card-content strong { 
          display: block; 
          font-size: 0.88rem; 
          color: #111827; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .contact-card-content p { 
          font-size: 0.95rem; 
          color: #374151; 
          margin: 6px 0 4px; 
          font-weight: 700;
        }
        .contact-insta-link {
          color: var(--sf-accent, #15803D);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .contact-insta-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        .contact-card-note {
          display: block;
          font-size: 0.75rem;
          color: #9CA3AF;
          font-weight: 500;
        }

        /* Business hours block */
        .business-hours-box {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.03);
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }
        .hours-title {
          margin: 0 0 12px;
          font-size: 0.88rem;
          font-weight: 800;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hours-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: #4B5563;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .hours-row:last-child { margin-bottom: 0; }
        .hours-closed {
          color: #9CA3AF;
          font-style: italic;
        }

        /* Stylized Minimal Botanical Map Visual */
        .map-placeholder-box {
          position: relative;
          height: 150px;
          background: linear-gradient(135deg, #FAF7F2 0%, #E2E8F0 100%);
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .map-grid-mesh {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.8;
        }
        .map-pin {
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 2;
        }
        .map-pin-pulse {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: inherit;
          opacity: 0.2;
          left: -10px;
          top: -10px;
          animation: pulse 2s infinite ease-out;
        }
        .map-label {
          position: absolute;
          font-size: 0.7rem;
          font-weight: 800;
          color: #111827;
          background: #ffffff;
          padding: 4px 10px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          top: 85px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Form Card */
        .contact-form-card { 
          background: #ffffff; 
          border: 1px solid rgba(0,0,0,0.03); 
          border-radius: 24px; 
          padding: 40px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .form-header-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .form-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: bold;
        }
        .form-helper-text {
          margin: 0;
          font-size: 0.82rem;
          color: #6B7280;
          line-height: 1.4;
        }

        .contact-form { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
          font-size: 0.88rem; 
        }
        .form-row-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) {
          .form-row-two {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        
        .form-group { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
        }
        .contact-form-label { 
          font-weight: 700; 
          color: #4B5563; 
          text-transform: uppercase;
          font-size: 0.76rem;
          letter-spacing: 0.05em;
        }
        .contact-form-input, .contact-form-textarea { 
          padding: 12px 16px; 
          border: 1.5px solid rgba(0,0,0,0.08); 
          border-radius: 12px; 
          font-family: inherit; 
          font-size: 0.92rem; 
          outline: none; 
          color: #111827;
          background: #ffffff;
          transition: all 0.2s ease;
          box-sizing: border-box;
          width: 100%;
        }
        .contact-form-input:focus, .contact-form-textarea:focus { 
          border-color: var(--sf-accent, #15803D); 
          box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.08);
        }
        
        .contact-submit-btn { 
          padding: 14px; 
          border: none; 
          color: #fff; 
          font-weight: 800; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: all 0.2s; 
          font-size: 0.9rem;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.25);
        }
        .contact-submit-btn:hover:not(:disabled) { 
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
        .contact-submit-btn:disabled { 
          opacity: 0.5; 
          cursor: not-allowed; 
          box-shadow: none;
        }

        /* Banner styling */
        .form-status-banner {
          display: flex;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 14px;
          font-size: 0.82rem;
          line-height: 1.5;
          align-items: flex-start;
          animation: slideDown 0.3s ease;
        }
        .form-status-banner.success {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
          font-weight: 700;
        }
        .form-status-banner.error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          font-weight: 700;
        }
        .form-status-banner p { margin: 0; }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
