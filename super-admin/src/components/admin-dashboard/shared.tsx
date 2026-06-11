import React from 'react';
import { Icons } from './icons';
import { copyText } from './utils';

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge: React.FC<{ type?: 'success' | 'warn' | 'danger' | 'pro' | 'default'; children: React.ReactNode }> = ({ type = 'default', children }) => (
  <span className={`badge badge-${type}`}>{children}</span>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: any; icon?: React.ReactNode; warn?: boolean; small?: boolean; onClick?: () => void }> = ({ label, value, icon, warn, small, onClick }) => (
  <div className={`stat-card ${warn ? 'warn' : ''} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    {icon && <span className="stat-icon">{icon}</span>}
    <div className="stat-value" style={small ? { fontSize: '1rem' } : {}}>{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ─── DataTable ────────────────────────────────────────────────────────────────
export const DataTable: React.FC<{ headers: string[]; rows: React.ReactNode[][] }> = ({ headers, rows }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export const InfoRow: React.FC<{ label: string; value: any; mono?: boolean; copy?: boolean; highlight?: boolean }> = ({ label, value, mono, copy, highlight }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <div className="info-value-wrap">
      <span className={`info-value ${mono ? 'mono' : ''} ${highlight ? 'highlight' : ''}`}>{value}</span>
      {copy && typeof value === 'string' && (
        <button className="copy-btn" onClick={() => copyText(value, `${label} copied!`)} title="Copy to clipboard">
          <Icons.Copy />
        </button>
      )}
    </div>
  </div>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => (
  <div className="loading-state">
    <div className="spinner" />
    <p>{message}</p>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="empty-state">{message}</div>
);
