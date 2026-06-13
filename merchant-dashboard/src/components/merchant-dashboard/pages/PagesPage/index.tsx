import React, { useState, useEffect, useCallback } from 'react';
import { customerApi, pageBuilderApi, catalogApi } from '../../../../lib/api-client';
import { LivePageData } from '@oak-commerce/types';
import { Modal, Spinner } from 'shared-ui';
import { EditorSidebar } from './EditorSidebar';
import { CanvasIframe } from './CanvasIframe';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  shopInfo: any;
}

type PagesTab = 'about' | 'contact' | 'privacy' | 'terms';
type EditorMode = 'standard' | 'builder';

const TAB_ITEMS: { id: PagesTab; label: string; icon: string; desc: string }[] = [
  { id: 'about',   label: 'About Us',          icon: '🌿', desc: 'Your store story, mission & values' },
  { id: 'contact', label: 'Contact & Social',   icon: '📬', desc: 'Contact details & social media links' },
  { id: 'privacy', label: 'Privacy Policy',     icon: '🔒', desc: 'Data & privacy disclosures' },
  { id: 'terms',   label: 'Terms & Conditions', icon: '📄', desc: 'Legal terms of service' },
];

export const PagesPage: React.FC<Props> = ({ shopInfo }) => {
  const [editorMode, setEditorMode] = useState<EditorMode>('builder');
  const [activeTab, setActiveTab] = useState<PagesTab>('about');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Standard Pages State
  const [fields, setFields] = useState<Record<string, string>>({
    about_title: '',
    about_tagline: '',
    about_content: '',
    value_quality: '',
    value_care: '',
    value_delivery: '',
    value_security: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_instagram: '',
    social_facebook: '',
    privacy_content: '',
    privacy_updated: '',
    terms_content: '',
    terms_updated: '',
  });

  // Custom Pages Builder State
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<LivePageData | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }));

  // Load Content
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Standard static pages
      const standardData = await customerApi.getPages();
      if (standardData?.content) {
        setFields(prev => ({ ...prev, ...standardData.content }));
      }

      // 2. Fetch Builder Custom Pages
      const builderPages = await pageBuilderApi.getPages();
      setCustomPages(builderPages || []);
      if (builderPages && builderPages.length > 0 && !selectedPage) {
        // Load the first page details
        const details = await pageBuilderApi.getPageById(builderPages[0].id);
        setSelectedPage(details);
      }

      // 3. Fetch Categories for the grid widget list
      const cats = await catalogApi.getCategories();
      setCategories(cats || []);

    } catch (err: any) {
      setError('Failed to sync page builder data. Make sure backend service is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    fetchContent();
  }, []);

  // Save Standard Text fields
  const handleSaveStandard = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      await customerApi.savePages(fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save standard pages.');
    } finally {
      setSaving(false); }
  };

  // Select a custom page
  const handleSelectPage = async (id: string) => {
    try {
      setLoading(true);
      const details = await pageBuilderApi.getPageById(id);
      setSelectedPage(details);
    } catch {
      setError('Failed to fetch details for page.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new custom page
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle || !newPageSlug) return;
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: newPageTitle,
        slug: newPageSlug.toLowerCase().replace(/\s+/g, '-'),
        type: 'NORMAL' as const,
        theme: {
          primaryColor: '#15803D',
          secondaryColor: '#ffffff',
          backgroundColor: '#ffffff',
        },
        widgets: [],
      };
      const newPage = await pageBuilderApi.savePage(payload);
      setCustomPages(prev => [newPage, ...prev]);
      setSelectedPage(newPage);
      setShowCreateModal(false);
      setNewPageTitle('');
      setNewPageSlug('');
      alert('Custom page created successfully! Customize it in the builder below.');
    } catch (err: any) {
      setError(err.message || 'Failed to create page.');
    } finally {
      setSaving(false);
    }
  };

  // Save active custom page draft layout
  const handleSaveCustomLayout = async () => {
    if (!selectedPage) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await pageBuilderApi.savePage(selectedPage);
      setSelectedPage(updated);
      setCustomPages(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save custom page layout.');
    } finally {
      setSaving(false);
    }
  };

  // Publish dynamic page to storefront
  const handlePublishCustomLayout = async () => {
    if (!selectedPage) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      // 1. Save layouts
      await pageBuilderApi.savePage(selectedPage);
      // 2. Publish status
      const updated = await pageBuilderApi.publishPage(selectedPage.id);
      setSelectedPage(prev => prev ? { ...prev, is_published: true } : null);
      setCustomPages(prev => prev.map(p => p.id === updated.id ? { ...p, is_published: true } : p));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      alert('Page published successfully! It is now live on the storefront.');
    } catch (err: any) {
      setError(err.message || 'Failed to publish custom page layout.');
    } finally {
      setSaving(false);
    }
  };

  // Delete dynamic page layout
  const handleDeleteCustomPage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom page layout? All widgets will be deleted.')) return;
    setSaving(true); setError(null);
    try {
      await pageBuilderApi.deletePage(id);
      setCustomPages(prev => prev.filter(p => p.id !== id));
      setSelectedPage(null);
      alert('Page deleted successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to delete page.');
    } finally {
      setSaving(false);
    }
  };

  const storefront = shopInfo?.storefront_url || `http://${shopInfo?.slug}.localhost:3001`;
  const builderPreviewUrl = selectedPage 
    ? `${storefront}${selectedPage.slug === 'index' ? '' : `/pages/${selectedPage.slug}`}` 
    : storefront;

  return (
    <div className="pg-page">
      {/* Dynamic Header */}
      <div className="pg-header flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h1 className="pg-title">Pages & Storefront Builder</h1>
          <p className="pg-subtitle">Customize standard layouts or compile new dynamic page builders</p>
        </div>
        
        {/* Mode Selector Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => setEditorMode('standard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${editorMode === 'standard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📋 Legal / Standard Pages
          </button>
          <button 
            onClick={() => setEditorMode('builder')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${editorMode === 'builder' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🎨 Drag &amp; Drop Visual Builder
          </button>
        </div>
      </div>

      {error && <div className="pg-error">{error}</div>}
      {saved && <div className="pg-success">✅ Changes saved successfully!</div>}

      {/* ── Mode 1: Standard legal texts edits ── */}
      {editorMode === 'standard' && (
        <div className="pg-layout mt-4">
          {/* Tab Sidebar */}
          <nav className="pg-tabs">
            {TAB_ITEMS.map(tab => (
              <button
                key={tab.id}
                className={`pg-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="pg-tab-icon">{tab.icon}</span>
                <span className="pg-tab-text">
                  <span className="pg-tab-label">{tab.label}</span>
                  <span className="pg-tab-desc">{tab.desc}</span>
                </span>
                <svg className="pg-tab-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}

            <div className="pg-links-section">
              <p className="pg-links-label">Live store links</p>
              {[
                { href: `${storefront}/about`, label: '/about' },
                { href: `${storefront}/contact`, label: '/contact' },
                { href: `${storefront}/privacy`, label: '/privacy' },
                { href: `${storefront}/terms`, label: '/terms' },
              ].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="pg-sf-link">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  {l.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Content Panel */}
          <div className="pg-panel">
            {loading ? (
              <div className="pg-loading"><Spinner size="lg" message="Syncing pages..." /></div>
            ) : (
              <div className="relative">
                <div className="absolute top-4 right-4">
                  <button className="pg-save-btn" onClick={handleSaveStandard} disabled={saving}>
                    {saving ? 'Saving...' : 'Save standard changes'}
                  </button>
                </div>
                {activeTab === 'about' && (
                  <div className="pg-form">
                    <h2 className="pg-form-title">🌿 About Us Page Content</h2>
                    <div className="pg-field mt-3">
                      <label className="pg-label">Page Title</label>
                      <input className="pg-input" type="text" value={fields.about_title} onChange={set('about_title')} />
                    </div>
                    <div className="pg-field">
                      <label className="pg-label">Tagline</label>
                      <input className="pg-input" type="text" value={fields.about_tagline} onChange={set('about_tagline')} />
                    </div>
                    <div className="pg-field">
                      <label className="pg-label">Story / Body Content</label>
                      <textarea className="pg-textarea lg" value={fields.about_content} onChange={set('about_content')} rows={8} />
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="pg-form">
                    <h2 className="pg-form-title">📬 Contact details</h2>
                    <div className="pg-grid-2 mt-3">
                      <div className="pg-field">
                        <label className="pg-label">Email</label>
                        <input className="pg-input" type="email" value={fields.contact_email} onChange={set('contact_email')} />
                      </div>
                      <div className="pg-field">
                        <label className="pg-label">Phone</label>
                        <input className="pg-input" type="tel" value={fields.contact_phone} onChange={set('contact_phone')} />
                      </div>
                    </div>
                    <div className="pg-field">
                      <label className="pg-label">Instagram Profile URL</label>
                      <input className="pg-input" type="url" value={fields.social_instagram} onChange={set('social_instagram')} />
                    </div>
                  </div>
                )}

                {activeTab === 'privacy' && (
                  <div className="pg-form">
                    <h2 className="pg-form-title">🔒 Privacy Policy Override</h2>
                    <div className="pg-field mt-3">
                      <label className="pg-label">Policy Legal content</label>
                      <textarea className="pg-textarea xl" value={fields.privacy_content} onChange={set('privacy_content')} rows={15} />
                    </div>
                  </div>
                )}

                {activeTab === 'terms' && (
                  <div className="pg-form">
                    <h2 className="pg-form-title">📄 Terms &amp; Conditions</h2>
                    <div className="pg-field mt-3">
                      <label className="pg-label">Terms layout text</label>
                      <textarea className="pg-textarea xl" value={fields.terms_content} onChange={set('terms_content')} rows={15} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mode 2: Page customizer builder ── */}
      {editorMode === 'builder' && (
        <div className="flex flex-col gap-6 mt-4">
          
          {/* Builder Top Bar: Select Layout / Create Page */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Page:</span>
              <select 
                value={selectedPage?.id || ''}
                onChange={(e) => handleSelectPage(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-800 min-w-[200px]"
              >
                <option value="" disabled>-- Choose page to edit --</option>
                {customPages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.slug === 'index' ? '/' : `/${p.slug}`}) {p.is_published ? '🟢 published' : '🟡 draft'}
                  </option>
                ))}
              </select>

            </div>

            {selectedPage && (
              <div className="flex items-center gap-3">
                <span className="text-xxs text-slate-400 font-medium">
                  URL: <a href={builderPreviewUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{selectedPage.slug === 'index' ? '/' : `/pages/${selectedPage.slug}`}</a>
                </span>
                
                <button 
                  onClick={handleSaveCustomLayout}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
                  disabled={saving}
                >
                  Save Draft
                </button>

                <button 
                  onClick={handlePublishCustomLayout}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition"
                  disabled={saving}
                >
                  {saving ? 'Publishing...' : 'Publish Layout'}
                </button>
              </div>
            )}
          </div>

          {/* Builder Layout Workspace */}
          {selectedPage ? (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 items-start">
              {/* Left Config Panel */}
              <EditorSidebar 
                layout={selectedPage} 
                onChange={setSelectedPage} 
                categories={categories}
                selectedWidgetId={selectedWidgetId}
                onSelectWidget={setSelectedWidgetId}
              />

              {/* Center Live Preview Canvas */}
              <CanvasIframe 
                currentLayout={selectedPage} 
                previewUrl={builderPreviewUrl} 
              />

              {/* Right Settings Panel */}
              <SettingsPanel 
                layout={selectedPage} 
                onChange={setSelectedPage} 
                categories={categories}
                selectedWidgetId={selectedWidgetId}
                onSelectWidget={setSelectedWidgetId}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-4xl mb-4">🎨</span>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Select a Page to Begin</h3>
              <p className="text-slate-400 text-sm max-w-sm mb-2">Select a page layout from the list to begin editing real-time details.</p>
            </div>
          )}
        </div>
      )}

      
    </div>
  );
};
