import React from 'react';
import { PaymentGateway } from '../types';

interface StatusBadgeProps {
  gateway: PaymentGateway;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ gateway }) => {
  const isConfigured = (): boolean => {
    if (gateway.slug === 'cod') return true;
    
    if (gateway.slug === 'razorpay') {
      const keyId = gateway.config?.key_id || '';
      const secret = gateway.config?.key_secret || '';
      return !!keyId && !!secret && !keyId.includes('placeholder') && !secret.includes('placeholder');
    }
    
    if (gateway.slug === 'phonepe') {
      const merchantId = gateway.config?.merchant_id || '';
      const saltKey = gateway.config?.salt_key || '';
      return !!merchantId && !!saltKey;
    }
    
    return true;
  };

  if (!isConfigured()) {
    return <span className="pay-badge locked">🟡 Config Required</span>;
  }

  if (gateway.is_active) {
    return <span className="pay-badge active">🟢 Active</span>;
  }

  return <span className="pay-badge inactive">🔴 Inactive</span>;
};
