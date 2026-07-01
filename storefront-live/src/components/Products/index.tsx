'use client';
import React, { useEffect, useState } from 'react';
import { catalogApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import { getCurrencySymbol } from '@/lib/utils';

// Helper to render dynamic product badges
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
      fontSize: '0.65rem',
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

export const Products: React.FC = () => {
  const { theme, cssVariables } = usePageTheme('products');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPriceQuery, setMinPriceQuery] = useState<number | undefined>(undefined);
  const [maxPriceQuery, setMaxPriceQuery] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mobile drawer filter toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    // Fetch categories list
    catalogApi.getCategories().then((cats) => {
      setCategories(cats || []);
    }).catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: 12,
        };
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory) params.category_slug = selectedCategory;
        if (minPriceQuery !== undefined) params.min_price = minPriceQuery;
        if (maxPriceQuery !== undefined) params.max_price = maxPriceQuery;
        if (sort) params.sort = sort;

        const res = await catalogApi.getProducts(params);
        setProducts(res?.products || []);
        if (res?.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.totalItems || 0);
        }
      } catch (err) {
        console.error('Error fetching storefront products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [currentPage, searchQuery, selectedCategory, minPriceQuery, maxPriceQuery, sort]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setCurrentPage(1);
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setMinPriceQuery(minPrice ? Number(minPrice) : undefined);
    setMaxPriceQuery(maxPrice ? Number(maxPrice) : undefined);
    setCurrentPage(1);
    setIsMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinPriceQuery(undefined);
    setMaxPriceQuery(undefined);
    setSort('');
    setCurrentPage(1);
  };

  const activeCategoryObject = categories.find(c => c.slug === selectedCategory);
  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (selectedCategory ? 1 : 0) + 
    (minPriceQuery !== undefined ? 1 : 0) + 
    (maxPriceQuery !== undefined ? 1 : 0);



  return (
    <div style={cssVariables} className="catalog-wrapper">
      {/* 1. Header Hero Area */}
      <div className="catalog-hero">
        <div className="catalog-hero-inner">
          <span className="catalog-hero-badge">Curated Collection</span>
          <h1 className="catalog-hero-title">Discover Wellness</h1>
          <p className="catalog-hero-desc">Explore premium botanical formulations crafted thoughtfully for your skincare journey.</p>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="catalog-workspace">
        
        {/* Left Panel: Desktop Filters */}
        <aside className="catalog-sidebar">
          {/* Search Box */}
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Search</h4>
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-field"
                />
                {search && (
                  <button type="button" onClick={clearSearch} className="search-clear-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="clear-icon">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories Filter */}
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Collections</h4>
            <div className="category-links">
              <button
                onClick={() => handleCategorySelect('')}
                className={`category-link-btn ${!selectedCategory ? 'active' : ''}`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`category-link-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Price Range</h4>
            <form onSubmit={handleApplyPrice} className="price-filter-form">
              <div className="price-inputs">
                <div className="price-input-box">
                  <span className="price-input-prefix">{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="price-field"
                  />
                </div>
                <span className="price-divider">to</span>
                <div className="price-input-box">
                  <span className="price-input-prefix">{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="price-field"
                  />
                </div>
              </div>
              <button type="submit" className="price-apply-btn">Apply Range</button>
            </form>
          </div>

          {/* Sorting */}
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Sort By</h4>
            <div className="custom-select-wrapper">
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select-element"
              >
                <option value="">New Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Popularity</option>
              </select>
              <div className="custom-select-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button onClick={clearAllFilters} className="clear-all-filters-btn">
              Clear All Filters
            </button>
          )}
        </aside>

        {/* Right Panel: Content Grid */}
        <main className="catalog-main">
          {/* Mobile Navigation / Trigger Bar */}
          <div className="mobile-toolbar">
            <form onSubmit={handleSearchSubmit} className="mobile-search-form">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search skincare..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-field"
                />
                {search && (
                  <button type="button" onClick={clearSearch} className="search-clear-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="clear-icon">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </form>

            <button onClick={() => setIsMobileFilterOpen(true)} className="mobile-filter-trigger">
              <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
              <span>Filters</span>
              {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>

          {/* Active Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="active-chips-container">
              <span className="chips-label">Active Filters:</span>
              <div className="chips-list">
                {searchQuery && (
                  <span className="filter-chip">
                    Search: "{searchQuery}"
                    <button onClick={clearSearch} className="chip-remove-btn">×</button>
                  </span>
                )}
                {selectedCategory && activeCategoryObject && (
                  <span className="filter-chip">
                    Collection: {activeCategoryObject.name}
                    <button onClick={() => handleCategorySelect('')} className="chip-remove-btn">×</button>
                  </span>
                )}
                {minPriceQuery !== undefined && (
                  <span className="filter-chip">
                    Min: {getCurrencySymbol()}{minPriceQuery}
                    <button onClick={() => { setMinPrice(''); setMinPriceQuery(undefined); }} className="chip-remove-btn">×</button>
                  </span>
                )}
                {maxPriceQuery !== undefined && (
                  <span className="filter-chip">
                    Max: {getCurrencySymbol()}{maxPriceQuery}
                    <button onClick={() => { setMaxPrice(''); setMaxPriceQuery(undefined); }} className="chip-remove-btn">×</button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="chips-clear-all">Clear All</button>
              </div>
            </div>
          )}

          {/* Catalog Top Info Bar */}
          <div className="catalog-top-info">
            <span className="results-count">
              {loading ? 'Searching products...' : `${totalItems} products found`}
            </span>
            <div className="desktop-sort-wrapper">
              <label className="sort-label">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="desktop-sort-select"
              >
                <option value="">New Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Popularity</option>
              </select>
            </div>
          </div>

          {/* Cards Area */}
          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, idx) => (
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
          ) : products.length === 0 ? (
            <div className="empty-results-card">
              <span className="empty-icon">🍃</span>
              <h3 className="empty-title">No Products Match Filters</h3>
              <p className="empty-desc">Try clearing filters or adjusting your search queries to see more skincare formulations.</p>
              <button onClick={clearAllFilters} className="empty-clear-btn">Reset Catalog Filters</button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((p) => {
                  const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
                  const isOutOfStock = p.variants?.every((v: any) => (v.stock_qty || 0) <= 0);
                  
                  return (
                    <a key={p.id} href={`/products/${p.slug}`} className="product-card">
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
                        <h3 className="product-card-title">{p.name}</h3>

                        <div className="product-card-footer">
                          <div className="price-wrapper">
                            <span className="price-amount">{getCurrencySymbol()}{p.price}</span>
                            {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                              <span className="price-compare">{getCurrencySymbol()}{p.compare_price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="pagination-btn arrow-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, pageIdx) => {
                      const pageNum = pageIdx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`pagination-btn number-btn ${currentPage === pageNum ? 'active' : ''}`}
                          style={currentPage === pageNum ? { background: theme.primaryColor || '#15803D' } : {}}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="pagination-btn arrow-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Mobile Filter Drawer Bottom-Sheet */}
      {isMobileFilterOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Filter Catalog</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="drawer-close-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="drawer-body">
              {/* Category selector */}
              <div className="drawer-field-group">
                <label className="drawer-label">Collections</label>
                <div className="mobile-category-chips">
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`mobile-chip ${!selectedCategory ? 'active' : ''}`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`mobile-chip ${selectedCategory === cat.slug ? 'active' : ''}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className="drawer-field-group">
                <label className="drawer-label">Price Range</label>
                <form onSubmit={handleApplyPrice} className="price-filter-form">
                  <div className="price-inputs">
                    <div className="price-input-box">
                      <span className="price-input-prefix">{getCurrencySymbol()}</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="price-field"
                      />
                    </div>
                    <span className="price-divider">to</span>
                    <div className="price-input-box">
                      <span className="price-input-prefix">{getCurrencySymbol()}</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="price-field"
                      />
                    </div>
                  </div>
                  <button type="submit" className="drawer-apply-price-btn" style={{ background: theme.primaryColor || '#15803D' }}>
                    Apply Price Range
                  </button>
                </form>
              </div>

              {/* Sort filter */}
              <div className="drawer-field-group">
                <label className="drawer-label">Sort By</label>
                <div className="custom-select-wrapper">
                  <select
                    value={sort}
                    onChange={(e) => {
                      handleSortChange(e.target.value);
                      setIsMobileFilterOpen(false);
                    }}
                    className="sort-select-element"
                  >
                    <option value="">New Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Popularity</option>
                  </select>
                  <div className="custom-select-arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button onClick={clearAllFilters} className="drawer-reset-btn">Reset All</button>
              <button onClick={() => setIsMobileFilterOpen(false)} className="drawer-done-btn" style={{ background: theme.primaryColor || '#15803D' }}>
                Done ({totalItems} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Sheets */}
      <style>{`
        .catalog-wrapper {
          background: var(--sf-bg, #FAF7F2);
          min-height: 90vh;
          font-family: 'Inter', sans-serif;
          color: var(--sf-text-main, #1F2937);
          display: flex;
          flex-direction: column;
        }

        /* ─── Hero Styles ─── */
        .catalog-hero {
          background: var(--sf-bg, #FAF7F2);
          border-bottom: 1px solid var(--sf-border, rgba(0,0,0,0.06));
          padding: 80px 24px;
          text-align: center;
        }
        .catalog-hero-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .catalog-hero-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--sf-text-muted, #777);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.12));
          padding: 5px 14px;
          margin-bottom: 20px;
        }
        .catalog-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--sf-text-main, #111);
          line-height: 1.1;
          margin: 0 0 16px;
        }
        .catalog-hero-desc {
          font-size: 1.05rem;
          color: var(--sf-text-muted, #4B5563);
          line-height: 1.6;
          margin: 0;
          font-weight: 400;
        }

        /* ─── Workspace Layout ─── */
        .catalog-workspace {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 48px 24px 80px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 32px;
          box-sizing: border-box;
        }

        /* ─── Sidebar Filters ─── */
        .catalog-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: sticky;
          top: 90px;
          height: fit-content;
        }
        .sidebar-section-title {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--sf-text-muted, #9ca3af);
          margin: 0 0 10px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--sf-card-bg, #fff);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
          border-radius: 2px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .search-input-wrapper:focus-within {
          border-color: var(--sf-accent, #15803D);
        }
        .search-icon {
          width: 14px;
          height: 14px;
          color: var(--sf-text-muted, #9CA3AF);
          margin-left: 10px;
          flex-shrink: 0;
        }
        .search-field {
          flex: 1;
          border: none;
          padding: 8px 8px 8px 6px;
          font-size: 0.8rem;
          background: transparent;
          color: var(--sf-text-main, #111);
          outline: none;
          min-width: 0;
        }
        .search-clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          color: var(--sf-text-muted, #9CA3AF);
        }
        .search-clear-btn:hover { color: var(--sf-text-main, #4B5563); }
        .clear-icon { width: 12px; height: 12px; }

        /* Collections filter */
        .category-links {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .category-link-btn {
          border: none;
          background: transparent;
          text-align: left;
          padding: 7px 8px;
          border-radius: 2px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--sf-text-muted, #6b7280);
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .category-link-btn:hover {
          background: rgba(0,0,0,0.04);
          color: var(--sf-text-main, #111);
        }
        .category-link-btn.active {
          background: rgba(var(--sf-accent-rgb, 21,128,61), 0.07);
          color: var(--sf-accent, #15803D);
          font-weight: 600;
        }

        /* Price inputs */
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .price-input-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--sf-card-bg, #fff);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
          border-radius: 2px;
          flex: 1;
        }
        .price-input-prefix {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--sf-text-muted, #9CA3AF);
          margin-left: 8px;
        }
        .price-field {
          border: none;
          background: transparent;
          padding: 7px 5px;
          font-size: 0.8rem;
          color: var(--sf-text-main, #111);
          width: 100%;
          outline: none;
          -moz-appearance: textfield;
        }
        .price-field::-webkit-outer-spin-button,
        .price-field::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .price-divider { font-size: 0.75rem; color: var(--sf-border, rgba(0,0,0,0.2)); }
        .price-apply-btn {
          width: 100%;
          padding: 8px;
          background: transparent;
          border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
          border-radius: 2px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--sf-text-main, #374151);
          transition: all 0.15s ease;
        }
        .price-apply-btn:hover {
          background: var(--sf-accent, #15803D);
          color: #fff;
          border-color: var(--sf-accent, #15803D);
        }

        /* Select styling */
        .custom-select-wrapper { position: relative; }
        .sort-select-element {
          width: 100%;
          padding: 8px 30px 8px 10px;
          background: var(--sf-card-bg, #fff);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
          border-radius: 2px;
          font-size: 0.8rem;
          color: var(--sf-text-main, #374151);
          font-weight: 500;
          outline: none;
          cursor: pointer;
          appearance: none;
          transition: border-color 0.2s;
        }
        .sort-select-element:focus { border-color: var(--sf-accent, #15803D); }
        .custom-select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 13px;
          height: 13px;
          color: var(--sf-text-muted, #9CA3AF);
          pointer-events: none;
        }

        .clear-all-filters-btn {
          width: 100%;
          padding: 8px;
          background: transparent;
          color: #dc2626;
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .clear-all-filters-btn:hover {
          background: #dc2626;
          color: #fff;
          border-color: #dc2626;
        }

        /* ─── Content Grid ─── */
        .catalog-main {
          display: flex;
          flex-direction: column;
        }
        .mobile-toolbar {
          display: none;
          gap: 12px;
          margin-bottom: 24px;
        }

        /* Active Chips */
        .active-chips-container {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          background: var(--sf-card-bg, rgba(0,0,0,0.02));
          border: 1px solid var(--sf-border, rgba(0,0,0,0.06));
          padding: 10px 16px;
          border-radius: 2px;
        }
        .chips-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--sf-text-muted, #6B7280);
        }
        .chips-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--sf-bg, #ffffff);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.08));
          padding: 4px 10px 4px 12px;
          border-radius: 2px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--sf-text-main, #1F2937);
        }
        .chip-remove-btn {
          background: none;
          border: none;
          font-size: 1rem;
          color: var(--sf-text-muted, #9CA3AF);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
          line-height: 1;
        }
        .chip-remove-btn:hover {
          color: #dc2626;
        }
        .chips-clear-all {
          border: none;
          background: transparent;
          color: var(--sf-accent, #15803D);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
        }

        /* Top Info bar */
        .catalog-top-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .results-count {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--sf-text-muted, #6B7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .desktop-sort-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sort-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--sf-text-muted, #6B7280);
        }
        .desktop-sort-select {
          border: none;
          background: transparent;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--sf-text-main, #111);
          outline: none;
          cursor: pointer;
          padding-right: 8px;
        }

        /* Products Grid */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          margin-bottom: 48px;
        }

        /* Card designs */
        .product-card {
          background: var(--sf-card-bg, #ffffff);
          border: 1px solid var(--sf-border, rgba(0,0,0,0.06));
          border-radius: 2px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .product-card:hover {
          border-color: var(--sf-text-muted, rgba(0,0,0,0.15));
        }

        .card-image-container {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--sf-card-bg, #F9FAFB);
        }
        .product-image {
          width: 100%;
          height: 100%;
          object-cover: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .product-card:hover .product-image {
          transform: scale(1.04);
        }

        .sale-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: #EF4444;
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 2px;
        }
        .sold-out-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sold-out-badge {
          background: var(--sf-bg, #fff);
          color: var(--sf-text-main, #111);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 6px 14px;
        }

        .product-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .product-card-category {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--sf-text-muted, #9CA3AF);
          margin-bottom: 6px;
        }
        .product-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--sf-text-main, #111);
          margin: 0 0 14px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .product-card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--sf-border, rgba(0,0,0,0.06));
        }
        .price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .price-amount {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--sf-text-main, #111);
        }
        .price-compare {
          font-size: 0.75rem;
          color: var(--sf-text-muted, #9CA3AF);
          text-decoration: line-through;
          font-weight: 500;
        }

        .view-details-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-color, #15803D);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .view-details-action:hover {
          color: var(--accent-color, #15803D);
          opacity: 0.85;
        }
        .details-arrow {
          width: 14px;
          height: 14px;
          transition: transform 0.2s ease;
        }
        .view-details-action:hover .details-arrow {
          transform: translateX(4px);
        }

        /* ─── Empty state ─── */
        .empty-results-card {
          text-align: center;
          padding: 80px 24px;
          background: var(--sf-card-bg, #ffffff);
          border: 1px dashed var(--sf-border, rgba(0,0,0,0.1));
          border-radius: 2px;
          margin: 20px 0;
        }
        .empty-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 16px;
        }
        .empty-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--sf-text-main, #111);
          margin: 0 0 8px;
        }
        .empty-desc {
          font-size: 0.88rem;
          color: var(--sf-text-muted, #6B7280);
          max-width: 400px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }
        .empty-clear-btn {
          padding: 10px 24px;
          background: var(--sf-text-main, #111);
          color: var(--sf-bg, #fff);
          border: none;
          border-radius: 2px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .empty-clear-btn:hover {
          opacity: 0.8;
        }

        /* ─── Pagination ─── */
        .pagination-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }
        .pagination-btn {
          border: 1.5px solid var(--sf-border, rgba(0,0,0,0.1));
          background: var(--sf-card-bg, #ffffff);
          color: var(--sf-text-main, #111);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: var(--sf-accent, #15803D);
          color: var(--sf-accent, #15803D);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .arrow-btn {
          width: 38px;
          height: 38px;
          border-radius: 2px;
          padding: 0;
        }
        .arrow-btn svg {
          width: 16px;
          height: 16px;
        }
        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .number-btn {
          width: 38px;
          height: 38px;
          border-radius: 2px;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--sf-text-muted, #4B5563);
        }
        .number-btn.active {
          color: #ffffff;
          border-color: transparent;
        }

        /* ─── Skeletons ─── */
        .product-card.skeleton {
          pointer-events: none;
          box-shadow: none;
        }
        .card-image-skeleton {
          aspect-ratio: 1;
          background: var(--sf-border, rgba(0,0,0,0.08));
        }
        .card-body-skeleton {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .skeleton-line {
          height: 12px;
          background: var(--sf-border, rgba(0,0,0,0.06));
          border-radius: 2px;
        }
        .skeleton-line.line-sm { width: 35%; }
        .skeleton-line.line-md { height: 16px; width: 85%; }
        .skeleton-line.line-lg { height: 14px; width: 60%; margin-top: 10px; }

        /* ─── Mobile Drawer Backdrop & Sheets ─── */
        .mobile-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .mobile-drawer-content {
          background: var(--sf-card-bg, #ffffff);
          width: 100%;
          max-width: 500px;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--sf-border, rgba(0,0,0,0.06));
        }
        .drawer-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--sf-text-main, #111);
          margin: 0;
        }
        .drawer-close-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--sf-text-muted, #9CA3AF);
          padding: 4px;
        }
        .drawer-close-btn svg {
          width: 20px;
          height: 20px;
        }

        .drawer-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
          flex: 1;
        }
        .drawer-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--sf-text-main, #111);
          display: block;
          margin-bottom: 12px;
        }
        .mobile-category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mobile-chip {
          border: 1.5px solid var(--sf-border, rgba(0,0,0,0.1));
          background: var(--sf-card-bg, #ffffff);
          padding: 8px 14px;
          border-radius: 2px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--sf-text-muted, #4B5563);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mobile-chip.active {
          border-color: var(--sf-accent, #15803D);
          background: rgba(21, 128, 61, 0.06);
          color: var(--sf-accent, #15803D);
        }
        .drawer-apply-price-btn {
          width: 100%;
          padding: 11px;
          background: var(--sf-accent, #15803D);
          color: #ffffff;
          border: none;
          border-radius: 2px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
        }

        .drawer-footer {
          display: flex;
          padding: 20px 24px;
          border-top: 1px solid var(--sf-border, rgba(0,0,0,0.06));
          gap: 12px;
        }
        .drawer-reset-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--sf-border, rgba(0,0,0,0.1));
          color: var(--sf-text-muted, #4B5563);
          border-radius: 2px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }
        .drawer-done-btn {
          flex: 2;
          padding: 12px;
          color: #ffffff;
          border: none;
          border-radius: 2px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* ─── Responsive Queries ─── */
        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .catalog-workspace {
            grid-template-columns: 1fr;
            padding: 28px 20px 60px;
            gap: 24px;
          }
          .catalog-sidebar {
            display: none;
          }
          .mobile-toolbar {
            display: flex;
          }
          .mobile-search-form {
            flex: 1;
          }
          .mobile-filter-trigger {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--sf-card-bg, #ffffff);
            border: 1.5px solid var(--sf-border, rgba(0,0,0,0.1));
            padding: 11px 16px;
            border-radius: 2px;
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--sf-text-main, #1F2937);
            cursor: pointer;
          }
          .filter-icon {
            width: 16px;
            height: 16px;
            color: var(--sf-text-muted, #4B5563);
          }
          .filter-badge {
            background: var(--sf-accent, #15803D);
            color: #ffffff;
            font-size: 0.7rem;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            font-weight: 800;
          }
          .desktop-sort-wrapper {
            display: none;
          }
          .catalog-hero {
            padding: 60px 20px;
          }
          .catalog-hero-title {
            font-size: 2.4rem;
          }
        }
        @media (max-width: 768px) {
          .catalog-hero { padding: 36px 20px; }
          .catalog-hero-title { font-size: 1.9rem; }
          .catalog-hero-desc { font-size: 0.9rem; }
        }
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .catalog-hero { padding: 28px 16px; }
          .catalog-hero-title { font-size: 1.65rem; }
          .catalog-hero-desc { font-size: 0.88rem; }
        }
      `}</style>
    </div>
  );
};
