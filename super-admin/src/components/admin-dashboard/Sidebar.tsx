import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './icons';

interface SidebarProps {
  pendingRequestsCount: number;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ pendingRequestsCount, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const isDashboardActive = pathname === '/' || pathname === '/dashboard';
  const isStoresActive = pathname === '/stores' || pathname.startsWith('/stores/');
  const isRequestsActive = pathname === '/requests';
  const isOnboardActive = pathname === '/onboard';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon super"><Icons.Logo /></div>
        <div>
          <strong>OakSol Console</strong>
          <span>Platform Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isDashboardActive ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Icons.Dashboard /> Dashboard
        </button>
        <button
          className={`nav-item ${isStoresActive ? 'active' : ''}`}
          onClick={() => navigate('/stores')}
        >
          <Icons.Store /> Active Storefronts
        </button>
        <button
          className={`nav-item ${isRequestsActive ? 'active' : ''}`}
          onClick={() => navigate('/requests')}
        >
          <Icons.Clipboard /> Signup Requests
          {pendingRequestsCount > 0 && (
            <span className="nav-badge warn">{pendingRequestsCount}</span>
          )}
        </button>
        <button
          className={`nav-item ${isOnboardActive ? 'active' : ''}`}
          onClick={() => navigate('/onboard')}
        >
          <Icons.Plus /> Provision Store
        </button>
        <button className="nav-item logout" onClick={onLogout}>
          <Icons.Logout /> Logout
        </button>
      </nav>
    </aside>
  );
};
