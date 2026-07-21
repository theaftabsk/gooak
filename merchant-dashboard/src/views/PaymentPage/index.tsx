import React, { useState } from 'react';
import { usePaymentGateway } from './hooks/usePaymentGateway';
import { ActiveView } from './types';
import { PaymentStyles } from './PaymentStyles';
import { LoadingSpinner } from '@/components/ui/Shared';
import { GatewayList } from './components/GatewayList';
import { CodConfig } from './components/CodConfig';
import { RazorpayConfig } from './components/RazorpayConfig';
import { PhonePeConfig } from './components/PhonePeConfig';

export const PaymentPage: React.FC = () => {
  const {
    gateways,
    loading,
    error,
    togglingId,
    toggleGateway,
    saveConfig,
  } = usePaymentGateway();

  const [activeView, setActiveView] = useState<ActiveView>('list');

  const getGatewayBySlug = (slug: string) => {
    return gateways.find(g => g.slug === slug);
  };

  const cod = getGatewayBySlug('cod');
  const rzp = getGatewayBySlug('razorpay');
  const phonepe = getGatewayBySlug('phonepe');

  if (loading) {
    return (
      <div className="pay-page">
        <PaymentStyles />
        <LoadingSpinner message="Fetching payment configurations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pay-page">
        <PaymentStyles />
        <div style={{ padding: 20, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B' }}>
          <h4>Error Loading Gateways</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Future-proof configurations routing using switch map
  const renderActiveConfig = () => {
    switch (activeView) {
      case 'cod':
        if (!cod) return null;
        return (
          <CodConfig
            gateway={cod}
            onBack={() => setActiveView('list')}
            onToggleStatus={toggleGateway}
            togglingId={togglingId}
          />
        );
      case 'razorpay':
        if (!rzp) return null;
        return (
          <RazorpayConfig
            gateway={rzp}
            onBack={() => setActiveView('list')}
            onSaveConfig={saveConfig}
            onToggleStatus={toggleGateway}
            togglingId={togglingId}
          />
        );
      case 'phonepe':
        if (!phonepe) return null;
        return (
          <PhonePeConfig
            gateway={phonepe}
            onBack={() => setActiveView('list')}
            onSaveConfig={saveConfig}
            onToggleStatus={toggleGateway}
            togglingId={togglingId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="pay-page">
      <PaymentStyles />
      {activeView === 'list' ? (
        <GatewayList gateways={gateways} onSelect={setActiveView} />
      ) : (
        renderActiveConfig()
      )}
    </div>
  );
};
