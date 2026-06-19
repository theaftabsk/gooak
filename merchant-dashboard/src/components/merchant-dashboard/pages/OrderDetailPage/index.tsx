import React, { useState, useEffect } from 'react';
import { catalogApi } from '@oaksol/api-client';
import { Icons } from '../../icons';
import { Badge, LoadingSpinner, InfoRow } from '../../shared';
import { formatINR } from '../../utils';

interface OrderDetailPageProps {
  orderId: string;
  orders: any[];
  onUpdateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  updating: boolean;
  onBack: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Payment Confirmed' },
  { value: 'processing', label: 'Processing / Packing' },
  { value: 'shipped', label: 'Shipped / Dispatched' },
  { value: 'completed', label: 'Order Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId, orders, onUpdateOrderStatus, updating, onBack
}) => {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // Fetch fresh orders lists or fetch specific order from API if available
      // For now, let's load from the props list, but also fetch from API if we want the freshest data
      const found = orders.find(o => o.id === orderId);
      if (found) {
        setOrder(found);
        setNewStatus(found.status);
      } else {
        // Fallback: fetch orders list to find it
        const allOrders = await catalogApi.getOrders();
        const f = allOrders?.find((o: any) => o.id === orderId);
        if (f) {
          setOrder(f);
          setNewStatus(f.status);
        }
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId, orders]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newStatus) return;

    await onUpdateOrderStatus(order.id, newStatus, statusNote);
    setStatusNote('');
    
    // Reload local order data
    const allOrders = await catalogApi.getOrders();
    const refreshed = allOrders?.find((o: any) => o.id === order.id);
    if (refreshed) {
      setOrder(refreshed);
      setNewStatus(refreshed.status);
    }
  };

  const handlePrintInvoice = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Pop-up blocker is enabled. Please allow popups to print invoices.');
      return;
    }

    const itemsHtml = order.items.map((item: any) => {
      const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">
            <div style="font-weight: 600; color: #1E293B;">${snap?.name || 'Product Item'}</div>
            ${snap?.label ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">Variant: ${snap.label}</div>` : ''}
            ${snap?.sku ? `<div style="font-size: 11px; color: #64748B;">SKU: ${snap.sku}</div>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #334155;">${item.qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #334155;">₹${parseFloat(item.unit_price).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 600; color: #0F172A;">₹${parseFloat(item.line_total).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
    const name = order.customer?.name || addr?.full_name || addr?.name || 'Guest User';
    const email = order.customer?.email || addr?.email || 'N/A';
    const phone = order.customer?.phone || addr?.phone || 'N/A';
    
    const formattedAddress = typeof order.shipping_address === 'string'
      ? order.shipping_address
      : `${addr?.address_line1 || ''}, ${addr?.city || ''}, ${addr?.state || ''} - ${addr?.postal_code || ''}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - #${order.order_number}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1E293B;
            margin: 40px;
            line-height: 1.6;
            background-color: #FFFFFF;
          }
          .invoice-card {
            max-width: 800px;
            margin: 0 auto;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 24px;
            margin-bottom: 30px;
          }
          .brand-logo {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0F172A;
            margin: 0;
            text-transform: uppercase;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: 800;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 5px 0;
            text-align: right;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .details-box h3 {
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748B;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 6px;
            margin: 0 0 12px 0;
          }
          .details-box p {
            margin: 0 0 6px 0;
            font-size: 14px;
            color: #334155;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #F8FAFC;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #E2E8F0;
          }
          .totals-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          .totals-table {
            width: 320px;
            margin-bottom: 0;
          }
          .totals-table td {
            padding: 8px 12px;
            font-size: 14px;
            color: #475569;
          }
          .totals-table tr.grand-total td {
            font-size: 18px;
            font-weight: 800;
            color: #0F172A;
            border-top: 2.5px solid #0F172A;
            padding-top: 12px;
          }
          .invoice-footer {
            margin-top: 80px;
            border-top: 1px solid #E2E8F0;
            padding-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #94A3B8;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="invoice-header">
            <div>
              <div class="brand-logo">Oak-Commerce</div>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #64748B;">Order Reference: <strong>#${order.order_number}</strong></p>
            </div>
            <div>
              <h1 class="invoice-title">Invoice</h1>
              <p style="margin: 0; font-size: 14px; color: #334155; text-align: right;">Date: <strong>${new Date(order.created_at).toLocaleDateString()}</strong></p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748B; text-align: right;">Status: <span style="font-weight: bold; color: #059669;">${order.status.toUpperCase()}</span></p>
            </div>
          </div>

          <div class="details-grid">
            <div class="details-box">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
            </div>
            <div class="details-box">
              <h3>Shipping Destination</h3>
              <p style="white-space: pre-line; line-height: 1.5;">${formattedAddress}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Unit Price</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-wrap">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${parseFloat(order.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping Fee:</td>
                <td style="text-align: right;">₹${parseFloat(order.shipping_amount).toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td>Total Payable:</td>
                <td style="text-align: right;">₹${parseFloat(order.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="invoice-footer">
            <p>Thank you for buying from Oak-Commerce storefront!</p>
            <p>This is a computer generated invoice and does not require a physical signature.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving transactions and logs..." />;
  }

  if (!order) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3>Order not found</h3>
        <p>The order reference ID does not exist or has been deleted.</p>
        <button className="btn-ghost-sm" onClick={onBack}>Go Back to Registry</button>
      </div>
    );
  }

  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
  const customerName = order.customer?.name || addr?.full_name || addr?.name || 'Guest User';
  const customerEmail = order.customer?.email || addr?.email || 'N/A';
  const customerPhone = order.customer?.phone || addr?.phone || 'N/A';

  return (
    <>
      <header className="page-header" style={{ marginBottom: 25 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button className="btn-ghost-sm" onClick={onBack} style={{ padding: '8px 12px' }}>
            <Icons.ArrowLeft /> Back
          </button>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              Order #{order.order_number}
              <Badge type={
                order.status === 'confirmed' || order.status === 'completed' ? 'success' :
                order.status === 'pending' ? 'warn' :
                order.status === 'cancelled' ? 'danger' : 'info'
              }>
                {order.status.toUpperCase()}
              </Badge>
            </h2>
            <p className="header-sub">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        <button className="btn-primary" onClick={handlePrintInvoice} style={{ padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icons.Check /> Print Invoice PDF
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 25, alignItems: 'start' }}>
        
        {/* Left Column: Purchased Items & Status workflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
          
          {/* Purchased Items List */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 15 }}>Purchased Items</h3>
            <div className="db-table-container" style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 8, border: '1px solid var(--m-border)', overflow: 'hidden' }}>
              <table className="db-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => {
                    const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap;
                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <div>
                            <strong>{snap?.name || 'Product Item'}</strong>
                            {snap?.label && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', marginTop: 2 }}>
                                Variant: {snap.label}
                              </div>
                            )}
                            {snap?.sku && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--m-text-muted)', marginTop: 1 }}>
                                SKU: <code>{snap.sku}</code>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(item.line_total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotals info */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--m-text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span style={{ color: 'var(--m-text-main)' }}>{formatINR(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping Cost:</span>
                  <span style={{ color: 'var(--m-text-main)' }}>{formatINR(order.shipping_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: 'var(--m-primary)', borderTop: '1px solid var(--m-border)', paddingTop: 10, marginTop: 5 }}>
                  <span>Total Payable:</span>
                  <span>{formatINR(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Update Order Status Form */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 15 }}>Update Order Status</h3>
            <form onSubmit={handleStatusSubmit} className="form-grid">
              <div className="form-row">
                <div className="field-group">
                  <label>Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="field-group" style={{ flex: 1.5 }}>
                  <label>Update Note (Internal log description)</label>
                  <input
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="e.g. Package dispatched via Bluedart courier..."
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={updating}>
                {updating ? 'Saving Status…' : 'Update Dispatch Status'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Customer Details, Address, Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
          
          {/* Customer Info Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 15 }}>Customer Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Name" value={customerName} />
              <InfoRow label="Email" value={customerEmail} />
              <InfoRow label="Phone" value={customerPhone} />
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 15 }}>Shipping Destination</h3>
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--m-text-main)',
              lineHeight: 1.5,
              background: 'rgba(15, 23, 42, 0.4)',
              padding: 15,
              borderRadius: 8,
              border: '1px solid var(--m-border)'
            }}>
              {typeof order.shipping_address === 'string'
                ? order.shipping_address
                : `${addr?.address_line1 || ''}, ${addr?.city || ''}, ${addr?.state || ''} - ${addr?.postal_code || ''}`
              }
            </div>
          </div>

          {/* Status Change Log Timeline */}
          {order.status_logs && order.status_logs.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 15 }}>Status Change Logs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {order.status_logs.map((log: any, idx: number) => (
                  <div key={log.id || idx} style={{
                    fontSize: '0.8rem',
                    background: 'rgba(255,255,255,0.01)',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--m-border)'
                  }}>
                    <div>
                      Status changed to <strong style={{ color: 'var(--m-primary)' }}>{log.to_status.toUpperCase()}</strong>
                      {log.note && <div style={{ color: 'var(--m-text-muted)', marginTop: 4 }}>Note: {log.note}</div>}
                    </div>
                    <div style={{ color: 'var(--m-text-muted)', fontSize: '0.7rem', marginTop: 5, textAlign: 'right' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  );
};
