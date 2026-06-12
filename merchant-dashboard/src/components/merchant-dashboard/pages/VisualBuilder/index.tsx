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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .vb-root {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
    background: #0F172A; color: #F1F5F9;
    overflow: hidden;
  }

  /* ── Top Bar ── */
  .vb-topbar {
    height: 52px; min-height: 52px;
    background: #1E293B;
    border-bottom: 1px solid #334155;
    display: flex; align-items: center;
    padding: 0 16px; gap: 12px;
    flex-shrink: 0;
  }
  .vb-topbar-brand {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.8rem; font-weight: 700; color: #38BDF8;
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .vb-topbar-brand svg { width: 18px; height: 18px; }
  .vb-topbar-sep {
    width: 1px; height: 22px; background: #334155; flex-shrink: 0;
  }
  .vb-topbar-pages {
    display: flex; align-items: center; gap: 8px; flex: 1;
  }
  .vb-page-select {
    background: #0F172A; border: 1px solid #334155; color: #E2E8F0;
    border-radius: 7px; padding: 5px 10px; font-size: 0.8rem;
    font-family: inherit; cursor: pointer; min-width: 200px;
    outline: none;
  }
  .vb-page-select:focus { border-color: #38BDF8; }
  .vb-btn-new {
    background: transparent; border: 1px solid #334155; color: #94A3B8;
    border-radius: 7px; padding: 5px 10px; font-size: 0.75rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 5px;
    transition: all 0.15s;
  }
  .vb-btn-new:hover { border-color: #38BDF8; color: #38BDF8; }
  .vb-topbar-actions {
    display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0;
  }
  .vb-status-badge {
    font-size: 0.7rem; font-weight: 700; padding: 3px 8px;
    border-radius: 5px; text-transform: uppercase; letter-spacing: 0.03em;
  }
  .vb-status-published { background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3); }
  .vb-status-draft { background: rgba(234,179,8,0.15); color: #FBBF24; border: 1px solid rgba(234,179,8,0.3); }
  .vb-btn-save {
    background: #1E293B; border: 1px solid #334155; color: #CBD5E1;
    border-radius: 7px; padding: 6px 14px; font-size: 0.78rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .vb-btn-save:hover { border-color: #38BDF8; color: #38BDF8; }
  .vb-btn-publish {
    background: linear-gradient(135deg, #10B981, #059669);
    border: none; color: #fff;
    border-radius: 7px; padding: 6px 18px; font-size: 0.78rem;
    font-weight: 700; cursor: pointer; font-family: inherit;
    box-shadow: 0 2px 8px rgba(16,185,129,0.3);
    transition: all 0.15s;
  }
  .vb-btn-publish:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }
  .vb-btn-publish:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .vb-btn-exit {
    background: transparent; border: 1px solid #334155; color: #64748B;
    border-radius: 7px; padding: 6px 12px; font-size: 0.78rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.15s; display: flex; align-items: center; gap: 5px;
  }
  .vb-btn-exit:hover { border-color: #EF4444; color: #EF4444; }

  /* ── Workspace ── */
  .vb-workspace {
    display: flex; flex: 1; overflow: hidden;
  }

  /* ── Left Panel ── */
  .vb-left {
    width: 260px; min-width: 260px;
    background: #1E293B;
    border-right: 1px solid #334155;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .vb-left-header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }
  .vb-left-header h3 {
    font-size: 0.7rem; font-weight: 700; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 10px;
  }
  .vb-add-btns {
    display: flex; gap: 4px; flex-wrap: wrap;
  }
  .vb-add-btn {
    flex: 1; background: #0F172A; border: 1px solid #334155; color: #94A3B8;
    border-radius: 6px; padding: 5px 6px; font-size: 0.7rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    transition: all 0.15s; white-space: nowrap;
  }
  .vb-add-btn:hover { border-color: #38BDF8; color: #38BDF8; background: rgba(56,189,248,0.05); }

  .vb-sections-scroll {
    flex: 1; overflow-y: auto; padding: 10px 10px;
  }
  .vb-sections-scroll::-webkit-scrollbar { width: 3px; }
  .vb-sections-scroll::-webkit-scrollbar-track { background: transparent; }
  .vb-sections-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

  .vb-section-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 10px; border-radius: 8px; cursor: pointer;
    border: 1px solid transparent; margin-bottom: 3px;
    transition: all 0.15s; user-select: none;
    background: transparent;
  }
  .vb-section-item:hover { background: rgba(255,255,255,0.04); border-color: #334155; }
  .vb-section-item.selected { background: rgba(56,189,248,0.08); border-color: rgba(56,189,248,0.3); }
  .vb-section-item.dragging { box-shadow: 0 8px 24px rgba(0,0,0,0.4); opacity: 0.9; }
  .vb-drag-handle {
    color: #475569; font-size: 12px; cursor: grab; flex-shrink: 0;
  }
  .vb-section-icon {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }
  .icon-hero { background: rgba(99,102,241,0.15); }
  .icon-grid { background: rgba(16,185,129,0.15); }
  .icon-text { background: rgba(245,158,11,0.15); }
  .vb-section-info { flex: 1; min-width: 0; }
  .vb-section-name {
    font-size: 0.78rem; font-weight: 600; color: #E2E8F0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vb-section-order {
    font-size: 0.65rem; color: #64748B; font-weight: 500;
  }
  .vb-section-del {
    width: 22px; height: 22px; border-radius: 5px;
    background: transparent; border: none; color: #475569;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0; transition: all 0.15s;
  }
  .vb-section-del:hover { background: rgba(239,68,68,0.15); color: #EF4444; }

  .vb-empty-sections {
    padding: 28px 12px; text-align: center;
    color: #475569; font-size: 0.78rem; line-height: 1.5;
    border: 1px dashed #334155; border-radius: 8px; margin: 4px 0;
  }

  .vb-left-footer {
    padding: 12px 16px;
    border-top: 1px solid #334155;
    flex-shrink: 0;
  }
  .vb-storefront-link {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.72rem; color: #64748B; text-decoration: none;
    transition: color 0.15s;
  }
  .vb-storefront-link:hover { color: #38BDF8; }

  /* ── Center Canvas ── */
  .vb-canvas {
    flex: 1; display: flex; flex-direction: column;
    background: #0F172A; overflow: hidden;
  }
  .vb-canvas-toolbar {
    height: 36px; min-height: 36px; background: #1E293B;
    border-bottom: 1px solid #334155;
    display: flex; align-items: center; padding: 0 16px;
    gap: 12px; flex-shrink: 0;
  }
  .vb-canvas-url {
    flex: 1; font-size: 0.72rem; color: #64748B; font-family: monospace;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .vb-canvas-refresh {
    background: none; border: none; color: #64748B; cursor: pointer;
    font-size: 14px; transition: color 0.15s; padding: 0;
  }
  .vb-canvas-refresh:hover { color: #38BDF8; }
  .vb-iframe-wrap {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 16px; overflow: hidden;
  }
  .vb-iframe {
    width: 100%; height: 100%; max-width: 1280px;
    background: white; border-radius: 8px;
    border: none;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5);
  }
  .vb-no-page {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #475569; text-align: center; gap: 12px;
  }
  .vb-no-page-icon { font-size: 3.5rem; opacity: 0.5; }
  .vb-no-page h3 { font-size: 1.1rem; font-weight: 700; color: #64748B; margin: 0; }
  .vb-no-page p { font-size: 0.82rem; color: #475569; max-width: 320px; margin: 0; line-height: 1.5; }

  /* ── Right Panel ── */
  .vb-right {
    width: 300px; min-width: 300px;
    background: #1E293B;
    border-left: 1px solid #334155;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .vb-right-header {
    padding: 14px 16px;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }
  .vb-right-header h3 {
    font-size: 0.7rem; font-weight: 700; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.06em; margin: 0;
  }
  .vb-right-title {
    font-size: 0.9rem; font-weight: 700; color: #E2E8F0; margin-top: 2px;
  }
  .vb-right-scroll {
    flex: 1; overflow-y: auto; padding: 14px 14px;
  }
  .vb-right-scroll::-webkit-scrollbar { width: 3px; }
  .vb-right-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

  .vb-field-group { margin-bottom: 14px; }
  .vb-label {
    display: block; font-size: 0.68rem; font-weight: 700; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;
  }
  .vb-input {
    width: 100%; background: #0F172A; border: 1px solid #334155; color: #E2E8F0;
    border-radius: 7px; padding: 7px 10px; font-size: 0.8rem;
    font-family: inherit; outline: none; box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .vb-input:focus { border-color: #38BDF8; }
  .vb-textarea {
    width: 100%; background: #0F172A; border: 1px solid #334155; color: #E2E8F0;
    border-radius: 7px; padding: 7px 10px; font-size: 0.8rem;
    font-family: inherit; outline: none; box-sizing: border-box;
    resize: vertical; min-height: 80px; transition: border-color 0.15s;
  }
  .vb-textarea:focus { border-color: #38BDF8; }
  .vb-select {
    width: 100%; background: #0F172A; border: 1px solid #334155; color: #E2E8F0;
    border-radius: 7px; padding: 7px 10px; font-size: 0.8rem;
    font-family: inherit; outline: none; cursor: pointer;
  }
  .vb-select:focus { border-color: #38BDF8; }
  .vb-color-row {
    display: flex; gap: 8px;
  }
  .vb-color-item {
    display: flex; flex-direction: column; gap: 4px; flex: 1; text-align: center;
  }
  .vb-color-input {
    width: 100%; height: 34px; cursor: pointer; border-radius: 6px;
    border: 1px solid #334155; background: #0F172A;
  }
  .vb-color-label { font-size: 0.62rem; color: #64748B; font-weight: 600; }
  .vb-theme-section {
    padding: 14px 14px; border-bottom: 1px solid #334155; flex-shrink: 0;
  }
  .vb-theme-section h4 {
    font-size: 0.68rem; font-weight: 700; color: #64748B;
    text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;
  }
  .vb-right-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 24px; gap: 8px;
    color: #475569;
    text-align: center; padding: 32px 20px; gap: 8px;
    color: #6D7175;
  }
  .vb-right-empty-icon { font-size: 2rem; opacity: 0.4; }
  .vb-right-empty p { font-size: 0.8rem; line-height: 1.6; max-width: 190px; margin: 0; }
  .vb-del-widget-btn {
    width: calc(100% - 32px); margin: 0 16px 16px;
    padding: 8px; background: transparent;
    border: 1px solid #E1E3E5; color: #D72C0D;
    border-radius: 8px; font-size: 0.8rem; font-weight: 500;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .vb-del-widget-btn:hover { background: #FFF4F4; border-color: #FE7B7B; }

  /* ── Modal ── */
  .vb-modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; backdrop-filter: blur(2px);
  }
  .vb-modal {
    background: #FFFFFF; border: 1px solid #E1E3E5; border-radius: 12px;
    padding: 24px; width: 440px; max-width: 90vw;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  }
  .vb-modal h3 {
    font-size: 1rem; font-weight: 700; color: #202223; margin: 0 0 4px;
  }
  .vb-modal p {
    font-size: 0.82rem; color: #6D7175; margin: 0 0 20px;
  }
  .vb-modal-fields { display: flex; flex-direction: column; gap: 12px; }
  .vb-modal-footer { display: flex; gap: 8px; margin-top: 20px; }
  .vb-modal-cancel {
    flex: 1; padding: 9px; background: #FFFFFF; border: 1px solid #C9CCCF;
    color: #202223; border-radius: 8px; font-size: 0.82rem;
    font-weight: 500; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .vb-modal-cancel:hover { background: #F6F6F7; }
  .vb-modal-submit {
    flex: 2; padding: 9px; background: #008060; border: 1px solid #006E52;
    color: #FFFFFF; border-radius: 8px; font-size: 0.82rem;
    font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .vb-modal-submit:hover { background: #006E52; }
  .vb-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Toast ── */
  .vb-toast {
    position: fixed; bottom: 20px; right: 20px; z-index: 10001;
    background: #202223; color: #FFFFFF; padding: 10px 16px;
    border-radius: 8px; font-size: 0.82rem; font-weight: 500;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    animation: toastIn 0.25s ease; display: flex; align-items: center; gap: 8px;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Widget type info ─────────────────────────────────────────────────────────
const WIDGET_META: Record<string, { label: string; icon: string; iconClass: string }> = {
  HERO_BANNER:  { label: 'Hero Banner',   icon: '🖼️',  iconClass: 'icon-hero' },
  PRODUCT_GRID: { label: 'Product Grid',  icon: '🛍️',  iconClass: 'icon-grid' },
  TEXT_BLOCK:   { label: 'Text Block',    icon: '📝',  iconClass: 'icon-text' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const VisualBuilder: React.FC<VisualBuilderProps> = ({ shopInfo, onExit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [policySettings, setPolicySettings] = useState<Record<string, string>>({});
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
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

  // storefront_url is always set by VisualBuilderPage as http://slug.localhost:3001
  const slug = shopInfo?.slug || 'store';
  const storefront = shopInfo?.storefront_url || `http://${slug}.localhost:3001`;
  const previewUrl = selectedPage
    ? `${storefront}${selectedPage.slug === 'index' ? '' : `/pages/${selectedPage.slug}`}?preview=true`
    : '';

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

  const handleIframeLoad = () => {
    if (!selectedPage || !iframeRef.current?.contentWindow) return;
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'LAYOUT_UPDATE', payload: selectedPage },
        '*'
      );
    }, 300);
  };

  // Load data on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dbPages, cats, stdPages] = await Promise.all([
          pageBuilderApi.getPages(),
          catalogApi.getCategories(),
          customerApi.getPages().catch(() => ({ content: {} })) as Promise<any>,
        ]);
        
        setCategories(cats || []);
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
              content: {
                title: rp.title,
                subtitle: `Welcome to our ${rp.title.toLowerCase()} page.`,
                backgroundImageUrl: '',
                buttonText: '',
                buttonLink: '',
              },
              styles: { paddingTop: '2rem', paddingBottom: '2rem' }
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
          if (homePage.id.startsWith('virtual-')) {
            setSelectedPage(homePage);
          } else {
            const details = await pageBuilderApi.getPageById(homePage.id);
            setSelectedPage({
              ...details,
              supportsHero: homePage.supportsHero,
              isReserved: homePage.isReserved,
              reservedType: homePage.reservedType,
            });
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
    if (selectedPage.isReserved) {
      alert('Adding custom sections is disabled for this page layout.');
      return;
    }
    const id = `widget-${Date.now()}`;
    const base = { id, type, order: selectedPage.widgets.length, styles: { paddingTop: '2rem', paddingBottom: '2rem' } };
    const content =
      type === 'HERO_BANNER' ? { title: 'New Hero Section', subtitle: 'Add a subtitle here', backgroundImageUrl: '', buttonText: 'Shop Now', buttonLink: '/products' }
      : type === 'PRODUCT_GRID' ? { collectionId: categories?.[0]?.id || '', itemsPerPage: 4, showPrice: true }
      : { title: 'Section Title', body: '<p>Edit content here...</p>' };
    const newWidget = { ...base, content } as any;
    handlePageChange({ ...selectedPage, widgets: [...selectedPage.widgets, newWidget] });
    setSelectedWidgetId(id);
  };

  const deleteWidget = (id: string) => {
    if (!selectedPage) return;
    if (selectedPage.isReserved) {
      alert('Deleting system sections is disabled for this page layout.');
      return;
    }
    handlePageChange({ ...selectedPage, widgets: selectedPage.widgets.filter((w: any) => w.id !== id) });
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedPage) return;
    if (selectedPage.isReserved) return;
    const items = [...selectedPage.widgets];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    items.forEach((w, i) => { w.order = i; });
    handlePageChange({ ...selectedPage, widgets: items });
  };

  const handlePolicySettingChange = (key: string, value: string) => {
    setPolicySettings(prev => ({ ...prev, [key]: value }));
  };

  const selectedWidget = selectedPage?.widgets.find((w: any) => w.id === selectedWidgetId) ?? null;
  const isPublished = (selectedPage as any)?.is_published;

  return (
    <>
      <style>{vbStyles}</style>
      <div className="vb-root">

        {/* ── Top Bar ── */}
        <div className="vb-topbar">
          <div className="vb-topbar-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <button className="vb-btn-new" onClick={() => setShowCreateModal(true)}>+ New page</button>
          </div>

          {/* Actions */}
          <div className="vb-topbar-actions">
            {selectedPage && (
              <>
                <button className="vb-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="vb-btn-publish" onClick={handlePublish} disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </>
            )}
            <button className="vb-btn-exit" onClick={onExit}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* ── Workspace ── */}
        <div className="vb-workspace">

          {/* Left: Sections Tree */}
          <div className="vb-left">
            <div className="vb-left-header">
              <h3 style={{ fontSize: '0.85rem', color: '#E2E8F0', textTransform: 'none', margin: '0 0 4px', fontWeight: 700 }}>
                {(selectedPage as any)?.title || 'No page selected'}
              </h3>
              {!selectedPage?.isReserved && (
                <div className="vb-add-btns">
                  <button className="vb-add-btn" onClick={() => addWidget('HERO_BANNER')}>
                    <span className="vb-add-btn-icon">+</span> Hero Banner
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('PRODUCT_GRID')}>
                    <span className="vb-add-btn-icon">+</span> Product Grid
                  </button>
                  <button className="vb-add-btn" onClick={() => addWidget('TEXT_BLOCK')}>
                    <span className="vb-add-btn-icon">+</span> Text Block
                  </button>
                </div>
              )}
              {selectedPage?.isReserved && (
                <p style={{ fontSize: '0.68rem', color: '#94A3B8', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🔒</span> Fixed Template Layout
                </p>
              )}
            </div>

            <div className="vb-sections-scroll">
              {!selectedPage ? (
                <div className="vb-empty-sections">
                  Create or select a page to start editing sections.
                </div>
              ) : selectedPage.isReserved ? (
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
                      <div className="vb-section-icon icon-text">📝</div>
                      <div className="vb-section-info">
                        <div className="vb-section-name">Page Text Content</div>
                        <div className="vb-section-order">Editable details</div>
                      </div>
                    </div>
                  )}

                  {/* Cart/Checkout automated template notice */}
                  {!selectedPage.supportsHero && selectedPage.reservedType === 'SYSTEM' && (
                    <div className="vb-empty-sections" style={{ borderStyle: 'solid', borderColor: '#334155', textAlign: 'left', padding: '12px 14px' }}>
                      <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '6px' }}>🛍️</span>
                      <strong style={{ fontSize: '0.8rem', color: '#E2E8F0', display: 'block' }}>System Page Template</strong>
                      <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#94A3B8', lineHeight: '1.4' }}>
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
            <div className="vb-canvas-toolbar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
              </svg>
              <span className="vb-canvas-url">
                {previewUrl || 'Select a page to preview'}
              </span>
              <button className="vb-canvas-refresh" onClick={() => setIframeKey(k => k + 1)} title="Refresh preview">
                ↺
              </button>
            </div>

            {previewUrl ? (
              <div className="vb-iframe-wrap">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={previewUrl}
                  className="vb-iframe"
                  title="Storefront Preview"
                  onLoad={handleIframeLoad}
                />
              </div>
            ) : (
              <div className="vb-no-page">
                <div className="vb-no-page-icon">🎨</div>
                <h3>No page selected</h3>
                <p>Select an existing page from the top bar, or create a new one to start customizing.</p>
                <button
                  style={{
                    marginTop: 8, padding: '10px 22px',
                    background: 'linear-gradient(135deg,#10B981,#059669)',
                    border: 'none', color: '#fff', borderRadius: 8,
                    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit'
                  }}
                  onClick={() => setShowCreateModal(true)}
                >
                  + Create First Page
                </button>
              </div>
            )}
          </div>

          {/* Right: Settings */}
          <div className="vb-right">
            {selectedWidgetId === 'policy-content' && selectedPage ? (
              <>
                <div className="vb-right-header">
                  <span className="vb-right-header-title">Page Text Settings</span>
                </div>
                <div className="vb-right-scroll">
                  {/* Theme Colors */}
                  {selectedPage && (
                    <div className="vb-field-section">
                      <div className="vb-field-group">
                        <label className="vb-label">Theme colors</label>
                        <div className="vb-color-row">
                          {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                            <div key={key} className="vb-color-item">
                              <input type="color" className="vb-color-input"
                                value={(selectedPage.theme as any)[key]}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="vb-field-group">
                        <label className="vb-label">Contact Email</label>
                        <input className="vb-input" type="email" value={policySettings.contact_email || ''} onChange={e => handlePolicySettingChange('contact_email', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Contact Phone</label>
                        <input className="vb-input" type="tel" value={policySettings.contact_phone || ''} onChange={e => handlePolicySettingChange('contact_phone', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Physical Address</label>
                        <input className="vb-input" value={policySettings.contact_address || ''} onChange={e => handlePolicySettingChange('contact_address', e.target.value)} />
                      </div>
                      <div className="vb-field-group">
                        <label className="vb-label">Instagram Link</label>
                        <input className="vb-input" type="url" value={policySettings.social_instagram || ''} onChange={e => handlePolicySettingChange('social_instagram', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : selectedWidget ? (
              <>
                <div className="vb-right-header">
                  <span className="vb-right-header-title">{WIDGET_META[selectedWidget.type]?.label || selectedWidget.type}</span>
                </div>
                <div className="vb-right-scroll">
                  {/* Theme Colors */}
                  {selectedPage && (
                    <div className="vb-field-section">
                      <div className="vb-field-group">
                        <label className="vb-label">Theme colors</label>
                        <div className="vb-color-row">
                          {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                            <div key={key} className="vb-color-item">
                              <input type="color" className="vb-color-input"
                                value={(selectedPage.theme as any)[key]}
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
                    onChange={(updated) => {
                      if (!selectedPage) return;
                      handlePageChange({ ...selectedPage, widgets: selectedPage.widgets.map((w: any) => w.id === updated.id ? updated : w) as any });
                    }}
                  />
                  {!selectedPage?.isReserved && (
                    <button className="vb-del-widget-btn" onClick={() => deleteWidget(selectedWidget.id)}>
                      🗑️ Remove section
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="vb-right-header">
                  <span className="vb-right-header-title">Storefront Settings</span>
                </div>
                <div className="vb-right-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Theme Colors */}
                  {selectedPage && (
                    <div className="vb-field-section" style={{ borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
                      <label className="vb-label" style={{ marginBottom: '8px', display: 'block' }}>Theme colors</label>
                      <div className="vb-color-row">
                        {(['primaryColor', 'secondaryColor', 'backgroundColor'] as const).map(key => (
                          <div key={key} className="vb-color-item">
                            <input type="color" className="vb-color-input"
                              value={(selectedPage.theme as any)[key]}
                              onChange={e => handlePageChange({ ...selectedPage, theme: { ...selectedPage.theme, [key]: e.target.value } })}
                            />
                            <span className="vb-color-label">{key === 'primaryColor' ? 'Primary' : key === 'secondaryColor' ? 'Accent' : 'BG'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logo Customization */}
                  <div className="vb-field-section" style={{ borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
                    <div className="vb-field-group">
                      <label className="vb-label">Store Logo Image URL</label>
                      <input 
                        className="vb-input" 
                        value={policySettings.logo_url || ''} 
                        onChange={e => handlePolicySettingChange('logo_url', e.target.value)} 
                        placeholder="https://example.com/logo.png" 
                      />
                    </div>
                  </div>

                  {/* Navbar Menu Customization */}
                  <div className="vb-field-section" style={{ borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
                    <label className="vb-label" style={{ marginBottom: '10px', display: 'block' }}>Navbar Menu Links</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {navbarMenu.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#0F172A', padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155', gap: '6px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '0.75rem', color: '#E2E8F0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</strong>
                            <span style={{ fontSize: '0.65rem', color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button type="button" onClick={() => handleMoveNavItem(idx, 'up')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Move Up">▲</button>
                            <button type="button" onClick={() => handleMoveNavItem(idx, 'down')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Move Down">▼</button>
                            <button type="button" onClick={() => handleRemoveNavItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Remove">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Add Nav Item form */}
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        className="vb-input" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                        value={newNavTitle} 
                        onChange={e => setNewNavTitle(e.target.value)} 
                        placeholder="Link Title (e.g. Offers)" 
                      />
                      <input 
                        className="vb-input" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                        value={newNavUrl} 
                        onChange={e => setNewNavUrl(e.target.value)} 
                        placeholder="Link URL (e.g. /offers)" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddNavItem}
                        style={{ background: '#38BDF8', color: '#0F172A', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Add Navbar Link
                      </button>
                    </div>
                  </div>

                  {/* Footer Links Customization */}
                  <div className="vb-field-section" style={{ paddingBottom: '14px' }}>
                    <label className="vb-label" style={{ marginBottom: '10px', display: 'block' }}>Footer Menu Links</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {footerMenu.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#0F172A', padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155', gap: '6px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '0.75rem', color: '#E2E8F0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</strong>
                            <span style={{ fontSize: '0.65rem', color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.url}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button type="button" onClick={() => handleMoveFootItem(idx, 'up')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Move Up">▲</button>
                            <button type="button" onClick={() => handleMoveFootItem(idx, 'down')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Move Down">▼</button>
                            <button type="button" onClick={() => handleRemoveFootItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', fontSize: '10px' }} title="Remove">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Add Footer Item form */}
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px dashed #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        className="vb-input" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                        value={newFootTitle} 
                        onChange={e => setNewFootTitle(e.target.value)} 
                        placeholder="Link Title (e.g. Terms)" 
                      />
                      <input 
                        className="vb-input" 
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }} 
                        value={newFootUrl} 
                        onChange={e => setNewFootUrl(e.target.value)} 
                        placeholder="Link URL (e.g. /terms)" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddFootItem}
                        style={{ background: '#38BDF8', color: '#0F172A', border: 'none', padding: '6px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Add Footer Link
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="vb-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="vb-modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Page</h3>
            <p>Add a new custom storefront page to your website.</p>
            <form onSubmit={handleCreatePage}>
              <div className="vb-modal-fields">
                <div className="vb-field-group">
                  <label className="vb-label">Page Title</label>
                  <input
                    className="vb-input"
                    value={newTitle}
                    onChange={e => {
                      setNewTitle(e.target.value);
                      if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="e.g. Summer Sale, About Us"
                    required
                    autoFocus
                  />
                </div>
                <div className="vb-field-group">
                  <label className="vb-label">URL Slug (/pages/…)</label>
                  <input
                    className="vb-input"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="summer-sale  (use 'index' for homepage)"
                    required
                  />
                </div>
              </div>
              <div className="vb-modal-footer">
                <button type="button" className="vb-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="vb-modal-submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="vb-toast">{toast}</div>}
    </>
  );
};

// ─── Widget Settings Form ─────────────────────────────────────────────────────
const WidgetSettingsForm: React.FC<{
  widget: WidgetLayout;
  categories: any[];
  onChange: (w: WidgetLayout) => void;
}> = ({ widget, categories, onChange }) => {
  const updateContent = (key: string, value: any) => {
    onChange({ ...widget, content: { ...(widget.content as any), [key]: value } } as any);
  };

  if (widget.type === 'HERO_BANNER') {
    const c = widget.content as any;
    return (
      <>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Heading</label>
            <input className="vb-input" value={c.title || ''} onChange={e => updateContent('title', e.target.value)} placeholder="Main headline..." />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Subheading</label>
            <input className="vb-input" value={c.subtitle || ''} onChange={e => updateContent('subtitle', e.target.value)} placeholder="Supporting text..." />
          </div>
        </div>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Background image URL</label>
            <input className="vb-input" value={c.backgroundImageUrl || ''} onChange={e => updateContent('backgroundImageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>
        </div>
        <div className="vb-field-section">
          <div className="vb-field-group">
            <label className="vb-label">Button label</label>
            <input className="vb-input" value={c.buttonText || ''} onChange={e => updateContent('buttonText', e.target.value)} placeholder="Shop Now" />
          </div>
          <div className="vb-field-group">
            <label className="vb-label">Button link</label>
            <input className="vb-input" value={c.buttonLink || ''} onChange={e => updateContent('buttonLink', e.target.value)} placeholder="/products" />
          </div>
        </div>
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
      </>
    );
  }

  return null;
};

export default VisualBuilder;
