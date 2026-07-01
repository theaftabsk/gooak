/* @oaksol/storefront-api-client
 *
 * Route convention (matches backend controllers):
 *   /api/v1/storefront/*  — public shop data (products, homepage, categories)
 *   /api/v1/customer/*    — customer auth & account (requires customer JWT)
 *   /api/v1/payments/*    — payment processing
 *
 * Storefront never calls /merchant/* or /platform/* routes directly.
 * Tenant is resolved by the backend via the X-Tenant-Domain header or subdomain.
 */

const PLATFORM_DOMAIN = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PLATFORM_DOMAIN) || 'posix.digital';

// Returns the value to send as X-Tenant-Domain header.
// - subdomain dev:    "testShop.localhost:3001/products" → hostname "testShop.localhost" → use as-is
// - plain localhost:  read shop slug from localStorage (key: oaksol_shop_slug), default "testShop"
// - production:       use the full hostname → "amir.posix.digital" or "www.mystore.com"
function getTenantDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const slug = localStorage.getItem('oaksol_shop_slug') || 'testShop';
    return `${slug}.localhost`;
  }

  return hostname;
}

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
      return 'http://localhost:5001/api/v1';
    }

    return `${protocol}//${hostname}/api/v1`;
  }

  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:5001/api/v1';
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tenantDomain = getTenantDomain();
  const url = `${getApiBaseUrl()}${path}`;

  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('oaksol_customer_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(tenantDomain ? { 'X-Tenant-Domain': tenantDomain } : {}),
    ...(customerToken ? { 'Authorization': `Bearer ${customerToken}` } : {}),
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
        console.warn(`[api-client] Tenant mapping missing, already on fallback host '${host}'.`);
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

// ─── Storefront APIs (public, tenant-scoped) ──────────────────────────────────
export const storefrontApi = {
  getHomepage: () => request<any>('/storefront/homepage'),

  getProducts: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/storefront/products?${query}`);
  },

  getProduct: (slug: string) => request<any>(`/storefront/products/${slug}`),

  getCategories: () => request<any>('/storefront/categories'),

  getBrands: () => request<any>('/storefront/brands'),

  getSettings: () => request<any>('/storefront/settings'),

  placeOrder: (dto: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: any;
    payment_method: string;
    notes?: string;
    items: { variant_id: string; qty: number }[];
  }) => request<any>('/storefront/orders', { method: 'POST', body: JSON.stringify(dto) }),

  getPublicOrder: (orderId: string) => request<any>(`/storefront/orders/${orderId}`),

  getPageContent: () =>
    request<{ shop: any; content: Record<string, string> }>('/storefront/page-content'),

  // Merchant-authored CMS page (About/Contact/Privacy/Terms/Refund are seeded
  // by default; custom slugs created in the merchant dashboard also resolve here)
  getPage: (slug: string) => request<any>(`/storefront/pages/${slug}`),

  getCollections: () => request<any[]>('/storefront/collections'),

  getCollection: (slug: string, params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any>(`/storefront/collections/${slug}${query ? `?${query}` : ''}`);
  },

  submitContact: (data: { name: string; email: string; subject?: string; message: string }) =>
    request<{ success: boolean; message: string }>('/storefront/contact', {
      method: 'POST', body: JSON.stringify(data),
    }),

  submitTenantRequest: (data: {
    name: string; slug: string; ownerName: string; ownerEmail: string; phone?: string; category?: string;
  }) => request<any>('/storefront/requests', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Customer APIs (requires customer JWT) ────────────────────────────────────
export const customerApi = {
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    request<{ customer: any; token: string }>('/customer/register', {
      method: 'POST', body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ customer: any; token: string }>('/customer/login', {
      method: 'POST', body: JSON.stringify(data),
    }),

  getMe: (token: string) =>
    request<any>('/customer/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateMe: (data: {
    name?: string; phone?: string; avatar_url?: string;
    current_password?: string; new_password?: string;
  }, token: string) =>
    request<any>('/customer/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getMyOrders: (token: string) =>
    request<any[]>('/customer/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Static page text content (About, Privacy, Terms) — read-only for storefront
  getPages: () =>
    request<{ shop: any; content: Record<string, string> }>('/storefront/page-content'),

  submitContact: (data: { name: string; email: string; subject?: string; message: string }) =>
    request<{ success: boolean; message: string }>('/storefront/contact', {
      method: 'POST', body: JSON.stringify(data),
    }),
};

// ─── Payment APIs ─────────────────────────────────────────────────────────────
export const paymentApi = {
  getPaymentGateways: () => request<any[]>('/payments/gateways'),

  createRazorpayOrder: (data: { amount: number; currency?: string; receiptId: string }) =>
    request<any>('/payments/razorpay/order', { method: 'POST', body: JSON.stringify(data) }),

  initializeRazorpayPayment: (orderId: string) =>
    request<any>(`/payments/razorpay/initialize/${orderId}`, { method: 'POST' }),

  verifyPayment: (data: {
    orderId: string; razorpay_payment_id: string;
    razorpay_order_id: string; razorpay_signature: string;
  }) => request<any>('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),

  simulatePayment: (orderId: string) =>
    request<any>(`/payments/razorpay/simulate/${orderId}`, { method: 'POST' }),
};

// ─── Backwards-compatible aliases (used by existing page components) ──────────
// Remove these once page components are updated to use named exports above.

/** @deprecated use storefrontApi */
export const catalogApi = {
  getHomepage: storefrontApi.getHomepage,
  getProducts: storefrontApi.getProducts,
  getProduct: storefrontApi.getProduct,
  getCategories: storefrontApi.getCategories,
  getBrands: storefrontApi.getBrands,
  placeOrder: storefrontApi.placeOrder,
  getPublicOrder: storefrontApi.getPublicOrder,
  submitTenantRequest: storefrontApi.submitTenantRequest,
  // These were mistakenly in storefront client — they belong to merchant-dashboard
  createProduct: () => { throw new Error('createProduct must be called from merchant-dashboard'); },
  createBanner: () => { throw new Error('createBanner must be called from merchant-dashboard'); },
  createSection: () => { throw new Error('createSection must be called from merchant-dashboard'); },
};
