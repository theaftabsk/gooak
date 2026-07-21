import React from 'react';
import { TeamMember, RolePermissionConfig } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  user: TeamMember | null;
  onClose: () => void;
  onToggleStatus: (user: TeamMember) => Promise<void>;
  onResetPassword: (user: TeamMember) => void;
  togglingId: string | null;
  permissions: Record<'admin' | 'staff', RolePermissionConfig>;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  user,
  onClose,
  onToggleStatus,
  onResetPassword,
  togglingId,
  permissions,
}) => {
  if (!isOpen || !user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getRoleLabel = () => {
    const role = user.role.toLowerCase();
    if (role === 'owner') return 'Primary Store Owner';
    if (role === 'admin' || role === 'administrator') return 'System Administrator';
    return 'Store Staff Member';
  };

  const getPermissions = () => {
    const role = user.role.toLowerCase();
    if (role === 'owner') {
      return [
        { name: 'Products & Collections', level: 'Full Access (Read / Write)' },
        { name: 'Orders & Fulfillment', level: 'Full Access (Read / Write)' },
        { name: 'Payment Integrations', level: 'Full Access (Read / Write)' },
        { name: 'Staff Management', level: 'Full Access (Read / Write)' },
      ];
    }
    
    const isSpecialAdmin = role === 'admin' || role === 'administrator';
    const roleKey = isSpecialAdmin ? 'admin' : 'staff';
    const config = permissions[roleKey];
    
    const labelMap = {
      write: 'Full Access (Read / Write)',
      read: 'Limited (Read-Only)',
      none: 'No Access',
    };

    return [
      { name: 'Products & Collections', level: labelMap[config.products] },
      { name: 'Orders & Fulfillment', level: labelMap[config.orders] },
      { name: 'Payment Integrations', level: labelMap[config.payments] },
      { name: 'Staff Management', level: labelMap[config.staff] },
    ];
  };

  const perms = getPermissions();
  const isToggling = togglingId === user.id;

  return (
    <div className="saas-drawer-overlay" onClick={onClose}>
      <div className="saas-drawer-container" onClick={e => e.stopPropagation()}>
        <div className="saas-drawer-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 750 }}>Member Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748B' }}>&times;</button>
        </div>

        <div className="saas-drawer-body">
          {/* User Bio Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', marginBottom: 25 }}>
            <div className="avatar-initials" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>
              {initials}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>{user.name}</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{getRoleLabel()}</p>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 25, borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Email Address</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Phone Number</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{user.phone || '+91 98765 43210'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Registered Date</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Last Login</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{user.last_login || 'Today, 11:20 AM'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Account Status</span>
              <span style={{
                color: user.status === 'Active' ? '#16A34A' : user.status === 'Disabled' ? '#DC2626' : '#F59E0B',
                fontWeight: 700
              }}>{user.status}</span>
            </div>
          </div>

          {/* Permissions Matrix scope */}
          <div style={{ marginBottom: 25 }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Permissions Scope
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {perms.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{p.name}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: p.level.includes('Full') ? '#16A34A' : p.level.includes('Limited') ? '#3B82F6' : '#64748B'
                  }}>{p.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Buttons */}
          <div>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Security &amp; Actions
            </h5>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => onResetPassword(user)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Reset Password
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus(user)}
                disabled={isToggling || user.role.toLowerCase() === 'owner'}
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: user.role.toLowerCase() === 'owner' ? '#94A3B8' : user.status === 'Active' ? '#DC2626' : '#16A34A',
                  borderColor: user.role.toLowerCase() === 'owner' ? '#E2E8F0' : user.status === 'Active' ? '#FCA5A5' : '#86EFAC',
                }}
              >
                {isToggling ? 'Updating...' : user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
