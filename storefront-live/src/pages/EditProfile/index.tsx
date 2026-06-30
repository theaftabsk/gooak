import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '@/context/CustomerContext';
import { customerApi } from '@/lib/api-client';

type Tab = 'profile' | 'password';

export const EditProfile: React.FC = () => {
  const { customer, token, refresh, isLoading } = useCustomer();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!isLoading && !customer) { navigate('/login?redirect=/account/profile'); }
  }, [customer, isLoading, navigate]);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
    }
  }, [customer]);

  const clearMsg = () => setTimeout(() => setMsg(null), 5000);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true); setMsg(null);
    try {
      await customerApi.updateMe({ name: name.trim(), phone: phone.trim() }, token);
      await refresh();
      setMsg({ type: 'success', text: 'Profile updated successfully! ✓' });
      clearMsg();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally { setSaving(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setSaving(true); setMsg(null);
    try {
      await customerApi.updateMe({ current_password: currentPw, new_password: newPw }, token);
      setMsg({ type: 'success', text: 'Password changed successfully! ✓' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      clearMsg();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Password change failed.' });
    } finally { setSaving(false); }
  };

  const passwordStrength = (pw: string): { label: string; pct: number; color: string } => {
    if (!pw) return { label: '', pct: 0, color: '#E5E7EB' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const levels = [
      { label: 'Weak', pct: 25, color: '#EF4444' },
      { label: 'Fair', pct: 50, color: '#F59E0B' },
      { label: 'Good', pct: 75, color: '#3B82F6' },
      { label: 'Strong', pct: 100, color: '#22C55E' },
    ];
    return levels[Math.min(score - 1, 3)] || levels[0];
  };

  const pwStrength = passwordStrength(newPw);

  if (isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="ep-spinner" />
    </div>
  );

  const initials = customer?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="ep-page">
      <div className="ep-inner">
        {/* Back nav */}
        <Link to="/account" className="ep-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          My Account
        </Link>

        <div className="ep-layout">
          {/* Left: Avatar card */}
          <aside className="ep-aside">
            <div className="ep-avatar-card">
              <div className="ep-avatar-ring">
                <div className="ep-avatar">{initials}</div>
              </div>
              <div className="ep-user-name">{customer?.name || 'User'}</div>
              <div className="ep-user-email">{customer?.email}</div>
              {customer?.phone && (
                <div className="ep-user-phone">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 11.16 19.79 19.79 0 01.34 2.5 2 2 0 012.33.5h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.14a16 16 0 006 6l1.5-1.5a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {customer.phone}
                </div>
              )}

              <div className="ep-aside-nav">
                <button onClick={() => setTab('profile')} className={`ep-aside-btn ${tab === 'profile' ? 'active' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile Info
                </button>
                <button onClick={() => setTab('password')} className={`ep-aside-btn ${tab === 'password' ? 'active' : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Change Password
                </button>
                <Link to="/account/orders" className="ep-aside-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                  My Orders
                </Link>
              </div>
            </div>
          </aside>

          {/* Right: Form */}
          <main className="ep-main">
            <div className="ep-card">
              {/* Tab switcher */}
              <div className="ep-tabs">
                <button onClick={() => { setTab('profile'); setMsg(null); }} className={`ep-tab ${tab === 'profile' ? 'active' : ''}`}>
                  Profile Info
                </button>
                <button onClick={() => { setTab('password'); setMsg(null); }} className={`ep-tab ${tab === 'password' ? 'active' : ''}`}>
                  Change Password
                </button>
              </div>

              {/* Feedback message */}
              {msg && (
                <div className={`ep-msg ${msg.type}`}>
                  {msg.type === 'success'
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                  {msg.text}
                </div>
              )}

              {/* Profile Tab */}
              {tab === 'profile' && (
                <form className="ep-form" onSubmit={saveProfile}>
                  <div className="ep-form-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Personal Information
                  </div>

                  <div className="ep-field-group">
                    <div className="ep-field">
                      <label className="ep-label">Full Name</label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <input
                          id="ep-name"
                          type="text"
                          className="ep-input"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your full name"
                          required
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="ep-field">
                      <label className="ep-label">Email Address</label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input
                          type="email"
                          className="ep-input disabled"
                          value={customer?.email || ''}
                          disabled
                          placeholder="Email cannot be changed"
                        />
                        <span className="ep-input-lock" title="Email cannot be changed">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </span>
                      </div>
                      <span className="ep-hint">Email address cannot be changed for security reasons.</span>
                    </div>

                    <div className="ep-field">
                      <label className="ep-label">Phone Number <span className="ep-optional">(optional)</span></label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 11.16 19.79 19.79 0 01.34 2.5 2 2 0 012.33.5h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.14a16 16 0 006 6l1.5-1.5a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                        <input
                          id="ep-phone"
                          type="tel"
                          className="ep-input"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ep-form-footer">
                    <button type="submit" className="ep-save-btn" disabled={saving}>
                      {saving
                        ? <><div className="ep-btn-spinner" /> Saving...</>
                        : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes</>
                      }
                    </button>
                  </div>
                </form>
              )}

              {/* Password Tab */}
              {tab === 'password' && (
                <form className="ep-form" onSubmit={savePassword}>
                  <div className="ep-form-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Change Password
                  </div>

                  <div className="ep-field-group">
                    <div className="ep-field">
                      <label className="ep-label">Current Password</label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          className="ep-input"
                          value={currentPw}
                          onChange={e => setCurrentPw(e.target.value)}
                          placeholder="Your current password"
                          required
                          autoComplete="current-password"
                        />
                        <button type="button" className="ep-eye-btn" onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                          {showCurrent
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>

                    <div className="ep-field">
                      <label className="ep-label">New Password</label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        <input
                          type={showNew ? 'text' : 'password'}
                          className="ep-input"
                          value={newPw}
                          onChange={e => setNewPw(e.target.value)}
                          placeholder="At least 6 characters"
                          required
                          minLength={6}
                          autoComplete="new-password"
                        />
                        <button type="button" className="ep-eye-btn" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                          {showNew
                            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                      {newPw && (
                        <div className="ep-strength-bar">
                          <div className="ep-strength-track">
                            <div className="ep-strength-fill" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                          </div>
                          <span className="ep-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                        </div>
                      )}
                    </div>

                    <div className="ep-field">
                      <label className="ep-label">Confirm New Password</label>
                      <div className="ep-input-wrap">
                        <svg className="ep-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        <input
                          type="password"
                          className={`ep-input ${confirmPw && confirmPw !== newPw ? 'mismatch' : ''}`}
                          value={confirmPw}
                          onChange={e => setConfirmPw(e.target.value)}
                          placeholder="Repeat new password"
                          required
                          autoComplete="new-password"
                        />
                        {confirmPw && confirmPw === newPw && (
                          <span className="ep-match-check">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                        )}
                      </div>
                      {confirmPw && confirmPw !== newPw && (
                        <span className="ep-hint error">Passwords do not match.</span>
                      )}
                    </div>
                  </div>

                  <div className="ep-form-footer">
                    <button type="submit" className="ep-save-btn" disabled={saving}>
                      {saving
                        ? <><div className="ep-btn-spinner" /> Updating...</>
                        : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Update Password</>
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          </main>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        .ep-page {
          min-height: 100vh;
          background: var(--sf-bg, #FAF7F2);
          font-family: 'Inter', sans-serif;
          padding: 50px 5% 100px;
          color: #374151;
        }
        .ep-inner { max-width: 960px; margin: 0 auto; }

        /* Back */
        .ep-back {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 0.84rem; color: #6B7280; text-decoration: none;
          margin-bottom: 28px; font-weight: 600; transition: color 0.2s ease;
        }
        .ep-back:hover { color: var(--sf-accent, #15803D); }

        /* Layout */
        .ep-layout { display: grid; grid-template-columns: 240px 1fr; gap: 28px; align-items: start; }
        @media(max-width: 768px) { .ep-layout { grid-template-columns: 1fr; } }

        /* Aside */
        .ep-aside {}
        .ep-avatar-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.05);
          border-radius: 22px; padding: 28px 20px 20px;
          text-align: center;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.04);
          position: sticky; top: 90px;
        }
        .ep-avatar-ring {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, var(--sf-accent,#15803D), #22C55E);
          padding: 3px; margin: 0 auto 12px; display: flex;
          box-shadow: 0 8px 20px -5px rgba(21,128,61,0.35);
        }
        .ep-avatar {
          width: 100%; height: 100%; border-radius: 50%;
          background: #fff; display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 1.5rem;
          color: var(--sf-accent, #15803D);
        }
        .ep-user-name { font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: #111827; margin-bottom: 4px; }
        .ep-user-email { font-size: 0.78rem; color: #9CA3AF; font-weight: 500; margin-bottom: 8px; }
        .ep-user-phone {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.78rem; color: #6B7280; font-weight: 500;
          background: rgba(0,0,0,0.03); padding: 4px 12px; border-radius: 50px; margin-bottom: 20px;
        }

        .ep-aside-nav { display: flex; flex-direction: column; gap: 4px; text-align: left; }
        .ep-aside-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          font-size: 0.84rem; font-weight: 600; color: #6B7280;
          border: none; background: transparent; cursor: pointer;
          text-decoration: none; transition: all 0.15s ease;
        }
        .ep-aside-btn:hover { background: rgba(0,0,0,0.03); color: #111827; }
        .ep-aside-btn.active { background: rgba(21,128,61,0.08); color: var(--sf-accent, #15803D); }

        /* Main card */
        .ep-main {}
        .ep-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.05);
          border-radius: 22px; overflow: hidden;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.04);
        }

        /* Tabs */
        .ep-tabs {
          display: flex; border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 0 28px;
        }
        .ep-tab {
          padding: 18px 0; margin-right: 32px;
          font-size: 0.88rem; font-weight: 700; color: #9CA3AF;
          border: none; background: transparent; cursor: pointer;
          border-bottom: 2.5px solid transparent; transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        .ep-tab:hover { color: #374151; }
        .ep-tab.active { color: var(--sf-accent, #15803D); border-bottom-color: var(--sf-accent, #15803D); }

        /* Message */
        .ep-msg {
          display: flex; align-items: center; gap: 10px;
          margin: 20px 28px 0; padding: 14px 18px;
          border-radius: 12px; font-size: 0.875rem; font-weight: 600;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .ep-msg.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803D; }
        .ep-msg.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

        /* Form */
        .ep-form { padding: 28px; }
        .ep-form-title {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800;
          color: #111827; margin-bottom: 28px;
        }
        .ep-field-group { display: flex; flex-direction: column; gap: 20px; }
        .ep-field { display: flex; flex-direction: column; gap: 7px; }
        .ep-label {
          font-size: 0.82rem; font-weight: 700; color: #374151;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .ep-optional { font-weight: 500; color: #9CA3AF; text-transform: none; letter-spacing: 0; }

        .ep-input-wrap {
          position: relative; display: flex; align-items: center;
        }
        .ep-input-icon {
          position: absolute; left: 14px; color: #9CA3AF; pointer-events: none; z-index: 1;
        }
        .ep-input {
          width: 100%; padding: 13px 14px 13px 42px;
          border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px;
          font-size: 0.92rem; color: #111827; font-family: 'Inter', sans-serif;
          background: #FAFAFA; transition: all 0.2s ease; outline: none;
          box-sizing: border-box;
        }
        .ep-input:focus {
          border-color: var(--sf-accent, #15803D);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(21,128,61,0.08);
        }
        .ep-input.disabled { color: #9CA3AF; cursor: not-allowed; padding-right: 42px; }
        .ep-input.mismatch { border-color: #EF4444; }
        .ep-input.mismatch:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }

        .ep-input-lock {
          position: absolute; right: 14px; color: #9CA3AF;
        }
        .ep-eye-btn {
          position: absolute; right: 14px; background: none; border: none;
          cursor: pointer; color: #9CA3AF; padding: 0; display: flex;
          transition: color 0.2s ease;
        }
        .ep-eye-btn:hover { color: #374151; }
        .ep-match-check {
          position: absolute; right: 14px; display: flex;
        }

        .ep-hint { font-size: 0.76rem; color: #9CA3AF; font-weight: 500; }
        .ep-hint.error { color: #EF4444; }

        /* Strength bar */
        .ep-strength-bar { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
        .ep-strength-track {
          flex: 1; height: 4px; background: #E5E7EB; border-radius: 4px; overflow: hidden;
        }
        .ep-strength-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease, background 0.4s ease; }
        .ep-strength-label { font-size: 0.72rem; font-weight: 700; min-width: 40px; text-align: right; }

        /* Footer */
        .ep-form-footer {
          margin-top: 32px; padding-top: 24px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .ep-save-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 32px; border-radius: 50px;
          background: var(--sf-accent, #15803D); color: #fff; border: none;
          font-size: 0.92rem; font-weight: 800; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 8px 20px -5px rgba(21,128,61,0.35);
        }
        .ep-save-btn:hover:not(:disabled) {
          transform: translateY(-2px); filter: brightness(1.06);
          box-shadow: 0 14px 28px -5px rgba(21,128,61,0.45);
        }
        .ep-save-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Spinner */
        .ep-spinner {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3.5px solid rgba(0,0,0,0.06); border-top-color: var(--sf-accent, #15803D);
          animation: spin 0.85s linear infinite;
        }
        .ep-btn-spinner {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: spin 0.85s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media(max-width: 600px) {
          .ep-page { padding: 36px 4% 80px; }
          .ep-form { padding: 20px; }
          .ep-tabs { padding: 0 20px; }
          .ep-msg { margin: 16px 20px 0; }
        }
      `}</style>
    </div>
  );
};
