import React, { useState, useEffect, useCallback } from 'react';
import { merchantApi } from '@/lib/api-client';
import { formatINR } from '@/utils';
import { Icons } from '@/components/ui/Icons';
import { LoadingSpinner, EmptyState } from '@/components/ui/Shared';

export const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'requested' | 'authorized' | 'received' | 'refunded' | 'rejected'>('all');
  const [highValueOnly, setHighValueOnly] = useState(false);

  // Selected return request for Detail Modal
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [refundMethodInput, setRefundMethodInput] = useState<'razorpay' | 'manual' | 'wallet'>('manual');
  const [actioning, setActioning] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchantApi.getReturns();
      setReturns(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load returns list:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = async (id: string) => {
    try {
      setModalLoading(true);
      const detail = await merchantApi.getReturnById(id);
      setSelectedReturn(detail);
      setStaffNoteInput(detail.staff_note || '');
      setRefundAmountInput(detail.refund_amount ? String(detail.refund_amount) : '');
      setRefundMethodInput(detail.refund_method || 'manual');
    } catch (e) {
      alert('Failed to load return details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      setActioning(true);
      const payload: any = {
        status: nextStatus,
        staff_note: staffNoteInput.trim() || undefined
      };

      if (nextStatus === 'refunded') {
        const amt = parseFloat(refundAmountInput);
        if (isNaN(amt) || amt <= 0) {
          alert('Please enter a valid refund amount.');
          setActioning(false);
          return;
        }
        payload.refund_amount = amt;
        payload.refund_method = refundMethodInput;
      }

      await merchantApi.updateReturnStatus(id, payload);
      alert(`Return request is now marked as ${nextStatus.toUpperCase()}`);
      
      // Close modal and refresh lists
      setSelectedReturn(null);
      load();
    } catch (e: any) {
      alert(e.message || 'Failed to update return request');
    } finally {
      setActioning(false);
    }
  };

  // Stats
  const totalCount = returns.length;
  const pendingReview = returns.filter(r => r.status === 'requested').length;
  const awaitingShipment = returns.filter(r => r.status === 'authorized').length;
  const processedRefunds = returns.filter(r => r.status === 'refunded').length;

  // Filtered list
  const filteredReturns = returns.filter(r => {
    // 1. Status Filter
    if (filter !== 'all' && r.status !== filter) return false;

    // 2. High Value filter (> ₹1000)
    const refundVal = r.items.reduce((sum: number, it: any) => sum + (Number(it.price) * it.qty), 0);
    if (highValueOnly && refundVal <= 1000) return false;

    // 3. Search query match
    if (search.trim()) {
      const q = search.toLowerCase();
      const orderNo = r.order?.order_number?.toLowerCase() || '';
      const reason = r.reason.toLowerCase();
      
      const addr = typeof r.order?.shipping_address === 'string' ? JSON.parse(r.order?.shipping_address) : r.order?.shipping_address;
      const custName = (addr?.full_name || addr?.name || 'Guest User').toLowerCase();
      
      return orderNo.includes(q) || reason.includes(q) || custName.includes(q);
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: '0.75rem' }}>🟡 Requested</span>;
      case 'authorized':
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.75rem' }}>🔵 Authorized</span>;
      case 'received':
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#FAF5FF', color: '#7C3AED', fontWeight: 700, fontSize: '0.75rem' }}>🟣 Received</span>;
      case 'refunded':
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: '0.75rem' }}>🟢 Refunded</span>;
      case 'rejected':
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem' }}>🔴 Rejected</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: 12, background: '#F3F4F6', color: '#4B5563', fontWeight: 700, fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 'calc(100vh - 64px)', background: '#FAF9F6' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--m-text-dark)', margin: 0 }}>Returns Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)', margin: '4px 0 0 0' }}>Track customer return requests, approve shipments, and process refunds.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Returns</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{totalCount}</span>
        </div>
        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>{pendingReview}</span>
        </div>
        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Shipment</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB' }}>{awaitingShipment}</span>
        </div>
        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Refunded / Closed</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A' }}>{processedRefunds}</span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div style={{ background: '#FFF', padding: '16px 20px', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { value: 'all', label: 'All Returns' },
            { value: 'requested', label: 'Requested' },
            { value: 'authorized', label: 'Authorized' },
            { value: 'received', label: 'Received' },
            { value: 'refunded', label: 'Refunded' },
            { value: 'rejected', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value as any); setCurrentPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
                border: filter === tab.value ? 'none' : '1px solid #D1D5DB',
                background: filter === tab.value ? 'var(--m-primary)' : '#FFF',
                color: filter === tab.value ? '#FFF' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search by order number, customer, reason..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={highValueOnly}
              onChange={e => { setHighValueOnly(e.target.checked); setCurrentPage(1); }}
              style={{ accentColor: 'var(--m-primary)', width: 16, height: 16 }}
            />
            High Value Returns (&gt; ₹1,000)
          </label>
        </div>
      </div>

      {/* Main Returns Table */}
      {loading ? (
        <div style={{ background: '#FFF', padding: 60, borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : filteredReturns.length === 0 ? (
        <EmptyState 
          title="No return requests found" 
          description="Customer return submissions or platform overrides will be visible here." 
        />
      ) : (
        <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Return Ref</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Order No</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Return Reason</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Requested Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', textAlign: 'right' }}>Total Value</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReturns.map(r => {
                  const addr = typeof r.order?.shipping_address === 'string' ? JSON.parse(r.order?.shipping_address) : r.order?.shipping_address;
                  const name = addr?.full_name || addr?.name || 'Guest User';
                  
                  const totalVal = r.items.reduce((sum: number, it: any) => sum + (Number(it.price) * it.qty), 0);

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                        <span onClick={() => loadDetail(r.id)} style={{ fontWeight: 700, color: 'var(--m-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                          RET-{r.id.substring(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600 }}>#{r.order?.order_number}</td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{addr?.email || ''}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#374151' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>
                          {r.reason.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#6B7280' }}>
                        {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#111827', textAlign: 'right' }}>
                        {formatINR(totalVal)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {r.status === 'requested' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'authorized')}
                                style={{ padding: '6px 12px', border: 'none', background: '#3B82F6', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(r.id, 'rejected')}
                                style={{ padding: '6px 12px', border: 'none', background: '#EF4444', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {r.status === 'authorized' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'received')}
                              style={{ padding: '6px 12px', border: 'none', background: '#8B5CF6', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                            >
                              Mark Received
                            </button>
                          )}
                          {r.status === 'received' && (
                            <button
                              onClick={() => loadDetail(r.id)}
                              style={{ padding: '6px 12px', border: 'none', background: '#10B981', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                            >
                              Process Refund
                            </button>
                          )}
                          <button
                            onClick={() => loadDetail(r.id)}
                            style={{ padding: '6px 12px', border: '1px solid #D1D5DB', background: '#FFF', color: '#374151', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredReturns.length} entries)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px', border: '1px solid #D1D5DB', background: '#FFF', borderRadius: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  <Icons.ArrowLeft />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px', border: '1px solid #D1D5DB', background: '#FFF', borderRadius: 6, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  <Icons.ArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details/Actions Drawer Modal */}
      {selectedReturn && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 580, height: '100%', background: '#FFF', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                    Return Request Details
                  </h3>
                  {getStatusBadge(selectedReturn.status)}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: 4, display: 'block' }}>
                  ID: RET-{selectedReturn.id.toUpperCase()} • Order: #{selectedReturn.order?.order_number}
                </span>
              </div>
              <button 
                onClick={() => setSelectedReturn(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 6, color: '#6B7280', display: 'flex' }}
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            {modalLoading ? (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <LoadingSpinner />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Customer Details */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer Details
                  </h4>
                  {(() => {
                    const addr = typeof selectedReturn.order?.shipping_address === 'string' ? JSON.parse(selectedReturn.order?.shipping_address) : selectedReturn.order?.shipping_address;
                    return (
                      <div style={{ padding: 14, borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827' }}>{addr?.full_name || addr?.name || 'Guest User'}</span>
                        <span style={{ fontSize: '0.82rem', color: '#4B5563' }}>Email: {addr?.email || 'N/A'}</span>
                        <span style={{ fontSize: '0.82rem', color: '#4B5563' }}>Phone: {addr?.phone || 'N/A'}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Reason & Notes */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Return Description
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'block' }}>Reason:</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>
                        {selectedReturn.reason.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {selectedReturn.customer_note && (
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'block' }}>Customer Note:</span>
                        <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '4px 0 0 0', padding: 10, borderRadius: 6, background: '#FFFBEB', border: '1px solid #FEF3C7', lineHeight: 1.4 }}>
                          "{selectedReturn.customer_note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Items (Partial Returns Support) */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Returning Items
                  </h4>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                    {selectedReturn.items.map((item: any, idx: number) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx < selectedReturn.items.length - 1 ? '1px solid #E5E7EB' : 'none', background: '#FFF' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                            {item.variant?.label || 'Default Variant'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                            SKU: {item.variant?.sku || 'N/A'} • {formatINR(item.price)} each
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                            Qty: {item.qty}
                          </span>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--m-primary)', marginTop: 2 }}>
                            {formatINR(Number(item.price) * item.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '12px 16px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4B5563' }}>Total Return Value:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                        {formatINR(selectedReturn.items.reduce((sum: number, it: any) => sum + (Number(it.price) * it.qty), 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logs / Audit Timeline */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Audit Timeline
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 8, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 2, background: '#E5E7EB' }} />
                    {selectedReturn.logs?.map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: log.status === 'refunded' ? '#16A34A' : log.status === 'rejected' ? '#DC2626' : '#3B82F6', border: '3px solid #FFF', marginTop: 4, boxShadow: '0 0 0 1px #E5E7EB' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>
                              Status: {log.status}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'block', marginTop: 2 }}>
                            By: {log.changed_by || 'system'}
                          </span>
                          {log.note && (
                            <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                              Note: {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund & Process Form (if not closed) */}
                {selectedReturn.status !== 'refunded' && selectedReturn.status !== 'rejected' && (
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Update Return Request
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563' }}>Staff Note</label>
                      <textarea
                        rows={2}
                        placeholder="Add internal resolution comments..."
                        value={staffNoteInput}
                        onChange={e => setStaffNoteInput(e.target.value)}
                        style={{ padding: 10, borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                      />
                    </div>

                    {selectedReturn.status === 'received' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563' }}>Refund Method</label>
                          <select
                            value={refundMethodInput}
                            onChange={e => setRefundMethodInput(e.target.value as any)}
                            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.85rem', background: '#FFF' }}
                          >
                            <option value="manual">Manual Refund (Cash/UPI)</option>
                            <option value="razorpay">Razorpay Gateway</option>
                            <option value="wallet">Customer Wallet</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563' }}>Refund Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="Enter amount to refund"
                            value={refundAmountInput}
                            onChange={e => setRefundAmountInput(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      {selectedReturn.status === 'requested' && (
                        <>
                          <button
                            disabled={actioning}
                            onClick={() => handleUpdateStatus(selectedReturn.id, 'authorized')}
                            style={{ flex: 1, padding: '10px 16px', border: 'none', background: '#3B82F6', color: '#FFF', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            {actioning ? 'Processing...' : 'Approve Request'}
                          </button>
                          <button
                            disabled={actioning}
                            onClick={() => handleUpdateStatus(selectedReturn.id, 'rejected')}
                            style={{ flex: 1, padding: '10px 16px', border: 'none', background: '#EF4444', color: '#FFF', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            {actioning ? 'Processing...' : 'Reject Request'}
                          </button>
                        </>
                      )}
                      {selectedReturn.status === 'authorized' && (
                        <button
                          disabled={actioning}
                          onClick={() => handleUpdateStatus(selectedReturn.id, 'received')}
                          style={{ flex: 1, padding: '10px 16px', border: 'none', background: '#8B5CF6', color: '#FFF', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          {actioning ? 'Processing...' : 'Confirm Items Received'}
                        </button>
                      )}
                      {selectedReturn.status === 'received' && (
                        <button
                          disabled={actioning}
                          onClick={() => handleUpdateStatus(selectedReturn.id, 'refunded')}
                          style={{ flex: 1, padding: '10px 16px', border: 'none', background: '#10B981', color: '#FFF', fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          {actioning ? 'Processing...' : 'Complete & Process Refund'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
