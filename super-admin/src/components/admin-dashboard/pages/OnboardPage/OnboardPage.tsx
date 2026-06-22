import React, { useState } from 'react';
import { Icons } from '../../icons';
import { Badge } from '../../shared';
import { genPassword, storeUrl, storeAdminUrl, storeDomainLabel } from '../../utils';
import { CredentialsModal } from '../../modals';

interface OnboardPageProps {
  onProvision: (data: any) => Promise<any>;
  provisioning: boolean;
}

const PLANS = [
  { id: 'starter', name: 'Starter', desc: 'Up to 50 products, 1 domain, basic analytics.' },
  { id: 'pro', name: 'Pro', desc: 'Unlimited products, custom domains, full analytics + priority support.' },
  { id: 'enterprise', name: 'Enterprise', desc: 'White-label, custom SLA, dedicated infrastructure.' },
];

const INDUSTRIES = [
  { id: 'fashion', name: '🛍 Fashion Store', themes: [
      { id: 'classic', name: 'Classic (Charcoal, Amber, Cream)' },
      { id: 'modern', name: 'Modern (Slate, Pink, Warm White)' },
      { id: 'luxury', name: 'Luxury (Gold, Premium Dark, Ivory)' }
    ]
  },
  { id: 'electronics', name: '📱 Electronics Store', themes: [
      { id: 'dark', name: 'Tech Dark (Blue, Emerald, Midnight)' },
      { id: 'modern', name: 'Tech Modern (Indigo, Orange, Slate)' },
      { id: 'premium', name: 'Tech Premium (Violet, Dark Gray, Light Gray)' }
    ]
  },
  { id: 'grocery', name: '🥬 Grocery Store', themes: [
      { id: 'fresh', name: 'Fresh Organic (Green, Yellow, Pale Green)' },
      { id: 'organic', name: 'Pure Organic (Green, Teal, Mint)' },
      { id: 'wholesale', name: 'Wholesale Pallets (Dark Green, Amber, Stone)' }
    ]
  },
  { id: 'restaurant', name: '🍔 Restaurant Store', themes: [
      { id: 'gourmet', name: 'Gourmet Classic (Orange, Amber, Warm Beige)' },
      { id: 'fastfood', name: 'Fast Food Dark (Red, Yellow, Cream)' },
      { id: 'cafe', name: 'Cafe Warm (Brown, Amber, Light Cream)' }
    ]
  },
  { id: 'furniture', name: '🛋 Furniture Store', themes: [
      { id: 'minimalist', name: 'Minimalist Light (Brown, Yellow, Warm Linen)' },
      { id: 'vintage', name: 'Vintage Wood (Teak, Gold, Linen)' },
      { id: 'luxury', name: 'Luxury Velvet (Dark Gray, Brass, Ivory)' }
    ]
  },
  { id: 'beauty', name: '💄 Beauty Store', themes: [
      { id: 'organic', name: 'Organic Beauty (Rose, Green, Pale Rose)' },
      { id: 'luxury', name: 'Luxury Radiance (Dark Rose, Amber, Ivory)' },
      { id: 'glam', name: 'Glam High-Pigment (Hot Pink, Rose, Warm Pink)' }
    ]
  },
  { id: 'pharmacy', name: '💊 Pharmacy Store', themes: [
      { id: 'clinical', name: 'Clinical Clean (Cyan, Emerald, Pale Teal)' },
      { id: 'wellness', name: 'Wellness Green (Teal, Yellow, Mint)' },
      { id: 'express', name: 'First Aid Express (Blue, Red, White)' }
    ]
  },
  { id: 'petstore', name: '🐶 Pet Store', themes: [
      { id: 'playful', name: 'Playful Pets (Orange, Blue, Warm Yellow)' },
      { id: 'premium', name: 'Premium Animals (Slate, Gold, Cream)' },
      { id: 'nature', name: 'Nature Friendly (Green, Gold, Pale Green)' }
    ]
  }
];

export const OnboardPage: React.FC<OnboardPageProps> = ({ onProvision, provisioning }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('fashion');
  const [theme, setTheme] = useState('classic');
  const [plan, setPlan] = useState('starter');
  const [credentials, setCredentials] = useState<any>(null);

  const derivedSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const genPwd = genPassword(derivedSlug);

  const handleIndustryChange = (val: string) => {
    setIndustry(val);
    const ind = INDUSTRIES.find(i => i.id === val);
    if (ind && ind.themes.length > 0) {
      setTheme(ind.themes[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerName || !ownerEmail) return;
    const result = await onProvision({ name, slug: derivedSlug, ownerName, ownerEmail, phone, industry, theme, plan });
    if (result?.shopId) {
      setCredentials({
        shopSlug: derivedSlug,
        ownerEmail,
        domain: storeUrl(derivedSlug),
        credentials: {
          email: ownerEmail,
          password: genPwd,
          loginUrl: storeAdminUrl(derivedSlug),
        },
      });
      setName(''); setSlug(''); setOwnerName(''); setOwnerEmail('');
      setPhone(''); setIndustry('fashion'); setTheme('classic'); setPlan('starter');
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Provision New Store</h2>
          <p className="header-sub">Create a new merchant tenant on the platform</p>
        </div>
      </header>

      <div className="onboard-layout">
        <div className="card">
          <form onSubmit={handleSubmit} className="onboard-form">
            <div className="onboard-section-title">Store Identity</div>
            <div className="field-row">
              <div className="field-group">
                <label>Store Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nature Glow Herbals" />
              </div>
              <div className="field-group">
                <label>Subdomain Slug (auto)</label>
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder={derivedSlug || 'auto-generated'} />
                <span className="field-hint"><Icons.Globe /> {derivedSlug || '…'}.{(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'posix.digital')}</span>
              </div>
            </div>

            <div className="onboard-section-title" style={{ marginTop: 4 }}>Owner Details</div>
            <div className="field-row">
              <div className="field-group">
                <label>Owner Full Name *</label>
                <input required value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Preeti Patel" />
              </div>
              <div className="field-group">
                <label>Owner Email *</label>
                <input required type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="owner@example.com" />
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Industry *</label>
                <select value={industry} onChange={e => handleIndustryChange(e.target.value)}>
                  {INDUSTRIES.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Design Theme *</label>
                <select value={theme} onChange={e => setTheme(e.target.value)}>
                  {INDUSTRIES.find(i => i.id === industry)?.themes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="field-group" style={{ visibility: 'hidden' }}>
                <label>Placeholder</label>
                <input disabled />
              </div>
            </div>

            <div className="onboard-section-title" style={{ marginTop: 4 }}>SaaS Plan</div>
            <div className="plan-cards">
              {PLANS.map(p => (
                <div key={p.id} className={`plan-card ${plan === p.id ? 'selected' : ''}`} onClick={() => setPlan(p.id)}>
                  <div className="plan-check">{plan === p.id && <Icons.CheckCircle />}</div>
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-desc">{p.desc}</div>
                </div>
              ))}
            </div>

            {derivedSlug && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', fontSize: '0.8rem', color: '#64748B' }}>
                <strong>Auto-generated password:</strong>&nbsp;
                <code>{genPwd}</code>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={provisioning}>
              <Icons.Rocket /> {provisioning ? 'Provisioning Store…' : 'Provision & Launch Store'}
            </button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title">What happens next?</h3>
            <ul className="feature-list">
              {[
                'Subdomain gets registered: slug.' + (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'posix.digital'),
                'Owner account created with secure credentials',
                'Store database record provisioned',
                'Admin login URL shared immediately',
                'Merchant can seed demo products',
                'Store goes live instantly on subdomain',
              ].map(f => <li key={f}><span style={{ color: '#10B981' }}><Icons.Check /></span>{f}</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 className="card-title">Plan Features</h3>
            <Badge type={plan === 'pro' ? 'pro' : plan === 'enterprise' ? 'danger' : 'default'}>{plan.toUpperCase()}</Badge>
            <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
              {plan === 'starter' && 'Basic storefront, up to 50 products, 1 custom domain, standard support.'}
              {plan === 'pro' && 'Unlimited products, multiple domains, advanced analytics, priority support.'}
              {plan === 'enterprise' && 'Full white-label solution, custom SLA, dedicated server, on-call support.'}
            </div>
          </div>
        </div>
      </div>

      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}
    </>
  );
};
