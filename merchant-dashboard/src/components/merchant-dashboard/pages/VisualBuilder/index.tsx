'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pageBuilderApi, catalogApi, customerApi } from '../../../../lib/api-client';
import { LivePageData, WidgetLayout, WidgetType } from '@oak-commerce/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VisualBuilderProps {
  shopInfo: any;
  onExit: () => void;
}

const RESERVED_PAGES = [
  { slug: 'index', title: 'Homepage', supportsHero: true, type: 'SYSTEM_HERO' },
  { slug: 'products', title: 'Shop / Product Listing', supportsHero: true, type: 'SYSTEM_HERO' },
  { slug: 'category', title: 'Category Details', supportsHero: true, type: 'SYSTEM_HERO' },
  { slug: 'product', title: 'Product Details', supportsHero: true, type: 'SYSTEM_HERO' },
  { slug: 'cart', title: 'Shopping Cart', supportsHero: false, type: 'SYSTEM' },
  { slug: 'checkout', title: 'Checkout Details', supportsHero: false, type: 'SYSTEM' },
  { slug: 'about', title: 'About Us', supportsHero: true, type: 'POLICY_HERO' },
  { slug: 'contact', title: 'Contact Us', supportsHero: true, type: 'POLICY_HERO' },
  { slug: 'privacy', title: 'Privacy Policy', supportsHero: false, type: 'POLICY' },
  { slug: 'terms', title: 'Terms & Conditions', supportsHero: false, type: 'POLICY' },
  { slug: 'refund', title: 'Refund Policy', supportsHero: false, type: 'POLICY' },
  { slug: 'track-order', title: 'Track Order', supportsHero: false, type: 'SYSTEM' },
];

// ─── Inline CSS ───────────────────────────────────────────────────────────────
const vbStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

  .vb-root {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
    background: #f8fafc; color: #0f172a;
    overflow: hidden;
  }

  /* ── Top Bar ── */
  .vb-topbar {
    height: 56px; min-height: 56px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center;
    padding: 0 20px; gap: 16px;
    flex-shrink: 0;
    z-index: 100;
  }
  .vb-topbar-brand {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem; font-weight: 800; color: #0f172a;
    text-transform: uppercase; letter-spacing: 0.06em;
    flex-shrink: 0;
  }
  .vb-topbar-brand svg { width: 20px; height: 20px; color: #0284c7; }
  .vb-topbar-sep {
    width: 1px; height: 24px; background: #e2e8f0; flex-shrink: 0;
  }
  .vb-topbar-pages {
    display: flex; align-items: center; gap: 10px; flex: 1;
  }
  .vb-page-select {
    background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a;
    border-radius: 8px; padding: 6px 12px; font-size: 0.82rem;
    font-family: inherit; cursor: pointer; min-width: 220px;
    outline: none; transition: all 0.2s;
  }
  .vb-page-select:focus { border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2,132,199,0.15); }
  
  .vb-btn-new {
    background: #ffffff; border: 1px solid #cbd5e1; color: #475569;
    border-radius: 8px; padding: 6px 12px; font-size: 0.78rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s;
  }
  .vb-btn-new:hover { border-color: #0284c7; color: #0284c7; background: #f0f9ff; }
  
  .vb-topbar-actions {
    display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0;
  }
  
  /* Status Badges */
  .vb-status-badge {
    font-size: 0.68rem; font-weight: 700; padding: 4px 10px;
    border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .vb-status-published { 
    background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; 
  }
  .vb-status-published::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%; background: #10b981;
    box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite;
  }
  .vb-status-draft { 
    background: #fef9c3; color: #a16207; border: 1px solid #fef08a; 
  }
  .vb-status-draft::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%; background: #eab308;
    box-shadow: 0 0 8px #eab308; animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.5; }
  }

  .vb-btn-save {
    background: #ffffff; border: 1px solid #cbd5e1; color: #334155;
    border-radius: 8px; padding: 7px 16px; font-size: 0.8rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .vb-btn-save:hover { border-color: #cbd5e1; color: #0f172a; background: #f1f5f9; }
  
  .vb-btn-publish {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none; color: #fff;
    border-radius: 8px; padding: 7px 20px; font-size: 0.8rem;
    font-weight: 700; cursor: pointer; font-family: inherit;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
    transition: all 0.2s;
  }
  .vb-btn-publish:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.4); }
  .vb-btn-publish:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  
  .vb-btn-exit {
    background: #ffffff; border: 1px solid #e2e8f0; color: #64748b;
    border-radius: 8px; padding: 7px 14px; font-size: 0.8rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.2s; display: flex; align-items: center; gap: 6px;
  }
  .vb-btn-exit:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }

  /* ── Workspace ── */
  .vb-workspace {
    display: flex; flex: 1; overflow: hidden; position: relative;
    background: #f1f5f9;
  }

  /* ── Panels Styling ── */
  .vb-left {
    width: 280px; min-width: 280px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 50;
  }
  .vb-left.collapsed {
    width: 0 !important; min-width: 0 !important;
    border-right-color: transparent;
  }
  
  .vb-right {
    width: 320px; min-width: 320px;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 50;
  }
  .vb-right.collapsed {
    width: 0 !important; min-width: 0 !important;
    border-left-color: transparent;
  }

  .vb-left-header, .vb-right-header {
    padding: 14px 20px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .vb-panel-title-wrap { display: flex; flex-direction: column; gap: 2px; }
  .vb-panel-collapse-btn {
    background: none; border: none; color: #64748b; cursor: pointer;
    padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .vb-panel-collapse-btn:hover { background: rgba(0,0,0,0.05); color: #0f172a; }

  .vb-add-btns {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; margin-top: 12px;
  }
  .vb-add-btn {
    background: #f8fafc; border: 1px solid #e2e8f0; color: #475569;
    border-radius: 8px; padding: 8px 4px; font-size: 0.68rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    transition: all 0.2s;
  }
  .vb-add-btn:hover { border-color: #0284c7; color: #0284c7; background: #f0f9ff; }
  .vb-add-btn-icon { font-size: 1.1rem; font-weight: 400; color: #0284c7; }

  .vb-sections-scroll {
    flex: 1; overflow-y: auto; padding: 16px;
  }
  .vb-sections-scroll::-webkit-scrollbar { width: 4px; }
  .vb-sections-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  .vb-section-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px; cursor: pointer;
    border: 1px solid transparent; margin-bottom: 6px;
    transition: all 0.2s; user-select: none;
    background: #f1f5f9;
  }
  .vb-section-item:hover { background: #e2e8f0; border-color: #cbd5e1; }
  .vb-section-item.selected { background: rgba(2,132,199,0.08); border-color: rgba(2,132,199,0.25); }
  .vb-section-item.dragging { box-shadow: 0 10px 30px rgba(0,0,0,0.15); opacity: 0.95; }
  .vb-drag-handle {
    color: #475569; font-size: 14px; cursor: grab; flex-shrink: 0; padding: 2px;
  }
  
  .vb-section-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .icon-hero { background: rgba(99,102,241,0.15); color: #818cf8; }
  .icon-grid { background: rgba(16,185,129,0.15); color: #34d399; }
  .icon-text { background: rgba(245,158,11,0.15); color: #fbbf24; }
  .icon-star { background: rgba(234,179,8,0.15); color: #eab308; }
  .icon-folder { background: rgba(14,116,144,0.15); color: #0e7490; }
  
  .vb-section-info { flex: 1; min-width: 0; }
  .vb-section-name {
    font-size: 0.8rem; font-weight: 600; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vb-section-order {
    font-size: 0.68rem; color: #64748b; font-weight: 500; margin-top: 1px;
  }
  .vb-section-del {
    width: 24px; height: 24px; border-radius: 6px;
    background: transparent; border: none; color: #64748b;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0; transition: all 0.2s;
  }
  .vb-section-del:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

  .vb-empty-sections {
    padding: 32px 16px; text-align: center;
    color: #64748b; font-size: 0.8rem; line-height: 1.6;
    border: 1.5px dashed #e2e8f0; border-radius: 12px; margin: 4px 0;
  }

  .vb-left-footer {
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .vb-storefront-link {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.76rem; color: #475569; text-decoration: none;
    transition: color 0.15s; font-weight: 500;
  }
  .vb-storefront-link:hover { color: #0284c7; }

  /* ── Center Canvas ── */
  .vb-canvas {
    flex: 1; display: flex; flex-direction: column;
    background: #f1f5f9; overflow: hidden; position: relative;
  }
  
  /* Floating Expand Buttons */
  .vb-sidebar-toggle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 48px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 60;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .vb-sidebar-toggle:hover {
    background: #f8fafc;
    color: #0284c7;
    border-color: #cbd5e1;
  }
  .vb-sidebar-toggle.left-toggle {
    left: 0;
    border-radius: 0 8px 8px 0;
    border-left: none;
  }
  .vb-sidebar-toggle.right-toggle {
    right: 0;
    border-radius: 8px 0 0 8px;
    border-right: none;
  }

  /* Canvas Toolbar */
  .vb-canvas-toolbar {
    height: 44px; min-height: 44px; background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px; gap: 16px; flex-shrink: 0;
  }
  .vb-canvas-url-wrap {
    display: flex; align-items: center; gap: 8px; flex: 1; max-width: 400px;
  }
  .vb-canvas-url {
    font-size: 0.74rem; color: #475569; font-family: monospace;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    background: #f1f5f9; padding: 4px 10px; border-radius: 6px;
    border: 1px solid #cbd5e1; width: 100%;
  }
  
  /* Viewport Controls */
  .vb-viewport-controls {
    display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .vb-viewport-btn {
    background: none; border: none; color: #64748b; width: 28px; height: 28px;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .vb-viewport-btn:hover { color: #0f172a; background: #e2e8f0; }
  .vb-viewport-btn.active { color: #0284c7; background: rgba(2,132,199,0.08); }
  
  .vb-canvas-refresh {
    background: none; border: none; color: #64748b; cursor: pointer;
    font-size: 15px; transition: color 0.15s; padding: 4px; display: flex;
    align-items: center; justify-content: center; border-radius: 6px;
  }
  .vb-canvas-refresh:hover { color: #0284c7; background: #f1f5f9; }
  
  /* Preview Device Workspace */
  .vb-iframe-wrap {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 24px; overflow: hidden; background: #f1f5f9;
    position: relative;
  }
  
  .vb-iframe-container {
    width: 100%; height: 100%;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex; flex-direction: column;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
    border-radius: 12px; overflow: hidden;
    border: 1px solid #cbd5e1;
    background: #ffffff;
  }
  
  .vb-iframe-container.mode-desktop {
    max-width: 100%; height: 100%;
  }
  .vb-iframe-container.mode-tablet {
    max-width: 768px; height: 95%;
    border: 12px solid #1e293b; border-radius: 28px;
  }
  .vb-iframe-container.mode-mobile {
    max-width: 375px; height: 85%;
    border: 14px solid #1e293b; border-radius: 36px;
    position: relative;
  }
  .vb-iframe-container.mode-mobile::before {
    content: ''; position: absolute; top: -8px; left: 50%;
    transform: translateX(-50%); width: 80px; height: 4px;
    background: #0f172a; border-radius: 2px; z-index: 100;
  }
  
  .vb-iframe {
    width: 100%; height: 100%; background: #ffffff; border: none;
  }
  
  .vb-no-page {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #64748b; text-align: center; gap: 12px;
  }
  .vb-no-page-icon { font-size: 3.5rem; opacity: 0.5; }
  .vb-no-page h3 { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0; }
  .vb-no-page p { font-size: 0.85rem; color: #64748b; max-width: 340px; margin: 0; line-height: 1.6; }

  /* ── Right Panel Scroll and Forms ── */
  .vb-right-scroll {
    flex: 1; overflow-y: auto; padding: 20px;
  }
  .vb-right-scroll::-webkit-scrollbar { width: 4px; }
  .vb-right-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  .vb-field-section { 
    margin-bottom: 20px; padding-bottom: 20px; 
    border-bottom: 1px solid #e2e8f0; 
  }
  .vb-field-section:last-child { border-bottom: none; }
  .vb-field-group { margin-bottom: 16px; }
  .vb-field-group:last-child { margin-bottom: 0; }
  
  .vb-label {
    display: block; font-size: 0.72rem; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
  }
  
  .vb-input, .vb-select, .vb-textarea {
    width: 100%; background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a;
    border-radius: 8px; padding: 8px 12px; font-size: 0.82rem;
    font-family: inherit; outline: none; box-sizing: border-box;
    transition: all 0.2s;
  }
  .vb-input:focus, .vb-select:focus, .vb-textarea:focus { 
    border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2,132,199,0.15); 
  }
  
  .vb-textarea { resize: vertical; min-height: 90px; line-height: 1.5; }

  /* Circular Color Swatch styling */
  .vb-color-row {
    display: flex; gap: 12px;
  }
  .vb-color-item {
    display: flex; align-items: center; gap: 8px; flex: 1;
    background: #ffffff; padding: 6px 10px; border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .vb-color-input {
    appearance: none; -webkit-appearance: none; border: none;
    width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
    background: none; padding: 0; flex-shrink: 0;
  }
  .vb-color-input::-webkit-color-swatch-wrapper { padding: 0; }
  .vb-color-input::-webkit-color-swatch {
    border: 1px solid #e2e8f0; border-radius: 50%;
  }
  .vb-color-label { font-size: 0.68rem; color: #0f172a; font-weight: 600; }

  .vb-del-widget-btn {
    width: 100%; padding: 10px; background: rgba(239,68,68,0.05);
    border: 1px solid rgba(239,68,68,0.15); color: #f87171;
    border-radius: 8px; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 8px;
  }
  .vb-del-widget-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }

  /* Bottom tab bar for mobile viewports */
  .vb-mobile-tabs {
    display: none; height: 60px; background: #ffffff;
    border-top: 1px solid #e2e8f0;
    grid-template-columns: repeat(3, 1fr); z-index: 100;
  }
  .vb-mobile-tab-btn {
    background: none; border: none; color: #64748b; font-size: 0.72rem;
    font-weight: 600; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .vb-mobile-tab-btn.active { color: #0284c7; }
  .vb-mobile-tab-btn svg { width: 18px; height: 18px; }

  /* ── Modal ── */
  .vb-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; backdrop-filter: blur(4px);
  }
  .vb-modal {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 24px; width: 440px; max-width: 90vw;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  .vb-modal h3 {
    font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 6px;
    font-family: 'Outfit', sans-serif;
  }
  .vb-modal p {
    font-size: 0.82rem; color: #64748b; margin: 0 0 20px; line-height: 1.5;
  }
  .vb-modal-fields { display: flex; flex-direction: column; gap: 14px; }
  .vb-modal-footer { display: flex; gap: 10px; margin-top: 24px; }
  .vb-modal-cancel {
    flex: 1; padding: 10px; background: transparent; border: 1px solid #cbd5e1;
    color: #475569; border-radius: 8px; font-size: 0.82rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .vb-modal-cancel:hover { background: #f1f5f9; }
  .vb-modal-submit {
    flex: 2; padding: 10px; background: linear-gradient(135deg, #10b981, #059669); border: none;
    color: #ffffff; border-radius: 8px; font-size: 0.82rem;
    font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .vb-modal-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
  .vb-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Toast ── */
  .vb-toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 10001;
    background: #10b981; color: #ffffff; padding: 12px 20px;
    border-radius: 8px; font-size: 0.82rem; font-weight: 700;
    box-shadow: 0 10px 25px rgba(16,185,129,0.3);
    animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); 
    display: flex; align-items: center; gap: 8px;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Header/Footer Drawer ── */
  .vb-drawer-backdrop {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(15,23,42,0.5);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  .vb-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: 400px; max-width: 92vw;
    background: #ffffff;
    border-left: 1px solid #e2e8f0;
    z-index: 9999;
    display: flex; flex-direction: column;
    box-shadow: -20px 0 60px rgba(0,0,0,0.15);
    animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity:0; }
    to   { transform: translateX(0); opacity:1; }
  }

  .vb-drawer-header {
    padding: 18px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  }
  .vb-drawer-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1rem; font-weight: 800; color: #0f172a;
    display: flex; align-items: center; gap: 10px;
  }
  .vb-drawer-title-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .vb-drawer-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    color: #64748b; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    font-size: 14px; transition: all 0.15s;
  }
  .vb-drawer-close:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }

  .vb-drawer-body {
    flex: 1; overflow-y: auto; padding: 20px;
  }
  .vb-drawer-body::-webkit-scrollbar { width: 4px; }
  .vb-drawer-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  .vb-drawer-footer {
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    display: flex; gap: 10px;
    flex-shrink: 0; background: #f8fafc;
  }
  .vb-drawer-save {
    flex: 1; padding: 10px; background: linear-gradient(135deg, #10b981, #059669);
    border: none; color: #fff; border-radius: 8px;
    font-size: 0.82rem; font-weight: 700;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .vb-drawer-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
  .vb-drawer-cancel {
    padding: 10px 16px; background: transparent;
    border: 1px solid #cbd5e1; color: #475569; border-radius: 8px;
    font-size: 0.82rem; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.2s;
  }
  .vb-drawer-cancel:hover { background: #f1f5f9; }

  /* Header/Footer edit buttons in topbar */
  .vb-btn-hf {
    background: #ffffff; border: 1px solid #cbd5e1; color: #475569;
    border-radius: 8px; padding: 6px 12px; font-size: 0.78rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s; white-space: nowrap;
  }
  .vb-btn-hf:hover { border-color: #0284c7; color: #0284c7; background: #f0f9ff; }
  .vb-btn-hf.header-btn:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
  .vb-btn-hf.footer-btn:hover { border-color: #ea580c; color: #ea580c; background: #fff7ed; }

  /* Section divider in drawers */
  .vb-drawer-section {
    margin-bottom: 20px; padding-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  .vb-drawer-section:last-child { border-bottom: none; margin-bottom: 0; }
  .vb-drawer-section-title {
    font-size: 0.72rem; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.08em;
    margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
  }

  /* ── Responsive Builder Editor ── */
  @media (max-width: 1024px) {
    .vb-workspace { flex-direction: column; }
    .vb-left, .vb-right {
      position: fixed; top: 56px; bottom: 60px;
      width: 100% !important; min-width: 0 !important; max-width: 100% !important;
      z-index: 90; transform: translateX(-100%);
      background: #ffffff;
    }
    .vb-right { transform: translateX(100%); }
    .vb-left.open, .vb-right.open { transform: translateX(0); }
    .vb-canvas { width: 100%; height: 100%; }
    .vb-mobile-tabs { display: grid !important; }
    .vb-sidebar-toggle { display: none !important; }
    .vb-drawer { width: 100vw; }
  }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconDesktop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconTablet = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
  </svg>
);

const IconMobile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const IconHero = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M20.42 17.58a2.62 2.62 0 0 0-.22-.27l-5.63-5.63a1.58 1.58 0 0 0-2.23 0l-5.63 5.63a2.62 2.62 0 0 0-.22-.27" />
  </svg>
);

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="10" y2="21" />
  </svg>
);

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconGear = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ─── Widget type info ─────────────────────────────────────────────────────────
const WIDGET_META: Record<string, { label: string; icon: React.ReactNode; iconClass: string }> = {
  HERO_BANNER:  { label: 'Hero Banner',   icon: <IconHero />,   iconClass: 'icon-hero' },
  DOUBLE_HERO:  { label: 'Double Hero',   icon: <IconHero />,   iconClass: 'icon-hero' },
  PRODUCT_GRID: { label: 'Product Grid',  icon: <IconGrid />,   iconClass: 'icon-grid' },
  TEXT_BLOCK:   { label: 'Text Block',    icon: <IconText />,   iconClass: 'icon-text' },
  PROMO_GRID:   { label: 'Promo Grid',    icon: <IconGrid />,   iconClass: 'icon-grid' },
  TESTIMONIALS: { label: 'Testimonials', icon: <IconStar />,   iconClass: 'icon-star' },
  BEST_SELLERS: { label: 'Best Sellers', icon: <IconGrid />,   iconClass: 'icon-grid' },
  CATEGORIES_LIST: { label: 'Category List', icon: <IconFolder />, iconClass: 'icon-folder' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const VisualBuilder: React.FC<VisualBuilderProps> = ({ shopInfo, onExit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, _setSelectedPage] = useState<any | null>(null);
  const setSelectedPage = (page: any | null | ((prev: any | null) => any | null)) => {
    if (typeof page === 'function') {
      _setSelectedPage((prev: any | null) => {
        const next = page(prev);
        if (next && !next.widgets) {
          next.widgets = [];
        }
        return next;
      });
    } else {
      if (page && !page.widgets) {
        page.widgets = [];
      }
      _setSelectedPage(page);
    }
  };
  const [policySettings, setPolicySettings] = useState<Record<string, string>>({});
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const [navbarMenu, setNavbarMenu] = useState<any[]>([]);
  const [footerMenu, setFooterMenu] = useState<any[]>([]);
  const [newNavTitle, setNewNavTitle] = useState('');
  const [newNavUrl, setNewNavUrl] = useState('');
  const [newFootTitle, setNewFootTitle] = useState('');
  const [newFootUrl, setNewFootUrl] = useState('');

  // Premium UI layout states
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'preview' | 'structure' | 'settings'>('preview');

  // Header / Footer drawer
  const [showHeaderDrawer, setShowHeaderDrawer] = useState(false);
  const [showFooterDrawer, setShowFooterDrawer] = useState(false);

  // storefront_url is always set by VisualBuilderPage as http://slug.localhost:3001
  const slug = shopInfo?.slug || 'store';
  const storefront = shopInfo?.storefront_url || `http://${slug}.localhost:3001`;

  const getPreviewUrl = () => {
    if (!selectedPage) return '';
    const s = selectedPage.slug;
    if (s === 'index') return `${storefront}?preview=true`;
    
    const reservedSlugs = ['products', 'category', 'product', 'cart', 'checkout', 'about', 'contact', 'privacy', 'terms', 'refund', 'track-order'];
    if (reservedSlugs.includes(s)) {
      let path = s;
      if (s === 'category') path = 'categories';
      return `${storefront}/${path}?preview=true`;
    }
    return `${storefront}/pages/${s}?preview=true`;
  };

  const previewUrl = getPreviewUrl();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Post layout updates to iframe on every change
  useEffect(() => {
    if (!selectedPage || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'LAYOUT_UPDATE', payload: selectedPage },
      '*'
    );
  }, [selectedPage]);

  // Post settings updates to iframe in real-time
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: 'SETTINGS_UPDATE', payload: policySettings },
      '*'
    );
  }, [policySettings]);

  // Listen for widget selection messages from the preview iframe
  useEffect(() => {
    const handleWidgetSelect = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SELECT_WIDGET') {
        const id = event.data.payload?.id;
        if (id) {
          setSelectedWidgetId(id);
          setRightOpen(true);
        }
      }
    };
    window.addEventListener('message', handleWidgetSelect);
    return () => window.removeEventListener('message', handleWidgetSelect);
  }, []);

  const handleIframeLoad = () => {
    if (!iframeRef.current?.contentWindow) return;
    setTimeout(() => {
      if (selectedPage) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'LAYOUT_UPDATE', payload: selectedPage },
          '*'
        );
      }
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'SETTINGS_UPDATE', payload: policySettings },
        '*'
      );
    }, 300);
  };

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dbPages, cats, stdPages, productsRes] = await Promise.all([
          pageBuilderApi.getPages(),
          catalogApi.getCategories(),
          customerApi.getPages().catch(() => ({ content: {} })) as Promise<any>,
          catalogApi.getProducts({ limit: 100 }).catch(() => ({ products: [] })),
        ]);
        
        setCategories(cats || []);
        setAllProducts(productsRes?.products || []);
        if (stdPages?.content) {
          setPolicySettings(stdPages.content);

          try {
            const nav = stdPages.content.navbar_menu 
              ? JSON.parse(stdPages.content.navbar_menu) 
              : [
                  { title: 'Home', url: '/' },
                  { title: 'Products', url: '/products' },
                  { title: 'Categories', url: '/categories' },
                  { title: 'About Us', url: '/about' },
                  { title: 'Contact Us', url: '/contact' }
                ];
            setNavbarMenu(nav);
          } catch(e) {
            setNavbarMenu([]);
          }

          try {
            const foot = stdPages.content.footer_menu 
              ? JSON.parse(stdPages.content.footer_menu) 
              : [
                  { title: 'About Us', url: '/about' },
                  { title: 'Contact Us', url: '/contact' },
                  { title: 'Privacy Policy', url: '/privacy' },
                  { title: 'Terms & Conditions', url: '/terms' },
                  { title: 'Refund Policy', url: '/refund' },
                  { title: 'Track Order', url: '/track-order' }
                ];
            setFooterMenu(foot);
          } catch(e) {
            setFooterMenu([]);
          }
        }

        // Map reserved pages, matching with dbPages by slug
        const mergedReserved = RESERVED_PAGES.map(rp => {
          const matched = dbPages?.find((p: any) => p.slug === rp.slug);
          if (matched) {
            return {
              ...matched,
              supportsHero: rp.supportsHero,
              isReserved: true,
              reservedType: rp.type,
            };
          }
          
          // Create virtual page shell
          const defaultWidgets = rp.supportsHero ? [
            {
              id: `hero-${rp.slug}`,
              type: 'HERO_BANNER',
              sort_order: 0,
              content: rp.slug === 'index' ? {
                title: "Welcome to nature's finest",
                subtitle: "Discover our curated collection of premium organic skincare products designed to restore and rejuvenate your natural glow.",
                backgroundImageUrl: '',
                buttonText: 'Explore Collection',
                buttonLink: '/products',
              } : {
                title: rp.title,
                subtitle: `Welcome to our ${rp.title.toLowerCase()} page.`,
                backgroundImageUrl: '',
                buttonText: '',
                buttonLink: '',
              },
              styles: { paddingTop: '0px', paddingBottom: '0px' }
            }
          ] : [];

          return {
            id: `virtual-${rp.slug}`,
            slug: rp.slug,
            title: rp.title,
            type: 'NORMAL',
            is_published: false,
            theme: {
              primaryColor: '#15803D',
              secondaryColor: '#ffffff',
              backgroundColor: '#ffffff',
            },
            widgets: defaultWidgets,
            supportsHero: rp.supportsHero,
            isReserved: true,
            reservedType: rp.type,
          };
        });

        // Custom builder pages created by the user (non-reserved slugs)
        const customPages = dbPages?.filter((p: any) => !RESERVED_PAGES.some(rp => rp.slug === p.slug)) || [];
        const finalPagesList = [...mergedReserved, ...customPages];
        setPages(finalPagesList);

        if (finalPagesList.length > 0) {
          // Select Homepage ('index') or the first page by default
          const homePage = finalPagesList.find(p => p.slug === 'index') || finalPagesList[0];
          let activePage = homePage;
          if (!homePage.id.startsWith('virtual-')) {
            const details = await pageBuilderApi.getPageById(homePage.id);
            activePage = {
              ...details,
              supportsHero: homePage.supportsHero,
              isReserved: homePage.isReserved,
              reservedType: homePage.reservedType,
            };
          }
          setSelectedPage(activePage);

          if (activePage?.widgets?.length > 0) {
            setSelectedWidgetId(activePage.widgets[0].id);
          }
        }
      } catch (e) {
        console.error('VB load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectPage = async (id: string) => {
    if (!id) return;
    setSelectedWidgetId(null);
    if (id.startsWith('virtual-')) {
      const vPage = pages.find(p => p.id === id);
      if (vPage) {
        setSelectedPage(vPage);
        setIframeKey(k => k + 1);
      }
      return;
    }
    
    try {
      const details = await pageBuilderApi.getPageById(id);
      const originalPage = pages.find(p => p.id === id);
      setSelectedPage({
        ...details,
        supportsHero: originalPage?.supportsHero,
        isReserved: originalPage?.isReserved,
        reservedType: originalPage?.reservedType,
      });
      setIframeKey(k => k + 1);
    } catch (e) { console.error(e); }
  };

  const handlePageChange = (updated: LivePageData) => {
    setSelectedPage(updated);
  };

  const handleLoadTemplate = (templateKey: string) => {
    if (!selectedPage) return;
    if (!window.confirm(`Are you sure you want to load the ${templateKey.toUpperCase()} template? This will replace your current page layout and theme colors.`)) return;

    let theme = { primaryColor: '#15803D', secondaryColor: '#ffffff', backgroundColor: '#FAF7F2' };
    let widgets: any[] = [];

    if (templateKey === 'fashion') {
      theme = { primaryColor: '#1E293B', secondaryColor: '#ffffff', backgroundColor: '#F9F6F0' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'SARTORIAL CHIC',
            subtitle: 'Curated summer menswear and styling, crafted from sustainable organic materials.',
            image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
            buttonText: 'SHOP COLLECTION',
            buttonLink: '/products',
          },
          styles: { paddingY: '100px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'Sustainable Modern Luxury',
            body: 'We design classic essentials for the contemporary closet. Sourced ethically and crafted meticulously to last.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    } else if (templateKey === 'electronics') {
      theme = { primaryColor: '#3B82F6', secondaryColor: '#ffffff', backgroundColor: '#0B0F19' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'NEXT-GEN TECH',
            subtitle: 'Uncompromising performance. Discover the future of personal audio and gadgets.',
            image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
            buttonText: 'EXPLORE INNOVATIONS',
            buttonLink: '/products',
          },
          styles: { paddingY: '120px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'Pure Digital Performance',
            body: 'Engineered for audio purists and tech enthusiasts. Seamless integration, extreme durability, and industry-leading performance.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    } else if (templateKey === 'grocery') {
      theme = { primaryColor: '#10B981', secondaryColor: '#ffffff', backgroundColor: '#F4FBF7' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'FRESH & ORGANIC',
            subtitle: '100% certified farm fresh organic produce delivered straight to your door.',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
            buttonText: 'SHOP FRESH GROCERIES',
            buttonLink: '/products',
          },
          styles: { paddingY: '90px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'Grown with Love, Hand-picked with Care',
            body: 'We partner with local sustainable farmers to ensure you receive the freshest pesticide-free vegetables, fruits, and dairy.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    } else if (templateKey === 'furniture') {
      theme = { primaryColor: '#D97706', secondaryColor: '#ffffff', backgroundColor: '#FCFBF7' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'MINIMALIST COMFORT',
            subtitle: 'Elevate your living space with custom mid-century modern solid wood furniture.',
            image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200',
            buttonText: 'EXPLORE SPACES',
            buttonLink: '/products',
          },
          styles: { paddingY: '110px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'Crafted to Last Generations',
            body: 'Every piece is constructed from sustainably harvested hardwoods. Designed to bring harmony, utility, and comfort to your home.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    } else if (templateKey === 'beauty') {
      theme = { primaryColor: '#BE185D', secondaryColor: '#ffffff', backgroundColor: '#FFF1F2' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'GLOW NATURALLY',
            subtitle: 'Rich organic botanical serums to nourish, repair, and illuminate your skin.',
            image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200',
            buttonText: 'SHOP SKINCARE',
            buttonLink: '/products',
          },
          styles: { paddingY: '100px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'Pure Organic Elixirs',
            body: 'Pesticide-free, cruelty-free, and chemical-free cosmetics designed to harmonize with your skin and bring out your natural glow.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    } else if (templateKey === 'restaurant') {
      theme = { primaryColor: '#EA580C', secondaryColor: '#ffffff', backgroundColor: '#FFF7ED' };
      widgets = [
        {
          type: 'hero-banner',
          sort_order: 0,
          content: {
            title: 'CULINARY ARTISTRY',
            subtitle: 'Exquisite signature dishes prepared by master chefs using premium local ingredients.',
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
            buttonText: 'BOOK A TABLE / ORDER NOW',
            buttonLink: '/products',
          },
          styles: { paddingY: '110px', textAlign: 'center' },
        },
        {
          type: 'rich-text',
          sort_order: 1,
          content: {
            title: 'A Fine Gastronomic Experience',
            body: 'From farm to table, we offer a carefully crafted menu that blends traditional flavors with modern culinary innovations.',
          },
          styles: { paddingY: '40px', textAlign: 'center' },
        }
      ];
    }

    const updatedPage: LivePageData = {
      ...selectedPage,
      theme,
      widgets,
    };

    setSelectedPage(updatedPage);
    setSelectedWidgetId(null);
    showToast(`✨ Loaded ${templateKey.toUpperCase()} template! Click Save to apply.`);

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LAYOUT_UPDATE',
        payload: updatedPage
      }, '*');
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      // 1. Save all page settings (menus, logo, policy text)
      await customerApi.savePages(policySettings);

      // 2. Save page builder config (remove virtual prefix if present)
      const savePayload = { ...selectedPage };
      if (savePayload.id && savePayload.id.startsWith('virtual-')) {
        delete savePayload.id;
      }
      const updated = await pageBuilderApi.savePage(savePayload);
      const cleanUpdated = {
        ...updated,
        supportsHero: selectedPage.supportsHero,
        isReserved: selectedPage.isReserved,
        reservedType: selectedPage.reservedType,
      };
      
      setSelectedPage(cleanUpdated);
      setPages(prev => prev.map(p => (p.slug === cleanUpdated.slug || p.id === selectedPage.id) ? cleanUpdated : p));
      showToast('✅ Draft saved!');
    } catch (e: any) {
      alert(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      // 1. Save all page settings (menus, logo, policy text)
      await customerApi.savePages(policySettings);

      // 2. Save page layout first (handling virtual IDs)
      const savePayload = { ...selectedPage };
      if (savePayload.id && savePayload.id.startsWith('virtual-')) {
        delete savePayload.id;
      }
      const savedPage = await pageBuilderApi.savePage(savePayload);

      // 3. Publish page
      const updated = await pageBuilderApi.publishPage(savedPage.id);
      const cleanUpdated = {
        ...updated,
        supportsHero: selectedPage.supportsHero,
        isReserved: selectedPage.isReserved,
        reservedType: selectedPage.reservedType,
        is_published: true,
      };
      
      setSelectedPage(cleanUpdated);
      setPages(prev => prev.map(p => (p.slug === cleanUpdated.slug || p.id === selectedPage.id) ? cleanUpdated : p));
      showToast('🚀 Published to storefront!');
    } catch (e: any) {
      alert(e.message || 'Publish failed');
    } finally { setSaving(false); }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) return;
    setSaving(true);
    try {
      const newPage = await pageBuilderApi.savePage({
        title: newTitle,
        slug: newSlug,
        type: 'NORMAL',
        theme: { primaryColor: '#15803D', secondaryColor: '#ffffff', backgroundColor: '#ffffff' },
        widgets: [],
      });
      setPages(prev => [newPage, ...prev]);
      setSelectedPage(newPage);
      setSelectedWidgetId(null);
      setShowCreateModal(false);
      setNewTitle(''); setNewSlug('');
      setIframeKey(k => k + 1);
      showToast('✅ New page created!');
    } catch (e: any) {
      alert(e.message || 'Failed to create page');
    } finally { setSaving(false); }
  };

  const handleAddNavItem = () => {
    if (!newNavTitle.trim() || !newNavUrl.trim()) return;
    const updated = [...navbarMenu, { title: newNavTitle.trim(), url: newNavUrl.trim() }];
    setNavbarMenu(updated);
    setPolicySettings(prev => ({ ...prev, navbar_menu: JSON.stringify(updated) }));
    setNewNavTitle('');
    setNewNavUrl('');
  };

  const handleRemoveNavItem = (idx: number) => {
    const updated = navbarMenu.filter((_, i) => i !== idx);
    setNavbarMenu(updated);
    setPolicySettings(prev => ({ ...prev, navbar_menu: JSON.stringify(updated) }));
  };

  const handleMoveNavItem = (idx: number, dir: 'up' | 'down') => {
    const updated = [...navbarMenu];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setNavbarMenu(updated);
    setPolicySettings(prev => ({ ...prev, navbar_menu: JSON.stringify(updated) }));
  };

  const handleAddFootItem = () => {
    if (!newFootTitle.trim() || !newFootUrl.trim()) return;
    const updated = [...footerMenu, { title: newFootTitle.trim(), url: newFootUrl.trim() }];
    setFooterMenu(updated);
    setPolicySettings(prev => ({ ...prev, footer_menu: JSON.stringify(updated) }));
    setNewFootTitle('');
    setNewFootUrl('');
  };

  const handleRemoveFootItem = (idx: number) => {
    const updated = footerMenu.filter((_, i) => i !== idx);
    setFooterMenu(updated);
    setPolicySettings(prev => ({ ...prev, footer_menu: JSON.stringify(updated) }));
  };

  const handleMoveFootItem = (idx: number, dir: 'up' | 'down') => {
    const updated = [...footerMenu];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setFooterMenu(updated);
    setPolicySettings(prev => ({ ...prev, footer_menu: JSON.stringify(updated) }));
  };
  
  const addWidget = (type: WidgetType) => {
    if (!selectedPage) return;
    if (selectedPage.isReserved && selectedPage.slug !== 'index') {
      alert('Adding custom sections is disabled for this page layout.');
      return;
    }
    const id = `widget-${Date.now()}`;
    const base = { id, type, order: selectedPage.widgets.length, styles: { paddingTop: '2rem', paddingBottom: '2rem' } };
    const content =
      type === 'HERO_BANNER' ? { title: 'New Hero Section', subtitle: 'Add a subtitle here', backgroundImageUrl: '', buttonText: 'Shop Now', buttonLink: '/products' }
      : type === 'DOUBLE_HERO' ? {
          left: {
            title: 'Hero Panel One',
            subtitle: 'A bold statement for your left panel.',
            backgroundImageUrl: '',
            buttonText: 'Shop Now',
            buttonLink: '/products',
            bgColor: '#1e3a2f',
            textColor: '#ffffff',
          },
          right: {
            title: 'Hero Panel Two',
            subtitle: 'A different look for the right panel.',
            backgroundImageUrl: '',
            buttonText: 'Explore',
            buttonLink: '/products',
            bgColor: '#f0fdf4',
            textColor: '#0f172a',
          },
          height: '480',
        }
      : type === 'PRODUCT_GRID' ? { collectionId: categories?.[0]?.id || '', itemsPerPage: 4, showPrice: true }
      : type === 'PROMO_GRID' ? {
          title: 'Complete Skin & Hair Solutions',
          subtitle: 'Explore our premium organic products',
          layout: '3-columns',
          cards: [
            { title: 'Hair Care', subtitle: '100% Natural Oils', backgroundImageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=600', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#f1f5f9', textColor: '#0f172a', imgPosition: 'right' },
            { title: 'Body Care', subtitle: 'Chemical Free Lotions', backgroundImageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#f1f5f9', textColor: '#0f172a', imgPosition: 'right' },
            { title: 'Skin Care', subtitle: 'Organic Facewashes', backgroundImageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600', buttonText: 'Shop Now', buttonLink: '/products', bgColor: '#f1f5f9', textColor: '#0f172a', imgPosition: 'right' },
          ]
        }
      : type === 'TESTIMONIALS' ? {
          title: 'What Our Customers Say',
          subtitle: 'Real reviews from real customers',
          testimonials: [
            { id: '1', name: 'Alia Bhatt', role: 'Verified Buyer', rating: 5, text: 'This store has the absolute best organic face washes. My skin feels fresh, clear, and rejuvenated. Highly recommended!', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150', date: 'June 10, 2026' },
            { id: '2', name: 'Kabir Sen', role: 'Verified Buyer', rating: 5, text: 'Fantastic customer support and extremely fast delivery. The lavender hair oil smells divine and works wonders.', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', date: 'June 12, 2026' },
            { id: '3', name: 'Robert J.', role: 'Verified Buyer', rating: 4, text: 'Very good quality products. The packaging is eco-friendly and premium. Will definitely buy again!', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', date: 'June 13, 2026' }
          ]
        }
      : type === 'BEST_SELLERS' ? {
          title: 'Best Sellers',
          subtitle: 'Our most popular organic products',
          productIds: []
        }
      : type === 'CATEGORIES_LIST' ? {
          title: 'Product Categories',
          subtitle: 'Explore our curated collections',
          showViewAll: true
        }
      : { title: 'Section Title', body: '<p>Edit content here...</p>', imageUrl: '', imagePosition: 'none' };
    const newWidget = { ...base, content } as any;
    handlePageChange({ ...selectedPage, widgets: [...selectedPage.widgets, newWidget] });
    setSelectedWidgetId(id);
  };

  const deleteWidget = (id: string) => {
    if (!selectedPage) return;
    if (selectedPage.isReserved && selectedPage.slug !== 'index') {
      alert('Deleting system sections is disabled for this page layout.');
      return;
    }
    handlePageChange({ ...selectedPage, widgets: selectedPage.widgets.filter((w: any) => w.id !== id) });
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedPage) return;
    if (selectedPage.isReserved && selectedPage.slug !== 'index') return;
    const items = [...selectedPage.widgets];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    items.forEach((w, i) => { w.order = i; });
    handlePageChange({ ...selectedPage, widgets: items });
  };

  const handlePolicySettingChange = (key: string, value: string) => {
    setPolicySettings(prev => ({ ...prev, [key]: value }));
  };

  const selectedWidget = selectedPage?.widgets?.find((w: any) => w.id === selectedWidgetId) ?? null;
  const isPublished = (selectedPage as any)?.is_published;

  return (
    <>
      <style>{vbStyles}</style>
      <div className="vb-root">

        {/* ── Top Bar ── */}
        <div className="vb-topbar">
          <div className="vb-topbar-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <span>{shopInfo?.name || 'Store'}</span>
          </div>
          {selectedPage && (
            isPublished
              ? <span className="vb-status-badge vb-status-published">Live</span>
              : <span className="vb-status-badge vb-status-draft">Draft</span>
          )}
          <div className="vb-topbar-sep"/>

          {/* Page Selector */}
          <div className="vb-topbar-pages">
            <select
              className="vb-page-select"
              value={selectedPage?.id || ''}
              onChange={e => handleSelectPage(e.target.value)}
              disabled={loading}
            >
              {pages.length === 0
                ? <option value="">— No pages yet —</option>
                : pages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.slug === 'index' ? '/' : p.isReserved ? `/${p.slug}` : `/pages/${p.slug}`})
                  </option>
                ))
              }
            </select>
          </div>

          {/* Actions */}
          <div className="vb-topbar-actions">
            {/* Header & Footer Edit Buttons - always visible */}
            <button className="vb-btn-hf header-btn" onClick={() => setShowHeaderDrawer(true)} title="Edit Header, Navigation & Theme">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="5" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="15" y2="17"/>
              </svg>
              Header
            </button>
            <button className="vb-btn-hf footer-btn" onClick={() => setShowFooterDrawer(true)} title="Edit Footer & Social Links">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="7" x2="21" y2="7"/><rect x="3" y="12" width="18" height="9" rx="1"/>
              </svg>
              Footer
            </button>
            <div className="vb-topbar-sep"/>
            {selectedPage && (
              <>
                <select
                  className="vb-template-select"
                  onChange={(e) => {
                    handleLoadTemplate(e.target.value);
                    e.target.value = "";
                  }}
                  defaultValue=""
                  style={{
                    background: 'rgba(79, 70, 229, 0.08)',
                    border: '1px solid rgba(79, 70, 229, 0.2)',
                    color: '#6366F1',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    marginRight: '8px',
                  }}
                >
                  <option value="" disabled>✨ Load Template</option>
                  <option value="fashion">Fashion Store</option>
                  <option value="electronics">Electronics Store</option>
                  <option value="grocery">Grocery Store</option>
                  <option value="furniture">Furniture Store</option>
                  <option value="beauty">Beauty Store</option>
                  <option value="restaurant">Restaurant Store</option>
                </select>
                <button className="vb-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="vb-btn-publish" onClick={handlePublish} disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </>
            )}
            <button className="vb-btn-exit" onClick={onExit}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* ── Workspace ── */}
        <div className="vb-workspace">

          {/* Left: Sections Tree */}
          <div className={`vb-left ${leftOpen ? '' : 'collapsed'} ${mobileTab === 'structure' ? 'open' : ''}`}>
            <div className="vb-left-header">
              <div className="vb-panel-title-wrap">
                <h3 style={{ fontSize: '0.85rem', color: '#1e293b', textTransform: 'none', margin: 0, fontWeight: 700 }}>
                  {(selectedPage as any)?.title || 'No page selected'}
                </h3>
              </div>
              <button className="vb-panel-collapse-btn" onClick={() => setLeftOpen(false)} title="Collapse Panel">
                <IconChevronLeft />
              </button>
            </div>

            <div className="vb-left-header-actions" style={{ padding: '0 20px 10px', borderBottom: '1px solid #e2e8f0' }}>
              {(!selectedPage?.isReserved || selectedPage?.slug === 'index') ? (
                <div className="vb-add-btns">
                  <button className="vb-add-btn" onClick={() => addWidget('HERO_BANNER')}>
                    <span className="vb-add-btn-icon">+</span> Hero
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('DOUBLE_HERO')}>
                    <span className="vb-add-btn-icon">+</span> Dual Hero
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('PRODUCT_GRID')}>
                    <span className="vb-add-btn-icon">+</span> Grid
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('TEXT_BLOCK')}>
                    <span className="vb-add-btn-icon">+</span> Text
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('PROMO_GRID')}>
                    <span className="vb-add-btn-icon">+</span> Promo
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('TESTIMONIALS')}>
                    <span className="vb-add-btn-icon">+</span> Reviews
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('BEST_SELLERS')}>
                    <span className="vb-add-btn-icon">+</span> Best
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('CATEGORIES_LIST')}>
                    <span className="vb-add-btn-icon">+</span> Category
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.68rem', color: '#94A3B8', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🔒</span> Fixed Template Layout
                </p>
              )}
            </div>

            <div className="vb-sections-scroll">
              {!selectedPage ? (
                <div className="vb-empty-sections">
                  Select a page to start editing sections.
                </div>
              ) : (selectedPage.isReserved && selectedPage.slug !== 'index') ? (
                // ── Reserved Page Tree View ──
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Hero Banner (if supported) */}
                  {selectedPage.supportsHero && selectedPage.widgets.map((w: any, idx: number) => {
                    const meta = WIDGET_META[w.type] || { label: w.type, icon: '📦', iconClass: '' };
                    return (
                      <div
                        key={w.id}
                        className={`vb-section-item ${selectedWidgetId === w.id ? 'selected' : ''}`}
                        onClick={() => setSelectedWidgetId(w.id === selectedWidgetId ? null : w.id)}
                      >
                        <span style={{ color: '#64748B', fontSize: '10px', marginRight: '6px' }}>🔒</span>
                        <div className={`vb-section-icon ${meta.iconClass}`}>{meta.icon}</div>
                        <div className="vb-section-info">
                          <div className="vb-section-name">{meta.label}</div>
                          <div className="vb-section-order">Fixed top banner</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Policy Page Content link */}
                  {selectedPage.reservedType && (selectedPage.reservedType === 'POLICY' || selectedPage.reservedType === 'POLICY_HERO') && (
                    <div
                      className={`vb-section-item ${selectedWidgetId === 'policy-content' ? 'selected' : ''}`}
                      onClick={() => setSelectedWidgetId(selectedWidgetId === 'policy-content' ? null : 'policy-content')}
                    >
                      <span style={{ color: '#64748B', fontSize: '10px', marginRight: '6px' }}>🔒</span>
                      <div className="vb-section-icon icon-text"><IconText /></div>
                      <div className="vb-section-info">
                        <div className="vb-section-name">Page Text Content</div>
                        <div className="vb-section-order">Editable details</div>
                      </div>
                    </div>
                  )}

                  {/* Cart/Checkout automated template notice */}
                  {!selectedPage.supportsHero && selectedPage.reservedType === 'SYSTEM' && (
                    <div className="vb-empty-sections" style={{ borderStyle: 'solid', borderColor: '#cbd5e1', textAlign: 'left', padding: '12px 14px' }}>
                      <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '6px' }}>🛍️</span>
                      <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block' }}>System Page Template</strong>
                      <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#475569', lineHeight: '1.4' }}>
                        The layout is automated. Customize the active colors and font configurations on the right settings panel.
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedPage.widgets.length === 0 ? (
                <div className="vb-empty-sections">
                  No sections yet.<br/>Click a button above to add one.
                </div>
              ) : (
                // ── Custom Page Drag-and-Drop Tree View ──
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="vb-sections">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {selectedPage.widgets.map((w: any, idx: number) => {
                          const meta = WIDGET_META[w.type] || { label: w.type, icon: '📦', iconClass: '' };
                          return (
                            <Draggable key={w.id} draggableId={w.id} index={idx}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  className={`vb-section-item ${selectedWidgetId === w.id ? 'selected' : ''} ${snap.isDragging ? 'dragging' : ''}`}
                                  onClick={() => setSelectedWidgetId(w.id === selectedWidgetId ? null : w.id)}
                                >
                                  <span className="vb-drag-handle" {...prov.dragHandleProps}>⠿</span>
                                  <div className={`vb-section-icon ${meta.iconClass}`}>{meta.icon}</div>
                                  <div className="vb-section-info">
                                    <div className="vb-section-name">{meta.label}</div>
                                    <div className="vb-section-order">Section {idx + 1}</div>
                                  </div>
                                  <button
                                    className="vb-section-del"
                                    onClick={e => { e.stopPropagation(); deleteWidget(w.id); }}
                                    title="Remove section"
                                  >✕</button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            <div className="vb-left-footer">
              <a href={storefront} target="_blank" rel="noreferrer" className="vb-storefront-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View live storefront
              </a>
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="vb-canvas">
            {/* Floating Expand Buttons */}
            {!leftOpen && (
              <button className="vb-sidebar-toggle left-toggle" onClick={() => setLeftOpen(true)} title="Expand Left Panel">
                <IconChevronRight />
              </button>
            )}
            {!rightOpen && (
              <button className="vb-sidebar-toggle right-toggle" onClick={() => setRightOpen(true)} title="Expand Settings Panel">
                <IconChevronLeft />
              </button>
            )}

            {/* Canvas Toolbar */}
            <div className="vb-canvas-toolbar">
              <div className="vb-canvas-url-wrap">
                <span className="vb-canvas-url">
                  {previewUrl || 'Select a page to preview'}
                </span>
                <button className="vb-canvas-refresh" onClick={() => setIframeKey(k => k + 1)} title="Refresh preview">
                  <IconRefresh />
                </button>
              </div>

              {/* Viewport controls */}
              <div className="vb-viewport-controls">
                <button 
                  className={`vb-viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`} 
                  onClick={() => setViewportMode('desktop')} 
                  title="Desktop Preview"
                >
                  <IconDesktop />
                </button>
                <button 
                  className={`vb-viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`} 
                  onClick={() => setViewportMode('tablet')} 
                  title="Tablet Preview"
                >
                  <IconTablet />
                </button>
                <button 
                  className={`vb-viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`} 
                  onClick={() => setViewportMode('mobile')} 
                  title="Mobile Preview"
                >
                  <IconMobile />
                </button>
              </div>
            </div>

            {previewUrl ? (
              <div className="vb-iframe-wrap" onClick={() => setMobileTab('preview')}>
                <div className={`vb-iframe-container mode-${viewportMode}`}>
                  {/* macOS dots inside device mockup */}
                  {viewportMode === 'desktop' && (
                    <div style={{ height: '36px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '6px', flexShrink: 0 }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span>
                      <span style={{ fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', marginLeft: '12px' }}>localhost:3001</span>
                    </div>
                  )}
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    src={previewUrl}
                    className="vb-iframe"
                    title="Storefront Preview"
                    onLoad={handleIframeLoad}
                  />
                </div>
              </div>
            ) : (
              <div className="vb-no-page">
                <div className="vb-no-page-icon">🎨</div>
                <h3>No page selected</h3>
                <p>Select an existing page from the top bar to start customizing.</p>
              </div>
            )}
          </div>

          {/* Right: Settings */}
          <div className={`vb-right ${rightOpen ? '' : 'collapsed'} ${mobileTab === 'settings' ? 'open' : ''}`}>
            <div className="vb-right-header">
              <div className="vb-panel-title-wrap">
                <span className="vb-right-header-title" style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>
                  {selectedWidgetId === 'policy-content' ? 'Page Text Settings' : selectedWidget ? (WIDGET_META[selectedWidget.type]?.label || selectedWidget.type) : 'Storefront Settings'}
                </span>
              </div>
              <button className="vb-panel-collapse-btn" onClick={() => setRightOpen(false)} title="Collapse Panel">
                <IconChevronRight />
              </button>
            </div>

            <div className="vb-right-scroll">
              {selectedWidgetId === 'policy-content' && selectedPage ? (
                <>
                  {/* Theme Colors */}
                  {selectedPage && (
                    <div className="vb-field-section">
                      <div className="vb-field-group">
                        <label className="vb-label">Theme colors</label>
                        <div className="vb-color-row">
                          {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                            <div key={key} className="vb-color-item">
                              <input type="color" className="vb-color-input"
                                value={(selectedPage.theme as any)?.[key] || '#ffffff'}
                                onChange={e => handlePageChange({ ...selectedPage, theme: { ...selectedPage.theme, [key]: e.target.value } })}
                              />
                              <span className="vb-color-label">{key === 'primaryColor' ? 'Primary' : key === 'secondaryColor' ? 'Accent' : 'BG'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Policy Page Content Fields */}
                  {selectedPage.slug === 'privacy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label">Last Updated Date</label>
                        <input className="vb-input" value={policySettings.privacy_updated || ''} onChange={e => handlePolicySettingChange('privacy_updated', e.target.value)} placeholder="e.g. October 2026" />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Privacy Policy Content</label>
                        <textarea className="vb-textarea" rows={12} value={policySettings.privacy_content || ''} onChange={e => handlePolicySettingChange('privacy_content', e.target.value)} placeholder="Enter legal terms..." />
                      </div>
                    </div>
                  )}

                  {selectedPage.slug === 'terms' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label">Last Updated Date</label>
                        <input className="vb-input" value={policySettings.terms_updated || ''} onChange={e => handlePolicySettingChange('terms_updated', e.target.value)} placeholder="e.g. October 2026" />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Terms &amp; Conditions Content</label>
                        <textarea className="vb-textarea" rows={12} value={policySettings.terms_content || ''} onChange={e => handlePolicySettingChange('terms_content', e.target.value)} placeholder="Enter terms content..." />
                      </div>
                    </div>
                  )}

                  {selectedPage.slug === 'refund' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label">Last Updated Date</label>
                        <input className="vb-input" value={policySettings.refund_updated || ''} onChange={e => handlePolicySettingChange('refund_updated', e.target.value)} placeholder="e.g. October 2026" />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Refund Policy Content</label>
                        <textarea className="vb-textarea" rows={12} value={policySettings.refund_content || ''} onChange={e => handlePolicySettingChange('refund_content', e.target.value)} placeholder="Enter refund details..." />
                      </div>
                    </div>
                  )}

                  {selectedPage.slug === 'about' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label">About Page Title</label>
                        <input className="vb-input" value={policySettings.about_title || ''} onChange={e => handlePolicySettingChange('about_title', e.target.value)} placeholder="e.g. About Our Brand" />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Tagline</label>
                        <input className="vb-input" value={policySettings.about_tagline || ''} onChange={e => handlePolicySettingChange('about_tagline', e.target.value)} placeholder="Tagline..." />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Story / Description Content</label>
                        <textarea className="vb-textarea" rows={8} value={policySettings.about_content || ''} onChange={e => handlePolicySettingChange('about_content', e.target.value)} placeholder="Our story..." />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Value: Quality First Description</label>
                        <input className="vb-input" value={policySettings.value_quality || ''} onChange={e => handlePolicySettingChange('value_quality', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Value: Customer Care Description</label>
                        <input className="vb-input" value={policySettings.value_care || ''} onChange={e => handlePolicySettingChange('value_care', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Value: Fast Delivery Description</label>
                        <input className="vb-input" value={policySettings.value_delivery || ''} onChange={e => handlePolicySettingChange('value_delivery', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Value: Secure Shopping Description</label>
                        <input className="vb-input" value={policySettings.value_security || ''} onChange={e => handlePolicySettingChange('value_security', e.target.value)} />
                      </div>
                    </div>
                  )}

                  {selectedPage.slug === 'contact' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      
                      {/* Email Support */}
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            id="show_contact_email"
                            checked={policySettings.show_contact_email !== 'false'}
                            onChange={e => handlePolicySettingChange('show_contact_email', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="show_contact_email" style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}>
                            Show Email Support
                          </label>
                        </div>
                        {policySettings.show_contact_email !== 'false' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Email Address</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} type="email" value={policySettings.contact_email || ''} onChange={e => handlePolicySettingChange('contact_email', e.target.value)} placeholder="support@store.com" />
                            </div>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Subtitle / Note</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} value={policySettings.contact_email_desc || ''} onChange={e => handlePolicySettingChange('contact_email_desc', e.target.value)} placeholder="Monitored 24/7. Replies within 12 hours." />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Phone Helpline */}
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            id="show_contact_phone"
                            checked={policySettings.show_contact_phone !== 'false'}
                            onChange={e => handlePolicySettingChange('show_contact_phone', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="show_contact_phone" style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}>
                            Show Phone Helpline
                          </label>
                        </div>
                        {policySettings.show_contact_phone !== 'false' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Phone Number</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} type="tel" value={policySettings.contact_phone || ''} onChange={e => handlePolicySettingChange('contact_phone', e.target.value)} placeholder="+91 98765 43210" />
                            </div>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Subtitle / Note</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} value={policySettings.contact_phone_desc || ''} onChange={e => handlePolicySettingChange('contact_phone_desc', e.target.value)} placeholder="Available Mon-Sat, 9:00 AM - 6:00 PM." />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Store Location */}
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            id="show_contact_address"
                            checked={policySettings.show_contact_address !== 'false'}
                            onChange={e => handlePolicySettingChange('show_contact_address', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="show_contact_address" style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}>
                            Show Store Location Address
                          </label>
                        </div>
                        {policySettings.show_contact_address !== 'false' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Physical Address</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} value={policySettings.contact_address || ''} onChange={e => handlePolicySettingChange('contact_address', e.target.value)} placeholder="New Delhi, India" />
                            </div>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Subtitle / Note</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} value={policySettings.contact_address_desc || ''} onChange={e => handlePolicySettingChange('contact_address_desc', e.target.value)} placeholder="Flagship botanic laboratory storefront." />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Customer Care Hours */}
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            id="show_contact_hours"
                            checked={policySettings.show_contact_hours !== 'false'}
                            onChange={e => handlePolicySettingChange('show_contact_hours', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="show_contact_hours" style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}>
                            Show Customer Care Hours
                          </label>
                        </div>
                      </div>

                      {/* Google Map Section */}
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            id="show_contact_map"
                            checked={policySettings.show_contact_map !== 'false'}
                            onChange={e => handlePolicySettingChange('show_contact_map', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="show_contact_map" style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, cursor: 'pointer' }}>
                            Show Google Map
                          </label>
                        </div>
                        {policySettings.show_contact_map !== 'false' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16 }}>
                            <div className="vb-field-group">
                              <label className="vb-label" style={{ fontSize: '0.68rem' }}>Google Maps Embed URL (Iframe Src)</label>
                              <input className="vb-input" style={{ padding: '4px 8px', fontSize: '0.75rem' }} value={policySettings.contact_map_url || ''} onChange={e => handlePolicySettingChange('contact_map_url', e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Instagram Link */}
                      <div className="vb-field-group" style={{ marginBottom: 12 }}>
                        <label className="vb-label">Instagram Link</label>
                        <input className="vb-input" type="url" value={policySettings.social_instagram || ''} onChange={e => handlePolicySettingChange('social_instagram', e.target.value)} placeholder="https://instagram.com/account" />
                      </div>
                    </div>
                  )}
                </>
              ) : selectedWidget ? (
                <>
                  {/* Theme Colors */}
                  {selectedPage && selectedWidget.type !== 'HERO_BANNER' && (
                    <div className="vb-field-section">
                      <div className="vb-field-group">
                        <label className="vb-label">Theme colors</label>
                        <div className="vb-color-row">
                          {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                            <div key={key} className="vb-color-item">
                              <input type="color" className="vb-color-input"
                                value={(selectedPage.theme as any)?.[key] || '#ffffff'}
                                onChange={e => handlePageChange({ ...selectedPage, theme: { ...selectedPage.theme, [key]: e.target.value } })}
                              />
                              <span className="vb-color-label">{key === 'primaryColor' ? 'Primary' : key === 'secondaryColor' ? 'Accent' : 'BG'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Widget-specific settings */}
                  <WidgetSettingsForm
                    widget={selectedWidget}
                    categories={categories}
                    allProducts={allProducts}
                    pageSlug={selectedPage?.slug}
                    onChange={(updated) => {
                      if (!selectedPage) return;
                      handlePageChange({ ...selectedPage, widgets: selectedPage.widgets.map((w: any) => w.id === updated.id ? updated : w) as any });
                    }}
                  />
                  {(!selectedPage?.isReserved || selectedPage?.slug === 'index') && (
                    <button className="vb-del-widget-btn" onClick={() => deleteWidget(selectedWidget.id)}>
                      🗑️ Remove section
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Page Theme Colors (quick access) */}
                  {selectedPage && (
                    <div className="vb-field-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                      <label className="vb-label" style={{ marginBottom: '8px', display: 'block' }}>Page Theme Colors</label>
                      <div className="vb-color-row">
                        {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                          <div key={key} className="vb-color-item">
                            <input type="color" className="vb-color-input"
                              value={(selectedPage.theme as any)?.[key] || '#ffffff'}
                              onChange={e => handlePageChange({ ...selectedPage, theme: { ...selectedPage.theme, [key]: e.target.value } })}
                            />
                            <span className="vb-color-label">{key === 'primaryColor' ? 'Primary' : key === 'secondaryColor' ? 'Accent' : 'BG'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPage?.slug === 'index' && (
                    <>
                      {/* Announcement Bar Settings */}
                      <div className="vb-field-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                        <label className="vb-label" style={{ marginBottom: '8px', display: 'block' }}>Announcement Bar</label>
                        <div className="vb-field-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <input type="checkbox" id="announcement_bar_active"
                            checked={policySettings.announcement_bar_active !== 'false'}
                            onChange={e => handlePolicySettingChange('announcement_bar_active', e.target.checked ? 'true' : 'false')}
                          />
                          <label htmlFor="announcement_bar_active" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Show Announcement Bar</label>
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Announcement Text</label>
                          <input className="vb-input"
                            value={policySettings.announcement_bar || ''}
                            onChange={e => handlePolicySettingChange('announcement_bar', e.target.value)}
                            placeholder="🌿 FREE SHIPPING FOR ORDERS ABOVE..."
                          />
                        </div>
                      </div>

                      {/* Homepage About Us settings */}
                      <div className="vb-field-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                        <label className="vb-label" style={{ marginBottom: '8px', display: 'block' }}>Homepage About Us</label>
                        <div className="vb-field-group">
                          <label className="vb-label">About Us Title</label>
                          <input className="vb-input"
                            value={policySettings.about_title || ''}
                            onChange={e => handlePolicySettingChange('about_title', e.target.value)}
                            placeholder="About Us"
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Tagline</label>
                          <input className="vb-input"
                            value={policySettings.about_tagline || ''}
                            onChange={e => handlePolicySettingChange('about_tagline', e.target.value)}
                            placeholder="Live Healthy. Stay Beautiful."
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Story / Description</label>
                          <textarea className="vb-textarea" rows={4}
                            value={policySettings.about_content || ''}
                            onChange={e => handlePolicySettingChange('about_content', e.target.value)}
                            placeholder="Enter story details..."
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Value: 100% Natural Description</label>
                          <input className="vb-input"
                            value={policySettings.value_quality || ''}
                            onChange={e => handlePolicySettingChange('value_quality', e.target.value)}
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Value: Chemical Free Description</label>
                          <input className="vb-input"
                            value={policySettings.value_care || ''}
                            onChange={e => handlePolicySettingChange('value_care', e.target.value)}
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Value: Women Empowerment Description</label>
                          <input className="vb-input"
                            value={policySettings.value_empowerment || policySettings.value_security || ''}
                            onChange={e => handlePolicySettingChange('value_empowerment', e.target.value)}
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Value: Fast Delivery Description</label>
                          <input className="vb-input"
                            value={policySettings.value_delivery || ''}
                            onChange={e => handlePolicySettingChange('value_delivery', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Homepage CTA Banner settings */}
                      <div className="vb-field-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                        <label className="vb-label" style={{ marginBottom: '8px', display: 'block' }}>Homepage CTA Banner</label>
                        <div className="vb-field-group">
                          <label className="vb-label">CTA Title</label>
                          <input className="vb-input"
                            value={policySettings.cta_title || ''}
                            onChange={e => handlePolicySettingChange('cta_title', e.target.value)}
                            placeholder="Start your wellness journey today"
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">CTA Subtitle</label>
                          <textarea className="vb-textarea" rows={3}
                            value={policySettings.cta_subtitle || ''}
                            onChange={e => handlePolicySettingChange('cta_subtitle', e.target.value)}
                            placeholder="Join thousands of happy customers..."
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Primary Button Label</label>
                          <input className="vb-input"
                            value={policySettings.cta_btn1_text || ''}
                            onChange={e => handlePolicySettingChange('cta_btn1_text', e.target.value)}
                            placeholder="Shop All Products"
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Primary Button Link</label>
                          <input className="vb-input"
                            value={policySettings.cta_btn1_link || ''}
                            onChange={e => handlePolicySettingChange('cta_btn1_link', e.target.value)}
                            placeholder="/products"
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Secondary Button Label</label>
                          <input className="vb-input"
                            value={policySettings.cta_btn2_text || ''}
                            onChange={e => handlePolicySettingChange('cta_btn2_text', e.target.value)}
                            placeholder="Our Story"
                          />
                        </div>
                        <div className="vb-field-group">
                          <label className="vb-label">Secondary Button Link</label>
                          <input className="vb-input"
                            value={policySettings.cta_btn2_link || ''}
                            onChange={e => handlePolicySettingChange('cta_btn2_link', e.target.value)}
                            placeholder="/about"
                          />
                        </div>
                      </div>
                    </>
                  )}

                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Header Edit Drawer ── */}
        {showHeaderDrawer && (
          <>
            <div className="vb-drawer-backdrop" onClick={() => setShowHeaderDrawer(false)} />
            <div className="vb-drawer">
              <div className="vb-drawer-header">
                <div className="vb-drawer-title">
                  <div className="vb-drawer-title-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff' }}>🎨</div>
                  Header &amp; Navigation
                </div>
                <button className="vb-drawer-close" onClick={() => setShowHeaderDrawer(false)}>✕</button>
              </div>
              <div className="vb-drawer-body">

                {/* Theme Colors */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">🎨 Theme Colors</p>
                  <div className="vb-field-group">
                    <label className="vb-label">Page Colors (applies to current page)</label>
                    <div className="vb-color-row">
                      {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                        <div key={key} className="vb-color-item">
                          <input type="color" className="vb-color-input"
                            value={selectedPage ? ((selectedPage.theme as any)?.[key] || '#ffffff') : '#ffffff'}
                            onChange={e => selectedPage && handlePageChange({ ...selectedPage, theme: { ...selectedPage.theme, [key]: e.target.value } })}
                          />
                          <span className="vb-color-label">{key === 'primaryColor' ? 'Primary' : key === 'secondaryColor' ? 'Accent' : 'BG'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Store Logo */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">🖼️ Store Branding</p>
                  <div className="vb-field-group">
                    <label className="vb-label">Store Logo Image URL</label>
                    <input className="vb-input" value={policySettings.logo_url || ''}
                      onChange={e => handlePolicySettingChange('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png" />
                    {policySettings.logo_url && (
                      <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', padding: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={policySettings.logo_url} alt="Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Announcement Bar */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">📢 Announcement Bar</p>
                  <div className="vb-field-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <input type="checkbox" id="hd_announcement_bar_active"
                      checked={policySettings.announcement_bar_active !== 'false'}
                      onChange={e => handlePolicySettingChange('announcement_bar_active', e.target.checked ? 'true' : 'false')}
                    />
                    <label htmlFor="hd_announcement_bar_active" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Show Announcement Bar</label>
                  </div>
                  <div className="vb-field-group">
                    <label className="vb-label">Announcement Text</label>
                    <input className="vb-input" value={policySettings.announcement_bar || ''}
                      onChange={e => handlePolicySettingChange('announcement_bar', e.target.value)}
                      placeholder="🌿 FREE SHIPPING FOR ORDERS ABOVE ₹499" />
                  </div>
                </div>

                {/* Navbar Menu */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">🔗 Navbar Menu Links</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {navbarMenu.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '0.8rem', color: '#1e293b', display: 'block' }}>{item.title}</strong>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.url}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleMoveNavItem(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, color: '#64748b', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>▲</button>
                          <button type="button" onClick={() => handleMoveNavItem(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, color: '#64748b', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>▼</button>
                          <button type="button" onClick={() => handleRemoveNavItem(idx)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input className="vb-input" style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      value={newNavTitle} onChange={e => setNewNavTitle(e.target.value)} placeholder="Link title (e.g. Offers)" />
                    <input className="vb-input" style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      value={newNavUrl} onChange={e => setNewNavUrl(e.target.value)} placeholder="Link URL (e.g. /offers)" />
                    <button type="button" onClick={handleAddNavItem}
                      style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      + Add Nav Link
                    </button>
                  </div>
                </div>

              </div>
              <div className="vb-drawer-footer">
                <button className="vb-drawer-cancel" onClick={() => setShowHeaderDrawer(false)}>Cancel</button>
                <button className="vb-drawer-save" onClick={() => { handleSave(); setShowHeaderDrawer(false); }}>
                  💾 Save Header Settings
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Footer Edit Drawer ── */}
        {showFooterDrawer && (
          <>
            <div className="vb-drawer-backdrop" onClick={() => setShowFooterDrawer(false)} />
            <div className="vb-drawer">
              <div className="vb-drawer-header">
                <div className="vb-drawer-title">
                  <div className="vb-drawer-title-icon" style={{ background: 'linear-gradient(135deg,#ea580c,#fb923c)', color: '#fff' }}>🦶</div>
                  Footer &amp; Social Links
                </div>
                <button className="vb-drawer-close" onClick={() => setShowFooterDrawer(false)}>✕</button>
              </div>
              <div className="vb-drawer-body">

                {/* Footer Menu Links */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">🔗 Footer Menu Links</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {footerMenu.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '0.8rem', color: '#1e293b', display: 'block' }}>{item.title}</strong>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.url}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button type="button" onClick={() => handleMoveFootItem(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, color: '#64748b', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>▲</button>
                          <button type="button" onClick={() => handleMoveFootItem(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, color: '#64748b', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>▼</button>
                          <button type="button" onClick={() => handleRemoveFootItem(idx)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, color: '#ef4444', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input className="vb-input" style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      value={newFootTitle} onChange={e => setNewFootTitle(e.target.value)} placeholder="Link title (e.g. Terms)" />
                    <input className="vb-input" style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      value={newFootUrl} onChange={e => setNewFootUrl(e.target.value)} placeholder="Link URL (e.g. /terms)" />
                    <button type="button" onClick={handleAddFootItem}
                      style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                      + Add Footer Link
                    </button>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">📱 Social Media</p>
                  {[
                    { key: 'social_instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/yourshop' },
                    { key: 'social_facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/yourshop' },
                    { key: 'social_twitter', label: '🐦 Twitter / X', placeholder: 'https://twitter.com/yourshop' },
                    { key: 'social_youtube', label: '▶️ YouTube', placeholder: 'https://youtube.com/@yourshop' },
                    { key: 'social_whatsapp', label: '💬 WhatsApp', placeholder: 'https://wa.me/91XXXXXXXXXX' },
                  ].map(({ key, label, placeholder }) => (
                    <div className="vb-field-group" key={key}>
                      <label className="vb-label">{label}</label>
                      <input className="vb-input" value={policySettings[key] || ''}
                        onChange={e => handlePolicySettingChange(key, e.target.value)}
                        placeholder={placeholder} />
                    </div>
                  ))}
                </div>

                {/* Footer Text */}
                <div className="vb-drawer-section">
                  <p className="vb-drawer-section-title">📝 Footer Text</p>
                  <div className="vb-field-group">
                    <label className="vb-label">Footer About / Tagline</label>
                    <textarea className="vb-textarea" rows={3}
                      value={policySettings.footer_about || ''}
                      onChange={e => handlePolicySettingChange('footer_about', e.target.value)}
                      placeholder="A short description about your store..." />
                  </div>
                  <div className="vb-field-group">
                    <label className="vb-label">Copyright Text</label>
                    <input className="vb-input"
                      value={policySettings.footer_copyright || ''}
                      onChange={e => handlePolicySettingChange('footer_copyright', e.target.value)}
                      placeholder={`© ${new Date().getFullYear()} Your Store Name`} />
                  </div>
                </div>

              </div>
              <div className="vb-drawer-footer">
                <button className="vb-drawer-cancel" onClick={() => setShowFooterDrawer(false)}>Cancel</button>
                <button className="vb-drawer-save" onClick={() => { handleSave(); setShowFooterDrawer(false); }}>
                  💾 Save Footer Settings
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom tab bar for mobile viewports */}
        <div className="vb-mobile-tabs">
          <button className={`vb-mobile-tab-btn ${mobileTab === 'structure' ? 'active' : ''}`} onClick={() => setMobileTab('structure')}>
            <IconFolder />
            <span>Structure</span>
          </button>
          <button className={`vb-mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`} onClick={() => setMobileTab('preview')}>
            <IconEye />
            <span>Preview</span>
          </button>
          <button className={`vb-mobile-tab-btn ${mobileTab === 'settings' ? 'active' : ''}`} onClick={() => setMobileTab('settings')}>
            <IconGear />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Widget Settings Form ─────────────────────────────────────────────────────
const WidgetSettingsForm: React.FC<{
  widget: WidgetLayout;
  categories: any[];
  allProducts: any[];
  pageSlug?: string;
  onChange: (w: WidgetLayout) => void;
}> = ({ widget, categories, allProducts, pageSlug, onChange }) => {
  const updateContent = (key: string, value: any) => {
    onChange({ ...widget, content: { ...(widget.content as any), [key]: value } } as any);
  };

  if (widget.type === 'HERO_BANNER') {
    const c = widget.content as any;
    
    // Fallback to legacy single slide content
    const slides = c.slides && c.slides.length > 0 ? c.slides : [
      {
        title: c.title || '',
        subtitle: c.subtitle || '',
        backgroundImageUrl: c.backgroundImageUrl || '',
        buttonText: c.buttonText || '',
        buttonLink: c.buttonLink || '',
        textAlign: c.textAlign || 'center',
      }
    ];

    const updateSlideField = (idx: number, key: string, val: any) => {
      const newSlides = [...slides];
      newSlides[idx] = { ...newSlides[idx], [key]: val };
      onChange({ ...widget, content: { ...c, slides: newSlides } });
    };

    if (pageSlug === 'products' || pageSlug === 'category' || pageSlug === 'contact') {
      const slide = slides[0] || {};
      const hasBg = !!slide.backgroundImageUrl;
      
      const getPageName = () => {
        if (pageSlug === 'products') return 'Shop / Product Listing';
        if (pageSlug === 'category') return 'Categories';
        return 'Contact Us';
      };

      const getPlaceholderTitle = () => {
        if (pageSlug === 'products') return 'Shop / Product Listing';
        if (pageSlug === 'category') return 'Product Categories';
        return 'Get in Touch';
      };

      const getPlaceholderSub = () => {
        if (pageSlug === 'products') return 'Welcome to our shop / product listing page.';
        if (pageSlug === 'category') return 'Explore our curated collections';
        return 'Have questions about our botanical skincare? Our support team is here to assist you.';
      };

      return (
        <div className="vb-field-section">
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
            Update the banner heading, description, and background photo for the {getPageName()} page.
          </p>
          <div className="vb-field-group">
            <label className="vb-label">Banner Heading</label>
            <input
              className="vb-input"
              value={slide.title || ''}
              onChange={e => updateSlideField(0, 'title', e.target.value)}
              placeholder={getPlaceholderTitle()}
            />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Subheading / Description</label>
            <textarea
              className="vb-textarea"
              rows={3}
              value={slide.subtitle || ''}
              onChange={e => updateSlideField(0, 'subtitle', e.target.value)}
              placeholder={getPlaceholderSub()}
            />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Background / Product Image URL</label>
            <input
              className="vb-input"
              value={slide.backgroundImageUrl || ''}
              onChange={e => updateSlideField(0, 'backgroundImageUrl', e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
            {hasBg && (
              <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', maxHeight: 120, border: '1px solid #cbd5e1' }}>
                <img src={slide.backgroundImageUrl} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              </div>
            )}
          </div>
        </div>
      );
    }




    const addSlide = () => {
      const newSlides = [...slides, {
        title: 'New Slide Heading',
        subtitle: 'New slide description',
        backgroundImageUrl: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        textAlign: 'center',
      }];
      onChange({ ...widget, content: { ...c, slides: newSlides } });
    };

    const deleteSlide = (idx: number) => {
      if (slides.length <= 1) return;
      const newSlides = slides.filter((_: any, i: number) => i !== idx);
      onChange({ ...widget, content: { ...c, slides: newSlides } });
    };

    const moveSlide = (idx: number, dir: 'up' | 'down') => {
      const newSlides = [...slides];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newSlides.length) return;
      const [moved] = newSlides.splice(idx, 1);
      newSlides.splice(targetIdx, 0, moved);
      onChange({ ...widget, content: { ...c, slides: newSlides } });
    };

    return (
      <>
        {/* ── Global Autoplay Speed & Overlay ── */}
        <div className="vb-field-section">
          <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
            Configure transition slide interval, image overlays, and edit details per banner slide.
          </p>
          <div className="vb-field-group">
            <label className="vb-label">Autoplay Interval (Seconds)</label>
            <select
              className="vb-select"
              value={c.autoplaySpeed || '3'}
              onChange={e => onChange({ ...widget, content: { ...c, autoplaySpeed: e.target.value } })}
            >
              <option value="2">2 Seconds</option>
              <option value="3">3 Seconds (Default)</option>
              <option value="4">4 Seconds</option>
              <option value="5">5 Seconds</option>
            </select>
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Overlay Color (for all image banners)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                className="vb-color-input"
                value={c.overlayColor || '#000000'}
                onChange={e => onChange({ ...widget, content: { ...c, overlayColor: e.target.value } })}
              />
              <input
                type="range" min={0} max={90} step={5}
                value={parseInt(c.overlayOpacity || '50')}
                onChange={e => onChange({ ...widget, content: { ...c, overlayOpacity: e.target.value } })}
                style={{ flex: 1, accentColor: '#0284c7' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#475569', minWidth: 30 }}>{c.overlayOpacity || '50'}%</span>
            </div>
          </div>
        </div>

        {/* ── Slides List ── */}
        {slides.map((slide: any, idx: number) => {
          const hasBg = !!slide.backgroundImageUrl;
          return (
            <div key={idx} className="vb-field-section" style={{ borderBottom: '2.5px solid #cbd5e1', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Slide {idx + 1}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => moveSlide(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Up">▲</button>
                  <button type="button" onClick={() => moveSlide(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Down">▼</button>
                  <button type="button" onClick={() => deleteSlide(idx)} disabled={slides.length <= 1} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px', opacity: slides.length <= 1 ? 0.5 : 1 }} title="Delete Slide">✕</button>
                </div>
              </div>

              <div className="vb-field-group">
                <label className="vb-label">Layout Style</label>
                <select
                  className="vb-select"
                  value={slide.layout || 'default'}
                  onChange={e => updateSlideField(idx, 'layout', e.target.value)}
                >
                  <option value="default">Default (Full Image / Gradient)</option>
                  <option value="split_product">Split Screen (Product Focus)</option>
                </select>
              </div>

              {slide.layout === 'split_product' && (
                <>
                  <div className="vb-field-group">
                    <label className="vb-label">Slide Background Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color"
                        className="vb-color-input"
                        value={slide.slideBgColor || '#e2eee5'}
                        onChange={e => updateSlideField(idx, 'slideBgColor', e.target.value)}
                      />
                      <input
                        className="vb-input"
                        value={slide.slideBgColor || '#e2eee5'}
                        onChange={e => updateSlideField(idx, 'slideBgColor', e.target.value)}
                        placeholder="#e2eee5"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="vb-field-group">
                    <label className="vb-label">Headline/Border Text Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color"
                        className="vb-color-input"
                        value={slide.textColor || '#1b4332'}
                        onChange={e => updateSlideField(idx, 'textColor', e.target.value)}
                      />
                      <input
                        className="vb-input"
                        value={slide.textColor || '#1b4332'}
                        onChange={e => updateSlideField(idx, 'textColor', e.target.value)}
                        placeholder="#1b4332"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="vb-field-group">
                <label className="vb-label">Banner Heading</label>
                <input className="vb-input" value={slide.title || ''} onChange={e => updateSlideField(idx, 'title', e.target.value)} placeholder="Headline..." />
              </div>
              <div className="vb-field-group">
                <label className="vb-label">Subheading / Description</label>
                <textarea className="vb-textarea" rows={3} value={slide.subtitle || ''} onChange={e => updateSlideField(idx, 'subtitle', e.target.value)} placeholder="Description..." />
              </div>
              <div className="vb-field-group">
                <label className="vb-label">Background / Product Image URL</label>
                <input
                  className="vb-input"
                  value={slide.backgroundImageUrl || ''}
                  onChange={e => updateSlideField(idx, 'backgroundImageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
                {hasBg && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxHeight: 80, border: '1px solid #cbd5e1' }}>
                    <img src={slide.backgroundImageUrl} alt="Preview" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
              </div>
              <div className="vb-field-group">
                <label className="vb-label">Button Label</label>
                <input className="vb-input" value={slide.buttonText || ''} onChange={e => updateSlideField(idx, 'buttonText', e.target.value)} placeholder="Button label..." />
              </div>
              <div className="vb-field-group">
                <label className="vb-label">Button Link</label>
                <input className="vb-input" value={slide.buttonLink || ''} onChange={e => updateSlideField(idx, 'buttonLink', e.target.value)} placeholder="/products..." />
              </div>

              {slide.layout !== 'split_product' && (
                <>
                  <div className="vb-field-group">
                    <label className="vb-label">Text Alignment</label>
                    <select className="vb-select" value={slide.textAlign || 'center'} onChange={e => updateSlideField(idx, 'textAlign', e.target.value)}>
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="vb-field-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                    <input
                      type="checkbox"
                      id={`showTextCard-${idx}`}
                      checked={slide.showTextCard !== undefined ? !!slide.showTextCard : !!slide.showTextBlur}
                      onChange={e => {
                        updateSlideField(idx, 'showTextCard', e.target.checked);
                        updateSlideField(idx, 'showTextBlur', e.target.checked); // sync for backward compatibility
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor={`showTextCard-${idx}`} style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
                      Show Text Background Card
                    </label>
                  </div>

                  {(slide.showTextCard !== undefined ? !!slide.showTextCard : !!slide.showTextBlur) && (
                    <div style={{ marginLeft: 16, marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #0284c7', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label" style={{ fontSize: '0.65rem' }}>Card Theme</label>
                        <select
                          className="vb-select"
                          value={slide.textCardTheme || 'light'}
                          onChange={e => updateSlideField(idx, 'textCardTheme', e.target.value)}
                        >
                          <option value="light">Light Theme (Glass / White)</option>
                          <option value="dark">Dark Theme (Glass / Black)</option>
                        </select>
                      </div>

                      <div className="vb-field-group">
                        <label className="vb-label" style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Card Opacity</span>
                          <strong>{slide.textCardOpacity !== undefined ? slide.textCardOpacity : (slide.textCardTheme === 'dark' ? '45' : '15')}%</strong>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={slide.textCardOpacity !== undefined ? slide.textCardOpacity : (slide.textCardTheme === 'dark' ? '45' : '15')}
                          onChange={e => updateSlideField(idx, 'textCardOpacity', e.target.value)}
                          style={{ width: '100%', accentColor: '#0284c7' }}
                        />
                      </div>

                      <div className="vb-field-group">
                        <label className="vb-label" style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Blur Intensity</span>
                          <strong>{slide.textCardBlur !== undefined ? slide.textCardBlur : '12'}px</strong>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="1"
                          value={slide.textCardBlur !== undefined ? slide.textCardBlur : '12'}
                          onChange={e => updateSlideField(idx, 'textCardBlur', e.target.value)}
                          style={{ width: '100%', accentColor: '#0284c7' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addSlide}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(2,132,199,0.05)',
            border: '1px dashed #0284c7',
            color: '#0284c7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
            marginBottom: '12px',
          }}
        >
          ➕ Add Another Slide
        </button>
      </>
    );
  }

  if (widget.type === 'DOUBLE_HERO') {
    const c = widget.content as any;
    const updatePanel = (side: 'left' | 'right', key: string, val: any) => {
      onChange({ ...widget, content: { ...c, [side]: { ...c[side], [key]: val } } });
    };

    return (
      <>
        <div className="vb-field-section">
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
            A side-by-side dual hero layout. Each panel has its own image, text, and button.
          </p>
          <div className="vb-field-group">
            <label className="vb-label">Panel Height (px)</label>
            <input
              className="vb-input"
              type="number" min={200} max={900}
              value={c.height || '480'}
              onChange={e => onChange({ ...widget, content: { ...c, height: e.target.value } })}
            />
          </div>
        </div>

        {(['left', 'right'] as const).map(side => (
          <div key={side} className="vb-field-section">
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              {side === 'left' ? '⬅️ Left Panel' : '➡️ Right Panel'}
            </span>

            <div className="vb-field-group">
              <label className="vb-label">Heading</label>
              <input className="vb-input" value={c[side]?.title || ''} onChange={e => updatePanel(side, 'title', e.target.value)} placeholder="Panel headline..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Subheading</label>
              <textarea className="vb-textarea" rows={2} value={c[side]?.subtitle || ''} onChange={e => updatePanel(side, 'subtitle', e.target.value)} placeholder="Panel description..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Background Image URL</label>
              <input className="vb-input" value={c[side]?.backgroundImageUrl || ''} onChange={e => updatePanel(side, 'backgroundImageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
              {c[side]?.backgroundImageUrl && (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxHeight: 80, border: '1px solid #cbd5e1' }}>
                  <img src={c[side].backgroundImageUrl} alt="Preview" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" className="vb-color-input" value={c[side]?.bgColor || '#1e3a2f'} onChange={e => updatePanel(side, 'bgColor', e.target.value)} />
                <input className="vb-input" value={c[side]?.bgColor || '#1e3a2f'} onChange={e => updatePanel(side, 'bgColor', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Text Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" className="vb-color-input" value={c[side]?.textColor || '#ffffff'} onChange={e => updatePanel(side, 'textColor', e.target.value)} />
                <input className="vb-input" value={c[side]?.textColor || '#ffffff'} onChange={e => updatePanel(side, 'textColor', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Button Label</label>
              <input className="vb-input" value={c[side]?.buttonText || ''} onChange={e => updatePanel(side, 'buttonText', e.target.value)} placeholder="Shop Now" />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Button Link</label>
              <input className="vb-input" value={c[side]?.buttonLink || ''} onChange={e => updatePanel(side, 'buttonLink', e.target.value)} placeholder="/products" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (widget.type === 'PRODUCT_GRID') {
    const c = widget.content as any;
    return (
      <>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Category</label>
            <select className="vb-select" value={c.collectionId || ''} onChange={e => updateContent('collectionId', e.target.value)}>
              <option value="">— All products —</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Number of columns on desktop</label>
            <input className="vb-input" type="number" min={1} max={6} value={c.itemsPerPage || 4} onChange={e => updateContent('itemsPerPage', parseInt(e.target.value) || 4)} />
          </div>
        </div>
        <div className="vb-field-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="showPrice" checked={!!c.showPrice} onChange={e => updateContent('showPrice', e.target.checked)} />
            <label htmlFor="showPrice" style={{ fontSize: '0.8rem', color: '#202223', cursor: 'pointer' }}>Show product prices</label>
          </div>
        </div>
      </>
    );
  }

  if (widget.type === 'TEXT_BLOCK') {
    const c = widget.content as any;
    return (
      <>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Heading</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="Section heading..." />
          </div>
        </div>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Content</label>
            <textarea className="vb-textarea" rows={8} value={c.body || ''} onChange={e => updateContent('body', e.target.value)} placeholder="<p>Your content here...</p>" />
          </div>
        </div>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Photo / Image URL</label>
            <input className="vb-input" value={c.imageUrl || ''} onChange={e => updateContent('imageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Photo Position</label>
            <select className="vb-select" value={c.imagePosition || 'none'} onChange={e => updateContent('imagePosition', e.target.value)}>
              <option value="none">No Photo (Text Only)</option>
              <option value="left">Left of Text</option>
              <option value="right">Right of Text</option>
              <option value="top">Top (Above Text)</option>
            </select>
          </div>
        </div>
      </>
    );
  }

  if (widget.type === 'PROMO_GRID') {
    const c = widget.content as any;
    const cards = c.cards || [];

    const updateCardField = (idx: number, key: string, val: any) => {
      const newCards = [...cards];
      newCards[idx] = { ...newCards[idx], [key]: val };
      onChange({ ...widget, content: { ...c, cards: newCards } });
    };

    const addCard = () => {
      const newCards = [...cards, {
        title: 'New Promo Card',
        subtitle: 'Shop Now',
        backgroundImageUrl: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        bgColor: '#f1f5f9',
        textColor: '#0f172a',
        imgPosition: 'right',
      }];
      onChange({ ...widget, content: { ...c, cards: newCards } });
    };

    const deleteCard = (idx: number) => {
      if (cards.length <= 1) return;
      const newCards = cards.filter((_: any, i: number) => i !== idx);
      onChange({ ...widget, content: { ...c, cards: newCards } });
    };

    const moveCard = (idx: number, dir: 'up' | 'down') => {
      const newCards = [...cards];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newCards.length) return;
      const [moved] = newCards.splice(idx, 1);
      newCards.splice(targetIdx, 0, moved);
      onChange({ ...widget, content: { ...c, cards: newCards } });
    };

    return (
      <>
        {/* Title & Subtitle */}
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Grid Section Title</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="e.g. Deals You Can't Miss..." />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Grid Section Subtitle</label>
            <input className="vb-input" value={c.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} placeholder="Subtitle..." />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Grid Layout Preset</label>
            <select className="vb-select" value={c.layout || '3-columns'} onChange={e => updateContent('layout', e.target.value)}>
              <option value="3-columns">3 Columns Grid (Equal Columns)</option>
              <option value="2-columns">2 Columns Grid (Equal Columns)</option>
              <option value="asymmetric-3-box">Asymmetric 3-Box (2 Small + 1 Wide Bottom)</option>
              <option value="asymmetric-4-box">Asymmetric 4-Box (1 Tall Left + 2 Top Right + 1 Wide Bottom)</option>
            </select>
          </div>
        </div>

        {/* Promo Cards List */}
        {cards.map((card: any, idx: number) => (
          <div key={idx} className="vb-field-section" style={{ borderBottom: '2.5px solid #cbd5e1', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Card {idx + 1}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => moveCard(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Up">▲</button>
                <button type="button" onClick={() => moveCard(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Down">▼</button>
                <button type="button" onClick={() => deleteCard(idx)} disabled={cards.length <= 1} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px', opacity: cards.length <= 1 ? 0.5 : 1 }} title="Delete Card">✕</button>
              </div>
            </div>

            <div className="vb-field-group">
              <label className="vb-label">Card Title</label>
              <input className="vb-input" value={card.title || ''} onChange={e => updateCardField(idx, 'title', e.target.value)} placeholder="Title..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Card Subtitle / Description</label>
              <input className="vb-input" value={card.subtitle || ''} onChange={e => updateCardField(idx, 'subtitle', e.target.value)} placeholder="Subtitle..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Image URL</label>
              <input className="vb-input" value={card.backgroundImageUrl || ''} onChange={e => updateCardField(idx, 'backgroundImageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Image Layout / Position</label>
              <select className="vb-select" value={card.imgPosition || 'right'} onChange={e => updateCardField(idx, 'imgPosition', e.target.value)}>
                <option value="right">Right Side (Text on Left)</option>
                <option value="left">Left Side (Text on Right)</option>
                <option value="background">Background Image Overlay</option>
              </select>
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Button Label</label>
              <input className="vb-input" value={card.buttonText || ''} onChange={e => updateCardField(idx, 'buttonText', e.target.value)} placeholder="e.g. SHOP NOW" />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Button Link URL</label>
              <input className="vb-input" value={card.buttonLink || ''} onChange={e => updateCardField(idx, 'buttonLink', e.target.value)} placeholder="/products..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Background Color</label>
              <input className="vb-input" type="color" value={card.bgColor || '#f1f5f9'} onChange={e => updateCardField(idx, 'bgColor', e.target.value)} />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Text Color</label>
              <input className="vb-input" type="color" value={card.textColor || '#0f172a'} onChange={e => updateCardField(idx, 'textColor', e.target.value)} />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addCard}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(2,132,199,0.05)',
            border: '1px dashed #0284c7',
            color: '#0284c7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
            marginBottom: '12px',
          }}
        >
          ➕ Add Another Card
        </button>
      </>
    );
  }

  if (widget.type === 'TESTIMONIALS') {
    const c = widget.content as any;
    const testimonials = c.testimonials || [];

    const updateTestimonialField = (idx: number, key: string, val: any) => {
      const updated = [...testimonials];
      updated[idx] = { ...updated[idx], [key]: val };
      onChange({ ...widget, content: { ...c, testimonials: updated } });
    };

    const addTestimonial = () => {
      const updated = [...testimonials, {
        id: `t-${Date.now()}`,
        name: 'Jane Doe',
        role: 'Verified Buyer',
        rating: 5,
        text: 'Wonderful experience with these organic products! Highly recommend to everyone.',
        avatarUrl: '',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      }];
      onChange({ ...widget, content: { ...c, testimonials: updated } });
    };

    const deleteTestimonial = (idx: number) => {
      const updated = testimonials.filter((_: any, i: number) => i !== idx);
      onChange({ ...widget, content: { ...c, testimonials: updated } });
    };

    const moveTestimonial = (idx: number, dir: 'up' | 'down') => {
      const updated = [...testimonials];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= updated.length) return;
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      onChange({ ...widget, content: { ...c, testimonials: updated } });
    };

    return (
      <>
        {/* Title & Subtitle */}
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Section Title</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="e.g. What Our Customers Say" />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Section Subtitle</label>
            <input className="vb-input" value={c.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} placeholder="e.g. Real feedback from real customers" />
          </div>
        </div>

        {/* Testimonials List */}
        {testimonials.map((item: any, idx: number) => (
          <div key={item.id || idx} className="vb-field-section" style={{ borderBottom: '2.5px solid #cbd5e1', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>Review {idx + 1}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => moveTestimonial(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Up">▲</button>
                <button type="button" onClick={() => moveTestimonial(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Down">▼</button>
                <button type="button" onClick={() => deleteTestimonial(idx)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Delete Review">✕</button>
              </div>
            </div>

            <div className="vb-field-group">
              <label className="vb-label">Reviewer Name</label>
              <input className="vb-input" value={item.name || ''} onChange={e => updateTestimonialField(idx, 'name', e.target.value)} placeholder="Reviewer Name" />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Reviewer Role / Info</label>
              <input className="vb-input" value={item.role || ''} onChange={e => updateTestimonialField(idx, 'role', e.target.value)} placeholder="e.g. Verified Buyer" />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Review Date</label>
              <input className="vb-input" value={item.date || ''} onChange={e => updateTestimonialField(idx, 'date', e.target.value)} placeholder="e.g. June 10, 2026" />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Rating (Stars)</label>
              <select className="vb-select" value={item.rating || 5} onChange={e => updateTestimonialField(idx, 'rating', parseInt(e.target.value) || 5)}>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Review Comment</label>
              <textarea className="vb-textarea" rows={4} value={item.text || ''} onChange={e => updateTestimonialField(idx, 'text', e.target.value)} placeholder="Comment details..." />
            </div>
            <div className="vb-field-group">
              <label className="vb-label">Avatar Image URL</label>
              <input className="vb-input" value={item.avatarUrl || ''} onChange={e => updateTestimonialField(idx, 'avatarUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addTestimonial}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(2,132,199,0.05)',
            border: '1px dashed #0284c7',
            color: '#0284c7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
            marginBottom: '12px',
          }}
        >
          ➕ Add Another Review
        </button>
      </>
    );
  }

  if (widget.type === 'BEST_SELLERS') {
    const c = widget.content as any;
    const selectedIds = c.productIds || [];

    const addProduct = () => {
      const firstId = allProducts?.[0]?.id || '';
      onChange({ ...widget, content: { ...c, productIds: [...selectedIds, firstId] } });
    };

    const updateProductAt = (idx: number, id: string) => {
      const updated = [...selectedIds];
      updated[idx] = id;
      onChange({ ...widget, content: { ...c, productIds: updated } });
    };

    const removeProductAt = (idx: number) => {
      const updated = selectedIds.filter((_: any, i: number) => i !== idx);
      onChange({ ...widget, content: { ...c, productIds: updated } });
    };

    const moveProductAt = (idx: number, dir: 'up' | 'down') => {
      const updated = [...selectedIds];
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= updated.length) return;
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      onChange({ ...widget, content: { ...c, productIds: updated } });
    };

    return (
      <>
        {/* Title & Subtitle */}
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Section Title</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="e.g. Best Sellers" />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Section Subtitle</label>
            <input className="vb-input" value={c.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} placeholder="e.g. Our most popular organic products" />
          </div>
        </div>

        {/* Selected Products List */}
        <div className="vb-field-section">
          <label className="vb-label" style={{ marginBottom: '10px', display: 'block' }}>Best Seller Products</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {selectedIds.map((prodId: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '6px' }}>
                <select
                  className="vb-select"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.78rem' }}
                  value={prodId}
                  onChange={e => updateProductAt(idx, e.target.value)}
                >
                  <option value="">— Select Product —</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={() => moveProductAt(idx, 'up')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Up">▲</button>
                  <button type="button" onClick={() => moveProductAt(idx, 'down')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Move Down">▼</button>
                  <button type="button" onClick={() => removeProductAt(idx)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '10px' }} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addProduct}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(2,132,199,0.05)',
              border: '1px dashed #0284c7',
              color: '#0284c7',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            ➕ Add Product
          </button>
        </div>
      </>
    );
  }

  if (widget.type === 'CATEGORIES_LIST') {
    const c = widget.content as any;
    return (
      <>
        {/* Title & Subtitle */}
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Section Title</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="e.g. Product Categories" />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Section Subtitle</label>
            <input className="vb-input" value={c.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} placeholder="e.g. Explore our curated collections" />
          </div>
        </div>

        {/* View All Button Toggle */}
        <div className="vb-field-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              id="showViewAll" 
              checked={c.showViewAll !== false} 
              onChange={e => updateContent('showViewAll', e.target.checked)} 
            />
            <label htmlFor="showViewAll" style={{ fontSize: '0.8rem', color: '#202223', cursor: 'pointer', userSelect: 'none' }}>
              Show "View All" Button
            </label>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default VisualBuilder;
