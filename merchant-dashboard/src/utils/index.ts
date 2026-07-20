export type MerchantTab = 
  | 'overview' 
  | 'products' 
  | 'categories' 
  | 'inventory' 
  | 'orders' 
  | 'returns' 
  | 'invoices' 
  | 'customers' 
  | 'reviews' 
  | 'discounts' 
  | 'email' 
  | 'whatsapp' 
  | 'seo' 
  | 'pages' 
  | 'banners' 
  | 'blog' 
  | 'media' 
  | 'faq'
  | 'testimonials'
  | 'home-sections'
  | 'analytics' 
  | 'settings' 
  | 'team' 
  | 'apps' 
  | 'payments';

export function formatINR(val: any) {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
}
