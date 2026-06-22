import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner } from '../../shared';
import { platformTeamApi } from '../../../../lib/api-client';

const ALL_PERMISSIONS = [
  { key: 'VIEW_SHOPS', label: 'View Stores', description: 'Can view the list of stores and active storefronts' },
  { key: 'VIEW_STATS', label: 'View Statistics', description: 'Can view dashboard metrics and overview stats' },
  { key: 'VIEW_REQUESTS', label: 'View Signup Requests', description: 'Can view incoming tenant signup requests' },
  { key: 'ONBOARD_SHOP', label: 'Provision Stores', description: 'Can create and provision new storefronts' },
  { key: 'MANAGE_REQUESTS', label: 'Manage Signups', description: 'Can approve, reject, or delete tenant requests' },
  { key: 'SEED_DEMO', label: 'Seed Demo Data', description: 'Can seed standard products and banners into stores' },
  { key: 'DELETE_SHOP', label: 'Delete Stores', description: 'Can permanently remove storefronts and all database items' },
  { key: 'MANAGE_TEAM', label: 'Manage Platform Team', description: 'Can add, edit permissions, or delete other administrators' },
];

interface TeamPageProps {
  currentAdmin: any;
}

export const TeamPage: React.FC<TeamPageProps> = ({ currentAdmin }) => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states for Onboarding only
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  const handleTogglePermission = (key: string, permissions: string[], setPermissions: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (permissions.includes(key)) {
      setPermissions(permissions.filter(p => p !== key));
    } else {
      setPermissions([...permissions, key]);
    }
  };

  // Fetch team list
  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await platformTeamApi.getTeam();
      setTeam(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform team.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin?.permissions?.includes('MANAGE_TEAM')) {
      fetchTeam();
    }
  }, [currentAdmin]);

  // Handle create admin
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      setSubmitting(true);
      await platformTeamApi.createAdmin({
        name: newName,
        email: newEmail,
        password: newPassword || undefined,
        permissions: newPermissions
      });
      // Reset form & reload
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPermissions(['VIEW_SHOPS', 'VIEW_STATS', 'VIEW_REQUESTS']);
      setShowCreateModal(false);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to create administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentAdmin?.permissions?.includes('MANAGE_TEAM')) {
    return (
      <div className="empty-state">
        <Icons.Shield style={{ width: 48, height: 48, color: '#EF4444', marginBottom: 16 }} />
        <h3>Access Denied</h3>
        <p className="muted">You must have the "Manage Platform Team" permission to manage the team.</p>
      </div>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Platform Team</h2>
          <p className="header-sub">Manage platform operators and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Icons.Plus /> Add Administrator
        </button>
      </header>

      {error && (
        <div className="warning-box" style={{ marginBottom: 16 }}>
          <Icons.Warning /> {error}
        </div>
      )}

      {loading ? <LoadingSpinner message="Fetching administrators list…" /> : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Email Address</th>
                <th>Permissions & Capabilities</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map(member => (
                <tr 
                  key={member.id} 
                  style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onClick={(e) => {
                    // Prevent navigation if clicking on a button
                    if ((e.target as HTMLElement).closest('button')) return;
                    navigate(`/team/${member.id}`);
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="store-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }}>
                        {member.name[0].toUpperCase()}
                      </div>
                      <strong style={{ color: '#0F172A' }}>{member.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="mono">{member.email}</span>
                  </td>
                  <td>
                    {member.email === 'admin@oaksol.in' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Badge type="pro">MASTER OWNER</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#10B981', fontStyle: 'italic', fontWeight: 'bold' }}>All Permissions Granted</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '440px' }}>
                        {ALL_PERMISSIONS.map(p => {
                          const has = member.permissions?.includes(p.key);
                          return (
                            <span 
                              key={p.key} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: has ? '#ECFDF5' : '#F8FAFC', 
                                border: `1px solid ${has ? '#A7F3D0' : '#E2E8F0'}`, 
                                color: has ? '#065F46' : '#94A3B8', 
                                fontSize: '0.7rem', 
                                fontWeight: 500,
                              }}
                              title={`${p.label}: ${p.description}`}
                            >
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginRight: '2px' }}>{has ? '✓' : '✗'}</span>
                              {p.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge type={member.status === 'active' ? 'success' : 'warn'}>
                      {member.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-ghost-sm"
                        onClick={() => navigate(`/team/${member.id}`)}
                      >
                        <Icons.Edit style={{ marginRight: '4px', width: '12px', height: '12px' }} /> Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {team.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                    No administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboard Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <form onSubmit={handleCreate}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}>
                <div className="modal-icon-svg" style={{ color: '#6366F1' }}>
                  <Icons.Shield />
                </div>
                <div>
                  <h3>Add Platform Administrator</h3>
                  <p>Provision a new operator with custom permissions</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setShowCreateModal(false)}>
                  <Icons.X />
                </button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="form-grid">
                  <div className="field-group" style={{ gridColumn: 'span 2' }}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Aftab Alam"
                    />
                  </div>
                  <div className="field-group" style={{ gridColumn: 'span 2' }}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="admin@oaksol.in"
                    />
                  </div>
                  <div className="field-group" style={{ gridColumn: 'span 2' }}>
                    <label>Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Leave blank for default: OaksolAdmin2026"
                    />
                  </div>
                  <div className="field-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Permissions Settings</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                      {ALL_PERMISSIONS.map(p => (
                        <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={newPermissions.includes(p.key)}
                            onChange={() => handleTogglePermission(p.key, newPermissions, setNewPermissions)}
                            style={{ marginTop: '3px' }}
                          />
                          <div>
                            <strong style={{ color: '#0F172A' }}>{p.label}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>{p.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
