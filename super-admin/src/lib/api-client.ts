/* @oaksol/platform-api-client
 *
 * Route convention (matches backend controllers):
 *   /api/v1/platform/*  — super-admin only (no tenant context)
 *
 * The super-admin app never calls /storefront/*, /merchant/*, or /customer/* routes.
 * Platform routes bypass TenantMiddleware (hostname: admin.* / api.*).
 * All requests carry a super_admin JWT in the Authorization header.
 */

const PLATFORM_DOMAIN = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) || 'posix.digital';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isProdDomain =
      hostname === PLATFORM_DOMAIN ||
      hostname.endsWith(`.${PLATFORM_DOMAIN}`);

    if (isProdDomain) {
      return `https://api.${PLATFORM_DOMAIN}/api/v1`;
    }
  }

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Super-admin uses the platform admin token, not the customer token
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('oaksol_admin_token') : null;

  const headers = {
    'Content-Type': 'application/json',
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

// ─── Platform Auth ────────────────────────────────────────────────────────────
export const platformAuthApi = {
  login: (data: { email: string; password: string }) =>
    request<{ token: string; admin?: { id: string; email: string; name: string; permissions?: string[] } }>(
      '/platform/auth/login',
      { method: 'POST', body: JSON.stringify(data) },
    ),
};

// ─── Platform Stats ───────────────────────────────────────────────────────────
export const platformStatsApi = {
  getStats: () => request<any>('/platform/stats'),
};

// ─── Platform Shops ───────────────────────────────────────────────────────────
export const platformShopsApi = {
  getShops: () => request<any>('/platform/shops'),

  getShopDetail: (id: string) => request<any>(`/platform/shops/${id}`),

  registerShop: (dto: {
    name: string; slug: string; ownerEmail: string; ownerName: string;
    ownerPassword?: string; industry?: string; theme?: string;
  }) => request<any>('/platform/shops', { method: 'POST', body: JSON.stringify(dto) }),

  updateShop: (id: string, dto: { name?: string; plan?: string; status?: string; description?: string }) =>
    request<any>(`/platform/shops/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteShop: (id: string) => request<any>(`/platform/shops/${id}`, { method: 'DELETE' }),

  // Theme switching is a merchant-scoped operation and must be done from the merchant-dashboard.
  // Super-admin does not have a /platform/* endpoint for this. The platform API bypasses
  // TenantMiddleware so no shopId context is available here.
  switchShopTheme: (_shopSlug: string, _dto: { industry: string; theme: string }): Promise<any> => {
    throw new Error('switchShopTheme must be called from the merchant-dashboard, not the super-admin app.');
  },
};

// ─── Platform Tenant Requests ─────────────────────────────────────────────────
export const platformRequestsApi = {
  getRequests: () => request<any>('/platform/requests'),

  approveRequest: (id: string) =>
    request<any>(`/platform/requests/${id}/approve`, { method: 'POST' }),

  rejectRequest: (id: string) =>
    request<any>(`/platform/requests/${id}/reject`, { method: 'POST' }),

  deleteRequest: (id: string) =>
    request<any>(`/platform/requests/${id}`, { method: 'DELETE' }),
};

// ─── Platform Team ────────────────────────────────────────────────────────────
export const platformTeamApi = {
  getTeam: () => request<any[]>('/platform/team'),

  getAdminDetail: (id: string) => request<any>(`/platform/team/${id}`),

  createAdmin: (data: { name: string; email: string; password?: string; permissions?: string[] }) =>
    request<any>('/platform/team', { method: 'POST', body: JSON.stringify(data) }),

  updateAdmin: (id: string, data: { status?: string; permissions?: string[] }) =>
    request<any>(`/platform/team/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteAdmin: (id: string) =>
    request<any>(`/platform/team/${id}`, { method: 'DELETE' }),
};

// ─── Subscription Plans ───────────────────────────────────────────────────────
export const platformPlansApi = {
  getPlans: () => request<any[]>('/platform/plans'),

  createPlan: (dto: {
    name: string; slug: string; level: number; is_free?: boolean; price: number;
    interval?: string; max_products?: number; max_orders?: number;
    features?: string[]; sort_order?: number;
  }) => request<any>('/platform/plans', { method: 'POST', body: JSON.stringify(dto) }),

  updatePlan: (id: string, dto: any) =>
    request<any>(`/platform/plans/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deletePlan: (id: string) =>
    request<any>(`/platform/plans/${id}`, { method: 'DELETE' }),

  // All subscriptions across all shops
  getAllSubscriptions: (filters?: { status?: string; plan_id?: string }) => {
    const params = filters ? '?' + new URLSearchParams(filters as any).toString() : '';
    return request<any[]>(`/platform/subscriptions${params}`);
  },

  // Per-shop subscription management
  getShopSubscription: (shopId: string) =>
    request<any>(`/platform/shops/${shopId}/subscription`),

  assignSubscription: (shopId: string, dto: {
    plan_id: string; status?: string; is_trial?: boolean; trial_ends_at?: string;
    current_period_start?: string; current_period_end?: string;
    next_payment_at?: string; promo_code?: string; payment_status?: string;
  }) => request<any>(`/platform/shops/${shopId}/subscription`, { method: 'POST', body: JSON.stringify(dto) }),

  cancelSubscription: (shopId: string, dto?: { reason?: string }) =>
    request<any>(`/platform/shops/${shopId}/subscription`, { method: 'DELETE', body: JSON.stringify(dto || {}) }),

  addAddon: (shopId: string, addonId: string, quantity?: number) =>
    request<any>(`/platform/shops/${shopId}/subscription/addons/${addonId}`, {
      method: 'POST', body: JSON.stringify({ quantity }),
    }),

  removeAddon: (shopId: string, addonId: string) =>
    request<any>(`/platform/shops/${shopId}/subscription/addons/${addonId}`, { method: 'DELETE' }),

  getPaymentHistory: (shopId: string) =>
    request<any[]>(`/platform/shops/${shopId}/subscription/payments`),

  recordPayment: (shopId: string, dto: {
    amount: number; currency?: string; status: string; gateway?: string;
    transaction_id?: string; invoice_url?: string; failure_reason?: string;
  }) => request<any>(`/platform/shops/${shopId}/subscription/payments`, {
    method: 'POST', body: JSON.stringify(dto),
  }),
};

// ─── Add-ons ─────────────────────────────────────────────────────────────────
export const platformAddonsApi = {
  getAddons: () => request<any[]>('/platform/addons'),

  createAddon: (dto: { name: string; slug: string; description?: string; price: number; interval?: string }) =>
    request<any>('/platform/addons', { method: 'POST', body: JSON.stringify(dto) }),

  updateAddon: (id: string, dto: any) =>
    request<any>(`/platform/addons/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteAddon: (id: string) =>
    request<any>(`/platform/addons/${id}`, { method: 'DELETE' }),
};

// ─── Promo Codes ─────────────────────────────────────────────────────────────
export const platformPromosApi = {
  getPromoCodes: () => request<any[]>('/platform/promos'),

  createPromoCode: (dto: {
    code: string; description?: string; discount_type: string; discount_value: number;
    applicable_plans?: string[]; max_uses?: number; starts_at?: string; expires_at?: string;
  }) => request<any>('/platform/promos', { method: 'POST', body: JSON.stringify(dto) }),

  validatePromoCode: (code: string, plan_slug: string) =>
    request<any>('/platform/promos/validate', { method: 'POST', body: JSON.stringify({ code, plan_slug }) }),

  updatePromoCode: (id: string, dto: any) =>
    request<any>(`/platform/promos/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  deletePromoCode: (id: string) =>
    request<any>(`/platform/promos/${id}`, { method: 'DELETE' }),
};

// ─── Backwards-compatible aliases (used by existing page components) ──────────
// Remove these once page components are updated to use named exports above.

/** @deprecated use platformAuthApi, platformShopsApi, platformRequestsApi, platformTeamApi */
export const catalogApi = {
  adminLogin: platformAuthApi.login,
  getAdminStats: platformStatsApi.getStats,
  getShops: platformShopsApi.getShops,
  getShopDetail: platformShopsApi.getShopDetail,
  updateShop: platformShopsApi.updateShop,
  deleteShop: platformShopsApi.deleteShop,
  switchMerchantTheme: platformShopsApi.switchShopTheme,
  registerShop: platformShopsApi.registerShop,
  getTenantRequests: platformRequestsApi.getRequests,
  approveTenantRequest: platformRequestsApi.approveRequest,
  rejectTenantRequest: platformRequestsApi.rejectRequest,
  deleteTenantRequest: platformRequestsApi.deleteRequest,
  placeOrder: () => { throw new Error('placeOrder must be called from storefront-live'); },
  getPublicOrder: () => { throw new Error('getPublicOrder must be called from storefront-live'); },
};
