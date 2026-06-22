import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../../../../lib/api-client';

interface SettingsPageProps {
  shopInfo: any;
  onSaveSettings: (data: any) => Promise<void>;
  saving: boolean;
}

/* ─── Premium Custom SVG Icons ─────────────────────────────────── */
const IconStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconSliders = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ─── Styles ────────────────────────────────────────────────────── */
const SettingsStyles = () => (
  <style>{`
    .set-container { display: grid; grid-template-columns: 260px 1fr; gap: 30px; align-items: start; max-width: 1200px; margin: 0 auto; }
    @media(max-width: 900px){ .set-container { grid-template-columns: 1fr; } }

    /* Side Navigation Tabs */
    .set-tabs {
      background: var(--m-card);
      border: 1px solid var(--m-border);
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    @media(max-width: 900px){ .set-tabs { flex-direction: row; flex-wrap: wrap; } }

    .set-tab-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: none;
      background: none;
      border-radius: 8px;
      color: var(--m-text-muted);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    .set-tab-btn:hover { background: rgba(255,255,255,0.03); color: var(--m-text-main); }
    .set-tab-btn.active { background: var(--m-primary-light); color: var(--m-primary); }

    /* Stats Quick Widget */
    .set-stats-card {
      background: var(--m-card);
      border: 1px solid var(--m-border);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }
    .set-stats-title { font-size: 0.78rem; font-weight: 700; color: var(--m-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .set-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .set-stats-item { background: rgba(255,255,255,0.02); border: 1px solid var(--m-border); border-radius: 8px; padding: 10px; text-align: center; }
    .set-stats-val { font-size: 1.1rem; font-weight: 800; color: var(--m-text-main); }
    .set-stats-lbl { font-size: 0.72rem; color: var(--m-text-muted); margin-top: 2px; }

    /* Forms */
    .set-form-section { background: var(--m-card); border: 1px solid var(--m-border); border-radius: 12px; padding: 24px; }
    .set-section-header { margin-bottom: 24px; border-bottom: 1px solid var(--m-border); padding-bottom: 14px; }
    .set-section-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--m-text-main); }
    .set-section-header p { margin: 4px 0 0; font-size: 0.82rem; color: var(--m-text-muted); }

    /* Lists and Tables */
    .set-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .set-table th { padding: 12px 16px; border-bottom: 2px solid var(--m-border); color: var(--m-text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; }
    .set-table td { padding: 12px 16px; border-bottom: 1px solid var(--m-border); color: var(--m-text-main); vertical-align: middle; }
    .set-table tr:last-child td { border-bottom: none; }

    /* Plan tier presentation badge */
    .plan-badge { background: linear-gradient(135deg, #6366F1, #4F46E5); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em; }

    /* Backup Cards */
    .backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media(max-width: 600px){ .backup-grid { grid-template-columns: 1fr; } }
    .backup-card { border: 1px solid var(--m-border); border-radius: 12px; padding: 20px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 12px; }
    .backup-card-title { font-size: 0.95rem; font-weight: 700; color: var(--m-text-main); display: flex; align-items: center; gap: 8px; }
    .backup-card-desc { font-size: 0.82rem; color: var(--m-text-muted); line-height: 1.45; }
  `}</style>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({ shopInfo, onSaveSettings, saving }) => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'general' | 'advanced' | 'domains' | 'staff' | 'overrides' | 'backup'>('general');

  // Stats State
  const [stats, setStats] = useState<any>(null);

  // Tab 1: General Settings Form State
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [logoUrl, setLogoUrl]   = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Tab 2: Advanced Settings State
  const [slug, setSlug]           = useState('');
  const [status, setStatus]       = useState('active');
  const [dbConnUrl, setDbConnUrl] = useState('');
  const [savingAdvanced, setSavingAdvanced] = useState(false);

  // Tab 3: Domains State
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newDomainType, setNewDomainType] = useState('custom');
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);

  // Tab 4: Staff Users State
  const [users, setUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Tab 5: Configuration Overrides State
  const [configs, setConfigs] = useState<any[]>([]);
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Tab 6: Backup Loading indicators
  const [downloadingSql, setDownloadingSql] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);

  // Success message flashes
  const [successFlash, setSuccessFlash] = useState<string | null>(null);

  // Bind values from parent shopInfo
  useEffect(() => {
    if (shopInfo) {
      setName(shopInfo.name || '');
      setDesc(shopInfo.description || '');
      setLogoUrl(shopInfo.logo_url || '');
      setCurrency(shopInfo.currency || 'INR');
      setTimezone(shopInfo.timezone || 'Asia/Kolkata');
      setSlug(shopInfo.slug || '');
      setStatus(shopInfo.status || 'active');
      setDbConnUrl(shopInfo.db_connection_url || '');
    }
  }, [shopInfo]);

  // Fetch shop statistics counts
  const fetchStats = useCallback(async () => {
    try {
      const res = await catalogApi.getShopStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, []);

  // Fetch Domains
  const fetchDomains = useCallback(async () => {
    setLoadingDomains(true);
    try {
      const res = await catalogApi.getShopDomains();
      setDomains(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  }, []);

  // Fetch Staff Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await catalogApi.getShopUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Configuration overrides
  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const res = await catalogApi.getConfigOverrides();
      setConfigs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load configs:', err);
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  // Load contextual sub-tab data on tab activation
  useEffect(() => {
    fetchStats();
    if (activeTab === 'domains') fetchDomains();
    if (activeTab === 'staff') fetchUsers();
    if (activeTab === 'overrides') fetchConfigs();
  }, [activeTab, fetchStats, fetchDomains, fetchUsers, fetchConfigs]);

  const triggerSuccess = (msg: string) => {
    setSuccessFlash(msg);
    setTimeout(() => setSuccessFlash(null), 3000);
  };

  // Submit Tab 1: General configurations
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSaveSettings({
      name: name.trim(),
      description: desc.trim() || null,
      logo_url: logoUrl.trim() || null,
      currency,
      timezone,
    });
    triggerSuccess('General settings saved successfully!');
  };

  // Submit Tab 2: Advanced configurations
  const handleSaveAdvanced = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;
    setSavingAdvanced(true);
    try {
      await catalogApi.updateAdvancedSettings({
        slug: slug.trim(),
        status,
        db_connection_url: dbConnUrl.trim() || undefined,
      });
      triggerSuccess('Advanced configurations updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to update advanced settings.');
    } finally {
      setSavingAdvanced(false);
    }
  };

  // Submit Tab 3: Register Domain
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      await catalogApi.addShopDomain({ domain: newDomain.trim(), type: newDomainType });
      setNewDomain('');
      fetchDomains();
      triggerSuccess('New domain mapping registered!');
    } catch (err: any) {
      alert(err.message || 'Failed to map domain.');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleSetPrimaryDomain = async (id: string) => {
    try {
      await catalogApi.setPrimaryDomain(id);
      fetchDomains();
      triggerSuccess('Primary domain status updated.');
    } catch (err: any) {
      alert(err.message || 'Failed to update primary domain.');
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain mapping?')) return;
    try {
      await catalogApi.deleteShopDomain(id);
      fetchDomains();
      triggerSuccess('Domain mapping deleted.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete domain mapping.');
    }
  };

  // Submit Tab 4: Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    setAddingUser(true);
    try {
      await catalogApi.addShopUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
      triggerSuccess('Staff user registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to register user.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Remove this staff user from your store database?')) return;
    try {
      await catalogApi.deleteShopUser(id);
      fetchUsers();
      triggerSuccess('User removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove user.');
    }
  };

  // Submit Tab 5: Config Overrides
  const handleSaveConfigOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfigKey.trim() || !newConfigValue.trim()) return;
    setSavingConfig(true);
    try {
      await catalogApi.saveConfigOverride({
        key: newConfigKey.trim(),
        value: newConfigValue.trim(),
      });
      setNewConfigKey('');
      setNewConfigValue('');
      fetchConfigs();
      triggerSuccess('Configuration custom override saved!');
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetOverride = async (key: string) => {
    if (!confirm(`Delete custom override for "${key}" and reset back to system default?`)) return;
    try {
      await catalogApi.deleteConfigOverride(key);
      fetchConfigs();
      triggerSuccess('Configuration override reset to global default.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset configuration.');
    }
  };

  // Downloads helper triggers
  const downloadJsonBackup = async () => {
    setDownloadingJson(true);
    try {
      const data = await catalogApi.getJsonBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop_backup_${shopInfo?.slug || 'store'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to generate JSON backup: ' + err.message);
    } finally {
      setDownloadingJson(false);
    }
  };

  const downloadSqlBackup = async () => {
    setDownloadingSql(true);
    try {
      const sqlText = await catalogApi.getSqlBackup();
      const blob = new Blob([sqlText], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `db_export_${shopInfo?.slug || 'store'}.sql`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to fetch SQL dump: ' + err.message);
    } finally {
      setDownloadingSql(false);
    }
  };

  return (
    <>
      <SettingsStyles />
      <header className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h2>Store Settings</h2>
          <p className="header-sub">Configure store properties, user staff registry, domain mappings, and system settings overrides</p>
        </div>
      </header>

      {successFlash && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 18px',
          background: '#DCFCE7',
          border: '1px solid #86EFAC',
          borderRadius: '8px',
          color: '#15803D',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '20px',
        }}>
          ✓ {successFlash}
        </div>
      )}

      <div className="set-container">
        {/* Navigation Sidebar */}
        <div>
          <nav className="set-tabs">
            <button className={`set-tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              <IconStore /> General Profile
            </button>
            <button className={`set-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>
              <IconSettings /> Advanced &amp; Plan
            </button>
            <button className={`set-tab-btn ${activeTab === 'domains' ? 'active' : ''}`} onClick={() => setActiveTab('domains')}>
              <IconGlobe /> Domain Mappings
            </button>
            <button className={`set-tab-btn ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
              <IconUsers /> Users &amp; Staff
            </button>
            <button className={`set-tab-btn ${activeTab === 'overrides' ? 'active' : ''}`} onClick={() => setActiveTab('overrides')}>
              <IconSliders /> Config Overrides
            </button>
            <button className={`set-tab-btn ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
              <IconDownload /> Data Backups
            </button>
          </nav>

          {/* Registry Stats Panel */}
          {stats && (
            <div className="set-stats-card">
              <div className="set-stats-title">Shop Registry Statistics</div>
              <div className="set-stats-grid">
                <div className="set-stats-item">
                  <div className="set-stats-val">{stats.products}</div>
                  <div className="set-stats-lbl">Products</div>
                </div>
                <div className="set-stats-item">
                  <div className="set-stats-val">{stats.orders}</div>
                  <div className="set-stats-lbl">Orders</div>
                </div>
                <div className="set-stats-item">
                  <div className="set-stats-val">{stats.users}</div>
                  <div className="set-stats-lbl">Staff Users</div>
                </div>
                <div className="set-stats-item">
                  <div className="set-stats-val">{stats.domains}</div>
                  <div className="set-stats-lbl">Domains</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Tabs Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TAB 1: GENERAL PROFILE */}
          {activeTab === 'general' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>General Brand Profile</h3>
                <p>Configure details detailing store metadata and checkout choices</p>
              </div>

              <form onSubmit={handleSaveGeneral} className="form-grid">
                <div className="field-group">
                  <label>Store ID Context</label>
                  <code style={{ fontSize: '0.8rem', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--m-border)', borderRadius: '6px', color: 'var(--m-text-muted)' }}>
                    {shopInfo?.id}
                  </code>
                </div>

                <div className="field-group">
                  <label>Store Display Name *</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Nature Glow Beauty"
                  />
                </div>

                <div className="field-group">
                  <label>Store Description / Bio</label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={4}
                    placeholder="e.g. Natural formulations crafted with pure organic herbs..."
                  />
                </div>

                <div className="field-group">
                  <label>Brand Logo URL</label>
                  <input
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="e.g. https://domain.com/logo.png"
                  />
                </div>

                <div className="form-row">
                  <div className="field-group">
                    <label>Currency Code</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="INR">INR (₹) — Indian Rupee</option>
                      <option value="BDT">BDT (৳) — Bangladeshi Taka</option>
                      <option value="USD">USD ($) — US Dollar</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Timezone Context</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)}>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6:00)</option>
                      <option value="UTC">UTC (GMT+0:00)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>
                  <div><strong>Registered At:</strong> {shopInfo?.created_at ? new Date(shopInfo.created_at).toLocaleString() : 'N/A'}</div>
                  <div><strong>Updated At:</strong> {shopInfo?.updated_at ? new Date(shopInfo.updated_at).toLocaleString() : 'N/A'}</div>
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 14 }} disabled={saving}>
                  <IconShield /> {saving ? 'Saving Profile…' : 'Save General configurations'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ADVANCED CONFIG & SUBSCRIPTION TIER */}
          {activeTab === 'advanced' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>Advanced Server Configurations</h3>
                <p>Manage system connection parameters, status values, and view subscription details</p>
              </div>

              {/* Read-Only Subscription Plan Info Card */}
              <div className="card" style={{ marginBottom: '24px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--m-text-main)' }}>Platform Subscription Plan</h4>
                  <span className="plan-badge">{shopInfo?.plan?.toUpperCase() || 'FREE'} PLAN</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--m-text-muted)', lineHeight: 1.5 }}>
                  This store is registered under the platform's <strong>{shopInfo?.plan || 'Free'} Plan</strong>. High performance SaaS metrics, standard multi-tenant database indexing, and custom domains verify automatically on this plan level. Contact platform administrators to modify your billing tier.
                </p>
              </div>

              <form onSubmit={handleSaveAdvanced} className="form-grid">
                <div className="field-group">
                  <label>Store Subdomain Slug *</label>
                  <input
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. nature-glow"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--m-text-muted)' }}>
                    Maps storefront to: <code style={{ color: 'var(--m-primary)' }}>{slug || 'slug'}.localhost:3001</code>
                  </small>
                </div>

                <div className="field-group">
                  <label>Store System Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">Active (Storefront accessible)</option>
                    <option value="suspended">Suspended (Store disabled)</option>
                    <option value="maintenance">Maintenance (Maintenance window banner)</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Custom Tenant Database Connection URL</label>
                  <input
                    value={dbConnUrl}
                    onChange={e => setDbConnUrl(e.target.value)}
                    placeholder="postgresql://user:pass@host:port/database?schema=public"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--m-text-muted)' }}>
                    Leave blank to use the shared central SaaS database. Specify to isolate queries to a dedicated PostgreSQL connection pool.
                  </small>
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} disabled={savingAdvanced}>
                  <IconShield /> {savingAdvanced ? 'Saving advanced configurations…' : 'Save advanced settings'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DOMAIN MANAGER */}
          {activeTab === 'domains' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>Storefront Domain Mappings</h3>
                <p>Register custom domains or subdomains to point to your store storefront</p>
              </div>

              {/* Add domain form */}
              <form onSubmit={handleAddDomain} style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--m-border)',
                borderRadius: '8px',
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Domain Address</label>
                  <input
                    required
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="e.g. amir.testshop.com or shop.localhost"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Domain Type</label>
                  <select value={newDomainType} onChange={e => setNewDomainType(e.target.value)} style={{ width: '100%' }}>
                    <option value="custom">Custom Domain</option>
                    <option value="subdomain">Subdomain</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }} disabled={addingDomain}>
                  <IconPlus /> {addingDomain ? 'Adding…' : 'Map Domain'}
                </button>
              </form>

              {/* Domain list */}
              {loadingDomains ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--m-text-muted)' }}>Loading mapped domains...</div>
              ) : domains.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', border: '1.5px dashed var(--m-border)', borderRadius: '8px', color: 'var(--m-text-muted)', fontSize: '0.85rem' }}>
                  No custom domain mappings found. Your store resolves on the default <code>{shopInfo?.slug}.localhost:3001</code> subdomain.
                </div>
              ) : (
                <div style={{ border: '1px solid var(--m-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="set-table">
                    <thead>
                      <tr>
                        <th>Domain / Host Address</th>
                        <th>Type</th>
                        <th>Primary</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {domains.map((dom) => (
                        <tr key={dom.id}>
                          <td style={{ fontWeight: 600 }}>{dom.domain}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                              {dom.type}
                            </span>
                          </td>
                          <td>
                            {dom.is_primary ? (
                              <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>✓ PRIMARY</span>
                            ) : (
                              <button className="btn-ghost-sm" style={{ padding: '3px 8px', fontSize: '0.7rem' }} onClick={() => handleSetPrimaryDomain(dom.id)}>
                                Set Primary
                              </button>
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: dom.status === 'active' ? '#10B981' : '#F59E0B',
                            }}>
                              {dom.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-ghost-sm"
                              style={{ color: '#EF4444', padding: '6px' }}
                              onClick={() => handleDeleteDomain(dom.id)}
                              disabled={dom.is_primary}
                              title={dom.is_primary ? 'Cannot delete primary domain' : 'Delete mapping'}
                            >
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS & STAFF MANAGER */}
          {activeTab === 'staff' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>Store Users &amp; Staff</h3>
                <p>Register and manage administrator accounts and staff members that have access to this store dashboard</p>
              </div>

              {/* Add User form */}
              <form onSubmit={handleAddUser} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr) auto',
                gap: '12px',
                alignItems: 'flex-end',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--m-border)',
                borderRadius: '8px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Name</label>
                  <input
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="Full name"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Email</label>
                  <input
                    required
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="email@domain.com"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Password</label>
                  <input
                    required
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Password"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Role</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%' }}>
                    <option value="staff">Staff Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }} disabled={addingUser}>
                  <IconPlus /> {addingUser ? 'Registering…' : 'Register User'}
                </button>
              </form>

              {/* Users list */}
              {loadingUsers ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--m-text-muted)' }}>Loading store staff members...</div>
              ) : (
                <div style={{ border: '1px solid var(--m-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="set-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Role</th>
                        <th>Registered Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td><code>{u.email}</code></td>
                          <td>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: u.role === 'admin' ? '#FEE2E2' : '#F1F5F9',
                              color: u.role === 'admin' ? '#DC2626' : '#475569',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ color: 'var(--m-text-muted)' }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-ghost-sm"
                              style={{ color: '#EF4444', padding: '6px' }}
                              onClick={() => handleDeleteUser(u.id)}
                              title="Delete user account"
                            >
                              <IconTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM CONFIG OVERRIDES */}
          {activeTab === 'overrides' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>Global Configurations &amp; Overrides</h3>
                <p>Override platform-wide system-level defaults with shop-specific config overrides</p>
              </div>

              {/* Add Custom Override Form */}
              <form onSubmit={handleSaveConfigOverride} style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
                marginBottom: '24px',
                padding: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--m-border)',
                borderRadius: '8px',
              }}>
                <div style={{ width: '220px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Setting Key</label>
                  <input
                    required
                    value={newConfigKey}
                    onChange={e => setNewConfigKey(e.target.value)}
                    placeholder="e.g. tax_rate_percent"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-text-muted)', marginBottom: '6px' }}>Override Value</label>
                  <input
                    required
                    value={newConfigValue}
                    onChange={e => setNewConfigValue(e.target.value)}
                    placeholder="e.g. 15"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }} disabled={savingConfig}>
                  <IconPlus /> {savingConfig ? 'Saving…' : 'Add Override'}
                </button>
              </form>

              {/* Configs table */}
              {loadingConfigs ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--m-text-muted)' }}>Loading configurations...</div>
              ) : (
                <div style={{ border: '1px solid var(--m-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table className="set-table">
                    <thead>
                      <tr>
                        <th>Config Key</th>
                        <th>Active Value</th>
                        <th>Origin</th>
                        <th>Global Default</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((c) => (
                        <tr key={c.key}>
                          <td>
                            <strong style={{ display: 'block', fontSize: '0.85rem' }}>{c.key}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--m-text-muted)' }}>{c.description}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: c.origin === 'shop_override' ? 'var(--m-primary)' : 'var(--m-text-main)' }}>
                            {c.activeValue}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: c.origin === 'shop_override' ? '#DCFCE7' : '#F1F5F9',
                              color: c.origin === 'shop_override' ? '#15803D' : '#475569',
                            }}>
                              {c.origin === 'shop_override' ? 'SHOP OVERRIDE' : 'GLOBAL DEFAULT'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--m-text-muted)', fontStyle: 'italic' }}>
                            {c.systemDefault}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {c.origin === 'shop_override' ? (
                              <button
                                className="btn-ghost-sm"
                                style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}
                                onClick={() => handleResetOverride(c.key)}
                                title="Reset override to global default"
                              >
                                Reset Default
                              </button>
                            ) : (
                              <button
                                className="btn-ghost-sm"
                                style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--m-primary)' }}
                                onClick={() => {
                                  setNewConfigKey(c.key);
                                  setNewConfigValue(c.activeValue);
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                              >
                                Override
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BACKUPS AND DATA EXPORT */}
          {activeTab === 'backup' && (
            <div className="set-form-section">
              <div className="set-section-header">
                <h3>Store Database Backups &amp; Exports</h3>
                <p>Download structured backups of your store catalogs, inventory levels, settings, and transactions</p>
              </div>

              <div className="backup-grid">
                {/* SQL backup */}
                <div className="backup-card">
                  <div className="backup-card-title">
                    <IconDownload /> PostgreSQL SQL Export
                  </div>
                  <div className="backup-card-desc">
                    Download a raw PostgreSQL schema SQL script dump. Includes tables creations and database inserts for quick reconstruction or local imports using standard db command utilities.
                  </div>
                  <button className="btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={downloadSqlBackup} disabled={downloadingSql}>
                    {downloadingSql ? 'Generating SQL Export…' : 'Download Database SQL (.sql)'}
                  </button>
                </div>

                {/* JSON backup */}
                <div className="backup-card">
                  <div className="backup-card-title">
                    <IconDownload /> Portable JSON Data Export
                  </div>
                  <div className="backup-card-desc">
                    Download a consolidated JSON package of all products, categories, orders, customers, and configurations. Highly readable format for system migrations or visual data audits.
                  </div>
                  <button className="btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={downloadJsonBackup} disabled={downloadingJson}>
                    {downloadingJson ? 'Assembling JSON Archive…' : 'Download JSON Data Backup (.json)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
