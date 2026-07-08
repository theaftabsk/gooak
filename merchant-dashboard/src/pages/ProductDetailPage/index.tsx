import React, { useState, useEffect } from 'react';
import { catalogApi } from '@/lib/api-client';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner } from '@/components/ui/Shared';
import { VariantsStockTab } from '@/pages/VariantsStockTab';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { FLAT_TAXONOMY } from '@/lib/taxonomy';

interface ProductDetailPageProps {
  productId: string;
  products: any[];
  categories: any[];
  brands: any[];
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

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId, categories, brands, onBack
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [product, setProduct] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Form states - General
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryPath, setCategoryPath] = useState<string | null>(null);
  const [brandId, setBrandId] = useState('');
  const [label, setLabel] = useState(''); // Sale, New, Hot, etc.
  const [status, setStatus] = useState('draft');

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
  const [stockQty, setStockQty] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [allowBackorders, setAllowBackorders] = useState(false);

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

  // Load collections
  useEffect(() => {
    catalogApi.getCollections().then((cols) => {
      setCollectionsList(cols || []);
    }).catch(err => console.error('Error fetching collections:', err));
  }, []);

  // Load product details from server
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
      setCategoryId(data.category_id || '');
      // Try to match existing category to taxonomy by name for the path label
      if (data.category?.name) {
        const match = FLAT_TAXONOMY.find(
          f => f.name.toLowerCase() === data.category.name.toLowerCase() ||
               f.label.toLowerCase().includes(data.category.name.toLowerCase()),
        );
        setCategoryPath(match ? match.label : data.category.name);
      } else {
        setCategoryPath(null);
      }
      setBrandId(data.brand_id || '');
      setLabel(data.label || '');
      setStatus(data.status || 'draft');
      setDescription(data.description || '');
      setShortDesc(data.short_desc || '');
      setHsnCode(data.hsn_code || '');

      setGallery(data.gallery || []);
      setYoutubeUrl(data.youtube_url || '');
      setSelectedCollections(data.collections?.map((c: any) => c.collection_id) || []);
      setSpecifications(data.specifications || []);

      // Load stock parameters from first variant
      const defaultVar = data.variants?.[0];
      setTrackInventory(defaultVar?.track_inventory !== undefined ? defaultVar.track_inventory : true);
      setStockQty(defaultVar?.stock_qty !== undefined ? defaultVar.stock_qty.toString() : '0');
      setLowStockThreshold(defaultVar?.low_stock_at !== undefined ? defaultVar.low_stock_at.toString() : '5');
      setAllowBackorders(data.allow_backorders || false);

      setWeight(data.weight ? parseFloat(data.weight).toString() : '');
      setLength(data.length ? parseFloat(data.length).toString() : '');
      setWidth(data.width ? parseFloat(data.width).toString() : '');
      setHeight(data.height ? parseFloat(data.height).toString() : '');

      setMetaTitle(data.meta_title || '');
      setMetaDescription(data.meta_description || '');
      setSeoKeywords(data.seo_keywords || '');
      setCanonicalUrl(data.canonical_url || '');
      setOgTitle(data.og_title || '');
      setOgDescription(data.og_description || '');
      setOgImage(data.og_image || '');

      setIsFeatured(data.is_featured || false);
      setBestSeller(data.best_seller || false);
      setNewArrival(data.new_arrival || false);
      setTrending(data.trending || false);
      setFlashSale(data.flash_sale || false);
      setDealOfTheDay(data.deal_of_the_day || false);
      setRecommended(data.recommended || false);
      setRecentlyAdded(data.recently_added || false);
      setTagsInput(data.product_tags ? data.product_tags.join(', ') : '');

      setFaqs(data.faqs || []);
      setEnableReviews(data.enable_reviews !== undefined ? data.enable_reviews : true);
      setVerifiedOnly(data.verified_only || false);

      setSupplierName(data.supplier_name || '');
      setSupplierCost(data.supplier_cost ? parseFloat(data.supplier_cost).toString() : '');
      setSupplierLink(data.supplier_link || '');

      setSortOrder(data.sort_order ? data.sort_order.toString() : '0');
      setVisibility(data.visibility || 'visible');
      setIsDigital(data.is_digital || false);
      setDownloadUrl(data.download_url || '');
      setDownloadLimit(data.download_limit ? data.download_limit.toString() : '');
      setLicenseKey(data.license_key || '');

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

  // Generate unique SKU
  const handleAutoGenerateSku = () => {
    if (!name) return alert('Enter name first.');
    const clean = name.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const prefix = clean.substring(0, 8) || 'SKU';
    setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // File Upload Helper
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
      console.error('Upload failed:', err);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add preset image
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

  // Manual URL image adder
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

  // FAQ helpers
  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs([...faqs, { id: Math.random().toString(), question: newQuestion.trim(), answer: newAnswer.trim(), sort_order: faqs.length }]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id && faq.question !== id));
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

  // Save updates handler
  const handleSave = async () => {
    setSaveStatus('saving');
    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        short_desc: shortDesc.trim() || null,
        category_id: categoryId || null,
        brand_id: brandId || null,
        label: label || null,
        status,

        // Pricing
        price: parseFloat(price) || 0,
        compare_price: comparePrice ? parseFloat(comparePrice) : null,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        hsn_code: hsnCode || null,

        // Inventory overrides
        master_sku: sku.trim() || null,
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
        og_image: ogImage || null,

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

        // FAQs / Gallery
        youtube_url: youtubeUrl.trim() || null,
        faqs,
        gallery,
        collections: selectedCollections,
        specifications,

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
      };

      await catalogApi.updateProduct(productId, payload);
      await loadProduct();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to update product details:', err);
      setSaveStatus('error');
    }
  };

  if (loadingDetails) {
    return <LoadingSpinner message="Loading product information..." />;
  }

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
        /* Legacy CSS kept for any remaining native inputs */
        .styled-input, .styled-textarea {
          width: 100%;
          height: 36px;
          padding: 4px 12px;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 0.875rem;
          outline: none;
          color: #111827;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .styled-textarea { height: auto; min-height: 80px; resize: vertical; padding: 8px 12px; }
        .styled-input:focus, .styled-textarea:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 1px #6366F1;
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

      {/* Header bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost-sm" onClick={onBack} style={{ padding: 8, borderRadius: '50%' }}>
            <Icons.ArrowLeft />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              {name || 'Edit Product'}
              <Badge type={status === 'active' ? 'success' : 'warn'}>
                {status.toUpperCase()}
              </Badge>
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Manage product attributes, SEO snippets, and dynamic inventory levels</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--m-primary)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Check /> Saved successfully!
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.85rem' }}>
              Failed to save changes.
            </span>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Main Tabbed work area */}
      <div className="tabbed-layout">
        
        {/* Left sidebar */}
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

        {/* Right side content */}
        <div className="tab-panel-card">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div>
              <div className="panel-header">
                <h3 className="panel-title">General Information</h3>
                <p className="panel-subtitle">Configure basic titles, descriptors, categories, and custom badges.</p>
              </div>

              <div className="input-wrapper">
                <Label>Product Title *</Label>
                <Input
                  required
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <Label>URL Slug Handle</Label>
                  <Input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                  />
                </div>
                <div className="input-wrapper">
                  <Label>Product Badge/Label</Label>
                  <Select value={label || '__none'} onValueChange={v => setLabel(v === '__none' ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No Label</SelectItem>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Limited">Limited</SelectItem>
                      <SelectItem value="Exclusive">Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="input-wrapper">
                  <Label>Category</Label>
                  <CategoryPicker
                    value={categoryId || null}
                    valuePath={categoryPath}
                    onChange={(id, path) => { setCategoryId(id || ''); setCategoryPath(path); }}
                  />
                </div>
                <div className="input-wrapper">
                  <Label>Brand</Label>
                  <Select value={brandId || '__none'} onValueChange={v => setBrandId(v === '__none' ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Select Brand —</SelectItem>
                      {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="input-wrapper">
                  <Label>Visibility Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="input-wrapper">
                <Label>Short Description</Label>
                <Textarea
                  rows={2}
                  value={shortDesc}
                  onChange={e => setShortDesc(e.target.value)}
                />
              </div>

              <div className="input-wrapper" style={{ marginBottom: 0 }}>
                <Label>Detailed Description</Label>
                <Textarea
                  rows={6}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
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
                  <Label>Price (INR) *</Label>
                  <Input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Compare Price (INR)</Label>
                  <Input type="number" step="0.01" value={comparePrice} onChange={e => setComparePrice(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Cost Price (INR)</Label>
                  <Input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper" style={{ marginBottom: 0 }}>
                  <Label>HSN Code</Label>
                  <Input type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} />
                </div>
                <div className="input-wrapper" style={{ marginBottom: 0 }}>
                  <Label>GST Tax Bracket</Label>
                  <Select value={taxId || '__none'} onValueChange={v => setTaxId(v === '__none' ? '' : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">No Tax (0%)</SelectItem>
                      <SelectItem value="gst-5">GST 5%</SelectItem>
                      <SelectItem value="gst-12">GST 12%</SelectItem>
                      <SelectItem value="gst-18">GST 18% (Standard Cosmetics)</SelectItem>
                      <SelectItem value="gst-28">GST 28%</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Upload field */}
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
              </div>

              <div className="input-wrapper">
                <Label>Product YouTube Video URL</Label>
                <Input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
              </div>

              {/* Presets catalog */}
              <div style={{ marginBottom: 30 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>🌟 Instant Premium Botanical Presets Catalog</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                  {PRESET_IMAGES.map((preset, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => addPresetImage(preset)}
                      style={{ height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: '1.5px solid #E5E7EB' }}
                    >
                      <img src={preset.url} alt={preset.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual URL paste */}
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

              {/* Images Grid */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 15px 0' }}>Uploaded Images ({gallery.length})</h4>
              {gallery.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No images uploaded yet.</p>
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
                  <Label>Master SKU</Label>
                  <Input type="text" value={sku} onChange={e => setSku(e.target.value)} />
                  <button type="button" className="sku-suggest-btn" onClick={handleAutoGenerateSku}>
                    Suggest Unique SKU
                  </button>
                </div>
                <div className="input-wrapper">
                  <Label>Inventory Tracking</Label>
                  <Select value={trackInventory ? 'true' : 'false'} onValueChange={v => setTrackInventory(v === 'true')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Track stock quantities</SelectItem>
                      <SelectItem value="false">Don't track quantities (Unlimited stock)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {trackInventory && (
                <div className="form-grid-2">
                  <div className="input-wrapper">
                    <Label>Initial Stock Quantity</Label>
                    <Input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} />
                  </div>
                  <div className="input-wrapper">
                    <Label>Low Stock Threshold Alert</Label>
                    <Input type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
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
                <h3 className="panel-title">Variants &amp; Stock Grid</h3>
                <p className="panel-subtitle">Manage attributes, custom dimensions, individual pricing override and stock adjustments.</p>
              </div>
              <VariantsStockTab productId={productId} />
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
                <Label>Product Weight (kg)</Label>
                <Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '20px 0 12px 0', textTransform: 'uppercase' }}>Package Dimensions (cm)</h4>
              <div className="form-grid-3">
                <div className="input-wrapper">
                  <Label>Length (cm)</Label>
                  <Input type="number" value={length} onChange={e => setLength(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Width (cm)</Label>
                  <Input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Height (cm)</Label>
                  <Input type="number" value={height} onChange={e => setHeight(e.target.value)} />
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
                  <Label>Meta Title Tag</Label>
                  <Input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>SEO Keywords</Label>
                  <Input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} />
                </div>
              </div>

              <div className="input-wrapper">
                <Label>Meta Description Tag</Label>
                <Textarea rows={3} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
              </div>

              <div className="input-wrapper">
                <Label>Canonical URL Override</Label>
                <Input type="text" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} />
              </div>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '24px 0 12px 0', textTransform: 'uppercase' }}>Social Sharing Meta (Open Graph)</h4>
              <div className="form-grid-2">
                <div className="input-wrapper">
                  <Label>OG Title</Label>
                  <Input type="text" value={ogTitle} onChange={e => setOgTitle(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>OG Image URL</Label>
                  <Input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)} />
                </div>
              </div>
              
              <div className="input-wrapper">
                <Label>OG Description</Label>
                <Textarea rows={2} value={ogDescription} onChange={e => setOgDescription(e.target.value)} />
              </div>

              <div style={{ background: '#F9FAFB', border: '1px dashed #D1D5DB', padding: 18, borderRadius: 12, marginTop: 24 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Google Desktop Snippet Preview:</span>
                <h4 style={{ margin: '0 0 4px 0', color: '#1A0DAB', fontSize: '1.05rem', fontWeight: 600 }}>{metaTitle || name}</h4>
                <span style={{ color: '#006621', fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>https://yourstore.com/products/{slug}</span>
                <p style={{ margin: 0, color: '#545454', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {metaDescription || description?.substring(0, 150) || 'No meta description configured.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: MARKETING */}
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
                  <label htmlFor="flashSale">⚡ Flash Sale</label>
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
                <Label>Product Tags (Comma Separated)</Label>
                <Input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
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
                  <Label>Question</Label>
                  <Input type="text" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Answer</Label>
                  <Textarea rows={2} value={newAnswer} onChange={e => setNewAnswer(e.target.value)} />
                </div>
                <button type="button" className="btn-primary" onClick={addFaq}>Add FAQ Item</button>
              </div>

              {/* FAQs list */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 15 }}>Product FAQs ({faqs.length})</h4>
              {faqs.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No FAQs added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {faqs.map((faq, idx) => (
                    <div key={idx} style={{ border: '1px solid #E5E7EB', padding: 16, borderRadius: 10, background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 15 }}>
                      <div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{faq.question}</h5>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>{faq.answer}</p>
                      </div>
                      <button type="button" className="btn-danger-sm" onClick={() => removeFaq(faq.id || faq.question)} style={{ padding: '6px 8px' }}><Icons.Trash /></button>
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
                />
                <label htmlFor="enableReviews">Enable customer review submissions and star ratings for this product</label>
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="verifiedOnly"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  disabled={!enableReviews}
                />
                <label htmlFor="verifiedOnly" style={!enableReviews ? { color: '#9CA3AF' } : {}}>Only accept reviews from verified buyers</label>
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
                <Label>Supplier Name</Label>
                <Input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
              </div>

              <div className="form-grid-2">
                <div className="input-wrapper">
                  <Label>Procurement Cost Price (INR)</Label>
                  <Input type="number" step="0.01" value={supplierCost} onChange={e => setSupplierCost(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Supplier Order Sourcing Link</Label>
                  <Input type="text" value={supplierLink} onChange={e => setSupplierLink(e.target.value)} />
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
                  <Label>Catalog Sort Order index</Label>
                  <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
                </div>
                <div className="input-wrapper">
                  <Label>Storefront Visibility</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visible">Visible in Catalog and Search</SelectItem>
                      <SelectItem value="catalog_only">Visible in Catalog only</SelectItem>
                      <SelectItem value="search_only">Visible in Search only</SelectItem>
                      <SelectItem value="hidden">Hidden completely (Unlisted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid #E5E7EB', margin: '24px 0' }} />

              <div className="checkbox-row" style={{ marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="isDigital"
                  checked={isDigital}
                  onChange={e => setIsDigital(e.target.checked)}
                />
                <label htmlFor="isDigital" style={{ fontSize: '0.92rem' }}>This is a digital product (e.g., Ebook, Course download, License key)</label>
              </div>

              {isDigital && (
                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: 20, borderRadius: 12 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--m-primary)' }}>📁 Digital File Sourcing Settings</h4>
                  
                  <div className="input-wrapper">
                    <Label>Download Delivery URL</Label>
                    <Input type="text" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} />
                  </div>

                  <div className="form-grid-2">
                    <div className="input-wrapper" style={{ marginBottom: 0 }}>
                      <Label>Download Limit per purchase</Label>
                      <Input type="number" value={downloadLimit} onChange={e => setDownloadLimit(e.target.value)} />
                    </div>
                    <div className="input-wrapper" style={{ marginBottom: 0 }}>
                      <Label>Automated Delivery License Key</Label>
                      <Input type="text" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} />
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
                  <Label style={{ fontSize: '0.75rem', marginBottom: 4 }}>Attribute Name</Label>
                  <Input type="text" value={newSpecName} onChange={e => setNewSpecName(e.target.value)} placeholder="e.g. Material" className="mt-1" />
                </div>
                <div style={{ flex: 1 }}>
                  <Label style={{ fontSize: '0.75rem', marginBottom: 4 }}>Attribute Value</Label>
                  <Input type="text" value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} placeholder="e.g. 100% Organic Cotton" className="mt-1" />
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
