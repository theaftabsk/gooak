import React, { useState, useEffect } from 'react';
import { catalogApi } from '@oaksol/api-client';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner } from '../../shared';
import { VariantsStockTab } from '../VariantsStockTab';

interface ProductDetailPageProps {
  productId: string;
  products: any[];
  categories: any[];
  brands: any[];
  onBack: () => void;
}

type TabType = 'general' | 'media' | 'seo' | 'faqs' | 'sections' | 'variants';

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId, categories, brands, onBack
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [product, setProduct] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Basic Info Form States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [catId, setCatId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState('draft');
  const [desc, setDesc] = useState('');
  const [shortDesc, setShortDesc] = useState('');

  // Media Gallery States
  const [gallery, setGallery] = useState<any[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');

  // SEO Metadata States
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  // FAQs States
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Custom Sections States
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecType, setNewSecType] = useState<'bullets' | 'cards' | 'details' | 'steps'>('bullets');

  // Load details - extracted so we can call it after save too
  const loadProduct = async () => {
    try {
      setLoadingDetails(true);
      const data = await catalogApi.getProductById(productId);
      setProduct(data);
      
      setName(data.name || '');
      setSlug(data.slug || '');
      setSku(data.master_sku || '');
      setPrice(data.price ? parseFloat(data.price).toString() : '');
      setComparePrice(data.compare_price ? parseFloat(data.compare_price).toString() : '');
      setCostPrice(data.cost_price ? parseFloat(data.cost_price).toString() : '');
      setCatId(data.category_id || '');
      setBrandId(data.brand_id || '');
      setStatus(data.status || 'draft');
      setDesc(data.description || '');
      setShortDesc(data.short_desc || '');
      setGallery(data.gallery || []);
      setMetaTitle(data.meta_title || '');
      setMetaDesc(data.meta_description || '');
      setFaqs(data.faqs || []);
      
      let sections = data.custom_sections;
      if (typeof sections === 'string') {
        try { sections = JSON.parse(sections); } catch { sections = []; }
      }
      setCustomSections(Array.isArray(sections) ? sections : []);
    } catch (err) {
      console.error('Failed to load product details:', err);
      alert('Failed to load product details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  // Handle auto-slugification
  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  // Gallery Helpers
  const addGalleryImage = () => {
    if (!newImageUrl) return;
    const isFirst = gallery.length === 0;
    const newImg = {
      id: Math.random().toString(), // local temporary ID
      url: newImageUrl,
      alt_text: newAltText || null,
      sort_order: gallery.length,
      is_cover: isFirst
    };
    setGallery([...gallery, newImg]);
    setNewImageUrl('');
    setNewAltText('');
  };

  const deleteGalleryImage = (id: string) => {
    const updated = gallery.filter(g => g.id !== id);
    // If we deleted the cover image, set the first remaining one as cover
    const deletedWasCover = gallery.find(g => g.id === id)?.is_cover;
    if (deletedWasCover && updated.length > 0) {
      updated[0].is_cover = true;
    }
    setGallery(updated);
  };

  const setCoverImage = (id: string) => {
    const updated = gallery.map(g => ({
      ...g,
      is_cover: g.id === id
    }));
    setGallery(updated);
  };

  // FAQ Helpers
  const addFaq = () => {
    if (!newQuestion || !newAnswer) return;
    const newFaqItem = {
      id: Math.random().toString(),
      question: newQuestion,
      answer: newAnswer,
      sort_order: faqs.length
    };
    setFaqs([...faqs, newFaqItem]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const deleteFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };

  // Custom Sections Helpers
  const addCustomSection = () => {
    if (!newSecTitle) return;
    const id = newSecTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    let defaultContent: any = '';
    if (newSecType === 'bullets') defaultContent = [];
    if (newSecType === 'cards') defaultContent = [];
    if (newSecType === 'details') defaultContent = { frequency: '', follow_up: '', results: [], shelf_life: '', image_url: '' };
    if (newSecType === 'steps') defaultContent = [];

    const newSec = {
      id,
      title: newSecTitle,
      type: newSecType,
      content: defaultContent
    };
    setCustomSections([...customSections, newSec]);
    setNewSecTitle('');
  };

  const deleteCustomSection = (id: string) => {
    setCustomSections(customSections.filter(s => s.id !== id));
  };

  // Section Content Editor updates
  const updateSectionContent = (secId: string, newContent: any) => {
    setCustomSections(customSections.map(sec => {
      if (sec.id === secId) {
        return { ...sec, content: newContent };
      }
      return sec;
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const payload = {
        name,
        slug,
        master_sku: sku || null,
        price: parseFloat(price) || 0,
        compare_price: comparePrice ? parseFloat(comparePrice) : null,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        category_id: catId || null,
        brand_id: brandId || null,
        status,
        description: desc || null,
        short_desc: shortDesc || null,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        gallery,
        faqs,
        custom_sections: customSections
      };
      
      // Call API directly so we can reload fresh data after save
      await catalogApi.updateProduct(productId, payload);
      
      // Reload from server to show fresh saved state
      await loadProduct();
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save changes:', err);
      setSaveStatus('error');
    }
  };

  if (loadingDetails) {
    return <LoadingSpinner message="Loading product information..." />;
  }

  return (
    <>
      <header className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button className="btn-ghost-sm" onClick={onBack} style={{ padding: '8px 12px' }}>
            <Icons.ArrowLeft /> Back
          </button>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {name || 'Edit Product'}
              <Badge type={status === 'active' ? 'success' : 'warn'}>
                {status.toUpperCase()}
              </Badge>
            </h2>
            <p className="header-sub">Configure details, custom layout tabs, media, and FAQs</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--m-primary)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Check /> Changes saved!
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.85rem' }}>
              Failed to save changes.
            </span>
          )}
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saveStatus === 'saving'}
            style={{ padding: '10px 24px' }}
          >
            {saveStatus === 'saving' ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Tabs Menu Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--m-border)',
        marginBottom: 30,
        paddingBottom: 4
      }}>
        {(['general', 'media', 'seo', 'faqs', 'sections', 'variants'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? 'var(--m-primary-light)' : 'transparent',
              color: activeTab === tab ? 'var(--m-primary)' : 'var(--m-text-muted)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--m-primary)' : 'none',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab === 'seo' ? 'SEO' : tab === 'sections' ? 'Custom Tabs' : tab === 'variants' ? '📦 Variants & Stock' : tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Main Work Area based on active tab */}
        <div className="card" style={{ minHeight: 450 }}>
          
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="form-grid">
              <h3 className="card-title">General Product Details</h3>
              <div className="form-row">
                <div className="field-group">
                  <label>Product Name *</label>
                  <input required value={name} onChange={e => handleNameChange(e.target.value)} />
                </div>
                <div className="field-group">
                  <label>URL Slug (slug)</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Price (INR) *</label>
                  <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Compare Price (INR)</label>
                  <input type="number" step="0.01" value={comparePrice} onChange={e => setComparePrice(e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Cost Price (INR)</label>
                  <input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Master SKU</label>
                  <input value={sku} onChange={e => setSku(e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Category</label>
                  <select value={catId} onChange={e => setCatId(e.target.value)}>
                    <option value="">— Select Category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label>Brand</label>
                  <select value={brandId} onChange={e => setBrandId(e.target.value)}>
                    <option value="">— Select Brand —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label>Short Description (Renders on catalog cards)</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2} placeholder="Brief summary of product benefits..." />
              </div>

              <div className="field-group">
                <label>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6} placeholder="Detailed product specifications..." />
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA GALLERY */}
          {activeTab === 'media' && (
            <div>
              <h3 className="card-title">Media & Gallery Manager</h3>
              
              {/* Add image form */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--m-border)',
                padding: 20,
                borderRadius: 8,
                marginBottom: 30
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem' }}>Add Image to Gallery</h4>
                <div style={{ display: 'flex', gap: 15, alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Image URL</label>
                    <input 
                      value={newImageUrl} 
                      onChange={e => setNewImageUrl(e.target.value)} 
                      placeholder="https://images.unsplash.com/photo-..." 
                      style={{ padding: 10, borderRadius: 6, border: '1px solid var(--m-border)' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alt Text (Optional)</label>
                    <input 
                      value={newAltText} 
                      onChange={e => setNewAltText(e.target.value)} 
                      placeholder="e.g. Lavender oil bottle" 
                      style={{ padding: 10, borderRadius: 6, border: '1px solid var(--m-border)' }}
                    />
                  </div>
                  <button className="btn-primary" onClick={addGalleryImage} style={{ padding: '11px 24px' }}>
                    <Icons.Plus /> Add Image
                  </button>
                </div>
              </div>

              {/* Gallery List */}
              <h4 style={{ fontSize: '1rem', marginBottom: 15 }}>Product Images ({gallery.length})</h4>
              {gallery.length === 0 ? (
                <p style={{ color: 'var(--m-text-muted)', fontSize: '0.9rem' }}>No gallery images added yet. Add an image URL above to represent this product.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                  {gallery.map((g, idx) => (
                    <div key={g.id || idx} style={{
                      border: '1px solid var(--m-border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}>
                      <div style={{ height: 140, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={g.url} 
                          alt={g.alt_text || 'Product image'} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&w=400&q=80'; }}
                        />
                      </div>
                      
                      {g.is_cover && (
                        <span style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'var(--m-primary)',
                          color: '#FFFFFF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          Cover
                        </span>
                      )}

                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--m-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.alt_text || 'No Alt Text'}
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            className="btn-ghost-sm" 
                            onClick={() => setCoverImage(g.id)} 
                            disabled={g.is_cover}
                            style={{ flex: 1, fontSize: '0.75rem', padding: '4px 6px' }}
                          >
                            Set Cover
                          </button>
                          <button 
                            className="btn-danger-sm" 
                            onClick={() => deleteGalleryImage(g.id)}
                            style={{ padding: '4px 8px' }}
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEO METADATA */}
          {activeTab === 'seo' && (
            <div className="form-grid">
              <h3 className="card-title">Search Engine Optimization (SEO)</h3>
              <p style={{ color: 'var(--m-text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                Configure title tags and descriptions for Google and social sharing, increasing discoverability.
              </p>
              
              <div className="field-group">
                <label>Meta Title</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={name || "SEO Title"} />
              </div>

              <div className="field-group">
                <label>Meta Description</label>
                <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} rows={4} placeholder="Summary for search engine description..." />
              </div>
            </div>
          )}

          {/* TAB 4: FAQ MANAGER */}
          {activeTab === 'faqs' && (
            <div>
              <h3 className="card-title">FAQ Manager</h3>
              
              {/* Add FAQ Form */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--m-border)',
                padding: 20,
                borderRadius: 8,
                marginBottom: 30
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem' }}>Add Frequently Asked Question</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div className="field-group" style={{ margin: 0 }}>
                    <label>Question</label>
                    <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="e.g. How often should I use this?" />
                  </div>
                  <div className="field-group" style={{ margin: 0 }}>
                    <label>Answer</label>
                    <textarea value={newAnswer} onChange={e => setNewAnswer(e.target.value)} rows={2} placeholder="e.g. Apply twice daily..." />
                  </div>
                  <button className="btn-primary" onClick={addFaq} style={{ alignSelf: 'flex-start' }}>
                    <Icons.Plus /> Add FAQ
                  </button>
                </div>
              </div>

              {/* FAQ List */}
              <h4 style={{ fontSize: '1rem', marginBottom: 15 }}>Frequently Asked Questions ({faqs.length})</h4>
              {faqs.length === 0 ? (
                <p style={{ color: 'var(--m-text-muted)', fontSize: '0.9rem' }}>No FAQs added to this product yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  {faqs.map((faq, idx) => (
                    <div key={faq.id || idx} style={{
                      border: '1px solid var(--m-border)',
                      padding: 18,
                      borderRadius: 8,
                      background: '#FFFFFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      gap: 15
                    }}>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600 }}>{faq.question}</h5>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--m-text-muted)', lineHeight: 1.5 }}>{faq.answer}</p>
                      </div>
                      <button 
                        className="btn-danger-sm" 
                        onClick={() => deleteFaq(faq.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CUSTOM LAYOUT SECTIONS */}
          {activeTab === 'sections' && (
            <div>
              <h3 className="card-title">Custom storefront Tabs Builder</h3>
              <p style={{ color: 'var(--m-text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                Build customized information blocks (like Ingredients card grids, usage step directions, or bulleted benefit lists) which render dynamically on the storefront product page.
              </p>

              {/* Add Custom Section Form */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--m-border)',
                padding: 20,
                borderRadius: 8,
                marginBottom: 30
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem' }}>Create New Custom Tab / Section</h4>
                <div style={{ display: 'flex', gap: 15, alignItems: 'flex-end' }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tab Title</label>
                    <input 
                      value={newSecTitle} 
                      onChange={e => setNewSecTitle(e.target.value)} 
                      placeholder="e.g. Active Ingredients" 
                      style={{ padding: 10, borderRadius: 6, border: '1px solid var(--m-border)' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Display Type</label>
                    <select 
                      value={newSecType} 
                      onChange={e => setNewSecType(e.target.value as any)}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid var(--m-border)' }}
                    >
                      <option value="bullets">Bullets List (Benefits)</option>
                      <option value="cards">Card Grid (Ingredients)</option>
                      <option value="details">Details Card (Additional Info)</option>
                      <option value="steps">Step-by-Step (Usage)</option>
                    </select>
                  </div>
                  <button className="btn-primary" onClick={addCustomSection} style={{ padding: '11px 24px' }}>
                    <Icons.Plus /> Add Section
                  </button>
                </div>
              </div>

              {/* Custom Sections Builder Grid */}
              <h4 style={{ fontSize: '1rem', marginBottom: 15 }}>Product Details Tabs ({customSections.length})</h4>
              {customSections.length === 0 ? (
                <p style={{ color: 'var(--m-text-muted)', fontSize: '0.9rem' }}>No custom tab sections defined yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                  {customSections.map((sec, secIdx) => (
                    <div key={sec.id || secIdx} style={{
                      border: '1px solid var(--m-border)',
                      borderRadius: 10,
                      background: '#FFFFFF',
                      overflow: 'hidden'
                    }}>
                      {/* Section Header bar */}
                      <div style={{
                        background: '#F1F5F9',
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--m-border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sec.title}</span>
                          <span style={{
                            background: 'var(--m-primary-light)',
                            color: 'var(--m-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 4
                          }}>
                            {sec.type.toUpperCase()}
                          </span>
                        </div>
                        <button 
                          className="btn-danger-sm" 
                          onClick={() => deleteCustomSection(sec.id)}
                          style={{ padding: '5px 8px' }}
                        >
                          <Icons.Trash />
                        </button>
                      </div>

                      {/* Section Content Editor Block */}
                      <div style={{ padding: 20 }}>
                        
                        {/* 1. BULLETS TYPE EDITOR */}
                        {sec.type === 'bullets' && (
                          <SectionBulletsEditor 
                            content={sec.content || []} 
                            onChange={(newContent) => updateSectionContent(sec.id, newContent)} 
                          />
                        )}

                        {/* 2. CARDS TYPE EDITOR */}
                        {sec.type === 'cards' && (
                          <SectionCardsEditor 
                            content={sec.content || []} 
                            onChange={(newContent) => updateSectionContent(sec.id, newContent)} 
                          />
                        )}

                        {/* 3. DETAILS TYPE EDITOR */}
                        {sec.type === 'details' && (
                          <SectionDetailsEditor 
                            content={sec.content || {}} 
                            onChange={(newContent) => updateSectionContent(sec.id, newContent)} 
                          />
                        )}

                        {/* 4. STEPS TYPE EDITOR */}
                        {sec.type === 'steps' && (
                          <SectionStepsEditor 
                            content={sec.content || []} 
                            onChange={(newContent) => updateSectionContent(sec.id, newContent)} 
                          />
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Tab-scoped Sidebar Information Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title">Quick Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Storefront URL:</span>
                <a 
                  href={`http://${window.location.hostname.split('.')[0]}.localhost:3000/products/${slug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: 'var(--m-primary)', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  /products/{slug} <Icons.ExternalLink />
                </a>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Product ID:</span>
                <code style={{ fontSize: '0.75rem' }}>{productId}</code>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Inventory items:</span>
                <span style={{ fontWeight: 600 }}>{product?.variants?.length || 0} variant sizes listed</span>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>Media Count:</span>
                <span style={{ fontWeight: 600 }}>{gallery.length} Images</span>
              </div>
              <div>
                <span style={{ color: 'var(--m-text-muted)', display: 'block' }}>FAQs count:</span>
                <span style={{ fontWeight: 600 }}>{faqs.length} Q&As</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TAB 6: VARIANTS & STOCK — full width, no sidebar */}
      {activeTab === 'variants' && (
        <div className="card" style={{ marginTop: 0 }}>
          <VariantsStockTab productId={productId} />
        </div>
      )}
    </>
  );
};

// ─── NESTED SECTION EDITORS ──────────────────────────────────────────────────

// 1. Bullets (Key Benefits) Editor
interface BulletsEditorProps {
  content: string[];
  onChange: (content: string[]) => void;
}
const SectionBulletsEditor: React.FC<BulletsEditorProps> = ({ content, onChange }) => {
  const [newBullet, setNewBullet] = useState('');

  const addBullet = () => {
    if (!newBullet) return;
    onChange([...content, newBullet]);
    setNewBullet('');
  };

  const removeBullet = (index: number) => {
    onChange(content.filter((_, idx) => idx !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <input 
          value={newBullet} 
          onChange={e => setNewBullet(e.target.value)} 
          placeholder="e.g. Handcrafted using organic plant oils" 
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem' }}
        />
        <button className="btn-primary" onClick={addBullet} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
          Add Benefit
        </button>
      </div>

      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {content.map((bullet, idx) => (
          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--m-text-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>✔ {bullet}</span>
              <button 
                onClick={() => removeBullet(idx)} 
                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 2. Cards (Ingredients) Editor
interface CardsEditorProps {
  content: any[];
  onChange: (content: any[]) => void;
}
const SectionCardsEditor: React.FC<CardsEditorProps> = ({ content, onChange }) => {
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cImg, setCImg] = useState('');

  const addCard = () => {
    if (!cName || !cDesc) return;
    onChange([...content, { name: cName, description: cDesc, image_url: cImg || null }]);
    setCName('');
    setCDesc('');
    setCImg('');
  };

  const removeCard = (index: number) => {
    onChange(content.filter((_, idx) => idx !== index));
  };

  return (
    <div>
      <div style={{
        background: '#F8FAFC',
        border: '1px dashed var(--m-border)',
        padding: 15,
        borderRadius: 6,
        marginBottom: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input 
            value={cName} 
            onChange={e => setCName(e.target.value)} 
            placeholder="Ingredient Name (e.g. Tea Tree Oil)" 
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem' }}
          />
          <input 
            value={cImg} 
            onChange={e => setCImg(e.target.value)} 
            placeholder="Image URL (Optional)" 
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem' }}
          />
        </div>
        <textarea 
          value={cDesc} 
          onChange={e => setCDesc(e.target.value)} 
          placeholder="Ingredient benefits & description..." 
          rows={2}
          style={{ padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
        />
        <button className="btn-primary" onClick={addCard} style={{ alignSelf: 'flex-start', fontSize: '0.85rem', padding: '8px 16px' }}>
          Add Ingredient Card
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
        {content.map((card, idx) => (
          <div key={idx} style={{
            border: '1px solid var(--m-border)',
            borderRadius: 6,
            overflow: 'hidden',
            background: '#FFFFFF',
            position: 'relative'
          }}>
            {card.image_url ? (
              <img src={card.image_url} alt={card.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
            ) : (
              <div style={{ height: 100, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>☘</div>
            )}
            <div style={{ padding: 10 }}>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 700 }}>{card.name}</h5>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--m-text-muted)', lineHeight: 1.4 }}>{card.description}</p>
            </div>
            <button 
              onClick={() => removeCard(idx)} 
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '4px 6px',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Details Editor
interface DetailsEditorProps {
  content: any;
  onChange: (content: any) => void;
}
const SectionDetailsEditor: React.FC<DetailsEditorProps> = ({ content, onChange }) => {
  const [freq, setFreq] = useState(content.frequency || '');
  const [follow, setFollow] = useState(content.follow_up || '');
  const [shelf, setShelf] = useState(content.shelf_life || '');
  const [imgUrl, setImgUrl] = useState(content.image_url || '');
  const [results, setResults] = useState<string[]>(content.results || []);
  const [newResult, setNewResult] = useState('');

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...content,
      frequency: field === 'freq' ? value : freq,
      follow_up: field === 'follow' ? value : follow,
      shelf_life: field === 'shelf' ? value : shelf,
      image_url: field === 'imgUrl' ? value : imgUrl,
      results: field === 'results' ? value : results
    });
  };

  const addResult = () => {
    if (!newResult) return;
    const updated = [...results, newResult];
    setResults(updated);
    setNewResult('');
    handleFieldChange('results', updated);
  };

  const removeResult = (idxToRemove: number) => {
    const updated = results.filter((_, idx) => idx !== idxToRemove);
    setResults(updated);
    handleFieldChange('results', updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <div className="field-group" style={{ margin: 0 }}>
          <label>Ideal Frequency</label>
          <input 
            value={freq} 
            onChange={e => { setFreq(e.target.value); handleFieldChange('freq', e.target.value); }} 
            placeholder="e.g. Twice daily (Morning & Evening)" 
          />
        </div>
        <div className="field-group" style={{ margin: 0 }}>
          <label>Follow-up Skin Tips</label>
          <input 
            value={follow} 
            onChange={e => { setFollow(e.target.value); handleFieldChange('follow', e.target.value); }} 
            placeholder="e.g. Apply sunscreen after morning application" 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <div className="field-group" style={{ margin: 0 }}>
          <label>Storage / Warnings</label>
          <input 
            value={shelf} 
            onChange={e => { setShelf(e.target.value); handleFieldChange('shelf', e.target.value); }} 
            placeholder="e.g. Store in a cool dry place. Shelf life 12M" 
          />
        </div>
        <div className="field-group" style={{ margin: 0 }}>
          <label>Visual Side Image URL</label>
          <input 
            value={imgUrl} 
            onChange={e => { setImgUrl(e.target.value); handleFieldChange('imgUrl', e.target.value); }} 
            placeholder="e.g. https://images.unsplash.com/..." 
          />
        </div>
      </div>

      <div style={{
        background: '#F8FAFC',
        border: '1px solid var(--m-border)',
        padding: 15,
        borderRadius: 6
      }}>
        <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>Expected Results Checklist</h5>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input 
            value={newResult} 
            onChange={e => setNewResult(e.target.value)} 
            placeholder="e.g. Redness reduced in 24 hours" 
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem' }}
          />
          <button className="btn-primary" onClick={addResult} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Add Expected Result
          </button>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {results.map((res, idx) => (
            <li key={idx} style={{ fontSize: '0.85rem', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{res}</span>
                <button 
                  onClick={() => removeResult(idx)} 
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// 4. Steps (Usage Steps) Editor
interface StepsEditorProps {
  content: any[];
  onChange: (content: any[]) => void;
}
const SectionStepsEditor: React.FC<StepsEditorProps> = ({ content, onChange }) => {
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');

  const addStep = () => {
    if (!sTitle || !sDesc) return;
    const nextStepNum = content.length + 1;
    onChange([...content, { step: nextStepNum, title: sTitle, description: sDesc }]);
    setSTitle('');
    setSDesc('');
  };

  const removeStep = (stepNum: number) => {
    const remaining = content.filter(s => s.step !== stepNum);
    // Re-index steps sequentially
    const updated = remaining.map((s, idx) => ({
      ...s,
      step: idx + 1
    }));
    onChange(updated);
  };

  return (
    <div>
      <div style={{
        background: '#F8FAFC',
        border: '1px dashed var(--m-border)',
        padding: 15,
        borderRadius: 6,
        marginBottom: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <input 
          value={sTitle} 
          onChange={e => setSTitle(e.target.value)} 
          placeholder="Step Title (e.g. Wash your face)" 
          style={{ padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem' }}
        />
        <textarea 
          value={sDesc} 
          onChange={e => setSDesc(e.target.value)} 
          placeholder="Instructions and details about this application step..." 
          rows={2}
          style={{ padding: 8, borderRadius: 6, border: '1px solid var(--m-border)', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
        />
        <button className="btn-primary" onClick={addStep} style={{ alignSelf: 'flex-start', fontSize: '0.85rem', padding: '8px 16px' }}>
          Add Step
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {content.map((step, idx) => (
          <div key={idx} style={{
            border: '1px solid var(--m-border)',
            padding: 12,
            borderRadius: 6,
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 15
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div style={{
                background: 'var(--m-primary)',
                color: '#FFFFFF',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {step.step}
              </div>
              <div>
                <h6 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 700 }}>{step.title}</h6>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>{step.description}</p>
              </div>
            </div>
            <button 
              onClick={() => removeStep(step.step)}
              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

