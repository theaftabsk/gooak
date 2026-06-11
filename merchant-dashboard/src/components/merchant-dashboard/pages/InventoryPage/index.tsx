import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@oaksol/api-client';

const STOCK_TYPES = [
  { value: 'received', label: '📦 Received' },
  { value: 'return', label: '↩️ Return' },
  { value: 'correction', label: '🔧 Correction' },
  { value: 'damaged', label: '💔 Damaged' },
  { value: 'manual', label: '✏️ Manual' },
];

function StockBar({ qty, lowAt }: { qty: number; lowAt: number }) {
  const max = Math.max(qty, lowAt * 4, 20);
  const pct = Math.min(100, (qty / max) * 100);
  const color = qty === 0 ? '#DC2626' : qty <= lowAt ? '#D97706' : '#16A34A';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', minWidth: 80 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: '0.82rem', color, minWidth: 30, textAlign: 'right' }}>{qty}</span>
    </div>
  );
}

function StockStatusBadge({ qty, lowAt }: { qty: number; lowAt: number }) {
  if (qty === 0) return <span style={{ padding: '2px 8px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.72rem' }}>Out of Stock</span>;
  if (qty <= lowAt) return <span style={{ padding: '2px 8px', borderRadius: 12, background: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: '0.72rem' }}>Low Stock</span>;
  return <span style={{ padding: '2px 8px', borderRadius: 12, background: '#F0FDF4', color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }}>In Stock</span>;
}

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Stock adjustment
  const [adjVariantId, setAdjVariantId] = useState<string | null>(null);
  const [adjProductId, setAdjProductId] = useState<string | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState('received');
  const [adjNote, setAdjNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await catalogApi.getInventoryOverview();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load inventory:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Global summary stats
  const totalSkus = products.reduce((s, p) => s + p.variants.length, 0);
  const totalOutOfStock = products.reduce((s, p) => s + p.outOfStock, 0);
  const totalLowStock = products.reduce((s, p) => s + p.lowStock, 0);
  const totalStock = products.reduce((s, p) => s + p.totalStock, 0);

  // Filter + search
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'low' ? p.lowStock > 0 :
      filter === 'out' ? p.outOfStock > 0 : true;
    return matchSearch && matchFilter;
  });

  const handleAdjust = async () => {
    if (!adjVariantId || !adjAmount) return;
    const amount = parseInt(adjAmount);
    if (isNaN(amount) || amount === 0) return alert('Enter a non-zero value');
    setAdjusting(true);
    try {
      await catalogApi.adjustStock(adjVariantId, {
        adjustment: amount,
        type: adjType,
        note: adjNote || undefined,
      });
      setAdjVariantId(null);
      setAdjProductId(null);
      setAdjAmount('');
      setAdjNote('');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Inventory Management</h2>
          <p className="header-sub">Track and adjust stock across all product variants</p>
        </div>
        <button className="btn-ghost-sm" onClick={load} style={{ padding: '9px 16px' }}>
          ↻ Refresh
        </button>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total SKUs', value: totalSkus, icon: '🏷️', color: '#4F46E5', bg: '#EEF2FF' },
          { label: 'Total Stock', value: totalStock, icon: '📦', color: '#0EA5E9', bg: '#F0F9FF' },
          { label: 'Low Stock', value: totalLowStock, icon: '⚠️', color: '#D97706', bg: '#FFFBEB' },
          { label: 'Out of Stock', value: totalOutOfStock, icon: '🚨', color: '#DC2626', bg: '#FEF2F2' },
        ].map(card => (
          <div key={card.label} className="card" style={{ background: card.bg, border: `1px solid ${card.color}28`, padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: card.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
                <p style={{ margin: '6px 0 0', fontSize: '2.2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{loading ? '—' : card.value}</p>
              </div>
              <span style={{ fontSize: '1.8rem' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search products..."
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--m-border)', fontSize: '0.9rem' }}
          />
          {(['all', 'low', 'out'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1.5px solid',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: filter === f ? 'var(--m-primary)' : 'var(--m-border)',
                background: filter === f ? 'var(--m-primary-light)' : 'transparent',
                color: filter === f ? 'var(--m-primary)' : 'var(--m-text-muted)',
              }}
            >
              {f === 'all' ? 'All Products' : f === 'low' ? '⚠️ Low Stock' : '🚨 Out of Stock'}
            </button>
          ))}
          <span style={{ fontSize: '0.82rem', color: 'var(--m-text-muted)', marginLeft: 'auto' }}>
            {filtered.length} products
          </span>
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--m-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
          Loading inventory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--m-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📦</div>
          <div style={{ fontWeight: 600 }}>No products found</div>
          <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Try changing your filters or create products first</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(product => {
            const coverImg = product.gallery?.[0]?.url;
            const isExpanded = expanded.has(product.id);

            return (
              <div key={product.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Product Row Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => toggleExpand(product.id)}
                >
                  {coverImg ? (
                    <img src={coverImg} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--m-border)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📦</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--m-text-main)', marginBottom: 2 }}>{product.name}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>Total: <strong>{product.totalStock}</strong> units</span>
                      {product.outOfStock > 0 && (
                        <span style={{ padding: '1px 7px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700 }}>
                          {product.outOfStock} Out of Stock
                        </span>
                      )}
                      {product.lowStock > 0 && (
                        <span style={{ padding: '1px 7px', borderRadius: 10, background: '#FFFBEB', color: '#D97706', fontSize: '0.72rem', fontWeight: 700 }}>
                          {product.lowStock} Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                      background: product.status === 'active' ? '#F0FDF4' : '#F8FAFC',
                      color: product.status === 'active' ? '#15803D' : '#94A3B8',
                    }}>{product.status}</span>
                    <span style={{ color: 'var(--m-text-muted)', fontSize: '1rem', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>›</span>
                  </div>
                </div>

                {/* Expanded Variant Rows */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--m-border)' }}>
                    {product.variants.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--m-text-muted)', fontSize: '0.85rem' }}>
                        No variants. Go to the product editor → Variants &amp; Stock tab to add variants.
                      </div>
                    ) : (
                      product.variants.map((v: any, i: number) => (
                        <div key={v.id}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '180px 120px 1fr 100px 140px',
                            gap: 12,
                            padding: '12px 20px 12px 78px',
                            alignItems: 'center',
                            background: i % 2 === 0 ? '#FAFBFC' : 'white',
                            borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.label || <span style={{ color: 'var(--m-text-muted)', fontStyle: 'italic' }}>Unnamed</span>}</div>
                              <code style={{ fontSize: '0.72rem', color: 'var(--m-text-muted)' }}>{v.sku}</code>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>₹{parseFloat(v.price).toFixed(0)}</div>
                            <StockBar qty={v.stock_qty} lowAt={v.low_stock_at} />
                            <StockStatusBadge qty={v.stock_qty} lowAt={v.low_stock_at} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdjVariantId(adjVariantId === v.id ? null : v.id);
                                setAdjProductId(product.id);
                                setAdjAmount('');
                                setAdjNote('');
                                setAdjType('received');
                              }}
                              style={{
                                padding: '6px 14px', borderRadius: 8, border: '1.5px solid',
                                borderColor: adjVariantId === v.id ? '#4F46E5' : '#C7D2FE',
                                background: adjVariantId === v.id ? '#EEF2FF' : 'white',
                                color: '#4F46E5', fontWeight: 700, fontSize: '0.8rem',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              ⚡ Adjust Stock
                            </button>
                          </div>

                          {/* Inline Adjustment Form */}
                          {adjVariantId === v.id && adjProductId === product.id && (
                            <div style={{ padding: '14px 20px 14px 78px', background: '#F5F3FF', borderTop: '1px solid #DDD6FE', display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: '#4F46E5', minWidth: 160 }}>
                                Adjusting: <strong>{v.label || v.sku}</strong>
                                <div style={{ fontWeight: 400, color: '#6B7280', marginTop: 2 }}>Current: {v.stock_qty}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Amount (+/-)</label>
                                <input
                                  type="number"
                                  value={adjAmount}
                                  onChange={e => setAdjAmount(e.target.value)}
                                  placeholder="+10 or -5"
                                  style={{ padding: '7px 10px', border: '2px solid #C7D2FE', borderRadius: 7, width: 110, fontSize: '0.85rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Reason</label>
                                <select value={adjType} onChange={e => setAdjType(e.target.value)} style={{ padding: '7px 10px', border: '2px solid #C7D2FE', borderRadius: 7, fontSize: '0.85rem' }}>
                                  {STOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Note (optional)</label>
                                <input
                                  value={adjNote}
                                  onChange={e => setAdjNote(e.target.value)}
                                  placeholder="e.g. Monthly restock"
                                  style={{ padding: '7px 10px', border: '2px solid #C7D2FE', borderRadius: 7, fontSize: '0.85rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={handleAdjust}
                                  disabled={adjusting || !adjAmount}
                                  style={{ padding: '8px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', opacity: adjusting ? 0.7 : 1 }}
                                >
                                  {adjusting ? 'Saving…' : '✓ Apply'}
                                </button>
                                <button onClick={() => { setAdjVariantId(null); setAdjProductId(null); }} style={{ padding: '8px 12px', background: 'white', border: '1px solid #C7D2FE', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#6B7280' }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Low Stock Alert Panel */}
      {totalLowStock > 0 || totalOutOfStock > 0 ? (
        <div className="card" style={{ marginTop: 24, borderLeft: '4px solid #D97706', background: '#FFFBEB' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#92400E' }}>
            ⚠️ Attention Required — {totalOutOfStock + totalLowStock} variants need restocking
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.flatMap(p =>
              p.variants
                .filter((v: any) => v.stock_qty === 0 || v.stock_qty <= v.low_stock_at)
                .map((v: any) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid #FDE68A' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong>{p.name}</strong>
                      {v.label ? <span style={{ color: 'var(--m-text-muted)' }}> — {v.label}</span> : null}
                      <code style={{ marginLeft: 8, fontSize: '0.72rem', color: '#9CA3AF' }}>{v.sku}</code>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <StockStatusBadge qty={v.stock_qty} lowAt={v.low_stock_at} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.stock_qty} left</span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

