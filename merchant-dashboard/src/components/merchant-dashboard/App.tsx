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
import { BannersPage } from './pages/BannersPage/index';
import { OrdersPage } from './pages/OrdersPage/index';
import { InventoryPage } from './pages/InventoryPage/index';
import { SettingsPage } from './pages/SettingsPage/index';
import { PagesPage } from './pages/PagesPage/index';

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
  
  let resolvedTenant = 'aftab';
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
    if (path.endsWith('/banners')) return 'banners';
    if (path.endsWith('/orders')) return 'orders';
    if (path.endsWith('/inventory')) return 'inventory';
    if (path.endsWith('/settings')) return 'settings';
    if (path.endsWith('/pages')) return 'pages';
    return 'overview';
  };

  const currentTab = getTabFromPath(location.pathname);
  
  // Extract selected product ID if on details subpage
  const productIdMatch = location.pathname.match(/\/products\/([a-f0-9-]{36})$/i);
  const selectedProductId = productIdMatch ? productIdMatch[1] : null;

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Shop & Dashboard Data
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Loaders
  const [loading, setLoading] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [creatingBanner, setCreatingBanner] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginError('Email and Password are required.');
      return;
    }
    setLoginError('');
    setIsLoggedIn(true);
    localStorage.setItem(`oaksol_merchant_logged_in_${tenantSlug}`, 'true');
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
      // 1. Fetch homepage details (includes banner list + shop metadata info)
      const homeData = await catalogApi.getHomepage();
      setShopInfo(homeData.shop || { name: tenantSlug.toUpperCase(), slug: tenantSlug });
      setBanners(homeData.banners || []);

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

  const handleCreateBanner = async (bannerData: any) => {
    setCreatingBanner(true);
    try {
      await catalogApi.createBanner(bannerData);
      alert('Banner campaign published!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish banner');
    } finally {
      setCreatingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setDeletingBanner(true);
    try {
      await catalogApi.deleteBanner(id);
      alert('Banner deleted successfully');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    } finally {
      setDeletingBanner(false);
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
    if (!shopInfo?.id) return;
    setSavingSettings(true);
    try {
      await catalogApi.updateShop(shopInfo.id, settingsData);
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
              <h2>{tenantSlug.toUpperCase()} Console</h2>
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
      <div className="dashboard-shell">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="sidebar-logo"><Icons.Store /></div>
              <div>
                <h3>{shopInfo?.name || tenantSlug.toUpperCase()}</h3>
                <span className="sidebar-brand-sub">Merchant Console</span>
              </div>
            </div>
            <div style={{ width: '100%', marginTop: '4px' }}>
              <label style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Active Store</label>
              <select 
                value={tenantSlug} 
                onChange={(e) => {
                  const newSlug = e.target.value;
                  localStorage.setItem('oaksol_active_shop_slug', newSlug);
                  window.location.search = `?shop=${newSlug}`;
                }}
                style={{
                  width: '100%',
                  background: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="aftab">aftab (Skincare)</option>
                <option value="nature-glow">nature-glow (Fashion)</option>
                <option value="maheorthe">maheorthe (Electronics)</option>
              </select>
            </div>
          </div>
          <nav className="sidebar-nav">
            <span className={currentTab === 'overview' ? 'active' : ''} onClick={() => setCurrentTab('overview')}>
              <Icons.Dashboard /> Overview
            </span>
            <span className={currentTab === 'products' ? 'active' : ''} onClick={() => setCurrentTab('products')}>
              <Icons.Package /> Products Registry
            </span>
            <span className={currentTab === 'categories' ? 'active' : ''} onClick={() => setCurrentTab('categories')}>
              <Icons.Folder /> Categories
            </span>
            <span className={currentTab === 'banners' ? 'active' : ''} onClick={() => setCurrentTab('banners')}>
              <Icons.Image /> Promo Banners
            </span>
            <span className={currentTab === 'orders' ? 'active' : ''} onClick={() => setCurrentTab('orders')}>
              <Icons.Clipboard /> Store Orders
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="sidebar-badge" style={{ background: 'var(--m-warn)', color: '#000000', padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem', marginLeft: 8, fontWeight: 'bold' }}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </span>
            <span className={currentTab === 'inventory' ? 'active' : ''} onClick={() => setCurrentTab('inventory')}>
              <Icons.Package /> Inventory
            </span>
            <span className={currentTab === 'pages' ? 'active' : ''} onClick={() => setCurrentTab('pages')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Pages &amp; Content
            </span>
            <span className={currentTab === 'settings' ? 'active' : ''} onClick={() => setCurrentTab('settings')}>
              <Icons.Settings /> Settings
            </span>
            <span className="logout-link" onClick={handleLogout}>
              <Icons.Logout /> Logout
            </span>
          </nav>
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

              {currentTab === 'banners' && (
                <BannersPage
                  banners={banners}
                  loading={loading}
                  onCreateBanner={handleCreateBanner}
                  onDeleteBanner={handleDeleteBanner}
                  creating={creatingBanner}
                  deleting={deletingBanner}
                />
              )}

              {currentTab === 'orders' && (
                <OrdersPage
                  orders={orders}
                  loading={loading}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  updating={updatingOrderStatus}
                />
              )}

              {currentTab === 'inventory' && <InventoryPage />}

              {currentTab === 'pages' && (
                <PagesPage shopInfo={shopInfo} />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  shopInfo={shopInfo}
                  onSaveSettings={handleSaveSettings}
                  saving={savingSettings}
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
