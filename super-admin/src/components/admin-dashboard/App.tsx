import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { catalogApi } from '@oaksol/api-client';
import { AdminStyles } from './styles';
import { Sidebar } from './Sidebar';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { DashboardPage } from './pages/DashboardPage/DashboardPage';
import { StoresPage } from './pages/StoresPage/StoresPage';
import { StoreDetailPage } from './pages/StoreDetailPage/StoreDetailPage';
import { RequestsPage } from './pages/RequestsPage/RequestsPage';
import { OnboardPage } from './pages/OnboardPage/OnboardPage';
import { EditShopModal, CredentialsModal } from './modals';

function AdminDashboardAppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('oaksol_admin_logged_in') === 'true';
  });

  // Data State
  const [shops, setShops] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Loading States
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Action Pending States
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [deletingShopId, setDeletingShopId] = useState<string | null>(null);
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Modals
  const [editingShop, setEditingShop] = useState<any | null>(null);
  const [credentials, setCredentials] = useState<any | null>(null);

  // Fetch Methods
  const fetchShops = async () => {
    setLoadingShops(true);
    try {
      const data = await catalogApi.getShops();
      setShops(data || []);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoadingShops(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await catalogApi.getTenantRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch tenant requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await catalogApi.getAdminStats();
      setStats(data || null);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshAllData = () => {
    fetchShops();
    fetchRequests();
    fetchStats();
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshAllData();
    }
  }, [isLoggedIn]);

  // Handlers
  const handleLogin = (token: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('oaksol_admin_logged_in', 'true');
    localStorage.setItem('oaksol_admin_token', token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('oaksol_admin_logged_in');
    localStorage.removeItem('oaksol_admin_token');
  };

  const handleApproveRequest = async (id: string) => {
    if (confirm('Approve this request and provision the storefront?')) {
      setApprovingId(id);
      try {
        const res = await catalogApi.approveTenantRequest(id);
        setCredentials({
          shopSlug: res.slug || 'store',
          ownerEmail: res.ownerEmail || '',
          domain: res.domain || '',
          credentials: res.credentials,
        });
        refreshAllData();
      } catch (err: any) {
        alert(err.message || 'Failed to approve request');
      } finally {
        setApprovingId(null);
      }
    }
  };

  const handleRejectRequest = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to reject the signup request for "${name}"?`)) {
      setRejectingId(id);
      try {
        await catalogApi.rejectTenantRequest(id);
        refreshAllData();
      } catch (err: any) {
        alert(err.message || 'Failed to reject request');
      } finally {
        setRejectingId(null);
      }
    }
  };

  const handleDeleteRequest = async (id: string, name: string) => {
    if (confirm(`Delete signup request record for "${name}"?`)) {
      setDeletingRequestId(id);
      try {
        await catalogApi.deleteTenantRequest(id);
        refreshAllData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete request');
      } finally {
        setDeletingRequestId(null);
      }
    }
  };

  const handleDeleteShop = async (shop: any) => {
    if (confirm(`CRITICAL WARNING:\nAre you sure you want to delete "${shop.name}"?\nThis deletes all products, domains, banners, categories, orders and metadata permanently!`)) {
      setDeletingShopId(shop.id);
      try {
        await catalogApi.deleteShop(shop.id);
        alert('Shop deleted successfully');
        refreshAllData();
        window.location.hash = '/stores'; // Simple redirect backup
      } catch (err: any) {
        alert(err.message || 'Failed to delete shop');
      } finally {
        setDeletingShopId(null);
      }
    }
  };

  const handleSeedDemoData = async (shopId: string) => {
    setSeedingId(shopId);
    try {
      await catalogApi.seedDemoData(shopId);
      alert('Demo data seeded successfully!');
      refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data');
    } finally {
      setSeedingId(null);
    }
  };

  const handleProvisionStore = async (data: any) => {
    setSavingEdit(true);
    try {
      const generatedPassword = `${data.slug}@OakSol2026`;
      const res = await catalogApi.registerShop({
        name: data.name,
        slug: data.slug,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPassword: generatedPassword,
      });
      refreshAllData();
      setSavingEdit(false);
      return {
        shopId: res.shopId || 'success',
        credentials: {
          email: data.ownerEmail,
          password: generatedPassword,
          loginUrl: `http://${data.slug}.localhost:3000/admin`,
        },
      };
    } catch (err: any) {
      alert(err.message || 'Failed to provision store');
      setSavingEdit(false);
      return null;
    }
  };

  const handleSaveEditShop = async (editData: any) => {
    if (!editingShop) return;
    setSavingEdit(true);
    try {
      await catalogApi.updateShop(editingShop.id, editData);
      alert('Shop details updated successfully');
      setEditingShop(null);
      refreshAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update shop details');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-app">
        <AdminStyles />
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="admin-app">
      <AdminStyles />
      <div className="shell">
        <Sidebar
          pendingRequestsCount={requests.filter(r => r.status === 'pending').length}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="main">
          <Routes>
            <Route path="/" element={
              <DashboardPage
                stats={stats}
                shops={shops}
                requests={requests}
                loading={loadingStats || loadingShops || loadingRequests}
                onApprove={handleApproveRequest}
                approvingId={approvingId}
              />
            } />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/stores" element={
              <StoresPage
                shops={shops}
                loading={loadingShops}
              />
            } />
            <Route path="/stores/:slug" element={
              <StoreDetailPage
                onEdit={setEditingShop}
                onDelete={handleDeleteShop}
                onSeedDemo={handleSeedDemoData}
                seedingId={seedingId}
                deletingId={deletingShopId}
              />
            } />
            <Route path="/requests" element={
              <RequestsPage
                requests={requests}
                loading={loadingRequests}
                approvingId={approvingId}
                rejectingId={rejectingId}
                deletingId={deletingRequestId}
                onRefresh={fetchRequests}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onDelete={handleDeleteRequest}
              />
            } />
            <Route path="/onboard" element={
              <OnboardPage
                onProvision={handleProvisionStore}
                provisioning={savingEdit}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      {editingShop && (
        <EditShopModal
          shop={editingShop}
          onClose={() => setEditingShop(null)}
          onSave={handleSaveEditShop}
          saving={savingEdit}
        />
      )}

      {credentials && (
        <CredentialsModal
          data={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AdminDashboardAppContent />
    </Router>
  );
}

export default App;
