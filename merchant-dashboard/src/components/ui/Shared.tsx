import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Icons } from './Icons';

// ─── Select (shadcn-style, built on Radix) ────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'light' | 'dark';
  style?: React.CSSProperties;
}

const SELECT_STYLES = `
  .oak-select-trigger {
    display: inline-flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 7px 10px; gap: 6px;
    background: var(--db-card-bg, #fff);
    border: 1.5px solid var(--db-border, #E2E8F0);
    border-radius: 8px;
    font-size: 0.83rem; font-weight: 500;
    color: var(--db-text-main, #0F172A);
    cursor: pointer; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .oak-select-trigger:hover { border-color: var(--db-primary, #2563EB); }
  .oak-select-trigger:focus, .oak-select-trigger[data-state="open"] {
    border-color: var(--db-primary, #2563EB);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--db-primary, #2563EB) 15%, transparent);
  }
  .oak-select-trigger.dark {
    background: #374151; border-color: #4B5563;
    color: #F9FAFB;
  }
  .oak-select-trigger.dark:hover { border-color: #6B7280; }
  .oak-select-trigger.dark:focus, .oak-select-trigger.dark[data-state="open"] {
    border-color: #93C5FD; box-shadow: 0 0 0 3px rgba(147,197,253,0.2);
  }
  .oak-select-trigger-value { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .oak-select-chevron { flex-shrink: 0; opacity: 0.5; transition: transform 0.2s; }
  [data-state="open"] .oak-select-chevron { transform: rotate(180deg); opacity: 1; }

  .oak-select-content {
    background: var(--db-card-bg, #fff);
    border: 1.5px solid var(--db-border, #E2E8F0);
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    overflow: hidden;
    z-index: 9999;
    animation: oak-select-in 0.12s ease;
    min-width: var(--radix-select-trigger-width);
  }
  @keyframes oak-select-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .oak-select-viewport { padding: 4px; }
  .oak-select-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; border-radius: 6px;
    font-size: 0.83rem; font-weight: 500;
    color: var(--db-text-main, #0F172A);
    cursor: pointer; outline: none; user-select: none;
    transition: background 0.1s, color 0.1s;
  }
  .oak-select-item[data-highlighted] {
    background: color-mix(in srgb, var(--db-primary, #2563EB) 10%, transparent);
    color: var(--db-primary, #2563EB);
  }
  .oak-select-item[data-state="checked"] {
    color: var(--db-primary, #2563EB); font-weight: 700;
  }
  .oak-select-item-indicator { display: flex; align-items: center; width: 14px; flex-shrink: 0; }
`;

let selectStyleInjected = false;

export const Select: React.FC<SelectProps> = ({ value, onChange, options, placeholder = 'Select…', variant = 'light', style }) => {
  if (!selectStyleInjected && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = SELECT_STYLES;
    document.head.appendChild(el);
    selectStyleInjected = true;
  }

  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger className={`oak-select-trigger${variant === 'dark' ? ' dark' : ''}`} style={style}>
        <RadixSelect.Value placeholder={placeholder} className="oak-select-trigger-value" />
        <RadixSelect.Icon className="oak-select-chevron">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="oak-select-content" position="popper" sideOffset={4}>
          <RadixSelect.Viewport className="oak-select-viewport">
            {options.map(opt => (
              <RadixSelect.Item key={opt.value} value={opt.value} className="oak-select-item">
                <RadixSelect.ItemIndicator className="oak-select-item-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};

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

export const FullScreenSpinner: React.FC = () => (
  <div style={{
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: '#F8FAFC', gap: 14,
  }}>
    <div style={{
      width: 36, height: 36,
      border: '3px solid rgba(16,185,129,0.12)',
      borderTopColor: '#10B981',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>Loading…</span>
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
