import React, { useState, useEffect } from 'react';
import { Icons } from '../../icons';
import { catalogApi } from '../../../../lib/api-client';

interface AddProductPageProps {
  categories: any[];
  brands: any[];
  onCreateProduct: (data: any) => Promise<void>;
  creating: boolean;
  onBack: () => void;
}

type TabType = 
  | 'general'
  | 'pricing'
  | 'media'
  | 'inventory'
  | 'variants'
  | 'shipping'
  | 'seo'
  | 'marketing'
  | 'faq'
  | 'reviews'
  | 'supplier'
  | 'advanced';

// Curated stunning botanical/skincare product mock presets (Unsplash)
const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=600&q=80', alt: 'Organic Face Serum' },
  { url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80', alt: 'Botanical Cleansing Oil' },
  { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', alt: 'Clay Face Mask Jar' },
  { url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80', alt: 'Hydrating Face Toner' },
  { url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80', alt: 'Essential Herbs Elixir' },
  { url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', alt: 'Nourishing Shea Butter' },
];

export const AddProductPage: React.FC<AddProductPageProps> = ({
  categories,
  brands,
  onCreateProduct,
  creating,
  onBack,
}) => {
  // Tabs state
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Form states - General
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [label, setLabel] = useState(''); // Sale, New, Hot, etc.

  // Form states - Pricing
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxId, setTaxId] = useState('');
  const [hsnCode, setHsnCode] = useState('');

  // Form states - Media (Gallery / Video)
  const [gallery, setGallery] = useState<any[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualImageAlt, setManualImageAlt] = useState('');

  // Form states - Inventory
  const [sku, setSku] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQty, setStockQty] = useState('100');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [allowBackorders, setAllowBackorders] = useState(false);

  // Form states - Variants Builder
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<any[]>([
    { name: 'Size', values: ['S', 'M', 'L'] },
  ]);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  // Form states - Shipping
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  // Form states - SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  // Form states - Marketing & Controls
  const [isFeatured, setIsFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [trending, setTrending] = useState(false);
  const [flashSale, setFlashSale] = useState(false);
  const [dealOfTheDay, setDealOfTheDay] = useState(false);
  const [recommended, setRecommended] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Form states - FAQ
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Form states - Reviews
  const [enableReviews, setEnableReviews] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Form states - Supplier
  const [supplierName, setSupplierName] = useState('');
  const [supplierCost, setSupplierCost] = useState('');
  const [supplierLink, setSupplierLink] = useState('');

  // Form states - Advanced
  const [sortOrder, setSortOrder] = useState('0');
  const [visibility, setVisibility] = useState('visible');
  const [isDigital, setIsDigital] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadLimit, setDownloadLimit] = useState('');
  const [licenseKey, setLicenseKey] = useState('');

  // Form states - Collections and Custom Specifications
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const [formError, setFormError] = useState('');

  // Load collections
  useEffect(() => {
    catalogApi.getCollections().then((cols) => {
      setCollectionsList(cols || []);
    }).catch(err => console.error('Error fetching collections:', err));
  }, []);

  // Dynamically update slug and meta title based on product name
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
      setMetaTitle(`${name} | Nature Glow`);
      setOgTitle(`${name} | Buy Online`);
    } else {
      setSlug('');
      setMetaTitle('');
      setOgTitle('');
    }
  }, [name]);

  // Generate unique SKU
  const handleAutoGenerateSku = () => {
    if (!name) {
      alert('Please enter a product name first to generate a SKU.');
      return;
    }
    const clean = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const prefix = clean.substring(0, 8) || 'SKU';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setSku(`${prefix}-${randomSuffix}`);
  };

  // Drag & drop file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await catalogApi.uploadFile(file);
        results.push(res);
      }
      
      const newImages = results.map((r, idx) => ({
        id: Math.random().toString(),
        url: r.url,
        alt_text: files[idx].name.split('.')[0],
        sort_order: gallery.length + idx,
        is_cover: gallery.length === 0 && idx === 0,
      }));
      
      setGallery(prev => [...prev, ...newImages]);
    } catch (err: any) {
      console.error('File upload failed:', err);
      alert('File upload failed. Please ensure the backend is running and static directory is enabled.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add mock preset skincare image
  const addPresetImage = (preset: typeof PRESET_IMAGES[0]) => {
    const isFirst = gallery.length === 0;
    const newImg = {
      id: Math.random().toString(),
      url: preset.url,
      alt_text: preset.alt,
      sort_order: gallery.length,
      is_cover: isFirst
    };
    setGallery([...gallery, newImg]);
  };

  // Add image by manual URL
  const addImageUrl = () => {
    if (!manualImageUrl) return;
    const isFirst = gallery.length === 0;
    const newImg = {
      id: Math.random().toString(),
      url: manualImageUrl,
      alt_text: manualImageAlt || 'Product image',
      sort_order: gallery.length,
      is_cover: isFirst
    };
    setGallery([...gallery, newImg]);
    setManualImageUrl('');
    setManualImageAlt('');
  };

  const deleteGalleryImage = (id: string) => {
    const updated = gallery.filter(g => g.id !== id);
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

  // Dynamic variants auto-generator
  useEffect(() => {
    if (!hasVariants) {
      setGeneratedVariants([]);
      return;
    }
    
    // Compute cartesian product of option values
    const optionsWithValues = variantOptions.filter(opt => opt.name.trim() && opt.values.length > 0);
    if (optionsWithValues.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>((a, b) => {
        return a.flatMap(d => b.map(e => [d, e].flat()));
      }, [[]]);
    };

    const valueCombinations = cartesian(optionsWithValues.map(o => o.values));
    const newVariants = valueCombinations.map((combo, idx) => {
      const labelStr = combo.join(' / ');
      const skuSuffix = combo.join('-').toUpperCase();
      
      // Preserve existing configurations if label is identical
      const existing = generatedVariants.find(v => v.label === labelStr);
      return existing || {
        id: `temp-var-${idx}`,
        label: labelStr,
        sku: sku ? `${sku}-${skuSuffix}` : `VAR-${idx}-${Math.floor(100 + Math.random() * 900)}`,
        barcode: '',
        price: price || '0.00',
        compare_price: comparePrice || '',
        cost_price: costPrice || '',
        stock_qty: stockQty || '100',
        track_inventory: true,
        weight: weight || '',
        image_url: gallery[0]?.url || '',
        is_active: true,
        attributes: optionsWithValues.map((o, optIdx) => ({
          attr_key: o.name,
          attr_value: combo[optIdx],
          sort_order: optIdx
        }))
      };
    });

    setGeneratedVariants(newVariants);
  }, [hasVariants, variantOptions, sku, price, comparePrice, costPrice, stockQty, weight, gallery]);

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, { name: '', values: [] }]);
  };

  const removeVariantOption = (idx: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== idx));
  };

  const updateOptionName = (idx: number, name: string) => {
    const updated = [...variantOptions];
    updated[idx].name = name;
    setVariantOptions(updated);
  };

  const handleValuesKeyPress = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (!val) return;
      
      const updated = [...variantOptions];
      if (!updated[idx].values.includes(val)) {
        updated[idx].values.push(val);
      }
      setVariantOptions(updated);
      e.currentTarget.value = '';
    }
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    const updated = [...variantOptions];
    updated[optIdx].values = updated[optIdx].values.filter((_: any, i: any) => i !== valIdx);
    setVariantOptions(updated);
  };

  const updateVariantField = (varId: string, field: string, val: any) => {
    setGeneratedVariants(prev => prev.map(v => {
      if (v.id === varId) {
        return { ...v, [field]: val };
      }
      return v;
    }));
  };

  // Specification helpers
  const addSpecification = () => {
    if (!newSpecName.trim() || !newSpecValue.trim()) return;
    setSpecifications([...specifications, {
      id: Math.random().toString(),
      name: newSpecName.trim(),
      value: newSpecValue.trim(),
      sort_order: specifications.length
    }]);
    setNewSpecName('');
    setNewSpecValue('');
  };

  const removeSpecification = (id: string) => {
    setSpecifications(specifications.filter(s => s.id !== id && s.name !== id));
  };

  // FAQ helpers
  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs([...faqs, { question: newQuestion.trim(), answer: newAnswer.trim(), sort_order: faqs.length }]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) return setFormError('Product Name is required.');
    if (!price || parseFloat(price) <= 0) return setFormError('Pricing must be a positive number.');

    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || null,
      short_desc: shortDesc.trim() || null,
      category_id: categoryId || null,
      brand_id: brandId || null,
      label: label || null,
      
      // Pricing
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      cost_price: costPrice ? parseFloat(costPrice) : null,
      hsn_code: hsnCode || null,

      // Inventory
      master_sku: sku.trim() || null,
      track_inventory: trackInventory,
      stock_qty: trackInventory ? parseInt(stockQty) || 0 : 0,
      low_stock_at: parseInt(lowStockThreshold) || 5,
      allow_backorders: allowBackorders,

      // Shipping
      weight: weight ? parseFloat(weight) : null,
      length: length ? parseFloat(length) : null,
      width: width ? parseFloat(width) : null,
      height: height ? parseFloat(height) : null,

      // SEO
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      seo_keywords: seoKeywords || null,
      canonical_url: canonicalUrl || null,
      og_title: ogTitle || null,
      og_description: ogDescription || null,
      og_image: ogImage || gallery[0]?.url || null,

      // Marketing
      is_featured: isFeatured,
      best_seller: bestSeller,
      new_arrival: newArrival,
      trending: trending,
      flash_sale: flashSale,
      deal_of_the_day: dealOfTheDay,
      recommended: recommended,
      recently_added: recentlyAdded,
      product_tags: cleanTags,

      // FAQ
      faqs,

      // Review configurations
      enable_reviews: enableReviews,
      verified_only: verifiedOnly,

      // Supplier
      supplier_name: supplierName || null,
      supplier_cost: supplierCost ? parseFloat(supplierCost) : null,
      supplier_link: supplierLink || null,

      // Advanced
      sort_order: parseInt(sortOrder) || 0,
      visibility,
      is_digital: isDigital,
      download_url: isDigital ? downloadUrl : null,
      download_limit: isDigital && downloadLimit ? parseInt(downloadLimit) : null,
      license_key: isDigital ? licenseKey : null,

      // Media / Images relations
      youtube_url: youtubeUrl.trim() || null,
      gallery,
      variants: hasVariants ? generatedVariants : [],
      collections: selectedCollections,
      specifications
    };

    try {
      await onCreateProduct(payload);
      onBack();
    } catch (err: any) {
      setFormError(err.message || 'Failed to publish product. Ensure database schema integrity.');
      setActiveTab('general');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>
      <style>{`
        .tabbed-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 30px;
          margin-top: 24px;
        }
        @media (max-width: 900px) {
          .tabbed-layout {
            grid-template-columns: 1fr;
          }
        }
        .sidebar-tabs {
          background: #ffffff;
          border: 1px solid var(--m-border, #E5E7EB);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          height: fit-content;
          box-shadow: 0 4px 15px rgba(0,0,0,0.015);
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: var(--m-text-muted, #4B5563);
          font-weight: 600;
          font-size: 0.9rem;
          text-align: left;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .tab-btn:hover {
          background: #F3F4F6;
          color: var(--m-text-main, #111827);
        }
        .tab-btn.active {
          background: var(--m-primary-light, #EEF2FF);
          color: var(--m-primary, #4F46E5);
        }
        .tab-panel-card {
          background: #ffffff;
          border: 1px solid var(--m-border, #E5E7EB);
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          min-height: 500px;
        }
        .panel-header {
          border-bottom: 1px solid #F3F4F6;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .panel-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--m-text-main, #111827);
        }
        .panel-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.85rem;
          color: var(--m-text-muted, #6B7280);
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 600px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 700px) {
          .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }
        .input-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--m-text-main, #374151);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .styled-input, .styled-select, .styled-textarea {
          width: 100%;
          padding: 11px 15px;
          border: 1.5px solid var(--m-border, #E5E7EB);
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
          color: #111827;
          background: #ffffff;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .styled-input:focus, .styled-select:focus, .styled-textarea:focus {
          border-color: var(--m-primary, #4F46E5);
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
        }
        .drag-drop-box {
          border: 2px dashed var(--m-border, #E5E7EB);
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          background: #FAFBFC;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
          position: relative;
        }
        .drag-drop-box:hover {
          border-color: var(--m-primary, #4F46E5);
          background: #F5F7FF;
        }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F3F4F6;
          color: #374151;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          cursor: pointer;
        }
        .checkbox-row input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .checkbox-row label {
          font-size: 0.88rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }
      `}</style>

      {/* Top action header panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost-sm" onClick={onBack} style={{ padding: 8, borderRadius: '50%' }}>
            <Icons.ArrowLeft />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Create New Product</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Add a highly customized Shopify-standard product to your store</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost-sm" onClick={onBack}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={creating}>
            {creating ? 'Publishing...' : 'Publish Product'}
          </button>
        </div>
      </div>

      {formError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, marginBottom: 20 }}>
          ⚠️ {formError}
        </div>
      )}

      {/* Main tabbed work area */}
      <div className="tabbed-layout">
        
        {/* Left Side: Tabs List Navigation */}
        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            General
          </button>
          <button className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Pricing
          </button>
          <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            Media &amp; Presets
          </button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><line x1="2" y1="20" x2="22" y2="20"></line></svg>
            Inventory
          </button>
          <button className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`} onClick={() => setActiveTab('variants')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12C22 6.5 17.52 2 12 2C6.5 2 2 6.5 2 12C2 17.52 6.5 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1" fill="currentColor"></circle><circle cx="16.5" cy="9.5" r="1" fill="currentColor"></circle><circle cx="15.5" cy="14.5" r="1" fill="currentColor"></circle></svg>
            Variants
          </button>
          <button className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`} onClick={() => setActiveTab('shipping')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            Shipping
          </button>
          <button className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            SEO &amp; Snippets
          </button>
          <button className={`tab-btn ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => setActiveTab('marketing')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8z"></path><path d="M18 8l4-4v16l-4-4"></path></svg>
            Marketing Controls
          </button>
          <button className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`} onClick={() => setActiveTab('faq')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            FAQs
          </button>
          <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Reviews Config
          </button>
          <button className={`tab-btn ${activeTab === 'supplier' ? 'active' : ''}`} onClick={() => setActiveTab('supplier')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 21H2V3l10 4 10-4v18z"></path><path d="M12 7v14"></path></svg>
            Supplier
          </button>
          <button className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Advanced Settings
          </button>
        </div>

        {/* Right Side: Active Form Panel */}
        <div className="tab-panel-card">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">General Information</h3>
                <p className="panel-subtitle">Configure basic titles, descriptors, categories, and custom badges.</p>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Product Title *</label>
                <input
                  required
                  type="text"
                  className="styled-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Lavender Hydrating Cleanser"
                />
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">URL Slug Handle</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="e.g. lavender-hydrating-cleanser"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Product Badge/Label</label>
                  <select className="styled-select" value={label} onChange={e => setLabel(e.target.value)}>
                    <option value="">No Label</option>
                    <option value="Sale">Sale</option>
                    <option value="Hot">Hot</option>
                    <option value="New">New</option>
                    <option value="Limited">Limited</option>
                    <option value="Exclusive">Exclusive</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">Category</label>
                  <select className="styled-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">— Select Category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Brand</label>
                  <select className="styled-select" value={brandId} onChange={e => setBrandId(e.target.value)}>
                    <option value="">— Select Brand —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Short Description (renders on catalog layout cards)</label>
                <textarea
                  className="styled-textarea"
                  rows={2}
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                  placeholder="Summarize key features in 1-2 lines..."
                />
              </div>

              <div className="input-wrapper" style={{ marginBottom: 0 }}>
                <label className="input-label">Detailed Description</label>
                <textarea
                  className="styled-textarea"
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain benefits, ingredients, and application instructions in detail..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRICING */}
          {activeTab === 'pricing' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Pricing &amp; Taxes</h3>
                <p className="panel-subtitle">Manage base retail rates, compare-at pricing, cost pricing, and tax codes.</p>
              </div>

              <div className="form-grid-3">
                <div className="input-wrapper">
                  <label className="input-label">Price (INR) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="styled-input"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 399.00"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Compare Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="styled-input"
                    value={comparePrice}
                    onChange={e => setComparePrice(e.target.value)}
                    placeholder="e.g. 599.00"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Cost Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="styled-input"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    placeholder="e.g. 150.00"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper" style={{ marginBottom: 0 }}>
                  <label className="input-label">HSN Code (India GST Sourcing)</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={hsnCode}
                    onChange={e => setHsnCode(e.target.value)}
                    placeholder="e.g. 33049910"
                  />
                </div>
                <div className="input-wrapper" style={{ marginBottom: 0 }}>
                  <label className="input-label">GST Tax Bracket</label>
                  <select className="styled-select" value={taxId} onChange={e => setTaxId(e.target.value)}>
                    <option value="">No Tax (0%)</option>
                    <option value="gst-5">GST 5%</option>
                    <option value="gst-12">GST 12%</option>
                    <option value="gst-18">GST 18% (Standard Cosmetics)</option>
                    <option value="gst-28">GST 28%</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & PRESETS */}
          {activeTab === 'media' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Product Media &amp; Image Gallery</h3>
                <p className="panel-subtitle">Upload multiple photos via drag &amp; drop, link YouTube product videos, or select gorgeous skincare mockup presets.</p>
              </div>

              {/* Real upload drag & drop area */}
              <div className="drag-drop-box" onClick={() => document.getElementById('media-upload-input')?.click()}>
                <input
                  type="file"
                  id="media-upload-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }}>☁️</span>
                <span style={{ fontWeight: 700, display: 'block', color: 'var(--m-primary)' }}>
                  {isUploading ? 'Uploading files...' : 'Drag & Drop Files Here or Click to Browse'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4, display: 'block' }}>Supports JPEG, PNG, WEBP formats</span>
              </div>

              {/* YouTube integration */}
              <div className="input-wrapper">
                <label className="input-label">Product YouTube Video URL</label>
                <input
                  type="text"
                  className="styled-input"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* Curated Botanical skincare mock presets library */}
              <div style={{ marginBottom: 30 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>🌟 Instant Premium Botanical Presets Catalog</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#6B7280' }}>Click on any premium botanical mockup image below to instantly populate your product gallery for demonstration testing:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => addPresetImage(preset)}
                      style={{ height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #E5E7EB', transition: 'all 0.2s' }}
                    >
                      <img src={preset.url} alt={preset.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual URL entry uploader */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 16, borderRadius: 10, marginBottom: 30 }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>Paste Image Web URL Fallback</h5>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="text"
                    style={{ flex: 2, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.85rem' }}
                    value={manualImageUrl}
                    onChange={e => setManualImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <input
                    type="text"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.85rem' }}
                    value={manualImageAlt}
                    onChange={e => setManualImageAlt(e.target.value)}
                    placeholder="Alt text"
                  />
                  <button type="button" className="btn-primary" onClick={addImageUrl} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Add</button>
                </div>
              </div>

              {/* Images list display */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 15px 0' }}>Uploaded Images ({gallery.length})</h4>
              {gallery.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No images uploaded yet. Upload a file above or pick a botanical preset to represent the product.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 15 }}>
                  {gallery.map((g, idx) => (
                    <div key={g.id || idx} style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#FFF', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: 100, background: '#F3F4F6' }}>
                        <img src={g.url} alt={g.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      
                      {g.is_cover && (
                        <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--m-primary)', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>Cover</span>
                      )}

                      <div style={{ padding: 8, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.alt_text || 'No description'}</p>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" className="btn-ghost-sm" onClick={() => setCoverImage(g.id)} disabled={g.is_cover} style={{ flex: 1, fontSize: '0.68rem', padding: '3px 0' }}>Cover</button>
                          <button type="button" className="btn-danger-sm" onClick={() => deleteGalleryImage(g.id)} style={{ padding: '3px 6px' }}><Icons.Trash /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === 'inventory' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Inventory Controls</h3>
                <p className="panel-subtitle">Manage catalog SKUs, stock levels, backorders, and tracking parameters.</p>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">Master SKU</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="e.g. LAV-HYD-100"
                  />
                  <button type="button" className="sku-suggest-btn" onClick={handleAutoGenerateSku}>
                    Suggest Unique SKU
                  </button>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Inventory Tracking</label>
                  <select className="styled-select" value={trackInventory ? 'true' : 'false'} onChange={e => setTrackInventory(e.target.value === 'true')}>
                    <option value="true">Track stock quantities</option>
                    <option value="false">Don't track quantities (Unlimited stock)</option>
                  </select>
                </div>
              </div>

              {trackInventory && (
                <div className="form-grid-2">
                  <div className="input-wrapper">
                    <label className="input-label">Initial Stock Quantity</label>
                    <input
                      type="number"
                      className="styled-input"
                      value={stockQty}
                      onChange={e => setStockQty(e.target.value)}
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div className="input-wrapper">
                    <label className="input-label">Low Stock Threshold Alert</label>
                    <input
                      type="number"
                      className="styled-input"
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              )}

              <div className="checkbox-row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  id="allowBackorders"
                  checked={allowBackorders}
                  onChange={e => setAllowBackorders(e.target.checked)}
                />
                <label htmlFor="allowBackorders">Allow customers to purchase when out-of-stock (Backorders)</label>
              </div>
            </div>
          )}

          {/* TAB 5: VARIANTS */}
          {activeTab === 'variants' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Product Variants</h3>
                <p className="panel-subtitle">Configure size, color, or weight attributes to generate unique SKU variations with pricing and stock levels.</p>
              </div>

              <div className="checkbox-row" style={{ marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="hasVariants"
                  checked={hasVariants}
                  onChange={e => setHasVariants(e.target.checked)}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="hasVariants" style={{ fontSize: '1rem' }}>This product has multiple options like different sizes or colors</label>
              </div>

              {hasVariants && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Option Settings</h4>
                  
                  {variantOptions.map((opt, optIdx) => (
                    <div key={optIdx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Option {optIdx + 1}</span>
                        <button type="button" className="btn-danger-sm" onClick={() => removeVariantOption(optIdx)} style={{ padding: '4px 8px' }}>
                          Remove Option
                        </button>
                      </div>
                      
                      <div className="form-grid-2">
                        <div className="input-wrapper" style={{ marginBottom: 0 }}>
                          <label className="input-label">Option Name</label>
                          <input
                            type="text"
                            className="styled-input"
                            value={opt.name}
                            onChange={e => updateOptionName(optIdx, e.target.value)}
                            placeholder="e.g. Size, Color, Weight"
                          />
                        </div>
                        <div className="input-wrapper" style={{ marginBottom: 0 }}>
                          <label className="input-label">Option Values (Type value and press Enter)</label>
                          <input
                            type="text"
                            className="styled-input"
                            onKeyDown={e => handleValuesKeyPress(optIdx, e)}
                            placeholder="e.g. Small, Medium, Large"
                          />
                        </div>
                      </div>

                      {/* Display added values */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                        {opt.values.map((v: string, valIdx: number) => (
                          <span key={valIdx} className="tag-pill">
                            {v}
                            <span 
                              onClick={() => removeOptionValue(optIdx, valIdx)}
                              style={{ color: '#EF4444', marginLeft: 4, cursor: 'pointer', fontWeight: 800 }}
                            >
                              ×
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button type="button" className="btn-ghost-sm" onClick={addVariantOption} style={{ padding: '8px 16px', marginBottom: 30 }}>
                    + Add Another Option type
                  </button>

                  {generatedVariants.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Configure Variations ({generatedVariants.length})</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#F3F4F6', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                              <th style={{ padding: 10 }}>Variant Label</th>
                              <th style={{ padding: 10 }}>SKU Override</th>
                              <th style={{ padding: 10 }}>Price (INR)</th>
                              <th style={{ padding: 10 }}>Stock Qty</th>
                              <th style={{ padding: 10 }}>Barcode</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedVariants.map((v, idx) => (
                              <tr key={v.id || idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: 10, fontWeight: 700 }}>{v.label}</td>
                                <td style={{ padding: 10 }}>
                                  <input 
                                    type="text" 
                                    className="styled-input" 
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                    value={v.sku}
                                    onChange={e => updateVariantField(v.id, 'sku', e.target.value)}
                                  />
                                </td>
                                <td style={{ padding: 10 }}>
                                  <input 
                                    type="number" 
                                    className="styled-input"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem', width: 90 }}
                                    value={v.price}
                                    onChange={e => updateVariantField(v.id, 'price', e.target.value)}
                                  />
                                </td>
                                <td style={{ padding: 10 }}>
                                  <input 
                                    type="number" 
                                    className="styled-input"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem', width: 70 }}
                                    value={v.stock_qty}
                                    onChange={e => updateVariantField(v.id, 'stock_qty', e.target.value)}
                                  />
                                </td>
                                <td style={{ padding: 10 }}>
                                  <input 
                                    type="text" 
                                    className="styled-input"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                    value={v.barcode}
                                    onChange={e => updateVariantField(v.id, 'barcode', e.target.value)}
                                    placeholder="UPC / EAN"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SHIPPING */}
          {activeTab === 'shipping' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Shipping &amp; Logistics</h3>
                <p className="panel-subtitle">Provide weights and dimensions so delivery rates can calculate dynamically during storefront checkout.</p>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Product Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="styled-input"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 0.25 (for 250 grams)"
                />
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '20px 0 12px 0', textTransform: 'uppercase' }}>Package Dimensions (cm)</h4>
              <div className="form-grid-3">
                <div className="input-wrapper">
                  <label className="input-label">Length (cm)</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={length}
                    onChange={e => setLength(e.target.value)}
                    placeholder="Length"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Width (cm)</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={width}
                    onChange={e => setWidth(e.target.value)}
                    placeholder="Width"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Height (cm)</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SEO */}
          {activeTab === 'seo' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">SEO Listing Preview</h3>
                <p className="panel-subtitle">Configure search engine titles, open-graph details, and keywords to rank on Google.</p>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">Meta Title Tag</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                    placeholder="e.g. Lavender Face Wash | Nature Glow Store"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">SEO Keywords (Comma Separated)</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={seoKeywords}
                    onChange={e => setSeoKeywords(e.target.value)}
                    placeholder="e.g. face wash, organic skincare, organic cleanser"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Meta Description Tag</label>
                <textarea
                  className="styled-textarea"
                  rows={3}
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  placeholder="Write a clear summary that search engines show in search results..."
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label">Canonical URL Override</label>
                <input
                  type="text"
                  className="styled-input"
                  value={canonicalUrl}
                  onChange={e => setCanonicalUrl(e.target.value)}
                  placeholder="https://natureglow.com/products/lavender-wash"
                />
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '24px 0 12px 0', textTransform: 'uppercase' }}>Social Sharing Meta (Open Graph)</h4>
              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">OG Title</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={ogTitle}
                    onChange={e => setOgTitle(e.target.value)}
                    placeholder="Social share title"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">OG Image URL</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                    placeholder="Leave empty to use main product cover image"
                  />
                </div>
              </div>
              
              <div className="input-wrapper">
                <label className="input-label">OG Description</label>
                <textarea
                  className="styled-textarea"
                  rows={2}
                  value={ogDescription}
                  onChange={e => setOgDescription(e.target.value)}
                  placeholder="Social share description..."
                />
              </div>

              {/* Google search preview */}
              <div style={{ background: '#F9FAFB', border: '1px dashed #D1D5DB', padding: 18, borderRadius: 12, marginTop: 24 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Google Desktop Snippet Preview:</span>
                <h4 style={{ margin: '0 0 4px 0', color: '#1A0DAB', fontSize: '1.05rem', fontWeight: 600 }}>{metaTitle || name || 'Product Title Page'}</h4>
                <span style={{ color: '#006621', fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>https://yourstore.com/products/{slug || 'slug-url'}</span>
                <p style={{ margin: 0, color: '#545454', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {metaDescription || description?.substring(0, 150) || 'Write a meta description tag to see how this product listing will present in search engines results...'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: MARKETING CONTROLS */}
          {activeTab === 'marketing' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Homepage &amp; Marketing Controls</h3>
                <p className="panel-subtitle">Determine where this product presents across homepage sections and collections.</p>
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 15, textTransform: 'uppercase' }}>Display Collections &amp; Badges</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 30 }}>
                <div className="checkbox-row">
                  <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                  <label htmlFor="isFeatured">⭐ Featured Product Section</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="bestSeller" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} />
                  <label htmlFor="bestSeller">🔥 Best Seller Collection</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="newArrival" checked={newArrival} onChange={e => setNewArrival(e.target.checked)} />
                  <label htmlFor="newArrival">🌿 New Arrival Product Badge</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="trending" checked={trending} onChange={e => setTrending(e.target.checked)} />
                  <label htmlFor="trending">📈 Trending skincare products</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="flashSale" checked={flashSale} onChange={e => setFlashSale(e.target.checked)} />
                  <label htmlFor="flashSale">⚡ Flash Sale (render discount timer)</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="dealOfTheDay" checked={dealOfTheDay} onChange={e => setDealOfTheDay(e.target.checked)} />
                  <label htmlFor="dealOfTheDay">🎁 Deal Of The Day spotlight</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="recommended" checked={recommended} onChange={e => setRecommended(e.target.checked)} />
                  <label htmlFor="recommended">❤️ Recommended items list</label>
                </div>
                <div className="checkbox-row">
                  <input type="checkbox" id="recentlyAdded" checked={recentlyAdded} onChange={e => setRecentlyAdded(e.target.checked)} />
                  <label htmlFor="recentlyAdded">🕒 Recently Added collection</label>
                </div>
              </div>

              {collectionsList.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📁 Assign to Collections
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 18, borderRadius: 12 }}>
                    {collectionsList.map((col) => (
                      <div key={col.id} className="checkbox-row" style={{ margin: 0 }}>
                        <input 
                          type="checkbox" 
                          id={`col-${col.id}`} 
                          checked={selectedCollections.includes(col.id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections([...selectedCollections, col.id]);
                            } else {
                              setSelectedCollections(selectedCollections.filter(id => id !== col.id));
                            }
                          }} 
                        />
                        <label htmlFor={`col-${col.id}`} style={{ fontWeight: 600 }}>📁 {col.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="input-wrapper" style={{ marginBottom: 0 }}>
                <label className="input-label">Product Tags (Comma Separated)</label>
                <input
                  type="text"
                  className="styled-input"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="e.g. natural, skincare, toner, summer-sale"
                />
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>Tags help users filter products inside collections.</span>
              </div>
            </div>
          )}

          {/* TAB 9: FAQ */}
          {activeTab === 'faq' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Product FAQ Creator</h3>
                <p className="panel-subtitle">Add product-specific Frequently Asked Questions to build buyer trust.</p>
              </div>

              {/* Add FAQ Form */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 20, borderRadius: 12, marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem' }}>Add New FAQ Question</h4>
                <div className="input-wrapper">
                  <label className="input-label">Question</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="e.g. How long does one bottle last?"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Answer</label>
                  <textarea
                    className="styled-textarea"
                    rows={2}
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    placeholder="e.g. Typically 30-45 days with recommended twice-daily usage."
                  />
                </div>
                <button type="button" className="btn-primary" onClick={addFaq}>Add FAQ Item</button>
              </div>

              {/* FAQs list */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 15 }}>Product FAQs ({faqs.length})</h4>
              {faqs.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No FAQs added to this product yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {faqs.map((faq, idx) => (
                    <div key={idx} style={{ border: '1px solid #E5E7EB', padding: 16, borderRadius: 10, background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 15 }}>
                      <div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{faq.question}</h5>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>{faq.answer}</p>
                      </div>
                      <button type="button" className="btn-danger-sm" onClick={() => removeFaq(idx)} style={{ padding: '6px 8px' }}><Icons.Trash /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: REVIEWS */}
          {activeTab === 'reviews' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Reviews &amp; Ratings Configurations</h3>
                <p className="panel-subtitle">Configure buyer review sections and rating filters for this specific product.</p>
              </div>

              <div className="checkbox-row" style={{ marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="enableReviews"
                  checked={enableReviews}
                  onChange={e => setEnableReviews(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="enableReviews">Enable customer review submissions and star ratings for this product</label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                  disabled={!enableReviews}
                />
                <label htmlFor="verifiedOnly" style={!enableReviews ? { color: '#9CA3AF' } : {}}>Only accept reviews from verified buyers (purchased through storefront)</label>
              </div>
            </div>
          )}

          {/* TAB 11: SUPPLIER */}
          {activeTab === 'supplier' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Supplier Sourcing Details</h3>
                <p className="panel-subtitle">Store backend procurement logs to trace supply costs and buy links.</p>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Supplier/Vendor Name</label>
                <input
                  type="text"
                  className="styled-input"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="e.g. Organic Labs Ltd."
                />
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">Procurement Cost Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="styled-input"
                    value={supplierCost}
                    onChange={e => setSupplierCost(e.target.value)}
                    placeholder="Sourcing price per unit"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Supplier Order Sourcing Link</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={supplierLink}
                    onChange={e => setSupplierLink(e.target.value)}
                    placeholder="https://supplier.com/orders/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: ADVANCED */}
          {activeTab === 'advanced' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">Advanced Settings</h3>
                <p className="panel-subtitle">Configure sort orders, visibility overrides, and dynamic digital course/file attachments.</p>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <label className="input-label">Catalog Sort Order index</label>
                  <input
                    type="number"
                    className="styled-input"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    placeholder="e.g. 0 (lower index sorts first)"
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Storefront Visibility</label>
                  <select className="styled-select" value={visibility} onChange={e => setVisibility(e.target.value)}>
                    <option value="visible">Visible in Catalog and Search</option>
                    <option value="catalog_only">Visible in Catalog only (Hide from search)</option>
                    <option value="search_only">Visible in Search only (Hide from catalog listing)</option>
                    <option value="hidden">Hidden completely (Unlisted)</option>
                  </select>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid #E5E7EB', margin: '24px 0' }} />

              <div className="checkbox-row" style={{ marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="isDigital"
                  checked={isDigital}
                  onChange={e => setIsDigital(e.target.checked)}
                  style={{ width: 19, height: 19 }}
                />
                <label htmlFor="isDigital" style={{ fontSize: '0.92rem' }}>This is a digital product (e.g., Ebook, Course download, License key)</label>
              </div>

              {isDigital && (
                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: 20, borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--m-primary)' }}>📁 Digital File Sourcing Settings</h4>
                  
                  <div className="input-wrapper">
                    <label className="input-label">Download Delivery URL</label>
                    <input
                      type="text"
                      className="styled-input"
                      value={downloadUrl}
                      onChange={e => setDownloadUrl(e.target.value)}
                      placeholder="https://storage.yoursite.com/downloads/ebook.pdf"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="input-wrapper" style={{ marginBottom: 0 }}>
                      <label className="input-label">Download Limit per purchase</label>
                      <input
                        type="number"
                        className="styled-input"
                        value={downloadLimit}
                        onChange={e => setDownloadLimit(e.target.value)}
                        placeholder="e.g. 3 (leave empty for unlimited)"
                      />
                    </div>
                    <div className="input-wrapper" style={{ marginBottom: 0 }}>
                      <label className="input-label">Automated Delivery License Key</label>
                      <input
                        type="text"
                        className="styled-input"
                        value={licenseKey}
                        onChange={e => setLicenseKey(e.target.value)}
                        placeholder="e.g. KEY-XXXXX-XXXXX"
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderBottom: '1px solid #E5E7EB', margin: '24px 0' }} />

              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--m-text-main, #111827)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                🔧 Custom Specifications &amp; Attributes
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '0 0 16px 0' }}>Add dynamic parameters (e.g. Material: Cotton, Country: India, Warranty: 1 Year) for detailed storefront tables.</p>

              {/* Add specification form */}
              <div style={{ display: 'flex', gap: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', padding: 18, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Attribute Name</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={newSpecName}
                    onChange={e => setNewSpecName(e.target.value)}
                    placeholder="e.g. Material"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Attribute Value</label>
                  <input
                    type="text"
                    className="styled-input"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                    placeholder="e.g. 100% Organic Cotton"
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={addSpecification}
                  style={{ alignSelf: 'flex-end', height: 42, padding: '0 20px' }}
                >
                  Add
                </button>
              </div>

              {/* Specifications list */}
              {specifications.length > 0 && (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>Value</th>
                        <th style={{ padding: '12px 16px', width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {specifications.map((spec, index) => (
                        <tr key={spec.id || index} style={{ borderBottom: index < specifications.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>{spec.name}</td>
                          <td style={{ padding: '12px 16px', color: '#4B5563' }}>{spec.value}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-danger-sm"
                              onClick={() => removeSpecification(spec.id || spec.name)}
                              style={{ padding: '6px 8px' }}
                            >
                              <Icons.Trash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
