import React, { useState } from 'react';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner, EmptyState, InfoRow } from '../../shared';
import { formatINR } from '../../utils';

interface OrdersPageProps {
  orders: any[];
  loading: boolean;
  onUpdateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  updating: boolean;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Payment Confirmed' },
  { value: 'processing', label: 'Processing / Packing' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'completed', label: 'Order Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders, loading, onUpdateOrderStatus, updating
}) => {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const handleOpenOrder = (o: any) => {
    setSelectedOrder(o);
    setNewStatus(o.status);
    setStatusNote('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    await onUpdateOrderStatus(selectedOrder.id, newStatus, statusNote);
    
    // Refresh selected order reference locally
    const refreshed = orders.find(o => o.id === selectedOrder.id);
    if (refreshed) {
      setSelectedOrder(refreshed);
    } else {
      setSelectedOrder(null);
    }
    setStatusNote('');
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Orders Registry</h2>
          <p className="header-sub">{orders.length} transaction entries found</p>
        </div>
      </header>

      <div className="card">
        <h3 className="card-title">Customer Transactions</h3>
        {loading ? <LoadingSpinner message="Fetching orders..." /> : orders.length === 0 ? (
          <EmptyState message="No orders placed yet. Storefront checkouts will show up here." />
        ) : (
          <div className="db-table-container">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer Info</th>
                  <th>Total Payable</th>
                  <th>Payment / Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
                  const name = o.customer?.name || addr?.name || 'Guest User';
                  const email = o.customer?.email || addr?.email || '';

                  return (
                    <tr key={o.id}>
                      <td><strong>#{o.order_number}</strong></td>
                      <td>
                        <div>
                          <strong>{name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', marginTop: 2 }}>{email}</div>
                        </div>
                      </td>
                      <td>{formatINR(o.total)}</td>
                      <td>
                        <Badge type={
                          o.status === 'confirmed' || o.status === 'completed' ? 'success' :
                          o.status === 'pending' ? 'warn' :
                          o.status === 'cancelled' ? 'danger' : 'info'
                        }>
                          {o.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-ghost-sm" onClick={() => handleOpenOrder(o)}>
                          <Icons.Eye /> View &amp; Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details — #{selectedOrder.order_number}</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}><Icons.X /></button>
            </div>
            
            <div className="modal-body" style={{ gap: 20 }}>
              
              {/* Customer & Address details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--m-text-muted)' }}>Customer Details</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <InfoRow label="Name" value={selectedOrder.customer?.name || 'Guest'} />
                    <InfoRow label="Email" value={selectedOrder.customer?.email || 'N/A'} />
                    <InfoRow label="Phone" value={selectedOrder.customer?.phone || 'N/A'} />
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--m-text-muted)' }}>Shipping Destination</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--m-text-main)', background: 'rgba(15, 23, 42, 0.4)', padding: 12, borderRadius: 8, border: '1px solid var(--m-border)' }}>
                    {typeof selectedOrder.shipping_address === 'string'
                      ? selectedOrder.shipping_address
                      : `${selectedOrder.shipping_address?.address || selectedOrder.shipping_address?.address_line1 || ''}, ${selectedOrder.shipping_address?.city || ''}, ${selectedOrder.shipping_address?.state || ''} ${selectedOrder.shipping_address?.pincode || selectedOrder.shipping_address?.postal_code || ''}`
                    }
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--m-text-muted)' }}>Purchased Items</h4>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, border: '1px solid var(--m-border)', overflow: 'hidden' }}>
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap;
                    return (
                      <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--m-border)' : 'none' }}>
                        <div>
                          <strong>{snap?.name || 'Product Item'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Qty: {item.qty} · Unit Price: {formatINR(item.unit_price)}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>{formatINR(item.line_total)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Update Form */}
              <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 16 }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--m-text-muted)' }}>Workflow Dispatch Status</h4>
                <form onSubmit={handleStatusSubmit} className="form-grid">
                  <div className="form-row">
                    <div className="field-group">
                      <label>Update Status</label>
                      <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="field-group" style={{ flex: 1.5 }}>
                      <label>Status Change Note (Internal)</label>
                      <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="e.g. Handed over to delivery agent..." />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={updating}>
                    {updating ? 'Saving Status…' : 'Update Order Status'}
                  </button>
                </form>
              </div>

              {/* Status Log History */}
              {selectedOrder.status_logs && selectedOrder.status_logs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--m-border)', paddingTop: 16 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 10, color: 'var(--m-text-muted)' }}>Status Change Log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedOrder.status_logs.map((log: any, idx: number) => (
                      <div key={log.id || idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '6px 12px', borderRadius: 4 }}>
                        <div>
                          Status changed to <strong style={{ color: 'var(--m-primary)' }}>{log.to_status.toUpperCase()}</strong>
                          {log.note && <div style={{ color: 'var(--m-text-muted)', marginTop: 2 }}>Note: {log.note}</div>}
                        </div>
                        <div style={{ color: 'var(--m-text-muted)', textAlign: 'right' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setSelectedOrder(null)}>Done, Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

