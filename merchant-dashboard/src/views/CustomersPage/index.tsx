import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner, EmptyState } from '@/components/ui/Shared';
import { merchantApi } from '@/lib/api-client';

interface CustomersPageProps {
  shopInfo: any;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ shopInfo }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomers = async (search?: string) => {
    setLoading(true);
    try {
      const data = await merchantApi.getCustomers(search);
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchTerm);
  }, [searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Customers Registry</h2>
          <p className="header-sub">{customers.length} registered customers</p>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
          <h3 className="card-title" style={{ margin: 0 }}>Customer List</h3>
          
          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--m-text-muted)', display: 'flex', alignItems: 'center' }}>
              <Icons.Search style={{ width: 16, height: 16 }} />
            </span>
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1px solid var(--m-border)',
                borderRadius: '6px',
                padding: '8px 12px 8px 36px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching customer records..." />
        ) : customers.length === 0 ? (
          <EmptyState message={searchTerm ? "No customers found matching the search criteria." : "No registered customers yet."} />
        ) : (
          <>
            <div className="db-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Total Orders</th>
                    <th style={{ textAlign: 'right' }}>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--m-text-main)' }}>{c.name || 'Anonymous Guest'}</td>
                      <td>{c.email || 'N/A'}</td>
                      <td>{c.phone || 'N/A'}</td>
                      <td>
                        {c.is_verified ? (
                          <Badge type="success">VERIFIED</Badge>
                        ) : (
                          <Badge type="warn">UNVERIFIED</Badge>
                        )}
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>{c.total_orders || 0}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--m-text-main)' }}>
                        ₹{Number(c.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Next
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
