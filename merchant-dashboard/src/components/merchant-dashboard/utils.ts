export type MerchantTab = 'overview' | 'products' | 'categories' | 'orders' | 'inventory' | 'payments' | 'settings' | 'pages';

export function formatINR(val: any) {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
}
