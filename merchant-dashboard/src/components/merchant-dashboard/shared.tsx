import React from 'react';
import { Icons } from './icons';

interface BadgeProps {
  children: React.ReactNode;
  type?: 'success' | 'warn' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, type = 'default' }) => {
  const map = {
    success: 'badge-success',
    warn: 'badge-warn',
    danger: 'badge-danger',
    info: 'badge-info',
    default: 'badge-info',
  };
  return <span className={`badge ${map[type]}`}>{children}</span>;
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  type?: 'primary' | 'indigo' | 'warn';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, type = 'primary', onClick }) => {
  return (
    <div className="metric-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="metric-info">
        <span>{label}</span>
        <h3>{value}</h3>
      </div>
      <div className={`metric-icon ${type === 'indigo' ? 'indigo' : type === 'warn' ? 'warn' : ''}`}>
        {icon}
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <span>{message}</span>
  </div>
);

export const EmptyState: React.FC<{ message?: string }> = ({ message = 'No data available.' }) => (
  <div className="empty-state">
    <Icons.Clipboard />
    <p>{message}</p>
  </div>
);

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  copy?: boolean;
  mono?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, copy = false, mono = false }) => {
  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      alert(`${label} copied to clipboard!`);
    }
  };

  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="info-value" style={{
          fontFamily: mono ? 'Consolas, monospace' : 'inherit',
          fontSize: mono ? '0.85rem' : '0.9rem'
        }}>
          {value}
        </span>
        {copy && typeof value === 'string' && (
          <button className="btn-ghost-sm" style={{ padding: '2px 6px' }} onClick={handleCopy}>
            <Icons.Copy />
          </button>
        )}
      </div>
    </div>
  );
};
