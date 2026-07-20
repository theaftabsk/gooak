import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Badge, LoadingSpinner, EmptyState } from '@/components/ui/Shared';
import { merchantApi } from '@/lib/api-client';

interface ReviewsPageProps {
  shopInfo: any;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ shopInfo }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await merchantApi.getReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await merchantApi.updateReviewStatus(id, status);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.error('Error updating review status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await merchantApi.deleteReview(id);
        setReviews(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error('Error deleting review:', err);
        alert('Failed to delete review');
      }
    }
  };

  // Filter reviews by status
  const filteredReviews = statusFilter === 'all'
    ? reviews
    : reviews.filter(r => r.status?.toLowerCase() === statusFilter.toLowerCase());

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render stars helper
  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: 2, color: '#FBBF24' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Reviews Registry</h2>
          <p className="header-sub">Moderate customer product reviews and ratings</p>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, marginBottom: 20 }}>
          <h3 className="card-title" style={{ margin: 0 }}>All Product Reviews</h3>
          
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
              <option value="all">All Reviews</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching reviews..." />
        ) : filteredReviews.length === 0 ? (
          <EmptyState message={statusFilter !== 'all' ? `No reviews found with status "${statusFilter}".` : "No customer reviews in database yet."} />
        ) : (
          <>
            <div className="db-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Rating</th>
                    <th>Review Title &amp; Body</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReviews.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--m-text-main)' }}>
                        {r.product?.name || 'Unknown Product'}
                      </td>
                      <td>{renderStars(r.rating)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--m-text-main)', marginBottom: 4 }}>
                          {r.title || 'N/A'}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--m-text-muted)', maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {r.body || 'No description provided.'}
                        </p>
                      </td>
                      <td>
                        {r.status === 'approved' ? (
                          <Badge type="success">APPROVED</Badge>
                        ) : r.status === 'rejected' ? (
                          <Badge type="danger">REJECTED</Badge>
                        ) : (
                          <Badge type="warn">PENDING</Badge>
                        )}
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {r.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'approved')}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#10B981', color: '#10B981' }}
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'rejected')}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#EF4444', color: '#EF4444' }}
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Delete
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
