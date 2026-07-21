'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { catalogApi } from '@oaksol/api-client';

interface DashboardDataContextValue {
  tenantSlug: string;
  shopInfo: any;
  products: any[];
  categories: any[];
  orders: any[];
  loading: boolean;
  creatingProduct: boolean;
  deletingProduct: boolean;
  creatingCategory: boolean;
  deletingCategory: boolean;
  updatingOrderStatus: boolean;
  savingSettings: boolean;
  refetch: () => void;
  createProduct: (data: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createCategory: (data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  updateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  saveSettings: (data: any) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children, tenantSlug }: { children: React.ReactNode; tenantSlug: string }) {
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const homeData = await catalogApi.getHomepage();
      setShopInfo(homeData.shop || { name: tenantSlug.toUpperCase(), slug: tenantSlug });

      const prods = await catalogApi.getProducts();
      setProducts(prods?.products || prods || []);

      setCategories(await catalogApi.getCategories() || []);

      try {
        const ords = await catalogApi.getOrders();
        setOrders(ords?.orders ?? (Array.isArray(ords) ? ords : []));
      } catch { setOrders([]); }
    } catch (err) {
      console.error('Dashboard data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createProduct = async (data: any) => {
    setCreatingProduct(true);
    try { await catalogApi.createProduct(data); alert('Product published!'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to publish product'); }
    finally { setCreatingProduct(false); }
  };

  const deleteProduct = async (id: string) => {
    setDeletingProduct(true);
    try { await catalogApi.deleteProduct(id); alert('Product deleted'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to delete product'); }
    finally { setDeletingProduct(false); }
  };

  const createCategory = async (data: any) => {
    setCreatingCategory(true);
    try { await catalogApi.createCategory(data); alert('Category added!'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to add category'); }
    finally { setCreatingCategory(false); }
  };

  const deleteCategory = async (id: string) => {
    setDeletingCategory(true);
    try { await catalogApi.deleteCategory(id); alert('Category deleted'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to delete category'); }
    finally { setDeletingCategory(false); }
  };

  const updateCategory = async (id: string, data: any) => {
    try { await catalogApi.updateCategory(id, data); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to update category'); }
  };

  const updateOrderStatus = async (id: string, status: string, note?: string) => {
    setUpdatingOrderStatus(true);
    try { await catalogApi.updateOrderStatus(id, status, note); alert('Order status updated!'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to update order status'); }
    finally { setUpdatingOrderStatus(false); }
  };

  const saveSettings = async (data: any) => {
    setSavingSettings(true);
    try { await catalogApi.updateMerchantSettings(data); alert('Settings saved!'); await fetchAll(); }
    catch (e: any) { alert(e.message || 'Failed to save settings'); }
    finally { setSavingSettings(false); }
  };

  return (
    <DashboardDataContext.Provider value={{
      tenantSlug, shopInfo, products, categories, orders, loading,
      creatingProduct, deletingProduct, creatingCategory, deletingCategory,
      updatingOrderStatus, savingSettings,
      refetch: fetchAll,
      createProduct, deleteProduct, createCategory, deleteCategory,
      updateCategory, updateOrderStatus, saveSettings,
    }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider');
  return ctx;
}
