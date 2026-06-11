import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { customerApi } from '../../../../lib/api-client';

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
        .acct-page { min-height: 100vh; background: var(--sf-bg); font-family: var(--font-sans); padding: 40px 5% 80px; }
        .acct-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 260px 1fr; gap: 32px; align-items: start; }
        @media(max-width:768px) { .acct-inner { grid-template-columns: 1fr; } }
        .acct-sidebar { background: #fff; border: 1px solid var(--sf-border); border-radius: 20px; overflow: hidden; }
        .acct-avatar { display: flex; align-items: center; gap: 14px; padding: 24px; border-bottom: 1px solid var(--sf-border); }
        .acct-avatar-circle { width: 52px; height: 52px; border-radius: 50%; background: var(--sf-accent); color: #fff; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .acct-name { font-weight: 700; color: var(--sf-text-main); font-size: 0.95rem; }
        .acct-email { font-size: 0.78rem; color: var(--sf-text-muted); margin-top: 2px; }
        .acct-nav { display: flex; flex-direction: column; padding: 8px 0; }
        .acct-nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 20px; font-size: 0.88rem; color: var(--sf-text-muted); font-weight: 500; text-decoration: none; transition: background 0.15s, color 0.15s; border: none; background: none; cursor: pointer; font-family: var(--font-sans); text-align: left; }
        .acct-nav-item:hover { background: var(--sf-bg); color: var(--sf-text-main); }
        .acct-nav-item.active { background: var(--sf-accent-light); color: var(--sf-accent); font-weight: 700; }
        .logout-btn { color: #dc2626 !important; }
        .logout-btn:hover { background: #fef2f2 !important; }
        .acct-main { background: #fff; border: 1px solid var(--sf-border); border-radius: 20px; padding: 32px; }
        .acct-tabs { display: flex; gap: 4px; margin-bottom: 28px; background: var(--sf-bg); border-radius: 12px; padding: 4px; }
        .acct-tab { flex: 1; padding: 10px; border: none; border-radius: 9px; background: none; font-size: 0.87rem; font-weight: 600; color: var(--sf-text-muted); cursor: pointer; font-family: var(--font-sans); transition: all 0.2s; }
        .acct-tab.active { background: #fff; color: var(--sf-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .acct-msg { padding: 12px 16px; border-radius: 10px; font-size: 0.87rem; margin-bottom: 20px; }
        .acct-msg.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803D; }
        .acct-msg.error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
        .acct-form { display: flex; flex-direction: column; gap: 20px; }
        .acct-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width:600px) { .acct-form-row { grid-template-columns: 1fr; } }
        .acct-field { display: flex; flex-direction: column; gap: 6px; }
        .acct-label { font-size: 0.85rem; font-weight: 600; color: var(--sf-text-main); }
        .acct-input { padding: 11px 14px; border: 1.5px solid var(--sf-border); border-radius: 10px; font-size: 0.95rem; font-family: var(--font-sans); color: var(--sf-text-main); background: var(--sf-bg); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .acct-input:focus { border-color: var(--sf-accent); box-shadow: 0 0 0 3px var(--sf-accent-light); }
        .acct-save-btn { align-self: flex-start; padding: 12px 28px; background: var(--sf-accent); color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700; font-family: var(--font-sans); cursor: pointer; transition: background 0.2s; }
        .acct-save-btn:hover:not(:disabled) { background: var(--sf-accent-dark, #166534); }
        .acct-save-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .acct-spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--sf-border); border-top-color: var(--sf-accent); animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
