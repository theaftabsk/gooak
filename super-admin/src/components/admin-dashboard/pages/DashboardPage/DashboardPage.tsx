import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../icons';
import { StatCard, Badge, EmptyState, LoadingSpinner } from '../../shared';
import { storeDomainLabel } from '../../utils';

interface DashboardPageProps {
  stats: any;
  shops: any[];
  requests: any[];
  loading: boolean;
  onApprove: (id: string) => void;
  approvingId: string | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats, shops, requests, loading, onApprove, approvingId
}) => {
  const navigate = useNavigate();
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Platform Dashboard</h2>
          <p className="header-sub">OakSol SaaS Commerce — Platform Overview</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/onboard')}>
          <Icons.Plus /> New Store
        </button>
      </header>

      {loading ? <LoadingSpinner message="Loading platform statistics…" /> : stats ? (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatCard label="Active Stores" value={stats.totalShops} icon={<Icons.Store />} onClick={() => navigate('/stores')} />
          <StatCard label="Total Products" value={stats.totalProducts} icon={<Icons.Package />} />
          <StatCard label="Pending Requests" value={stats.pendingRequests} icon={<Icons.Clipboard />} warn={stats.pendingRequests > 0} onClick={() => navigate('/requests')} />
          <StatCard label="Platform Status" value="Healthy" icon={<Icons.ShieldCheck />} />
        </div>
      ) : null}

      <div className="section-grid">
        {/* Recent Stores */}
        <div className="card">
          <h3 className="card-title">Recent Stores</h3>
          {shops.slice(0, 5).map(shop => (
            <div key={shop.id} className="list-row" onClick={() => navigate(`/stores/${shop.slug}`)} style={{ cursor: 'pointer' }}>
              <div className="list-row-left">
                <div className="store-avatar">{shop.name[0]}</div>
                <div>
                  <strong>{shop.name}</strong>
                  <div className="muted">{storeDomainLabel(shop.slug)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge type={shop.plan === 'pro' ? 'pro' : 'default'}>{shop.plan.toUpperCase()}</Badge>
                <Badge type="success">{shop.status.toUpperCase()}</Badge>
              </div>
            </div>
          ))}
          {shops.length > 5 && (
            <button className="btn-ghost-sm" style={{ marginTop: 12 }} onClick={() => navigate('/stores')}>
              View all {shops.length} stores <Icons.ArrowRight />
            </button>
          )}
          {shops.length === 0 && <EmptyState message="No stores provisioned yet." />}
        </div>

        {/* Pending Requests */}
        <div className="card">
          <h3 className="card-title">Pending Requests</h3>
          {pendingRequests.slice(0, 5).map(req => (
            <div key={req.id} className="list-row">
              <div className="list-row-left">
                <div className="store-avatar req">{req.name[0]}</div>
                <div>
                  <strong>{req.name}</strong>
                  <div className="muted">{req.owner_name} · {req.category || 'General'}</div>
                </div>
              </div>
              <button className="btn-sm-green" onClick={() => onApprove(req.id)} disabled={approvingId === req.id}>
                {approvingId === req.id ? '…' : <><Icons.Check /> Approve</>}
              </button>
            </div>
          ))}
          {pendingRequests.length === 0 && <EmptyState message="No pending requests." />}
          {pendingRequests.length > 5 && (
            <button className="btn-ghost-sm" style={{ marginTop: 12 }} onClick={() => navigate('/requests')}>
              View all <Icons.ArrowRight />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
