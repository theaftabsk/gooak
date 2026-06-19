export const getCurrencySymbol = (currency?: string): string => {
  const c = currency || (typeof window !== 'undefined' ? localStorage.getItem('oaksol_shop_currency') : '') || 'INR';
  switch (c.toUpperCase()) {
    case 'BDT': return '৳';
    case 'USD': return '$';
    case 'INR': return '₹';
    default: return c;
  }
};

export const formatPrice = (price: any, currency?: string): string => {
  const num = Number(price) || 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toFixed(2)}`;
};
