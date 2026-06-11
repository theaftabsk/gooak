import React from 'react';
import { Icons } from '../../icons';
import { StatCard, Badge, EmptyState } from '../../shared';
import { MerchantTab, formatINR } from '../../utils';

interface OverviewPageProps {
  shopInfo: any;
  products: any[];
  orders: any[];
  onNavigate: (tab: MerchantTab) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ shopInfo, products, orders, onNavigate }) => {
  // Calculate total sales from confirmed/paid/completed orders
  const paidOrders = orders.filter(o => ['confirmed', 'completed', 'paid'].includes(o.status.toLowerCase()));
  const totalSales = paidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const slug = shopInfo?.slug || 'store';
  const domain = shopInfo?.domains?.[0]?.domain || `${slug}.localhost:3000`;

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Store Overview</h2>
          <p className="header-sub">Manage your brand storefront and track analytics</p>
        </div>
        <a href={`http://${domain}`} target="_blank" rel="noreferrer" className="btn-primary">
          <Icons.Globe /> View Storefront
        </a>
      </header>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <StatCard label="Total Sales" value={formatINR(totalSales)} icon={<Icons.Currency />} />
        <StatCard label="Total Orders" value={orders.length} icon={<Icons.Clipboard />} type="indigo" onClick={() => onNavigate('orders')} />
        <StatCard label="Active Catalog" value={`${products.length} Products`} icon={<Icons.Package />} type="warn" onClick={() => onNavigate('products')} />
        <StatCard label="SaaS Plan" value={(shopInfo?.plan || 'starter').toUpperCase()} icon={<Icons.ShieldCheck />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Orders</h3>
            <button className="btn-ghost-sm" onClick={() => onNavigate('orders')}>
              View All Orders <Icons.ArrowRight />
            </button>
          </div>
          {orders.length === 0 ? (
            <EmptyState message="No orders received yet." />
          ) : (
            <div className="db-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td><strong>#{order.order_number}</strong></td>
                      <td>{formatINR(order.total)}</td>
                      <td>
                        <Badge type={
                          order.status === 'confirmed' || order.status === 'completed' ? 'success' :
                          order.status === 'pending' ? 'warn' :
                          order.status === 'cancelled' ? 'danger' : 'info'
                        }>
                          {order.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Store Profile Card */}
        <div className="card">
          <h3 className="card-title">Brand Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--m-border)' }}>
              <div style={{
                background: 'var(--m-primary-light)',
                color: 'var(--m-primary)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1.25rem'
              }}>
                {shopInfo?.name?.[0] || 'S'}
              </div>
              <div>
                <strong>{shopInfo?.name}</strong>
                <span className="sidebar-brand-sub">{domain}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--m-text-muted)', lineHeight: 1.6 }}>
              {shopInfo?.description || 'No store description provided yet. Update it in settings to customize your store branding.'}
            </div>
            <button className="btn-ghost-sm" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => onNavigate('settings')}>
              <Icons.Settings /> Edit Settings
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

