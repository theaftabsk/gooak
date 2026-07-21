import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '@oaksol/api-client';
import { PaymentGateway } from '../types';

export function usePaymentGateway() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadGateways = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentApi.getMerchantGateways();
      setGateways(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load gateways:', err);
      setError(err.message || 'Failed to fetch payment methods.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  const toggleGateway = async (gateway: PaymentGateway) => {
    const action = gateway.is_active ? 'Disable' : 'Enable';
    const message = gateway.is_active
      ? `Disable ${gateway.name}?\n\nCustomers won't be able to pay using ${gateway.name} during checkout.`
      : `Enable ${gateway.name}?`;

    if (!confirm(message)) {
      return;
    }

    setTogglingId(gateway.id);
    try {
      await paymentApi.updateGateway(gateway.id, { is_active: !gateway.is_active });
      setGateways(prev =>
        prev.map(g => (g.id === gateway.id ? { ...g, is_active: !g.is_active } : g))
      );
    } catch (err: any) {
      alert(err.message || `Failed to ${action.toLowerCase()} gateway.`);
    } finally {
      setTogglingId(null);
    }
  };

  const saveConfig = async (id: string, config: Record<string, any>) => {
    try {
      await paymentApi.updateGateway(id, { config });
      setGateways(prev =>
        prev.map(g => (g.id === id ? { ...g, config: { ...g.config, ...config } } : g))
      );
      return true;
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration.');
      return false;
    }
  };

  return {
    gateways,
    loading,
    error,
    togglingId,
    refetch: loadGateways,
    toggleGateway,
    saveConfig,
  };
}
