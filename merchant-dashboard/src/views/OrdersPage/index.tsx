import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner, EmptyState } from '@/components/ui/Shared';
import { formatINR } from '@/utils';

interface OrdersPageProps {
  orders: any[];
  loading: boolean;
  onUpdateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  updating: boolean;
}

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const filterSelectStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid var(--m-border)',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.85rem',
  outline: 'none',
  cursor: 'pointer'
};

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders, loading, onUpdateOrderStatus, updating
}) => {
  const router = useRouter();

  // Filters and Pagination states
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenOrder = (o: any) => {
    router.push(`/orders/${o.id}`);
  };

  // Get unique list of years from orders for the year filter, fallback to current year
  const uniqueYears = Array.from(new Set(orders.map(o => new Date(o.created_at).getFullYear())))
    .sort((a, b) => b - a);
  const yearsList = uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];

  // Filtering Logic
  const filteredOrders = orders.filter(o => {
    const d = new Date(o.created_at);
    if (filterDay && d.getDate() !== parseInt(filterDay)) return false;
    if (filterMonth && d.getMonth() !== parseInt(filterMonth)) return false;
    if (filterYear && d.getFullYear() !== parseInt(filterYear)) return false;
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Orders Registry</h2>
          <p className="header-sub">{orders.length} transaction entries found</p>
        </div>
      </header>

      <div className="card">
        {/* Header containing title and Year/Month/Day filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Customer Transactions</h3>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Year Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-muted)' }}>Year:</span>
              <select
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}
                style={filterSelectStyle}
              >
                <option value="">All Years</option>
                {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Month Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-muted)' }}>Month:</span>
              <select
                value={filterMonth}
                onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                style={filterSelectStyle}
              >
                <option value="">All Months</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Day Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-muted)' }}>Day:</span>
              <select
                value={filterDay}
                onChange={e => { setFilterDay(e.target.value); setCurrentPage(1); }}
                style={filterSelectStyle}
              >
                <option value="">All Days</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? <LoadingSpinner message="Fetching orders..." /> : filteredOrders.length === 0 ? (
          <EmptyState message={
            filterDay || filterMonth || filterYear 
              ? "No transactions found matching the selected date filters."
              : "No orders placed yet. Storefront checkouts will show up here."
          } />
        ) : (
          <>
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
                  {paginatedOrders.map(o => {
                    const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
                    const name = o.customer?.name || addr?.full_name || addr?.name || 'Guest User';
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--m-border)', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)' }}>
                  Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> transactions
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
