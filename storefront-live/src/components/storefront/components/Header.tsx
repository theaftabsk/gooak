import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { useNavigate } from 'react-router-dom';
import { catalogApi, customerApi } from '@oaksol/api-client';
import { Icons } from '../icons';
import { getWishlistCount } from '../pages/Wishlist/index';

export const Header: React.FC = () => {
  const { cartCount, setCartOpen } = useCart();
  const { customer } = useCustomer();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [wishCount, setWishCount] = useState(0);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  useEffect(() => { setWishCount(getWishlistCount()); }, []);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const data = await catalogApi.getCategories();
        setCategories(data || []);

        const homeData = await catalogApi.getHomepage();
        setShop(homeData.shop || null);

        const pageSettings = await customerApi.getPages().catch(() => null);
        if (pageSettings) {
          if (pageSettings.content?.logo_url) {
            setCustomLogoUrl(pageSettings.content.logo_url);
          }
          if (pageSettings.content?.navbar_menu) {
            try {
              setNavItems(JSON.parse(pageSettings.content.navbar_menu));
            } catch(e) {
              setNavItems([]);
            }
          } else {
            setNavItems([
              { title: 'Home', url: '/' },
              { title: 'Products', url: '/products' },
              { title: 'Categories', url: '/categories' },
              { title: 'About Us', url: '/about' },
              { title: 'Contact Us', url: '/contact' }
            ]);
          }
        } else {
          setNavItems([
            { title: 'Home', url: '/' },
            { title: 'Products', url: '/products' },
            { title: 'Categories', url: '/categories' },
            { title: 'About Us', url: '/about' },
            { title: 'Contact Us', url: '/contact' }
          ]);
        }
      } catch (err: any) {
        console.error('Failed to load categories in header:', err);
        const isMissingTenant = err.status === 404 || (err.message && (err.message.includes('Store domain mapping') || err.message.includes('Tenant-Domain')));
        if (isMissingTenant) {
          const host = window.location.host;
          const protocol = window.location.protocol;
          if (host.includes('localhost') || host.includes('127.0.0.1')) {
            const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
            window.location.href = `${protocol}//localhost${port}`;
          } else {
            const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'posix.digital';
            window.location.href = `${protocol}//${platformDomain}`;
          }
        }
      }
    };
    fetchHeaderData();
  }, []);

  // Only root-level categories that should show in nav
  const menuCategories = categories.filter((cat: any) => cat.show_in_menu !== false);

  const goTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleLinkClick = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      goTo(url);
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Left: Brand */}
        <div className="logo-area" onClick={() => goTo('/')}>
          {customLogoUrl || shop?.logo_url ? (
            <img src={customLogoUrl || shop.logo_url} alt={shop?.name || 'Store Logo'} className="brand-logo-img" style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          ) : (
            <>
              <span className="brand-name">{shop?.name || 'STOREFRONT'}</span>
              <span className="brand-tag">Pure Botanical</span>
            </>
          )}
        </div>

        {/* Center: Nav with dropdown subcategories */}
        <nav className="site-nav" onMouseLeave={() => setOpenDropdown(null)}>
          {navItems.map((item: any, index: number) => {
            const isCategories = item.url === '/categories';
            const hasCategoriesDropdown = isCategories && menuCategories.length > 0;

            if (hasCategoriesDropdown) {
              return (
                <div
                  key={index}
                  className="nav-item-wrap has-dropdown"
                  onMouseEnter={() => setOpenDropdown('categories-nav')}
                >
                  <span
                    className={openDropdown === 'categories-nav' ? 'active' : ''}
                    onClick={() => goTo('/categories')}
                  >
                    {item.title}
                    <Icons.ChevronDown />
                  </span>

                  {openDropdown === 'categories-nav' && (
                    <div className="nav-dropdown">
                      <div className="nav-dropdown-header" onClick={() => goTo('/categories')}>
                        <strong>All Categories</strong>
                        <span className="view-all-link">View All →</span>
                      </div>
                      <div className="nav-dropdown-divider" />
                      <div className="nav-dropdown-grid">
                        {menuCategories.map((cat: any) => (
                          <div
                            key={cat.id}
                            className="nav-dropdown-item"
                            onClick={() => goTo(`/categories/${cat.slug}`)}
                          >
                            <span className="sub-dot">●</span>
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const matchedCategory = menuCategories.find((cat: any) => `/categories/${cat.slug}` === item.url);
            const subCategories = matchedCategory ? (matchedCategory.children || []).filter((s: any) => s.show_in_menu !== false) : [];
            const hasSubDropdown = matchedCategory && subCategories.length > 0;

            if (hasSubDropdown) {
              return (
                <div
                  key={index}
                  className="nav-item-wrap has-dropdown"
                  onMouseEnter={() => setOpenDropdown(matchedCategory.id)}
                >
                  <span
                    className={openDropdown === matchedCategory.id ? 'active' : ''}
                    onClick={() => goTo(item.url)}
                  >
                    {item.title}
                    <Icons.ChevronDown />
                  </span>

                  {openDropdown === matchedCategory.id && (
                    <div className="nav-dropdown">
                      <div className="nav-dropdown-header" onClick={() => goTo(item.url)}>
                        <strong>All {matchedCategory.name}</strong>
                        <span className="view-all-link">View All →</span>
                      </div>
                      <div className="nav-dropdown-divider" />
                      <div className="nav-dropdown-grid">
                        {subCategories.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="nav-dropdown-item"
                            onClick={() => goTo(`/categories/${sub.slug}`)}
                          >
                            <span className="sub-dot">●</span>
                            {sub.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <span key={index} onClick={() => handleLinkClick(item.url)}>
                {item.title}
              </span>
            );
          })}
        </nav>

        {/* Right: Search + Wishlist + Account + Cart + Mobile Toggle */}
        <div className="header-actions">
          <button className="hdr-icon-btn" onClick={() => navigate('/search')} title="Search" aria-label="Search">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="hdr-icon-btn" onClick={() => navigate('/wishlist')} title="Wishlist" aria-label="Wishlist" style={{ position: 'relative' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill={wishCount > 0 ? 'var(--sf-accent)' : 'none'} stroke="var(--sf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {wishCount > 0 && <span className="hdr-wish-badge">{wishCount}</span>}
          </button>
          <button className="hdr-icon-btn" onClick={() => navigate(customer ? '/account' : '/login')} title={customer ? 'My Account' : 'Login'} aria-label="Account">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {customer && <span className="hdr-acct-dot" />}
          </button>
          <div className="cart-trigger-icon" onClick={() => { setCartOpen(true); setMobileMenuOpen(false); }}>
            <span className="cart-bag-symbol">🛒</span>
            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
          </div>
          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Mobile Search */}
        <div className="mobile-search-wrap">
          <button className="mobile-search-bar" onClick={() => goTo('/search')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search products…
          </button>
        </div>

        {/* Account */}
        <div className="mobile-acct-row">
          {customer ? (
            <>
              <div className="mobile-acct-avatar">{customer.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div>
                <div className="mobile-acct-name">{customer.name}</div>
                <div className="mobile-acct-email">{customer.email}</div>
              </div>
            </>
          ) : (
            <>
              <div className="mobile-acct-avatar" style={{ background: '#e5e7eb', color: '#6b7280' }}>?</div>
              <div>
                <div className="mobile-acct-name" style={{ color: 'var(--sf-text-muted)' }}>Not signed in</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button className="mobile-auth-btn" onClick={() => goTo('/login')}>Login</button>
                  <button className="mobile-auth-btn primary" onClick={() => goTo('/register')}>Register</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Shop Nav */}
        <div className="mobile-section-label">Shop Menu</div>
        <nav className="mobile-nav-links">
          {navItems.map((item: any, index: number) => {
            const matchedCategory = menuCategories.find((cat: any) => `/categories/${cat.slug}` === item.url);
            const subs = matchedCategory ? (matchedCategory.children || []).filter((s: any) => s.show_in_menu !== false) : [];
            const isExpanded = mobileExpanded === matchedCategory?.id;

            if (matchedCategory && subs.length > 0) {
              return (
                <div key={index} className="mobile-cat-group">
                  <div className="mobile-cat-header">
                    <span onClick={() => { goTo(item.url); setMobileMenuOpen(false); }}>{item.title}</span>
                    <button className="mobile-expand-btn" onClick={() => setMobileExpanded(isExpanded ? null : matchedCategory.id)}>
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mobile-subcats">
                      {subs.map((sub: any) => (
                        <span key={sub.id} className="mobile-subcat-item" onClick={() => { goTo(`/categories/${sub.slug}`); setMobileMenuOpen(false); }}>
                          ↳ {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <span key={index} onClick={() => { handleLinkClick(item.url); setMobileMenuOpen(false); }}>
                {item.title}
              </span>
            );
          })}
        </nav>

        {/* Account Links (if logged in) */}
        {customer && (
          <>
            <div className="mobile-section-label">My Account</div>
            <nav className="mobile-nav-links plain">
              <span onClick={() => goTo('/account')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
              </span>
              <span onClick={() => goTo('/account/orders')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 02 2h14a2 2 0 0 02-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                My Orders
              </span>
              <span onClick={() => goTo('/wishlist')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                Wishlist {wishCount > 0 && <span className="mobile-badge">{wishCount}</span>}
              </span>
            </nav>
          </>
        )}

        {/* Info Pages */}
        <div className="mobile-section-label">Information</div>
        <nav className="mobile-nav-links plain">
          <span onClick={() => goTo('/about')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            About Us
          </span>
          <span onClick={() => goTo('/contact')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 010 1.99 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Contact Us
          </span>
          <span onClick={() => goTo('/privacy')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Privacy Policy
          </span>
          <span onClick={() => goTo('/terms')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Terms & Conditions
          </span>
        </nav>
      </div>

      <style>{`
        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(250, 247, 242, 0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }

        .header-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          height: 70px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 28px;
          box-sizing: border-box;
        }

        .logo-area {
          display: flex; flex-direction: column; cursor: pointer;
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-serif);
          font-size: 1.45rem; font-weight: 700;
          letter-spacing: 0.04em; color: var(--sf-text-main); line-height: 1;
        }
        .brand-tag {
          font-size: 0.6rem; text-transform: uppercase;
          letter-spacing: 0.15em; color: var(--sf-accent);
          font-weight: 700; margin-top: 2px;
        }

        /* ─── Desktop Nav ─── */
        .site-nav {
          display: flex; gap: 4px; align-items: center;
          flex: 1; justify-content: center;
        }

        .nav-item-wrap {
          position: relative;
        }

        .site-nav > span,
        .nav-item-wrap > span {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 8px 14px;
          font-size: 0.9rem; font-weight: 500;
          color: var(--sf-text-muted);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
          user-select: none;
        }

        .site-nav > span:hover,
        .nav-item-wrap > span:hover,
        .nav-item-wrap > span.active {
          color: var(--sf-text-main);
          background: rgba(0,0,0,0.04);
        }

        .nav-chevron {
          opacity: 0.5; transition: transform 0.2s; flex-shrink: 0;
        }
        .nav-item-wrap > span.active .nav-chevron {
          transform: rotate(180deg); opacity: 1;
        }

        /* ─── Dropdown ─── */
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          min-width: 220px;
          padding: 8px;
          z-index: 200;
          animation: nav-dd-in 0.15s ease;
        }

        @keyframes nav-dd-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .nav-dropdown-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px 6px;
          cursor: pointer;
        }
        .nav-dropdown-header strong {
          font-size: 0.85rem; font-weight: 700; color: #111827;
        }
        .view-all-link {
          font-size: 0.75rem; font-weight: 600;
          color: var(--sf-accent); white-space: nowrap;
        }
        .nav-dropdown-divider {
          height: 1px; background: #F3F4F6; margin: 4px 0;
        }
        .nav-dropdown-grid {
          display: flex; flex-direction: column; gap: 2px;
        }
        .nav-dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px;
          font-size: 0.88rem; color: #374151; font-weight: 500;
          cursor: pointer;
          border-radius: 10px;
          transition: background 0.15s, color 0.15s;
        }
        .nav-dropdown-item:hover {
          background: #F0FDF4; color: #15803D;
        }
        .sub-dot {
          font-size: 0.45rem; color: #9CA3AF;
        }

        @media (max-width: 900px) {
          .site-nav { display: none; }
        }

        /* ─── Header Actions ─── */
        .header-actions {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .cart-trigger-icon {
          position: relative; cursor: pointer;
          font-size: 1.35rem; padding: 6px;
          transition: transform 0.2s; border-radius: 8px;
        }
        .cart-trigger-icon:hover { transform: scale(1.08); background: rgba(0,0,0,0.04); }
        .cart-badge-count {
          position: absolute; top: -2px; right: -4px;
          background: var(--sf-accent); color: #fff;
          font-size: 0.65rem; font-weight: 700;
          width: 17px; height: 17px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        /* ─── Mobile Toggle ─── */
        .mobile-menu-toggle {
          display: none; flex-direction: column;
          justify-content: space-between;
          width: 22px; height: 15px;
          background: transparent; border: none;
          cursor: pointer; padding: 0; margin-left: 8px;
        }
        .mobile-menu-toggle .bar {
          width: 100%; height: 2px;
          background: var(--sf-text-main);
          border-radius: 2px;
          transition: all 0.25s;
        }
        .mobile-menu-toggle.open .bar:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .mobile-menu-toggle.open .bar:nth-child(2) { opacity: 0; }
        .mobile-menu-toggle.open .bar:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        @media (max-width: 900px) {
          .mobile-menu-toggle { display: flex; }
        }

        /* ─── Mobile Drawer ─── */
        .mobile-drawer {
          position: fixed;
          top: 70px; left: 0; right: 0; bottom: 0;
          background: var(--sf-bg);
          z-index: 99;
          transform: translateX(100%);
          opacity: 0; visibility: hidden;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s, visibility 0.25s;
          padding: 24px;
          overflow-y: auto;
        }
        .mobile-drawer.open {
          transform: translateX(0); opacity: 1; visibility: visible;
        }
        .mobile-nav-links {
          display: flex; flex-direction: column; gap: 0;
        }
        .mobile-nav-links > span {
          font-family: var(--font-serif);
          font-size: 1.25rem; font-weight: 600;
          color: var(--sf-text-main); cursor: pointer;
          border-bottom: 1px solid var(--sf-border);
          padding: 16px 0;
          transition: color 0.2s;
        }
        .mobile-nav-links > span:hover { color: var(--sf-accent); }

        .mobile-cat-group {
          border-bottom: 1px solid var(--sf-border);
        }
        .mobile-cat-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0;
        }
        .mobile-cat-header > span {
          font-family: var(--font-serif);
          font-size: 1.25rem; font-weight: 600;
          color: var(--sf-text-main); cursor: pointer;
        }
        .mobile-expand-btn {
          background: none; border: none; cursor: pointer;
          font-size: 0.7rem; color: var(--sf-text-muted); padding: 4px 8px;
        }
        .mobile-subcats {
          display: flex; flex-direction: column; gap: 2px;
          padding-bottom: 12px;
        }
        .mobile-subcat-item {
          font-size: 1rem; color: var(--sf-text-muted);
          cursor: pointer; padding: 8px 16px;
          border-radius: 8px; transition: all 0.2s;
        }
        .mobile-subcat-item:hover {
          color: var(--sf-accent); background: rgba(21,128,61,0.05);
        }
        .hdr-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          border: none; background: transparent; cursor: pointer;
          color: var(--sf-text-muted); position: relative;
          transition: background 0.15s, color 0.15s;
        }
        .hdr-icon-btn:hover { background: rgba(0,0,0,0.05); color: var(--sf-text-main); }
        .hdr-wish-badge {
          position: absolute; top: -4px; right: -4px;
          background: #dc2626; color: #fff;
          font-size: 0.6rem; font-weight: 700;
          width: 16px; height: 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .hdr-acct-dot {
          position: absolute; bottom: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--sf-accent);
        }

        /* ─── Enhanced Mobile Drawer ─── */
        .mobile-search-wrap { padding: 0 0 16px; }
        .mobile-search-bar {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 12px 16px;
          background: var(--sf-bg); border: 1.5px solid var(--sf-border);
          border-radius: 12px; font-size: 0.9rem; color: var(--sf-text-muted);
          cursor: pointer; font-family: var(--font-sans); text-align: left;
          transition: border-color 0.2s;
        }
        .mobile-search-bar:hover { border-color: var(--sf-accent); }
        .mobile-acct-row {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; background: var(--sf-bg);
          border-radius: 14px; margin-bottom: 20px;
          border: 1px solid var(--sf-border);
        }
        .mobile-acct-avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--sf-accent); color: #fff;
          font-size: 1.3rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mobile-acct-name { font-weight: 700; font-size: 0.93rem; color: var(--sf-text-main); }
        .mobile-acct-email { font-size: 0.76rem; color: var(--sf-text-muted); margin-top: 2px; }
        .mobile-auth-btn {
          padding: 6px 14px; border-radius: 8px; font-size: 0.8rem;
          font-weight: 600; cursor: pointer; font-family: var(--font-sans);
          border: 1.5px solid var(--sf-border); background: #fff; color: var(--sf-text-main);
          transition: all 0.15s;
        }
        .mobile-auth-btn.primary {
          background: var(--sf-accent); color: #fff; border-color: var(--sf-accent);
        }
        .mobile-section-label {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--sf-text-muted);
          padding: 4px 0 10px; margin-top: 16px;
        }
        .mobile-nav-links.plain > span {
          display: flex; align-items: center; gap: 12px;
          font-family: var(--font-sans) !important; font-size: 0.93rem !important;
          font-weight: 500 !important; color: var(--sf-text-muted);
        }
        .mobile-nav-links.plain > span:hover { color: var(--sf-accent); }
        .mobile-badge {
          background: var(--sf-accent); color: #fff;
          font-size: 0.65rem; font-weight: 700;
          padding: 2px 6px; border-radius: 10px; margin-left: 4px;
        }
      `}</style>
    </header>
  );
};
export default Header;
