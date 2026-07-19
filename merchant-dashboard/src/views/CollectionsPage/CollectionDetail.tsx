'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { merchantApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props { id: string; }

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  gallery?: { url: string; is_cover?: boolean }[];
}

export default function CollectionDetailPage({ id }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');

  // Collection fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState('');
  const [productsDirty, setProductsDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await merchantApi.getCollectionById(id);
      setName(detail.name);
      setSlug(detail.slug);
      setDescription(detail.description || '');
      setImageUrl(detail.image_url || '');
      setIsActive(detail.is_active);
      const currentIds = new Set<string>(
        (detail.products || []).map((p: any) => p.product_id as string)
      );
      setSelectedIds(currentIds);
    } catch (e: any) {
      setError(e.message || 'Collection not found.');
      setLoading(false);
      return;
    }

    // Load products separately — failure here shouldn't block the editor
    try {
      const productsResp = await merchantApi.getProducts({ limit: 500 });
      setAllProducts(productsResp?.products || productsResp || []);
    } catch {
      // non-fatal: product picker will just be empty
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const handleSaveDetails = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await merchantApi.updateCollection(id, {
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
      });
      router.push('/collections');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  const handleSaveProducts = async () => {
    setProductSaving(true);
    try {
      await merchantApi.syncCollectionProducts(id, Array.from(selectedIds));
      setProductsDirty(false);
      flash(`${selectedIds.size} product${selectedIds.size !== 1 ? 's' : ''} saved`);
    } catch (e: any) {
      setError(e.message || 'Failed to save products');
    } finally {
      setProductSaving(false);
    }
  };

  const toggleProduct = (pid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
    setProductsDirty(true);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await merchantApi.deleteCollection(id);
    router.push('/collections');
  };

  const filteredProducts = allProducts.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Split into selected + unselected for Shopify-style UX
  const selectedProducts = filteredProducts.filter(p => selectedIds.has(p.id));
  const unselectedProducts = filteredProducts.filter(p => !selectedIds.has(p.id));

  if (loading) return (
    <div className="cd-loading">
      <div className="cd-spinner" />
      Loading collection…
    </div>
  );

  if (error && !name) return (
    <div className="cd-error-page">
      <p>{error}</p>
      <button className="btn-primary" onClick={() => router.push('/collections')}>Back to Collections</button>
    </div>
  );

  return (
    <div className="cd-root">
      {/* Top bar */}
      <div className="cd-topbar">
        <button className="cd-back" onClick={() => router.push('/collections')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
          Collections
        </button>
        <div className="cd-topbar-right">
          {saveMsg && <span className="cd-save-msg">✓ {saveMsg}</span>}
          {error && <span className="cd-err-msg">{error}</span>}
          <button className="btn-primary" onClick={handleSaveDetails} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Page title */}
      <div className="cd-page-title">
        <h2>{name || 'Untitled Collection'}</h2>
        <code className="cd-slug-badge">/{slug}</code>
      </div>

      {/* Two-column layout */}
      <div className="cd-grid">

        {/* ── Left: main content ── */}
        <div className="cd-left">

          {/* Details card */}
          <div className="card cd-card">
            <h4 className="cd-card-title">Details</h4>

            <div className="cd-field">
              <Label>Title</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Summer Sale"
              />
            </div>

            <div className="cd-field">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what makes this collection special…"
              />
            </div>
          </div>

          {/* Image card */}
          <div className="card cd-card">
            <h4 className="cd-card-title">Collection image</h4>
            <div className="cd-field">
              <Label>Image URL</Label>
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            {imageUrl ? (
              <div className="cd-img-box">
                <img src={imageUrl} alt="Collection" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            ) : (
              <div className="cd-img-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>No image</span>
              </div>
            )}
          </div>

          {/* Products card */}
          <div className="card cd-card">
            <div className="cd-products-header">
              <h4 className="cd-card-title" style={{ margin: 0 }}>Products</h4>
              <div className="cd-products-meta">
                <span className="cd-selected-badge">{selectedIds.size} selected</span>
                {productsDirty && (
                  <button className="btn-primary" onClick={handleSaveProducts} disabled={productSaving} style={{ padding: '5px 14px', fontSize: '0.76rem' }}>
                    {productSaving ? 'Saving…' : 'Save products'}
                  </button>
                )}
              </div>
            </div>

            <div className="cd-search-wrap">
              <svg className="cd-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="cd-search"
                placeholder="Search products…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
              {productSearch && (
                <button className="cd-search-clear" onClick={() => setProductSearch('')}>✕</button>
              )}
            </div>

            {allProducts.length === 0 ? (
              <div className="cd-products-empty">No products in your store yet.</div>
            ) : (
              <div className="cd-product-list">
                {/* Selected products first */}
                {selectedProducts.length > 0 && (
                  <>
                    <div className="cd-list-section-label">In this collection</div>
                    {selectedProducts.map(p => <ProductRow key={p.id} product={p} checked={true} onToggle={toggleProduct} />)}
                  </>
                )}

                {/* Unselected */}
                {unselectedProducts.length > 0 && (
                  <>
                    {selectedProducts.length > 0 && <div className="cd-list-divider" />}
                    <div className="cd-list-section-label">Not in this collection</div>
                    {unselectedProducts.map(p => <ProductRow key={p.id} product={p} checked={false} onToggle={toggleProduct} />)}
                  </>
                )}

                {filteredProducts.length === 0 && (
                  <div className="cd-products-empty">No products match "{productSearch}"</div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── Right: sidebar ── */}
        <div className="cd-right">

          {/* Status card */}
          <div className="card cd-card">
            <h4 className="cd-card-title">Status</h4>
            <div className="cd-status-row">
              <button
                className={`cd-toggle ${isActive ? 'cd-toggle--on' : ''}`}
                onClick={() => setIsActive(v => !v)}
                type="button"
              >
                <span className="cd-toggle-knob" />
              </button>
              <div>
                <div className="cd-status-label">{isActive ? 'Active' : 'Inactive'}</div>
                <div className="cd-status-hint">{isActive ? 'Visible on storefront' : 'Hidden from storefront'}</div>
              </div>
            </div>
          </div>

          {/* URL card */}
          <div className="card cd-card">
            <h4 className="cd-card-title">Storefront URL</h4>
            <code className="cd-url">/collections/{slug}</code>
          </div>

          {/* Danger zone */}
          <div className="card cd-card cd-danger-card">
            <h4 className="cd-card-title cd-danger-title">Danger zone</h4>
            <p className="cd-danger-desc">Deleting a collection removes it permanently. Products are not deleted.</p>
            <button className="cd-delete-btn" onClick={handleDelete}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Delete collection
            </button>
          </div>

        </div>
      </div>

      <style>{`
        .cd-root { padding-bottom: 60px; }

        .cd-loading {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; height: 200px; color: #9CA3AF; font-size: 0.85rem;
        }
        .cd-spinner {
          width: 18px; height: 18px; border: 2px solid #E5E7EB;
          border-top-color: #6366F1; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cd-error-page {
          padding: 60px; text-align: center; color: #6B7280;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
        }

        /* Topbar */
        .cd-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 4px;
        }
        .cd-back {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          font-size: 0.8rem; font-weight: 600; color: #6B7280;
          padding: 4px 0; transition: color 0.15s;
        }
        .cd-back:hover { color: #111827; }

        .cd-topbar-right {
          display: flex; align-items: center; gap: 10px;
        }
        .cd-save-msg {
          font-size: 0.78rem; font-weight: 600; color: #059669;
          background: #D1FAE5; padding: 4px 10px; border-radius: 20px;
        }
        .cd-err-msg {
          font-size: 0.78rem; font-weight: 600; color: #DC2626;
          background: #FEE2E2; padding: 4px 10px; border-radius: 20px;
        }

        .cd-page-title {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .cd-page-title h2 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
        .cd-slug-badge {
          font-size: 0.72rem; background: #F3F4F6;
          padding: 3px 8px; border-radius: 6px; color: #6B7280;
          font-family: monospace; border: 1px solid #E5E7EB;
        }

        /* Grid */
        .cd-grid {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cd-grid { grid-template-columns: 1fr; }
        }

        /* Cards */
        .cd-card { margin-bottom: 16px; }
        .cd-card-title {
          font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: #6B7280; margin: 0 0 14px;
          padding-bottom: 10px; border-bottom: 1px solid #F3F4F6;
        }

        /* Fields */
        .cd-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
        .cd-field:last-child { margin-bottom: 0; }

        /* Image */
        .cd-img-box {
          margin-top: 10px; border-radius: 8px; overflow: hidden;
          border: 1px solid #E5E7EB; max-height: 220px;
        }
        .cd-img-box img { width: 100%; height: 220px; object-fit: cover; display: block; }
        .cd-img-placeholder {
          margin-top: 10px; height: 140px; border: 2px dashed #E5E7EB;
          border-radius: 8px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          color: #D1D5DB; font-size: 0.78rem;
        }

        /* Products */
        .cd-products-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #F3F4F6;
          gap: 10px; flex-wrap: wrap;
        }
        .cd-products-meta { display: flex; align-items: center; gap: 10px; }
        .cd-selected-badge {
          font-size: 0.72rem; font-weight: 700; color: #6366F1;
          background: #EEF2FF; padding: 3px 9px; border-radius: 20px;
        }

        .cd-search-wrap {
          position: relative; margin-bottom: 12px;
        }
        .cd-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: #9CA3AF; pointer-events: none;
        }
        .cd-search {
          width: 100%; padding: 8px 32px 8px 32px;
          border: 1.5px solid #E5E7EB; border-radius: 8px;
          font-size: 0.83rem; font-family: inherit; color: #111827;
          outline: none; background: #fff; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .cd-search:focus { border-color: #6366F1; }
        .cd-search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #9CA3AF; cursor: pointer;
          font-size: 0.8rem; padding: 2px;
        }
        .cd-search-clear:hover { color: #374151; }

        .cd-product-list {
          border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;
          max-height: 520px; overflow-y: auto;
        }
        .cd-list-section-label {
          padding: 6px 12px; font-size: 0.67rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: #9CA3AF; background: #F9FAFB;
          border-bottom: 1px solid #F3F4F6; position: sticky; top: 0; z-index: 1;
        }
        .cd-list-divider { height: 1px; background: #E5E7EB; }
        .cd-products-empty { padding: 24px; text-align: center; color: #9CA3AF; font-size: 0.82rem; }

        /* Status toggle */
        .cd-status-row { display: flex; align-items: center; gap: 12px; }
        .cd-toggle {
          width: 40px; height: 22px; border-radius: 22px;
          background: #D1D5DB; border: none; cursor: pointer;
          padding: 3px; display: flex; align-items: center;
          transition: background 0.2s; flex-shrink: 0;
        }
        .cd-toggle--on { background: #6366F1; }
        .cd-toggle-knob {
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: transform 0.2s; display: block;
        }
        .cd-toggle--on .cd-toggle-knob { transform: translateX(18px); }
        .cd-status-label { font-size: 0.83rem; font-weight: 600; color: #111827; }
        .cd-status-hint { font-size: 0.72rem; color: #9CA3AF; margin-top: 1px; }

        /* URL */
        .cd-url {
          display: block; font-size: 0.75rem; color: #6366F1;
          background: #EEF2FF; padding: 7px 10px; border-radius: 6px;
          font-family: monospace; word-break: break-all;
        }

        /* Danger zone */
        .cd-danger-card { border-color: #FEE2E2 !important; }
        .cd-danger-title { color: #DC2626 !important; }
        .cd-danger-desc { font-size: 0.76rem; color: #9CA3AF; margin: 0 0 12px; line-height: 1.5; }
        .cd-delete-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; background: #fff; border: 1.5px solid #FCA5A5;
          border-radius: 7px; color: #DC2626; font-size: 0.78rem;
          font-weight: 600; cursor: pointer; transition: background 0.15s;
        }
        .cd-delete-btn:hover { background: #FEF2F2; }
      `}</style>
    </div>
  );
}

function ProductRow({ product, checked, onToggle }: { product: Product; checked: boolean; onToggle: (id: string) => void }) {
  const cover = product.gallery?.find(g => g.is_cover)?.url || product.gallery?.[0]?.url;
  return (
    <label className={`cd-prow ${checked ? 'cd-prow--checked' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(product.id)}
      />
      <div className="cd-prow-img">
        {cover
          ? <img src={cover} alt={product.name} />
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        }
      </div>
      <span className="cd-prow-name">{product.name}</span>
      <span className="cd-prow-status" data-status={product.status}>{product.status}</span>
      <span className="cd-prow-price">₹{Number(product.price).toFixed(0)}</span>
      <style>{`
        .cd-prow {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; cursor: pointer;
          border-bottom: 1px solid #F3F4F6; transition: background 0.1s;
        }
        .cd-prow:last-child { border-bottom: none; }
        .cd-prow:hover { background: #F9FAFB; }
        .cd-prow--checked { background: #F5F3FF; }
        .cd-prow--checked:hover { background: #EDE9FE; }
        .cd-prow input[type=checkbox] {
          width: 15px; height: 15px; accent-color: #6366F1;
          cursor: pointer; flex-shrink: 0;
        }
        .cd-prow-img {
          width: 34px; height: 34px; border-radius: 5px;
          border: 1px solid #E5E7EB; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: #F3F4F6; flex-shrink: 0;
        }
        .cd-prow-img img { width: 100%; height: 100%; object-fit: cover; }
        .cd-prow-name {
          flex: 1; font-size: 0.81rem; font-weight: 500; color: #111827;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
        .cd-prow-status {
          font-size: 0.67rem; font-weight: 700; padding: 2px 7px;
          border-radius: 20px; flex-shrink: 0; text-transform: capitalize;
        }
        .cd-prow-status[data-status="published"] { background: #D1FAE5; color: #065F46; }
        .cd-prow-status[data-status="draft"] { background: #F3F4F6; color: #6B7280; }
        .cd-prow-price { font-size: 0.76rem; color: #6B7280; flex-shrink: 0; }
      `}</style>
    </label>
  );
}
