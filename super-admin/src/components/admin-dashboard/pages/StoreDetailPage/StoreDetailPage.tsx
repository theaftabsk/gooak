import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi } from '@oaksol/api-client';
import { Icons } from '../../icons';
import { Badge, StatCard, DataTable, InfoRow, EmptyState, LoadingSpinner } from '../../shared';
import { storeDomainLabel, storeUrl, storeAdminUrl } from '../../utils';

interface StoreDetailPageProps {
  onEdit: (shop: any) => void;
  onDelete: (shop: any) => void;
  onSeedDemo: (shopId: string) => void;
  seedingId: string | null;
  deletingId: string | null;
}

export const StoreDetailPage: React.FC<StoreDetailPageProps> = ({
  onEdit, onDelete, onSeedDemo, seedingId, deletingId
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchShopDetail = async (shopSlug: string) => {
    setLoading(true);
    try {
      const data = await catalogApi.getShopDetail(shopSlug);
      setShop(data || null);
    } catch (err) {
      console.error('Failed to fetch shop detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchShopDetail(slug);
    }
  }, [slug, seedingId]);

  const handleSeed = async () => {
    if (!shop?.id) return;
    await onSeedDemo(shop.id);
    fetchShopDetail(slug!);
  };

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-back" onClick={() => navigate('/stores')}><Icons.ArrowLeft /></button>
          <div>
            <h2>{loading ? 'Loading…' : shop?.name}</h2>
            <p className="header-sub">{shop?.slug ? storeDomainLabel(shop.slug) : ''}</p>
          </div>
        </div>
        {shop && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost-sm" onClick={handleSeed} disabled={seedingId === shop.id}>
              <Icons.Seed /> {seedingId === shop.id ? 'Seeding…' : 'Seed Demo Data'}
            </button>
            <button className="btn-ghost-sm" onClick={() => onEdit(shop)}>
              <Icons.Edit /> Edit
            </button>
            <button className="btn-danger-sm" onClick={() => onDelete(shop)} disabled={deletingId === shop.id}>
              <Icons.Trash /> {deletingId === shop.id ? 'Deleting…' : 'Delete Store'}
            </button>
          </div>
        )}
      </header>

      {loading ? <LoadingSpinner message="Fetching store configurations…" /> : shop ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Info + Credentials */}
          <div className="detail-grid">
            <div className="card">
              <h3 className="card-title">Store Configuration</h3>
              <InfoRow label="Shop Name" value={shop.name} />
              <InfoRow label="Database ID" value={shop.id} mono copy />
              <InfoRow label="Subdomain Slug" value={shop.slug} mono copy />
              <InfoRow label="SaaS Plan" value={<Badge type={shop.plan === 'pro' ? 'pro' : 'default'}>{shop.plan.toUpperCase()}</Badge>} />
              <InfoRow label="Status" value={<Badge type={shop.status === 'active' ? 'success' : 'warn'}>{shop.status.toUpperCase()}</Badge>} />
              <InfoRow label="Created" value={new Date(shop.created_at).toLocaleString()} />
              {shop.description && <InfoRow label="Description" value={shop.description} />}
              <InfoRow label="Store URL" value={
                <a href={shop.domains?.[0]?.domain ? `https://${shop.domains[0].domain}` : storeUrl(shop.slug)} target="_blank" rel="noreferrer" className="link-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {shop.domains?.[0]?.domain || storeDomainLabel(shop.slug)} <Icons.ExternalLink />
                </a>
              } />
            </div>

            <div className="card credentials-card">
              <h3 className="card-title">Merchant Credentials</h3>
              {shop.owner ? (
                <>
                  <InfoRow label="Owner Name" value={shop.owner.name} />
                  <InfoRow label="Owner ID" value={shop.owner.id} mono />
                  <InfoRow label="Email" value={shop.owner.email} copy highlight />
                  <InfoRow label="Password" value={shop.owner.password || `${shop.slug}@OakSol2026`} copy highlight />
                  <InfoRow label="Admin URL" value={storeAdminUrl(shop.slug)} copy highlight />
                  <div className="hash-block">
                    <div className="hash-label">Password Hash (bcrypt)</div>
                    <div className="hash-value">{shop.owner.password_hash}</div>
                  </div>
                  <div className="cred-note">Dev mode: any password accepted for login. Above hash is stored in DB.</div>
                </>
              ) : (
                <div className="warning-box">
                  <Icons.Warning /> No owner account found. Shop provisioning may have been interrupted.
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <StatCard label="Products" value={shop.products?.length || 0} icon={<Icons.Package />} />
            <StatCard label="Categories" value={shop.categories?.length || 0} icon={<Icons.Folder />} />
            <StatCard label="Banners" value={shop.banners?.length || 0} icon={<Icons.Image />} />
            <StatCard label="Sections" value={shop.product_sections?.length || 0} icon={<Icons.Settings />} />
          </div>

          {/* Products Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>Product Catalog ({shop.products?.length || 0})</h3>
              <button className="btn-ghost-sm" onClick={handleSeed} disabled={seedingId === shop.id}>
                <Icons.Seed /> {seedingId === shop.id ? 'Adding…' : 'Add Demo Products'}
              </button>
            </div>
            {!shop.products?.length
              ? <EmptyState message="No products. Click 'Add Demo Products' to seed sample catalog." />
              : (
                <DataTable
                  headers={['Product', 'Category', 'Price', 'Compare Price', 'Status']}
                  rows={shop.products.map((p: any) => [
                    <strong>{p.name}</strong>,
                    p.category?.name || '—',
                    `₹${parseFloat(p.price).toFixed(2)}`,
                    p.compare_price ? `₹${parseFloat(p.compare_price).toFixed(2)}` : '—',
                    <Badge type="success">{p.status.toUpperCase()}</Badge>
                  ])}
                />
              )}
          </div>

          {/* Categories Table */}
          <div className="card">
            <h3 className="card-title">Categories ({shop.categories?.length || 0})</h3>
            {!shop.categories?.length
              ? <EmptyState message="No categories defined." />
              : (
                <DataTable
                  headers={['Name', 'Slug', 'Status']}
                  rows={shop.categories.map((c: any) => [
                    <strong>{c.name}</strong>,
                    <code>{c.slug}</code>,
                    <Badge type={c.is_active ? 'success' : 'warn'}>{c.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>
                  ])}
                />
              )}
          </div>
        </div>
      ) : null}
    </>
  );
};
