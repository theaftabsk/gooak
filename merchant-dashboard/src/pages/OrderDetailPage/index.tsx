import React, { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@oaksol/api-client';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner } from '@/components/ui/Shared';
import { formatINR } from '@/utils';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface OrderDetailPageProps {
  orderId: string;
  orders: any[];
  onUpdateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  updating: boolean;
  onBack: () => void;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pending Payment',       color: '#F59E0B' },
  { value: 'confirmed',  label: 'Payment Confirmed',     color: '#10B981' },
  { value: 'processing', label: 'Processing / Packing',  color: '#6366F1' },
  { value: 'shipped',    label: 'Shipped / Dispatched',  color: '#3B82F6' },
  { value: 'completed',  label: 'Order Completed',       color: '#059669' },
  { value: 'cancelled',  label: 'Cancelled',             color: '#EF4444' },
];

const FULFILLMENT_STEPS = [
  { value: 'unfulfilled', label: 'Unfulfilled',    color: '#9CA3AF', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
  { value: 'partial',     label: 'Partial',         color: '#F59E0B', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg> },
  { value: 'fulfilled',   label: 'Fulfilled',       color: '#10B981', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> },
  { value: 'returned',    label: 'Returned',        color: '#EF4444', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 12H8m4-4-4 4 4 4"/></svg> },
];

const RETURN_OPTIONS = [
  { value: '',               label: '— None —' },
  { value: 'requested',      label: 'Return Requested' },
  { value: 'approved',       label: 'Return Approved' },
  { value: 'picked',         label: 'Item Picked Up' },
  { value: 'refund_pending', label: 'Refund Pending' },
  { value: 'refunded',       label: 'Refunded' },
  { value: 'rejected',       label: 'Return Rejected' },
];

const COURIER_LIST = [
  'Delhivery', 'BlueDart', 'Ekart', 'DTDC', 'Xpressbees',
  'Shadowfax', 'Ecom Express', 'India Post', 'FedEx', 'DHL', 'Shiprocket',
];

const PAYMENT_METHODS = [
  { value: 'cod',     label: 'Cash on Delivery (COD)' },
  { value: 'upi',     label: 'UPI / QR Code' },
  { value: 'card',    label: 'Debit / Credit Card' },
  { value: 'netbank', label: 'Net Banking' },
  { value: 'wallet',  label: 'Wallet (Paytm/Phonepe)' },
  { value: 'emi',     label: 'EMI' },
  { value: 'bnpl',    label: 'Buy Now Pay Later' },
];

const SVG_ICONS = {
  Package: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Truck: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  CreditCard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  FileText: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Clock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  MessageSquare: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Info: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Status: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Dot: () => <svg width="8" height="8" viewBox="0 0 8 8" style={{ marginRight: 6 }}><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>,
  Printer: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Spinner: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1.5s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" fill="none"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeLinecap="round" fill="none"/></svg>,
  Lock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Alert: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  WhatsApp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  Call: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mail: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  File: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const statusBadgeType = (s: string): 'success' | 'warn' | 'danger' | 'info' => {
  if (s === 'confirmed' || s === 'completed') return 'success';
  if (s === 'pending') return 'warn';
  if (s === 'cancelled') return 'danger';
  return 'info';
};

const toDateInput = (iso?: string | null) => {
  if (!iso) return '';
  return new Date(iso).toISOString().split('T')[0];
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }> = ({
  title, icon, children, style = {}
}) => (
  <div style={{
    background: 'var(--m-surface)',
    border: '1px solid var(--m-border)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    ...style,
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '16px 20px',
      borderBottom: '1px solid var(--m-border)',
      background: 'linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.00))',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--m-primary)', width: 22, height: 22 }}>
        {icon}
      </span>
      <span style={{ fontWeight: 750, fontSize: '0.88rem', letterSpacing: '0.02em', color: 'var(--m-text-main)', textTransform: 'uppercase' }}>
        {title}
      </span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const FieldRow: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--m-text-muted)', minWidth: 130 }}>{label}</span>
    <span style={{ fontSize: '0.85rem', color: 'var(--m-text-main)', fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'monospace' : undefined }}>
      {value || '—'}
    </span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId, orders, updating, onBack,
}) => {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Editable field state */
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchedAt, setDispatchedAt] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('unfulfilled');
  const [staffNotes, setStaffNotes] = useState('');
  const [returnStatus, setReturnStatus] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [activeTab, setActiveTab] = useState<'fulfillment' | 'status' | 'notes'>('fulfillment');

  /* ── Load ── */
  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      let found = orders.find(o => o.id === orderId);
      if (!found) {
        const all = await catalogApi.getOrders();
        found = all?.find((o: any) => o.id === orderId);
      }
      if (found) {
        setOrder(found);
        setNewStatus(found.status || 'pending');
        setCourierName(found.courier_name || '');
        setTrackingNumber(found.tracking_number || '');
        setTrackingUrl(found.tracking_url || '');
        setDispatchedAt(toDateInput(found.dispatched_at));
        setExpectedDelivery(toDateInput(found.expected_delivery_at));
        setFulfillmentStatus(found.fulfillment_status || 'unfulfilled');
        setStaffNotes(found.staff_notes || '');
        setReturnStatus(found.return_status || '');
        setPaidAmount(found.paid_amount != null ? String(found.paid_amount) : '');
        setPaymentMethod(found.payment_method || '');
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId, orders]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  /* ── Save all changes ── */
  const handleSaveAll = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await catalogApi.updateOrderStatus(order.id, newStatus, statusNote || undefined, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        dispatched_at: dispatchedAt || undefined,
        expected_delivery_at: expectedDelivery || undefined,
        fulfillment_status: fulfillmentStatus,
        staff_notes: staffNotes,
        return_status: returnStatus,
        paid_amount: paidAmount ? parseFloat(paidAmount) : undefined,
        payment_method: paymentMethod,
      });
      setStatusNote('');
      // Reload fresh data
      const all = await catalogApi.getOrders();
      const refreshed = all?.find((o: any) => o.id === order.id);
      if (refreshed) {
        setOrder(refreshed);
        setNewStatus(refreshed.status || 'pending');
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Add staff note ── */
  const handleAddNote = async () => {
    if (!noteInput.trim() || !order) return;
    const combined = staffNotes ? `${staffNotes}\n[${new Date().toLocaleString('en-IN')}] ${noteInput.trim()}` : `[${new Date().toLocaleString('en-IN')}] ${noteInput.trim()}`;
    setStaffNotes(combined);
    setNoteInput('');
  };

  /* ── Print invoice ── */
  const handlePrintInvoice = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) { alert('Pop-up blocker is enabled. Please allow popups to print invoices.'); return; }
    const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
    const customerName = order.customer?.name || addr?.full_name || addr?.name || 'Guest';
    const itemsHtml = (order.items || []).map((item: any) => {
      const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap;
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #E2E8F0"><strong>${snap?.name || 'Product'}</strong>${snap?.label ? `<br><small>Variant: ${snap.label}</small>` : ''}${snap?.sku ? `<br><small>SKU: ${snap.sku}</small>` : ''}</td>
        <td style="padding:12px;text-align:center">${item.qty}</td>
        <td style="padding:12px;text-align:right">₹${parseFloat(item.unit_price).toFixed(2)}</td>
        <td style="padding:12px;text-align:right;font-weight:700">₹${parseFloat(item.line_total).toFixed(2)}</td>
      </tr>`;
    }).join('');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice #${order.order_number}</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#1E293B}table{width:100%;border-collapse:collapse}th{background:#F8FAFC;padding:12px;text-align:left;border-bottom:2px solid #E2E8F0;font-size:12px;text-transform:uppercase}.grand{font-size:18px;font-weight:800;border-top:2px solid #0F172A}</style>
    </head><body>
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #E2E8F0;padding-bottom:24px;margin-bottom:30px">
      <div><h2 style="margin:0">Oak-Commerce</h2><p>Order: <strong>#${order.order_number}</strong></p></div>
      <div style="text-align:right"><h1 style="margin:0;color:#94A3B8;font-size:28px">INVOICE</h1><p>Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}</p></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:30px">
      <div><h3>Bill To</h3><p>${customerName}</p></div>
      <div><h3>Ship To</h3><p>${addr?.address_line1 || ''}, ${addr?.city || ''}, ${addr?.state || ''} ${addr?.postal_code || ''}</p></div>
    </div>
    <table><thead><tr><th>Item</th><th style="text-align:center;width:80px">Qty</th><th style="text-align:right;width:120px">Rate</th><th style="text-align:right;width:120px">Amount</th></tr></thead>
    <tbody>${itemsHtml}</tbody></table>
    <div style="display:flex;justify-content:flex-end;margin-top:20px"><table style="width:300px">
      <tr><td>Subtotal</td><td style="text-align:right">₹${parseFloat(order.subtotal).toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right">₹${parseFloat(order.shipping_amount).toFixed(2)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">₹${parseFloat(order.total).toFixed(2)}</td></tr>
    </table></div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    printWindow.document.close();
  };

  /* ── Render states ── */
  if (loading) return <LoadingSpinner message="Loading order details..." />;
  if (!order) return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <h3>Order not found</h3>
      <button className="btn-ghost-sm" onClick={onBack}>← Back to Orders</button>
    </div>
  );

  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
  const customerName = order.customer?.name || addr?.full_name || addr?.name || 'Guest User';
  const customerEmail = order.customer?.email || addr?.email || '';
  const customerPhone = order.customer?.phone || addr?.phone || '';
  const totalDue = Math.max(0, parseFloat(order.total || 0) - parseFloat(paidAmount || '0'));

  const subtotalVal = parseFloat(order.subtotal || 0);
  const discountVal = parseFloat(order.discount_amount || 0);
  const shippingVal = parseFloat(order.shipping_amount || 0);
  const taxVal = parseFloat(order.tax_amount || 0);
  const totalVal = parseFloat(order.total || 0);

  const parseStaffNotes = () => {
    if (!staffNotes) return [];
    const lines = staffNotes.split('\n');
    return lines.map(line => {
      const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        return {
          author: 'Staff Member',
          date: match[1],
          content: match[2]
        };
      }
      return {
        author: 'System Note',
        date: fmtDate(order.created_at),
        content: line
      };
    }).filter(n => n.content.trim() !== '');
  };

  const renderStaffNotesTimeline = () => {
    const parsed = parseStaffNotes();
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxHeight: 200,
        overflowY: 'auto',
        paddingRight: 4
      }}>
        {parsed.map((note, index) => (
          <div key={index} style={{
            background: '#F8FAFC',
            border: '1px solid var(--m-border)',
            borderRadius: 8,
            padding: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 750, color: 'var(--m-primary)' }}>{note.author}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--m-text-muted)' }}>{note.date}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--m-text-main)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{note.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const getStepStatus = (stepName: string) => {
    const status = order.status;
    if (status === 'cancelled') return 'cancelled';
    
    const orderOfStatus = ['pending', 'confirmed', 'processing', 'shipped', 'completed'];
    const currentIndex = orderOfStatus.indexOf(status);
    
    const stepMapping: Record<string, number> = {
      'placed': 0,
      'confirmed': 1,
      'packed': 2,
      'shipped': 3,
      'delivered': 4
    };
    
    const stepIndex = stepMapping[stepName];
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  const renderTimelineBar = () => {
    if (order.status === 'cancelled') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.92rem' }}>Order Cancelled</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)', marginTop: 2 }}>This order has been cancelled.</div>
          </div>
        </div>
      );
    }

    const steps = [
      { status: 'pending', label: 'Placed', icon: <SVG_ICONS.Package /> },
      { status: 'confirmed', label: 'Confirmed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
      { status: 'processing', label: 'Processing', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
      { status: 'shipped', label: 'Shipped', icon: <SVG_ICONS.Truck /> },
      { status: 'completed', label: 'Completed', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status);

    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--m-border)',
        borderRadius: 14,
        padding: '20px 24px',
        marginBottom: 24,
        boxShadow: 'var(--m-shadow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%', overflowX: 'auto', gap: 12 }}>
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            
            let circleColor = 'var(--m-border)';
            let iconColor = 'var(--m-text-muted)';
            let labelColor = 'var(--m-text-muted)';
            let circleBg = '#F8FAFC';
            
            if (isCompleted) {
              circleColor = 'var(--m-primary)';
              iconColor = 'var(--m-primary)';
              circleBg = 'var(--m-primary-light)';
              labelColor = 'var(--m-text-main)';
            } else if (isCurrent) {
              circleColor = 'var(--m-primary)';
              iconColor = '#fff';
              circleBg = 'var(--m-primary)';
              labelColor = 'var(--m-text-main)';
            }

            return (
              <React.Fragment key={step.status}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flexShrink: 0, minWidth: 80 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: `2px solid ${circleColor}`,
                    background: circleBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: iconColor,
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 10px var(--m-primary-light)' : undefined,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 750 : 600, color: labelColor, marginTop: 8, textAlign: 'center' }}>
                    {step.label}
                  </span>
                </div>
                
                {idx < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 3,
                    background: idx < currentIndex ? 'var(--m-primary)' : 'var(--m-border)',
                    minWidth: 30,
                    alignSelf: 'center',
                    marginTop: -16,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFulfillmentStepper = () => {
    const steps = [
      { name: 'placed', label: 'Order Placed', desc: 'Order received via storefront' },
      { name: 'confirmed', label: 'Confirmed', desc: 'Payment confirmed / COD approved' },
      { name: 'packed', label: 'Packed & Ready', desc: 'Items processed and packaged' },
      { name: 'shipped', label: 'Shipped', desc: 'Package handed over to courier' },
      { name: 'delivered', label: 'Delivered', desc: 'Delivered to customer' },
    ];

    return (
      <div className="premium-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.Shield /></span>
          <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fulfillment Pipeline</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 8 }}>
          {steps.map((step, idx) => {
            const stepStatus = getStepStatus(step.name);
            const isCompleted = stepStatus === 'completed';
            const isCancelled = order.status === 'cancelled';
            
            let circleBg = '#FFFFFF';
            let circleBorder = 'var(--m-border)';
            let iconColor = 'var(--m-text-muted)';
            let textColor = 'var(--m-text-muted)';
            let lineBg = 'var(--m-border)';

            if (isCancelled) {
              circleBg = 'rgba(239, 68, 68, 0.05)';
              circleBorder = 'var(--m-danger)';
              iconColor = 'var(--m-danger)';
              textColor = 'var(--m-danger)';
            } else if (isCompleted) {
              circleBg = 'var(--m-primary-light)';
              circleBorder = 'var(--m-primary)';
              iconColor = 'var(--m-primary)';
              textColor = 'var(--m-text-main)';
              lineBg = 'var(--m-primary)';
            }

            const isLast = idx === steps.length - 1;

            return (
              <div key={step.name} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: circleBg,
                    border: `2px solid ${circleBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: iconColor,
                    fontSize: 11, fontWeight: 700,
                    transition: 'all 0.3s ease',
                    zIndex: 2,
                  }}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2,
                      flex: 1,
                      minHeight: 30,
                      background: lineBg,
                      transition: 'all 0.3s ease',
                      margin: '4px 0',
                      zIndex: 1,
                    }} />
                  )}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: textColor }}>{step.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOperationsTabs = () => {
    const tabs = [
      { id: 'fulfillment', label: 'Shipping & Tracking', icon: <SVG_ICONS.Truck /> },
      { id: 'status', label: 'Order Status Update', icon: <SVG_ICONS.Status /> },
      { id: 'notes', label: 'Private Notes & Return', icon: <SVG_ICONS.FileText /> },
    ];

    return (
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tab Switcher Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--m-border)',
          background: 'rgba(241, 245, 249, 0.5)',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`ops-tab-btn ${isActive ? 'active' : ''}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: 20 }}>
          {activeTab === 'fulfillment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Courier & Tracking inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Courier Partner</label>
                  <select className="premium-select" value={courierName} onChange={e => setCourierName(e.target.value)}>
                    <option value="">— Select Courier —</option>
                    {COURIER_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Tracking Number</label>
                  <input
                    className="premium-input"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DL1234567890IN"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Tracking URL</label>
                  <input
                    className="premium-input"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    placeholder="https://track.delhivery.com/..."
                  />
                </div>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Dispatch Date</label>
                  <input className="premium-input" type="date" value={dispatchedAt} onChange={e => setDispatchedAt(e.target.value)} />
                </div>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Expected Delivery Date</label>
                  <input className="premium-input" type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} />
                </div>
              </div>

              {/* Fulfillment Status button selector */}
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--m-text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Set Fulfillment State</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {FULFILLMENT_STEPS.map(step => (
                    <button
                      key={step.value}
                      type="button"
                      onClick={() => setFulfillmentStatus(step.value)}
                      className="fulfillment-btn"
                      style={{
                        border: `2px solid ${fulfillmentStatus === step.value ? step.color : 'var(--m-border)'}`,
                        background: fulfillmentStatus === step.value ? `${step.color}15` : '#FFFFFF',
                        color: fulfillmentStatus === step.value ? step.color : 'var(--m-text-muted)',
                        fontWeight: fulfillmentStatus === step.value ? 700 : 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: fulfillmentStatus === step.value ? step.color : 'var(--m-text-muted)' }}>
                        {step.icon}
                      </div>
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracking banner preview */}
              {trackingNumber && courierName && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--m-primary-light)', border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--m-primary)', marginBottom: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <SVG_ICONS.Check /> Tracking Active
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--m-text-main)' }}>
                        {courierName} — <span style={{ fontFamily: 'monospace' }}>{trackingNumber}</span>
                      </div>
                      {(dispatchedAt || expectedDelivery) && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', marginTop: 4 }}>
                          {dispatchedAt && `Dispatched: ${fmtDate(dispatchedAt)}`}
                          {dispatchedAt && expectedDelivery && ' → '}
                          {expectedDelivery && `Expected: ${fmtDate(expectedDelivery)}`}
                        </div>
                      )}
                    </div>
                    {trackingUrl && (
                      <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--m-primary)', textDecoration: 'none', border: '1px solid var(--m-primary)', padding: '4px 10px', borderRadius: 6, fontWeight: 600, background: '#FFFFFF' }}
                      >
                        Track Live ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status Update section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>New Status</label>
                  <select className="premium-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Status Note (Internal log)</label>
                  <input
                    className="premium-input"
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="e.g. Package dispatched via Delhivery"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Returns & Refunds */}
              <div className="field-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Return Status</label>
                <select className="premium-select" value={returnStatus} onChange={e => setReturnStatus(e.target.value)}>
                  {RETURN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {returnStatus && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.78rem', color: 'var(--m-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SVG_ICONS.Alert /> Return in progress — Status: <strong>{RETURN_OPTIONS.find(r => r.value === returnStatus)?.label}</strong>
                </div>
              )}

              <div style={{ height: '1px', background: 'var(--m-border)', margin: '4px 0' }} />

              {/* Staff Notes */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--m-text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Internal Staff Notes</label>
                <p style={{ fontSize: '0.72rem', color: 'var(--m-text-muted)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SVG_ICONS.Lock /> Visible only to admins and staff. Not shown to customers.
                </p>
                
                {staffNotes && (
                  <div style={{ marginBottom: 12 }}>
                    {renderStaffNotesTimeline()}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="premium-input"
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Add a private note for your team..."
                    style={{ flex: 1 }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
                  />
                  <button className="btn-ghost-sm" onClick={handleAddNote} style={{ whiteSpace: 'nowrap', background: 'var(--m-primary)', color: '#FFF', border: '1px solid var(--m-primary-hover)' }}>
                    + Add Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getGoogleMapsUrl = () => {
    if (!addr) return '';
    const query = encodeURIComponent(`${addr.address_line1 || ''} ${addr.city || ''} ${addr.state || ''} ${addr.postal_code || ''} ${addr.country || 'India'}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return <span className="status-pill completed"><SVG_ICONS.Dot />Completed</span>;
      case 'processing':
        return <span className="status-pill processing"><SVG_ICONS.Dot />Processing</span>;
      case 'shipped':
        return <span className="status-pill shipped"><SVG_ICONS.Dot />Shipped</span>;
      case 'cancelled':
        return <span className="status-pill cancelled"><SVG_ICONS.Dot />Cancelled</span>;
      case 'confirmed':
        return <span className="status-pill completed"><SVG_ICONS.Dot />Confirmed</span>;
      default:
        return <span className="status-pill pending"><SVG_ICONS.Dot />Pending</span>;
    }
  };

  const totalItemsCount = (order.items || []).reduce((acc: number, item: any) => acc + item.qty, 0);

  const customerOrders = order.customer?.total_orders || 1;
  const customerLifetime = order.customer?.total_spent != null ? parseFloat(order.customer.total_spent) : parseFloat(order.total);
  const customerSince = order.customer?.created_at ? fmtDate(order.customer.created_at) : fmtDate(order.created_at);

  const renderSummaryCards = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      marginBottom: 24
    }}>
      <div className="stat-card">
        <span className="stat-card-title">Total Amount</span>
        <span className="stat-card-value">{formatINR(order.total)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-title">Paid Amount</span>
        <span className="stat-card-value" style={{ color: '#10B981' }}>{paidAmount ? `₹${parseFloat(paidAmount).toFixed(2)}` : '₹0.00'}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-title">Due Amount</span>
        <span className="stat-card-value" style={{ color: totalDue > 0 ? 'var(--m-danger)' : 'var(--m-text-muted)' }}>{paidAmount ? `₹${totalDue.toFixed(2)}` : formatINR(order.total)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card-title">Items Ordered</span>
        <span className="stat-card-value" style={{ color: 'var(--m-indigo)' }}>{totalItemsCount}</span>
      </div>
    </div>
  );

  return (
    <div className="premium-order-page">
      <style>{`
        .premium-order-page {
          background-color: transparent;
          color: var(--m-text-main);
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .premium-card {
          background: #FFFFFF;
          border: 1px solid var(--m-border);
          border-radius: 12px;
          box-shadow: var(--m-shadow);
          padding: 24px;
          transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .premium-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
        }
        .stat-card {
          background: #FFFFFF;
          border: 1px solid var(--m-border);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: var(--m-shadow);
        }
        .stat-card-title {
          font-size: 0.75rem;
          color: var(--m-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-card-value {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--m-text-main);
        }
        /* Layout split */
        .split-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .split-layout {
            grid-template-columns: 1fr;
          }
        }
        /* Sidebar sticky */
        .sticky-sidebar {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        /* Pill badge */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-pill.completed {
          background: #DEF7EC;
          color: #03543F;
          border: 1px solid #BCF0DA;
        }
        .status-pill.processing {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }
        .status-pill.shipped {
          background: #E1EFFE;
          color: #1E429F;
          border: 1px solid #C3DDFD;
        }
        .status-pill.cancelled {
          background: #FDE8E8;
          color: #9B1C1C;
          border: 1px solid #F8B4B4;
        }
        .status-pill.pending {
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #E5E7EB;
        }
        /* Operations Tabs */
        .ops-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 12px;
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          color: var(--m-text-muted);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ops-tab-btn:hover {
          color: var(--m-text-main);
          background: rgba(0, 0, 0, 0.01);
        }
        .ops-tab-btn.active {
          color: var(--m-primary);
          border-bottom-color: var(--m-primary);
          font-weight: 750;
          background: var(--m-primary-light);
        }
        /* Form controls */
        .premium-input, .premium-select {
          background: #FFFFFF;
          border: 1px solid var(--m-border);
          color: var(--m-text-main);
          border-radius: 8px;
          padding: 10px 14px;
          font-family: inherit;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .premium-input:focus, .premium-select:focus {
          border-color: var(--m-primary);
          box-shadow: 0 0 0 3px var(--m-primary-light);
        }
        /* Big quick actions */
        .big-action-btn {
          flex: 1;
          min-width: 130px;
          padding: 12px 10px;
          border-radius: 10px;
          text-align: center;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .big-action-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        }
        .big-action-btn:active {
          transform: translateY(0);
        }
        
        /* Stepper overrides */
        .fulfillment-btn {
          flex: 1;
          min-width: 100px;
          padding: 10px 8px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .fulfillment-btn:active {
          transform: scale(0.97);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn-ghost-sm" onClick={onBack} style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid var(--m-border)', color: 'var(--m-text-main)' }}>
            <Icons.ArrowLeft /> Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Order #{order.order_number}</h2>
              {statusBadge(order.status)}
              {order.fulfillment_status && order.fulfillment_status !== 'unfulfilled' && (
                <span className={`status-pill ${order.fulfillment_status === 'fulfilled' ? 'completed' : order.fulfillment_status === 'returned' ? 'cancelled' : 'processing'}`}>
                  <SVG_ICONS.Dot />{order.fulfillment_status.toUpperCase()}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--m-text-muted)' }}>
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost-sm" onClick={handlePrintInvoice} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFFFFF', border: '1px solid var(--m-border)', color: 'var(--m-text-main)' }}>
            <SVG_ICONS.Printer /> Print Invoice
          </button>
          <button
            className="btn-primary"
            onClick={handleSaveAll}
            disabled={saving || updating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px' }}
          >
            {saving ? <><SVG_ICONS.Spinner /> Saving…</> : <><Icons.Check /> Save Changes</>}
          </button>
        </div>
      </header>

      {/* ── Interactive Horizontal Stepper ─────────────────────────────── */}
      {renderTimelineBar()}

      {/* ── Summary Stats Cards Grid ───────────────────────────────────── */}
      {renderSummaryCards()}

      {/* ── Two-column responsive split layout ─────────────────────────── */}
      <div className="split-layout">

        {/* ══ LEFT COLUMN (Order Details) ════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Customer Instruction Alert Note */}
          {order.notes && (
            <div style={{
              background: 'var(--m-primary-light)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 12,
              padding: '12px 18px',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <span style={{ color: 'var(--m-primary)', marginTop: 2, display: 'inline-flex' }}>
                <SVG_ICONS.MessageSquare />
              </span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--m-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Instruction</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--m-text-main)', marginTop: 4, fontWeight: 550, fontStyle: 'italic' }}>
                  "{order.notes}"
                </div>
              </div>
            </div>
          )}

          {/* Ordered Items snapshots */}
          <div className="premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.Package /></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ordered Items</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(order.items || []).map((item: any, idx: number) => {
                const snap = typeof item.product_snap === 'string' ? JSON.parse(item.product_snap) : item.product_snap;
                const storefrontLink = `http://localhost:3001/products/${snap?.slug || ''}`;
                
                return (
                  <div key={item.id || idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: '#F8FAFC',
                    border: '1px solid var(--m-border)',
                    borderRadius: 12,
                    transition: 'all 0.2s',
                  }}>
                    {snap?.image_url ? (
                      <img src={snap.image_url} alt={snap?.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--m-border)' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 10, background: '#FFFFFF', border: '1px solid var(--m-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--m-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <a href={storefrontLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--m-text-main)', fontWeight: 750, fontSize: '0.9rem', transition: 'color 0.15s' }}
                         onMouseEnter={(e) => e.currentTarget.style.color = 'var(--m-primary)'}
                         onMouseLeave={(e) => e.currentTarget.style.color = 'var(--m-text-main)'}
                      >
                        {snap?.name || 'Product Item'}
                      </a>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                        {snap?.label && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--m-primary-light)', color: 'var(--m-primary)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 4, fontWeight: 600 }}>
                            {snap.label}
                          </span>
                        )}
                        {snap?.sku && (
                          <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--m-text-muted)' }}>
                            SKU: {snap.sku}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--m-primary)' }}>{formatINR(item.line_total)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--m-text-muted)', marginTop: 4 }}>
                        {item.qty} × {formatINR(item.unit_price)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ height: '1px', background: 'var(--m-border)', margin: '20px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 260 }}>
                {[
                  { label: 'Subtotal', value: formatINR(subtotalVal) },
                  { label: 'Discount', value: discountVal > 0 ? `-${formatINR(discountVal)}` : '—' },
                  { label: 'Shipping', value: formatINR(shippingVal) },
                  { label: 'Tax', value: formatINR(taxVal) },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--m-primary)', borderTop: '1px solid var(--m-border)', marginTop: 8 }}>
                  <span>Grand Total</span><span>{formatINR(totalVal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Vertical Stepper */}
          {renderFulfillmentStepper()}

          {/* Operations Tabs (Fulfillment settings, notes timeline, returns) */}
          {renderOperationsTabs()}

        </div>

        {/* ══ RIGHT COLUMN (Customer Panel Sidebar) ═══════════════════════ */}
        <div className="sticky-sidebar">

          {/* Customer stats info card */}
          <div className="premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.User /></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Customer Panel</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0,
              }}>
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 750, fontSize: '0.92rem', color: 'var(--m-text-main)' }}>{customerName}</div>
                {customerEmail && <div style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)', marginTop: 2 }}>{customerEmail}</div>}
              </div>
            </div>

            {/* Customer stats block */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              background: '#F8FAFC',
              border: '1px solid var(--m-border)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 16
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--m-text-muted)' }}>Total Orders</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--m-primary)', marginTop: 4 }}>{customerOrders}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--m-text-muted)' }}>Lifetime Spend</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--m-primary)', marginTop: 4 }}>{formatINR(customerLifetime)}</div>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--m-border)', paddingTop: 8, marginTop: 4 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--m-text-muted)' }}>Customer Since</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-main)', marginTop: 4 }}>{customerSince}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FieldRow label="Phone" value={customerPhone || '—'} />
              <FieldRow label="Email" value={customerEmail || '—'} />
            </div>
          </div>

          {/* Delivery Address Details with Google Map Link */}
          <div className="premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.MapPin /></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Delivery Address</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Name', value: addr?.full_name || addr?.name || customerName },
                { label: 'Phone', value: addr?.phone || customerPhone },
                { label: 'Address', value: addr?.address_line1 },
                { label: 'Address 2', value: addr?.address_line2 },
                { label: 'City', value: addr?.city },
                { label: 'State', value: addr?.state },
                { label: 'PIN Code', value: addr?.postal_code || addr?.zip, mono: true },
                { label: 'Country', value: addr?.country || 'India' },
              ].filter(r => r.value).map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--m-text-main)', fontWeight: 600, textAlign: 'right', fontFamily: r.mono ? 'monospace' : undefined }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
            
            {addr?.address_line1 && (
              <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'var(--m-primary-light)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--m-primary)',
                borderRadius: 8,
                padding: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: 16,
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--m-primary-light)'; }}
              >
                <SVG_ICONS.MapPin /> View On Map
              </a>
            )}
          </div>

          {/* Payment Card Details */}
          <div className="premium-card" style={{
            background: totalDue === 0 ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.01)',
            borderColor: totalDue === 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--m-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.CreditCard /></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Payment Details</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="field-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Payment Method</label>
                <select className="premium-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="">— Select —</option>
                  {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>Paid Amount (₹)</label>
                <input
                  type="number"
                  className="premium-input"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder={`Max: ${parseFloat(order.total || 0).toFixed(2)}`}
                  min={0}
                />
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--m-border)', marginBottom: 14 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>Payment Status</span>
                <div>
                  {paidAmount && parseFloat(paidAmount) >= parseFloat(order.total || 0) ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--m-primary)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                      <SVG_ICONS.Check /> FULLY PAID
                    </span>
                  ) : paidAmount && parseFloat(paidAmount) > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.12)', color: '#D97706', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                      <SVG_ICONS.Alert /> PARTIALLY PAID
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.12)', color: 'var(--m-danger)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                      <SVG_ICONS.Clock /> PAYMENT PENDING
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>Order Total</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-text-main)', fontWeight: 600 }}>{formatINR(order.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>Amount Paid</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-primary)', fontWeight: 600 }}>{paidAmount ? `₹${parseFloat(paidAmount).toFixed(2)}` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--m-text-muted)' }}>Amount Due</span>
                <span style={{ fontSize: '0.78rem', color: totalDue > 0 ? 'var(--m-danger)' : 'var(--m-text-muted)', fontWeight: 600 }}>{paidAmount ? `₹${totalDue.toFixed(2)}` : formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ color: 'var(--m-primary)', display: 'inline-flex' }}><SVG_ICONS.Info /></span>
              <span style={{ fontSize: '0.88rem', fontWeight: 750, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Quick Actions</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {customerPhone ? (
                <>
                  <a href={`https://wa.me/${customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="big-action-btn"
                    style={{ background: '#25D366', color: '#FFF' }}
                  >
                    <SVG_ICONS.WhatsApp /> WhatsApp
                  </a>
                  <a href={`tel:${customerPhone}`} className="big-action-btn"
                    style={{ background: '#3B82F6', color: '#FFF' }}
                  >
                    <SVG_ICONS.Call /> Call
                  </a>
                </>
              ) : (
                <button disabled className="big-action-btn" style={{ background: '#E2E8F0', color: '#94A3B8', cursor: 'not-allowed' }}>No Phone Info</button>
              )}
              
              {customerEmail ? (
                <a href={`mailto:${customerEmail}`} className="big-action-btn"
                  style={{ background: '#6366F1', color: '#FFF' }}
                >
                  <SVG_ICONS.Mail /> Send Email
                </a>
              ) : (
                <button disabled className="big-action-btn" style={{ background: '#E2E8F0', color: '#94A3B8', cursor: 'not-allowed' }}>No Email Info</button>
              )}

              <button onClick={handlePrintInvoice} className="big-action-btn"
                style={{ background: 'var(--m-primary)', color: '#FFF' }}
              >
                <SVG_ICONS.File /> Invoice
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
