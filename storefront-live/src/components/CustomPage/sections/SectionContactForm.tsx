'use client';
import React, { useState } from 'react';
import { ContactFormData } from '../types';
import { storefrontApi } from '@/lib/api-client';

export function SectionContactForm({ data }: { data: ContactFormData }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await storefrontApi.submitContact(form);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="cp-sec">
      <div className="cp-con" style={{ maxWidth: 600 }}>
        {data.title && <h2 className="cp-sec-title">{data.title}</h2>}
        {data.subtitle && <p className="cp-p" style={{ marginBottom: 28 }}>{data.subtitle}</p>}

        {status === 'sent' ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sf-accent,#15803d)" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 16px' }}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p style={{ color: 'var(--sf-text-muted,#6b7280)', fontSize: '0.9rem' }}>
              Your message has been sent. We'll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                className="cp-input" style={{ flex: '1 1 200px' }}
                type="text" placeholder="Your name *"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              />
              <input
                className="cp-input" style={{ flex: '1 1 200px' }}
                type="email" placeholder="Email address *"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              />
            </div>
            <input
              className="cp-input"
              type="text" placeholder="Subject (optional)"
              value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
            <textarea
              className="cp-input"
              placeholder="Your message *" rows={5}
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
              style={{ resize: 'vertical', minHeight: 120 }}
            />
            {status === 'error' && (
              <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>Something went wrong. Please try again.</p>
            )}
            <button
              className="cp-btn" type="submit"
              disabled={status === 'sending'}
              style={{ alignSelf: 'flex-start', background: 'var(--sf-text-main,#111)', color: '#fff', opacity: status === 'sending' ? 0.6 : 1 }}
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
