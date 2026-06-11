import React, { useState } from 'react';
import { Icons } from './icons';
import { copyText } from './utils';
import { storeUrl, storeAdminUrl, storeDomainLabel } from './utils';

// ─── Credentials Modal ────────────────────────────────────────────────────────
export const CredentialsModal: React.FC<{ data: any; onClose: () => void }> = ({ data, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <span className="modal-icon-svg"><Icons.ShieldCheck /></span>
        <div>
          <h3>Store Provisioned!</h3>
          <p>Save these credentials — they won't be shown again.</p>
        </div>
        <button className="modal-close" onClick={onClose}><Icons.X /></button>
      </div>
      <div className="modal-body">
        {[
          { label: 'Store Domain', value: data.domain || storeUrl(data.shopSlug) },
          { label: 'Admin Login URL', value: data.credentials?.loginUrl || storeAdminUrl(data.shopSlug) },
          { label: 'Owner Email', value: data.credentials?.email || data.ownerEmail },
          { label: 'Login Password', value: data.credentials?.password || data.ownerPassword || '—' },
        ].map(({ label, value }) => (
          <div className="cred-row" key={label}>
            <div className="cred-meta">
              <span className="cred-label">{label}</span>
              <span className="cred-value">{value}</span>
            </div>
            <button className="cred-copy" onClick={() => copyText(value, `${label} copied!`)}>
              <Icons.Copy /> Copy
            </button>
          </div>
        ))}
      </div>
      <div className="modal-footer">
        <button className="btn-primary" onClick={onClose}>Done, Close Window</button>
      </div>
    </div>
  </div>
);

// ─── Edit Shop Modal ──────────────────────────────────────────────────────────
export const EditShopModal: React.FC<{
  shop: any;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}> = ({ shop, onClose, onSave, saving }) => {
  const [name, setName] = useState(shop.name || '');
  const [desc, setDesc] = useState(shop.description || '');
  const [plan, setPlan] = useState(shop.plan || 'starter');
  const [status, setStatus] = useState(shop.status || 'active');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon-svg" style={{ color: '#6366F1' }}><Icons.Edit /></span>
          <div><h3>Edit Store</h3><p>{storeDomainLabel(shop.slug)}</p></div>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body" style={{ gap: 14 }}>
          <div className="field-group">
            <label>Store Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Store Name" />
          </div>
          <div className="field-group">
            <label>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Brief store description..." />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>SaaS Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="field-group">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ name, description: desc, plan, status })} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
