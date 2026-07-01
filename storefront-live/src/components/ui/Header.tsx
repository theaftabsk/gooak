'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import { useRouter } from 'next/navigation';
import { catalogApi, customerApi, storefrontApi } from '@/lib/api-client';
import { getWishlistCount } from '@/components/Wishlist';

export const Header: React.FC = () => {
  const { cartCount, setCartOpen } = useCart();
  const { customer } = useCustomer();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [wishCount, setWishCount] = useState(0);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const ddTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setWishCount(getWishlistCount()); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const [catData, collData] = await Promise.all([
          catalogApi.getCategories(),
          storefrontApi.getCollections().catch(() => []),
        ]);
        setCategories(catData || []);
        setCollections(collData || []);

        const homeData = await catalogApi.getHomepage();
        setShop(homeData.shop || null);
        if (homeData.shop) {
          localStorage.setItem('oaksol_shop_currency', homeData.shop.currency || 'INR');
        }

        const pageSettings = await customerApi.getPages().catch(() => null);
        if (pageSettings) {
          if (pageSettings.content?.logo_url) setCustomLogoUrl(pageSettings.content.logo_url);
          if (pageSettings.content?.navbar_menu) {
            try { setNavItems(JSON.parse(pageSettings.content.navbar_menu)); }
            catch { setNavItems([]); }
          } else {
            setNavItems([
              { title: 'Home', url: '/' },
              { title: 'Products', url: '/products' },
              { title: 'Categories', url: '/categories' },
              { title: 'Collections', url: '/collections' },
              { title: 'About', url: '/about' },
              { title: 'Contact', url: '/contact' },
            ]);
          }
        } else {
          setNavItems([
            { title: 'Home', url: '/' },
            { title: 'Products', url: '/products' },
            { title: 'Categories', url: '/categories' },
            { title: 'About', url: '/about' },
            { title: 'Contact', url: '/contact' },
          ]);
        }
      } catch (err: any) {
        console.error('Header fetch error:', err);
        const missing = err.status === 404 || (err.message && (err.message.includes('Store domain mapping') || err.message.includes('Tenant-Domain')));
        if (missing) {
          const host = window.location.host;
          const proto = window.location.protocol;
          if (host.includes('localhost') || host.includes('127.0.0.1')) {
            const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
            window.location.href = `${proto}//localhost${port}`;
          } else {
            window.location.href = `${proto}//${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'posix.digital'}`;
          }
        }
      }
    };
    fetchHeaderData();
  }, []);

  useEffect(() => {
    const isPreview = window.location.search.includes('preview=1');
    if (!isPreview) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SETTINGS_UPDATE') {
        const p = event.data.payload;
        if (!p) return;
        if (p.logo_url !== undefined) setCustomLogoUrl(p.logo_url);
        if (p.navbar_menu) {
          try { setNavItems(JSON.parse(p.navbar_menu)); } catch { /* ignore */ }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const menuCategories = categories.filter((c: any) => c.show_in_menu !== false);

  const go = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      router.push(path);
    }
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  const openDD = (key: string) => {
    if (ddTimer.current) clearTimeout(ddTimer.current);
    setOpenDropdown(key);
  };
  const closeDD = () => {
    ddTimer.current = setTimeout(() => setOpenDropdown(null), 100);
  };

  type NavResolved = { ddKey: string | null; subs: { title: string; url: string }[] };
  const resolveItem = (item: any, index: number): NavResolved => {
    if (item.children?.length > 0) return { ddKey: `c-${index}`, subs: item.children.map((c: any) => ({ title: c.title, url: c.url })) };
    if (item.url === '/collections' && collections.length > 0)
      return { ddKey: 'coll', subs: collections.map((c: any) => ({ title: c.name, url: `/collections/${c.slug}` })) };
    if (item.url === '/categories' && menuCategories.length > 0)
      return { ddKey: 'cats', subs: menuCategories.map((c: any) => ({ title: c.name, url: `/categories/${c.slug}` })) };
    const matched = menuCategories.find((c: any) => `/categories/${c.slug}` === item.url);
    if (matched) {
      const subs = (matched.children || []).filter((s: any) => s.show_in_menu !== false).map((s: any) => ({ title: s.name, url: `/categories/${s.slug}` }));
      if (subs.length > 0) return { ddKey: matched.id, subs };
    }
    return { ddKey: null, subs: [] };
  };

  return (
    <>
      <header className={`hdr${scrolled ? ' hdr--up' : ''}`}>
        <div className="hdr-inner">

          {/* Logo */}
          <div className="hdr-logo" onClick={() => go('/')}>
            {customLogoUrl || shop?.logo_url
              ? <img src={customLogoUrl || shop.logo_url} alt={shop?.name || 'Store'} className="hdr-logo-img" />
              : <span className="hdr-brand">{shop?.name || 'STORE'}</span>}
          </div>

          {/* Desktop Nav */}
          <nav className="hdr-nav">
            {navItems.map((item: any, idx: number) => {
              const key = `n${idx}`;
              const { ddKey, subs } = resolveItem(item, idx);
              if (ddKey && subs.length > 0) {
                return (
                  <div key={key} className="hdr-nitem" onMouseEnter={() => openDD(ddKey)} onMouseLeave={closeDD}>
                    <button className={`hdr-nbtn${openDropdown === ddKey ? ' hdr-nbtn--on' : ''}`} onClick={() => go(item.url)}>
                      {item.title}
                      <svg className="hdr-chev" width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {openDropdown === ddKey && (
                      <div className="hdr-dd" onMouseEnter={() => openDD(ddKey)} onMouseLeave={closeDD}>
                        <div className="hdr-dd-head" onClick={() => go(item.url)}>
                          <span className="hdr-dd-title">All {item.title}</span>
                          <span className="hdr-dd-all">View all →</span>
                        </div>
                        <div className="hdr-dd-line" />
                        {subs.map((s, si) => (
                          <button key={si} className="hdr-dd-item" onClick={() => go(s.url)}>{s.title}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return <button key={key} className="hdr-nbtn" onClick={() => go(item.url)}>{item.title}</button>;
            })}
          </nav>

          {/* Action Icons */}
          <div className="hdr-acts">
            <button className="hdr-ico hdr-ico--search" onClick={() => router.push('/search')} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <button className="hdr-ico" onClick={() => router.push('/wishlist')} aria-label="Wishlist" style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishCount > 0 ? 'var(--sf-accent)' : 'none'} stroke="var(--sf-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wishCount > 0 && <span className="hdr-dot hdr-dot--red">{wishCount}</span>}
            </button>

            <button className="hdr-ico hdr-ico--account" onClick={() => router.push(customer ? '/account' : '/login')} aria-label="Account" style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              {customer && <span className="hdr-dot hdr-dot--green" />}
            </button>

            <button className="hdr-ico hdr-ico--cart" onClick={() => { setCartOpen(true); setMobileOpen(false); }} aria-label="Cart" style={{ position: 'relative' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && <span className="hdr-dot hdr-dot--accent">{cartCount}</span>}
            </button>

            <button className={`hdr-burger${mobileOpen ? ' hdr-burger--x' : ''}`} onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Dim overlay */}
      <div className={`hdr-mask${mobileOpen ? ' hdr-mask--on' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile slide-in panel */}
      <div className={`mob${mobileOpen ? ' mob--open' : ''}`}>

        <div className="mob-head">
          <div className="mob-logo" onClick={() => go('/')}>
            {customLogoUrl || shop?.logo_url
              ? <img src={customLogoUrl || shop.logo_url} alt="" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
              : <span className="hdr-brand" style={{ fontSize: '1.05rem' }}>{shop?.name || 'STORE'}</span>}
          </div>
          <button className="mob-x" onClick={() => setMobileOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <button className="mob-srch" onClick={() => go('/search')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Search…
        </button>

        {customer ? (
          <div className="mob-user">
            <div className="mob-av">{customer.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div>
              <div className="mob-uname">{customer.name}</div>
              <div className="mob-uemail">{customer.email}</div>
            </div>
          </div>
        ) : (
          <div className="mob-authrow">
            <button className="mob-abtn" onClick={() => go('/login')}>Sign in</button>
            <button className="mob-abtn mob-abtn--p" onClick={() => go('/register')}>Register</button>
          </div>
        )}

        <div className="mob-sep" />

        <nav className="mob-nav">
          {navItems.map((item: any, idx: number) => {
            const key = `m${idx}`;
            const { ddKey, subs } = resolveItem(item, idx);
            const ekey = ddKey ?? key;
            const open = mobileExpanded === ekey;
            if (subs.length > 0) {
              return (
                <div key={key}>
                  <div className="mob-row">
                    <span className="mob-link" onClick={() => go(item.url)}>{item.title}</span>
                    <button className="mob-tog" onClick={() => setMobileExpanded(open ? null : ekey)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                  {open && (
                    <div className="mob-sub">
                      {subs.map((s, si) => (
                        <span key={si} className="mob-sublink" onClick={() => go(s.url)}>{s.title}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return <span key={key} className="mob-link mob-link--solo" onClick={() => go(item.url)}>{item.title}</span>;
          })}
        </nav>

        {customer && (
          <>
            <div className="mob-sep" />
            <nav className="mob-nav mob-nav--sm">
              <span className="mob-link" onClick={() => go('/account')}>My Profile</span>
              <span className="mob-link" onClick={() => go('/account/orders')}>My Orders</span>
              <span className="mob-link" onClick={() => go('/wishlist')}>
                Wishlist {wishCount > 0 && <b className="mob-badge">{wishCount}</b>}
              </span>
            </nav>
          </>
        )}
      </div>

      <style>{`
        /* ── HEADER ── */
        .hdr {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          background: color-mix(in srgb, var(--sf-bg,#fff) 88%, transparent);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--sf-border, rgba(0,0,0,0.07));
          transition: box-shadow .25s;
        }
        .hdr--up { box-shadow: 0 4px 28px rgba(0,0,0,0.09); }
        .hdr-inner {
          max-width: 1320px; margin: 0 auto;
          height: 62px; padding: 0 28px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center; gap: 20px;
        }

        /* ── Logo ── */
        .hdr-logo { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
        .hdr-logo-img { height: 30px; width: auto; object-fit: contain; }
        .hdr-brand {
          font-family: var(--font-serif, Georgia, serif);
          font-size: 1.25rem; font-weight: 700; letter-spacing: .045em;
          color: var(--sf-text-main,#111);
        }

        /* ── Desktop Nav ── */
        .hdr-nav {
          display: flex; align-items: center; gap: 2px;
          justify-content: center;
        }
        .hdr-nitem { position: relative; }
        .hdr-nbtn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 6px 12px; background: none; border: none; cursor: pointer;
          font-size: .86rem; font-weight: 500;
          color: var(--sf-text-muted,#6b7280);
          border-radius: 7px; transition: color .15s, background .15s;
          font-family: var(--font-sans,sans-serif); white-space: nowrap;
        }
        .hdr-nbtn:hover, .hdr-nbtn--on {
          color: var(--sf-text-main,#111);
          background: color-mix(in srgb, var(--sf-text-main,#111) 6%, transparent);
        }
        .hdr-chev { opacity: .45; flex-shrink: 0; transition: transform .18s; }
        .hdr-nbtn--on .hdr-chev { transform: rotate(180deg); opacity: .8; }

        /* Dropdown */
        .hdr-dd {
          position: absolute; top: calc(100% + 10px); left: 50%;
          transform: translateX(-50%);
          background: var(--sf-card-bg,#fff);
          border: 1px solid var(--sf-border,#e5e7eb);
          border-radius: 14px; padding: 5px;
          min-width: 196px; z-index: 400;
          box-shadow: 0 8px 32px rgba(0,0,0,.11), 0 1px 4px rgba(0,0,0,.05);
          animation: ddin .12s ease;
        }
        .hdr-dd::before { content:''; position:absolute; bottom:100%; left:0; right:0; height:12px; }
        @keyframes ddin {
          from { opacity:0; transform:translateX(-50%) translateY(-5px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        .hdr-dd-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 11px 5px; cursor: pointer;
        }
        .hdr-dd-title { font-size: .78rem; font-weight: 700; color: var(--sf-text-main,#111); }
        .hdr-dd-all { font-size: .72rem; font-weight: 600; color: var(--sf-accent,#15803d); }
        .hdr-dd-line { height: 1px; background: var(--sf-border,#f0f0f0); margin: 3px 0; }
        .hdr-dd-item {
          display: block; width: 100%; text-align: left;
          padding: 8px 11px; background: none; border: none; cursor: pointer;
          font-size: .85rem; color: var(--sf-text-muted,#374151); font-weight: 500;
          border-radius: 8px; transition: background .12s, color .12s;
          font-family: var(--font-sans,sans-serif);
        }
        .hdr-dd-item:hover {
          background: color-mix(in srgb, var(--sf-accent,#15803d) 9%, transparent);
          color: var(--sf-accent,#15803d);
        }

        @media (max-width: 860px) {
          .hdr-nav { display: none; }
          .hdr-inner { grid-template-columns: 1fr auto; padding: 0 16px; }
          .hdr-ico--search, .hdr-ico--account { display: none; }
        }

        /* ── Actions ── */
        .hdr-acts { display: flex; align-items: center; gap: 2px; }
        .hdr-ico {
          width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
          border: none; background: none; cursor: pointer; border-radius: 9px;
          color: var(--sf-text-muted,#6b7280); transition: background .15s, color .15s;
        }
        .hdr-ico:hover { background: color-mix(in srgb, var(--sf-text-main,#111) 7%, transparent); color: var(--sf-text-main,#111); }
        .hdr-ico--cart {}
        .hdr-dot {
          position: absolute; top: 3px; right: 3px;
          min-width: 16px; height: 16px; border-radius: 99px; padding: 0 3px;
          font-size: .58rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--sf-bg,#fff);
        }
        .hdr-dot--accent { background: var(--sf-accent,#15803d); color: #fff; }
        .hdr-dot--red    { background: #dc2626; color: #fff; }
        .hdr-dot--green  {
          width: 7px; height: 7px; min-width: 0; padding: 0;
          top: auto; right: auto; bottom: 7px; right: 7px;
          background: var(--sf-accent,#15803d); border: 1.5px solid var(--sf-bg,#fff);
        }

        /* Burger */
        .hdr-burger {
          display: none; flex-direction: column; justify-content: center; align-items: center;
          width: 38px; height: 38px; gap: 5px;
          background: none; border: none; cursor: pointer; border-radius: 9px;
          transition: background .15s;
        }
        .hdr-burger:hover { background: color-mix(in srgb, var(--sf-text-main,#111) 7%, transparent); }
        .hdr-burger span {
          width: 20px; height: 1.5px;
          background: var(--sf-text-main,#111); border-radius: 2px; transition: all .24s;
        }
        .hdr-burger--x span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .hdr-burger--x span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hdr-burger--x span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }
        @media (max-width: 860px) { .hdr-burger { display: flex; } }

        /* ── MASK ── */
        .hdr-mask {
          display: none; position: fixed; inset: 0; z-index: 298;
          background: rgba(0,0,0,0); transition: background .3s;
          pointer-events: none;
        }
        .hdr-mask--on {
          display: block; background: rgba(0,0,0,.28); pointer-events: auto;
        }

        /* ── MOBILE PANEL ── */
        .mob {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(340px, 88vw);
          background: var(--sf-bg,#fff);
          border-left: 1px solid var(--sf-border,#e5e7eb);
          z-index: 299; overflow-y: auto;
          transform: translateX(100%);
          transition: transform .3s cubic-bezier(.16,1,.3,1);
          display: flex; flex-direction: column;
        }
        .mob--open { transform: translateX(0); }

        .mob-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px; border-bottom: 1px solid var(--sf-border,#f0f0f0); flex-shrink: 0;
        }
        .mob-logo { display: flex; align-items: center; cursor: pointer; }
        .mob-x {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; border-radius: 8px;
          color: var(--sf-text-muted,#6b7280); transition: background .15s;
        }
        .mob-x:hover { background: color-mix(in srgb, var(--sf-text-main,#111) 7%, transparent); }

        .mob-srch {
          display: flex; align-items: center; gap: 9px;
          margin: 12px 18px;
          padding: 10px 13px; border-radius: 9px;
          border: 1px solid var(--sf-border,#e5e7eb);
          background: color-mix(in srgb, var(--sf-text-main,#111) 3%, transparent);
          font-size: .86rem; color: var(--sf-text-muted,#9ca3af);
          cursor: pointer; font-family: var(--font-sans,sans-serif); text-align: left;
          transition: border-color .15s;
        }
        .mob-srch:hover { border-color: var(--sf-accent,#15803d); }

        .mob-user {
          display: flex; align-items: center; gap: 12px;
          margin: 0 18px 0;
          padding: 11px 13px;
          background: color-mix(in srgb, var(--sf-accent,#15803d) 7%, transparent);
          border-radius: 11px;
        }
        .mob-av {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--sf-accent,#15803d); color: #fff;
          font-size: 1rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mob-uname  { font-size: .87rem; font-weight: 700; color: var(--sf-text-main,#111); }
        .mob-uemail { font-size: .74rem; color: var(--sf-text-muted,#6b7280); margin-top: 1px; }

        .mob-authrow { display: flex; gap: 8px; margin: 0 18px; }
        .mob-abtn {
          flex: 1; padding: 9px; border-radius: 9px;
          font-size: .83rem; font-weight: 600; cursor: pointer;
          font-family: var(--font-sans,sans-serif); transition: all .15s;
          border: 1.5px solid var(--sf-border,#e5e7eb);
          background: none; color: var(--sf-text-main,#111);
        }
        .mob-abtn--p { background: var(--sf-accent,#15803d); color:#fff; border-color: var(--sf-accent,#15803d); }

        .mob-sep { height: 1px; background: var(--sf-border,#f0f0f0); margin: 14px 18px; flex-shrink: 0; }

        .mob-nav { display: flex; flex-direction: column; padding: 0 18px; }
        .mob-nav--sm .mob-link { font-size: .88rem; font-weight: 500; color: var(--sf-text-muted,#6b7280); }
        .mob-row { display: flex; align-items: center; justify-content: space-between; }
        .mob-link {
          display: block; flex: 1; padding: 12px 0;
          font-size: .97rem; font-weight: 600; color: var(--sf-text-main,#111);
          border-bottom: 1px solid var(--sf-border,#f5f5f5);
          cursor: pointer; transition: color .15s;
        }
        .mob-link--solo { border-bottom: 1px solid var(--sf-border,#f5f5f5); }
        .mob-link:hover { color: var(--sf-accent,#15803d); }
        .mob-tog {
          background: none; border: none; cursor: pointer; padding: 8px;
          color: var(--sf-text-muted,#9ca3af);
        }
        .mob-sub { padding: 4px 0 8px 10px; display: flex; flex-direction: column; }
        .mob-sublink {
          padding: 8px 10px; font-size: .86rem; color: var(--sf-text-muted,#6b7280);
          cursor: pointer; border-radius: 7px; transition: all .15s;
        }
        .mob-sublink:hover {
          background: color-mix(in srgb, var(--sf-accent,#15803d) 8%, transparent);
          color: var(--sf-accent,#15803d);
        }
        .mob-badge {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--sf-accent,#15803d); color: #fff;
          font-size: .62rem; font-weight: 700;
          border-radius: 99px; padding: 1px 6px; margin-left: 6px;
        }
      `}</style>
    </>
  );
};

export default Header;
