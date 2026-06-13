import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi, pageBuilderApi } from '../../../../lib/api-client';
import { usePageTheme } from '../../hooks/usePageTheme';
import { WidgetRenderer } from '../../WidgetRenderer';
import { useCart } from '../../context/CartContext';

export const Product: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme, cssVariables } = usePageTheme('product');
  const { addToCart } = useCart();
  
  const [pageData, setPageData] = useState<any | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // 1. Fetch layout config (to check for Hero banner)
    pageBuilderApi.getPageBySlug('product').then(setPageData).catch(() => {});

    // 2. Fetch product details
    const loadDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await catalogApi.getProduct(slug);
        // Backend returns { product, relatedProducts } — extract the product object
        const prod = response?.product || response || null;
        setProduct(prod);
        
        // Setup initial image
        const cover = prod?.gallery?.find((g: any) => g.is_cover)?.url || prod?.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
        setActiveImage(cover);

        // Setup variants
        if (prod?.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
          if (prod.variants[0].image_url) {
            setActiveImage(prod.variants[0].image_url);
          }
        }
      } catch (err) {
        console.error('Error fetching storefront product:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [slug]);

  const handleVariantSelect = (v: any) => {
    setSelectedVariant(v);
    if (v.image_url) {
      setActiveImage(v.image_url);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Fallback if no variants
    const itemId = product.id;
    const variantId = selectedVariant ? selectedVariant.id : `default-${product.id}`;
    const variantLabel = selectedVariant ? selectedVariant.label || '' : '';
    const price = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const imageUrl = selectedVariant?.image_url || product.gallery?.find((g: any) => g.is_cover)?.url || product.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';

    addToCart({
      id: itemId,
      variantId,
      name: product.name,
      variantLabel,
      price,
      imageUrl,
    }, qty);

    setSuccessMsg('🛒 Added to your shopping cart!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div style={cssVariables} className="product-page-loading">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={cssVariables} className="product-not-found-wrapper">
        <span className="not-found-icon">🔍</span>
        <h1 className="not-found-title">Product Not Found</h1>
        <p className="not-found-desc">The formulation you are searching for does not exist or has been archived.</p>
        <Link to="/products" className="not-found-action-btn" style={{ background: theme.primaryColor || '#111827' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const heroWidgets = pageData?.widgets?.filter((w: any) => w.type === 'HERO_BANNER') || [];
  
  // Calculate pricing coordinates
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const comparePrice = selectedVariant ? selectedVariant.compare_price : product.compare_price;
  const inStock = selectedVariant ? (selectedVariant.stock_qty || 0) > 0 : product.variants?.length > 0 ? false : true;

  return (
    <div style={cssVariables} className="product-detail-wrapper">
      {/* 1. Editable Hero Banner */}
      {heroWidgets.length > 0 && <WidgetRenderer widgets={heroWidgets} theme={theme} />}

      {/* 2. Main Page Container */}
      <div className="product-detail-container">
        
        {/* Product Layout Grid */}
        <div className="product-detail-grid">
          
          {/* Left: Gallery Column */}
          <div className="gallery-column">
            <div className="gallery-primary-frame">
              <img src={activeImage} alt={product.name} className="gallery-active-image" />
              {comparePrice && Number(comparePrice) > Number(displayPrice) && (
                <span className="product-sale-pill">Sale</span>
              )}
            </div>
            
            {product.gallery && product.gallery.length > 1 && (
              <div className="gallery-thumbnail-list">
                {product.gallery.map((img: any) => (
                  <button 
                    key={img.id} 
                    onClick={() => setActiveImage(img.url)}
                    className={`gallery-thumb-btn ${activeImage === img.url ? 'active' : ''}`}
                    style={activeImage === img.url ? { borderColor: theme.primaryColor || '#15803D' } : {}}
                  >
                    <img src={img.url} alt={product.name} className="gallery-thumb-image" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Column */}
          <div className="info-column">
            <div className="product-info-header">
              <span className="product-info-category">{product.category?.name || 'Botanicals'}</span>
              <h1 className="product-info-title">{product.name}</h1>
              {product.short_desc && <p className="product-info-short-desc">{product.short_desc}</p>}
            </div>

            {/* Pricing Section */}
            <div className="product-pricing-card">
              <div className="price-row">
                <span className="price-large">₹{displayPrice}</span>
                {comparePrice && Number(comparePrice) > Number(displayPrice) && (
                  <div className="compare-price-wrapper">
                    <span className="price-compare-striked">₹{comparePrice}</span>
                    <span className="save-badge-pill">
                      Save {Math.round(((Number(comparePrice) - Number(displayPrice)) / Number(comparePrice)) * 100)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="stock-status-wrapper">
                <span className={`status-indicator-dot ${inStock ? 'in-stock' : 'out-of-stock'}`}></span>
                <span className="status-text">{inStock ? 'In Stock & Ready to Ship' : 'Currently Out of Stock'}</span>
              </div>
            </div>

            {/* Variations Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="variants-section">
                <span className="section-label">Select Options</span>
                <div className="variants-grid">
                  {product.variants.map((v: any) => {
                    const isVarActive = selectedVariant?.id === v.id;
                    const isVarOutOfStock = (v.stock_qty || 0) <= 0;
                    
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVariantSelect(v)}
                        className={`variant-option-chip ${isVarActive ? 'active' : ''} ${isVarOutOfStock ? 'disabled' : ''}`}
                        style={isVarActive ? { 
                          borderColor: theme.primaryColor || '#15803D',
                          background: `${theme.primaryColor || '#15803D'}0c`,
                          color: theme.primaryColor || '#15803D'
                        } : {}}
                      >
                        <span className="variant-chip-label">{v.label || v.sku}</span>
                        <span className="variant-chip-price">₹{v.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Checkout Actions */}
            <div className="actions-section">
              <span className="section-label">Quantity</span>
              <div className="actions-control-row">
                <div className="qty-picker-container">
                  <button 
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="qty-adjust-btn"
                    disabled={!inStock}
                  >
                    -
                  </button>
                  <span className="qty-display-box">{qty}</span>
                  <button 
                    onClick={() => setQty(q => q + 1)}
                    className="qty-adjust-btn"
                    disabled={!inStock}
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="add-to-cart-cta-btn"
                  style={{ background: theme.primaryColor || '#15803D' }}
                >
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="success-banner-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Product Specifications */}
            <div className="specs-section">
              <span className="section-label">Formulation Details</span>
              <table className="specs-table">
                <tbody>
                  {product.master_sku && (
                    <tr>
                      <td className="specs-key">SKU Reference</td>
                      <td className="specs-val font-mono">{product.master_sku}</td>
                    </tr>
                  )}
                  {selectedVariant && selectedVariant.sku && (
                    <tr>
                      <td className="specs-key">Selected SKU</td>
                      <td className="specs-val font-mono">{selectedVariant.sku}</td>
                    </tr>
                  )}
                  {selectedVariant && selectedVariant.stock_qty !== undefined && (
                    <tr>
                      <td className="specs-key">Inventory Available</td>
                      <td className="specs-val">{selectedVariant.stock_qty} units</td>
                    </tr>
                  )}
                  <tr>
                    <td className="specs-key">Category Group</td>
                    <td className="specs-val">{product.category?.name || 'Organic Cosmetics'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Long Description Text */}
            {product.description && (
              <div className="description-section">
                <span className="section-label font-bold text-slate-700">Detailed Description</span>
                <div 
                  className="description-content-html"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

          </div>

        </div>
      </div>

      <style>{`
        .product-detail-wrapper {
          background: var(--sf-bg, #FAF7F2);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: #1F2937;
        }

        /* Loading & Empty states */
        .product-page-loading {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sf-bg, #FAF7F2);
        }
        .loader-spinner {
          width: 40px;
          height: 40px;
          border: 3.5px solid rgba(0, 0, 0, 0.06);
          border-top-color: var(--sf-accent, #15803D);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .product-not-found-wrapper {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          background: var(--sf-bg, #FAF7F2);
        }
        .not-found-icon {
          font-size: 2.8rem;
          display: block;
          margin-bottom: 20px;
        }
        .not-found-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 10px;
        }
        .not-found-desc {
          font-size: 0.9rem;
          color: #6B7280;
          max-width: 360px;
          margin: 0 auto 28px;
          line-height: 1.5;
        }
        .not-found-action-btn {
          display: inline-block;
          padding: 12px 30px;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          font-size: 0.88rem;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          transition: all 0.2s;
        }
        .not-found-action-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        /* ─── Grid Workspace ─── */
        .product-detail-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          box-sizing: border-box;
        }
        .product-detail-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: start;
        }

        /* Gallery column */
        .gallery-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .gallery-primary-frame {
          position: relative;
          aspect-ratio: 1;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.04);
        }
        .gallery-active-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-sale-pill {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #EF4444;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 5px 12px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.15);
        }

        .gallery-thumbnail-list {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .gallery-thumb-btn {
          width: 80px;
          height: 80px;
          border-radius: 14px;
          border: 2px solid transparent;
          background: #ffffff;
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .gallery-thumb-btn.active {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        }
        .gallery-thumb-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Info column */
        .info-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .product-info-category {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--sf-accent, #15803D);
          display: block;
          margin-bottom: 8px;
        }
        .product-info-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 14px;
        }
        .product-info-short-desc {
          font-size: 0.92rem;
          color: #4B5563;
          line-height: 1.6;
          margin: 0;
          font-weight: 500;
        }

        /* Pricing Card */
        .product-pricing-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 25px -10px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .price-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .price-large {
          font-size: 2.1rem;
          font-weight: 900;
          color: #111827;
          letter-spacing: -0.01em;
        }
        .compare-price-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .price-compare-striked {
          font-size: 1.05rem;
          color: #9CA3AF;
          text-decoration: line-through;
          font-weight: 500;
        }
        .save-badge-pill {
          background: #FEF2F2;
          color: #EF4444;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .stock-status-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-indicator-dot.in-stock {
          background: #10B981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        }
        .status-indicator-dot.out-of-stock {
          background: #EF4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }
        .status-text {
          color: #4B5563;
        }

        /* Labels styling */
        .section-label {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6B7280;
          margin-bottom: 12px;
        }

        /* Variant Option Selection */
        .variants-section {
          display: flex;
          flex-direction: column;
        }
        .variants-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .variant-option-chip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px 18px;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          min-width: 90px;
        }
        .variant-option-chip:hover:not(.disabled) {
          border-color: #9CA3AF;
        }
        .variant-option-chip.active {
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-width: 1.5px;
        }
        .variant-option-chip.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #F3F4F6;
        }
        .variant-chip-label {
          font-size: 0.78rem;
          font-weight: 800;
          color: #111827;
        }
        .variant-chip-price {
          font-size: 0.78rem;
          color: #6B7280;
          font-weight: 600;
          margin-top: 2px;
        }
        .variant-option-chip.active .variant-chip-price {
          color: inherit;
        }

        /* Qty and CTA Actions */
        .actions-section {
          display: flex;
          flex-direction: column;
        }
        .actions-control-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .qty-picker-container {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          overflow: hidden;
          height: 48px;
        }
        .qty-adjust-btn {
          width: 44px;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          color: #6B7280;
          cursor: pointer;
          font-weight: 700;
          transition: background 0.15s;
        }
        .qty-adjust-btn:hover:not(:disabled) {
          background: rgba(0,0,0,0.02);
          color: #111827;
        }
        .qty-adjust-btn:disabled {
          cursor: not-allowed;
        }
        .qty-display-box {
          font-size: 0.9rem;
          font-weight: 800;
          color: #111827;
          width: 40px;
          text-align: center;
        }

        .add-to-cart-cta-btn {
          flex: 1;
          height: 48px;
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 20px -4px rgba(21, 128, 61, 0.25);
          transition: all 0.2s;
        }
        .add-to-cart-cta-btn:hover:not(:disabled) {
          filter: brightness(1.04);
          transform: translateY(-1px);
          box-shadow: 0 12px 25px -4px rgba(21, 128, 61, 0.35);
        }
        .add-to-cart-cta-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Success banner */
        .success-banner-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 12px 16px;
          border-radius: 14px;
        }
        .success-icon {
          width: 18px;
          height: 18px;
          color: #10B981;
          flex-shrink: 0;
        }

        /* Specs specs list */
        .specs-section {
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 24px;
        }
        .specs-table {
          width: 100%;
          border-collapse: collapse;
        }
        .specs-table tr {
          border-bottom: 1px solid rgba(0,0,0,0.03);
        }
        .specs-table tr:last-child {
          border-bottom: none;
        }
        .specs-key {
          padding: 10px 0;
          font-size: 0.8rem;
          color: #6B7280;
          font-weight: 500;
        }
        .specs-val {
          padding: 10px 0;
          font-size: 0.8rem;
          color: #111827;
          font-weight: 700;
          text-align: right;
        }

        /* Description HTML */
        .description-section {
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 24px;
        }
        .description-content-html {
          font-size: 0.88rem;
          color: #4B5563;
          line-height: 1.65;
        }
        .description-content-html p {
          margin: 0 0 12px;
        }
        .description-content-html p:last-child {
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .product-detail-container {
            padding: 24px 16px 60px;
          }
          .product-info-title {
            font-size: 1.85rem;
          }
          .price-large {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};
