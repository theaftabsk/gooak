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

    /* Shell Layout */
    .dashboard-shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      min-height: 100vh;
      transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dashboard-shell.sidebar-collapsed {
      grid-template-columns: 78px 1fr;
    }

    @media (max-width: 768px) {
      .dashboard-shell {
        grid-template-columns: 1fr !important;
      }
      .sidebar {
        display: none !important;
      }
    }

    /* Sidebar */
    .sidebar {
      background: var(--m-sidebar-bg);
      border-right: 1px solid var(--m-border);
      height: 100vh;
      box-sizing: border-box;
      position: sticky;
      top: 0;
      width: 100%;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
      padding: 20px 14px;
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
      transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-content::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }

    .sidebar.collapsed .sidebar-content {
      padding: 20px 10px;
    }

    .sidebar-toggle-btn {
      position: absolute;
      right: -12px;
      top: 24px;
      width: 24px;
      height: 24px;
      background: var(--m-sidebar-bg);
      border: 1px solid var(--m-border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      color: var(--m-text-muted);
      transition: all 0.2s ease;
      z-index: 100;
    }

    .sidebar-toggle-btn:hover {
      color: var(--m-primary);
      border-color: var(--m-primary);
      transform: scale(1.1);
    }

    .sidebar-brand {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--m-border);
      transition: all 0.3s ease;
    }

    .sidebar.collapsed .sidebar-brand {
      align-items: center;
    }

    .sidebar-brand-top {
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
      width: 100%;
    }

    .sidebar.collapsed .sidebar-brand-top {
      justify-content: center;
    }

    .sidebar-logo {
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--m-primary), #4F46E5);
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      flex-shrink: 0;
    }

    .sidebar-brand-meta {
      transition: opacity 0.2s ease;
      opacity: 1;
      overflow: hidden;
      white-space: nowrap;
    }

    .sidebar.collapsed .sidebar-brand-meta {
      opacity: 0;
      width: 0;
      display: none;
    }

    .sidebar-brand-meta h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--m-text-main);
      margin: 0;
      letter-spacing: -0.2px;
      line-height: 1.25;
    }

    .sidebar-brand-sub {
      font-size: 0.72rem;
      color: var(--m-text-muted);
      font-weight: 500;
    }

    .sidebar-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      font-weight: 600;
      color: #10B981;
      margin-top: 3px;
    }

    .sidebar-status-dot {
      width: 6px;
      height: 6px;
      background: #10B981;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 8px #10B981;
      animation: sidebarPulse 2s infinite;
    }

    @keyframes sidebarPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .sidebar-view-store {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--m-primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
    }
    .sidebar-view-store:hover {
      color: #4F46E5;
    }

    .sidebar-active-store-container {
      width: 100%;
      margin-top: 4px;
      transition: all 0.2s ease;
      opacity: 1;
    }

    .sidebar.collapsed .sidebar-active-store-container {
      opacity: 0;
      display: none;
    }

    .sidebar-active-store-label {
      font-size: 0.68rem;
      color: #94A3B8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 4px;
    }

    .sidebar-active-store-box {
      background: #1E293B;
      border: 1px solid #334155;
      color: #38BDF8;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Sidebar Navigation Grouping */
    .sidebar-group-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--m-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 12px 0 6px 12px;
      display: block;
      transition: all 0.2s ease;
    }

    .sidebar.collapsed .sidebar-group-title {
      margin: 10px 0 5px 0;
      text-align: center;
      font-size: 0;
      border-top: 1px solid var(--m-border);
      padding-top: 6px;
      height: 0;
      overflow: visible;
    }

     .sidebar-nav {
       display: flex;
       flex-direction: column;
       gap: 3px;
       flex: 1;
     }
 
     /* Sidebar Collapsible Groups */
     .sidebar-group {
       display: flex;
       flex-direction: column;
       gap: 2px;
     }
 
     .sidebar-group-header {
       display: flex;
       align-items: center;
       gap: 10px;
       padding: 9px 12px;
       border-radius: 8px;
       cursor: pointer;
       color: var(--m-text-muted);
       font-weight: 600;
       font-size: 0.84rem;
       transition: all 0.2s ease-in-out;
       position: relative;
       white-space: nowrap;
       user-select: none;
     }
 
     .sidebar-group-header:hover {
       background: rgba(0, 0, 0, 0.02);
       color: var(--m-text-main);
     }
 
     .sidebar-group-header.parent-active {
       color: var(--m-text-main);
       background: rgba(0, 0, 0, 0.015);
     }
 
     .sidebar-group-chevron {
       margin-left: auto;
       display: flex;
       align-items: center;
       transition: transform 0.2s ease;
       color: var(--m-text-muted);
     }
 
     .sidebar.collapsed .sidebar-group-chevron {
       display: none;
     }
 
     .sidebar-group-children {
       display: flex;
       flex-direction: column;
       gap: 2px;
       margin-top: 1px;
     }
 
     .sidebar-group-children > span {
       display: flex;
       align-items: center;
       gap: 8px;
       padding: 7px 12px 7px 20px;
       border-radius: 6px;
       cursor: pointer;
       color: var(--m-text-muted);
       font-weight: 500;
       font-size: 0.8rem;
       transition: all 0.15s ease-in-out;
       position: relative;
       white-space: nowrap;
     }
 
     .sidebar-group-children > span:hover {
       background: rgba(0, 0, 0, 0.015);
       color: var(--m-text-main);
       padding-left: 22px;
     }
 
     .sidebar-group-children > span.active {
       background: rgba(99, 102, 241, 0.04);
       color: var(--m-primary);
       font-weight: 600;
       padding-left: 22px;
     }
 
     .sidebar-tree-indent {
       font-family: monospace;
       color: #94A3B8;
       font-weight: normal;
       margin-right: 4px;
       user-select: none;
       display: inline-block;
     }
 
     .sidebar.collapsed .sidebar-group-children {
       display: none;
     }
 
     .sidebar-nav > span {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      color: var(--m-text-muted);
      font-weight: 600;
      font-size: 0.84rem;
      transition: all 0.2s ease-in-out;
      position: relative;
      white-space: nowrap;
    }

    .sidebar-nav > span:hover {
      background: rgba(0, 0, 0, 0.02);
      color: var(--m-text-main);
      padding-left: 16px;
    }

    .sidebar-nav > span.active {
      background: rgba(99, 102, 241, 0.06);
      color: var(--m-primary);
      padding-left: 16px;
    }

    .sidebar-nav > span.active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: var(--m-primary);
      border-radius: 0 4px 4px 0;
    }

    .sidebar.collapsed .sidebar-nav > span {
      justify-content: center;
      padding: 9px;
    }

    .sidebar.collapsed .sidebar-nav > span:hover,
    .sidebar.collapsed .sidebar-nav > span.active {
      padding-left: 9px;
    }

    .sidebar.collapsed .sidebar-nav > span.active::before {
      left: 0;
      height: 60%;
      top: 20%;
    }

    .sidebar-nav-item-text {
      transition: opacity 0.2s ease;
      opacity: 1;
    }

    .sidebar.collapsed .sidebar-nav-item-text {
      opacity: 0;
      display: none;
    }

    .sidebar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--m-warn);
      color: #000000;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 12px;
      margin-left: auto;
      animation: badgePulse 2.5s infinite;
      transition: all 0.2s ease;
    }

    .sidebar.collapsed .sidebar-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--m-danger);
      font-size: 0;
      padding: 0;
      margin: 0;
      border: 1.5px solid var(--m-sidebar-bg);
      animation: badgePulse 2.5s infinite;
    }

    @keyframes badgePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .sidebar-footer {
      border-top: 1px solid var(--m-border);
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.3s ease;
    }

    .sidebar.collapsed .sidebar-footer {
      align-items: center;
    }

    .sidebar-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 8px;
      transition: all 0.3s ease;
    }

    .sidebar.collapsed .sidebar-profile {
      padding-left: 0;
      justify-content: center;
    }

    .sidebar-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E293B, #0F172A);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38BDF8;
      font-weight: 700;
      font-size: 0.85rem;
      border: 1.5px solid var(--m-border);
      flex-shrink: 0;
    }

    .sidebar-profile-info {
      line-height: 1.25;
      transition: opacity 0.2s ease;
      opacity: 1;
      overflow: hidden;
      white-space: nowrap;
    }

    .sidebar.collapsed .sidebar-profile-info {
      opacity: 0;
      display: none;
    }

    .sidebar-profile-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--m-text-main);
      display: block;
    }

    .sidebar-profile-role {
      font-size: 0.68rem;
      color: var(--m-text-muted);
      display: block;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px;
      border-radius: 8px;
      cursor: pointer;
      color: #EF4444;
      font-weight: 700;
      font-size: 0.82rem;
      background: rgba(239, 68, 68, 0.04);
      border: 1px solid rgba(239, 68, 68, 0.08);
      transition: all 0.15s;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.15);
      color: #DC2626;
    }

    .sidebar.collapsed .logout-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 8px;
    }

    .sidebar.collapsed .logout-btn span {
      display: none;
    }

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
