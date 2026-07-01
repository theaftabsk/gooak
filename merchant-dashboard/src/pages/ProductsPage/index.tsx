import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner, EmptyState } from '@/components/ui/Shared';
import { formatINR } from '@/utils';

interface ProductsPageProps {
  shopInfo: any;
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
  shopInfo, products, categories, brands, loading,
  onCreateProduct, onDeleteProduct,
  creating, deleting
}) => {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter & Pagination states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    router.push(`/products/${p.id}`);
  };

  const handleDeleteClick = async (p: any) => {
    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
      await onDeleteProduct(p.id);
      // Reset to page 1 if current page would be out of bounds after deletion
      const remainingFiltered = categoryFilter
        ? products.filter(prod => prod.id !== p.id && prod.category_id === categoryFilter)
        : products.filter(prod => prod.id !== p.id);
      const totalPagesAfterDelete = Math.ceil(remainingFiltered.length / itemsPerPage);
      if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete);
      }
    }
  };

  // Stock status badge utility
  const getStockBadge = (p: any) => {
    const variants = p.variants || [];
    if (variants.length === 0) {
      return <Badge type="danger">OUT OF STOCK</Badge>;
    }
    const qty = variants.reduce((sum: number, v: any) => sum + (v.stock_qty !== undefined ? v.stock_qty : (v.stockQty || 0)), 0);
    if (qty <= 0) {
      return <Badge type="danger">OUT OF STOCK</Badge>;
    }
    const lowAt = variants.reduce((max: number, v: any) => Math.max(max, v.low_stock_at !== undefined ? v.low_stock_at : (v.lowStockAt || 5)), 0);
    if (qty <= lowAt) {
      return <Badge type="warn">{qty} LOW STOCK</Badge>;
    }
    return <Badge type="success">{qty} IN STOCK</Badge>;
  };

  // 1. Filter logic
  const filteredProducts = categoryFilter
    ? products.filter(p => p.category_id === categoryFilter)
    : products;

  // 2. Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const shopSlug = shopInfo?.slug || 'store';
  const domain = shopInfo?.domains?.[0]?.domain || `${shopSlug}.localhost:3001`;

  return (
    <>
      <style>{`
        .action-link {
          text-decoration: none;
          font-weight: 600;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      <header className="page-header">
        <div>
          <h2>Products Registry</h2>
          <p className="header-sub">{products.length} products listed in database</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            router.push('/products/new');
          }}
        >
          <Icons.Plus /> Add New Product
        </button>
      </header>

      {/* Product Listings Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Catalog Inventory</h3>
          
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-muted)' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--m-border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <LoadingSpinner message="Fetching products..." /> : filteredProducts.length === 0 ? (
          <EmptyState message={categoryFilter ? "No products found matching the selected category." : "No products in catalog yet. Click 'Add New Product' to start building your inventory."} />
        ) : (
          <>
            <div className="db-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Compare Price</th>
                    <th>Stock Status</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
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
                      <td>{getStockBadge(p)}</td>
                      <td>
                        <Badge type={p.status === 'active' ? 'success' : 'warn'}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--m-border)', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)' }}>
                  Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> products
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn-ghost-sm" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <Icons.ArrowLeft /> Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      className="btn-ghost-sm"
                      style={{
                        background: currentPage === pageNum ? 'var(--m-primary-light)' : 'transparent',
                        color: currentPage === pageNum ? 'var(--m-primary)' : 'var(--m-text-main)',
                        borderColor: currentPage === pageNum ? 'var(--m-primary)' : 'var(--m-border)',
                        fontWeight: 600
                      }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button 
                    className="btn-ghost-sm" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next <Icons.ArrowRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
