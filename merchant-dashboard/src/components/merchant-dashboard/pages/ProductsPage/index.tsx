import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner, EmptyState } from '../../shared';
import { formatINR } from '../../utils';

interface ProductsPageProps {
  products: any[];
  categories: any[];
  brands: any[];
  loading: boolean;
  onCreateProduct: (data: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  creating: boolean;
  deleting: boolean;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products, categories, brands, loading,
  onCreateProduct, onDeleteProduct,
  creating, deleting
}) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [catId, setCatId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState('active');
  const [desc, setDesc] = useState('');

  const resetForm = () => {
    setName('');
    setSku('');
    setPrice('');
    setComparePrice('');
    setCatId('');
    setBrandId('');
    setStatus('active');
    setDesc('');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await onCreateProduct({
      name,
      slug,
      master_sku: sku || null,
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      category_id: catId || null,
      brand_id: brandId || null,
      status,
      description: desc || null,
    });
    
    resetForm();
    setShowAddForm(false);
  };

  const handleEditClick = (p: any) => {
    const base = window.location.pathname.startsWith('/dashboard') ? '/dashboard' : '/admin';
    navigate(`${base}/products/${p.id}`);
  };

  const handleDeleteClick = async (p: any) => {
    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
      await onDeleteProduct(p.id);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Products Registry</h2>
          <p className="header-sub">{products.length} products listed in database</p>
        </div>
        {!showAddForm && (
          <button className="btn-primary" onClick={() => { resetForm(); setShowAddForm(true); }}>
            <Icons.Plus /> Add New Product
          </button>
        )}
      </header>

      {/* Add New Product Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Add New Product</h3>
            <button className="btn-ghost-sm" onClick={() => setShowAddForm(false)}><Icons.X /> Cancel</button>
          </div>
          <form onSubmit={handleCreateSubmit} className="form-grid">
            <div className="form-row">
              <div className="field-group">
                <label>Product Name *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lavender Face Wash" />
              </div>
              <div className="field-group">
                <label>Master SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. LAV-FW-100" />
              </div>
            </div>
            <div className="form-row">
              <div className="field-group">
                <label>Price (INR) *</label>
                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 299.00" />
              </div>
              <div className="field-group">
                <label>Compare Price (INR)</label>
                <input type="number" step="0.01" value={comparePrice} onChange={e => setComparePrice(e.target.value)} placeholder="e.g. 399.00" />
              </div>
            </div>
            <div className="form-row">
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
              <label>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Provide details about product uses, benefits, and ingredients..." />
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={creating}>
              {creating ? 'Creating Product…' : 'Publish Product'}
            </button>
          </form>
        </div>
      )}

      {/* Edit modal removed in favor of full screen editor page */}

      {/* Product Listings Table */}
      <div className="card">
        <h3 className="card-title">Catalog Inventory</h3>
        {loading ? <LoadingSpinner message="Fetching products..." /> : products.length === 0 ? (
          <EmptyState message="No products in catalog yet. Click 'Add New Product' to start building your inventory." />
        ) : (
          <div className="db-table-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Compare Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', marginTop: 2 }}>
                          {p.category?.name || 'Uncategorized'}
                        </div>
                      </div>
                    </td>
                    <td><code>{p.master_sku || '—'}</code></td>
                    <td>{formatINR(p.price)}</td>
                    <td>{p.compare_price ? formatINR(p.compare_price) : '—'}</td>
                    <td>
                      <Badge type={p.status === 'active' ? 'success' : 'warn'}>
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button className="btn-ghost-sm" onClick={() => handleEditClick(p)}>
                          <Icons.Edit /> Edit
                        </button>
                        <button className="btn-danger-sm" onClick={() => handleDeleteClick(p)} disabled={deleting}>
                          <Icons.Trash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

