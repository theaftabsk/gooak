import React from 'react';

export const MerchantStyles: React.FC = () => (
  <style>{`
    :root {
      --m-bg: #F8FAFC;
      --m-sidebar-bg: #FFFFFF;
      --m-card-bg: #FFFFFF;
      --m-border: #E2E8F0;
      --m-text-main: #0F172A;
      --m-text-muted: #64748B;
      --m-primary: #10B981;
      --m-primary-hover: #059669;
      --m-primary-light: rgba(16, 185, 129, 0.08);
      --m-danger: #EF4444;
      --m-danger-hover: #DC2626;
      --m-warn: #D97706;
      --m-indigo: #4F46E5;
      --m-radius: 8px;
      --m-radius-lg: 12px;
      --m-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
      --m-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .merchant-app {
      min-height: 100vh;
      background: var(--m-bg);
      color: var(--m-text-main);
      font-family: 'Outfit', 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Auth Screen */
    .auth-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%);
      padding: 20px;
    }

    .auth-card {
      background: #FFFFFF;
      border: 1px solid var(--m-border);
      border-radius: var(--m-radius-lg);
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--m-shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .auth-brand {
      text-align: center;
    }

    .auth-logo {
      color: var(--m-primary);
      margin-bottom: 12px;
      display: inline-flex;
      padding: 12px;
      background: var(--m-primary-light);
      border-radius: 50%;
    }

    .auth-brand h2 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .auth-brand p {
      font-size: 0.85rem;
      color: var(--m-text-muted);
      margin-top: 4px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .auth-error {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #EF4444;
      padding: 10px 14px;
      border-radius: var(--m-radius);
      font-size: 0.85rem;
      text-align: center;
    }

    /* ── Shell Layout ─────────────────────────────────── */
    .dashboard-shell {
      display: grid;
      grid-template-columns: 236px 1fr;
      min-height: 100vh;
      transition: grid-template-columns 0.25s ease;
    }
    .dashboard-shell.sidebar-collapsed {
      grid-template-columns: 60px 1fr;
    }
    @media (max-width: 768px) {
      .dashboard-shell { grid-template-columns: 1fr !important; }
      .sidebar { display: none !important; }
    }

    /* ── Sidebar shell ────────────────────────────────── */
    .sidebar {
      background: #fff;
      border-right: 1px solid #EAECF0;
      height: 100vh;
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      overflow: visible;
      min-width: 0;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: none;
    }
    .sidebar-content::-webkit-scrollbar { display: none; }

    /* ── Toggle button ────────────────────────────────── */
    .sidebar-toggle-btn {
      position: absolute;
      right: -11px;
      top: 22px;
      width: 22px;
      height: 22px;
      background: #fff;
      border: 1px solid #EAECF0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      color: #9CA3AF;
      transition: color 0.15s, border-color 0.15s;
      z-index: 100;
    }
    .sidebar-toggle-btn:hover {
      color: var(--m-primary);
      border-color: var(--m-primary);
    }

    /* ── Brand area ───────────────────────────────────── */
    .sidebar-brand {
      padding: 16px 12px 14px;
      border-bottom: 1px solid #EAECF0;
      flex-shrink: 0;
    }
    .sidebar-brand-top {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .sidebar.collapsed .sidebar-brand { padding: 14px 4px; }
    .sidebar.collapsed .sidebar-brand-top { justify-content: center; }

    .sidebar-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10B981, #059669);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .sidebar-brand-meta {
      min-width: 0;
      overflow: hidden;
    }
    .sidebar.collapsed .sidebar-brand-meta { display: none; }

    .sidebar-brand-meta h3 {
      font-size: 0.88rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-brand-sub {
      font-size: 0.7rem;
      color: #94A3B8;
      font-weight: 500;
    }

    /* ── Nav ──────────────────────────────────────────── */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: 10px 8px;
      flex: 1;
    }
    .sidebar.collapsed .sidebar-nav { padding: 10px 4px; }

    /* top-level links and group headers share the same pill style */
    .sidebar-nav > a,
    .sidebar-group-header {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 7px 10px;
      border-radius: 7px;
      font-size: 0.82rem;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      transition: background 0.12s, color 0.12s;
      position: relative;
      flex-shrink: 0;
    }

    .sidebar-nav > a:hover,
    .sidebar-group-header:hover {
      background: #F3F4F6;
      color: #111827;
    }

    .sidebar-nav > a.active {
      background: #F0FDF9;
      color: var(--m-primary);
      font-weight: 600;
    }
    .sidebar-nav > a.active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 18%;
      height: 64%;
      width: 3px;
      background: var(--m-primary);
      border-radius: 0 3px 3px 0;
    }

    .sidebar-group-header.parent-active { color: #111827; }

    /* chevron */
    .sidebar-group-chevron {
      margin-left: auto;
      color: #9CA3AF;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .sidebar.collapsed .sidebar-group-chevron { display: none; }

    /* ── Collapsed nav items ──────────────────────────── */
    .sidebar.collapsed .sidebar-nav > a,
    .sidebar.collapsed .sidebar-group-header {
      justify-content: center;
      padding: 8px;
      gap: 0;
    }
    .sidebar.collapsed .sidebar-nav > a.active::before {
      left: 0;
      top: 18%;
      height: 64%;
    }

    /* ── Group children ───────────────────────────────── */
    .sidebar-group {
      display: flex;
      flex-direction: column;
    }
    .sidebar-group-children {
      display: flex;
      flex-direction: column;
      gap: 1px;
      margin: 2px 0 4px 17px;
      padding-left: 10px;
      border-left: 1.5px solid #E5E7EB;
    }
    .sidebar-group-children > a {
      display: flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 0.79rem;
      font-weight: 500;
      color: #6B7280;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .sidebar-group-children > a:hover {
      background: #F3F4F6;
      color: #111827;
    }
    .sidebar-group-children > a.active {
      color: var(--m-primary);
      font-weight: 600;
      background: #F0FDF9;
    }
    .sidebar.collapsed .sidebar-group-children { display: none; }

    /* hide text when collapsed */
    .sidebar-nav-item-text { white-space: nowrap; }
    .sidebar.collapsed .sidebar-nav-item-text { display: none; }

    /* ── Footer ───────────────────────────────────────── */
    .sidebar-footer {
      border-top: 1px solid #EAECF0;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }
    .sidebar.collapsed .sidebar-footer { align-items: center; }

    .sidebar-profile {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 6px 8px;
      border-radius: 8px;
    }
    .sidebar.collapsed .sidebar-profile { justify-content: center; padding: 6px; }

    .sidebar-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0F172A, #1E293B);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38BDF8;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .sidebar-profile-info {
      min-width: 0;
      overflow: hidden;
    }
    .sidebar.collapsed .sidebar-profile-info { display: none; }

    .sidebar-profile-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #0F172A;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-profile-role {
      font-size: 0.67rem;
      color: #94A3B8;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 7px 10px;
      border-radius: 7px;
      cursor: pointer;
      color: #EF4444;
      font-weight: 600;
      font-size: 0.79rem;
      background: transparent;
      border: none;
      transition: background 0.12s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.06); }
    .sidebar.collapsed .logout-btn { padding: 8px; }
    .sidebar.collapsed .logout-btn span { display: none; }

    /* Main Content */
    .main-content {
      padding: 40px;
      overflow-y: auto;
      height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .page-header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header-sub {
      font-size: 0.9rem;
      color: var(--m-text-muted);
      margin-top: 4px;
    }

    /* Buttons */
    .btn-primary {
      background: var(--m-primary);
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: var(--m-radius);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }

    .btn-primary:hover {
      background: var(--m-primary-hover);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-ghost-sm {
      background: transparent;
      border: 1px solid var(--m-border);
      color: var(--m-text-main);
      padding: 6px 12px;
      border-radius: var(--m-radius);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s, border-color 0.15s;
    }

    .btn-ghost-sm:hover {
      background: rgba(0, 0, 0, 0.03);
      border-color: var(--m-text-muted);
    }

    .btn-danger-sm {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: #EF4444;
      padding: 6px 12px;
      border-radius: var(--m-radius);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .btn-danger-sm:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .btn-danger-sm:disabled {
      opacity: 0.5;
    }

    /* Cards */
    .card {
      background: var(--m-card-bg);
      border: 1px solid var(--m-border);
      border-radius: var(--m-radius-lg);
      padding: 24px;
      box-shadow: var(--m-shadow);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--m-text-main);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .chart-bar:hover {
      filter: brightness(1.08);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
    }

    .metric-card {
      background: var(--m-card-bg);
      border: 1px solid var(--m-border);
      border-radius: var(--m-radius-lg);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--m-shadow);
      transition: transform 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-info span {
      font-size: 0.85rem;
      color: var(--m-text-muted);
      font-weight: 500;
    }

    .metric-info h3 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-top: 6px;
    }

    .metric-icon {
      color: var(--m-primary);
      background: var(--m-primary-light);
      display: flex;
      padding: 12px;
      border-radius: 12px;
    }

    .metric-icon.indigo {
      color: var(--m-indigo);
      background: rgba(99, 102, 241, 0.1);
    }

    .metric-icon.warn {
      color: var(--m-warn);
      background: rgba(245, 158, 11, 0.1);
    }

    /* Table Styles */
    .db-table-container {
      overflow-x: auto;
      margin-top: 10px;
    }

    .db-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .db-table th, .db-table td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--m-border);
    }

    .db-table th {
      font-weight: 600;
      background: #F1F5F9;
      color: var(--m-text-main);
    }

    .db-table tr:hover {
      background: rgba(0, 0, 0, 0.01);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 100px;
    }

    .badge-success {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }

    .badge-warn {
      background: rgba(245, 158, 11, 0.1);
      color: #D97706;
    }

    .badge-info {
      background: rgba(99, 102, 241, 0.1);
      color: #4F46E5;
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    /* Forms */
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--m-text-muted);
    }

    .field-group input,
    .field-group textarea,
    .field-group select {
      background: #FFFFFF;
      border: 1px solid var(--m-border);
      border-radius: var(--m-radius);
      padding: 10px 14px;
      font-family: inherit;
      color: var(--m-text-main);
      outline: none;
      font-size: 0.95rem;
      transition: border-color 0.15s;
    }

    .field-group input:focus,
    .field-group textarea:focus,
    .field-group select:focus {
      border-color: var(--m-primary);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--m-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    /* Utility components */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--m-text-muted);
    }

    .empty-state p {
      font-size: 0.9rem;
      margin-top: 8px;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      color: var(--m-text-muted);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(16, 185, 129, 0.1);
      border-radius: 50%;
      border-top-color: var(--m-primary);
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Drawer / Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-box {
      background: var(--m-card-bg);
      border: 1px solid var(--m-border);
      border-radius: var(--m-radius-lg);
      width: 100%;
      max-width: 540px;
      box-shadow: var(--m-shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--m-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--m-text-muted);
      cursor: pointer;
      font-size: 1.15rem;
    }

    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--m-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Info Row */
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--m-border);
    }

    .info-label {
      font-size: 0.85rem;
      color: var(--m-text-muted);
      font-weight: 500;
    }

    .info-value {
      font-size: 0.9rem;
      font-weight: 600;
      text-align: right;
    }

    /* Links */
    .link-primary {
      color: var(--m-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .link-primary:hover {
      text-decoration: underline;
    }
  `}</style>
);
