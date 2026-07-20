import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { StatCard, Badge, EmptyState } from '@/components/ui/Shared';
import { formatINR } from '@/utils';
import { merchantApi } from '@/lib/api-client';

interface AnalyticsPageProps {
  products: any[];
  orders: any[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ products, orders }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await merchantApi.getCustomers();
        setCustomers(data || []);
      } catch (err) {
        console.error('Error fetching customers in analytics:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Filter orders by payment status / success state
  const paidOrders = orders.filter(o =>
    ['confirmed', 'completed', 'paid'].includes(o.status?.toLowerCase())
  );

  // Revenue calculation
  const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const totalOrders = orders.length;
  const aov = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  
  // Calculate average items per order
  const totalItems = orders.reduce((sum, o) => {
    const items = o.items || [];
    return sum + items.reduce((subSum: number, item: any) => subSum + (item.qty || 1), 0);
  }, 0);
  const itemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

  // Order status distribution
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    const status = o.status?.toLowerCase() || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusLabels = {
    pending: 'Pending Approval',
    confirmed: 'Confirmed',
    dispatched: 'Dispatched',
    completed: 'Delivered / Completed',
    cancelled: 'Cancelled',
  } as Record<string, string>;

  // Top Selling Products calculation
  const productSalesMap = new Map<string, { name: string; qty: number; sales: number }>();
  orders.forEach(o => {
    if (['confirmed', 'completed', 'paid'].includes(o.status?.toLowerCase())) {
      const items = o.items || [];
      items.forEach((item: any) => {
        const prodName = item.product_name || item.variant?.product?.name || 'Unknown Product';
        const qty = item.qty || 1;
        const price = parseFloat(item.price || 0);
        const existing = productSalesMap.get(prodName) || { name: prodName, qty: 0, sales: 0 };
        productSalesMap.set(prodName, {
          name: prodName,
          qty: existing.qty + qty,
          sales: existing.sales + (qty * price),
        });
      });
    }
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Chart data calculations
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
      .filter(o => ['confirmed', 'completed', 'paid'].includes(o.status?.toLowerCase()))
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    return {
      label: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
      sales: daySales,
      count: dayOrders.length,
    };
  });

  const maxSales = Math.max(...chartData.map(d => d.sales), 100);

  // Conversion funnel metrics (simulated based on conversion rate of orders)
  const simulatedVisits = totalOrders * 48 || 1200;
  const simulatedCartAdds = Math.round(simulatedVisits * 0.12) || 150;
  const simulatedCheckouts = Math.round(simulatedVisits * 0.045) || 54;
  const conversionRate = simulatedVisits > 0 ? (totalOrders / simulatedVisits) * 100 : 0;

  return (
    <>
      <header className="page-header">
        <div>
          <h2>Performance Analytics</h2>
          <p className="header-sub">Track store metrics, customer conversions, and sales charts</p>
        </div>
      </header>

      {/* Primary stats row */}
      <div className="metrics-grid" style={{ marginBottom: 30 }}>
        <StatCard label="Lifetime Revenue" value={formatINR(totalRevenue)} icon={<Icons.Currency />} />
        <StatCard label="AOV (Avg Order Value)" value={formatINR(aov)} icon={<Icons.BarChart />} type="indigo" />
        <StatCard label="Total Orders" value={totalOrders} icon={<Icons.Clipboard />} type="warn" />
        <StatCard label="Registered Customers" value={loadingCustomers ? '...' : customers.length} icon={<Icons.User />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {/* Sales trend chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Revenue Trend (Last 7 Days)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--m-text-muted)', fontWeight: 500 }}>
              {daysArray[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {daysArray[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div style={{ height: 260, position: 'relative', marginTop: 20 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 30 }}>
              {[4, 3, 2, 1, 0].map(i => {
                const val = (maxSales * i) / 4;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: '0.75rem', color: 'var(--m-text-muted)' }}>
                    <span style={{ width: 75, textAlign: 'right', paddingRight: 10 }}>{formatINR(val)}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--m-border)' }} />
                  </div>
                );
              })}
            </div>

            <div style={{ position: 'absolute', left: 75, right: 0, top: 0, bottom: 30, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', zIndex: 10 }}>
              {chartData.map((d, i) => {
                const pct = (d.sales / maxSales) * 100;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <div className="chart-bar-tooltip" style={{
                        position: 'absolute', bottom: 'calc(100% + 5px)', background: 'var(--m-text-main, #0f172a)', color: '#ffffff',
                        padding: '3px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, pointerEvents: 'none', whiteSpace: 'nowrap', opacity: 0, transition: 'opacity 0.15s'
                      }}>
                        {formatINR(d.sales)}
                      </div>
                      <div style={{
                        width: 24, height: `${Math.max(pct, 4)}%`, background: 'var(--m-accent, #15803d)', borderTopLeftRadius: 4, borderTopRightRadius: 4,
                        transition: 'height 0.5s ease-out', cursor: 'pointer'
                      }}
                      onMouseEnter={e => {
                        const tooltip = e.currentTarget.previousSibling as HTMLElement;
                        if (tooltip) tooltip.style.opacity = '1';
                      }}
                      onMouseLeave={e => {
                        const tooltip = e.currentTarget.previousSibling as HTMLElement;
                        if (tooltip) tooltip.style.opacity = '0';
                      }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ position: 'absolute', left: 75, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-around', height: 25, alignItems: 'center' }}>
              {chartData.map((d, i) => (
                <span key={i} style={{ fontSize: '0.75rem', color: 'var(--m-text-muted)', width: '12%', textAlign: 'center', fontWeight: 500 }}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Conversion Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            {/* Step 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-normal)', marginBottom: 5 }}>
                <span>Store Visits</span>
                <span>{simulatedVisits}</span>
              </div>
              <div style={{ height: 8, background: 'var(--m-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--m-text-muted)', width: '100%' }} />
              </div>
            </div>
            {/* Step 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-normal)', marginBottom: 5 }}>
                <span>Added to Cart</span>
                <span>{simulatedCartAdds} (12%)</span>
              </div>
              <div style={{ height: 8, background: 'var(--m-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#3B82F6', width: '12%' }} />
              </div>
            </div>
            {/* Step 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-normal)', marginBottom: 5 }}>
                <span>Initiated Checkout</span>
                <span>{simulatedCheckouts} (4.5%)</span>
              </div>
              <div style={{ height: 8, background: 'var(--m-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#F59E0B', width: '4.5%' }} />
              </div>
            </div>
            {/* Step 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--m-text-normal)', marginBottom: 5 }}>
                <span>Completed Purchase</span>
                <span>{totalOrders} ({conversionRate.toFixed(1)}%)</span>
              </div>
              <div style={{ height: 8, background: 'var(--m-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--m-accent)', width: `${Math.max(conversionRate, 0.5)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
        {/* Top Products Table */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 15 }}>Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <EmptyState message="No sales data recorded to determine top products." />
          ) : (
            <div className="db-table-container">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--m-text-main)' }}>{p.name}</td>
                      <td>{p.qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(p.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Status & Operations */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 15 }}>Order Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const label = statusLabels[status] || status.toUpperCase();
              const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--m-bg2)', border: '1px solid var(--m-border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--m-text-main)' }}>{label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--m-text-muted)' }}>{count} {count === 1 ? 'order' : 'orders'} ({pct.toFixed(0)}%)</span>
                  </div>
                  <Badge type={status === 'completed' || status === 'confirmed' ? 'success' : status === 'cancelled' ? 'danger' : 'warn'}>
                    {status.toUpperCase()}
                  </Badge>
                </div>
              );
            })}
            {orders.length === 0 && <EmptyState message="No orders present to compute distribution." />}
          </div>
        </div>
      </div>
    </>
  );
};
