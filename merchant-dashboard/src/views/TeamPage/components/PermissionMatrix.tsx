import React from 'react';
import { RolePermissionConfig } from '../types';

interface PermissionMatrixProps {
  permissions: Record<'admin' | 'staff', RolePermissionConfig>;
  onChange: (role: 'admin' | 'staff', key: keyof RolePermissionConfig, val: 'write' | 'read' | 'none') => void;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  onChange,
}) => {
  const modules: { key: keyof RolePermissionConfig; label: string }[] = [
    { key: 'products', label: 'Products & Collections' },
    { key: 'orders', label: 'Orders & Processing' },
    { key: 'payments', label: 'Payment Gateways' },
    { key: 'staff', label: 'Staff Management' },
  ];

  const renderSelect = (role: 'admin' | 'staff', key: keyof RolePermissionConfig) => {
    const val = permissions[role][key];
    return (
      <select
        value={val}
        onChange={e => onChange(role, key, e.target.value as any)}
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #E2E8F0',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: val === 'write' ? '#16A34A' : val === 'read' ? '#3B82F6' : '#64748B',
          background: '#FFFFFF',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="write" style={{ color: '#16A34A', fontWeight: 650 }}>✔ Write</option>
        <option value="read" style={{ color: '#3B82F6', fontWeight: 650 }}>👁 Read</option>
        <option value="none" style={{ color: '#64748B', fontWeight: 650 }}>❌ None</option>
      </select>
    );
  };

  return (
    <div className="panel-card" style={{ marginTop: 20 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 750, color: '#0F172A' }}>Permission Matrix</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="db-table" style={{ margin: 0, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748B' }}>Module</th>
              <th style={{ textAlign: 'center', fontSize: '0.72rem', textTransform: 'uppercase', color: '#7E22CE' }}>Owner</th>
              <th style={{ textAlign: 'center', fontSize: '0.72rem', textTransform: 'uppercase', color: '#1D4ED8' }}>Admin</th>
              <th style={{ textAlign: 'center', fontSize: '0.72rem', textTransform: 'uppercase', color: '#047857' }}>Staff</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(m => (
              <tr key={m.key}>
                <td style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>{m.label}</td>
                {/* Owner has full access always */}
                <td style={{ textAlign: 'center', color: '#16A34A', fontWeight: 700, fontSize: '0.9rem' }}>✔</td>
                <td style={{ textAlign: 'center' }}>
                  {renderSelect('admin', m.key)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {renderSelect('staff', m.key)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
