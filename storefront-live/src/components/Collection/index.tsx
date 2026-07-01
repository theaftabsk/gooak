'use client';
import React, { useEffect, useState } from 'react';

import { storefrontApi } from '@/lib/api-client';
import { usePageTheme } from '@/hooks/usePageTheme';
import { getCurrencySymbol } from '@/lib/utils';

export const Collection: React.FC<{ collectionSlug?: string }> = ({ collectionSlug }) => {

  const { theme, cssVariables } = usePageTheme('collection');

  if (collectionSlug) return <CollectionDetail slug={collectionSlug} theme={theme} cssVariables={cssVariables} />;
  return <CollectionList theme={theme} cssVariables={cssVariables} />;
};

const CollectionList: React.FC<{ theme: any; cssVariables: any }> = ({ cssVariables }) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storefrontApi.getCollections()
      .then((data) => setCollections(data || []))
      .catch((err) => console.error('Error fetching collections:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={cssVariables} className="coll-wrapper">
      <div className="coll-hero">
        <div className="coll-hero-inner">
          <span className="coll-hero-badge">Shop by Collection</span>
          <h1 className="coll-hero-title">Collections</h1>
          <p className="coll-hero-desc">Browse curated groupings of products picked out for you.</p>
        </div>
      </div>

      <div className="coll-grid-area">
        {loading ? (
          <div className="coll-grid">
            {[...Array(4)].map((_, idx) => <div key={idx} className="coll-card skeleton" />)}
          </div>
        ) : collections.length === 0 ? (
          <div className="coll-empty">No collections yet.</div>
        ) : (
          <div className="coll-grid">
            {collections.map((c) => (
              <a key={c.id} href={`/collections/${c.slug}`} className="coll-card">
                <div className="coll-card-image" style={{ backgroundImage: c.image_url ? `url(${c.image_url})` : undefined }}>
                  {!c.image_url && <span className="coll-card-fallback">{c.name.charAt(0)}</span>}
                </div>
                <div className="coll-card-body">
                  <h3 className="coll-card-title">{c.name}</h3>
                  {c.description && <p className="coll-card-desc">{c.description}</p>}
                  <span className="coll-card-count">{c._count?.products ?? 0} products</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{COLLECTION_STYLES}</style>
    </div>
  );
};

const CollectionDetail: React.FC<{ slug: string; theme: any; cssVariables: any }> = ({ slug, theme, cssVariables }) => {
  const [collection, setCollection] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => { setCurrentPage(1); }, [slug]);

  useEffect(() => {
    setLoading(true);
    storefrontApi.getCollection(slug, { page: currentPage, limit: 12, ...(sort ? { sort } : {}) })
      .then((res) => {
        setCollection(res?.collection || null);
        setProducts(res?.products || []);
        if (res?.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalItems(res.pagination.totalItems || 0);
        }
      })
      .catch((err) => console.error('Error fetching collection:', err))
      .finally(() => setLoading(false));
  }, [slug, currentPage, sort]);

  return (
    <div style={cssVariables} className="coll-wrapper">
      <div className="coll-hero">
        <div className="coll-hero-inner">
          <span className="coll-hero-badge">Collection</span>
          <h1 className="coll-hero-title">{collection?.name || '...'}</h1>
          {collection?.description && <p className="coll-hero-desc">{collection.description}</p>}
        </div>
      </div>

      <div className="coll-detail-area">
        <div className="coll-top-info">
          <span className="coll-results-count">{loading ? 'Loading...' : `${totalItems} products`}</span>
          <div className="coll-sort-wrap">
            <label>Sort by:</label>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}>
              <option value="">New Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="coll-products-grid">
            {[...Array(8)].map((_, idx) => <div key={idx} className="coll-product-card skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="coll-empty">No products in this collection yet.</div>
        ) : (
          <>
            <div className="coll-products-grid">
              {products.map((p) => {
                const coverImage = p.gallery?.find((g: any) => g.is_cover)?.url || p.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600';
                const isOutOfStock = p.variants?.every((v: any) => (v.stock_qty || 0) <= 0);
                return (
                  <div key={p.id} className="coll-product-card">
                    <div className="coll-card-image-container">
                      <img src={coverImage} alt={p.name} className="coll-product-image" loading="lazy" />
                      {isOutOfStock && (
                        <div className="coll-sold-out-overlay"><span>Sold Out</span></div>
                      )}
                    </div>
                    <div className="coll-product-body">
                      <span className="coll-product-category">{p.category?.name || ''}</span>
                      <h3 className="coll-product-title">{p.name}</h3>
                      <div className="coll-product-footer">
                        <div className="coll-price-wrap">
                          <span className="coll-price-amount">{getCurrencySymbol()}{p.price}</span>
                          {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                            <span className="coll-price-compare">{getCurrencySymbol()}{p.compare_price}</span>
                          )}
                        </div>
                        <a href={`/products/${p.slug}`} className="coll-view-details" style={{ '--accent-color': theme.primaryColor || '#15803D' } as React.CSSProperties}>
                          Details
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="coll-pagination">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>‹</button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button key={idx} className={currentPage === idx + 1 ? 'active' : ''} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                ))}
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{COLLECTION_STYLES}</style>
    </div>
  );
};

const COLLECTION_STYLES = `
  .coll-wrapper { background: var(--sf-bg, #FAF7F2); min-height: 90vh; font-family: 'Inter', sans-serif; color: var(--sf-text-main, #1F2937); }
  .coll-hero { background: var(--sf-bg, #FAF7F2); border-bottom: 1px solid var(--sf-border, rgba(0,0,0,0.06)); padding: 70px 24px; text-align: center; }
  .coll-hero-inner { max-width: 720px; margin: 0 auto; }
  .coll-hero-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--sf-text-muted, #777); border: 1px solid var(--sf-border, rgba(0,0,0,0.12)); padding: 5px 14px; margin-bottom: 18px; }
  .coll-hero-title { font-family: 'Outfit', sans-serif; font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em; color: var(--sf-text-main, #111); margin: 0 0 14px; }
  .coll-hero-desc { font-size: 1.02rem; color: var(--sf-text-muted, #4B5563); line-height: 1.6; margin: 0; font-weight: 400; }

  .coll-grid-area { max-width: 1300px; margin: 0 auto; padding: 48px 24px 80px; }
  .coll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .coll-card { display: flex; flex-direction: column; background: var(--sf-card-bg, #fff); border-radius: 2px; overflow: hidden; border: 1px solid var(--sf-border, rgba(0,0,0,0.06)); text-decoration: none; color: inherit; transition: border-color 0.2s; }
  .coll-card:hover { border-color: var(--sf-text-muted, rgba(0,0,0,0.15)); }
  .coll-card-image { aspect-ratio: 16/9; background: var(--sf-card-bg, #F3F4F6) center/cover no-repeat; display: flex; align-items: center; justify-content: center; }
  .coll-card-fallback { font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 800; color: var(--sf-accent, #15803D); opacity: 0.4; }
  .coll-card-body { padding: 18px; display: flex; flex-direction: column; gap: 5px; }
  .coll-card-title { font-family: 'Outfit', sans-serif; font-size: 1rem; font-weight: 700; margin: 0; color: var(--sf-text-main, #111); }
  .coll-card-desc { font-size: 0.82rem; color: var(--sf-text-muted, #6B7280); margin: 0; line-height: 1.5; }
  .coll-card-count { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sf-text-muted, #999); margin-top: 6px; }
  .coll-card.skeleton { aspect-ratio: 4/3; background: var(--sf-border, rgba(0,0,0,0.08)); }

  .coll-empty { text-align: center; padding: 80px 24px; color: var(--sf-text-muted, #6B7280); font-size: 0.95rem; }

  .coll-detail-area { max-width: 1300px; margin: 0 auto; padding: 48px 24px 80px; }
  .coll-top-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .coll-results-count { font-size: 0.88rem; font-weight: 700; color: var(--sf-text-muted, #6B7280); text-transform: uppercase; letter-spacing: 0.05em; }
  .coll-sort-wrap { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; color: var(--sf-text-muted, #6B7280); }
  .coll-sort-wrap select { border: 1px solid var(--sf-border, rgba(0,0,0,0.1)); border-radius: 2px; padding: 6px 10px; font-size: 0.85rem; font-weight: 600; background: var(--sf-card-bg, #fff); color: var(--sf-text-main, #111); outline: none; }

  .coll-products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
  .coll-product-card { background: var(--sf-card-bg, #fff); border: 1px solid var(--sf-border, rgba(0,0,0,0.06)); border-radius: 2px; overflow: hidden; transition: border-color 0.2s; }
  .coll-product-card:hover { border-color: var(--sf-text-muted, rgba(0,0,0,0.15)); }
  .coll-product-card.skeleton { aspect-ratio: 3/4; background: var(--sf-border, rgba(0,0,0,0.08)); }
  .coll-card-image-container { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--sf-card-bg, #F9FAFB); }
  .coll-product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .coll-product-card:hover .coll-product-image { transform: scale(1.04); }
  .coll-sold-out-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; }
  .coll-sold-out-overlay span { background: var(--sf-bg, #fff); color: var(--sf-text-main, #111); font-size: 0.72rem; font-weight: 700; padding: 6px 14px; text-transform: uppercase; letter-spacing: 0.05em; }
  .coll-product-body { padding: 18px; }
  .coll-product-category { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sf-text-muted, #9CA3AF); display: block; }
  .coll-product-title { font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700; color: var(--sf-text-main, #111); margin: 5px 0 12px; }
  .coll-product-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--sf-border, rgba(0,0,0,0.06)); }
  .coll-price-wrap { display: flex; align-items: baseline; gap: 6px; }
  .coll-price-amount { font-size: 1rem; font-weight: 800; color: var(--sf-text-main, #111); }
  .coll-price-compare { font-size: 0.75rem; color: var(--sf-text-muted, #9CA3AF); text-decoration: line-through; }
  .coll-view-details { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-color, var(--sf-accent, #15803D)); text-decoration: none; opacity: 1; transition: opacity 0.2s; }
  .coll-view-details:hover { opacity: 0.75; }

  .coll-pagination { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 24px; }
  .coll-pagination button { width: 36px; height: 36px; border-radius: 2px; border: 1px solid var(--sf-border, rgba(0,0,0,0.1)); background: var(--sf-card-bg, #fff); cursor: pointer; font-weight: 700; color: var(--sf-text-muted, #4B5563); }
  .coll-pagination button.active { background: var(--sf-accent, #15803D); color: #fff; border-color: transparent; }
  .coll-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 768px) {
    .coll-hero { padding: 36px 20px; }
    .coll-hero-title { font-size: 1.9rem; }
    .coll-hero-desc { font-size: 0.9rem; }
    .coll-products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px 8px; }
    .coll-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .coll-hero { padding: 28px 16px; }
    .coll-hero-title { font-size: 1.65rem; }
    .coll-products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px 6px; }
  }
`;

export default Collection;
