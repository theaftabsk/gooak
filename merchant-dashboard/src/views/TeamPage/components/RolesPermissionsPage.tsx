import React from 'react';
import { RolePermissionConfig } from '../types';
import { RoleCards } from './RoleCards';
import { PermissionMatrix } from './PermissionMatrix';

interface RolesPermissionsPageProps {
  permissions: Record<'admin' | 'staff', RolePermissionConfig>;
  onPermissionsChange: (role: 'admin' | 'staff', key: keyof RolePermissionConfig, val: 'write' | 'read' | 'none') => void;
}

export const RolesPermissionsPage: React.FC<RolesPermissionsPageProps> = ({
  permissions,
  onPermissionsChange,
}) => {
  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header section */}
      <header className="saas-header" style={{ marginBottom: 24 }}>
        <div>
          <h2>Organization Roles &amp; Permissions Config</h2>
          <p>Define dashboard roles access controls, configure feature modules authorizations, and fine-tune team visibility metrics</p>
        </div>
      </header>

      {/* Roles Cards View (takes full-width or flex) */}
      <div style={{ marginBottom: 30 }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          🛡 Roles &amp; Security Reference Scopes
        </h4>
        <RoleCards />
      </div>

      {/* Permission Matrix View (interactive dropdown cells) */}
      <div>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          🔑 Access Rights Configuration Matrix
        </h4>
        <PermissionMatrix permissions={permissions} onChange={onPermissionsChange} />
      </div>
    </div>
  );
};
