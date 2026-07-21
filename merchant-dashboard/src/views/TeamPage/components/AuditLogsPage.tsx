import React, { useState } from 'react';
import { AuditLog } from '../types';
import { IconArrowLeft, IconSearch, IconFilter, IconInfo, IconShieldCheck, IconUserCheck, IconShieldAlert, IconActivity, IconLock } from './Icons';
import { EmptyState } from '@/components/ui/Shared';

interface AuditLogsPageProps {
  logs: AuditLog[];
  onBack: () => void;
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed'>('All');
  const [deviceFilter, setDeviceFilter] = useState<'All' | 'Chrome' | 'Firefox' | 'Prisma'>('All');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Statistics calculation
  const totalEvents = logs.length + 141; // dynamic based on logs + simulated history
  const successCount = logs.filter(l => l.status === 'Success').length + 138;
  const failedCount = logs.filter(l => l.status === 'Failed').length + 3;
  const uniqueIps = new Set(logs.map(l => l.ip)).size + 4; // dynamic set of unique IPs

  // Filters mapping
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'All' || log.status === statusFilter;

    const matchesDevice =
      deviceFilter === 'All' ||
      (deviceFilter === 'Chrome' && log.device.includes('Chrome')) ||
      (deviceFilter === 'Firefox' && log.device.includes('Firefox')) ||
      (deviceFilter === 'Prisma' && log.device.includes('Prisma'));

    return matchesSearch && matchesStatus && matchesDevice;
  });

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header with Back button */}
      <header className="saas-header" style={{ marginBottom: 20 }}>
        <div>
          <h2>Security Activity Audit Logs</h2>
          <p>Monitor system logins, permission configuration updates, and dashboard access timelines</p>
        </div>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '10px 18px', borderRadius: 8 }}
        >
          <IconArrowLeft size={16} />
          Back to Staff Directory
        </button>
      </header>

      {/* Metrics Row */}
      <div className="stats-row" style={{ marginBottom: 30 }}>
        <div className="stat-card-saas">
          <div className="stat-card-icon" style={{ background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
            <IconLock size={20} style={{ color: '#B91C1C' }} />
          </div>
          <div className="stat-card-info">
            <h4>Total Events</h4>
            <p>{totalEvents}</p>
          </div>
        </div>

        <div className="stat-card-saas">
          <div className="stat-card-icon" style={{ background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
            <IconUserCheck size={20} style={{ color: '#16A34A' }} />
          </div>
          <div className="stat-card-info">
            <h4>Successful Events</h4>
            <p>{successCount}</p>
          </div>
        </div>

        <div className="stat-card-saas">
          <div className="stat-card-icon" style={{ background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
            <IconShieldAlert size={20} style={{ color: '#DC2626' }} />
          </div>
          <div className="stat-card-info">
            <h4>Failed Actions</h4>
            <p>{failedCount}</p>
          </div>
        </div>

        <div className="stat-card-saas">
          <div className="stat-card-icon" style={{ background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%' }}>
            <IconActivity size={20} style={{ color: '#2563EB' }} />
          </div>
          <div className="stat-card-info">
            <h4>Unique client IPs</h4>
            <p>{uniqueIps}</p>
          </div>
        </div>
      </div>

      {/* Main logs table panel */}
      <div className="panel-card">
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <input
              type="text"
              placeholder="Search by action, user, or IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <IconSearch className="search-icon-svg" size={14} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Status selection */}
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
              <option value="Success">Success Only</option>
              <option value="Failed">Failed Only</option>
            </select>

            {/* Device selection */}
            <select
              value={deviceFilter}
              onChange={e => setDeviceFilter(e.target.value as any)}
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
              <option value="All">All Devices</option>
              <option value="Chrome">Chrome</option>
              <option value="Firefox">Firefox</option>
              <option value="Prisma">Prisma Runner</option>
            </select>
          </div>
        </div>

        {/* Logs list */}
        <div className="db-table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
          <table className="db-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Time</th>
                <th>User profile</th>
                <th>System Action</th>
                <th>IP Address</th>
                <th>Device Context</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr
                  key={log.id}
                  className="row-interactive-saas"
                  onClick={() => setSelectedLog(log)}
                >
                  <td style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap' }}>{log.time}</td>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{log.user}</td>
                  <td style={{ fontSize: '0.82rem', color: '#334155' }}>{log.action}</td>
                  <td style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace' }}>{log.ip}</td>
                  <td style={{ fontSize: '0.78rem', color: '#64748B' }}>{log.device}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: log.status === 'Success' ? '#16A34A' : '#DC2626'
                    }}>{log.status}</span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="No security events match selected filter criteria." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal Popup */}
      {selectedLog && (
        <div className="saas-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="saas-modal-container" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="saas-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconInfo size={18} style={{ color: '#2563EB' }} />
                Security Event Details
              </h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748B' }}>&times;</button>
            </div>
            
            <div className="saas-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Event Timestamp</span>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedLog.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Initiator User</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{selectedLog.user}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>IP Address Location</span>
                <span style={{ color: '#0F172A', fontWeight: 500, fontFamily: 'monospace' }}>{selectedLog.ip}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Client Browser &amp; OS</span>
                <span style={{ color: '#0F172A', fontWeight: 500 }}>{selectedLog.device}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Execution Status</span>
                <span style={{
                  color: selectedLog.status === 'Success' ? '#16A34A' : '#DC2626',
                  fontWeight: 700
                }}>{selectedLog.status}</span>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, marginTop: 4 }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Detailed System Action Description
                </h5>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E293B', lineHeight: 1.4, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 8 }}>
                  {selectedLog.action}
                </p>
              </div>
            </div>

            <div className="saas-modal-footer">
              <button type="button" onClick={() => setSelectedLog(null)} className="btn-primary" style={{ padding: '8px 16px' }}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
