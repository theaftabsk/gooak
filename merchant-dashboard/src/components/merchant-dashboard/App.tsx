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
import { ProductDetailPage } from './pages/ProductDetailPage/index';
import { CategoriesPage } from './pages/CategoriesPage/index';
import { OrdersPage } from './pages/OrdersPage/index';
import { OrderDetailPage } from './pages/OrderDetailPage/index';
import { InventoryPage } from './pages/InventoryPage/index';
import { SettingsPage } from './pages/SettingsPage/index';
import { PagesPage } from './pages/PagesPage/index';
import { PaymentPage } from './pages/PaymentPage/index';
import { ThemesPage } from './pages/ThemesPage/index';

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
    if (path.endsWith('/themes')) return 'themes';
    return 'overview';
  };

  const currentTab = getTabFromPath(location.pathname);
  
  // Extract selected product ID if on details subpage
  const productIdMatch = location.pathname.match(/\/products\/([a-f0-9-]{36})$/i);
  const selectedProductId = productIdMatch ? productIdMatch[1] : null;

  // Extract selected order ID if on details subpage
  const orderIdMatch = location.pathname.match(/\/orders\/([a-f0-9-]{36})$/i);
  const selectedOrderId = orderIdMatch ? orderIdMatch[1] : null;

  const setCurrentTab = (tab: MerchantTab) => {
    const base = location.pathname.startsWith('/dashboard') ? '/dashboard' : '/admin';
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
      const res = await catalogApi.merchantLogin({ email, password });
      if (res && res.shop) {
        localStorage.setItem('oaksol_active_shop_slug', res.shop.slug);
        localStorage.setItem(`oaksol_merchant_logged_in_${res.shop.slug}`, 'true');
        localStorage.setItem(`oaksol_merchant_email_${res.shop.slug}`, email);
        window.location.href = window.location.pathname; // Reloads to apply new context
      } else {
        setLoginError('Invalid response from login API.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
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
              <div className="sidebar-group-title">Catalog</div>
              <span className={currentTab === 'overview' ? 'active' : ''} onClick={() => setCurrentTab('overview')} title="Overview">
                <Icons.Dashboard />
                <span className="sidebar-nav-item-text">Overview</span>
              </span>
              <span className={currentTab === 'products' ? 'active' : ''} onClick={() => setCurrentTab('products')} title="Products Registry">
                <Icons.Package />
                <span className="sidebar-nav-item-text">Products Registry</span>
              </span>
              <span className={currentTab === 'categories' ? 'active' : ''} onClick={() => setCurrentTab('categories')} title="Categories">
                <Icons.Folder />
                <span className="sidebar-nav-item-text">Categories</span>
              </span>
              <span className={currentTab === 'inventory' ? 'active' : ''} onClick={() => setCurrentTab('inventory')} title="Inventory">
                <Icons.Package />
                <span className="sidebar-nav-item-text">Inventory</span>
              </span>

              <div className="sidebar-group-title">Operations</div>
              <span className={currentTab === 'orders' ? 'active' : ''} onClick={() => setCurrentTab('orders')} title="Store Orders">
                <Icons.Clipboard />
                <span className="sidebar-nav-item-text">Store Orders</span>
                {orders.filter(o => o.status === 'pending').length > 0 && (
                  <span className="sidebar-badge">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </span>
              <span className={currentTab === 'payments' ? 'active' : ''} onClick={() => setCurrentTab('payments')} title="Payments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span className="sidebar-nav-item-text">Payments</span>
              </span>

              <div className="sidebar-group-title">Settings</div>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const base = location.pathname.startsWith('/dashboard') ? '/dashboard' : '/admin';
                  const shop = typeof window !== 'undefined' ? localStorage.getItem('oaksol_active_shop_slug') || '' : '';
                  window.open(`${base}/builder${shop ? `?shop=${shop}` : ''}`, '_blank');
                }}
                title="Website Builder"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
                <span className="sidebar-nav-item-text">Website Builder</span>
                {!isSidebarCollapsed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: 'auto', opacity: 0.5}}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                )}
              </span>
              <span className={currentTab === 'themes' ? 'active' : ''} onClick={() => setCurrentTab('themes')} title="Themes">
                <Icons.Palette />
                <span className="sidebar-nav-item-text">Themes</span>
              </span>
              <span className={currentTab === 'settings' ? 'active' : ''} onClick={() => setCurrentTab('settings')} title="Settings">
                <Icons.Settings />
                <span className="sidebar-nav-item-text">Settings</span>
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
                selectedProductId ? (
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

              {currentTab === 'pages' && (
                <PagesPage shopInfo={shopInfo} />
              )}

              {currentTab === 'payments' && <PaymentPage />}

              {currentTab === 'settings' && (
                <SettingsPage
                  shopInfo={shopInfo}
                  onSaveSettings={handleSaveSettings}
                  saving={savingSettings}
                />
              )}

              {currentTab === 'themes' && (
                <ThemesPage
                  shopInfo={shopInfo}
                  onThemeChange={fetchDashboardData}
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
