export const validateRazorpay = (keyId: string, keySecret: string): string | null => {
  if (!keyId.trim()) return 'Key ID is required.';
  if (!keySecret.trim()) return 'Key Secret is required.';
  if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
    return 'Please replace placeholder keys with your actual API keys.';
  }
  return null;
};

export const validatePhonePe = (
  merchantId: string,
  saltKey: string,
  saltIndex: string
): string | null => {
  if (!merchantId.trim()) return 'Merchant ID is required.';
  if (!saltKey.trim()) return 'Salt Key is required.';
  if (!saltIndex.trim()) return 'Salt Index is required.';
  
  const numIndex = Number(saltIndex);
  if (isNaN(numIndex) || !Number.isInteger(numIndex) || numIndex <= 0) {
    return 'Salt Index must be a valid positive integer (number only, greater than 0).';
  }
  return null;
};
