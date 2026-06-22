import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { catalogApi } from '../../../../lib/api-client';
import { getCurrencySymbol } from '../../../../lib/utils';
import { usePageTheme } from '../../hooks/usePageTheme';

// Helper to render dynamic product badges matching the catalog
const renderProductBadge = (p: any, primaryColor?: string) => {
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  
  let labelText = '';
  let badgeColor = primaryColor || '#3B82F6';

  if (p.label) {
    labelText = p.label;
    const lower = p.label.toLowerCase();
    if (lower.includes('hot') || lower.includes('limited')) badgeColor = '#EF4444';
    else if (lower.includes('new') || lower.includes('fresh')) badgeColor = '#10B981';
    else if (lower.includes('deal') || lower.includes('sale')) badgeColor = '#F59E0B';
    else badgeColor = primaryColor || '#4F46E5';
  } else if (p.flash_sale) {
    labelText = 'Flash Sale';
    badgeColor = '#EF4444';
  } else if (p.deal_of_the_day) {
    labelText = 'Deal Of The Day';
    badgeColor = '#F59E0B';
  } else if (p.recommended) {
    labelText = 'Recommended';
    badgeColor = '#8B5CF6';
  } else if (p.recently_added) {
    labelText = 'Recently Added';
    badgeColor = '#10B981';
  } else if (isOnSale) {
    labelText = 'Sale';
    badgeColor = '#EF4444';
  } else if (p.best_seller) {
    labelText = 'Best Seller';
    badgeColor = '#10B981';
  } else if (p.trending) {
    labelText = 'Trending';
    badgeColor = '#EC4899';
  }

  if (!labelText) return null;

  return (
    <span style={{
      position: 'absolute',
      top: 12,
      left: 12,
      background: badgeColor,
      color: '#fff',
      fontSize: '0.68rem',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      zIndex: 1
    }}>
      {labelText}
    </span>
  );
};

const POPULAR_SUGGESTIONS = [
  'Serum',
  'Face Wash',
  'Cream',
  'Moisturizer',
  'Gel',
  'Organic'
];

export const Search: React.FC = () => {
  const { theme, cssVariables } = usePageTheme('products');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [search, setSearch] = useState(initialQuery);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sort, setSort] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus the input on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        search: queryText.trim(),
        limit: 24
      };
      if (sort) {
        params.sort = sort;
      }
      
      const res = await catalogApi.getProducts(params);
      setProducts(res?.products || []);
      setSearched(true);
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when query param or sort changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
    handleSearch(q);
  }, [searchParams, sort]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: search });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion);
    setSearchParams({ q: suggestion });
  };

  const clearSearch = () => {
    setSearch('');
    setSearchParams({});
    setProducts([]);
    setSearched(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div style={cssVariables} className="search-page-wrapper">
      <div className="search-container">
        
        {/* Header Section */}
        <div className="search-header">
          <h1 className="search-title">Search Products</h1>
          <p className="search-subtitle">Find premium formulations crafted thoughtfully for your beauty and skincare journey.</p>
        </div>

        {/* Big Search Bar */}
        <form onSubmit={handleSubmit} className="search-bar-form">
          <div className="search-input-box-wrapper">
            <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="What are you looking for today? (e.g. Niacinamide Serum, Aloe Cream)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-field"
            />
            {search && (
              <button type="button" onClick={clearSearch} className="search-input-clear-btn" aria-label="Clear search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="clear-svg-icon">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <button type="submit" className="search-input-submit-btn" style={{ background: theme.primaryColor || '#15803D' }}>
              Search
            </button>
          </div>
        </form>

        {/* Suggestions list */}
        {!searched && !loading && (
          <div className="suggestions-box">
            <span className="suggestions-title">Popular Searches:</span>
            <div className="suggestions-list">
              {POPULAR_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className="suggestion-tag-btn"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Metadata & Sorting */}
        {searched && !loading && (
          <div className="results-meta-bar">
            <span className="results-count-text">
              {products.length} {products.length === 1 ? 'product' : 'products'} found for "{searchParams.get('q')}"
            </span>
            <div className="search-sort-wrapper">
              <label className="search-sort-label">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="search-sort-select"
              >
                <option value="">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Popularity</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="products-grid">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="product-card skeleton">
                <div className="card-image-skeleton animate-pulse" />
                <div className="card-body-skeleton">
                  <div className="skeleton-line line-sm animate-pulse" />
                  <div className="skeleton-line line-md animate-pulse" />
                  <div className="skeleton-line line-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty / Welcome State */}
        {!searched && !loading && (
          <div className="search-welcome-state">
            <span className="welcome-state-icon" style={{ color: theme.primaryColor || '#15803D', background: `${theme.primaryColor}12` || '#15803d12' }}>🔍</span>
            <h3>Explore Our Botanical Shop</h3>
            <p>Type your query above to find natural extracts, facial cleansers, essential oils, and premium skincare formulas.</p>
          </div>
        )}

        {/* No Results Found State */}
        {searched && !loading && products.length === 0 && (
          <div className="search-empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <path d="M8 11h6" strokeLinecap="round"></path>
              </svg>
            </div>
            <h3>No Results Found for "{searchParams.get('q')}"</h3>
            <p>We couldn't find any products matching your search term. Double check spelling or try using different keywords.</p>
            <Link to="/products" className="browse-all-btn" style={{ background: theme.primaryColor || '#15803D' }}>
              Browse All Products
            </Link>
          </div>
        )}

        {/* Results Grid */}
        {searched && !loading && products.length > 0 && (
          <div className="products-grid">
            {products.map((p) => {
              const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
              const isOutOfStock = p.variants?.every((v: any) => (v.stock_qty || 0) <= 0);
              
              return (
                <div key={p.id} className="product-card">
                  <div className="card-image-container">
                    <img 
                      src={coverImage} 
                      alt={p.name}
                      className="product-image"
                      loading="lazy"
                    />
                    {renderProductBadge(p, theme.primaryColor)}
                    {isOutOfStock && (
                      <div className="sold-out-overlay">
                        <span className="sold-out-badge">Sold Out</span>
                      </div>
                    )}
                  </div>

                  <div className="product-card-body">
                    <span className="product-card-category">{p.category?.name || 'Formulations'}</span>
                    <h3 className="product-card-title">
                      <Link to={`/products/${p.slug}`}>{p.name}</Link>
                    </h3>
                    
                    <div className="product-card-footer">
                      <div className="price-wrapper">
                        <span className="price-amount">{getCurrencySymbol()}{p.price}</span>
                        {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                          <span className="price-compare">{getCurrencySymbol()}{p.compare_price}</span>
                        )}
                      </div>
                      <Link 
                        to={`/products/${p.slug}`}
                        className="view-details-action"
                        style={{ '--accent-color': theme.primaryColor || '#15803D' } as React.CSSProperties}
                      >
                        Details
                        <svg className="details-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Styled Sheets */}
      <style>{`
        .search-page-wrapper {
          background: var(--sf-bg, #FAF7F2);
          min-height: 80vh;
          font-family: 'Inter', sans-serif;
          color: #1F2937;
          padding: 60px 24px 100px;
          box-sizing: border-box;
        }

        .search-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* ─── Header ─── */
        .search-header {
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
        }
        .search-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2rem, 5vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #111827;
          margin: 0 0 12px;
          line-height: 1.1;
        }
        .search-subtitle {
          font-size: 0.98rem;
          color: #4B5563;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }

        /* ─── Search Bar ─── */
        .search-bar-form {
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
        }
        .search-input-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 6px 6px 6px 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
        }
        .search-input-box-wrapper:focus-within {
          border-color: var(--sf-accent, #15803D);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06), 0 0 0 4px rgba(21, 128, 61, 0.08);
        }
        .search-input-icon {
          width: 20px;
          height: 20px;
          color: #9CA3AF;
          flex-shrink: 0;
          margin-right: 12px;
        }
        .search-input-field {
          flex: 1;
          border: none;
          padding: 12px 0;
          font-size: 1rem;
          background: transparent;
          color: #111827;
          outline: none;
          min-width: 0;
          font-family: inherit;
        }
        .search-input-field::placeholder {
          color: #9CA3AF;
        }
        .search-input-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          color: #9CA3AF;
          transition: color 0.15s;
        }
        .search-input-clear-btn:hover {
          color: #4B5563;
        }
        .clear-svg-icon {
          width: 16px;
          height: 16px;
        }
        .search-input-submit-btn {
          padding: 12px 28px;
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        }
        .search-input-submit-btn:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }

        /* ─── Suggestions Tags ─── */
        .suggestions-box {
          text-align: center;
          margin-top: -12px;
        }
        .suggestions-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-right: 12px;
        }
        .suggestions-list {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
        }
        .suggestion-tag-btn {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 30px;
          padding: 6px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #4B5563;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
        }
        .suggestion-tag-btn:hover {
          background: var(--sf-bg, #FAF7F2);
          border-color: var(--sf-accent, #15803D);
          color: var(--sf-accent, #15803D);
        }

        /* ─── Results Meta ─── */
        .results-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid rgba(0, 0, 0, 0.04);
          padding-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .results-count-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #374151;
        }
        .search-sort-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-sort-label {
          font-size: 0.85rem;
          color: #6B7280;
          font-weight: 600;
        }
        .search-sort-select {
          padding: 8px 12px;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          background: #ffffff;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          color: #374151;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .search-sort-select:focus {
          border-color: var(--sf-accent, #15803D);
        }

        /* ─── Grid Area ─── */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 30px;
        }

        /* ─── Product Card ─── */
        .product-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.03);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
          border-color: rgba(0, 0, 0, 0.05);
        }
        .card-image-container {
          position: relative;
          width: 100%;
          padding-top: 100%; /* 1:1 Aspect Ratio */
          overflow: hidden;
          background: #fdfcfb;
        }
        .product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover .product-image {
          transform: scale(1.06);
        }
        .sold-out-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .sold-out-badge {
          background: #111827;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .product-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .product-card-category {
          font-size: 0.72rem;
          font-weight: 700;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .product-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 12px;
          line-height: 1.4;
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.8em;
        }
        .product-card-title a {
          color: inherit;
          text-decoration: none;
        }
        .product-card-title a:hover {
          color: var(--sf-accent, #15803D);
        }
        .product-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .price-amount {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          color: #111827;
        }
        .price-compare {
          font-size: 0.85rem;
          color: #9CA3AF;
          text-decoration: line-through;
          font-weight: 500;
        }
        .view-details-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--accent-color, #15803D);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .view-details-action:hover {
          gap: 6px;
        }
        .details-arrow {
          width: 14px;
          height: 14px;
        }

        /* ─── Welcome / Empty States ─── */
        .search-welcome-state, .search-empty-state {
          text-align: center;
          padding: 80px 40px;
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          max-width: 600px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .welcome-state-icon {
          font-size: 2.5rem;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .search-welcome-state h3, .search-empty-state h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }
        .search-welcome-state p, .search-empty-state p {
          font-size: 0.92rem;
          color: #6B7280;
          line-height: 1.5;
          margin: 0;
          max-width: 460px;
          font-weight: 500;
        }
        .empty-state-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .browse-all-btn {
          margin-top: 10px;
          padding: 12px 28px;
          border-radius: 30px;
          color: #ffffff;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        .browse-all-btn:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }

        /* ─── Skeleton ─── */
        .product-card.skeleton {
          pointer-events: none;
        }
        .card-image-skeleton {
          width: 100%;
          padding-top: 100%;
          background: #F3F4F6;
        }
        .card-body-skeleton {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .skeleton-line {
          height: 14px;
          background: #F3F4F6;
          border-radius: 4px;
        }
        .skeleton-line.line-sm { width: 35%; }
        .skeleton-line.line-md { width: 85%; height: 18px; }
        .skeleton-line.line-lg { width: 60%; }
        
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        @media (max-width: 600px) {
          .search-page-wrapper {
            padding: 40px 16px 80px;
          }
          .search-input-box-wrapper {
            padding: 4px 4px 4px 12px;
            border-radius: 12px;
          }
          .search-input-submit-btn {
            padding: 10px 18px;
            font-size: 0.88rem;
          }
          .results-meta-bar {
            flex-direction: column;
            align-items: flex-start;
          }
        }

      `}</style>
    </div>
  );
};
