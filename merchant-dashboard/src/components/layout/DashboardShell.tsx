'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/Icons';
import { MerchantStyles } from '@/styles/merchant';
import { FullScreenSpinner } from '@/components/ui/Shared';
import { DashboardDataProvider, useDashboardData } from '@/context/DashboardData';

function getTenantSlug(): string {
  if (typeof window === 'undefined') return 'testShop';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const isMain = parts[0] === 'app' || hostname === 'localhost' || hostname === '127.0.0.1' || parts.length < 2;
  if (!isMain) return parts[0];
  const params = new URLSearchParams(window.location.search);
  const q = params.get('shop') || params.get('tenant');
  if (q) { localStorage.setItem('oaksol_active_shop_slug', q); return q; }
  return localStorage.getItem('oaksol_active_shop_slug') || 'testShop';
}

export function DashboardShellWrapper({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState('testShop');
  useEffect(() => { setTenantSlug(getTenantSlug()); }, []);
  return (
    <DashboardDataProvider tenantSlug={tenantSlug}>
      <DashboardShell tenantSlug={tenantSlug}>{children}</DashboardShell>
    </DashboardDataProvider>
  );
}

function DashboardShell({ children, tenantSlug }: { children: React.ReactNode; tenantSlug: string }) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '';
  const { shopInfo } = useDashboardData();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    catalog: true, orders: true, customers: false, content: false,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(`oaksol_merchant_logged_in_${tenantSlug}`) === 'true');
    setIsSidebarCollapsed(localStorage.getItem('oaksol_sidebar_collapsed') === 'true');
    setAuthChecked(true);
  }, [tenantSlug]);

  useEffect(() => {
    if (['/products', '/categories', '/brands', '/collections', '/inventory'].some(p => pathname.startsWith(p)))
      setExpandedGroups(g => ({ ...g, catalog: true }));
    if (['/orders', '/returns', '/invoices'].some(p => pathname.startsWith(p)))
      setExpandedGroups(g => ({ ...g, orders: true }));
    if (['/customers', '/groups', '/reviews'].some(p => pathname.startsWith(p)))
      setExpandedGroups(g => ({ ...g, customers: true }));
    if (['/pages', '/blog', '/media', '/faq', '/testimonials'].some(p => pathname.startsWith(p)))
      setExpandedGroups(g => ({ ...g, content: true }));
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('oaksol_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      localStorage.setItem('oaksol_sidebar_collapsed', 'false');
      setExpandedGroups(g => ({ ...g, [group]: true }));
    } else {
      setExpandedGroups(g => ({ ...g, [group]: !g[group] }));
    }
  };

  const handleLogin = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) { setLoginError('Email and password are required.'); return; }
    localStorage.setItem('oaksol_active_shop_slug', tenantSlug);
    localStorage.setItem(`oaksol_merchant_logged_in_${tenantSlug}`, 'true');
    localStorage.setItem(`oaksol_merchant_email_${tenantSlug}`, email);
    setIsLoggedIn(true);
    router.push('/');
  };

  const handleLogout = () => {
    localStorage.removeItem(`oaksol_merchant_logged_in_${tenantSlug}`);
    setIsLoggedIn(false);
    router.push('/');
  };

  const merchantEmail =
    shopInfo?.owner?.email ||
    (typeof window !== 'undefined' ? localStorage.getItem(`oaksol_merchant_email_${tenantSlug}`) : null) ||
    '';

  const isActive = (href: string): boolean => {
    const path = href.split('?')[0];
    return path === '/'
      ? pathname === '/'
      : pathname === path || pathname.startsWith(path + '/');
  };

  const isGroupActive = (paths: string[]): boolean => paths.some(p => pathname.startsWith(p));

  if (!authChecked) return <FullScreenSpinner />;

  if (!isLoggedIn) {
    return (
      <div className="merchant-app">
        <MerchantStyles />
        <div className="auth-screen">
          <div className="auth-card">
            <div className="auth-brand">
              <div className="auth-logo"><Icons.Store /></div>
              <h2>Merchant Console</h2>
              <p>Merchant Portal · Store Administration Console</p>
            </div>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="field-group">
                <label>Merchant Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="owner@domain.com"
                  required
                  autoFocus
                />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {loginError && <div className="auth-error">{loginError}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <Icons.Lock /> Login to Store Admin
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const navGroups: Array<{ key: string; label: string; icon: React.ReactNode; paths: string[]; items: [string, string][] }> = [
    {
      key: 'catalog',
      label: 'Catalog',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      paths: ['/products', '/categories', '/brands', '/collections', '/inventory'],
      items: [['products','Products'],['categories','Categories'],['brands','Brands'],['collections','Collections'],['inventory','Inventory']],
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: <Icons.Clipboard />,
      paths: ['/orders', '/returns', '/invoices'],
      items: [['orders','Orders'],['returns','Returns'],['invoices','Invoices']],
    },
    {
      key: 'customers',
      label: 'Customers',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      paths: ['/customers', '/groups', '/reviews'],
      items: [['customers','Customers'],['groups','Groups'],['reviews','Reviews']],
    },
    {
      key: 'content',
      label: 'Content',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
      paths: ['/pages', '/blog', '/media', '/faq', '/testimonials'],
      items: [['pages','Pages'],['blog','Blog'],['media','Media Library'],['faq','FAQ'],['testimonials','Testimonials']],
    },
  ];

  const topLinks: [string, string, React.ReactNode][] = [
    ['/customize', 'Customize', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>],
    ['/analytics', 'Analytics', <Icons.BarChart />],
    ['/payments', 'Payments', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>],
    ['/settings', 'Settings', <Icons.Settings />],
    ['/team', 'Team', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>],
    ['/apps', 'Apps', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>],
  ];

  return (
    <div className="merchant-app">
      <MerchantStyles />
      <div className={`dashboard-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isSidebarCollapsed ? 'Expand' : 'Collapse'}>
            {isSidebarCollapsed ? <Icons.ArrowRight /> : <Icons.ArrowLeft />}
          </button>

          <div className="sidebar-content">
            <div className="sidebar-brand">
              <div className="sidebar-brand-top">
                <div className="sidebar-logo"><Icons.Store /></div>
                <div className="sidebar-brand-meta">
                  <h3>{shopInfo?.name || tenantSlug.toUpperCase()}</h3>
                  <span className="sidebar-brand-sub">Merchant Console</span>
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              <Link href="/" className={isActive('/') ? 'active' : ''} title="Dashboard">
                <Icons.Dashboard /><span className="sidebar-nav-item-text">Dashboard</span>
              </Link>

              {navGroups.map(group => (
                <div key={group.key} className="sidebar-group">
                  <div
                    className={`sidebar-group-header ${isGroupActive(group.paths) ? 'parent-active' : ''}`}
                    onClick={() => toggleGroup(group.key)}
                    title={group.label}
                  >
                    {group.icon}
                    <span className="sidebar-nav-item-text" style={{ marginLeft: 10 }}>{group.label}</span>
                    <span className="sidebar-group-chevron">
                      {expandedGroups[group.key] ? <ChevronDown /> : <ChevronRight />}
                    </span>
                  </div>
                  {expandedGroups[group.key] && !isSidebarCollapsed && (
                    <div className="sidebar-group-children">
                      {group.items.map(([slug, label]) => (
                        <Link key={slug} href={`/${slug}`} className={isActive(`/${slug}`) ? 'active' : ''} title={label}>
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {topLinks.map(([href, label, icon]) => (
                <Link key={href} href={href} className={isActive(href) ? 'active' : ''} title={label}>
                  {icon}<span className="sidebar-nav-item-text">{label}</span>
                </Link>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-profile">
                <div className="sidebar-avatar">{merchantEmail ? merchantEmail.charAt(0).toUpperCase() : '?'}</div>
                <div className="sidebar-profile-info">
                  <span className="sidebar-profile-name">{shopInfo?.owner?.name || 'Shop Owner'}</span>
                  <span className="sidebar-profile-role" title={merchantEmail}>
                    {merchantEmail ? (merchantEmail.length > 22 ? `${merchantEmail.substring(0, 19)}…` : merchantEmail) : 'Loading…'}
                  </span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <Icons.Logout /><span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

function ChevronDown() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function ChevronRight() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
