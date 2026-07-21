import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { StatCard, Badge, EmptyState } from '@/components/ui/Shared';
import { MerchantTab, formatINR } from '@/utils';

interface OverviewPageProps {
  shopInfo: any;
  products: any[];
  orders: any[];
  onNavigate: (tab: MerchantTab) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ shopInfo, products, orders, onNavigate }) => {
  // Calculate start of 7 days ago (today - 6 days)
  const startOf7DaysAgo = new Date();
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);
  startOf7DaysAgo.setHours(0, 0, 0, 0);

  // Filter orders from the last 7 days
  const last7DaysOrders = orders.filter(o => new Date(o.created_at) >= startOf7DaysAgo);

  const last7DaysPaidOrders = last7DaysOrders.filter(o =>
    ['confirmed', 'completed', 'paid'].includes(o.status.toLowerCase())
  );
  const totalSales7Days = last7DaysPaidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders7Days = last7DaysOrders.length;

  const slug = shopInfo?.slug || 'store';
  const domain = shopInfo?.domains?.[0]?.domain || `${slug}.localhost:3001`;

  // Generate 7-day data points for chart
  const daysArray = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chartData = daysArray.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = orders.filter(o => {
      const oDate = new Date(o.created_at);
      return oDate >= dayStart && oDate <= dayEnd;
    });

    const daySales = dayOrders
      .filter(o => ['confirmed', 'completed', 'paid'].includes(o.status.toLowerCase()))
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    return {
      dateLabel: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      sales: daySales,
      ordersCount: dayOrders.length,
    };
  });

  const maxSales = Math.max(...chartData.map(d => d.sales), 100);

  return (
    <>
      {/* ── Compact Slim Dashboard Header ───────────────────────────── */}
      <header style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderLeft: '4px solid #10B981',
        borderRadius: '12px',
        padding: '14px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        {/* Left — inline compact identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Small avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '9px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {(shopInfo?.name || 'S').charAt(0).toUpperCase()}
          </div>

          {/* Title + subtitle inline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Store Overview
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#DCFCE7', border: '1px solid #A7F3D0', color: '#059669',
                fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: '20px', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 4px #10B981' }} />
                Live
              </span>
            </div>
            <p style={{ margin: '1px 0 0 0', fontSize: '0.76rem', color: '#94A3B8', fontWeight: 400 }}>
              {shopInfo?.name || 'Your Store'}&nbsp;·&nbsp;{domain}&nbsp;·&nbsp;
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Right — slim CTA */}
        <a
          href={`http://${domain}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontWeight: 700, fontSize: '0.78rem',
            borderRadius: '8px', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.45)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          View Storefront
        </a>
      </header>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <StatCard label="Total Sales (Last 7 Days)" value={formatINR(totalSales7Days)} icon={<Icons.Currency />} />
        <StatCard label="Total Orders (Last 7 Days)" value={totalOrders7Days} icon={<Icons.Clipboard />} type="indigo" onClick={() => onNavigate('orders')} />
        <StatCard label="Active Catalog" value={`${products.length} Products`} icon={<Icons.Package />} type="warn" onClick={() => onNavigate('products')} />
      </div>

      {/* Sales Trend Chart */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Sales &amp; Orders Trend (Last 7 Days)</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)', fontWeight: 500 }}>
            Active stats: {daysArray[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {daysArray[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div style={{ height: 260, position: 'relative', marginTop: 20 }}>
          {/* Y-axis Grid Lines */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 30 }}>
            {[4, 3, 2, 1, 0].map(i => {
              const val = (maxSales * i) / 4;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>
                  <span style={{ width: 70, textAlign: 'right', paddingRight: 10 }}>{formatINR(val)}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--m-border)' }} />
                </div>
              );
            })}
          </div>

          {/* Dynamic Graph Bars */}
          <div style={{ position: 'absolute', left: 70, right: 0, top: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 30 }}>
            {chartData.map((d, i) => {
              const heightPercent = (d.sales / maxSales) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  
                  {/* Tooltip on Hover */}
                  <div className="chart-tooltip" style={{
                    position: 'absolute',
                    bottom: `${heightPercent + 10}%`,
                    background: 'var(--m-text-main)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    zIndex: 10,
                    boxShadow: 'var(--m-shadow-lg)'
                  }}>
                    <strong>{formatINR(d.sales)}</strong> ({d.ordersCount} orders)
                  </div>
                  
                  {/* Bar */}
                  <div 
                    style={{
                      width: '36%',
                      height: `${heightPercent}%`,
                      minHeight: d.sales > 0 ? 4 : 0,
                      background: 'linear-gradient(180deg, var(--m-primary) 0%, #059669 100%)',
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    className="chart-bar"
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.previousSibling as HTMLDivElement;
                      if (tooltip) tooltip.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.currentTarget.previousSibling as HTMLDivElement;
                      if (tooltip) tooltip.style.opacity = '0';
                    }}
                  />

                  {/* Date Label */}
                  <span style={{ position: 'absolute', bottom: -24, fontSize: '0.75rem', color: 'var(--m-text-muted)', whiteSpace: 'nowrap' }}>
                    {d.dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
                  {orders.slice(0, 7).map(order => (
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
