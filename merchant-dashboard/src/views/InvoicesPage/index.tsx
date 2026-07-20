import React, { useState, useEffect, useCallback } from 'react';
import { merchantApi } from '@/lib/api-client';
import { formatINR } from '@/utils';
import { Icons } from '@/components/ui/Icons';
import { StatCard, Badge, EmptyState, LoadingSpinner } from '@/components/ui/Shared';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'issued' | 'cancelled'>('all');

  // Modal / Drawer preview states
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actioning, setActioning] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load invoices
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchantApi.getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Load single invoice details (with logs)
  const viewInvoice = async (id: string) => {
    try {
      setModalLoading(true);
      const data = await merchantApi.getInvoiceById(id);
      setSelectedInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Change Invoice Status
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await merchantApi.updateInvoiceStatus(id, newStatus);
      // Reload details and list
      const details = await merchantApi.getInvoiceById(id);
      setSelectedInvoice(details);
      await load();
    } catch (err) {
      alert('Failed to update invoice status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Email Invoice
  const handleEmailInvoice = async (id: string) => {
    try {
      setActioning(true);
      await merchantApi.emailInvoice(id);
      alert(`Invoice has been successfully emailed to ${selectedInvoice.customer_email}`);
      // Reload details to get logs
      const details = await merchantApi.getInvoiceById(id);
      setSelectedInvoice(details);
    } catch (err) {
      alert('Failed to send invoice email');
    } finally {
      setActioning(false);
    }
  };

  // Log Print and open browser print
  const handlePrint = async () => {
    if (!selectedInvoice) return;
    try {
      await merchantApi.logInvoicePrint(selectedInvoice.id);
      // Trigger print window
      window.print();
      // Reload details to get logs
      const details = await merchantApi.getInvoiceById(selectedInvoice.id);
      setSelectedInvoice(details);
    } catch (err) {
      console.error('Failed to log print activity:', err);
      window.print();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (invoices.length === 0) return;
    
    // Header
    const headers = [
      'Invoice Number',
      'Issue Date',
      'Order Reference',
      'Customer Name',
      'Customer Email',
      'Currency',
      'Subtotal',
      'Tax Amount',
      'CGST',
      'SGST',
      'IGST',
      'Total Amount',
      'Status'
    ];

    const rows = filteredInvoices.map((inv: any) => [
      inv.invoice_number,
      new Date(inv.issue_date).toLocaleDateString(),
      inv.transaction_id || 'N/A',
      inv.customer_name,
      inv.customer_email,
      inv.currency,
      inv.subtotal,
      inv.tax_amount,
      inv.cgst,
      inv.sgst,
      inv.igst,
      inv.total,
      inv.status.toUpperCase()
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_invoices_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv: any) => {
    // Status filter
    if (filter !== 'all' && inv.status.toLowerCase() !== filter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const numMatch = inv.invoice_number.toLowerCase().includes(q);
      const custMatch = inv.customer_name.toLowerCase().includes(q);
      const emailMatch = inv.customer_email.toLowerCase().includes(q);
      return numMatch || custMatch || emailMatch;
    }

    return true;
  });

  // Calculate metrics based on FILTERED invoices (or all)
  const activeInvoices = filteredInvoices;
  const totalRevenue = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalTax = activeInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount), 0);
  const totalCGST = activeInvoices.reduce((sum, inv) => sum + Number(inv.cgst), 0);
  const totalSGST = activeInvoices.reduce((sum, inv) => sum + Number(inv.sgst), 0);
  const totalIGST = activeInvoices.reduce((sum, inv) => sum + Number(inv.igst), 0);

  // Pagination bounds
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* Printable Area Wrapper CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-drawer, #printable-invoice-drawer * {
            visibility: visible;
          }
          #printable-invoice-drawer {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            padding: 20px;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <header className="page-header">
          <div>
            <h2>Sales Invoices</h2>
            <p className="header-sub">Manage sales tax invoices, track GST/IGST collected, and print or email copies</p>
          </div>
          <button 
            onClick={handleExportCSV} 
            disabled={filteredInvoices.length === 0} 
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Export Tax Report (CSV)
          </button>
        </header>

        {/* GST & Revenue Metrics Row */}
        <div className="metrics-grid">
          <StatCard label="Invoice Revenue" value={formatINR(totalRevenue)} icon={<Icons.Currency />} />
          <StatCard label="GST Collected" value={formatINR(totalTax)} icon={<Icons.Clipboard />} type="indigo" />
          <StatCard 
            label="CGST / SGST / IGST Breakdown" 
            value={`${formatINR(totalCGST + totalSGST)} / ${formatINR(totalIGST)}`} 
            icon={<Icons.Package />} 
            type="warn" 
          />
        </div>

        {/* Invoices List / Table */}
        <div className="card" style={{ marginTop: '20px' }}>
          {/* Filters and search toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
            <div className="tabs-header" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>
              <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setCurrentPage(1); }}>All</button>
              <button className={`tab-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => { setFilter('paid'); setCurrentPage(1); }}>Paid</button>
              <button className={`tab-btn ${filter === 'issued' ? 'active' : ''}`} onClick={() => { setFilter('issued'); setCurrentPage(1); }}>Issued</button>
              <button className={`tab-btn ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => { setFilter('cancelled'); setCurrentPage(1); }}>Cancelled</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, justifySelf: 'flex-end', maxWidth: '350px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Search invoice number, name, email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--db-border, #E2E8F0)',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching sales invoices..." />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState message="No Invoices Found. We couldn't find any invoices matching the active filters." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Issue Date</th>
                    <th>Customer</th>
                    <th>Tax Amount</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv: any) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--db-border, #F1F5F9)' }}>
                      <td>
                        <strong style={{ color: 'var(--db-text-main, #0F172A)' }}>{inv.invoice_number}</strong>
                      </td>
                      <td>{new Date(inv.issue_date).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{inv.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{inv.customer_email}</div>
                      </td>
                      <td>{formatINR(inv.tax_amount)}</td>
                      <td>
                        <strong>{formatINR(inv.total)}</strong>
                      </td>
                      <td>
                        <Badge type={inv.status === 'paid' ? 'success' : inv.status === 'issued' ? 'warn' : 'danger'}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => viewInvoice(inv.id)} className="btn-secondary-sm">
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0 0 0' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--db-text-muted, #64748B)' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="btn-secondary-sm">Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setCurrentPage(i + 1)} className={`btn-secondary-sm ${currentPage === i + 1 ? 'active' : ''}`} style={{ background: currentPage === i + 1 ? 'var(--db-primary, #2563EB)' : undefined, color: currentPage === i + 1 ? 'white' : undefined }}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="btn-secondary-sm">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Drawer Preview Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'stretch',
          boxSizing: 'border-box'
        }} className="no-print">
          <div style={{
            width: '100%',
            maxWidth: '650px',
            background: '#F8FAFC',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
            overflowY: 'auto',
            animation: 'slideIn 0.25s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #E2E8F0',
              background: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Invoice Details
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                  Preview, download, print, or email to customer
                </p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                &times;
              </button>
            </div>

            {modalLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingSpinner message="Fetching details..." />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', gap: '20px' }}>
                {/* Actions Panel */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrint} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Print / PDF
                    </button>
                    <button 
                      onClick={() => handleEmailInvoice(selectedInvoice.id)} 
                      disabled={actioning}
                      className="btn-secondary" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Icons.Globe /> {actioning ? 'Sending...' : 'Email Invoice'}
                    </button>
                  </div>

                  {/* Status update selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B' }}>Status:</span>
                    <select
                      value={selectedInvoice.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(selectedInvoice.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="issued">Issued</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Printable Invoice Form Document */}
                <div 
                  id="printable-invoice-drawer"
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    padding: '30px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ margin: 0, color: 'var(--db-primary, #2563EB)', fontWeight: 800 }}>TAX INVOICE</h2>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                        <strong>{selectedInvoice.merchant_company_name || 'GoOak Store'}</strong>
                        {selectedInvoice.merchant_gst_number && <div>GSTIN: {selectedInvoice.merchant_gst_number}</div>}
                        {selectedInvoice.merchant_pan && <div>PAN: {selectedInvoice.merchant_pan}</div>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h4 style={{ margin: 0, color: '#0F172A', fontWeight: 700 }}>{selectedInvoice.invoice_number}</h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                        Date: {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                        {selectedInvoice.due_date && <div>Due Date: {new Date(selectedInvoice.due_date).toLocaleDateString()}</div>}
                        {selectedInvoice.paid_at && <div>Paid At: {new Date(selectedInvoice.paid_at).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', fontSize: '0.78rem', color: '#475569' }}>
                    <div>
                      <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#94A3B8', fontSize: '0.68rem', display: 'block', marginBottom: '4px' }}>Billed To:</span>
                      <strong>{selectedInvoice.customer_name}</strong>
                      <div>{selectedInvoice.customer_email}</div>
                      <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                        {selectedInvoice.billing_address?.address_line1 || selectedInvoice.billing_address?.city || 'No billing address specified'}
                        {selectedInvoice.billing_address?.city && `, ${selectedInvoice.billing_address.city}`}
                        {selectedInvoice.billing_address?.state && `, ${selectedInvoice.billing_address.state}`}
                        {selectedInvoice.billing_address?.postal_code && ` - ${selectedInvoice.billing_address.postal_code}`}
                      </div>
                    </div>
                    <div>
                      <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#94A3B8', fontSize: '0.68rem', display: 'block', marginBottom: '4px' }}>Order Reference:</span>
                      <div>Order ID: {selectedInvoice.transaction_id || 'N/A'}</div>
                      <div>Gateway: {selectedInvoice.payment_method || 'UPI / Manual'}</div>
                      {selectedInvoice.paid_at && <div style={{ color: '#16A34A', fontWeight: 700, marginTop: 4 }}>PAID</div>}
                    </div>
                  </div>

                  {/* Items list */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: 6 }}>
                        <th style={{ padding: '6px 0', fontWeight: 700, color: '#475569' }}>Description</th>
                        <th style={{ padding: '6px 0', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '6px 0', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '6px 0', fontWeight: 700, color: '#475569', textAlign: 'right' }}>GST Rate</th>
                        <th style={{ padding: '6px 0', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item: any) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 0' }}>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.product_name}</div>
                            {item.sku && <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>SKU: {item.sku}</div>}
                          </td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.qty}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatINR(item.unit_price)}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>{item.tax_rate}%</td>
                          <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600 }}>{formatINR(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', borderTop: '2px solid #CBD5E1', paddingTop: '15px' }}>
                    {/* Tax Breakdown breakdown */}
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      <span style={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', marginBottom: '6px' }}>Tax Breakdown:</span>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {Number(selectedInvoice.cgst) > 0 && (
                            <tr>
                              <td style={{ padding: '2px 0' }}>Central GST (CGST - 9%):</td>
                              <td style={{ padding: '2px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.cgst)}</td>
                            </tr>
                          )}
                          {Number(selectedInvoice.sgst) > 0 && (
                            <tr>
                              <td style={{ padding: '2px 0' }}>State GST (SGST - 9%):</td>
                              <td style={{ padding: '2px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.sgst)}</td>
                            </tr>
                          )}
                          {Number(selectedInvoice.igst) > 0 && (
                            <tr>
                              <td style={{ padding: '2px 0' }}>Integrated GST (IGST - 18%):</td>
                              <td style={{ padding: '2px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.igst)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Overall Totals */}
                    <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '4px 0' }}>Subtotal:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.subtotal)}</td>
                          </tr>
                          {Number(selectedInvoice.discount_amount) > 0 && (
                            <tr>
                              <td style={{ padding: '4px 0', color: '#EF4444' }}>Discount:</td>
                              <td style={{ padding: '4px 0', textAlign: 'right', color: '#EF4444' }}>-{formatINR(selectedInvoice.discount_amount)}</td>
                            </tr>
                          )}
                          <tr>
                            <td style={{ padding: '4px 0' }}>Shipping:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.shipping_amount)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 0' }}>Total Tax:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatINR(selectedInvoice.tax_amount)}</td>
                          </tr>
                          <tr style={{ borderTop: '1px dashed #CBD5E1' }}>
                            <td style={{ padding: '8px 0', fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>Grand Total ({selectedInvoice.currency}):</td>
                            <td style={{ padding: '8px 0', fontWeight: 800, fontSize: '0.85rem', color: 'var(--db-primary, #2563EB)', textAlign: 'right' }}>
                              {formatINR(selectedInvoice.total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Audit / Timeline activity logs */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                    Activity Logs &amp; Audit Trail
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedInvoice.logs?.map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>{log.action}</span> - {log.note}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                          {new Date(log.created_at).toLocaleString()} by {log.changed_by}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
