/* @oaksol/merchant-api-client
 *
 * Route convention (matches backend controllers):
 *   /api/v1/storefront/*  — public shop data (used sparingly here)
 *   /api/v1/merchant/*    — merchant-scoped admin operations (main use)
 *   /api/v1/platform/*    — super-admin only (login/stats/shops/team)
 *   /api/v1/customer/*    — customer auth & account (not used here)
 *   /api/v1/payments/*    — payment gateways
 */

const PLATFORM_DOMAIN = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) || 'gooak.shop';

const getApiBaseUrl = (tenantDomain?: string): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
      return 'http://localhost:5001/api/v1';
    }

    if (tenantDomain) {
      return `${protocol}//${tenantDomain}/api`;
    }
    return `${protocol}//${hostname}/api`;
  }

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5001/api/v1';
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let tenantDomain = '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts[0] === 'app' || hostname === 'localhost' || hostname === '127.0.0.1' || parts.length < 2) {
      const activeShop = localStorage.getItem('oaksol_active_shop_slug') || 'testShop';
      tenantDomain = `${activeShop}.localhost`;
    } else {
      tenantDomain = window.location.host;
    }
  }

  const url = `${getApiBaseUrl(tenantDomain)}${path}`;

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('oaksol_admin_token') : null;

  // Platform routes (/platform/*) don't need a tenant domain header
  const isPlatformRoute = path.startsWith('/platform/');
  const isMultipart = options.body instanceof FormData;

  const headers = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(!isPlatformRoute && tenantDomain ? { 'X-Tenant-Domain': tenantDomain } : {}),
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
        errorJson.message && (
          errorJson.message.includes('Store domain mapping') ||
          errorJson.message.includes('Tenant-Domain')
        )
      );

      if (isMissingTenant && typeof window !== 'undefined') {
        const host = window.location.host;
        const protocol = window.location.protocol;
        let targetHost = '';
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
          targetHost = `localhost${port}`;
        } else {
          targetHost = PLATFORM_DOMAIN;
        }

        if (host !== targetHost) {
          window.location.href = `${protocol}//${targetHost}`;
          return new Promise<T>(() => {});
        }
        console.warn(`[api-client] Tenant mapping missing, but already on fallback host '${host}'. Preventing infinite reload loop.`);
      }

      const err = new Error(errorJson.message || `HTTP error! Status: ${response.status}`) as any;
      err.status = response.status;
      throw err;
    }

    const text = await response.text();
    if (!text || !text.trim()) return null as any;
    return JSON.parse(text) as T;
  } catch (error: any) {
    console.error(`API Request failed on ${url}:`, error.message);
    throw error;
  }
}

// ─── Storefront APIs (read-only shop data) ────────────────────────────────────
export const storefrontApi = {
  getHomepage: () => request<any>('/storefront/homepage'),
  getProducts: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/storefront/products?${query}`);
  },
  getProduct: (slug: string) => request<any>(`/storefront/products/${slug}`),
  getCategories: () => request<any>('/storefront/categories'),
  getBrands: () => request<any>('/storefront/brands'),
};

// ─── Merchant APIs (shop-scoped admin operations) ─────────────────────────────
export const merchantApi = {
  // Auth — merchants currently authenticate via the platform admin login endpoint.
  // TODO: implement a dedicated /merchant/auth/login once merchant-scoped auth is built.
  login: (data: { email: string; password: string }) =>
    request<any>('/platform/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  updateSettings: (dto: { name?: string; description?: string; logo_url?: string; currency?: string; timezone?: string }) =>
    request<any>('/merchant/settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  switchTheme: (dto: { industry: string; theme: string }) =>
    request<any>('/merchant/theme', { method: 'POST', body: JSON.stringify(dto) }),

  updateAdvancedSettings: (dto: { slug?: string; status?: string; db_connection_url?: string }) =>
    request<any>('/merchant/settings/advanced', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Subscription
  getSubscription: () => request<any>('/merchant/subscription'),

  // Dashboard stats
  getStats: () => request<any>('/merchant/stats'),

  // File upload
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/merchant/upload', { method: 'POST', body: formData });
  },

  // Products
  createProduct: (dto: any) =>
    request<any>('/merchant/products', { method: 'POST', body: JSON.stringify(dto) }),

  getProductById: (id: string) => request<any>(`/merchant/products/${id}`),

  updateProduct: (id: string, dto: any) =>
    request<any>(`/merchant/products/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteProduct: (id: string) =>
    request<any>(`/merchant/products/${id}`, { method: 'DELETE' }),

  // Variants
  getProductVariants: (productId: string) =>
    request<any>(`/merchant/products/${productId}/variants`),

  createVariant: (productId: string, dto: {
    label?: string; sku?: string; price: number;
    compare_price?: number; cost_price?: number;
    stock_qty?: number; low_stock_at?: number;
    image_url?: string; is_active?: boolean;
  }) =>
    request<any>(`/merchant/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(dto) }),

  updateVariant: (variantId: string, dto: {
    label?: string; price?: number; compare_price?: number;
    cost_price?: number; low_stock_at?: number;
    image_url?: string; is_active?: boolean; sort_order?: number;
  }) =>
    request<any>(`/merchant/variants/${variantId}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteVariant: (variantId: string) =>
    request<any>(`/merchant/variants/${variantId}`, { method: 'DELETE' }),

  // Inventory
  adjustStock: (variantId: string, data: { adjustment: number; type?: string; note?: string }) =>
    request<any>(`/merchant/variants/${variantId}/stock`, { method: 'POST', body: JSON.stringify(data) }),

  getStockLogs: (productId: string) =>
    request<any>(`/merchant/products/${productId}/stock-logs`),

  getInventoryOverview: () => request<any>('/merchant/inventory'),

  // Categories
  createCategory: (dto: any) =>
    request<any>('/merchant/categories', { method: 'POST', body: JSON.stringify(dto) }),

  updateCategory: (id: string, dto: any) =>
    request<any>(`/merchant/categories/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteCategory: (id: string) =>
    request<any>(`/merchant/categories/${id}`, { method: 'DELETE' }),

  // Collections
  getCollections: () => request<any[]>('/merchant/collections'),

  createCollection: (dto: any) =>
    request<any>('/merchant/collections', { method: 'POST', body: JSON.stringify(dto) }),

  // Orders
  getOrders: () => request<any>('/merchant/orders'),

  updateOrderStatus: (id: string, status: string, note?: string, extra?: {
    courier_name?: string; tracking_number?: string; tracking_url?: string;
    dispatched_at?: string; expected_delivery_at?: string;
    fulfillment_status?: string; staff_notes?: string;
    return_status?: string; paid_amount?: number; payment_method?: string;
  }) =>
    request<any>(`/merchant/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, ...(extra || {}) }),
    }),

  // Reviews
  getProductReviews: (productId: string) =>
    request<any>(`/merchant/products/${productId}/reviews`),

  createReview: (productId: string, dto: {
    reviewer_name?: string; rating: number; title?: string; body?: string; status?: string;
  }) =>
    request<any>(`/merchant/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(dto) }),

  updateReviewStatus: (reviewId: string, status: string) =>
    request<any>(`/merchant/reviews/${reviewId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  deleteReview: (reviewId: string) =>
    request<any>(`/merchant/reviews/${reviewId}`, { method: 'DELETE' }),

  // Banners
  getBanners: () => request<any[]>('/merchant/banners'),
  getBannerById: (id: string) => request<any>(`/merchant/banners/${id}`),
  createBanner: (dto: any) => request<any>('/merchant/banners', { method: 'POST', body: JSON.stringify(dto) }),
  updateBanner: (id: string, dto: any) => request<any>(`/merchant/banners/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteBanner: (id: string) => request<any>(`/merchant/banners/${id}`, { method: 'DELETE' }),

  // Homepage sections
  createSection: (dto: any) =>
    request<any>('/merchant/sections', { method: 'POST', body: JSON.stringify(dto) }),

  getHomeSections: () => request<any[]>('/merchant/home-sections'),

  updateHomeSection: (dto: any) =>
    request<any>('/merchant/home-sections', { method: 'PATCH', body: JSON.stringify(dto) }),

  // CMS Pages
  getPages: () => request<any[]>('/merchant/pages'),
  getPageById: (id: string) => request<any>(`/merchant/pages/${id}`),
  createPage: (dto: any) => request<any>('/merchant/pages', { method: 'POST', body: JSON.stringify(dto) }),
  updatePage: (id: string, dto: any) => request<any>(`/merchant/pages/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deletePage: (id: string) => request<any>(`/merchant/pages/${id}`, { method: 'DELETE' }),

  // Static page text content (About, Privacy, Terms)
  getPageContent: () => request<any>('/merchant/page-content'),
  savePageContent: (dto: Record<string, string>) =>
    request<any>('/merchant/page-content', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Blog
  getBlogs: () => request<any[]>('/merchant/blog'),
  getBlogById: (id: string) => request<any>(`/merchant/blog/${id}`),
  createBlog: (dto: any) => request<any>('/merchant/blog', { method: 'POST', body: JSON.stringify(dto) }),
  updateBlog: (id: string, dto: any) => request<any>(`/merchant/blog/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteBlog: (id: string) => request<any>(`/merchant/blog/${id}`, { method: 'DELETE' }),

  // Media
  getMedia: () => request<any[]>('/merchant/media'),
  createMedia: (dto: any) => request<any>('/merchant/media', { method: 'POST', body: JSON.stringify(dto) }),
  deleteMedia: (id: string) => request<any>(`/merchant/media/${id}`, { method: 'DELETE' }),

  // FAQs
  getFaqs: () => request<any[]>('/merchant/faqs'),
  createFaq: (dto: any) => request<any>('/merchant/faqs', { method: 'POST', body: JSON.stringify(dto) }),
  updateFaq: (id: string, dto: any) => request<any>(`/merchant/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteFaq: (id: string) => request<any>(`/merchant/faqs/${id}`, { method: 'DELETE' }),

  // Testimonials
  getTestimonials: () => request<any[]>('/merchant/testimonials'),
  createTestimonial: (dto: any) => request<any>('/merchant/testimonials', { method: 'POST', body: JSON.stringify(dto) }),
  updateTestimonial: (id: string, dto: any) => request<any>(`/merchant/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteTestimonial: (id: string) => request<any>(`/merchant/testimonials/${id}`, { method: 'DELETE' }),

  // Staff users
  getUsers: () => request<any>('/merchant/users'),
  addUser: (dto: { name: string; email: string; password?: string; role?: string }) =>
    request<any>('/merchant/users', { method: 'POST', body: JSON.stringify(dto) }),
  deleteUser: (id: string) => request<any>(`/merchant/users/${id}`, { method: 'DELETE' }),

  // Custom domains
  getDomains: () => request<any>('/merchant/domains'),
  addDomain: (dto: { domain: string }) =>
    request<any>('/merchant/domains', { method: 'POST', body: JSON.stringify(dto) }),
  verifyDomain: (id: string) =>
    request<any>(`/merchant/domains/${id}/verify`, { method: 'POST' }),
  setPrimaryDomain: (id: string) =>
    request<any>(`/merchant/domains/${id}/primary`, { method: 'PATCH' }),
  deleteDomain: (id: string) => request<any>(`/merchant/domains/${id}`, { method: 'DELETE' }),

  // Config overrides
  getConfigs: () => request<any>('/merchant/configs'),
  saveConfig: (dto: { key: string; value: string }) =>
    request<any>('/merchant/configs/override', { method: 'POST', body: JSON.stringify(dto) }),
  deleteConfig: (key: string) =>
    request<any>(`/merchant/configs/override/${key}`, { method: 'DELETE' }),

  // Backups
  getJsonBackup: () => request<any>('/merchant/backup/json'),
  getSqlBackup: () => request<any>('/merchant/backup/sql'),

  // Returns Management
  getReturns: () => request<any[]>('/merchant/returns'),
  getReturnById: (id: string) => request<any>(`/merchant/returns/${id}`),
  createReturn: (dto: {
    order_id: string;
    reason: string;
    images?: string[];
    customer_note?: string;
    items: Array<{ variant_id: string; qty: number; price: number }>;
  }) =>
    request<any>('/merchant/returns', { method: 'POST', body: JSON.stringify(dto) }),
  updateReturnStatus: (id: string, dto: {
    status: string;
    staff_note?: string;
    refund_amount?: number;
    refund_method?: string;
  }) =>
    request<any>(`/merchant/returns/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // Invoices Management
  getInvoices: () => request<any[]>('/merchant/invoices'),
  getInvoiceById: (id: string) => request<any>(`/merchant/invoices/${id}`),
  createInvoice: (orderId: string) => request<any>(`/merchant/orders/${orderId}/invoice`, { method: 'POST' }),
  updateInvoiceStatus: (id: string, status: string) =>
    request<any>(`/merchant/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  logInvoicePrint: (id: string) => request<any>(`/merchant/invoices/${id}/print`, { method: 'POST' }),
  emailInvoice: (id: string) => request<any>(`/merchant/invoices/${id}/email`, { method: 'POST' }),
};

// ─── Platform APIs (super-admin only, no tenant context) ──────────────────────
export const platformApi = {
  login: (data: { email: string; password: string }) =>
    request<{ token: string; admin?: { id: string; email: string; name: string; level: number } }>(
      '/platform/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  getStats: () => request<any>('/platform/stats'),

  // Shops
  getShops: () => request<any>('/platform/shops'),
  getShopDetail: (id: string) => request<any>(`/platform/shops/${id}`),
  registerShop: (dto: {
    name: string; slug: string; ownerEmail: string; ownerName: string;
    ownerPassword?: string; industry?: string; theme?: string;
  }) => request<any>('/platform/shops', { method: 'POST', body: JSON.stringify(dto) }),
  updateShop: (id: string, dto: { name?: string; plan?: string; status?: string; description?: string }) =>
    request<any>(`/platform/shops/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteShop: (id: string) => request<any>(`/platform/shops/${id}`, { method: 'DELETE' }),

  // Tenant signup requests
  getRequests: () => request<any>('/platform/requests'),
  approveRequest: (id: string) =>
    request<any>(`/platform/requests/${id}/approve`, { method: 'POST' }),
  rejectRequest: (id: string) =>
    request<any>(`/platform/requests/${id}/reject`, { method: 'POST' }),
  deleteRequest: (id: string) => request<any>(`/platform/requests/${id}`, { method: 'DELETE' }),

  // Platform team
  getTeam: () => request<any[]>('/platform/team'),
  getAdminDetail: (id: string) => request<any>(`/platform/team/${id}`),
  createAdmin: (dto: { name: string; email: string; password?: string; permissions?: string[] }) =>
    request<any>('/platform/team', { method: 'POST', body: JSON.stringify(dto) }),
  updateAdmin: (id: string, dto: { status?: string; permissions?: string[] }) =>
    request<any>(`/platform/team/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteAdmin: (id: string) => request<any>(`/platform/team/${id}`, { method: 'DELETE' }),
};

// ─── Payment APIs ─────────────────────────────────────────────────────────────
export const paymentApi = {
  getPublicGateways: () => request<any[]>('/payments/gateways'),

  getMerchantGateways: () => request<any[]>('/payments/merchant/gateways'),

  updateGateway: (id: string, data: {
    name?: string; is_active?: boolean; config?: any; sort_order?: number;
  }) => request<any>(`/payments/merchant/gateways/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createRazorpayOrder: (data: { amount: number; currency?: string; receiptId: string }) =>
    request<any>('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(data) }),

  initializeRazorpayPayment: (orderId: string) =>
    request<any>(`/payments/razorpay/initialize/${orderId}`, { method: 'POST' }),

  verifyPayment: (data: {
    orderId: string; razorpay_payment_id: string;
    razorpay_order_id: string; razorpay_signature: string;
  }) => request<any>('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Backwards-compatible aliases (used by existing page components) ──────────
// Remove these once page components are updated to use named exports above.

/** @deprecated use merchantApi */
export const catalogApi = {
  getHomepage: storefrontApi.getHomepage,
  getProducts: storefrontApi.getProducts,
  getProduct: storefrontApi.getProduct,
  getCategories: storefrontApi.getCategories,
  getBrands: storefrontApi.getBrands,
  merchantLogin: merchantApi.login,
  uploadFile: merchantApi.uploadFile,
  createProduct: merchantApi.createProduct,
  createSection: merchantApi.createSection,
  getProductById: merchantApi.getProductById,
  updateProduct: merchantApi.updateProduct,
  getCollections: merchantApi.getCollections,
  createCollection: merchantApi.createCollection,
  deleteProduct: merchantApi.deleteProduct,
  createCategory: merchantApi.createCategory,
  updateCategory: merchantApi.updateCategory,
  deleteCategory: merchantApi.deleteCategory,
  getOrders: merchantApi.getOrders,
  updateOrderStatus: merchantApi.updateOrderStatus,
  getProductReviews: merchantApi.getProductReviews,
  createReview: merchantApi.createReview,
  updateReviewStatus: merchantApi.updateReviewStatus,
  deleteReview: merchantApi.deleteReview,
  getProductVariants: merchantApi.getProductVariants,
  createVariant: merchantApi.createVariant,
  updateVariant: merchantApi.updateVariant,
  deleteVariant: merchantApi.deleteVariant,
  adjustStock: merchantApi.adjustStock,
  getStockLogs: merchantApi.getStockLogs,
  getInventoryOverview: merchantApi.getInventoryOverview,
  submitTenantRequest: (dto: any) =>
    request<any>('/storefront/requests', { method: 'POST', body: JSON.stringify(dto) }),
  adminLogin: platformApi.login,
  getAdminStats: platformApi.getStats,
  getShops: platformApi.getShops,
  getShopDetail: platformApi.getShopDetail,
  updateShop: platformApi.updateShop,
  updateMerchantSettings: merchantApi.updateSettings,
  switchMerchantTheme: merchantApi.switchTheme,
  deleteShop: platformApi.deleteShop,
  registerShop: platformApi.registerShop,
  getTenantRequests: platformApi.getRequests,
  approveTenantRequest: platformApi.approveRequest,
  rejectTenantRequest: platformApi.rejectRequest,
  deleteTenantRequest: platformApi.deleteRequest,
  placeOrder: (dto: any) =>
    request<any>('/storefront/orders', { method: 'POST', body: JSON.stringify(dto) }),
  getPublicOrder: (id: string) => request<any>(`/storefront/orders/${id}`),
  getShopStats: merchantApi.getStats,
  getShopUsers: merchantApi.getUsers,
  addShopUser: merchantApi.addUser,
  deleteShopUser: merchantApi.deleteUser,
  getShopDomains: merchantApi.getDomains,
  addShopDomain: merchantApi.addDomain,
  verifyDomain: merchantApi.verifyDomain,
  setPrimaryDomain: merchantApi.setPrimaryDomain,
  deleteShopDomain: merchantApi.deleteDomain,
  getConfigOverrides: merchantApi.getConfigs,
  saveConfigOverride: merchantApi.saveConfig,
  deleteConfigOverride: merchantApi.deleteConfig,
  updateAdvancedSettings: merchantApi.updateAdvancedSettings,
  getJsonBackup: merchantApi.getJsonBackup,
  getSqlBackup: merchantApi.getSqlBackup,
  getAdminPages: merchantApi.getPages,
  getAdminPageById: merchantApi.getPageById,
  createAdminPage: merchantApi.createPage,
  updateAdminPage: merchantApi.updatePage,
  deleteAdminPage: merchantApi.deletePage,
  getAdminBanners: merchantApi.getBanners,
  getAdminBannerById: merchantApi.getBannerById,
  createAdminBanner: merchantApi.createBanner,
  updateAdminBanner: merchantApi.updateBanner,
  deleteAdminBanner: merchantApi.deleteBanner,
  getAdminBlogs: merchantApi.getBlogs,
  getAdminBlogById: merchantApi.getBlogById,
  createAdminBlog: merchantApi.createBlog,
  updateAdminBlog: merchantApi.updateBlog,
  deleteAdminBlog: merchantApi.deleteBlog,
  getAdminMedia: merchantApi.getMedia,
  createAdminMedia: merchantApi.createMedia,
  deleteAdminMedia: merchantApi.deleteMedia,
  getAdminFaqs: merchantApi.getFaqs,
  createAdminFaq: merchantApi.createFaq,
  updateAdminFaq: merchantApi.updateFaq,
  deleteAdminFaq: merchantApi.deleteFaq,
  getAdminTestimonials: merchantApi.getTestimonials,
  createAdminTestimonial: merchantApi.createTestimonial,
  updateAdminTestimonial: merchantApi.updateTestimonial,
  deleteAdminTestimonial: merchantApi.deleteTestimonial,
  getAdminHomeSections: merchantApi.getHomeSections,
  updateAdminHomeSection: merchantApi.updateHomeSection,
};

/** @deprecated use platformApi */
export const platformTeamApi = {
  getTeam: platformApi.getTeam,
  getAdminDetail: platformApi.getAdminDetail,
  createAdmin: platformApi.createAdmin,
  updateAdmin: platformApi.updateAdmin,
  deleteAdmin: platformApi.deleteAdmin,
};
