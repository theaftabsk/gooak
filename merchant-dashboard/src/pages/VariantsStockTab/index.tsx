import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@oaksol/api-client';

interface VariantsStockTabProps {
  productId: string;
}

const STOCK_TYPES = [
  { value: 'received', label: '📦 Stock Received' },
  { value: 'return', label: '↩️ Customer Return' },
  { value: 'correction', label: '🔧 Correction' },
  { value: 'damaged', label: '💔 Damaged / Lost' },
  { value: 'manual', label: '✏️ Manual Adjust' },
];

function StockPill({ qty, lowAt }: { qty: number; lowAt: number }) {
  if (qty === 0) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.8rem' }}>
      ● Out of Stock
    </span>
  );
  if (qty <= lowAt) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: '0.8rem' }}>
      ⚠ {qty} (Low)
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#15803D', fontWeight: 700, fontSize: '0.8rem' }}>
      ✓ {qty}
    </span>
  );
}

export const VariantsStockTab: React.FC<VariantsStockTabProps> = ({ productId }) => {
  const [variants, setVariants] = useState<any[]>([]);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Variant form
  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addSku, setAddSku] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCompare, setAddCompare] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addStock, setAddStock] = useState('0');
  const [addLowAt, setAddLowAt] = useState('5');
  const [addImage, setAddImage] = useState('');
  const [addActive, setAddActive] = useState(true);
  const [adding, setAdding] = useState(false);

  // Edit Variant
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompare, setEditCompare] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editLowAt, setEditLowAt] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stock Adjustment
  const [adjVariantId, setAdjVariantId] = useState<string | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState('received');
  const [adjNote, setAdjNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vars, logs] = await Promise.all([
        catalogApi.getProductVariants(productId),
        catalogApi.getStockLogs(productId),
      ]);
      setVariants(Array.isArray(vars) ? vars : []);
      setStockLogs(Array.isArray(logs) ? logs : []);
    } catch (e) {
      console.error('Failed to load variants:', e);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddVariant = async () => {
    if (!addPrice) return alert('Price is required');
    setAdding(true);
    try {
      await catalogApi.createVariant(productId, {
        label: addLabel || undefined,
        sku: addSku || undefined,
        price: parseFloat(addPrice),
        compare_price: addCompare ? parseFloat(addCompare) : undefined,
        cost_price: addCost ? parseFloat(addCost) : undefined,
        stock_qty: parseInt(addStock) || 0,
        low_stock_at: parseInt(addLowAt) || 5,
        image_url: addImage || undefined,
        is_active: addActive,
      });
      setAddLabel(''); setAddSku(''); setAddPrice(''); setAddCompare('');
      setAddCost(''); setAddStock('0'); setAddLowAt('5'); setAddImage(''); setAddActive(true);
      setShowAdd(false);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to add variant');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (v: any) => {
    setEditId(v.id);
    setEditLabel(v.label || '');
    setEditPrice(v.price?.toString() || '');
    setEditCompare(v.compare_price?.toString() || '');
    setEditCost(v.cost_price?.toString() || '');
    setEditLowAt(v.low_stock_at?.toString() || '5');
    setEditImage(v.image_url || '');
    setEditActive(v.is_active !== false);
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await catalogApi.updateVariant(editId, {
        label: editLabel || undefined,
        price: parseFloat(editPrice),
        compare_price: editCompare ? parseFloat(editCompare) : undefined,
        cost_price: editCost ? parseFloat(editCost) : undefined,
        low_stock_at: parseInt(editLowAt) || 5,
        image_url: editImage || undefined,
        is_active: editActive,
      });
      setEditId(null);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete variant "${label || 'Unnamed'}"? This cannot be undone.`)) return;
    try {
      await catalogApi.deleteVariant(id);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete variant');
    }
  };

  const handleAdjustStock = async () => {
    if (!adjVariantId || !adjAmount) return;
    const amount = parseInt(adjAmount);
    if (isNaN(amount) || amount === 0) return alert('Enter a non-zero amount');
    setAdjusting(true);
    try {
      await catalogApi.adjustStock(adjVariantId, {
        adjustment: amount,
        type: adjType,
        note: adjNote || undefined,
      });
      setAdjVariantId(null);
      setAdjAmount('');
      setAdjNote('');
      setAdjType('received');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };


  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)' }}>
      Loading variants...
    </div>
  );

  const totalStock = variants.reduce((s, v) => s + (v.stock_qty || 0), 0);
  const outOfStock = variants.filter(v => v.stock_qty === 0).length;
  const lowStock = variants.filter(v => v.stock_qty > 0 && v.stock_qty <= v.low_stock_at).length;

  return (
    <div>
      {/* Summary Cards */}
      {variants.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Variants', value: variants.length, color: '#6366F1', bg: '#EEF2FF' },
            { label: 'Total Stock', value: totalStock, color: '#0EA5E9', bg: '#F0F9FF' },
            { label: 'Low Stock', value: lowStock, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Out of Stock', value: outOfStock, color: '#DC2626', bg: '#FEF2F2' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: '14px 18px', border: `1px solid ${card.color}22` }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: card.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 800, color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Variant Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
          {variants.length === 0 ? 'No variants yet — add your first one' : `${variants.length} Variant${variants.length > 1 ? 's' : ''}`}
        </h3>
        <button
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          onClick={() => { setShowAdd(!showAdd); setEditId(null); setAdjVariantId(null); }}
        >
          {showAdd ? '✕ Cancel' : '+ Add Variant'}
        </button>
      </div>

      {/* Add Variant Form */}
      {showAdd && (
        <div style={{ background: 'var(--m-bg)', border: '1px solid var(--m-primary-light)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 16px', color: 'var(--m-primary)', fontSize: '0.9rem', fontWeight: 700 }}>➕ New Variant</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label>Label <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(e.g. 50ml, Red)</span></label>
              <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="50ml" />
            </div>
            <div className="field-group">
              <label>SKU <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(auto-gen if blank)</span></label>
              <input value={addSku} onChange={e => setAddSku(e.target.value)} placeholder="Leave blank to auto-generate" />
            </div>
            <div className="field-group">
              <label>Price (₹) *</label>
              <input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="299" required />
            </div>
            <div className="field-group">
              <label>Compare Price (₹)</label>
              <input type="number" value={addCompare} onChange={e => setAddCompare(e.target.value)} placeholder="399" />
            </div>
            <div className="field-group">
              <label>Cost Price (₹)</label>
              <input type="number" value={addCost} onChange={e => setAddCost(e.target.value)} placeholder="150" />
            </div>
            <div className="field-group">
              <label>Initial Stock Qty</label>
              <input type="number" min="0" value={addStock} onChange={e => setAddStock(e.target.value)} placeholder="0" />
            </div>
            <div className="field-group">
              <label>Low Stock Alert At</label>
              <input type="number" min="0" value={addLowAt} onChange={e => setAddLowAt(e.target.value)} placeholder="5" />
            </div>
            <div className="field-group">
              <label>Image URL</label>
              <input value={addImage} onChange={e => setAddImage(e.target.value)} placeholder="https://..." />
            </div>
            <div className="field-group" style={{ justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                <input type="checkbox" checked={addActive} onChange={e => setAddActive(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                Active (visible on storefront)
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn-primary" style={{ padding: '9px 22px' }} onClick={handleAddVariant} disabled={adding}>
              {adding ? 'Adding…' : '✓ Add Variant'}
            </button>
            <button className="btn-ghost-sm" onClick={() => setShowAdd(false)} style={{ padding: '9px 16px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Variants Table */}
      {variants.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--m-border)' }}>
          <table className="db-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th>Label / Variant</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Low Alert</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Stock Adjust</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <React.Fragment key={v.id}>
                  <tr style={{ background: editId === v.id ? 'var(--m-primary-light)' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {v.image_url && (
                          <img src={v.image_url} alt={v.label} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--m-border)' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.label || <span style={{ color: 'var(--m-text-muted)', fontStyle: 'italic' }}>No label</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.75rem' }}>{v.sku}</code></td>
                    <td>
                      <div style={{ fontWeight: 700 }}>₹{parseFloat(v.price).toFixed(0)}</div>
                      {v.compare_price && <div style={{ textDecoration: 'line-through', color: 'var(--m-text-muted)', fontSize: '0.75rem' }}>₹{parseFloat(v.compare_price).toFixed(0)}</div>}
                    </td>
                    <td><StockPill qty={v.stock_qty} lowAt={v.low_stock_at} /></td>
                    <td style={{ color: 'var(--m-text-muted)', fontSize: '0.85rem' }}>{v.low_stock_at} units</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        background: v.is_active ? '#F0FDF4' : '#F8FAFC',
                        color: v.is_active ? '#15803D' : '#94A3B8'
                      }}>
                        {v.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => { setAdjVariantId(adjVariantId === v.id ? null : v.id); setEditId(null); setAdjAmount(''); setAdjNote(''); }}
                        style={{ background: adjVariantId === v.id ? '#EEF2FF' : 'var(--m-bg)', border: '1px solid #C7D2FE', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: '#4F46E5' }}
                      >
                        ⚡ Adjust
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setEditId(editId === v.id ? null : v.id); setAdjVariantId(null); startEdit(v); }}
                          style={{ background: editId === v.id ? 'var(--m-primary-light)' : 'var(--m-bg)', border: '1px solid var(--m-border)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-primary)' }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.label)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#DC2626' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Stock Adjust Row */}
                  {adjVariantId === v.id && (
                    <tr>
                      <td colSpan={8} style={{ background: '#F5F3FF', padding: 0 }}>
                        <div style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4F46E5', minWidth: 180 }}>
                            ⚡ Adjusting: <strong>{v.label || v.sku}</strong><br />
                            <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#6B7280' }}>Current stock: {v.stock_qty}</span>
                          </div>
                          <div className="field-group" style={{ minWidth: 120 }}>
                            <label>Amount (use − for removal)</label>
                            <input
                              type="number"
                              value={adjAmount}
                              onChange={e => setAdjAmount(e.target.value)}
                              placeholder="+10 or -5"
                              style={{ border: '2px solid #C7D2FE' }}
                            />
                          </div>
                          <div className="field-group" style={{ minWidth: 170 }}>
                            <label>Reason</label>
                            <select value={adjType} onChange={e => setAdjType(e.target.value)} style={{ border: '2px solid #C7D2FE' }}>
                              {STOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="field-group" style={{ flex: 1, minWidth: 160 }}>
                            <label>Note (optional)</label>
                            <input value={adjNote} onChange={e => setAdjNote(e.target.value)} placeholder="e.g. March restock" style={{ border: '2px solid #C7D2FE' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={handleAdjustStock}
                              disabled={adjusting || !adjAmount}
                              style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              {adjusting ? 'Saving…' : '✓ Apply'}
                            </button>
                            <button onClick={() => setAdjVariantId(null)} style={{ background: 'white', border: '1px solid #C7D2FE', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#6B7280' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Inline Edit Row */}
                  {editId === v.id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--m-primary-light)', padding: 0 }}>
                        <div style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                            <div className="field-group">
                              <label>Label</label>
                              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="50ml" />
                            </div>
                            <div className="field-group">
                              <label>Price (₹)</label>
                              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                            </div>
                            <div className="field-group">
                              <label>Compare Price (₹)</label>
                              <input type="number" value={editCompare} onChange={e => setEditCompare(e.target.value)} placeholder="0" />
                            </div>
                            <div className="field-group">
                              <label>Cost Price (₹)</label>
                              <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} placeholder="0" />
                            </div>
                            <div className="field-group">
                              <label>Low Stock Alert At</label>
                              <input type="number" min="0" value={editLowAt} onChange={e => setEditLowAt(e.target.value)} />
                            </div>
                            <div className="field-group" style={{ gridColumn: 'span 2' }}>
                              <label>Image URL</label>
                              <input value={editImage} onChange={e => setEditImage(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="field-group" style={{ justifyContent: 'flex-end' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                                <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                                Active
                              </label>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={handleSaveEdit} disabled={saving}>
                              {saving ? 'Saving…' : '✓ Save Changes'}
                            </button>
                            <button className="btn-ghost-sm" onClick={() => setEditId(null)} style={{ padding: '8px 14px' }}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !showAdd && (
          <div style={{ textAlign: 'center', padding: '50px 20px', border: '2px dashed var(--m-border)', borderRadius: 14, color: 'var(--m-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📦</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No variants created yet</div>
            <div style={{ fontSize: '0.85rem', marginBottom: 16 }}>Add variants for different sizes, colors, or bundles. Each gets its own stock, price, and SKU.</div>
            <button className="btn-primary" style={{ padding: '9px 20px' }} onClick={() => setShowAdd(true)}>+ Add First Variant</button>
          </div>
        )
      )}

      {/* Stock History Log */}
      {stockLogs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--m-text-main)' }}>
            📋 Recent Stock Movements
          </h4>
          <div style={{ border: '1px solid var(--m-border)', borderRadius: 10, overflow: 'hidden' }}>
            <table className="db-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>After</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.slice(0, 15).map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.82rem' }}>{log.variant?.label || log.variant?.sku || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 6, background: '#F3F4F6', fontWeight: 600, textTransform: 'capitalize' }}>
                        {log.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: log.qty_change > 0 ? '#15803D' : '#DC2626', fontSize: '0.88rem' }}>
                      {log.qty_change > 0 ? `+${log.qty_change}` : log.qty_change}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.qty_after}</td>
                    <td style={{ color: 'var(--m-text-muted)', fontSize: '0.8rem' }}>{log.note || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>
                      {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

