import React, { useState } from 'react';
import { customerApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { useLiveSettings } from '../../hooks/useLiveSettings';
import { STATIC_PAGE_STYLES } from '../About/index';

export const Contact: React.FC = () => {
  const { cssVariables } = usePageTheme('contact');
  const { shop, content: c } = useLiveSettings();

  // Contact Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await customerApi.submitContact({ name, email, subject, message });
      if (res.success) {
        setStatusMsg('✅ Message sent successfully! We will get back to you soon.');
        setName(''); setEmail(''); setSubject(''); setMessage('');
      } else {
        setStatusMsg('❌ Failed to send message. Please try again.');
      }
    } catch {
      setStatusMsg('❌ An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-page" style={cssVariables}>
      {/* Hero */}
      <div className="sp-hero about-hero">
        <div className="sp-hero-inner">
          <h1 className="sp-hero-title">Contact &amp; Support</h1>
          <p className="sp-hero-sub">We would love to hear from you. Get in touch with our team.</p>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-container" style={{ maxWidth: '960px' }}>
          <div className="contact-grid">
            
            {/* Contact details */}
            <div className="contact-info">
              <h3 className="contact-section-title">Support Channels</h3>
              
              <div className="contact-detail-item">
                <span className="contact-icon">📧</span>
                <div>
                  <strong>Email Support</strong>
                  <p>{c.contact_email || `support@${shop?.slug || 'store'}.com`}</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <span className="contact-icon">📞</span>
                <div>
                  <strong>Phone Helpline</strong>
                  <p>{c.contact_phone || '+91 98765 43210'}</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <span className="contact-icon">📍</span>
                <div>
                  <strong>Store Location</strong>
                  <p>{c.contact_address || 'New Delhi, India'}</p>
                </div>
              </div>

              {c.social_instagram && (
                <div className="contact-detail-item">
                  <span className="contact-icon">📸</span>
                  <div>
                    <strong>Instagram Link</strong>
                    <p>
                      <a href={c.social_instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--sf-accent)', fontWeight: 600 }}>
                        View Profile
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="contact-form-wrap">
              <h3 className="contact-section-title">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="How can we help?" />
                </div>
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} required placeholder="Write your inquiry here..." />
                </div>
                <button type="submit" disabled={loading} className="form-submit-btn">
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                {statusMsg && <div className="form-status" style={{ fontSize: '0.85rem', marginTop: 12 }}>{statusMsg}</div>}
              </form>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        ${STATIC_PAGE_STYLES}
        .contact-grid { display: grid; grid-template-columns: 1fr; gap: 40px; text-align: left; }
        @media(min-width: 768px) {
          .contact-grid { grid-template-columns: 1fr 1.3fr; gap: 60px; }
        }
        .contact-section-title { font-family: var(--font-serif); font-size: 1.4rem; color: var(--sf-text-main); margin: 0 0 24px; border-bottom: 2px solid var(--sf-border); pb: 8px; }
        .contact-info { display: flex; flex-direction: column; gap: 24px; }
        .contact-detail-item { display: flex; gap: 16px; align-items: flex-start; }
        .contact-icon { font-size: 1.5rem; }
        .contact-detail-item strong { display: block; font-size: 0.9rem; color: var(--sf-text-main); }
        .contact-detail-item p { font-size: 0.85rem; color: var(--sf-text-muted); margin: 2px 0 0; }
        
        .contact-form-wrap { background: #fff; border: 1px solid var(--sf-border); border-radius: 20px; padding: 30px; }
        .contact-form { display: flex; flex-direction: column; gap: 16px; font-size: 0.85rem; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-weight: 600; color: var(--sf-text-main); }
        .form-group input, .form-group textarea { padding: 10px 12px; border: 1px solid var(--sf-border); border-radius: 8px; font-family: inherit; font-size: 0.85rem; outline: none; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--sf-accent); }
        .form-submit-btn { padding: 12px; background: var(--sf-accent); border: none; color: #fff; font-weight: 700; border-radius: 8px; cursor: pointer; transition: opacity 0.2s; }
        .form-submit-btn:hover { opacity: 0.9; }
        .form-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};
