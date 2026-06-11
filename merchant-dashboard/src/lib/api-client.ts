/* @oaksol/api-client - Fetch API Client Configuration */

const PLATFORM_DOMAIN = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) || 'posix.digital';

const getApiBaseUrl = (): string => {
  // 1. Check current domain context first to restrict/enforce production API
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Only use the production API on the platform domain and its subdomains
    const isProdDomain = 
      hostname === PLATFORM_DOMAIN || 
      hostname.endsWith(`.${PLATFORM_DOMAIN}`);

    if (isProdDomain) {
      return `https://api.${PLATFORM_DOMAIN}/api/v1`;
    }
  }

  // 2. Otherwise, check if NEXT_PUBLIC_API_URL is explicitly set in env (e.g., from the shared .env file)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 3. Fallback for local development
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Base Request Helper
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  // Resolve host context from browser to identify current tenant subdomain/domain
  let tenantDomain = '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts[0] === 'app' || hostname === 'localhost' || hostname === '127.0.0.1' || parts.length < 2) {
      const activeShop = localStorage.getItem('oaksol_active_shop_slug') || 'aftab';
      tenantDomain = `${activeShop}.localhost`;
    } else {
      tenantDomain = window.location.host;
    }
  }


  // Get platform admin token if saved
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('oaksol_admin_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(tenantDomain ? { 'X-Tenant-Domain': tenantDomain } : {}),
    ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { message: errorText };
      }
      
      const isMissingTenant = response.status === 404 && (
        (errorJson.message && (
          errorJson.message.includes('Store domain mapping') || 
          errorJson.message.includes('Tenant-Domain')
        ))
      );

      if (isMissingTenant && typeof window !== 'undefined') {
        const host = window.location.host;
        const protocol = window.location.protocol;
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
          window.location.href = `${protocol}//localhost${port}`;
        } else {
          window.location.href = `${protocol}//${PLATFORM_DOMAIN}`;
        }
        // Return a promise that never resolves/rejects to prevent component from executing further logic while redirecting
        return new Promise<T>(() => {});
      }

      const err = new Error(errorJson.message || `HTTP error! Status: ${response.status}`) as any;
      err.status = response.status;
      throw err;
    }

    return (await response.json()) as T;
  } catch (error: any) {
    console.error(`API Request failed on ${url}:`, error.message);
    throw error;
  }
}

// ─── Storefront / Catalog APIs ───────────────────────────────────────────────
export const catalogApi = {
  // 1. Homepage banners & sections
  getHomepage: async () => request<any>('/catalog/homepage'),

  // 2. Products list
  getProducts: async (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/catalog/products?${query}`);
  },

  // 3. Single product detail
  getProduct: async (slug: string) => request<any>(`/catalog/products/${slug}`),

  // 4. Categories
  getCategories: async () => request<any>('/catalog/categories'),

  // 5. Brands
  getBrands: async () => request<any>('/catalog/brands'),

  // ─── Merchant Admin (write operations, scoped to current tenant) ───────────
  createProduct: async (productData: any, token?: string) =>
    request<any>('/catalog/admin/products', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(productData),
    }),

  createBanner: async (bannerData: any, token?: string) =>
    request<any>('/catalog/admin/banners', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(bannerData),
    }),

  createSection: async (sectionData: any, token?: string) =>
    request<any>('/catalog/admin/sections', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(sectionData),
    }),

  getProductById: async (id: string, token?: string) =>
    request<any>(`/catalog/admin/products/${id}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  updateProduct: async (id: string, productData: any, token?: string) =>
    request<any>(`/catalog/admin/products/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(productData),
    }),

  deleteProduct: async (id: string, token?: string) =>
    request<any>(`/catalog/admin/products/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  createCategory: async (categoryData: any, token?: string) =>
    request<any>('/catalog/admin/categories', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(categoryData),
    }),

  updateCategory: async (id: string, categoryData: any, token?: string) =>
    request<any>(`/catalog/admin/categories/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(categoryData),
    }),

  deleteCategory: async (id: string, token?: string) =>
    request<any>(`/catalog/admin/categories/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  deleteBanner: async (id: string, token?: string) =>
    request<any>(`/catalog/admin/banners/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  getOrders: async (token?: string) =>
    request<any>('/catalog/admin/orders', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  updateOrderStatus: async (id: string, status: string, note?: string, token?: string) =>
    request<any>(`/catalog/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ status, note }),
    }),

  // ── Review Management ──────────────────────────────────────────────────────
  getProductReviews: async (productId: string, token?: string) =>
    request<any>(`/catalog/admin/products/${productId}/reviews`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  createReview: async (productId: string, reviewData: {
    reviewer_name?: string;
    rating: number;
    title?: string;
    body?: string;
    status?: string;
  }, token?: string) =>
    request<any>(`/catalog/admin/products/${productId}/reviews`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(reviewData),
    }),

  updateReviewStatus: async (reviewId: string, status: string, token?: string) =>
    request<any>(`/catalog/admin/reviews/${reviewId}/status`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ status }),
    }),

  deleteReview: async (reviewId: string, token?: string) =>
    request<any>(`/catalog/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // ── Variant & Stock Management ─────────────────────────────────────────────
  getProductVariants: async (productId: string) =>
    request<any>(`/catalog/admin/products/${productId}/variants`),

  createVariant: async (productId: string, dto: {
    label?: string; sku?: string; price: number;
    compare_price?: number; cost_price?: number;
    stock_qty?: number; low_stock_at?: number;
    image_url?: string; is_active?: boolean;
  }) =>
    request<any>(`/catalog/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateVariant: async (variantId: string, dto: {
    label?: string; price?: number; compare_price?: number;
    cost_price?: number; low_stock_at?: number;
    image_url?: string; is_active?: boolean; sort_order?: number;
  }) =>
    request<any>(`/catalog/admin/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteVariant: async (variantId: string) =>
    request<any>(`/catalog/admin/variants/${variantId}`, { method: 'DELETE' }),

  adjustStock: async (variantId: string, data: {
    adjustment: number; type?: string; note?: string;
  }) =>
    request<any>(`/catalog/admin/variants/${variantId}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStockLogs: async (productId: string) =>
    request<any>(`/catalog/admin/products/${productId}/stock-logs`),

  getInventoryOverview: async () =>
    request<any>('/catalog/admin/inventory'),

  // ─── Public tenant signup ──────────────────────────────────────────────────
  submitTenantRequest: async (requestData: {
    name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string
  }) => request<any>('/catalog/tenant-requests', { method: 'POST', body: JSON.stringify(requestData) }),

  // ─── Platform Super Admin APIs ────────────────────────────────────────────
  // Admin Login
  adminLogin: async (data: { email: string; password: string }) =>
    request<{ token: string }>('/catalog/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard stats
  getAdminStats: async () => request<any>('/catalog/admin/stats'),

  // Shops
  getShops: async () => request<any>('/catalog/admin/shops'),
  getShopDetail: async (id: string) => request<any>(`/catalog/admin/shops/${id}`),

  updateShop: async (id: string, dto: { name?: string; plan?: string; status?: string; description?: string }) =>
    request<any>(`/catalog/admin/shops/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteShop: async (id: string) =>
    request<any>(`/catalog/admin/shops/${id}`, { method: 'DELETE' }),

  seedDemoData: async (shopId: string) =>
    request<any>(`/catalog/admin/shops/${shopId}/seed-demo`, { method: 'POST' }),

  registerShop: async (shopData: {
    name: string; slug: string; ownerEmail: string; ownerName: string; ownerPassword?: string
  }) => request<any>('/catalog/register-shop', { method: 'POST', body: JSON.stringify(shopData) }),

  // Tenant requests
  getTenantRequests: async () => request<any>('/catalog/admin/tenant-requests'),

  approveTenantRequest: async (id: string) =>
    request<any>(`/catalog/admin/tenant-requests/${id}/approve`, { method: 'POST' }),

  rejectTenantRequest: async (id: string) =>
    request<any>(`/catalog/admin/tenant-requests/${id}/reject`, { method: 'POST' }),

  deleteTenantRequest: async (id: string) =>
    request<any>(`/catalog/admin/tenant-requests/${id}`, { method: 'DELETE' }),

  placeOrder: async (orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: any;
    payment_method: string;
    notes?: string;
    items: { variant_id: string; qty: number }[];
  }) => request<any>('/catalog/orders', { method: 'POST', body: JSON.stringify(orderData) }),

  // Get public order details for the payment page (tenant-scoped)
  getPublicOrder: async (orderId: string) =>
    request<any>(`/catalog/orders/${orderId}`),
};

// ─── Payment APIs ─────────────────────────────────────────────────────────────
export const paymentApi = {
  getPaymentGateways: async () =>
    request<any[]>('/payments/gateways'),

  getAdminPaymentGateways: async () =>
    request<any[]>('/payments/admin/gateways'),

  updateAdminPaymentGateway: async (id: string, data: {
    name?: string;
    is_active?: boolean;
    config?: any;
    sort_order?: number;
  }) => request<any>(`/payments/admin/gateways/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createRazorpayOrder: async (orderData: { amount: number; currency?: string; receiptId: string }) =>
    request<any>('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(orderData) }),

  // Initialize Razorpay payment for an existing pending order
  initializeRazorpayPayment: async (orderId: string) =>
    request<any>(`/payments/razorpay/initialize/${orderId}`, { method: 'POST' }),

  verifyPayment: async (data: {
    orderId: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => request<any>('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Customer Auth APIs ───────────────────────────────────────────────────────
export const customerApi = {
  register: async (data: { name: string; email: string; phone?: string; password: string }) =>
    request<{ customer: any; token: string }>('/catalog/customer/register', {
      method: 'POST', body: JSON.stringify(data),
    }),

  login: async (data: { email: string; password: string }) =>
    request<{ customer: any; token: string }>('/catalog/customer/login', {
      method: 'POST', body: JSON.stringify(data),
    }),

  getMe: async (token: string) =>
    request<any>('/catalog/customer/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateMe: async (data: {
    name?: string; phone?: string; avatar_url?: string;
    current_password?: string; new_password?: string;
  }, token: string) =>
    request<any>('/catalog/customer/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getMyOrders: async (token: string) =>
    request<any[]>('/catalog/customer/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPages: async () =>
    request<{ shop: any; content: Record<string, string> }>('/catalog/pages'),

  savePages: async (data: Record<string, string>) =>
    request<{ success: boolean; saved: number }>('/catalog/pages', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submitContact: async (data: { name: string; email: string; subject?: string; message: string }) =>
    request<{ success: boolean; message: string }>('/catalog/contact', {
      method: 'POST', body: JSON.stringify(data),
    }),
};

// ─── Page Builder APIs ─────────────────────────────────────────────────────────
export const pageBuilderApi = {
  getPages: async () => request<any[]>('/page-builder/pages'),
  getPageById: async (id: string) => request<any>(`/page-builder/pages/${id}`),
  getPageBySlug: async (slug: string) => request<any>(`/page-builder/pages/by-slug/${slug}`),
  savePage: async (data: any) =>
    request<any>('/page-builder/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishPage: async (id: string) =>
    request<any>(`/page-builder/pages/${id}/publish`, {
      method: 'POST',
    }),
  deletePage: async (id: string) =>
    request<any>(`/page-builder/pages/${id}`, {
      method: 'DELETE',
    }),
};

