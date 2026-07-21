import React from 'react';

export const PaymentStyles: React.FC = () => (
  <style>{`
    .pay-page { max-width: 960px; }
    .pay-header { display: flex; align-items: center; gap: 14px; margin-bottom: 30px; }
    .pay-header-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--m-primary-light); display:flex; align-items:center; justify-content:center; color:var(--m-primary); }
    .pay-header h2 { margin:0; font-size:1.4rem; font-weight:800; }
    .pay-header p  { margin:4px 0 0; font-size:0.82rem; color:var(--m-text-muted); }

    /* Grid layout for list */
    .pay-box-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media(max-width: 820px){ .pay-box-grid { grid-template-columns: 1fr; } }

    /* Interactive click-boxes (cards) */
    .pay-method-box {
      background: #FFFFFF;
      border: 1px solid var(--m-border);
      border-radius: 16px;
      padding: 30px 24px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: var(--m-shadow);
      min-height: 250px;
    }
    .pay-method-box:hover {
      transform: translateY(-3px);
      border-color: var(--m-primary);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    .pay-method-logo {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      border: 1px solid var(--m-border);
      transition: transform 0.2s;
      overflow: hidden;
    }
    .pay-method-box:hover .pay-method-logo {
      transform: scale(1.05);
    }
    .pay-method-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--m-text-main);
      margin: 0 0 8px 0;
    }
    .pay-method-desc {
      font-size: 0.82rem;
      color: var(--m-text-muted);
      margin: 0 0 20px 0;
      line-height: 1.5;
      max-width: 280px;
    }

    .pay-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: .02em;
      text-transform: uppercase;
      border: 1px solid transparent;
    }
    .pay-badge.active { background: #DEF7EC; color: #03543F; border-color: #BCF0DA; }
    .pay-badge.inactive { background: #F3F4F6; color: #4B5563; border-color: #E5E7EB; }
    .pay-badge.locked { background: #FEF3C7; color: #92400E; border-color: #FDE68A; }

    .pay-action-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--m-primary);
      margin-top: auto;
      transition: color 0.15s;
    }
    .pay-method-box:hover .pay-action-link {
      color: var(--m-primary-hover);
    }

    /* Subpage layouts */
    .pay-sub-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 25px; }
    @media(max-width: 820px){ .pay-sub-grid { grid-template-columns: 1fr; } }

    .pay-field { margin-bottom:16px; }
    .pay-field label { display:flex; align-items:center; gap: 6px; font-size:0.78rem; font-weight:700; color:var(--m-text-muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; }
    .pay-field .inp-wrap { position:relative; }
    .pay-field input {
      width:100%; padding:11px 38px 11px 12px; box-sizing:border-box;
      border:1.5px solid var(--m-border); border-radius:8px;
      background:#FFFFFF; color:var(--m-text-main);
      font-size:0.88rem; transition:border-color .15s, box-shadow .15s;
    }
    .pay-field input:focus { outline:none; border-color:var(--m-primary); box-shadow: 0 0 0 3px var(--m-primary-light); }
    .pay-eye-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--m-text-muted); padding:2px; display:flex; }

    .pay-save-btn {
      width:100%; padding:12px; border:none; border-radius:9px; cursor:pointer;
      font-size:0.9rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;
      background: var(--m-primary); color:#fff;
      transition:opacity .15s, transform .1s;
    }
    .pay-save-btn:hover:not(:disabled) { opacity:.92; }
    .pay-save-btn:disabled { opacity:.55; cursor:not-allowed; }

    .pay-toggle-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:12px 20px; border-radius:8px; font-size:0.88rem; font-weight:700;
      border:none; cursor:pointer; transition:all .15s;
      width: 100%; justify-content: center;
    }
    .pay-toggle-btn.on  { background:var(--m-primary); color:#FFFFFF; }
    .pay-toggle-btn.on:hover  { background:var(--m-primary-hover); }
    .pay-toggle-btn.off { background:#FEE2E2; color:#DC2626; border: 1px solid #FCA5A5; }
    .pay-toggle-btn.off:hover { background:#FECACA; }
    .pay-toggle-btn.locked { background:#F3F4F6; color:#9CA3AF; border: 1px solid #E5E7EB; cursor:not-allowed; }

    .pay-info-card {
      background: var(--m-primary-light);
      border: 1px solid rgba(16, 185, 129, 0.2); border-radius:14px; padding:22px;
      height: fit-content;
    }
    .pay-info-card h4 { margin:0 0 14px; font-size:0.95rem; font-weight:750; display:flex; align-items:center; gap:8px; color: var(--m-primary); }
    .pay-info-card ul { margin:0; padding-left:18px; }
    .pay-info-card li { font-size:0.84rem; color:var(--m-text-muted); margin-bottom:8px; line-height:1.5; }
    .pay-info-card li strong { color:var(--m-text-main); }

    .pay-success-flash {
      display:flex; align-items:center; gap:8px; padding:10px 14px;
      background:#DCFCE7; border:1px solid #86EFAC; border-radius:8px; color:#15803D;
      font-size:0.82rem; font-weight:600; margin-bottom:16px;
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);
