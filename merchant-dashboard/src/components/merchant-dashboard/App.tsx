import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { catalogApi } from '@oaksol/api-client';
import { Icons } from './icons';
import { MerchantStyles } from './styles';
import { LoadingSpinner } from './shared';
import { MerchantTab } from './utils';

// Subpages
import { OverviewPage } from './pages/OverviewPage/index';
import { ProductsPage } from './pages/ProductsPage/index';
import { AddProductPage } from './pages/AddProductPage/index';
import { ProductDetailPage } from './pages/ProductDetailPage/index';
import { CategoriesPage } from './pages/CategoriesPage/index';
import { OrdersPage } from './pages/OrdersPage/index';
import { OrderDetailPage } from './pages/OrderDetailPage/index';
import { InventoryPage } from './pages/InventoryPage/index';
import { ReturnsPage } from './pages/ReturnsPage/index';
import { SettingsPage } from './pages/SettingsPage/index';
import { PagesPage } from './pages/PagesPage/index';
import { BannerPage } from './pages/BannerPage/index';
import { BlogPage } from './pages/BlogPage/index';
import { MediaLibraryPage } from './pages/MediaLibraryPage/index';
import { FaqPage } from './pages/FaqPage/index';
import { TestimonialsPage } from './pages/TestimonialsPage/index';
import { HomeSectionsPage } from './pages/HomeSectionsPage/index';
import { PaymentPage } from './pages/PaymentPage/index';

// Reusable premium placeholder page for features integrated/coming-soon
function PlaceholderPage({ tabName, parentName, description }: { tabName: string; parentName?: string; description: string }) {
  return (
    <>
      <header className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--m-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>{parentName || 'Dashboard'}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--m-border)', margin: '0 2px' }}>/</span>
            <span style={{ color: 'var(--m-primary)', fontWeight: 600 }}>{tabName}</span>
          </div>
          <h2>{tabName}</h2>
          <p className="header-sub">Manage and monitor {tabName.toLowerCase()} settings for your storefront</p>
        </div>
      </header>

      <div className="card" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '80px 40px', 
        textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid var(--m-border)',
        borderRadius: '12px',
        boxShadow: 'var(--m-shadow)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          color: 'var(--m-primary)',
          background: 'var(--m-primary-light)',
          padding: '24px',
          borderRadius: '50%',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--m-text-main)', marginBottom: '8px' }}>
          {tabName} Module
        </h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--m-text-muted)', maxWidth: '500px', lineHeight: '1.6', marginBottom: '24px' }}>
          {description}
        </p>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--m-primary)',
          background: 'var(--m-primary-light)',
          padding: '6px 16px',
          borderRadius: '100px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Integration Scheduled
        </span>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MerchantDashboardInner />
    </BrowserRouter>
  );
}

function MerchantDashboardInner() {
  // Extract Tenant Context from Subdomain / URL query / LocalStorage
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const parts = hostname.split('.');
  const isMainPlatform = parts[0] === 'app' || hostname === 'localhost' || hostname === '127.0.0.1' || parts.length < 2;
  
  let resolvedTenant = 'testShop';
  if (!isMainPlatform) {
    resolvedTenant = parts[0];
  } else if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const shopQuery = params.get('shop') || params.get('tenant');
    if (shopQuery) {
      resolvedTenant = shopQuery;
      localStorage.setItem('oaksol_active_shop_slug', shopQuery);
    } else {
      const savedShop = localStorage.getItem('oaksol_active_shop_slug');
      if (savedShop) {
        resolvedTenant = savedShop;
      }
    }
  }
  const tenantSlug = resolvedTenant;


  const navigate = useNavigate();
  const location = useLocation();

  // Paths mapping to tabs
  const getTabFromPath = (path: string): MerchantTab => {
    if (path.includes('/products/')) return 'products';
    if (path.endsWith('/products')) return 'products';
    if (path.endsWith('/categories')) return 'categories';
    if (path.includes('/orders/')) return 'orders';
    if (path.endsWith('/orders')) return 'orders';
    if (path.endsWith('/inventory')) return 'inventory';
    if (path.endsWith('/payments')) return 'payments';
    if (path.endsWith('/settings')) return 'settings';
    if (path.endsWith('/pages')) return 'pages';

    if (path.endsWith('/returns')) return 'returns';
    if (path.endsWith('/invoices')) return 'invoices';
    if (path.endsWith('/customers')) return 'customers';
    if (path.endsWith('/groups')) return 'groups';
    if (path.endsWith('/reviews')) return 'reviews';
    if (path.endsWith('/discounts')) return 'discounts';
    if (path.endsWith('/email')) return 'email';
    if (path.endsWith('/whatsapp')) return 'whatsapp';
    if (path.endsWith('/seo')) return 'seo';
    if (path.endsWith('/banners')) return 'banners';
    if (path.endsWith('/blog')) return 'blog';
    if (path.endsWith('/media')) return 'media';
    if (path.endsWith('/faq')) return 'faq';
    if (path.endsWith('/testimonials')) return 'testimonials';
    if (path.endsWith('/home-sections')) return 'home-sections';
    if (path.endsWith('/analytics')) return 'analytics';
    if (path.endsWith('/team')) return 'team';
    if (path.endsWith('/apps')) return 'apps';

    return 'overview';
  };

  const currentTab = getTabFromPath(location.pathname);
  
  // Extract selected product ID if on details subpage
  const productIdMatch = location.pathname.match(/\/products\/([a-f0-9-]{36})$/i);
  const selectedProductId = productIdMatch ? productIdMatch[1] : null;
  const isNewProductPath = location.pathname.endsWith('/products/new');

  // Extract selected order ID if on details subpage
  const orderIdMatch = location.pathname.match(/\/orders\/([a-f0-9-]{36})$/i);
  const selectedOrderId = orderIdMatch ? orderIdMatch[1] : null;

  const setCurrentTab = (tab: MerchantTab) => {
    const base = '/dashboard';
    if (tab === 'overview') {
      navigate(`${base}`);
    } else {
      navigate(`${base}/${tab}`);
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem(`oaksol_merchant_logged_in_${tenantSlug}`) === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('oaksol_sidebar_collapsed') === 'true' : false;
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    catalog: true,
    orders: true,
    customers: false,
    content: false,
  });

  useEffect(() => {
    if (['products', 'categories', 'inventory'].includes(currentTab)) {
      setExpandedGroups(prev => ({ ...prev, catalog: true }));
    }
    if (['orders', 'returns', 'invoices'].includes(currentTab)) {
      setExpandedGroups(prev => ({ ...prev, orders: true }));
    }
    if (['customers', 'groups', 'reviews'].includes(currentTab)) {
      setExpandedGroups(prev => ({ ...prev, customers: true }));
    }

    if (['pages', 'banners', 'blog', 'media', 'faq', 'testimonials', 'home-sections'].includes(currentTab)) {
      setExpandedGroups(prev => ({ ...prev, content: true }));
    }
  }, [currentTab]);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    } else if (location.pathname.startsWith('/admin')) {
      const rest = location.pathname.substring(6); // remove '/admin'
      navigate('/dashboard' + rest, { replace: true });
    } else if (location.pathname.endsWith('/brands') || location.pathname.endsWith('/collections')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleGroupHeaderClick = (group: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      localStorage.setItem('oaksol_sidebar_collapsed', 'false');
      setExpandedGroups(prev => ({ ...prev, [group]: true }));
    } else {
      setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const merchantEmail = typeof window !== 'undefined' ? localStorage.getItem(`oaksol_merchant_email_${tenantSlug}`) || 'admin@oaksol.in' : 'admin@oaksol.in';

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('oaksol_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Shop & Dashboard Data
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [orders, setOrders] = useState<any[]>([]);

  // Loaders
  const [loading, setLoading] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Email and Password are required.');
      return;
    }
    setLoginError('');
    try {
      localStorage.setItem('oaksol_active_shop_slug', tenantSlug);
      localStorage.setItem(`oaksol_merchant_logged_in_${tenantSlug}`, 'true');
      localStorage.setItem(`oaksol_merchant_email_${tenantSlug}`, email);
      window.location.reload();
    } catch (err: any) {
      setLoginError('Login failed.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setCurrentTab('overview');
    localStorage.removeItem(`oaksol_merchant_logged_in_${tenantSlug}`);
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch homepage details (includes shop metadata info)
      const homeData = await catalogApi.getHomepage();
      setShopInfo(homeData.shop || { name: tenantSlug.toUpperCase(), slug: tenantSlug });

      // 2. Fetch products
      const prods = await catalogApi.getProducts();
      setProducts(prods?.products || prods || []);

      // 3. Fetch categories
      const cats = await catalogApi.getCategories();
      setCategories(cats || []);

      // 4. Fetch brands
      try {
        const brs = await catalogApi.getBrands();
        setBrands(brs || []);
      } catch {
        setBrands([]);
      }

      // 5. Fetch orders
      try {
        const ords = await catalogApi.getOrders();
        setOrders(ords || []);
      } catch (err) {
        console.warn('Failed to load orders (endpoint might be restricted or empty):', err);
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn]);

  // Mutations
  const handleCreateProduct = async (prodData: any) => {
    setCreatingProduct(true);
    try {
      await catalogApi.createProduct(prodData);
      alert('Product published successfully!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish product');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setDeletingProduct(true);
    try {
      await catalogApi.deleteProduct(id);
      alert('Product deleted successfully');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleCreateCategory = async (catData: any) => {
    setCreatingCategory(true);
    try {
      await catalogApi.createCategory(catData);
      alert('Category added successfully!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategory(true);
    try {
      await catalogApi.deleteCategory(id);
      alert('Category deleted successfully');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleUpdateCategory = async (id: string, catData: any) => {
    try {
      await catalogApi.updateCategory(id, catData);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };



  const handleUpdateOrderStatus = async (id: string, status: string, note?: string) => {
    setUpdatingOrderStatus(true);
    try {
      await catalogApi.updateOrderStatus(id, status, note);
      alert('Order status updated!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handleSaveSettings = async (settingsData: any) => {
    setSavingSettings(true);
    try {
      await catalogApi.updateMerchantSettings(settingsData);
      alert('Store settings saved successfully!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to save store settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Auth Screen Render
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
            <form onSubmit={handleLoginSubmit} className="auth-form">
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

  return (
    <div className="merchant-app">
      <MerchantStyles />
      <div className={`dashboard-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
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
              <div className="sidebar-active-store-container">
                <label className="sidebar-active-store-label">Active Store</label>
                <div className="sidebar-active-store-box">
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', width: '14px', height: '14px', flexShrink: 0 }}>
                    <Icons.Store />
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shopInfo?.name || tenantSlug.toUpperCase()} ({tenantSlug})
                  </span>
                </div>
              </div>
            </div>
            <nav className="sidebar-nav">
              {/* Dashboard */}
              <span className={currentTab === 'overview' ? 'active' : ''} onClick={() => setCurrentTab('overview')} title="Dashboard">
                <Icons.Dashboard />
                <span className="sidebar-nav-item-text">Dashboard</span>
              </span>

              {/* Catalog Folder */}
              <div className="sidebar-group">
                <div 
                  className={`sidebar-group-header ${['products', 'categories', 'brands', 'collections', 'inventory'].includes(currentTab) ? 'parent-active' : ''}`}
                  onClick={() => handleGroupHeaderClick('catalog')}
                  title="Catalog"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span className="sidebar-nav-item-text" style={{ marginLeft: 10 }}>Catalog</span>
                  <span className="sidebar-group-chevron">
                    {expandedGroups.catalog ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </span>
                </div>
                {expandedGroups.catalog && !isSidebarCollapsed && (
                  <div className="sidebar-group-children">
                    <span className={currentTab === 'products' ? 'active' : ''} onClick={() => setCurrentTab('products')} title="Products">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Products</span>
                    </span>
                    <span className={currentTab === 'categories' ? 'active' : ''} onClick={() => setCurrentTab('categories')} title="Categories">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Categories</span>
                    </span>
                    <span className={currentTab === 'inventory' ? 'active' : ''} onClick={() => setCurrentTab('inventory')} title="Inventory">
                      <span className="sidebar-tree-indent">└</span>
                      <span className="sidebar-nav-item-text">Inventory</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Orders Folder */}
              <div className="sidebar-group">
                <div 
                  className={`sidebar-group-header ${['orders', 'returns', 'invoices'].includes(currentTab) ? 'parent-active' : ''}`}
                  onClick={() => handleGroupHeaderClick('orders')}
                  title="Orders"
                >
                  <Icons.Clipboard />
                  <span className="sidebar-nav-item-text" style={{ marginLeft: 10 }}>Orders</span>
                  {orders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="sidebar-badge">
                      {orders.filter(o => o.status === 'pending').length}
                    </span>
                  )}
                  <span className="sidebar-group-chevron">
                    {expandedGroups.orders ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </span>
                </div>
                {expandedGroups.orders && !isSidebarCollapsed && (
                  <div className="sidebar-group-children">
                    <span className={currentTab === 'orders' ? 'active' : ''} onClick={() => setCurrentTab('orders')} title="Orders">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Orders</span>
                      {orders.filter(o => o.status === 'pending').length > 0 && (
                        <span className="sidebar-badge">
                          {orders.filter(o => o.status === 'pending').length}
                        </span>
                      )}
                    </span>
                    <span className={currentTab === 'returns' ? 'active' : ''} onClick={() => setCurrentTab('returns')} title="Returns">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Returns</span>
                    </span>
                    <span className={currentTab === 'invoices' ? 'active' : ''} onClick={() => setCurrentTab('invoices')} title="Invoices">
                      <span className="sidebar-tree-indent">└</span>
                      <span className="sidebar-nav-item-text">Invoices</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Customers Folder */}
              <div className="sidebar-group">
                <div 
                  className={`sidebar-group-header ${['customers', 'groups', 'reviews'].includes(currentTab) ? 'parent-active' : ''}`}
                  onClick={() => handleGroupHeaderClick('customers')}
                  title="Customers"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span className="sidebar-nav-item-text" style={{ marginLeft: 10 }}>Customers</span>
                  <span className="sidebar-group-chevron">
                    {expandedGroups.customers ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </span>
                </div>
                {expandedGroups.customers && !isSidebarCollapsed && (
                  <div className="sidebar-group-children">
                    <span className={currentTab === 'customers' ? 'active' : ''} onClick={() => setCurrentTab('customers')} title="Customers">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Customers</span>
                    </span>
                    <span className={currentTab === 'groups' ? 'active' : ''} onClick={() => setCurrentTab('groups')} title="Groups">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Groups</span>
                    </span>
                    <span className={currentTab === 'reviews' ? 'active' : ''} onClick={() => setCurrentTab('reviews')} title="Reviews">
                      <span className="sidebar-tree-indent">└</span>
                      <span className="sidebar-nav-item-text">Reviews</span>
                    </span>
                  </div>
                )}
              </div>


              {/* Content Folder */}
              <div className="sidebar-group">
                <div 
                  className={`sidebar-group-header ${['pages', 'banners', 'blog', 'media', 'faq', 'testimonials', 'home-sections'].includes(currentTab) ? 'parent-active' : ''}`}
                  onClick={() => handleGroupHeaderClick('content')}
                  title="Content"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  <span className="sidebar-nav-item-text" style={{ marginLeft: 10 }}>Content</span>
                  <span className="sidebar-group-chevron">
                    {expandedGroups.content ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </span>
                </div>
                {expandedGroups.content && !isSidebarCollapsed && (
                  <div className="sidebar-group-children">
                    <span className={currentTab === 'pages' ? 'active' : ''} onClick={() => setCurrentTab('pages')} title="Pages">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Pages</span>
                    </span>
                    <span className={currentTab === 'banners' ? 'active' : ''} onClick={() => setCurrentTab('banners')} title="Banners">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Banners</span>
                    </span>
                    <span className={currentTab === 'blog' ? 'active' : ''} onClick={() => setCurrentTab('blog')} title="Blog">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Blog</span>
                    </span>
                    <span className={currentTab === 'media' ? 'active' : ''} onClick={() => setCurrentTab('media')} title="Media Library">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Media Library</span>
                    </span>
                    <span className={currentTab === 'faq' ? 'active' : ''} onClick={() => setCurrentTab('faq')} title="FAQ">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">FAQ</span>
                    </span>
                    <span className={currentTab === 'testimonials' ? 'active' : ''} onClick={() => setCurrentTab('testimonials')} title="Testimonials">
                      <span className="sidebar-tree-indent">├</span>
                      <span className="sidebar-nav-item-text">Testimonials</span>
                    </span>
                    <span className={currentTab === 'home-sections' ? 'active' : ''} onClick={() => setCurrentTab('home-sections')} title="Home Sections">
                      <span className="sidebar-tree-indent">└</span>
                      <span className="sidebar-nav-item-text">Home Sections</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Analytics */}
              <span className={currentTab === 'analytics' ? 'active' : ''} onClick={() => setCurrentTab('analytics')} title="Analytics">
                <Icons.BarChart />
                <span className="sidebar-nav-item-text">Analytics</span>
              </span>

              {/* Payments */}
              <span className={currentTab === 'payments' ? 'active' : ''} onClick={() => setCurrentTab('payments')} title="Payments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span className="sidebar-nav-item-text">Payments</span>
              </span>

              {/* Settings */}
              <span className={currentTab === 'settings' ? 'active' : ''} onClick={() => setCurrentTab('settings')} title="Settings">
                <Icons.Settings />
                <span className="sidebar-nav-item-text">Settings</span>
              </span>

              {/* Team */}
              <span className={currentTab === 'team' ? 'active' : ''} onClick={() => setCurrentTab('team')} title="Team">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <span className="sidebar-nav-item-text">Team</span>
              </span>

              {/* Apps */}
              <span className={currentTab === 'apps' ? 'active' : ''} onClick={() => setCurrentTab('apps')} title="Apps">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                <span className="sidebar-nav-item-text">Apps</span>
              </span>
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-profile">
                <div className="sidebar-avatar">
                  {merchantEmail.charAt(0).toUpperCase()}
                </div>
                <div className="sidebar-profile-info">
                  <span className="sidebar-profile-name">Merchant Admin</span>
                  <span className="sidebar-profile-role" title={merchantEmail}>
                    {merchantEmail.length > 20 ? merchantEmail.substring(0, 17) + '...' : merchantEmail}
                  </span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <Icons.Logout />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {loading ? (
            <LoadingSpinner message="Fetching dashboard registry details..." />
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewPage
                  shopInfo={shopInfo}
                  products={products}
                  orders={orders}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'products' && (
                isNewProductPath ? (
                  <AddProductPage
                    categories={categories}
                    brands={brands}
                    onCreateProduct={handleCreateProduct}
                    creating={creatingProduct}
                    onBack={() => setCurrentTab('products')}
                  />
                ) : selectedProductId ? (
                  <ProductDetailPage
                    productId={selectedProductId}
                    products={products}
                    categories={categories}
                    brands={brands}
                    onBack={() => setCurrentTab('products')}
                  />
                ) : (
                  <ProductsPage
                    shopInfo={shopInfo}
                    products={products}
                    categories={categories}
                    brands={brands}
                    loading={loading}
                    onCreateProduct={handleCreateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    creating={creatingProduct}
                    deleting={deletingProduct}
                  />
                )
              )}

              {currentTab === 'categories' && (
                <CategoriesPage
                  categories={categories}
                  loading={loading}
                  onCreateCategory={handleCreateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onUpdateCategory={handleUpdateCategory}
                  creating={creatingCategory}
                  deleting={deletingCategory}
                />
              )}



              {currentTab === 'orders' && (
                selectedOrderId ? (
                  <OrderDetailPage
                    orderId={selectedOrderId}
                    orders={orders}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    updating={updatingOrderStatus}
                    onBack={() => setCurrentTab('orders')}
                  />
                ) : (
                  <OrdersPage
                    orders={orders}
                    loading={loading}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    updating={updatingOrderStatus}
                  />
                )
              )}

              {currentTab === 'inventory' && <InventoryPage />}

              {currentTab === 'returns' && <ReturnsPage />}

              {currentTab === 'invoices' && (
                <PlaceholderPage 
                  tabName="Invoices" 
                  parentName="Orders" 
                  description="Generate and store automated sales invoices, download PDF statements, and send invoice details directly to customer emails." 
                />
              )}

              {currentTab === 'customers' && (
                <PlaceholderPage 
                  tabName="Customers" 
                  parentName="Customers" 
                  description="View your store's customer registry, analyze purchase behaviors, lifetime value (LTV), and user account details." 
                />
              )}

              {currentTab === 'groups' && (
                <PlaceholderPage 
                  tabName="Groups" 
                  parentName="Customers" 
                  description="Segment customers into target groups (e.g. VIP Shoppers, First-time buyers) for specialized marketing campaigns." 
                />
              )}

              {currentTab === 'reviews' && (
                <PlaceholderPage 
                  tabName="Reviews" 
                  parentName="Customers" 
                  description="Moderate and review customer product ratings, approve reviews for display, and reply to customer feedback." 
                />
              )}

              {currentTab === 'discounts' && (
                <PlaceholderPage 
                  tabName="Discounts" 
                  parentName="Marketing" 
                  description="Create discount codes, flash sales, seasonal coupons, and cart-level rules to boost conversions." 
                />
              )}

              {currentTab === 'email' && (
                <PlaceholderPage 
                  tabName="Email" 
                  parentName="Marketing" 
                  description="Design, schedule, and send targeted email newsletters and automated recovery sequences to your shoppers." 
                />
              )}

              {currentTab === 'whatsapp' && (
                <PlaceholderPage 
                  tabName="WhatsApp" 
                  parentName="Marketing" 
                  description="Configure instant WhatsApp notifications, cart alerts, order confirmations, and support channels." 
                />
              )}

              {currentTab === 'seo' && (
                <PlaceholderPage 
                  tabName="SEO" 
                  parentName="Marketing" 
                  description="Optimize meta headers, sitemaps, robots.txt, and URL structures to rank your storefront higher on search engines." 
                />
              )}

              {currentTab === 'pages' && (
                <PagesPage />
              )}

              {currentTab === 'banners' && (
                <BannerPage />
              )}

              {currentTab === 'blog' && (
                <BlogPage />
              )}

              {currentTab === 'media' && (
                <MediaLibraryPage />
              )}

              {currentTab === 'faq' && (
                <FaqPage />
              )}

              {currentTab === 'testimonials' && (
                <TestimonialsPage />
              )}

              {currentTab === 'home-sections' && (
                <HomeSectionsPage />
              )}

              {currentTab === 'analytics' && (
                <PlaceholderPage 
                  tabName="Analytics" 
                  description="Track real-time traffic statistics, conversion funnels, popular search terms, and sales metrics." 
                />
              )}

              {currentTab === 'payments' && <PaymentPage />}

              {currentTab === 'settings' && (
                <SettingsPage
                  shopInfo={shopInfo}
                  onSaveSettings={handleSaveSettings}
                  saving={savingSettings}
                />
              )}

              {currentTab === 'team' && (
                <PlaceholderPage 
                  tabName="Team" 
                  description="Add team members, configure role permissions (admin, support, catalog manager), and audit staff log actions." 
                />
              )}

              {currentTab === 'apps' && (
                <PlaceholderPage 
                  tabName="Apps" 
                  description="Explore, install, and configure third-party add-ons and app integrations to extend your storefront functionality." 
                />
              )}


            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
