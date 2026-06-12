import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface TeamMemberDetailPageProps {
  currentAdmin: any;
}

export const TeamMemberDetailPage: React.FC<TeamMemberDetailPageProps> = ({ currentAdmin }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<string>('active');
  const [submitting, setSubmitting] = useState(false);

  const fetchMember = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await platformTeamApi.getAdminDetail(id);
      setMember(data);
      setEditPermissions(data.permissions || []);
      setEditStatus(data.status || 'active');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administrator details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin?.permissions?.includes('MANAGE_TEAM')) {
      fetchMember();
    }
  }, [id, currentAdmin]);

  const handleTogglePermission = (key: string) => {
    if (editPermissions.includes(key)) {
      setEditPermissions(editPermissions.filter(p => p !== key));
    } else {
      setEditPermissions([...editPermissions, key]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !member) return;

    try {
      setSubmitting(true);
      await platformTeamApi.updateAdmin(id, {
        status: editStatus,
        permissions: editPermissions,
      });
      alert('Administrator updated successfully.');
      fetchMember();
    } catch (err: any) {
      alert(err.message || 'Failed to update administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatusDirect = async () => {
    if (!id || !member) return;
    if (member.email === 'admin@oaksol.in') {
      alert('Cannot modify the primary owner.');
      return;
    }
    const nextStatus = editStatus === 'active' ? 'inactive' : 'active';
    try {
      setSubmitting(true);
      await platformTeamApi.updateAdmin(id, { status: nextStatus });
      setEditStatus(nextStatus);
      setMember({ ...member, status: nextStatus });
      alert(`Account status changed to ${nextStatus}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !member) return;
    if (member.email === 'admin@oaksol.in') {
      alert('Cannot delete the primary owner.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete administrator "${member.name}"?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await platformTeamApi.deleteAdmin(id);
      alert('Administrator deleted successfully.');
      navigate('/team');
    } catch (err: any) {
      alert(err.message || 'Failed to delete administrator.');
      setSubmitting(false);
    }
  };

  if (!currentAdmin?.permissions?.includes('MANAGE_TEAM')) {
    return (
      <div className="empty-state">
        <Icons.Shield style={{ width: 48, height: 48, color: '#EF4444', marginBottom: 16 }} />
        <h3>Access Denied</h3>
        <p className="muted">You must have the "Manage Platform Team" permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading administrator profile details..." />;
  }

  if (error || !member) {
    return (
      <div className="empty-state">
        <Icons.Warning style={{ width: 48, height: 48, color: '#F59E0B', marginBottom: 16 }} />
        <h3>Administrator Profile Error</h3>
        <p className="muted">{error || 'Administrator profile not found.'}</p>
        <button className="btn-primary" onClick={() => navigate('/team')} style={{ marginTop: '16px' }}>
          Back to Team List
        </button>
      </div>
    );
  }

  const isOwner = member.email === 'admin@oaksol.in';

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-back" onClick={() => navigate('/team')}><Icons.ArrowLeft /></button>
          <div>
            <h2>Manage Administrator</h2>
            <p className="header-sub">Configure profile settings and active permissions for {member.name}</p>
          </div>
        </div>
        {!isOwner && (
          <button className="btn-danger-sm" onClick={handleDelete} disabled={submitting}>
            <Icons.Trash /> Delete Administrator
          </button>
        )}
      </header>

      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Operator Profile Details</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div className="store-avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {member.name[0].toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: '1.2rem', color: '#0F172A', display: 'block' }}>{member.name}</strong>
                <span className="mono" style={{ color: '#64748B', fontSize: '0.9rem' }}>{member.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>System ID</span>
                <span className="mono" style={{ fontSize: '0.8rem', color: '#0F172A' }}>{member.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Account Status</span>
                <div>
                  <Badge type={editStatus === 'active' ? 'success' : 'warn'}>
                    {editStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Created Date</span>
                <span style={{ color: '#0F172A' }}>{new Date(member.created_at).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Administrator Role</span>
                <span style={{ color: '#6366F1', fontWeight: 600 }}>{isOwner ? 'Master Owner' : 'Custom Operator'}</span>
              </div>
            </div>
          </div>

          {!isOwner && (
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className={editStatus === 'active' ? 'btn-ghost-sm' : 'btn-primary'} 
                onClick={handleToggleStatusDirect} 
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {editStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          )}
        </div>

        {/* Permissions Form */}
        <div className="card">
          <form onSubmit={handleSave}>
            <h3 className="card-title" style={{ marginBottom: '8px' }}>Security Settings</h3>
            <p className="muted" style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
              {isOwner 
                ? 'Master owners possess all platform privileges permanently.' 
                : 'Modify operator capabilities by toggling checkboxes below.'}
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              border: '1px solid #E2E8F0', 
              padding: '16px', 
              borderRadius: '8px', 
              background: '#F8FAFC',
              maxHeight: '360px',
              overflowY: 'auto'
            }}>
              {ALL_PERMISSIONS.map(p => {
                const checked = isOwner || editPermissions.includes(p.key);
                return (
                  <label 
                    key={p.key} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '12px', 
                      padding: '10px',
                      borderRadius: '6px',
                      background: checked ? '#F0FDF4' : 'transparent',
                      border: `1px solid ${checked ? '#DCFCE7' : 'transparent'}`,
                      cursor: isOwner ? 'default' : 'pointer', 
                      userSelect: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isOwner || submitting}
                      onChange={() => handleTogglePermission(p.key)}
                      style={{ marginTop: '4px' }}
                    />
                    <div>
                      <strong style={{ color: checked ? '#14532D' : '#0F172A', fontSize: '0.9rem' }}>{p.label}</strong>
                      <div style={{ fontSize: '0.75rem', color: checked ? '#166534' : '#64748B', marginTop: '2px' }}>{p.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {!isOwner && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-ghost" onClick={() => navigate('/team')} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving changes...' : 'Save Permissions'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};
