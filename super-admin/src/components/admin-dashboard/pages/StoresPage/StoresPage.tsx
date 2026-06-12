import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../icons';
import { Badge, EmptyState, LoadingSpinner } from '../../shared';
import { storeUrl, storeDomainLabel } from '../../utils';

interface StoresPageProps {
  shops: any[];
  loading: boolean;
}

export const StoresPage: React.FC<StoresPageProps> = ({ shops, loading }) => {
  const navigate = useNavigate();

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Active Storefronts</h2>
          <p className="header-sub">{shops.length} merchants provisioned on this node</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/onboard')}>
          <Icons.Plus /> Provision Store
        </button>
      </header>

      {loading ? <LoadingSpinner message="Fetching storefronts…" /> : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Storefront</th>
                <th>Primary Domain</th>
                <th>Owner Details</th>
                <th>Plan</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map(shop => {
                const domain = shop.domains?.[0]?.domain || storeDomainLabel(shop.slug);
                const href = shop.domains?.[0]?.domain ? `https://${shop.domains[0].domain}` : storeUrl(shop.slug);
                return (
                  <tr 
                    key={shop.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/stores/${shop.slug}`)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="store-avatar" style={{ width: '40px', height: '40px', fontSize: '1.1rem', borderRadius: '8px' }}>
                          {shop.name[0].toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{shop.name}</strong>
                          <div className="muted small" style={{ marginTop: '2px' }}>Slug: {shop.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', background: '#F8FAFC', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        {domain}
                      </span>
                    </td>
                    <td>
                      {shop.owner ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{shop.owner.name}</div>
                          <div className="muted small">{shop.owner.email}</div>
                        </div>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                    <td>
                      <Badge type={shop.plan === 'pro' ? 'pro' : 'default'}>{shop.plan.toUpperCase()}</Badge>
                    </td>
                    <td>
                      <Badge type={shop.status === 'active' ? 'success' : 'warn'}>{shop.status.toUpperCase()}</Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost-sm"
                        >
                          View <Icons.ExternalLink />
                        </a>
                        <button className="btn-ghost-sm" onClick={() => navigate(`/stores/${shop.slug}`)}>
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shops.length === 0 && <EmptyState message="No active stores yet. Provision one to get started." />}
        </div>
      )}
    </>
  );
};
