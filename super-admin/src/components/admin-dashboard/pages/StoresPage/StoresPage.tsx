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
        <div className="stores-grid">
          {shops.map(shop => {
            const domain = shop.domains?.[0]?.domain || storeDomainLabel(shop.slug);
            const href = shop.domains?.[0]?.domain ? `https://${shop.domains[0].domain}` : storeUrl(shop.slug);
            return (
              <div key={shop.id} className="store-card" onClick={() => navigate(`/stores/${shop.slug}`)}>
                <div className="store-card-header">
                  <div className="store-avatar lg">{shop.name[0]}</div>
                  <div className="store-card-badges">
                    <Badge type={shop.plan === 'pro' ? 'pro' : 'default'}>{shop.plan.toUpperCase()}</Badge>
                    <Badge type={shop.status === 'active' ? 'success' : 'warn'}>{shop.status.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="store-card-body">
                  <h3>{shop.name}</h3>
                  <p className="muted">{domain}</p>
                  {shop.owner && <p className="muted small">{shop.owner.name} · {shop.owner.email}</p>}
                </div>
                <div className="store-card-footer">
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="btn-ghost-sm"
                  >
                    View <Icons.ExternalLink />
                  </a>
                  <button className="btn-ghost-sm" onClick={e => { e.stopPropagation(); navigate(`/stores/${shop.slug}`); }}>
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
          {shops.length === 0 && <EmptyState message="No active stores yet. Provision one to get started." />}
        </div>
      )}
    </>
  );
};
