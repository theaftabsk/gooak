import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@oaksol/api-client';
import { TeamStyles } from './TeamStyles';
import './styles/TeamPage.css';
import { TeamMember, AuditLog, RolePermissionConfig } from './types';
import { RegisterModal } from './components/RegisterModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { RolesPermissionsPage } from './components/RolesPermissionsPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { LoadingSpinner, EmptyState } from '@/components/ui/Shared';
import { IconUserPlus, IconSearch, IconTrash, IconShieldCheck, IconUsers, IconActivity, IconUserCheck, IconKeyRound } from './components/Icons';

export const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);

  // Dynamic permissions state
  const [permissions, setPermissions] = useState<Record<'admin' | 'staff', RolePermissionConfig>>({
    admin: { products: 'write', orders: 'write', payments: 'none', staff: 'none' },
    staff: { products: 'read', orders: 'write', payments: 'none', staff: 'none' },
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Owner' | 'Admin' | 'Staff'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled' | 'Pending Invite'>('All');

  // Sub-view routing state
  const [currentSubView, setCurrentSubView] = useState<'registry' | 'permissions' | 'security_logs'>('registry');

  // Modals & Drawer States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Custom delete confirmation modal state
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);

  // Security activity / Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: '1', time: '11:20 AM', user: 'Demo Shop Owner', action: 'Changed Payment Settings', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Success' },
    { id: '2', time: '11:15 AM', user: 'Demo Shop Owner', action: 'User login initiated', ip: '192.168.1.1', device: 'Chrome / Windows', status: 'Success' },
    { id: '3', time: '10:30 AM', user: 'System Agent', action: 'Automatic backup execution', ip: '127.0.0.1', device: 'Prisma Runner', status: 'Success' },
    { id: '4', time: 'Yesterday', user: 'Demo Shop Owner', action: 'Domain mapping request', ip: '192.168.1.16', device: 'Firefox / Mac', status: 'Success' },
  ]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await catalogApi.getShopUsers();
      // Ensure we map role string and setup default status fields
      const mapped: TeamMember[] = (Array.isArray(res) ? res : []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'staff',
        status: u.role?.toLowerCase() === 'owner' ? 'Active' : (u.is_active === false ? 'Disabled' : 'Active'),
        created_at: u.created_at || new Date().toISOString(),
        last_login: u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Today, 11:20 AM',
        phone: u.phone || '+91 98765 43210',
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handlePermissionsChange = (
    roleKey: 'admin' | 'staff',
    key: keyof RolePermissionConfig,
    val: 'write' | 'read' | 'none'
  ) => {
    setPermissions(prev => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [key]: val,
      },
    }));

    // Add to security activity logs
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    setAuditLogs(prev => [
      {
        id: String(Date.now()),
        time: timeStr,
        user: 'Demo Shop Owner',
        action: `Updated ${roleKey} permissions: ${String(key)} set to ${val.toUpperCase()}`,
        ip: '192.168.1.1',
        device: 'Chrome / Windows',
        status: 'Success',
      },
      ...prev,
    ]);
  };

  const handleRegisterSubmit = async (data: any) => {
    setAddingUser(true);
    try {
      await catalogApi.addShopUser(data);

      // Add to security activity logs
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setAuditLogs(prev => [
        {
          id: String(Date.now()),
          time: timeStr,
          user: 'Demo Shop Owner',
          action: `Registered staff user ${data.email}`,
          ip: '192.168.1.1',
          device: 'Chrome / Windows',
          status: 'Success',
        },
        ...prev,
      ]);

      setIsRegisterOpen(false);
      alert('Team member registered successfully!');
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to register team member.');
    } finally {
      setAddingUser(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteMember) return;
    try {
      await catalogApi.deleteShopUser(deleteMember.id);

      // Add to security activity logs
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      setAuditLogs(prev => [
        {
          id: String(Date.now()),
          time: timeStr,
          user: 'Demo Shop Owner',
          action: `Revoked access for staff member ${deleteMember.email}`,
          ip: '192.168.1.1',
          device: 'Chrome / Windows',
          status: 'Success',
        },
        ...prev,
      ]);

      setDeleteMember(null);
      alert('User removed from team.');
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove user.');
    }
  };

  const handleToggleStatus = async (user: TeamMember) => {
    if (user.role.toLowerCase() === 'owner') return;
    const nextStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    
    // Simulate updating active state in the local state & adding audit logs
    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, status: nextStatus as any } : u))
    );
    if (selectedMember && selectedMember.id === user.id) {
      setSelectedMember(prev => prev ? { ...prev, status: nextStatus as any } : null);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    setAuditLogs(prev => [
      {
        id: String(Date.now()),
        time: timeStr,
        user: 'Demo Shop Owner',
        action: `Changed status of ${user.email} to ${nextStatus.toUpperCase()}`,
        ip: '192.168.1.1',
        device: 'Chrome / Windows',
        status: 'Success',
      },
      ...prev,
    ]);

    alert(`Account for ${user.name} has been set to ${nextStatus}.`);
  };

  const handleResetPassword = (user: TeamMember) => {
    alert(`A password reset email has been dispatched to ${user.email}.`);
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    setAuditLogs(prev => [
      {
        id: String(Date.now()),
        time: timeStr,
        user: 'Demo Shop Owner',
        action: `Requested password reset for ${user.email}`,
        ip: '192.168.1.1',
        device: 'Chrome / Windows',
        status: 'Success',
      },
      ...prev,
    ]);
  };

  // Filtered members list
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'All' ||
      u.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'All' ||
      u.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeClass = (r: string) => {
    const role = r.toLowerCase();
    if (role === 'owner') return 'role-badge-saas owner';
    if (role === 'admin' || role === 'administrator') return 'role-badge-saas admin';
    return 'role-badge-saas staff';
  };

  const getStatusBadgeClass = (s: string) => {
    const status = s.toLowerCase();
    if (status === 'active') return 'status-badge-saas active';
    if (status === 'disabled') return 'status-badge-saas disabled';
    return 'status-badge-saas pending';
  };

  if (loading) {
    return (
      <div className="saas-team-page" style={{ padding: '40px 20px' }}>
        <TeamStyles />
        <LoadingSpinner message="Fetching Enterprise Staff Directory..." />
      </div>
    );
  }

  // Summary Metrics counts
  const totalMembers = users.length;
  const activeMembers = users.filter(u => u.status === 'Active').length;
  const adminMembers = users.filter(u => ['owner', 'admin', 'administrator'].includes(u.role.toLowerCase())).length;
  const securityCount = auditLogs.length + 141; // 145 simulated total

  return (
    <div className="saas-team-page" style={{ padding: '24px 0' }}>
      <TeamStyles />

      {/* Segmented Tab Controls (Header-level SaaS selector) */}
      <div className="filter-tabs" style={{ display: 'inline-flex', padding: '4px 6px', background: '#F1F5F9', borderRadius: 10, marginBottom: 28, gap: 4, border: '1px solid #E2E8F0' }}>
        <button
          onClick={() => setCurrentSubView('registry')}
          className={`filter-tab-btn ${currentSubView === 'registry' ? 'active' : ''}`}
          style={{ borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconUsers size={16} />
          Staff Directory
        </button>
        <button
          onClick={() => setCurrentSubView('permissions')}
          className={`filter-tab-btn ${currentSubView === 'permissions' ? 'active' : ''}`}
          style={{ borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconShieldCheck size={16} />
          Roles &amp; Permissions Config
        </button>
        <button
          onClick={() => setCurrentSubView('security_logs')}
          className={`filter-tab-btn ${currentSubView === 'security_logs' ? 'active' : ''}`}
          style={{ borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IconActivity size={16} />
          Security Activity Logs
        </button>
      </div>

      {currentSubView === 'security_logs' && (
        <AuditLogsPage logs={auditLogs} onBack={() => setCurrentSubView('registry')} />
      )}

      {currentSubView === 'permissions' && (
        <RolesPermissionsPage
          permissions={permissions}
          onPermissionsChange={handlePermissionsChange}
        />
      )}

      {currentSubView === 'registry' && (
        <>
          {/* Header section */}
          <header className="saas-header">
            <div>
              <h2>Team Registry &amp; Permissions</h2>
              <p>Manage your team members, dashboard roles, security access and audit logs.</p>
            </div>
            <button className="btn-primary" onClick={() => setIsRegisterOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 18px', borderRadius: 8 }}>
              <IconUserPlus size={15} strokeWidth={2.5} />
              Register Staff
            </button>
          </header>

          {/* Stats row cards */}
          <div className="stats-row">
            <div className="stat-card-saas">
              <div className="stat-card-icon" style={{ background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
                <IconUsers size={20} style={{ color: '#2563EB' }} />
              </div>
              <div className="stat-card-info">
                <h4>Total Members</h4>
                <p>{totalMembers}</p>
              </div>
            </div>

            <div className="stat-card-saas">
              <div className="stat-card-icon" style={{ background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
                <IconUserCheck size={20} style={{ color: '#16A34A' }} />
              </div>
              <div className="stat-card-info">
                <h4>Active Users</h4>
                <p>{activeMembers}</p>
              </div>
            </div>

            <div className="stat-card-saas">
              <div className="stat-card-icon" style={{ background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
                <IconKeyRound size={20} style={{ color: '#D97706' }} />
              </div>
              <div className="stat-card-info">
                <h4>Administrators</h4>
                <p>{adminMembers}</p>
              </div>
            </div>

            <div className="stat-card-saas">
              <div className="stat-card-icon" style={{ background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
                <IconActivity size={20} style={{ color: '#B91C1C' }} />
              </div>
              <div className="stat-card-info">
                <h4>Security Events</h4>
                <p>{securityCount}</p>
              </div>
            </div>
          </div>

          {/* Directory Table in Full Width */}
          <div className="panel-card">
            {/* Search and Filters */}
            <div className="filter-bar">
              <div className="search-input-wrap">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <IconSearch className="search-icon-svg" size={14} />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Role Filter Button group */}
                <div className="filter-tabs">
                  {(['All', 'Owner', 'Admin', 'Staff'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setRoleFilter(tab)}
                      className={`filter-tab-btn ${roleFilter === tab ? 'active' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Status selector dropdown */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#475569',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Pending Invite">Pending Invite</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="db-table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
              <table className="db-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }} />
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const initials = user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={user.id}
                        className="row-interactive-saas"
                        onClick={() => setSelectedMember(user)}
                      >
                        <td>
                          <div className="avatar-initials">{initials}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(user.status)}>{user.status}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          {user.last_login || 'Today, 11:20 AM'}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="actions-dot-btn"
                            onClick={() => setDeleteMember(user)}
                            disabled={user.role.toLowerCase() === 'owner'}
                            title="Remove User"
                          >
                            <IconTrash size={15} strokeWidth={2.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState message="No team members found matching selected filters." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals & Slide-ins components */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSubmit={handleRegisterSubmit}
        adding={addingUser}
        permissions={permissions}
      />

      <ProfileDrawer
        isOpen={selectedMember !== null}
        user={selectedMember}
        onClose={() => setSelectedMember(null)}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        togglingId={null}
        permissions={permissions}
      />

      {/* Delete Confirmation popup overlay */}
      {deleteMember && (
        <div className="saas-modal-overlay">
          <div className="saas-modal-container" style={{ maxWidth: 400 }}>
            <div className="saas-modal-header">
              <h3 style={{ margin: 0, color: '#DC2626' }}>Remove User?</h3>
              <button onClick={() => setDeleteMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748B' }}>&times;</button>
            </div>
            <div className="saas-modal-body">
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{deleteMember.name}</strong> from this organization? This action cannot be undone and they will lose access immediately.
              </p>
            </div>
            <div className="saas-modal-footer">
              <button type="button" onClick={() => setDeleteMember(null)} className="btn-secondary" style={{ padding: '8px 14px' }}>Cancel</button>
              <button type="button" onClick={handleConfirmDelete} className="btn-primary" style={{ padding: '8px 14px', background: '#DC2626', borderColor: '#DC2626' }}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
