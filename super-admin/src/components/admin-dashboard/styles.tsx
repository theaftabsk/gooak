import React from 'react';

export const AdminStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #0F172A; }

    /* ── Shell Layout ── */
    .shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
      background: #F8FAFC;
      font-family: 'Inter', sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      background: #FFFFFF;
      border-right: 1px solid #E2E8F0;
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      gap: 4px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 12px 20px;
      border-bottom: 1px solid #F1F5F9;
      margin-bottom: 12px;
    }
    .sidebar-brand strong { display: block; color: #0F172A; font-size: 0.95rem; font-weight: 700; }
    .sidebar-brand span { color: #64748B; font-size: 0.75rem; font-weight: 500; }
    .brand-icon { color: #6366F1; display: flex; align-items: center; }
    .brand-icon.super { color: #F59E0B; }
    .brand-icon svg { width: 24px; height: 24px; }

    .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      color: #475569; font-size: 0.875rem; font-weight: 500;
      cursor: pointer; border: none; background: transparent;
      text-align: left; width: 100%; transition: all 0.15s;
    }
    .nav-item svg { flex-shrink: 0; }
    .nav-item:hover { background: #F1F5F9; color: #0F172A; }
    .nav-item.active { background: #EEF2FF; color: #4F46E5; font-weight: 600; }
    .nav-item.logout { margin-top: auto; color: #EF4444; }
    .nav-item.logout:hover { background: #FEF2F2; color: #B91C1C; }
    .nav-badge {
      margin-left: auto; background: #334155; color: #94A3B8;
      font-size: 0.7rem; padding: 2px 7px; border-radius: 99px; font-weight: 600;
    }
    .nav-badge.warn { background: #92400E; color: #FDE68A; }

    /* ── Main ── */
    .main {
      padding: 32px 36px;
      display: flex; flex-direction: column; gap: 24px;
      min-height: 100vh; overflow-y: auto;
    }

    /* ── Page Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      padding-bottom: 20px; border-bottom: 1px solid #E2E8F0;
    }
    .page-header h2 { font-size: 1.5rem; font-weight: 700; color: #0F172A; }
    .header-sub { color: #64748B; font-size: 0.85rem; margin-top: 4px; }

    /* ── Cards ── */
    .card {
      background: #FFF; border: 1px solid #E2E8F0;
      border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .card-title {
      font-size: 1rem; font-weight: 700; color: #0F172A;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px solid #F1F5F9;
    }
    .credentials-card { border-left: 4px solid #6366F1; }

    /* ── Stats ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .stat-card {
      background: #FFF; border: 1px solid #E2E8F0; border-radius: 12px;
      padding: 20px; text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .stat-card.clickable { cursor: pointer; }
    .stat-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .stat-card.warn { border-color: #FCD34D; background: #FFFBEB; }
    .stat-icon { display: flex; justify-content: center; margin-bottom: 10px; color: #6366F1; }
    .stat-icon svg { width: 20px; height: 20px; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: #0F172A; }
    .stat-label { font-size: 0.8rem; color: #64748B; margin-top: 4px; font-weight: 500; }

    /* ── Section Grid (2-col) ── */
    .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* ── Store Cards Grid ── */
    .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .store-card {
      background: #FFF; border: 1px solid #E2E8F0;
      border-radius: 14px; padding: 20px; cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
      display: flex; flex-direction: column; gap: 12px;
    }
    .store-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: #6366F1; }
    .store-card-header { display: flex; justify-content: space-between; align-items: center; }
    .store-card-badges { display: flex; gap: 6px; flex-wrap: wrap; }
    .store-card-body h3 { font-size: 1rem; font-weight: 700; }
    .store-card-footer { display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid #F1F5F9; }

    /* ── Avatars ── */
    .store-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; flex-shrink: 0;
    }
    .store-avatar.lg { width: 48px; height: 48px; font-size: 1.25rem; border-radius: 12px; }
    .store-avatar.req { background: linear-gradient(135deg, #F59E0B, #EF4444); }

    /* ── List Rows ── */
    .list-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #F1F5F9;
    }
    .list-row:last-child { border-bottom: none; }
    .list-row-left { display: flex; align-items: center; gap: 12px; }

    /* ── Request Cards ── */
    .request-card {
      background: #FFF; border: 1px solid #E2E8F0; border-radius: 12px;
      padding: 20px; display: flex; align-items: flex-start; gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .request-card.status-pending { border-left: 4px solid #F59E0B; }
    .request-card.status-approved { border-left: 4px solid #10B981; opacity: 0.85; }
    .request-card.status-rejected { border-left: 4px solid #EF4444; opacity: 0.7; }
    .req-main { display: flex; gap: 14px; flex: 1; min-width: 0; }
    .req-info h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 6px; }
    .req-meta { display: flex; flex-wrap: wrap; gap: 10px; }
    .req-meta span { font-size: 0.8rem; color: #475569; display: flex; align-items: center; gap: 4px; }
    .req-meta span svg { width: 12px; height: 12px; flex-shrink: 0; }
    .req-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

    /* ── Detail Grid ── */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    /* ── InfoRow ── */
    .info-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 12px; padding: 8px 0; border-bottom: 1px dashed #F1F5F9; font-size: 0.875rem;
    }
    .info-row:last-of-type { border-bottom: none; }
    .info-label { color: #64748B; font-weight: 500; min-width: 110px; flex-shrink: 0; }
    .info-value-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .info-value { color: #0F172A; word-break: break-all; }
    .info-value.mono { font-family: monospace; font-size: 0.8rem; background: #F8FAFC; padding: 2px 6px; border-radius: 4px; border: 1px solid #E2E8F0; }
    .info-value.highlight { background: #FFFBEB; color: #92400E; font-family: monospace; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .copy-btn {
      background: none; border: 1px solid #E2E8F0; border-radius: 5px;
      padding: 4px 8px; cursor: pointer; color: #6366F1;
      flex-shrink: 0; display: flex; align-items: center; transition: all 0.15s;
    }
    .copy-btn:hover { background: #EEF2FF; border-color: #6366F1; }

    /* ── Hash / Credential ── */
    .hash-block { margin-top: 10px; }
    .hash-label { font-size: 0.75rem; color: #64748B; font-weight: 600; margin-bottom: 6px; }
    .hash-value { font-family: monospace; font-size: 0.72rem; background: #0F172A; color: #10B981; padding: 10px 12px; border-radius: 8px; word-break: break-all; line-height: 1.5; }
    .cred-note { font-size: 0.75rem; color: #94A3B8; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #E2E8F0; line-height: 1.5; }
    .warning-box { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; border-radius: 8px; padding: 14px; font-size: 0.875rem; display: flex; align-items: center; gap: 8px; }

    /* ── Badges ── */
    .badge { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 99px; letter-spacing: 0.3px; }
    .badge-success { background: #D1FAE5; color: #065F46; }
    .badge-warn { background: #FEF3C7; color: #92400E; }
    .badge-danger { background: #FEE2E2; color: #991B1B; }
    .badge-pro { background: #EDE9FE; color: #5B21B6; }
    .badge-default { background: #E2E8F0; color: #334155; }

    /* ── Buttons ── */
    .btn-primary {
      background: #6366F1; color: #FFF; border: none; border-radius: 8px;
      padding: 10px 18px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s, transform 0.1s; display: inline-flex; align-items: center; gap: 7px;
    }
    .btn-primary:hover { background: #4F46E5; }
    .btn-primary:disabled { background: #A5B4FC; cursor: not-allowed; }

    .btn-ghost {
      background: transparent; color: #475569; border: 1px solid #E2E8F0;
      border-radius: 8px; padding: 10px 18px; font-size: 0.875rem; font-weight: 500; cursor: pointer;
      transition: all 0.15s;
    }
    .btn-ghost:hover { background: #F8FAFC; }

    .btn-ghost-sm {
      background: transparent; color: #475569; border: 1px solid #E2E8F0;
      border-radius: 7px; padding: 6px 12px; font-size: 0.8rem; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
      text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
    }
    .btn-ghost-sm svg { width: 13px; height: 13px; }
    .btn-ghost-sm:hover { background: #F1F5F9; border-color: #94A3B8; }

    .btn-sm-green {
      background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;
      border-radius: 7px; padding: 6px 12px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .btn-sm-green svg { width: 13px; height: 13px; }
    .btn-sm-green:hover { background: #10B981; color: #FFF; border-color: #10B981; }
    .btn-sm-green:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-sm-orange {
      background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;
      border-radius: 7px; padding: 6px 12px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .btn-sm-orange svg { width: 13px; height: 13px; }
    .btn-sm-orange:hover { background: #F59E0B; color: #FFF; }

    .btn-danger-sm {
      background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;
      border-radius: 7px; padding: 6px 12px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .btn-danger-sm svg { width: 13px; height: 13px; }
    .btn-danger-sm.icon-only { padding: 6px 10px; }
    .btn-danger-sm:hover { background: #EF4444; color: #FFF; }
    .btn-danger-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-back {
      background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0;
      border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; cursor: pointer;
      transition: all 0.15s; display: flex; align-items: center;
    }
    .btn-back:hover { background: #F1F5F9; }

    /* ── Table ── */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 10px 14px; background: #F8FAFC; font-weight: 600; color: #475569; text-align: left; border-bottom: 1px solid #E2E8F0; }
    .data-table td { padding: 12px 14px; border-bottom: 1px solid #F1F5F9; color: #0F172A; }
    .data-table tr:hover td { background: #FAFBFF; }
    .data-table tr:last-child td { border-bottom: none; }
    code { font-family: monospace; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }

    /* ── Forms ── */
    .field-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .field-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .field-group input, .field-group select, .field-group textarea {
      border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 9px 12px;
      font-size: 0.875rem; font-family: inherit; outline: none; width: 100%;
      background: #FAFAFA; transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field-group input:focus, .field-group select:focus, .field-group textarea:focus {
      border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); background: #FFF;
    }
    .field-row { display: flex; gap: 16px; }
    .field-hint { font-size: 0.75rem; color: #6366F1; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
    .field-hint svg { width: 12px; height: 12px; }
    .form-grid { display: flex; flex-direction: column; gap: 14px; }

    /* ── Onboard ── */
    .onboard-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
    .onboard-form { display: flex; flex-direction: column; gap: 14px; }
    .onboard-section-title { font-size: 0.72rem; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 0.1em; padding-top: 4px; }
    .plan-cards { display: flex; gap: 14px; }
    .plan-card { flex: 1; border: 2px solid #E2E8F0; border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.15s; }
    .plan-card.selected { border-color: #6366F1; background: #EEF2FF; }
    .plan-card:hover:not(.selected) { border-color: #A5B4FC; }
    .plan-check { color: #6366F1; margin-bottom: 6px; display: flex; height: 16px; align-items: center; }
    .plan-check svg { width: 16px; height: 16px; }
    .plan-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
    .plan-desc { font-size: 0.75rem; color: #64748B; line-height: 1.4; }
    .feature-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .feature-list li { font-size: 0.85rem; color: #374151; display: flex; align-items: center; gap: 8px; }
    .feature-list li svg { width: 14px; height: 14px; }

    /* ── Auth ── */
    .auth-screen {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', sans-serif;
      background: #F8FAFC;
      position: relative;
      overflow: hidden;
    }
    .auth-screen::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%);
      top: -15%;
      left: -10%;
      z-index: 1;
      filter: blur(50px);
      pointer-events: none;
    }
    .auth-screen::after {
      content: '';
      position: absolute;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0) 70%);
      bottom: -20%;
      right: -10%;
      z-index: 1;
      filter: blur(60px);
      pointer-events: none;
    }
    .auth-card {
      background: rgba(255, 255, 255, 0.75); /* Frosted glass light card */
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 24px;
      padding: 48px 40px; 
      width: 100%; 
      max-width: 440px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.04), 
                  0 1px 3px rgba(15, 23, 42, 0.02),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6);
      position: relative;
      z-index: 10;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .auth-card:hover {
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 0 30px 60px rgba(99, 102, 241, 0.08), 
                  0 0 30px rgba(99, 102, 241, 0.05);
    }
    .auth-brand { text-align: center; margin-bottom: 32px; }
    .auth-logo { 
      display: inline-flex; 
      justify-content: center; 
      align-items: center;
      margin-bottom: 18px; 
      color: #6366F1; 
      background: rgba(99, 102, 241, 0.06);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 16px;
      width: 70px;
      height: 70px;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.06);
      transition: transform 0.3s ease;
    }
    .auth-logo:hover {
      transform: scale(1.05) rotate(5deg);
    }
    .auth-logo svg { width: 38px; height: 38px; }
    .auth-brand h2 { 
      font-size: 1.6rem; 
      font-weight: 800; 
      color: #0F172A; 
      letter-spacing: -0.02em;
    }
    .auth-brand p { 
      color: #64748B; 
      font-size: 0.875rem; 
      margin-top: 8px; 
      font-weight: 500;
    }
    .auth-form { display: flex; flex-direction: column; gap: 20px; }
    .auth-form .field-group label {
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .auth-form .field-group input {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      color: #0F172A;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.95rem;
      transition: all 0.25s ease;
      width: 100%;
    }
    .auth-form .field-group input:focus {
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      background: #FFFFFF;
    }
    .auth-form .field-group input::placeholder {
      color: #94A3B8;
    }
    .auth-form button.btn-primary {
      background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
      color: #FFF;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
      transition: all 0.2s ease;
      width: 100%;
      justify-content: center;
    }
    .auth-form button.btn-primary:hover {
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(99, 102, 241, 0.25);
    }
    .auth-form button.btn-primary:active {
      transform: translateY(1px);
    }
    .auth-form button.btn-primary:disabled {
      background: rgba(99, 102, 241, 0.4);
      color: rgba(255, 255, 255, 0.5);
      box-shadow: none;
      cursor: not-allowed;
    }
    .auth-error { 
      color: #B91C1C; 
      font-size: 0.82rem; 
      text-align: center; 
      padding: 10px 14px; 
      background: #FEF2F2; 
      border: 1px solid #FEE2E2;
      border-radius: 8px; 
    }


    /* ── Modals ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15,23,42,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-box {
      background: #FFF; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      width: 100%; max-width: 540px; overflow: hidden;
      animation: modalIn 0.2s ease;
    }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .modal-header {
      display: flex; align-items: flex-start; gap: 14px; padding: 24px;
      border-bottom: 1px solid #F1F5F9;
      background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
    }
    .modal-icon-svg { color: #10B981; display: flex; align-items: center; flex-shrink: 0; padding-top: 2px; }
    .modal-icon-svg svg { width: 22px; height: 22px; }
    .modal-header h3 { font-size: 1.1rem; font-weight: 700; color: #0F172A; }
    .modal-header p { font-size: 0.8rem; color: #64748B; margin-top: 3px; }
    .modal-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: #94A3B8; padding: 4px; border-radius: 4px; display: flex; align-items: center;
    }
    .modal-close:hover { color: #475569; background: #F1F5F9; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; gap: 10px; }

    /* ── Credential Rows ── */
    .cred-row {
      display: flex; align-items: center; gap: 12px;
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px;
    }
    .cred-meta { flex: 1; min-width: 0; }
    .cred-label { font-size: 0.75rem; font-weight: 600; color: #64748B; display: block; margin-bottom: 3px; }
    .cred-value { font-size: 0.875rem; font-weight: 600; color: #0F172A; word-break: break-all; font-family: monospace; }
    .cred-copy {
      background: #EEF2FF; color: #6366F1; border: 1px solid #C7D2FE;
      border-radius: 6px; padding: 6px 10px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; flex-shrink: 0; transition: all 0.15s;
      display: flex; align-items: center; gap: 5px;
    }
    .cred-copy svg { width: 13px; height: 13px; }
    .cred-copy:hover { background: #6366F1; color: #FFF; }

    /* ── Toast ── */
    .copy-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #0F172A; color: #FFF; padding: 10px 18px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      animation: toastIn 0.2s ease, toastOut 0.3s 1.5s ease forwards;
      pointer-events: none;
    }
    @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes toastOut { to { opacity: 0; transform: translateY(10px); } }

    /* ── Misc ── */
    .muted { color: #64748B; font-size: 0.8rem; }
    .small { font-size: 0.75rem; }
    .link-primary { color: #6366F1; text-decoration: none; font-size: 0.875rem; }
    .link-primary:hover { text-decoration: underline; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: #94A3B8; }
    .spinner { width: 36px; height: 36px; border: 3px solid #E2E8F0; border-top-color: #6366F1; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 40px; color: #94A3B8; font-size: 0.875rem; }

    @media (max-width: 1024px) { .section-grid, .detail-grid, .onboard-layout { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: relative; height: auto; flex-direction: row; flex-wrap: wrap; padding: 12px; }
      .main { padding: 20px; }
      .stores-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);
