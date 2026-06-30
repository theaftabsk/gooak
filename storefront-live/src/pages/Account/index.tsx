import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '@/context/CustomerContext';
import { customerApi } from '@/lib/api-client';

export const MyAccount: React.FC = () => {
  const { customer, token, logout, refresh, isLoading } = useCustomer();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    if (!isLoading && !customer) navigate('/login');
  }, [customer, isLoading, navigate]);

  useEffect(() => {
    if (customer) { setName(customer.name || ''); setPhone(customer.phone || ''); }
  }, [customer]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true); setSaveMsg(null);
    try {
      await customerApi.updateMe({ name, phone }, token);
      await refresh();
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally { setSaving(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPw !== confirmPw) { setSaveMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setSaveMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setSaving(true); setSaveMsg(null);
    try {
      await customerApi.updateMe({ current_password: currentPw, new_password: newPw }, token);
      setSaveMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Password change failed.' });
    } finally { setSaving(false); }
  };

  if (isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: 'var(--sf-text-muted)' }}>
      <div className="acct-spinner" />
    </div>
  );

  return (
    <div className="acct-page">
      <div className="acct-inner">
        {/* Sidebar */}
        <aside className="acct-sidebar">
          <div className="acct-avatar">
            <div className="acct-avatar-circle">
              {customer?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="acct-name">{customer?.name}</div>
              <div className="acct-email">{customer?.email}</div>
            </div>
          </div>
          <nav className="acct-nav">
            <Link to="/account" className="acct-nav-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Profile
            </Link>
            <Link to="/account/orders" className="acct-nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              My Orders
            </Link>
            <Link to="/wishlist" className="acct-nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Wishlist
            </Link>
            <button className="acct-nav-item logout-btn" onClick={() => { logout(); navigate('/login'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="acct-main">
          <div className="acct-tabs">
            <button className={`acct-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => { setTab('profile'); setSaveMsg(null); }}>Personal Info</button>
            <button className={`acct-tab ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setSaveMsg(null); }}>Change Password</button>
          </div>

          {saveMsg && (
            <div className={`acct-msg ${saveMsg.type}`}>{saveMsg.text}</div>
          )}

          {tab === 'profile' ? (
            <form className="acct-form" onSubmit={saveProfile}>
              <div className="acct-form-row">
                <div className="acct-field">
                  <label className="acct-label">Full Name</label>
                  <input className="acct-input" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="acct-field">
                  <label className="acct-label">Phone</label>
                  <input className="acct-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="acct-field">
                <label className="acct-label">Email Address</label>
                <input className="acct-input" type="email" value={customer?.email || ''} disabled style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--sf-text-muted)' }}>Email cannot be changed.</span>
              </div>
              <button type="submit" className="acct-save-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <form className="acct-form" onSubmit={savePassword}>
              <div className="acct-field">
                <label className="acct-label">Current Password</label>
                <input className="acct-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
              </div>
              <div className="acct-field">
                <label className="acct-label">New Password</label>
                <input className="acct-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required />
              </div>
              <div className="acct-field">
                <label className="acct-label">Confirm New Password</label>
                <input className="acct-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
              </div>
              <button type="submit" className="acct-save-btn" disabled={saving}>
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}
        </main>
      </div>

      <style>{`
        .acct-page { 
          min-height: 100vh; 
          background: var(--sf-bg, #FAF7F2); 
          font-family: 'Inter', sans-serif; 
          padding: 60px 5% 100px; 
        }
        .acct-inner { 
          max-width: 1080px; 
          margin: 0 auto; 
          display: grid; 
          grid-template-columns: 280px 1fr; 
          gap: 32px; 
          align-items: start; 
        }
        @media(max-width: 768px) { 
          .acct-inner { grid-template-columns: 1fr; gap: 24px; } 
        }
        .acct-sidebar { 
          background: #ffffff; 
          border: 1px solid rgba(0,0,0,0.04); 
          border-radius: 24px; 
          overflow: hidden; 
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.03);
        }
        .acct-avatar { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 28px 24px; 
          border-bottom: 1px solid rgba(0, 0, 0, 0.04); 
        }
        .acct-avatar-circle { 
          width: 56px; 
          height: 56px; 
          border-radius: 50%; 
          background: linear-gradient(135deg, var(--sf-accent, #15803D), var(--sf-accent-dark, #166534)); 
          color: #ffffff; 
          font-size: 1.4rem; 
          font-weight: 800; 
          font-family: 'Outfit', sans-serif;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0; 
          box-shadow: 0 8px 16px -4px rgba(21, 128, 61, 0.3);
        }
        .acct-name { 
          font-family: 'Outfit', sans-serif;
          font-weight: 700; 
          color: #111827; 
          font-size: 1.05rem; 
          letter-spacing: -0.01em;
        }
        .acct-email { 
          font-size: 0.8rem; 
          color: #6B7280; 
          margin-top: 2px; 
          word-break: break-all;
        }
        .acct-nav { 
          display: flex; 
          flex-direction: column; 
          padding: 12px 8px; 
        }
        .acct-nav-item { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          padding: 12px 16px; 
          font-size: 0.88rem; 
          color: #4B5563; 
          font-weight: 600; 
          text-decoration: none; 
          border-radius: 12px;
          transition: all 0.2s ease; 
          border: none; 
          background: none; 
          cursor: pointer; 
          font-family: 'Inter', sans-serif; 
          text-align: left; 
          margin-bottom: 2px;
        }
        .acct-nav-item:hover { 
          background: rgba(0, 0, 0, 0.02); 
          color: #111827; 
        }
        .acct-nav-item.active { 
          background: rgba(21, 128, 61, 0.05); 
          color: var(--sf-accent, #15803D); 
          font-weight: 700; 
        }
        .logout-btn { 
          color: #dc2626 !important; 
        }
        .logout-btn:hover { 
          background: #fef2f2 !important; 
        }
        .acct-main { 
          background: #ffffff; 
          border: 1px solid rgba(0,0,0,0.04); 
          border-radius: 24px; 
          padding: 40px; 
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.03);
        }
        @media(max-width: 600px) {
          .acct-main { padding: 24px; }
        }
        .acct-tabs { 
          display: flex; 
          gap: 4px; 
          margin-bottom: 36px; 
          background: rgba(0, 0, 0, 0.02); 
          border-radius: 14px; 
          padding: 4px; 
        }
        .acct-tab { 
          flex: 1; 
          padding: 12px; 
          border: none; 
          border-radius: 10px; 
          background: none; 
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem; 
          font-weight: 700; 
          color: #6B7280; 
          cursor: pointer; 
          transition: all 0.2s ease; 
        }
        .acct-tab.active { 
          background: #ffffff; 
          color: var(--sf-accent, #15803D); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.04); 
        }
        .acct-msg { 
          padding: 14px 20px; 
          border-radius: 12px; 
          font-size: 0.88rem; 
          font-weight: 600;
          margin-bottom: 28px; 
        }
        .acct-msg.success { 
          background: #f0fdf4; 
          border: 1px solid #bbf7d0; 
          color: #15803D; 
        }
        .acct-msg.error { 
          background: #fef2f2; 
          border: 1px solid #fca5a5; 
          color: #dc2626; 
        }
        .acct-form { 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
        }
        .acct-form-row { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
        }
        @media(max-width:600px) { 
          .acct-form-row { grid-template-columns: 1fr; gap: 24px; } 
        }
        .acct-field { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
        }
        .acct-label { 
          font-size: 0.82rem; 
          font-weight: 700; 
          color: #111827; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .acct-input { 
          padding: 12px 16px; 
          border: 1.5px solid rgba(0, 0, 0, 0.08); 
          border-radius: 12px; 
          font-size: 0.95rem; 
          font-family: 'Inter', sans-serif; 
          color: #111827; 
          background: #ffffff; 
          outline: none; 
          transition: all 0.2s ease; 
        }
        .acct-input:focus { 
          border-color: var(--sf-accent, #15803D); 
          box-shadow: 0 0 0 4px rgba(21, 128, 61, 0.08); 
        }
        .acct-save-btn { 
          align-self: flex-start; 
          padding: 14px 36px; 
          background: var(--sf-accent, #15803D); 
          color: #ffffff; 
          border: none; 
          border-radius: 12px; 
          font-size: 0.95rem; 
          font-weight: 700; 
          font-family: 'Outfit', sans-serif; 
          cursor: pointer; 
          box-shadow: 0 10px 20px -5px rgba(21, 128, 61, 0.3);
          transition: all 0.2s ease; 
        }
        .acct-save-btn:hover:not(:disabled) { 
          transform: translateY(-1px);
          box-shadow: 0 15px 25px -5px rgba(21, 128, 61, 0.4);
          filter: brightness(1.05);
        }
        .acct-save-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
          transform: none;
          box-shadow: none;
        }
        .acct-spinner { 
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          border: 3.5px solid rgba(0,0,0,0.06); 
          border-top-color: var(--sf-accent, #15803D); 
          animation: spin 0.9s linear infinite; 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
